var TileServer = require('tilestrata').TileServer;
var TileRequest = require('tilestrata').TileRequest;
var disk = require('../index.js');
var assert = require('chai').assert;
var path = require('path');
var fs = require('fs');

describe('Cache Implementation "disk"', function() {
	it('should throw if "refreshage" given without "maxage"', function() {
		assert.throws(function() {
			disk.cache({dir: __dirname, refreshage: 1});
		}, '"refreshage" param must be used in conjunction with "maxage"');
	});
	describe('init', function() {
		it('should create parent folder', function(done) {
			var server = new TileServer();
			var dir = path.resolve(__dirname, './.tmp/fs' + String(Math.random()).substring(2)) + '/folder';
			var cache = disk.cache({dir: dir});
			cache.init(server, function(err) {
				if (err) throw err;
				assert.isTrue(fs.existsSync(dir));
				done();
			});
		});
	});
	describe('set', function() {
		it('should store file', function(done) {
			var server = new TileServer();
			var req = TileRequest.parse('/layer/3/1/2/tile@2x.png');
			var dir = path.resolve(__dirname, './.tmp/fs' + String(Math.random()).substring(2)) + '/folder';
			var cache = disk.cache({dir: dir});
			cache.init(server, function(err) {
				if (err) throw err;
				cache.set(server, req, new Buffer('contents', 'utf8'), {}, function(err) {
					if (err) throw err;
					assert.equal(fs.readFileSync(dir + '/3/1/2/tile@2x.png', 'utf8'), 'contents');
					done();
				});
			});
		});
	});
	describe('get', function() {
		it('should retrieve file', function(done) {
			var server = new TileServer();
			var req = TileRequest.parse('/layer/3/2/1/tile.txt');
			var dir = __dirname + '/fixtures/sample';
			var cache = disk.cache({dir: dir});
			cache.init(server, function(err) {
				if (err) throw err;
				cache.get(server, req, function(err, buffer, headers) {
					if (err) throw err;
					assert.instanceOf(buffer, Buffer);
					assert.equal(buffer.toString('utf8'), 'Hello World');
					assert.deepEqual(headers, {
						'Content-Type': 'text/plain; charset=UTF-8'
					});
					done();
				});
			});
		});
		it('should not return file if older than maxage', function(done) {
			var file = __dirname + '/fixtures/sample/3/2/1/tile.json';
			var ftime = new Date(Date.now()-3600*1000);
			fs.utimesSync(file, ftime, ftime);

			var server = new TileServer();
			var req = TileRequest.parse('/layer/3/2/1/tile.json');
			var dir = __dirname + '/fixtures/sample';
			var cache = disk.cache({dir: dir, maxage: 1800});
			cache.init(server, function(err) {
				if (err) throw err;
				cache.get(server, req, function(err, buffer, headers) {
					if (err) throw err;
					assert.isNull(buffer);
					done();
				});
			});
		});
		it('should return file if permitted by maxage', function(done) {
			var file = __dirname + '/fixtures/sample/3/2/1/tile.json';
			var ftime = new Date(Date.now()-3600*1000);
			fs.utimesSync(file, ftime, ftime);

			var server = new TileServer();
			var req = TileRequest.parse('/layer/3/2/1/tile.json');
			var dir = __dirname + '/fixtures/sample';
			var cache = disk.cache({dir: dir, maxage: 6000});
			cache.init(server, function(err) {
				if (err) throw err;
				cache.get(server, req, function(err, buffer, headers) {
					if (err) throw err;
					assert.instanceOf(buffer, Buffer);
					done();
				});
			});
		});
		it('should allow maxage to be a function (truthy result)', function(done) {
			var file = __dirname + '/fixtures/sample/3/2/1/tile.json';
			var ftime = new Date(Date.now()-3600*1000);
			fs.utimesSync(file, ftime, ftime);
			var fcalled = false;

			var server = new TileServer();
			var req = TileRequest.parse('/layer/3/2/1/tile.json');
			var dir = __dirname + '/fixtures/sample';
			var cache = disk.cache({dir: dir, maxage: function(server, tile) {
				fcalled = true;
				assert.instanceOf(server, TileServer);
				assert.instanceOf(tile, TileRequest);
				return 6000;
			}});
			cache.init(server, function(err) {
				if (err) throw err;
				cache.get(server, req, function(err, buffer, headers) {
					if (err) throw err;
					assert.instanceOf(buffer, Buffer);
					assert.isTrue(fcalled, 'function called');
					done();
				});
			});
		});
		it('should skip get() if maxage = 0', function(done) {
			var server = new TileServer();
			var req = TileRequest.parse('/layer/3/2/1/tile.json');
			var dir = __dirname + '/fixtures/sample';
			var cache = disk.cache({dir: dir, maxage: 0});
			cache.init(server, function(err) {
				if (err) throw err;
				cache.get(server, req, function(err, buffer, headers) {
					if (err) throw err;
					assert.isNull(buffer);
					done();
				});
			});
		});
		it('should skip set() if maxage = 0', function(done) {
			var file = __dirname + '/fixtures/sample/3/2/1/tile.json';

			var server = new TileServer();
			var req = TileRequest.parse('/layer/3/2/1/tile.json');
			var dir = __dirname + '/fixtures/sample';
			var cache = disk.cache({dir: dir, maxage: 0});
			cache.init(server, function(err) {
				if (err) throw err;
				cache.set(server, req, new Buffer('TEST'), {}, function(err) {
					if (err) throw err;
					assert.equal(fs.readFileSync(file, 'utf8').trim(), '{}');
					done();
				});
			});
		});
		it('should allow maxage to be a function (falsy result)', function(done) {
			var file = __dirname + '/fixtures/sample/3/2/1/tile.json';
			var ftime = new Date(Date.now()-3600*1000);
			fs.utimesSync(file, ftime, ftime);
			var fcalled = false;

			var server = new TileServer();
			var req = TileRequest.parse('/layer/3/2/1/tile.json');
			var dir = __dirname + '/fixtures/sample';
			var cache = disk.cache({dir: dir, maxage: function(server, tile) {
				fcalled = true;
				assert.instanceOf(server, TileServer);
				assert.instanceOf(tile, TileRequest);
				return 1800;
			}});
			cache.init(server, function(err) {
				if (err) throw err;
				cache.get(server, req, function(err, buffer, headers) {
					if (err) throw err;
					assert.isNull(buffer);
					assert.isTrue(fcalled, 'function called');
					done();
				});
			});
		});
		it('should have charset declared for JSON', function(done) {
			// https://github.com/naturalatlas/tilestrata-mapnik/issues/3
			var server = new TileServer();
			var req = TileRequest.parse('/layer/3/2/1/tile.json');
			var dir = __dirname + '/fixtures/sample';
			var cache = disk.cache({dir: dir});
			cache.init(server, function(err) {
				if (err) throw err;
				cache.get(server, req, function(err, buffer, headers) {
					if (err) throw err;
					assert.instanceOf(buffer, Buffer);
					assert.equal(buffer.toString('utf8'), '{}\n');
					assert.deepEqual(headers, {
						'Content-Type': 'application/json; charset=UTF-8'
					});
					done();
				});
			});
		});
		it('should have "application/x-protobuf" Content-Type for vector tiles', function(done) {
			// https://github.com/naturalatlas/tilestrata-mapnik/issues/3
			var server = new TileServer();
			var req = TileRequest.parse('/layer/3/2/1/tile.pbf');
			var dir = __dirname + '/fixtures/sample';
			var cache = disk.cache({dir: dir});
			cache.init(server, function(err) {
				if (err) throw err;
				cache.get(server, req, function(err, buffer, headers) {
					if (err) throw err;
					assert.instanceOf(buffer, Buffer);
					assert.deepEqual(headers, {
						'Content-Type': 'application/x-protobuf'
					});
					done();
				});
			});
		});
		it('should return true to "refresh" param on callback if age > refreshage', function(done) {
			var file = __dirname + '/fixtures/sample/3/2/1/tile.json';
			var ftime = new Date(Date.now()-3600*1000);
			fs.utimesSync(file, ftime, ftime);

			var server = new TileServer();
			var req = TileRequest.parse('/layer/3/2/1/tile.json');
			var dir = __dirname + '/fixtures/sample';
			var cache = disk.cache({dir: dir, refreshage: 1800, maxage: 3600*5});
			cache.init(server, function(err) {
				if (err) throw err;
				cache.get(server, req, function(err, buffer, headers, refresh) {
					if (err) throw err;
					assert.isTrue(refresh, '"refresh" arg');
					assert.instanceOf(buffer, Buffer);
					assert.equal(buffer.toString('utf8'), '{}\n');
					assert.deepEqual(headers, {
						'Content-Type': 'application/json; charset=UTF-8'
					});
					done();
				});
			});
		});
	});
	it('should allow "path" template string', function(done) {
		var server = new TileServer();
		var dir = path.resolve(__dirname, './.tmp/fs' + String(Math.random()).substring(2));
		var cache = disk.cache({path: dir + '/{layer}-{x}-{y}-{z}-{filename}'});
		var req = TileRequest.parse('/mylayer/3/2/1/tile.txt');

		var payload = new Buffer('hello', 'utf8');

		cache.init(server, function(err) {
			if (err) throw err;
			cache.get(server, req, function(err, buffer, headers) {
				if (err) throw err;
				cache.set(server, req, payload, {}, function(err) {
					if (err) throw err;
					var content = fs.readFileSync(dir + '/mylayer-2-1-3-tile.txt', 'utf8');
					assert.equal(content, 'hello');
					cache.get(server, req, function(err, buffer, headers) {
						if (err) throw err;
						assert.equal(buffer.toString('utf8'), 'hello');
						done();
					});
				});
			});
		});
	});
	it('should allow "path" callback', function(done) {		var server = new TileServer();
		var dir = path.resolve(__dirname, './.tmp/fs' + String(Math.random()).substring(2));
		var cache = disk.cache({path: function(req) {
			return dir + '/' + [req.layer, req.x, req.y, req.z, req.filename].join('-');
		}});
		var req = TileRequest.parse('/mylayer/3/2/1/tile.txt');
		var payload = new Buffer('hello', 'utf8');

		cache.init(server, function(err) {
			if (err) throw err;
			cache.get(server, req, function(err, buffer, headers) {
				if (err) throw err;
				cache.set(server, req, payload, {}, function(err) {
					if (err) throw err;
					var content = fs.readFileSync(dir + '/mylayer-2-1-3-tile.txt', 'utf8');
					assert.equal(content, 'hello');
					cache.get(server, req, function(err, buffer, headers) {
						if (err) throw err;
						assert.equal(buffer.toString('utf8'), 'hello');
						done();
					});
				});
			});
		});
	});
});
