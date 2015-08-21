var fs = require('fs-extra');
var mime = require('./mime.js');

function FileSystemCache(options) {
	this.options = options || {};
};

FileSystemCache.prototype._dir = function(x, y, z) {
	return this.options.dir + '/' + z + '/' + x + '/' + y;
};

FileSystemCache.prototype._file = function(req) {
	return this._dir(req.x, req.y, req.z) + '/' + req.filename;
};

FileSystemCache.prototype.init = function(server, callback) {
	this.server = server;
	fs.ensureDir(this.options.dir, callback);
};

FileSystemCache.prototype.maxage = function(tile) {
	var maxage = this.options.maxage;
	if (typeof maxage === 'function') {
		return maxage(this.server, tile);
	}
	return maxage;
};

FileSystemCache.prototype.fresh = function(stats, tile) {
	var maxage = this.maxage(tile) * 1000;
	if (Date.now() - stats.mtime.getTime() > maxage) return false;
	return true;
};

/**
 * Retrieves a tile from the filesystem.
 *
 * @param {TileServer} server
 * @param {TileRequest} req
 * @param {function} callback(err, buffer, headers)
 * @return {void}
 */
FileSystemCache.prototype.get = function(server, req, callback) {
	var _fd;
	var done = function(err, buffer, headers) {
		if (_fd) {
			return fs.close(_fd, function() { callback(err, buffer||null, headers); });
		}
		return callback(err, buffer||null, headers);
	};

	var self = this;
	var maxage = this.options.maxage;
	var file = this._file(req);
	fs.open(file, 'r', function(err, fd) {
		if (err) return callback(err);
		_fd = fd;
		fs.fstat(fd, function(err, stats) {
			if (err) return done(err);
			var fresh = self.fresh(stats, req);
			if (!fresh) return done();

			var buffer = new Buffer(stats.size);
			if (!stats.size) {
				return done(null, buffer, {
					'Content-Type': mime(file)
				});
			}

			fs.read(fd, buffer, 0, stats.size, 0, function(err) {
				if (err) return done(err);
				done(null, buffer, {
					'Content-Type': mime(file)
				});
			});
		});
	});
};

/**
 * Stores a tile on the filesystem.
 *
 * @param {TileServer} server
 * @param {TileRequest} req
 * @param {Buffer} buffer
 * @param {object} headers
 * @param {Function} callback
 */
FileSystemCache.prototype.set = function(server, req, buffer, headers, callback) {
	var maxage = this.maxage(req);
	if (maxage === 0) return callback();
	fs.outputFile(this._file(req), buffer, callback);
};

module.exports = function(options) {
	return new FileSystemCache(options);
};
