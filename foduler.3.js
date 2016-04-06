/**
 * Created by Administrator on 3/21/2016.
 */

var paramNames = require('get-parameter-names');
var helper = require('./helper');
var Promise = require('bluebird');
var lodash = require('lodash');
var moment = require('moment');

var stringFormat = require('string-format');

(function () {
    stringFormat.extend(String.prototype);
})();// init system

var uindex = (function () {
    var i = 0;
    return function () {
        return i++;
    }
})();

var Moduler = function (name, alias) {
    this.$uindex = 'm' + uindex();
    this.name = name;
    this.alias = alias || name;
    this.factories = {};
    this.runs = [];
    this.includes = {};
    this.events = {};
};

Moduler.prototype.factory = function (name) {
    this.factories[name] = helper.args(arguments);
    return this
};
Moduler.prototype.define = Moduler.prototype.def = Moduler.prototype.factory;

Moduler.prototype.run = function () {
    this.runs.push(helper.args(arguments, 0));
    return this;
};
Moduler.prototype.on = function (name) {
    (this.events[name] || (this.events[name] = [])).push(helper.args(arguments));
    return this;
};
Moduler.prototype.emit = function (name, runner) {
    var self = this;
    if (name in self.events) {
        return Promise.each(self.events[name], function (events) {
            return runner.invokeHandles(events, self);
        });
    }
    return Promise.resolve();
};
Moduler.prototype.include = function () {
    var self = this;
    helper
        .args(arguments, 0)
        .forEach(function (it) {
            if (it instanceof Moduler) {
                self.includes[it.$uindex] = it;
            } else {
                console.log('warning: cannot include. the module `{0}`. request item'.format(self.name), it);
            }
        });
    return this;
};


var Runner = function (module) {
    if (!(module instanceof Moduler)) {
        throw new Error('cannot run. required Moduler object');
    }
    var self = this;
    self.modules = {};
    self.names = {};
    self.aliases = {};

    self.instances = {};
    self.promises = {};
    self.runs = [];

    self.modules[module.$uindex] = module;
    self.names[module.name] = module.$uindex;
    self.aliases[module.alias] = module.$uindex;

    self.init(module);
    self.emit('postInit')
        .then(function () {
            return self.emit('preRun');
        })
        .then(function () {
            var result = [];
            for (var i in self.modules) {
                result.push(self.run(self.modules[i]));
            }

            return Promise.all(result);
        })
        .then(function () {
            self.emit('postRun');
        });
};

Runner.prototype.init = function (module) {
    var self = this;

    for (var k in module.includes) {
        var it = module.includes[k];

        if (it instanceof Moduler) {
            if (it.$uindex in self.modules) {
                continue;
            }

            self.modules[it.$uindex] = it;

            if (it.name in self.names) {
                throw new Error("fodule name duplicated. duplicated name : `{0}`".format(it.name));
            }
            self.names[it.name] = it.$uindex;

            if (it.alias in self.aliases) {
                var duplicated = self.findFodule(it.alias);
                throw new Error("alias duplicated. duplicated alias : `{0}`;  `{1} vs `{2}`>".format(it.alias, it.name, duplicated.name));
            }
            self.aliases[it.alias] = it.$uindex;

            self.init(it);
        }
    }
};

Runner.prototype.run = function (module) {
    var self = this;
    return Promise.each(module.runs, function (run) {
        return self.invokeHandles(run, module);
    });
};
Runner.prototype.emit = function (name) {
    var self = this;

    var result = [];
    for (var i in self.modules) {
        result.push(self.modules[i].emit(name, self));
    }
    return Promise.all(result);
};
Runner.prototype.findFodule = function (nameOrAlias) {
    var uindex;
    if (nameOrAlias in this.aliases) {
        uindex = this.aliases[nameOrAlias];
    } else if (nameOrAlias in this.names) {
        uindex = this.names[nameOrAlias];
    }

    if (uindex in this.modules) {
        return this.modules [uindex];
    }
    return null;
}

Runner.prototype.invoke = function (defer, own) {
    var self = this;
    if (typeof defer === "function") {
        return self.invokeFunc(defer, own);
    } else if (typeof defer === 'string' || defer instanceof String) {
        return self.inject(defer, own);
    }

    throw new Error("invoke is not defined");
};


Runner.prototype.inject = function (name, own) {

    var self = this;

    // -- system inject
    if (name === "$lodash") {
        return lodash;
    }
    if (name === "$promise" || name === "$Promise") {
        return Promise;
    }
    if (name === "$inject" || name === "$injector") {
        return function (findName) {
            return self.inject(findName, own);
        };
    }
    if (name === "$invoke" || name === "$invoker") {
        return function () {
            return self.invokeHandles(arguments, own);
        };
    }
    if (name === "$emit") {
        return function (eventName) {
            return self.emit(eventName);
        };
    }
    if (name === "$moment") {
        return moment;
    }

    // -- end system inject

    var names = helper.parseName(name);
    var module = own;
    if (names.module) {
        module = self.findFodule(names.module);
        if (module === null) {
            throw new Error('not found module. find modulename=`{0}`; inject name= `{1}`  ; using module `{2}`'.format(names.module, name, own.name));
        }
    }

    var cacheName = module.$uindex + "$" + names.name;

    if (cacheName in self.instances) {
        return Promise.resolve(self.instances[cacheName]);
    }

    if (cacheName in self.promises) {
        return self.promises[cacheName];
    }


    if (names.name in module.factories) {
        var handlers = module.factories[names.name]
        return self.promises[cacheName] = self.invokeHandles(handlers, module)
            .then(function (instance) {
                self.instances[cacheName] = instance;
                delete self.promises[cacheName];
                return instance;
            });
    }

    throw new Error('not found factory. find factoryName=`{0}` moduleName=`{1}`'.format(name, own.name));
};
Runner.prototype.invokeHandles = function (handlers, own) {

    //console.log('---> Runner.invokeHandles ->',own.name, handlers)

    var self = this, promises = [], index = -1;
    for (var i in handlers) {
        var handle = handlers[i];
        if (index === -1 && typeof handle === 'function') {
            index = i;
        }

        promises.push(self.invoke(handle, own));
    }
    return Promise.all(promises)
        .then(function (rsu) {
            if (index > -1)
                return rsu[index];
            return rsu.length ? rsu[0] : undefined;
        });
};

Runner.prototype.invokeFunc = function (fn, own) {
    var names = paramNames(fn);
    var promises = [], self = this;
    for (var i in names) {
        promises.push(self.inject(names[i], own));
    }

    return Promise.all(promises)
        .then(function (args) {
            return fn.apply(null, args);
        })
};

module.exports.Moduler = Moduler;
module.exports.Runner = Runner;
module.exports.Promise = Promise;