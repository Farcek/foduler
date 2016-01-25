/**
 * module name `web-base`.
 * @namespace $web
 */
module.exports = function (foduler) {

    return (foduler || require('./index')).module('web-base').as('$web')

        .factory('express', function () {
            /**
             * @func $web.express
             */
            return require('express');
        })
        .factory('session', function () {
            /**
             * @func $web.session
             */
            return require('express-session');
        })
        .factory('favicon', function () {
            /**
             * @func $web.favicon
             */
            return require('serve-favicon');
        })
        .factory('morgan', function () {
            return require('morgan');
        })
        .factory('body-parser', function () {
            return require('body-parser');
        })
        .factory('cookie-parser', function () {
            return require('cookie-parser');
        })

        .factory('appFactory', ['express', function (express) {
            var _app;
            return function (app) {
                var _app = app || (_app = express());

                _app.disable('x-powered-by');
                return _app;
            };
        }])
        .factory('app', ['appFactory',
            function (appFactory) {

                return appFactory();
            }
        ])

        .factory('routerFactory', ['app', 'express',
            function (app, express) {
                /***
                 * options.app | options.base
                 * options.before | options.middleware
                 * options.routerOptions | options.options
                 */
                return function (path, options) {
                    options = options || {};
                    var router = express.Router(options.routerOptions || options.options);
                    var base = options.base || options.app || app;
                    var before = options.before || options.middleware;
                    if (before) {
                        base.use(path, before, router);
                    } else {
                        base.use(path, router);
                    }
                    return router;
                };
            }
        ])


        .factory('tools', ['tool.paging', 'tool.ordering', 'tool.filtering',
            function (pageing, order, filter) {
                return {
                    paging: pageing, order: order, filter: filter
                };
            }
        ])
        .factory('tool.paging', function () {
            /**
             * @function $web.'tool.paging'
             *
             * @param {function} options.parser - parameter resolver function
             * <pre>
             *  {
         *      ..
         *      parser : function(req){
         *          return {
         *              page: req.param.page
         *              limit: 10
         *          }
         *      }
         *      ..
         *  }
             *  </pre>
             * @param {number} options.limit - default limit
             * @param {number} options.maxLimit - default max limit
             *
             */
            return function (options) {
                options = options || {};
                var limit = options.limit || 15;
                var maxLimit = options.maxLimit || 1000;

                var parser = options.parser || function (req) {
                        return {
                            page: req.query.page || req.query.p,
                            limit: req.query.limit || req.query.l || limit
                        };
                    };

                return function (req, res, next) {

                    if ('paging' in req) {
                        return next();
                    }

                    var params = parser(req);

                    var p = params.page || 1;
                    var l = params.limit || limit;
                    if (l > maxLimit) l = maxLimit;

                    req.paging = {
                        get page() {
                            return p;
                        },
                        get limit() {
                            return l;
                        },
                        get offset() {
                            return (p - 1) * l;
                        }
                    };
                    next();
                };
            };
        })
        .factory('tool.ordering', ['$lodash',
            function (_) {
                /**
                 * @function $web.'tool.ordering'
                 *
                 * @param {function} [options.parser] - parser
                 * @param {String} [options.fieldParam=order] - order field param
                 */
                return function (options) {

                    options = options || {};
                    var fieldParam = options.fieldParam || 'order';
                    var typeParam = options.typeParam || 'type';

                    var defaultType = options.defaultType;
                    var defaultField = options.defaultField || 'asc';

                    var parser = options.parser || function (req) {
                            return (fieldParam in req.query) && [{
                                    field: req.query[fieldParam],
                                    type: req.query[fieldParam],
                                }];
                        };

                    return function (req, res, next) {
                        if ('ordering' in req) {
                            return next();
                        }
                        var params = parser(req), done = function (ordering) {
                            req.ordering = ordering;
                            next();
                        };
                        if (params) {
                            if (_.isArray(params) && params.length > 0) {
                                var ordering = [];
                                for (var i in params) {
                                    var field = params[i] && params[i].field;
                                    var type = (params[i] && params[i].type) || defaultType;
                                    if (field) {
                                        ordering.push([field, type]);
                                    }
                                }

                                if (ordering.length > 0) return done(ordering);
                            } else {
                                if (params.field) {
                                    return done([[params.field, params.type || defaultType]]);
                                }
                            }
                        }

                        if (defaultField) {
                            return done([[defaultField, defaultType]]);
                        }
                        next();
                    };
                };
            }
        ])
        .factory('tool.filtering', function () {
            /**
             * @function $web.'tool.filtering'
             *
             * @param {function} [options.parser] - parser function
             * @param {string} [options.queryParam] - default parser in query param name
             */
            return function (options) {
                options = options || {};

                var queryParam = options.queryParam || 'q';


                var parser = options.parser || function (req) {
                        return (queryParam in req.query) && {
                                query: req.query[queryParam]
                            };
                    };


                return function (req, res, next) {


                    var params = parser;
                    req.filtering = {
                        get query() {
                            return params && params.query;
                        },
                        get filter() {
                            return params && params.filters;
                        }
                    };
                    return next();
                };
            };
        })

        .factory('validator', ['$promise',
            function (Promise) {
                var expressValidator = require('express-validator');

                return function (options) {

                    return [expressValidator(options), function (req, res, next) {
                        req.valid = function (sync) {
                            var p;
                            if (sync) p = new Promise(function (resolve, reject) {
                                var err = req.validationErrors();
                                if (err) return reject(err);
                                resolve();
                            });
                            else p = req.asyncValidationErrors();

                            return p
                                .then(function () {
                                    return true;
                                })
                                .catch(function (errors) {
                                    throw {
                                        name: 'validation',
                                        code: 400,
                                        errors: errors
                                    };
                                });
                        };
                        next();
                    }];
                };
            }
        ])
        .factory('promise-express', ['$promise', function (Promise) {
            return function (req, res, next) {
                res.promiseJson = function (fn) {
                    Promise.try(fn)
                        .then(function (result) {
                            res.json(result);
                        })
                        .catch(next);
                };
                res.promiseHtml = function () {
                    throw 'todo html';
                };
                next();
            };
        }]);


};

