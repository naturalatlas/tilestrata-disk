# tilestrata-disk
[![NPM version](http://img.shields.io/npm/v/tilestrata-disk.svg?style=flat)](https://www.npmjs.org/package/tilestrata-disk)
[![Build Status](http://img.shields.io/travis/naturalatlas/tilestrata-disk/master.svg?style=flat)](https://travis-ci.org/naturalatlas/tilestrata-disk)
[![Coverage Status](http://img.shields.io/coveralls/naturalatlas/tilestrata-disk/master.svg?style=flat)](https://coveralls.io/r/naturalatlas/tilestrata-disk)

A [TileStrata](https://github.com/naturalatlas/tilestrata) plugin for storing / retrieving tiles from disk. When using this plugin, make **sure** to use different directories for each layer (e.g. "tiles/layer_a", "tiles/layer_b").

```sh
$ npm install tilestrata-disk --save
```

### Sample Usage

```js
var disk = require('tilestrata-disk');

server.registerLayer(function(layer) {
    layer.setName('mylayer');
    layer.registerRoute('tile.png', function(handler) {
        layer.registerCache(disk({dir: './tiles/mylayer'}));
        layer.registerProvider(...);
    });
});
```

## Contributing

Before submitting pull requests, please update the [tests](test) and make sure they all pass.

```sh
$ npm test
```

## License

Copyright &copy; 2014 [Brian Reavis](https://github.com/brianreavis) & [Contributors](https://github.com/naturalatlas/tilestrata-disk/graphs/contributors)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at: http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
