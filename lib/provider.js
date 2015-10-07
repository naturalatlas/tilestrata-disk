var fs = require('fs-extra');
var mime = require('./mime.js');

module.exports = function(template) {
	return {
		name: 'disk',
		serve: function(server, tile, callback) {
			var file = template
				.replace('{layer}', tile.layer)
				.replace('{filename}', tile.filename)
				.replace('{x}', tile.x)
				.replace('{y}', tile.y)
				.replace('{z}', tile.z);

			fs.readFile(file, function(err, buffer) {
				if (err) {
					if (err.code === 'ENOENT') {
						var err = new Error('File not found');
						err.statusCode = 404;
						return callback(err);
					}
					return callback(err);
				}
				callback(null, buffer, {'Content-Type': mime(file)});
			});
		}
	};
};
