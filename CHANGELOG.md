# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [3.2.3](https://github.com/gzaripov/flyback/compare/v3.2.2...v3.2.3) (2019-10-04)


### Features

* remove recursive tape loading ([e77470c](https://github.com/gzaripov/flyback/commit/e77470c))



### [3.2.2](https://github.com/gzaripov/flyback/compare/v3.1.1...v3.2.2) (2019-09-09)


### Bug Fixes

* provide checkHeaders option to headers in request ([3a934a4](https://github.com/gzaripov/flyback/commit/3a934a4))


### Features

* implement checkHeaders option ([6191b03](https://github.com/gzaripov/flyback/commit/6191b03))



### [3.2.1](https://github.com/gzaripov/flyback/compare/v3.1.1...v3.2.1) (2019-09-06)


### Features

* implement checkHeaders option ([6191b03](https://github.com/gzaripov/flyback/commit/6191b03))



### [3.1.1](https://github.com/gzaripov/flyback/compare/v3.1.0...v3.1.1) (2019-08-31)


### Bug Fixes

* remove outdated name tapeExtenstion, use tapeFileExtension ([3c9218d](https://github.com/gzaripov/flyback/commit/3c9218d))



## [3.1.0](https://github.com/gzaripov/flyback/compare/v3.0.0...v3.1.0) (2019-07-14)



## 3.0.0 (2019-06-10)


### Bug Fixes

* dont rely on impl detail in server.spec ([7af25da](https://github.com/gzaripov/flyback/commit/7af25da))
* encode decoded response body when tape is created from tape ([721ec63](https://github.com/gzaripov/flyback/commit/721ec63))
* move Body to index file to fix build errors ([404b233](https://github.com/gzaripov/flyback/commit/404b233))


### Features

* add 'proxy' record mode, it just proxies request ([08ab10c](https://github.com/gzaripov/flyback/commit/08ab10c))
* add ignore all headers and tape path generator params ([3da8a4a](https://github.com/gzaripov/flyback/commit/3da8a4a))
* add query object to tape ([ebb31b6](https://github.com/gzaripov/flyback/commit/ebb31b6))
* add record modes constant ([6212c72](https://github.com/gzaripov/flyback/commit/6212c72))
* add runtime helpers to babel ([352ad5e](https://github.com/gzaripov/flyback/commit/352ad5e))
* add tape file entity ([87ef412](https://github.com/gzaripov/flyback/commit/87ef412))
* add tapeExtension option ([54cdb22](https://github.com/gzaripov/flyback/commit/54cdb22))
* add test for dymamic folder ([7a4e674](https://github.com/gzaripov/flyback/commit/7a4e674))
* add tests for url and header ([ae578b7](https://github.com/gzaripov/flyback/commit/ae578b7))
* change silent option to verbase and make default false ([f3e1aac](https://github.com/gzaripov/flyback/commit/f3e1aac))
* create new http classess ([9844966](https://github.com/gzaripov/flyback/commit/9844966))
* fix test for tapes-store ([b5a39c8](https://github.com/gzaripov/flyback/commit/b5a39c8))
* handle unknown encodings ([958b837](https://github.com/gzaripov/flyback/commit/958b837))
* implement body decoding ([d46d073](https://github.com/gzaripov/flyback/commit/d46d073))
* implement new tape statistics ([7dc6a65](https://github.com/gzaripov/flyback/commit/7dc6a65))
* implement primary flyback entities ([b794f32](https://github.com/gzaripov/flyback/commit/b794f32))
* increase unit test coverage to 100% ([bc45276](https://github.com/gzaripov/flyback/commit/bc45276))
* make serialized header value be array only if there more than two elements in array ([adac7f3](https://github.com/gzaripov/flyback/commit/adac7f3))
* refactor e2e tests to work with multiple spec files ([0160295](https://github.com/gzaripov/flyback/commit/0160295))
* remove empty body from tape json ([894f384](https://github.com/gzaripov/flyback/commit/894f384))
* rewrite flyback on typescript ([754667c](https://github.com/gzaripov/flyback/commit/754667c))
* rewrite logic from tape matcher and renderer to http classess ([5054cf6](https://github.com/gzaripov/flyback/commit/5054cf6))
* update docs ([4085fc4](https://github.com/gzaripov/flyback/commit/4085fc4))
* update tests, add build configuration ([a377035](https://github.com/gzaripov/flyback/commit/a377035))
* write e2e tests for tape grouping ([55d01f0](https://github.com/gzaripov/flyback/commit/55d01f0))
* write test for tape store manager ([2d369f0](https://github.com/gzaripov/flyback/commit/2d369f0))
* write tests for body encoding ([1a32690](https://github.com/gzaripov/flyback/commit/1a32690))
* write tests for create-request ([27f3abf](https://github.com/gzaripov/flyback/commit/27f3abf))
* write tests for media-format ([47db4fa](https://github.com/gzaripov/flyback/commit/47db4fa))
* write tests for middleware ([1445182](https://github.com/gzaripov/flyback/commit/1445182))
* write tests for proxy and dynamic record modes ([e8170a0](https://github.com/gzaripov/flyback/commit/e8170a0))
* write tests for request handler ([7b90a9f](https://github.com/gzaripov/flyback/commit/7b90a9f))
* write tests for request handler ([0901a18](https://github.com/gzaripov/flyback/commit/0901a18))
* write tests for tape.ts ([3133026](https://github.com/gzaripov/flyback/commit/3133026))



# [2.1.0](https://github.com/ijpiantanida/talkback/compare/v2.0.0...v2.1.0) (2019-05-14)


### Features

* add 'proxy' record mode, it just proxies request ([aaefcbb](https://github.com/ijpiantanida/talkback/commit/aaefcbb))



# 2.0.0 (2019-05-04)


### Features

* add posibillity to set talkback url ([1945934](https://github.com/ijpiantanida/talkback/commit/1945934))
* add runtime helpers to babel ([fa05d43](https://github.com/ijpiantanida/talkback/commit/fa05d43))
* add tapeExtension option ([4cce7b9](https://github.com/ijpiantanida/talkback/commit/4cce7b9))
* implement multiple stores ([b6f09fe](https://github.com/ijpiantanida/talkback/commit/b6f09fe))
* implement tests, add build configuration ([14af5e2](https://github.com/ijpiantanida/talkback/commit/14af5e2))
* increase unit test coverage to 100% ([aef4d37](https://github.com/ijpiantanida/talkback/commit/aef4d37))
* make serialized header value be array only if there more than two elements in array ([38530f2](https://github.com/ijpiantanida/talkback/commit/38530f2))
* write tests for request handler ([06f133c](https://github.com/ijpiantanida/talkback/commit/06f133c))



# 2.0.0 (2019-04-28)

* rewrite flyback on typescript

# 1.0.0 (2019-04-25)

### Features

* add posibillity to set flyback url
* add runtime helpers to babel
* add tapeExtension option
* implement multiple stores 
* implement tests, add build configuration 
* increase unit test coverage to 100% 
* make serialized header value be array only if there more than two elements in array 
* write tests for request handler 
