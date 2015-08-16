var mime = require('mime');

mime.define({
	'application/x-protobuf': ['pbf','vtile']
});

module.exports = function(file) {
	var mimeType = mime.lookup(file);
	if (mimeType.substring(0,5) === 'text/' || mimeType === 'application/json') {
		mimeType += '; charset=UTF-8';
	}
	return mimeType;
};