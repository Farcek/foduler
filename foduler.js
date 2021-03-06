var _ = require('lodash');
var Promise = require('bluebird');
var stringFormat = require('string-format');

(function () {
    stringFormat.extend(String.prototype);
})();// init system

function nameChecker(name) {
    if (name.indexOf(':') > -1 || name.indexOf('$') > -1)
        throw  new Error('`{0}` - not supported name. not allowed chars [`:`,`$`]'.format(name));
}

function $$module(name) {
    var $self, $as, $includes = [], $factories = {}, $runs = [], $name = _.trim(name),
        $values = {}, $configs = [], $events = {};

    $self = {
        get $__name() {
            return '$$module';
        },
        get $name() {
            return $name;
        },
        get $container() {
            return $container;
        },
        get $as() {
            return $as || $name;
        },
        get $includes() {
            return $includes;
        },
        get $values() {
            return $values;
        },
        get $configs() {
            return $configs;
        },
        get $factories() {
            return $factories;
        },
        get $runs() {
            return $runs;
        },
        get $events() {
            return $events;
        },

        as: function (as) {

            var check = true;
            if (arguments.length > 1) {
                check = !!arguments[1];
            }

            if (check) {
                nameChecker(name);
            }

            $as = as;
            return $self;
        },
        include: function (module) {
            if (module && module.$__name === '$$module') {
                $includes.push(module);
                return $self;
            }

            throw new Error('module bish bna. ' + module);
        },
        value: function (name, value) {
            $values[name] = value;
            return $self;
        },
        on: function (name, handle) {
            nameChecker(name);

            ($events[name] || ($events[name] = [])).push(handle);

            return $self;
        },
        config: function (handle) {
            $configs.push(handle);
            return $self;
        },

        factory: function (name, handles) {

            nameChecker(name);

            if (name in $factories) {
                throw new Error('already defined');
            }


            $factories[name] = handles;
            return $self;
        },

        run: function (handles) {
            $runs.push(handles);
            return $self;
        }
    };

    return $self;
}

function $$fodule($module, $instance) {

    var $self = {
        get $name() {
            return $module.$name;
        },
        get $as() {
            return $module.$as;
        },
        get $module() {
            return $module;
        },
        $invoke: function (handle) {
            return $instance.$invoke(handle, $self);
        },
        emit: function (name) {
            var items = [];
            var listeners = $module.$events[name] || [];
            _.each(listeners, function (handle) {
                items.push($self.$invoke(handle));
            });

            return Promise.all(items);
        }
    };

    // register to foduleInstance
    {
        $instance.$fodules[$self.$name] = $self;

        if ($self.$as in $instance.$aliasFodules) {
            throw new Error('`{srcModule}` nertei module-n `{as}` alias ni `{deffModule}` nertai module-n alias-tai ijilhen bna'.format({
                srcModule: $module.$name,
                deffModule: $instance.$aliasFodules[$module.$as].$module.$name,
                as: $module.$as
            }));
        }
        $instance.$aliasFodules[$self.$as] = $self;
    }

    // event register to foduleInstance
    _.each($module.$events, function (e, eventName) {
        var listener = $instance.$events[eventName] || ($instance.$events[eventName] = []);

        for (var i in e) {
            listener.push(e[i]);
        }
    });

    // included module create
    $module.$includes.forEach(function (module) {
        if (!(module.$name in $instance.$fodules)) {
            $$fodule(module, $instance);
        }
    });

    return $self;


}


