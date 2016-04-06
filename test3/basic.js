var assert = require('assert');
var Moduler = require('../index').Moduler;
var Runner = require('../index').Runner;
var Promise = require('../index').Promise;

describe('basic', function () {


    it('one module -> a+b', function (done) {
        var ModuleA = new Moduler('ModuleA', 'a')
            .factory('a', function () {
                return 5;
            })
            .factory('b', function () {
                return 3;
            })
            .factory('ab', ['a', 'b',
                function (a, b) {
                    return a + b;
                }
            ])
            .run([
                'a', function (ab) {
                    assert.equal(ab, 8);
                    setTimeout(done, 10);
                }]);


        new Runner(ModuleA);
    });

    it('two module -> a+b', function (done) {
        var s = 10;
        var ModuleB = new Moduler('ModuleB', 'b')
            .factory('init', function () {
                s = 15;
            })
            .factory('a', function () {
                return s;
            });

        var ModuleA = new Moduler('ModuleA', 'a')
            .include(ModuleB)
            .include(ModuleB)
            .include(ModuleB)
            .factory('a', function () {
                return 5;
            })

            .run(['b$init', function (a, b$a) {
                assert.equal(20, a + b$a);
                setTimeout(done, 10);
            }]);


        new Runner(ModuleA);
    });


    it('event test', function (done) {
        var c = 0, k = 0;
        var ModuleA = new Moduler('Ma')
                .factory('a1', [
                    function () {
                        return 8;
                    }
                ])
                .on('postInit', function () {
                    k = 20;
                })

                .on('preRun', function () {
                    c = 15 + k
                })

                .run(function () {
                    k = 80;
                })
                .on('postRun', ['a1',
                    function (a1) {
                        assert.equal(a1, 8);
                        assert.equal(c, 35);
                        assert.equal(k, 80);
                        setTimeout(done, 10);
                    }
                ])

            ;


        new Runner(ModuleA);
    });

    it('name test', function (done) {


        var ModuleA = new Moduler('test','$te')
            .factory('a', [
                function ($promise) {
                    return $promise.resolve(17);
                }
            ]);


        var ModuleB = new Moduler('MB')
            .include(ModuleA)
            .run(function ($te$a) {
                assert.equal($te$a, 17);
                done();
            });


        new Runner(ModuleB);


    });

    describe('system module', function () {
        it('$promise', function (done) {


            var ModuleA = new Moduler('Ma')
                .factory('a', [
                    function ($promise) {
                        return $promise.resolve(17);
                    }
                ]);


            var ModuleB = new Moduler('MB')
                .include(ModuleA)
                .run(function (Ma$a) {
                    assert.equal(Ma$a, 17);
                    done();
                });


            new Runner(ModuleB);


        });
        it('$inject', function (done) {


            var ModuleA = new Moduler('Ma')
                .factory('a', [
                    function ($promise) {
                        return $promise.resolve(17);
                    }
                ]);


            var ModuleB = new Moduler('MB')
                .include(ModuleA)
                .run(function ($inject) {
                    assert.equal($inject.get(), 17);
                    done();
                });


            new Runner(ModuleB);


        });
    });


    describe('promise', function () {
        it('run', function (done) {

            var a;

            var ModuleA = new Moduler('MA')
                .run([function () {
                    return new Promise(function (resolve) {
                        setTimeout(function () {
                            a = 1;
                            resolve();
                        }, 1000);
                    });
                }
                ])


            var ModuleB = new Moduler('MB')
                .include(ModuleA)
                .on('postRun', function () {
                    assert.equal(1, a);
                    done();
                });


            new Runner(ModuleB);


        });

        it('emit', function (done) {
            var a;
            var ModuleA = new Moduler('MA')
                .factory('f', function () {
                    return Promise.delay(500)
                        .then(function () {
                            return 3;
                        })
                })
                .run(function (f) {
                    return new Promise(function (resolve) {
                        setTimeout(function () {
                            resolve(f + 10);
                        }, 1000);
                    })
                        .then(function (r) {
                            a = r;
                        })
                });


            var ModuleB = new Moduler('MB')
                .include(ModuleA)
                .on('postRun', ['MA$f',
                    function (MA$f) {
                        assert.equal(3, MA$f);
                        assert.equal(13, a);
                        done();
                    }
                ]);
            new Runner(ModuleB);
        });
    });


});