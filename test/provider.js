var TileServer = require('tilestrata').TileServer;
var TileRequest = require('tilestrata').TileRequest;
var disk = require('../index.js');
var assert = require('chai').assert;
var path = require('path');
var fs = require('fs');

describe('Provider Implementation "disk"', function() {
	describe('serve', function() {
		it('should serve file if exists', function(done) {
			var server = new TileServer();
			var provider = disk.provider(__dirname + '/fixtures/sample/{z}/{x}/{y}/tile.txt');
			var req = TileRequest.parse('/basemap/3/2/1/tile.txt', {'x-tilestrata-skipcache':'1','x-random':'1'}, 'HEAD');
			provider.serve(server, req, function(err, buffer, headers) {
				if (err) throw err;
				assert.equal(buffer.toString('utf8'), 'Hello World');
				assert.deepEqual(headers, {'Content-Type': 'text/plain; charset=UTF-8'});
				done();
			});
		});
		it('should return 404 if it doesn\'t exist', function(done) {
			var server = new TileServer();
			var provider = disk.provider(__dirname + '/sample-doesnotexist/{z}/{x}/{y}/tile.txt');
			var req = TileRequest.parse('/basemap/3/2/1/tile.txt', {'x-tilestrata-skipcache':'1','x-random':'1'}, 'HEAD');
			provider.serve(server, req, function(err, buffer, headers) {
				assert.instanceOf(err, Error);
				assert.equal(err.statusCode, 404);
				assert.equal(err.message, 'File not found');
				done();
			});
		});
	});
});