function $$foduleInstance($instanceName) {
    var $self, $modules = {}, $fodules = {}, $aliasFodules = {}, $factoriesInstances = {}, $events = {};

    //var registerAs = function ($fodule) {
    //    var $module = $fodule.$module;
    //
    //    if ($module.$as in $aliasFodules)
    //        throw  '`{srcModule}` nertei module-n `{as}` alias ni `{deffModule}` nertai module-n alias-tai ijilhen bna'.format({
    //            srcModule: $module.$name,
    //            deffModule: $aliasFodules[$module.$as].$module.$name,
    //            as: $module.$as
    //        });
    //
    //    $aliasFodules[$module.$as] = $fodule;
    //};

    var $system = $$module('$system').as('$', false)
        //.factory('injector', function () {
        //    return function (name) {
        //        return $self.$factoryValue(name, $system);
        //    };
        //})
        .factory('value', function () {
            return function (name) {
                return values[name];
            };
        })
        .factory('_', function () {
            return _;
        })
        .factory('lodash', function () {
            return _;
        })
        .factory('promise', function () {
            return Promise;
        })
        .factory('Promise', function () {
            return Promise;
        })

        .factory('emit', function () {
            return function (name, params) {
                return emit(name, params);
            };
        });


    return ($self = {
        get $fodules() {
            return $fodules;
        },
        get $aliasFodules() {
            return $aliasFodules;
        },
        get $events() {
            return $events;
        },
        get $factoriesInstances() {
            return $factoriesInstances;
        },
        register: function (module) {
            if (module.$name in $modules) {
                throw new Error('`{$instanceName}` nertei foduleInstance dotor `{module}` nertei module burtguulchihsen bna'.format({
                    module: module.$name,
                    $instanceName: $instanceName
                }));
            }

            $modules[module.$name] = true;
        },
        start: function ($module) {
//            console.log('starting `%s`', $module.$name);

            $$fodule($system, $self);
            $$fodule($module, $self);

            if (!($module.$name in $fodules)) {
                throw new Error("`{$instanceName}` nertei foduleInstance dotor `{module}` nertei module burtgegdeegui bna".format({
                    module: $module.$name,
                    $instanceName: $instanceName
                }));
            }

            return Promise.resolve()
                .then(function () {
                    return runConfigs();
                })
                .then(function () {
                    return runRuns();
                })
                .then(function () {
                    return;
                });
        },

        $invoke: function (handle, $fodule) {

            //console.log('$invoke 1>', handle, $fodule.$name)

            if (_.isFunction(handle)) {
                return handle.apply($fodule.$module);
            }

            if (_.isArray(handle)) {
                var fn = handle[handle.length - 1], i, dependencies, factoryName, dep;
                if (_.isFunction(fn)) {
                    dependencies = [];
                    for (i = 0; i < handle.length - 1; i++) {
                        factoryName = handle[i];
                        {
                            dep = $self.$factoryValue(factoryName, $fodule);

                            if (dep) {
                                dependencies.push(dep.result);
                            } else {
                                throw new Error('not defined `{0}`. using module `{1}` '.format(factoryName, $fodule.$name));
                            }
                        }
                    }
                    return fn.apply($fodule.$module, dependencies);

                } else {
                    for (i = 0; i < handle.length; i++) {
                        factoryName = handle[i];
                        dep = $self.$factoryValue(factoryName, $fodule);
                        if (dep === false) {
                            throw 'not found factory `{0}`'.format(factoryName);
                        }
                    }
                    return;
                }
            }
            throw  new Error('not supported handle');
        },
        $factoryValue: function (factoryName, $fodule) {
            var fodule, dep;

            if (factoryName === '$injector') {
                return {
                    result: function (name) {
                        dep = $self.$factoryValue(name, $fodule);
                        if (dep === false) {
                            throw 'not found factory `{0}`'.format(factoryName);
                        }

                        return dep.result;
                    }
                };
            }


            var namer = (function (name) {
                'use strict';

                var names = name.split(':');

                if (names.length === 2) {
                    return {
                        module: _.trim(names[0]),
                        name: _.trim(names[1])
                    };
                }

                if (names.length === 1) {

                    if (names[0].indexOf('$') === 0) {
                        return {
                            module: '$',
                            name: names[0].substr(1)
                        };
                    }

                    return {
                        module: false,
                        name: _.trim(names[0])
                    };
                }


                throw new Error('todo. not supported name. ');

            })(factoryName);


            var resultOk = function (value) {
                return {
                    result: value
                };
            };
            var lockup = function (name, fodule) {

                return (function (module) {

                    if (name in module.$values) {
                        return resultOk(module.$values[namer.name]);
                    }

                    if (name in module.$factories) {
                        var aliasName = module.$as + ':' + name;
                        var moduleName = module.$name + ':' + name;

                        if (aliasName in $factoriesInstances) return resultOk($factoriesInstances[aliasName]);
                        if (moduleName in $factoriesInstances) return resultOk($factoriesInstances[moduleName]);

                        var factory = module.$factories[name];
                        var factoriesInstance = $self.$invoke(factory, fodule);

                        $factoriesInstances[aliasName] = factoriesInstance;
                        $factoriesInstances[moduleName] = factoriesInstance;
                        return resultOk(factoriesInstance);
                    }
                    return false;

                })(fodule.$module);
            };

            if (namer.module) {
                if (namer.module in $fodules) {
                    fodule = $fodules[namer.module];
                    return lockup(namer.name, fodule);
                }

                if (namer.module in $aliasFodules) {
                    fodule = $aliasFodules[namer.module];
                    return lockup(namer.name, fodule);
                }

            } else {
                return lockup(namer.name, $fodule);
            }
            return false;
        }

    });

    function emit(name) {
        var items = [];
        _.each($fodules, function (fodule) {
            items.push(Promise.all(fodule.emit(name)));
        });

        return Promise.all(items);
    }

    function runConfigs() {
        var items = [];
        _.each($fodules, function (fodule) {
            _.each(fodule.$module.$configs, function (handle) {
                items.push($self.$invoke(handle, fodule));
            });
        });
        return Promise.all(items);
    }

    function runRuns() {
        var items = [];
        _.each($fodules, function (fodule) {
            _.each(fodule.$module.$runs, function (handle) {
                items.push($self.$invoke(handle, fodule));
            });
        });
        return Promise.all(items)
            .then(function () {
                return emit('postRun');
            });
    }
}


var factory = function (instanceName) {
    var $foduler = {
        $instance: $$foduleInstance(instanceName || 'default instance'),
        $module: false
    }


    $foduler.module = function (name) {
        var module = $$module(name, $foduler.$instance);
        $foduler.$instance.register(module);

        if ($foduler.$module === false) {
            $foduler.$module = module;
        }

        return module;
    };

    $foduler.$system = {
        $lodash: '$lodash',
        $promise: '$promise',
        $emit: '$promise'
    }

    return $foduler;
};

var start = function ($foduler) {
    if ($foduler && $foduler.$instance && $foduler.$module) {
        return $foduler.$instance.start($foduler.$module);
    }
    throw new Error('not found staring module');
};


module.exports.factory = factory;

module.exports.start = start;

module.exports.version = '2.0.1';


//var t = factory('tt');
//
//t.module('n1')
//    .run(function () {
//        console.log('run ok')
//    })
//start(t);


//module.exports = function foduler(instanceName) {
//    var $instance = $$foduleInstance(instanceName || 'default instance');
//    var $module = false;
//    this.start = function () {
//        if ($module) {
//            return $instance.start($module);
//        }
//        throw new Error('not found staring module');
//    };
//
//    this.module = function (name) {
//        var module = $$module(name, $instance);
//        $instance.register(module);
//
//        if ($module === false) {
//            $module = module;
//        }
//
//        return module;
//    };
//}

//
//test.module('test')
//    .factory('aa:a')
//    .run(function () {
//        console.log(12);
//    });