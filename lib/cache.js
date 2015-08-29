var fs = require('fs-extra');
var mime = require('./mime.js');

function FileSystemCache(options) {
	this.options = options || {};
	if (this.options.refreshage && !this.options.maxage) {
		throw new Error('"refreshage" param must be used in conjunction with "maxage"');
	}
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

FileSystemCache.prototype.ageTolerance = function(key, tile) {
	var age = this.options[key];
	if (typeof age === 'function') {
		return age(this.server, tile)*1000;
	}
	return age*1000;
};

FileSystemCache.prototype.shouldServe = function(mtime, tile) {
	// should the tile be served from disk?
	var maxage = this.ageTolerance('maxage', tile);
	if (isNaN(maxage)) return true;
 	return Date.now() - mtime < maxage;
};

FileSystemCache.prototype.shouldRefresh = function(mtime, tile) {
	// should the tile be rebuilt in the background?
	var refreshage = this.ageTolerance('refreshage', tile);
	if (isNaN(refreshage)) return false;
	return Date.now() - mtime > refreshage;
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
	var done = function(err, buffer, headers, refresh) {
		if (_fd) {
			return fs.close(_fd, function() { callback(err, buffer||null, headers, refresh); });
		}
		return callback(err, buffer||null, headers, refresh);
	};

	var self = this;
	var maxage = this.options.maxage;
	var file = this._file(req);
	fs.open(file, 'r', function(err, fd) {
		if (err) return callback(err);
		_fd = fd;
		fs.fstat(fd, function(err, stats) {
			if (err) return done(err);

			var mtime = stats.mtime.getTime();
			var shouldServe = self.shouldServe(mtime, req);
			if (!shouldServe) return done();
			var shouldRefresh = self.shouldRefresh(mtime, req);

			var buffer = new Buffer(stats.size);
			if (!stats.size) {
				return done(null, buffer, {
					'Content-Type': mime(file)
				}, shouldRefresh);
			}

			fs.read(fd, buffer, 0, stats.size, 0, function(err) {
				if (err) return done(err);
				done(null, buffer, {
					'Content-Type': mime(file)
				}, shouldRefresh);
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
	var maxage = this.ageTolerance('maxage', req);
	if (maxage === 0) return callback();
	fs.outputFile(this._file(req), buffer, callback);
};

module.exports = function(options) {
	return new FileSystemCache(options);
};
