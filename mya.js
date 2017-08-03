/**
 * @file: mya.js
 * @author mya
 * ver: 1.0.0
 * update: 2017/08/03
 * https://github.com/mya-org/mya.js
 */

/* eslint-disable no-unused-vars */

/* 模块加载器 */
(function (global) {
    global.__M = global.__M || {};

    // 避免重复加载而导致已定义模块丢失
    if (global.__M.require) {
        return;
    }

    var require, define;

    var head = document.getElementsByTagName('head')[0];
    var loadingMap = {};
    var factoryMap = {};
    var modulesMap = {};
    var scriptsMap = {};
    var resMap = {};
    var pkgMap = {};

    var createScript = function (url, onerror) {
        if (url in scriptsMap) {
            return;
        }

        scriptsMap[url] = true;

        var script = document.createElement('script');
        if (onerror) {
            var tid = setTimeout(onerror, require.timeout);

            script.onerror = function () {
                clearTimeout(tid);
                onerror();
            };

            var onload = function () {
                clearTimeout(tid);
            };

            if ('onload' in script) {
                script.onload = onload;
            }
            else {
                script.onreadystatechange = function () {
                    if (this.readyState === 'loaded' || this.readyState === 'complete') {
                        onload();
                    }
                };
            }
        }
        script.type = 'text/javascript';
        script.src = url;
        head.appendChild(script);
        return script;
    };

    var loadScript = function (id, callback, onerror) {
        var queue = loadingMap[id] || (loadingMap[id] = []);
        queue.push(callback);

        //
        // resource map query
        //
        var res = resMap[id] || resMap[id + '.js'] || {};
        var pkg = res.pkg;
        var url;

        if (pkg) {
            url = pkgMap[pkg].url || pkgMap[pkg].uri;
        }
        else {
            url = res.url || res.uri || id;
        }

        createScript(url, onerror && function () {
            onerror(id);
        });
    };

    define = function (id, factory) {
        typeof factory !== 'function' && ( factory = arguments[ 2 ] );
        id = id.replace(/\.js$/i, '');
        factoryMap[id] = factory;

        var queue = loadingMap[id];
        if (queue) {
            for (var i = 0, n = queue.length; i < n; i++) {
                queue[i]();
            }
            delete loadingMap[id];
        }
    };

    require = function (id) {

        // compatible with require([dep, dep2...]) syntax.
        if (id && id.splice) {
            return require.async.apply(this, arguments);
        }

        id = require.alias(id);

        var mod = modulesMap[id];
        if (mod) {
            return mod.exports;
        }

        //
        // init module
        //
        var factory = factoryMap[id];
        if (!factory) {
            throw '[ModJS] Cannot find module `' + id + '`';
        }

        mod = modulesMap[id] = {
            exports: {}
        };

        //
        // factory: function OR value
        //
        var ret = (typeof factory === 'function') ? factory.apply(mod, [require, mod.exports, mod]) : factory;

        if (ret) {
            mod.exports = ret;
        }

        if (mod.exports && !mod.exports['default'] && Object.defineProperty && Object.isExtensible(mod.exports)) {
            Object.defineProperty(mod.exports, 'default', {
                value: mod.exports
            });
        }

        return mod.exports;
    };

    require.async = function (names, onload, onerror) {
        if (typeof names === 'string') {
            names = [names];
        }

        var needMap = {};
        var needNum = 0;

        function findNeed(depArr) {
            var child;

            for (var i = 0, n = depArr.length; i < n; i++) {
                //
                // skip loading or loaded
                //
                var dep = require.alias(depArr[i]);

                if (dep in factoryMap) {
                    // check whether loaded resource's deps is loaded or not
                    child = resMap[dep] || resMap[dep + '.js'];
                    if (child && 'deps' in child) {
                        findNeed(child.deps);
                    }
                    continue;
                }

                if (dep in needMap) {
                    continue;
                }

                needMap[dep] = true;
                needNum++;
                loadScript(dep, updateNeed, onerror);

                child = resMap[dep] || resMap[dep + '.js'];
                if (child && 'deps' in child) {
                    findNeed(child.deps);
                }
            }
        }

        function updateNeed() {
            if (0 === needNum--) {
                var args = [];
                for (var i = 0, n = names.length; i < n; i++) {
                    args[i] = require(names[i]);
                }

                onload && onload.apply(global, args);
            }
        }

        findNeed(names);
        updateNeed();
    };

    require.resourceMap = function (obj) {
        var k;
        var col;

        // merge `res` & `pkg` fields
        col = obj.res;
        for (k in col) {
            if (col.hasOwnProperty(k)) {
                resMap[k] = col[k];
            }
        }

        col = obj.pkg;
        for (k in col) {
            if (col.hasOwnProperty(k)) {
                pkgMap[k] = col[k];
            }
        }
    };

    require.loadJs = function (url) {
        createScript(url);
    };

    require.loadCss = function (cfg) {
        if (cfg.content) {
            var sty = document.createElement('style');
            sty.type = 'text/css';

            if (sty.styleSheet) { // IE
                sty.styleSheet.cssText = cfg.content;
            }
            else {
                sty.innerHTML = cfg.content;
            }
            head.appendChild(sty);
        }
        else if (cfg.url) {
            var link = document.createElement('link');
            link.href = cfg.url;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            head.appendChild(link);
        }
    };


    require.alias = function (id) {
        return id.replace(/\.js$/i, '');
    };

    require.timeout = 5000;

    global.__M.define  = define;
    global.__M.require = require;
})(this);

/* 简单的数据中心 */
(function (global) {
    global.__M = global.__M || {};

    var globalData = {};

    function _is(value, type) {
        type = type.charAt(0).toUpperCase() + type.slice(1);
        return Object.prototype.toString.call(value) === '[object ' + type + ']';
    }

    function _clone(data) {
        if (_is(data, 'array')) {
            var res = [];
            for (var i = 0, len = data.length; i < len; i++) {
                res.push(_clone(data[i]));
            }
            return res;
        }
        if (_is(data, 'object')) {
            var res = {};
            for (key in data) {
                res[key] = _clone(data[key])
            }
            return res;
        }
        return data;
    }

    function get(key) {
        return key && globalData[key] && _clone(globalData[key]);
    }

    function set(key, value) {
        if (key) {
            globalData[key] = value;
        }
        return value
    }

    function context(ctx) {
        if (_is(ctx , 'object')) {
            globalData = ctx;
        }
        return _clone(globalData);
    }

    global.__M.get = get;
    global.__M.set = set;
    global.__M.context = context;
})(this);