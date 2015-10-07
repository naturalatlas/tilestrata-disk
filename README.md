# tilestrata-disk
[![NPM version](http://img.shields.io/npm/v/tilestrata-disk.svg?style=flat)](https://www.npmjs.org/package/tilestrata-disk)
[![Build Status](https://travis-ci.org/naturalatlas/tilestrata-disk.svg)](https://travis-ci.org/naturalatlas/tilestrata-disk)
[![Coverage Status](http://img.shields.io/codecov/c/github/naturalatlas/tilestrata-disk/master.svg?style=flat)](https://codecov.io/github/naturalatlas/tilestrata-disk)

A [TileStrata](https://github.com/naturalatlas/tilestrata) plugin for storing / retrieving tiles from disk. It can either act as a cache or as a provider. When using it for caching, make **sure** to use different directories for each layer (e.g. "tiles/layer_a", "tiles/layer_b"). If given a `maxage`, it will check the modification time of a tile and return null if it's too old. If `maxage=0`, caching behavior will be completely disabled.

```sh
$ npm install tilestrata-disk --save
```

### Sample Usage

```js
var disk = require('tilestrata-disk');

// cache: cache tiles to disk
server.layer('mylayer').route('tile.png')
    .use(/* some provider */)
    .use(disk.cache({dir: './tiles/mylayer'}));

// cache: cache with maxage
server.layer('mylayer').route('tile.png')
    .use(/* some provider */)
    .use(disk.cache({maxage: 3600, dir: './tiles/mylayer'}));

// cache: cache with maxage function (advanced)
server.layer('mylayer').route('tile.png')
    .use(/* some provider */)
    .use(disk.cache({
        dir: './tiles/mylayer',
        maxage: function(server, req) {
            if (req.z > 15) return 0; // don't cache
            if (req.z > 13) return 3600;
            return 3600*24;
        }
    }));

// cache: custom directory layout
server.layer('mylayer').route('tile.png')
    .use(/* some provider */)
    .use(disk.cache({path: './tiles/{layer}/{z}/{x}/{y}-{filename}'}));

// cache: custom directory layout (via callback)
server.layer('mylayer').route('tile.png')
    .use(/* some provider */)
    .use(disk.cache({path: function(tile) {
	return './tiles/' + tile.layer + '/' + tile.z + '/' /* ... */
    }}));
```
```js
// provider: serve pre-existing / pre-sliced tiles off disk
server.layer('mylayer').route('tile.png')
    .use(disk.provider('/path/to/dir/{z}/{x}/{y}/file.png'));
```

Some sample values of `maxage` are:

```js
maxage: null  // no age checking: permanent caching (default)
maxage: 0     // disable cache completely (both reading and writing)
maxage: 3600  // one hour
```

### Advanced Behavior

If using TileStrata [0.6.0](https://github.com/naturalatlas/tilestrata/releases/tag/v1.6.0) and above, you can also specify a `refreshage` parameter that indicates how old a tile can be before TileStrata should refresh it. This option should be used in conjunction with `maxage`. The purpose is best illustrated by an example:

```js
.use(disk.cache({
    dir: './tiles/mylayer',
    refreshage: 3600, // 1 hour
    maxage: 3600*24*7 // 1 week
}));
```

With this configuration, if the cache finds a tile that is two days old, it will serve the tile from cache while telling TileStrata to build a new tile in the background for the next person (more info [here](https://github.com/naturalatlas/tilestrata#writing-caches)). Some sample values of `refreshage` are:

```js
refreshage: null  // never refresh (default)
refreshage: 0     // always refresh in background after hits
refreshage: 1800  // half hour
```

## Contributing

Before submitting pull requests, please update the [tests](test) and make sure they all pass.

```sh
$ npm test
```

## License

Copyright &copy; 2014–2015 [Brian Reavis](https://github.com/brianreavis) & [Contributors](https://github.com/naturalatlas/tilestrata-disk/graphs/contributors)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at: http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
