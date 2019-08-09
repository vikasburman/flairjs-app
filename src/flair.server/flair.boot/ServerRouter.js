const Bootware = await include('flair.app.Bootware');

/**
 * @name ServerRouter
 * @description Server Router Configuration Setup
 */
$$('sealed');
$$('ns', '(auto)');
Class('(auto)', Bootware, function () {
    const { RestHandler, RestInterceptor } = ns('flair.api');

    let routes = null;
    
    $$('override');
    this.construct = (base) => {
        base('Server Router', true); // mount specific 
    };

    $$('override');
    this.boot = async (base, mount) => {
        base();
        
        // get all registered routes, and sort by index, if was not already done in previous call
        if (!routes) {
            routes = AppDomain.context.current().allRoutes(true);
            routes.sort((a, b) => {
                if (a.index < b.index) {
                    return -1;
                }
                if (a.index > b.index) {
                    return 1;
                }
                return 0;
            });
        }

        let result = false;

        const runInterceptors = async (interceptors, req, res) => {
            for (let ic of interceptors) {
                let ICType = as(await include(ic), RestInterceptor);
                if (!ICType) { throw Exception.InvalidDefinition(`Invalid interceptor type. (${ic})`); }
                
                await new ICType().run(req, res);
                if (req.$stop) { break; } // break, if someone forced to stop 
            }
        };
       
        // add routes related to current mount
        for (let route of routes) {
            // route.mount can be one string or an array of strings - in that case, same route will be mounted to multiple mounts
            if ((typeof route.mount === 'string' && route.mount === mount.name) || (route.mount.indexOf(mount.name) !== -1)) { // add route-handler
                route.verbs.forEach(verb => {
                    mount.app[verb](route.path, (req, res, next) => { // verb could be get/set/delete/put/, etc.
                        const onError = (err) => {
                            next(err);
                        };
                        const onDone = (result) => {
                            if (!result) {
                                next();
                            }
                        };
                        const handleRoute = () => {
                            include(route.handler).then((theType) => {
                                let RouteHandler = as(theType, RestHandler);
                                if (RouteHandler) {
                                    try {
                                        using(new RouteHandler(), (routeHandler) => {
                                            // req.params has all the route parameters.
                                            // e.g., for route "/users/:userId/books/:bookId" req.params will 
                                            // have "req.params: { "userId": "34", "bookId": "8989" }"
                                            result = routeHandler[verb](req, res);
                                            if (result && typeof result.then === 'function') {
                                                result.then((delayedResult) => {
                                                    onDone(delayedResult);
                                                }).catch(onError);
                                            } else {
                                                onDone(result);
                                            }
                                        });
                                    } catch (err) {
                                        onError(err);
                                    }
                                } else {
                                    onError(Exception.InvalidDefinition(`Invalid route handler. ${route.handler}`));
                                }
                            }).catch(onError);
                        };

                        // add special properties to req
                        req.$stop = false;

                        // run mount specific interceptors
                        // each interceptor is derived from RestInterceptor and
                        // run method of it takes req, can update it, also takes res method and can generate response, in case request is being stopped
                        // each item is: "InterceptorTypeQualifiedName"
                        let mountInterceptors = settings.routing[`${mount.name}-interceptors`] || [];
                        runInterceptors(mountInterceptors, req, res).then(() => {
                            if (!req.$stop) {
                                handleRoute();
                            } else {
                                res.end();
                            }
                        }).catch((err) => {
                            if (req.stop) {
                                res.end();
                            } else {
                                onError(err);
                            }
                        });
                    });
                });
            }
        }

        // catch 404 for this mount and forward to error handler
        mount.app.use((req, res, next) => {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        // dev/prod error handler
        if (env.isProd) {
            mount.app.use((err, req, res) => {
                res.status(err.status || 500);
                if (req.xhr) {
                    res.status(500).send({
                        error: err.toString()
                    });
                } else {
                    res.render('error', {
                        message: err.message,
                        error: err
                    });
                }
                res.end();
            });
        } else {
            mount.app.use((err, req, res) => {
                res.status(err.status || 500);
                if (req.xhr) {
                    res.status(500).send({
                        error: err.toString()
                    });
                } else {
                    res.render('error', {
                        message: err.message,
                        error: err
                    });
                }
                res.end();
            });
        }
    };
});