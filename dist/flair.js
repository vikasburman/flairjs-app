/**
 * FlairJS
 * True Object Oriented JavaScript
 * Version 0.15.27
 * Sat, 02 Feb 2019 22:51:29 GMT
 * (c) 2017-2019 Vikas Burman
 * MIT
 * https://flairjs.com
 */

// eslint-disable-next-line for-direction
(function(factory) { // eslint-disable-line getter-return
    'use strict';

    // add build engine to create assemblies on server
    let isServer = (typeof global !== 'undefined');
    if (isServer) { factory.build = require('./flair.build.js'); }

    // freeze
    let _factory = Object.freeze(factory);

    if (typeof define === 'function' && define.amd) { // AMD support
        define(function() { return _factory; });
    } else if (typeof exports === 'object') { // CommonJS and Node.js module support
        if (module !== undefined && module.exports) {
            exports = module.exports = _factory; // Node.js specific `module.exports`
        }
        module.exports = exports = _factory; // CommonJS
    } else if (!isServer) {
        window.Flair = _factory; // expose factory as global
    }
}).call((new Function("try {return global;}catch(e){return window;}"))(), (opts) => {
    'use strict';

    // reset everything and then proceed to set a clean environment
    let isServer = (new Function("try {return this===global;}catch(e){return false;}"))(),
        _global = (isServer ? global : window);
    if(_global.flair) { 
        // reset all globals
        let resetFunc = null,
            internalAPI = null;
        for(let name of _global.flair.members) {
            internalAPI = _global.flair[name]._;
            resetFunc = (internalAPI && internalAPI.reset) ? internalAPI.reset : null;
            if (typeof resetFunc === 'function') { resetFunc(); }
            delete _global[name];
        }
        
        // delete main global
        delete _global.flair;

        // special case (mostly for testing)
        if (typeof opts === 'string' && opts === 'END') { return; } // don't continue with reset
    }

    // environment
    if (!opts) { 
        opts = {}; 
    } else if (typeof opts === 'string') { // only symbols can be given as comma delimited string
        opts = { symbols: opts.split(',').map(item => item.trim()) };
    }

    // core support objects
    const _Exception = function(arg1, arg2, arg3) {
        let typ = '', msg = '',
            err = null;
        if (arg1) {
            if (typeof arg1 === 'string') { 
                typ = arg1; 
            } else if (typeof arg1 === 'object') {
                typ = arg1.name || 'UnknownException';
                err = arg1;
                msg = err.message;
            } else {
                typ = 'UndefinedException';
            }
        } else {
            typ = 'UndefinedException';
        }
        if (arg2) {
            if (typeof arg2 === 'string') { 
                msg = arg2; 
            } else if (typeof arg2 === 'object') {
                if (!err) { 
                    err = arg2; 
                    typ = typ || err.name;
                    msg = err.message;
                }
            } else {
                typ = 'UndefinedException';
            }               
        } else {
            if (err) { 
                typ = typ || err.name;
                msg = err.message; 
            }
        }
        if (arg3) {
            if (typeof arg3 === 'object') { 
                if (!err) { err = arg3; }
            }
        }
        if (typ && !typ.endsWith('Exception')) { typ+= 'Exception'; }
    
        let _ex = new Error(msg || '');
        _ex.name = typ || 'UndefinedException';
        _ex.error = err || null;
    
        // return freezed
        return Object.freeze(_ex);
    };
    const _typeOf = (obj) => {
        let _type = '';
    
        // undefined
        if (typeof obj === 'undefined') { _type = 'undefined'; }
    
        // null
        if (!_type && obj === null) { _type = 'null'; }
    
        // array
        if (!_type && Array.isArray(obj)) { _type = 'array'; }
    
        // date
        if (!_type && (obj instanceof Date)) { _type = 'date'; }
    
        // flair types
        if (!_type && obj._ && obj._.type) { _type = obj._.type; }
    
        // native javascript types
        if (!_type) { _type = typeof obj; }
    
        // return
        return _type;
    };
    const _is = (obj, type) => {
        // obj may be undefined or null or false, so don't check
        if (_typeOf(type) !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (type)'); }
        let isMatched = false, 
            _typ = '';
    
        if (obj) {
            // array
            if (type === 'array' || type === 'Array') { isMatched = Array.isArray(obj); }
    
            // date
            if (!isMatched && (type === 'date' || type === 'Date')) { isMatched = (obj instanceof Date); }
    
            // flair
            if (!isMatched && (type === 'flair' && obj._ && obj._.type)) { isMatched = true; }
    
            // native javascript types
            if (!isMatched) { isMatched = (typeof obj === type); }
    
            // flair types
            if (!isMatched) {
                if (obj._ && obj._.type) { 
                    _typ = obj._.type;
                    isMatched = _typ === type; 
                }
            }
            
            // flair custom types
            if (!isMatched && _typ && ['instance', 'sinstance'].indexOf(_typ) !== -1) { isMatched = _is.instanceOf(obj, type); }
        }
    
        // return
        return isMatched;
    };
    _is.instanceOf = (obj, type) => {
        let _objType = _typeOf(obj),
            _typeType = _typeOf(type),
            isMatched = false;
        if (['instance', 'sinstance'].indexOf(_objType) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
        if (['string', 'class', 'interface', 'structure', 'mixin'].indexOf(_typeType) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (type)'); }
    
        switch(_objType) {
            case 'instance':
                switch(_typeType) {
                    case 'class':
                        isMatched = obj._.isInstanceOf(type); break;
                    case 'interface':
                        isMatched = obj._.isImplements(type); break;
                    case 'mixin':
                        isMatched = obj._.isMixed(type); break;
                    case 'string':
                        isMatched = obj._.isInstanceOf(type);
                        if (!isMatched) { isMatched = obj._.isImplements(type); }
                        if (!isMatched) { isMatched = obj._.isMixed(type); }
                        break;
                }
                break;
            case 'sinstance':
                switch(_typeType) {
                    case 'string':
                    case 'structure':
                        isMatched = obj._.isInstanceOf(type); 
                        break;
                }
                break;
        }
    
        // return
        return isMatched;
    };
    _is.derivedFrom = (type, parent) => {
        if (_typeOf(type) !== 'class') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (type)'); }
        if (['string', 'class'].indexOf(_typeOf(parent)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (parent)'); }
        return type._.isDerivedFrom(parent);
    }; 
    _is.implements = (obj, intf) => {
        if (['instance', 'class'].indexOf(_typeOf(obj)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
        if (['string', 'interface'].indexOf(_typeOf(intf)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (intf)'); }
        return obj._.isImplements(intf);
    };
    _is.mixed = (obj, mixin) => {
        if (['instance', 'class'].indexOf(_typeOf(obj)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
        if (['string', 'mixin'].indexOf(_typeOf(mixin)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (mixin)'); }
        return obj._.isMixed(mixin);
    };
    const _Args = (...patterns) => {
        if (patterns.length === 0) { throw new _Exception('InvalidArgument', 'Argument must be defined. (patterns)'); }
    
        /**
         * @description Args validator function that validates against given patterns
         * @example
         *  (...args)
         * @params
         *  args: any - multiple arguments to match against given pattern sets
         * @returns object - result object, having:
         *  raw: (array) - original arguments as passed
         *  index: (number) - index of pattern-set that matches for given arguments, -1 if no match found
         *                    if more than one patterns may match, it will stop at first match
         *  isInvalid: (function) - function to check if any match could not be achieved
         *  <name(s)>: <value(s)> - argument name as given in pattern having corresponding argument value
         *                          if a name was not given in pattern, a default unique name will be created
         *                          special names like 'raw', 'index' and 'isInvalid' cannot be used.
         * @throws
         *   InvalidArgumentException
         */    
        let _args = (...args) => {
            // process each pattern - exit with first matching pattern
            let types = null, items = null,
                name = '', type = '',
                pIndex = -1, aIndex = -1,
                matched = false,
                mCount = 0,
                result = {
                    raw: args || [],
                    index: -1,
                    isInvalid: () => { return result.index === -1; }
                };
            if (patterns) {
                for(let pattern of patterns) {
                    pIndex++; aIndex=-1; matched = false; mCount = 0;
                    types = pattern.split(',');
                    for(let item of types) {
                        aIndex++;
                        items = item.split(':');
                        if (items.length !== 2) { 
                            name = `_${pIndex}_${aIndex}`; // e.g., _0_0 or _1_2, etc.
                            type = item.trim() || '';
                        } else {
                            name = items[0].trim() || '',
                            type = items[1].trim() || '';
                        }
                        if (['raw', 'index', 'isInvalid'].indexOf(name) !== -1) { throw new _Exception('InvalidArgument', `Argument name cannot be a reserved name. (${name})`); }
                        if (aIndex > result.raw.length) { matched = false; break; }
                        if (!_is(result.raw[aIndex], type)) { matched = false; break; }
                        result[name] = result.raw[aIndex]; matched = true; mCount++;
                    }
                    if (matched && mCount === result.raw.length) {result.index = pIndex; break; }
                }
            }
    
            // return
            return result;
        };
    
        // return freezed
        return Object.freeze(_args);
    };

    // helpers
    const guid = () => {
        return '_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    const flarized = (type, name, obj, mex = {}) => {
        // check
        if (!name || typeof name !== 'string') { throw new _Exception('InvalidArgumentException', `Invalid type name ${name}.`); }
    
        // add meta information
        let _ = mex; // whatever meta extensions are provided
        _.name = name;
        _.type = type;
        _.namespace = null;
        _.assembly = () => { return flair.Assembly.get(name) || null; };
        _.id = guid();
        _.__ = {}; // store any dynamic information here under this unfreezed area
    
        // attach meta
        obj._ = _;
    
        // register obj with namespace
        flair.Namespace(obj); // instances are not
    
        // freeze meta
        obj._ = Object.freeze(obj._);
    
        // return freezed
        return Object.freeze(obj);
    };
    const flarizedInstance = (type, obj, mex = {}) => {
        // add meta information
        let _ = mex; // whatever meta extensions are provided
        _.type = type;
        _.id = guid();
        _.__ = {}; // store any dynamic information here under this unfreezed area
    
        // attach freezed meta
        obj._ = Object.freeze(_);
    
        // return freezed
        return Object.freeze(obj);
    };
    const which = (def, isFile) => {
        if (isFile) { // debug/prod specific decision
            // pick minified or dev version
            if (def.indexOf('{.min}') !== -1) {
                if (flair.options.env.isProd) {
                    return def.replace('{.min}', '.min'); // a{.min}.js => a.min.js
                } else {
                    return def.replace('{.min}', ''); // a{.min}.js => a.js
                }
            }
        } else { // server/client specific decision
            if (def.indexOf('|') !== -1) { 
                let items = def.split('|'),
                    item = '';
                if (flair.options.env.isServer) {
                    item = items[0].trim();
                } else {
                    item = items[1].trim();
                }
                if (item === 'x') { item = ''; } // special case to explicitely mark absence of a type
                return item;
            }            
        }
        return def; // as is
    };

    let flair = { members: [] },
        noop = () => {},
        sym = (opts.symbols || []), // eslint-disable-next-line no-unused-vars
        noopAsync = (resolve, reject) => { resolve(); },
        _args = (isServer ? process.argv : new window.URLSearchParams(window.location.search)),
        isTesting = (sym.indexOf('TEST') !== -1);

    // forced server/client mocking for test environment
    if (isTesting) {
        if (sym.indexOf('SERVER') !== -1) { 
            isServer = true;
        } else if (sym.indexOf('CLIENT') !== -1) {
            isServer = false;
        }
    }

    // options
    let options = Object.freeze({
            symbols: Object.freeze(sym),
            env: Object.freeze({
                type: opts.env || (isServer ? 'server' : 'client'),
                isTesting: isTesting,
                isServer: isServer,
                isClient: !isServer,
                isProd: (sym.indexOf('PROD') !== -1),
                isDebug: (sym.indexOf('DEBUG') !== -1),
                global: _global,
                supressGlobals: (typeof opts.supressGlobals === 'undefined' ? false : opts.supressGlobals),
                args: _args
            }),
            loaders: Object.freeze({
                module: Object.freeze({ // (file) => {} that gives a promise to resolve with the module object, on success
                    server: opts.moduleLoaderServer || null,
                    client: opts.moduleLoaderClient || null  
                }),
                file: Object.freeze({ // (file) => {} that gives a promise to resolve with file content, on success
                    server: opts.fileLoaderServer || null,
                    client: opts.fileLoaderClient || null
                }),
                define: (type, fn) => {
                    if (_Args('string, function')(type, fn).isInvalid()) { throw new _Exception('InvalidArgument', `Arguments type error. (${type})`); }
                    let loaderOverrides = flair.options.loaderOverrides;
                    switch(type) { // NOTE: only once these can be defined after loading
                        case 'sm': loaderOverrides.moduleLoaderServer = loaderOverrides.moduleLoaderServer || fn; break;
                        case 'cm': loaderOverrides.moduleLoaderClient = loaderOverrides.moduleLoaderClient || fn; break;
                        case 'sf': loaderOverrides.fileLoaderServer = loaderOverrides.fileLoaderServer || fn; break;
                        case 'cf': loaderOverrides.fileLoaderClient = loaderOverrides.fileLoaderClient || fn; break;
                    }
                }
            }),
            loaderOverrides: {
                moduleLoaderServer: null,
                moduleLoaderClient: null,
                fileLoaderServer: null,
                fileLoaderClient: null
            }
        });
    
    // special symbols
    if (options.env.isProd && options.env.isDebug) { // when both are given
        throw new _Exception('InvalidOption', `DEBUG and PROD symbols are mutually exclusive. Use only one of these symbols.`);
    }

    flair._ = Object.freeze({
        name: 'FlairJS',
        version: '0.15.27',
        copyright: '(c) 2017-2019 Vikas Burman',
        license: 'MIT',
        link: 'https://flairjs.com',
        lupdate: new Date('Sat, 02 Feb 2019 22:51:29 GMT')
    });
    flair.info = flair._;
    flair.options = options;

    /**
     * @name Exception
     * @description Lightweight Exception class that extends Error object and serves as base of all exceptions
     * @example
     *  Exception()
     *  Exception(type)
     *  Exception(error)
     *  Exception(type, message)
     *  Exception(type, error)
     *  Exception(type, message, error)
     * @params
     *  type: string - error name or type
     *  message: string - error message
     *  error: object - inner error or exception object
     * @constructs Exception object
     * @throws
     *  None
     */  
    flair.Exception = _Exception;
    
    // add to members list
    flair.members.push('Exception');
    /**
     * @name Args
     * @description Lightweight args pattern processor proc that returns a validator function to validate arguments against given arg patterns
     * @example
     *  Args(...patterns)
     * @params
     *  patterns: string(s) - multiple pattern strings, each representing one pattern set
     *                        each pattern set can take following forms:
     *                        'type, type, type, ...' OR 'name: type, name: type, name: type, ...'
     *                          type: can be following:
     *                              > expected native javascript data types like 'string', 'number', 'function', 'array', etc.
     *                              > inbuilt flair object types like 'class', 'structure', 'enum', etc.
     *                              > custom flair object instance types which are checked in following order:
     *                                  >> for class instances: 
     *                                     isInstanceOf given as type
     *                                     isImplements given as interface 
     *                                     isMixed given as mixin
     *                                  >> for structure instances:
     *                                     isInstance of given as structure type
     *                          name: argument name which will be used to store extracted value by parser
     * @returns function - validator function that is configured for specified patterns
     * @throws
     *  InvalidArgumentException 
     */ 
    flair.Args = _Args;
    
    // add to members list
    flair.members.push('Args');
    // Assembly
    let asmFiles = {},
        asmTypes = {};
    flair.Assembly = (ado) => {
        if (typeof ado !== 'object' || Array.isArray(ado.types) || Array.isArray(ado.assets)) {
            throw `Not an assembly definition object.`;
         }
        let asmFile = which(ado.file, true);
    
        let _asm = {
            name: () => { return ado.name; },
            file: () => { return asmFile; },
            desc: () => { return ado.desc; },
            version: () => { return ado.version; },
            copyright: () => { return ado.copyright; },
            license: () => { return ado.license; },
            isLoaded: () => { return _asm._.isLoaded; },
            types: () => { return ado.types.slice(); },
            settings: () => { return Object.freeze(ado.settings); },
            assets: () => { return ado.assets.slice(); },
            hasAssets: () => { return ado.assets.length > 0; },
            load: () => { return flair.Assembly.load(asmFile); }
        };
    
        _asm._ = {
            name: ado.name,
            type: 'assembly',
            namespace: null,
            ado: Object.freeze(ado),
            isLoaded: false,
            markLoaded: () => { _asm._.isLoaded = true; }
        };
    
        // register type with namespace
        flair.Namespace(_asm);
    
        // return
        return Object.freeze(_asm);
    };
    flair.Assembly.register = (...ados) => { 
        for(let ado of ados) {
            let asm = flair.Assembly(ado);
            if (asm) {
                let asmFile = asm.file();
                if (asmFiles[asmFile]) {
                    throw `Assembly ${asmFile} already registered.`;
                } else {
                    // register
                    asmFiles[asmFile] = asm;
    
                    // load types
                    for(let type of asm.types()) {
                        // qualified names across anywhere should be unique
                        if (asmTypes[type]) {
                            throw `Type ${type} defined in assembly ${asm.name} is already registered.`;
                        } else {
                            asmTypes[type] = asm; // means this type can be loaded from this assembly
                        }
                    }
                }
            }
        }
    };
    flair.Assembly.load = (file) => {
        if (flair.Assembly.isRegistered(file)) {
            return new Promise((resolve, reject) => {
                if (asmFiles[file].isLoaded()) {
                    resolve();
                } else {
                    if (isServer) {
                        try {
                            require(file);
                            asmFiles[file]._.markLoaded();
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    } else {
                        const script = flair.options.env.global.document.createElement('script');
                        script.onload = () => {
                            asmFiles[file]._.markLoaded();
                            resolve();
                        };
                        script.onerror = (e) => {
                            reject(e);
                        };
                        script.async = true;
                        script.src = file;
                        flair.options.env.global.document.body.appendChild(script);
                    }
                }
              });
        } else {
            throw `Assembly ${file} must be registered first.`;
        }
    };
    flair.Assembly.isRegistered = (file) => {
        return typeof asmFiles[file] !== 'undefined';
    };
    flair.Assembly.isLoaded = (file) => {
        return typeof asmFiles[file] !== 'undefined' && asmFiles[file].isLoaded();
    };
    flair.Assembly.get = (ofType) => {
        return asmTypes[ofType] || null;
    };
    flair.Assembly.all = () => { return Object.freeze(asmFiles); }
    flair.Assembly.allTypes = () => { return Object.freeze(asmTypes); }
    
    // reset api
    flair.Assembly._ = {
        reset: () => { asmFiles = {}; asmTypes = {}; }
    };
    
    // Namespace
    // Namespace(Type)
    flair.Namespace = (Type) => {
        // any type name can be in this format:
        // ~name <-- means, no namespace is given but still register this with root namespace
        // name <-- means, no namespace is given but since it is not forced, do not register this with root namespace
        // namespace.name
        
        // only valid types are allowed
        if (['class', 'enum', 'interface', 'mixin', 'structure', 'resource', 'proc'].indexOf(Type._.type) === -1) { throw `Type (${Type._.type}) cannot be placed in a namespace.`; }
    
        // only unattached types are allowed
        if (Type._.namespace) { throw `Type (${Type._.name}) is already contained in a namespace.`; }
    
        // remove force register symbol (~) from name and also fix name
        let isForced = false;
        if (Type._.name.startsWith('~')) {
            Type._.name = Type._.name.substr(1); // remove ~
            isForced = true;
        }
    
        // merge/add type in namespace tree
        let nextLevel = flair.Namespace.root,
            nm = Type._.name,
            nsName = '',
            ns = nm.substr(0, nm.lastIndexOf('.'));
        nm = nm.substr(nm.lastIndexOf('.') + 1);
        if (ns) {
            let nsList = ns.split('.');
            for(let nsItem of nsList) {
                if (nsItem) {
                    // special name not allowed
                    if (nsItem === '_') { throw `Special name "_" is used as namespace in ${Type._.name}.`; }
                    nextLevel[nsItem] = nextLevel[nsItem] || {};
                    nsName = nsItem;
    
                    // check if this is not a type itself
                    if (nextLevel[nsItem]._ && nextLevel[nsItem]._.type !== 'namespace') { throw `${Type._.name} cannot be contained in another type (${nextLevel[nsItem]._.name})`; }
    
                    // pick it
                    nextLevel = nextLevel[nsItem];
                }
            }
        } else {
            if (!isForced) {
                return; // don't do anything
            }
        }
    
            // add type at the bottom, if not already exists
        if (nextLevel[nm]) { throw `Type ${nm} already contained at ${ns}.`; }
        nextLevel[nm] = Type;
    
        // add namespace
        Type._.namespace = nextLevel;
    
        // define namespace meta
        nextLevel._ = nextLevel._ || {};
        nextLevel._.name = nextLevel._.name || nsName;
        nextLevel._.type = nextLevel._.type || 'namespace';
        nextLevel._.types = nextLevel._.types || [];
        
        // add to Namespace
        nextLevel._.types.push(Type);
    
        // attach Namespace functions
        let getTypes = () => { 
            return nextLevel._.types.slice(); 
        }
        let getType = (qualifiedName) => {
            let _Type = null,
                level = nextLevel; // TODO: This is problem, in this case it is b and I am finding from root .....
            if (qualifiedName.indexOf('.') !== -1) { // if a qualified name is given
                let items = qualifiedName.split('.');
                for(let item of items) {
                    if (item) {
                        // special name not allowed InvalidNameException
                        if (item === '_') { throw `Special name "_" is used as name in ${qualifiedName}.`; }
        
                        // pick next level
                        level = level[item];
                        if (!level) { break; }
                    }
                }
                _Type = level;
            } else {
                _Type = level[qualifiedName];
            }
            if (!_Type || !_Type._ || ['class', 'enum', 'interface', 'mixin', 'structure'].indexOf(_Type._.type) === -1) { return null; }
            return _Type;
        };
        let createInstance = (qualifiedName, ...args) => {
            let _Type = nextLevel.getType(qualifiedName);
            if (_Type && _Type._.type != 'class') { throw `${name} is not a class.`; }
            if (_Type) { return new _Type(...args); }
            return null;
        };   
        nextLevel.getTypes = nextLevel.getTypes || getTypes;
        nextLevel.getType = nextLevel.getType || getType;
        nextLevel.createInstance = nextLevel.createInstance || createInstance;
    };
    flair.Namespace.root = {};
    flair.Namespace.getType = (qualifiedName) => { 
        if (flair.Namespace.root.getType) {
            return flair.Namespace.root.getType(qualifiedName);
        }
        return null;
    };
    flair.Namespace.getTypes = () => {
        if (flair.Namespace.root.getTypes) {
            return flair.Namespace.root.getTypes();
        }
        return [];
    };
    flair.Namespace.createInstance = (qualifiedName, ...args) => {
        if (flair.Namespace.root.createInstance) {
            return flair.Namespace.root.createInstance(qualifiedName, ...args);
        }
        return null;
    };
    
    // reset api
    flair.Namespace._ = {
        reset: () => { 
            // flair.Namespace.root = {}; 
        }
    };
    
    // In Reset func, clean all static and singleton flags as well for all registered classes
    
    // add to members list
    flair.members.push('Namespace');
    /**
     * @name Types
     * @description Get reference to a registered type definition
     * @example
     *  Types(name)
     * @params
     *  name: string - qualified type name whose reference is needed
     * @returns object - if assembly which contains this type is loaded, it will return flair type object OR will return null
     * @throws
     *  InvalidArgumentException
     *  InvalidNameException
     */ 
    flair.Types = (name) => { 
        if (_typeOf(name) !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is not valid. (name)'); }
        return flair.Namespace.getType(name); 
    }
    
    // add to members list
    flair.members.push('Types');
    // Class
    // Class(className, function() {})
    // Class(className, inherits, function() {})
    // Class(className, [mixins/interfaces], function() {})
    // Class(className, inherits, [mixins/interfaces], function() {})
    flair.Class = (arg1, arg2, arg3, arg4) => {
        let className = arg1,
            inherits = null,
            mixins = [],
            interfaces = [],
            factory = null;
        if (typeof arg3 === 'function') {
            factory = arg3;
            if (Array.isArray(arg2)) {
                mixins = arg2;
            } else {
                inherits = arg2;
            }
        } else if (typeof arg4 === 'function') {
            inherits = arg2;
            mixins = arg3;
            factory = arg4;
        } else if (typeof arg2 === 'function') {
            factory = arg2;
        }
    
        // seperate mixins and interfaces
        let onlyMixins = [];
        for(let mixin of mixins) {
            switch (mixin._.type) {
                case 'mixin': onlyMixins.push(mixin); break;
                case 'interface': interfaces.push(mixin); break;
            }
        }
        mixins = onlyMixins;
    
        // build class definition
        let Class = function(_flag, _static, ...args) {
            let Parent = Class._.inherits,
                _this = {},
                _exposed_this = {},
                singleInstance = null,
                bucket = [],
                meta = {},
                props = {},
                events = [],
                classArgs = [],
                isNeedProtected = false,
                staticInterface = null,
                theFlag = '__flag__',
                mixin_being_applied = null;
    
            // singleton consideration
            singleInstance = Class._.singleInstance();
            if (singleInstance) { return singleInstance; }
    
            // classArgs and static
            if (_flag && _flag === theFlag) {
                staticInterface = _static;
                isNeedProtected = true;
                classArgs = args;
            } else {
                staticInterface = Class._.static;
                if (typeof _flag !== 'undefined') { // as it can be a null value as well
                    classArgs = classArgs.concat([_flag]);
                    if (typeof _static !== 'undefined') { // as it can be a null value as well
                        classArgs = classArgs.concat([_static]);
                        if (typeof args !== 'undefined') { // as it can be a null value as well
                            classArgs = classArgs.concat(args);
                        }
                    }
                } else {
                    classArgs = args;
                }
            }
    
            // create parent instance
            if (Parent) {
                _this = new Parent(theFlag, staticInterface, ...classArgs);
                if (Parent._.isSealed() || Parent._.isSingleton()) {
                    throw `${className} cannot inherit from a sealed/singleton class ${Parent._.name}.`;
                }
            }
    
            // definition helper
            const guid = () => {
                return '_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            };
            const isSingletonClass = () => {
                return hasAttr('singleton', meta['_constructor']);
            }
            const isAbstractClass = () => {
                return hasAttr('abstract', meta['_constructor']);
            };
            const isSpecialMember = (member) => {
                return ['constructor', 'dispose', '_constructor', '_dispose', '_'].indexOf(member) !== -1;
            };   
            const isOwnMember = (member) => {
                return typeof meta[member] !== 'undefined';
            };
            const isDerivedMember = (member) => {
                if (isOwnMember(member)) { return false; }
                return (_this._.instanceOf.findIndex((item) => {
                    return (item.meta[member] ? true : false);
                }) !== -1);   
            };
            const memberType = (member) => {
                let result = '';
                if (typeof meta[member] !== 'undefined') {
                    result = meta[member].type;
                } else {
                    for(let instance of _this._.instanceOf) {
                        if (instance.meta[member]) {
                            result = instance.meta[member].type;
                            break;
                        }
                    }
                }
                return result;                        
            };
            const isSealedMember = (member) => {
                return hasAttr('sealed', meta[member]);
            }
            const isStaticMember = (member) => {
                return hasAttr('static', meta[member]);
            }
            const isPrivateMember = (member) => {
                return hasAttr('private', meta[member]);
            };
            const isHiddenMember = (member) => {
                return hasAttr('hide', meta[member]);
            };
            const isProtectedMember = (member) => {
                return hasAttrEx('protected', member);
            };
            const isSerializableMember = (member) => {
                return hasAttrEx('serialize', member);
            };
            const isConditionalMemberOK = (member) => {
                let isOK = true,
                    _meta = meta[member],
                    condition = '';
                if (_meta) {
                    for(let item of _meta) {
                        if (item.name === 'conditional') {
                            isOK = false;
                            condition = (item.args && item.args.length > 0 ? item.args[0] : '');
                            switch(condition) {
                                case 'server':
                                    isOK = (options.env.isServer === true); break;
                                case 'client':
                                    isOK = (options.env.isServer === false); break;
                                default:
                                    isOK = options.symbols.indexOf(condition) !== -1; break;
                            }
                            break;                       
                        }
                    }
                }
                return isOK;
            };
            const doCopy = (member) => {
                Object.defineProperty(_exposed_this, member, Object.getOwnPropertyDescriptor(_this, member));
            };            
            const isArrowFunction = (fn) => {
                return (!(fn).hasOwnProperty('prototype'));
            }; 
            const attr = (attrName, ...args) => {
                let Attr = null;
                if (typeof attrName === 'string') {
                    Attr = flair.Container.get(attrName)[0]; // get the first registered
                } else {
                    Attr = attrName;
                    attrName = Attr._.name;
                }
                bucket.push({name: attrName, Attr: Attr, args: args});
            };                
            const getAttrArgs = (attrName, member) => {
                let attrArgs = null;
                for(let item of _this._.instanceOf) {
                    if (item.meta[member]) {
                        for(let attrItem of item.meta[member]) {
                            if (attrItem.name === attrName) {
                                attrArgs = attrItem.args;
                                break;
                            }
                        }
                        if (attrArgs) { break; }
                    }
                }
                return (attrArgs !== null ? attrArgs : []);
            };
            const applyAttr = (targetName) => {
                let Attr = null,
                    targetType = meta[targetName].type,
                    attrArgs = null,
                    attrInstance = null,
                    decorator = null;
                for(let info of meta[targetName]) {
                    Attr = info.Attr;
                    if (Attr) {
                        attrArgs = info.args || [];
                        attrInstance = new Attr(...attrArgs);
                        decorator = attrInstance.decorator();
                        if (typeof decorator === 'function') {
                            let descriptor = Object.getOwnPropertyDescriptor(_this, targetName);
                            decorator(_this, targetType, targetName, descriptor);
                            Object.defineProperty(_this, targetName, descriptor);
                        }
                    }
                }
            };
            const hasAttr = (attrName, _meta) => {
                let has = false;
                if (_meta) {
                    has = (_meta.findIndex((item) => { return item.name === attrName; }) !== -1);
                }
                return has;
            };
            const hasAttrEx = (attrName, member) => {
                return (_this._.instanceOf.findIndex((item) => {
                    if (item.meta[member]) { return hasAttr(attrName, item.meta[member]); }
                    return false;
                }) !== -1);           
            };
            const isDefined = (member) => {
                let result = false,
                    last = _this._.instanceOf.length,
                    i = 1;
                for(let instance of _this._.instanceOf) {
                    if (instance.meta[member]) {
                        if (i !== last) {
                            result = true; break;
                        }
                    }
                    i++;
                }
                return result;
            };            
            const applyAspects = (funcName, funcAspects) => {
                let fn = _this[funcName],
                    before = [],
                    after = [],
                    around = [],
                    instance = null,
                    _fn = null;
                for(let funcAspect of funcAspects) {
                    instance = new funcAspect();
                    _fn = instance.before();
                    if (typeof _fn === 'function') {
                        before.push(_fn);
                    }
                    _fn = instance.around();
                    if (typeof _fn === 'function') {
                        around.push(_fn);
                    }
                    _fn = instance.after();
                    if (typeof _fn === 'function') {
                        after.push(_fn);
                    }
                }
    
                // around weaving
                if (around.length > 0) { around.reverse(); }
    
                // weaved function
                let weavedFn = function(...args) {
                    let error = null,
                        result = null,
                        ctx = {
                            obj: () => { return _this; },
                            className: () => { return className; },
                            funcName: () => { return funcName; },
                            error: (err) => { 
                                if (err) { error = err; }
                                return error; 
                            },
                            result: (value) => { 
                                if (typeof value !== 'undefined') { result = value; }
                                return result;
                            },
                            args: () => { return args; },
                            data: {}
                        };
                    // before functions
                    for(let beforeFn of before) {
                        try {
                            beforeFn(ctx);
                        } catch (err) {
                            error = err;
                        }
                    }
    
                    // after functions
                    const runAfterFn = (_ctx) =>{
                        for(let afterFn of after) {
                            try {
                                afterFn(_ctx);
                            } catch (err) {
                                ctx.error(err);
                            }
                        }
                    };
    
                    // around func
                    let newFn = fn,
                        isASync = false, // eslint-disable-line no-unused-vars
                        _result = null;
                    for(let aroundFn of around) {
                        newFn = aroundFn(ctx, newFn);
                    }                    
                    try {
                        _result = newFn(...args);
                        if (_result && typeof _result.then === 'function') {
                            isASync = true,
                            ctx.result(new Promise((__resolve, __reject) => {
                                _result.then((value) => {
                                    ctx.result(value);
                                    runAfterFn(ctx);
                                    __resolve(ctx.result());
                                }).catch((err) => {
                                    ctx.error(err);
                                    runAfterFn(ctx);
                                    __reject(ctx.error());
                                });
                            }));
                        } else {
                            ctx.result(_result);
                            runAfterFn(ctx);
                        }
                    } catch (err) {
                        ctx.error(err);
                    }
    
                    // return
                    return ctx.result();
                }.bind(_this);
    
                // done
                return weavedFn;
            };
            const weave = () => {
                // validate
                if (['Attribute', 'Aspect'].indexOf(className) !== -1) { return; }
                if (_this._.isInstanceOf('Attribute') || _this._.isInstanceOf('Aspect')) { return; }
    
                let funcAspects = [];
                for(let entry in meta) {
                    if (meta.hasOwnProperty(entry) && meta[entry].type === 'func' && !isSpecialMember(entry)) {
                        funcAspects = flair.Aspects.get(className, entry, meta[entry]);
                        if (funcAspects.length > 0) {
                            meta[entry].aspects = funcAspects.slice();
                            Object.defineProperty(_this, entry, {
                                value: applyAspects(entry, funcAspects)
                            });
                        }
                    }
                }
            };
            const processJson = (source, target, isDeserialize) => {
                let mappedName = '';
                for(let member in _this) {
                    if (_this.hasOwnProperty(member)) {
                        if ((memberType(member) === 'prop') &&
                            isSerializableMember(member) &&
                            !hasAttrEx('readonly', member) && 
                            !isStaticMember(member) && 
                            !isPrivateMember(member) && 
                            !isProtectedMember(member) && 
                            !isSpecialMember(member)) {
                                mappedName = getAttrArgs('serialize', member)[0] || member;
                                if (isDeserialize) {
                                    target[member] = source[mappedName] || target[member];
                                } else {
                                    target[mappedName] = source[member];
                                }
                        }
                    }
                }
            };
    
            _this.func = (name, fn) => {
                // constructor shorthand definition
                if (typeof name === 'function') { fn = name; name = 'constructor'; }
    
                // validate
                if (name === '_') { throw `${className}.${name} is not allowed.`; }
                if (!fn) { fn = noop; }
    
                // special names
                if (isSpecialMember(name)) {
                    name = '_' + name;
                }
    
                // add mixed attr
                if (mixin_being_applied !== null) {
                    attr('mixed', mixin_being_applied);
                }
    
                // collect attributes
                meta[name] = [].concat(bucket);
                meta[name].type = 'func';
                meta[name].aspects = [];
                meta[name].interfaces = [];
                bucket = [];
                let attrs = meta[name];
    
                // conditional check
                if (!isConditionalMemberOK(name)) {
                    delete meta[name]; return;
                }
    
                // define
                if (hasAttr('override', attrs)) {
                    // check
                    let desc = Object.getOwnPropertyDescriptor(_this, name);
                    if (!desc || typeof desc.value !== 'function') {
                        if (name === '_constructor') { name = 'constructor'; }
                        if (name === '_dispose') { name = 'dispose'; }
                        throw `${className}.${name} is not a function to override.`;
                    }
                    if (hasAttrEx('sealed', name) && !hasAttr('sealed', attrs)) {
                        if (name === '_constructor') { name = 'constructor'; }
                        if (name === '_dispose') { name = 'dispose'; }
                        throw `${className}.${name} cannot override a sealed function.`;
                    }
    
                    // redefine
                    let base = _this[name].bind(_this);
                    Object.defineProperty(_this, name, {
                        value: function(...args) {
                            // run fn with base
                            let fnArgs = [base].concat(args);
                            if (isArrowFunction(fn)) {
                                return fn(...fnArgs);
                            } else { // normal func
                                return fn.apply(_this, fnArgs);
                            }
                        }.bind(_this)
                    });
                } else {
                    // duplicate check
                    if (isDefined(name)) { 
                        if (name === '_constructor') { name = 'constructor'; }
                        if (name === '_dispose') { name = 'dispose'; }
                        throw `${className}.${name} is already defined.`; 
                    }
    
                    // define
                    Object.defineProperty(_this, name, {
                        configurable: true,
                        enumerable: true,
                        writable: false,
                        value: function(...args) {
                            if (isArrowFunction(fn)) {
                                return fn(...args);
                            } else { // normal func
                                return fn.apply(_this, args);
                            }
                        }.bind(_this)
                    });
                }
    
                // apply attributes in order they are defined
                applyAttr(name);   
    
                // finally hold the references for reflector
                meta[name].ref = _this[name];
                meta[name].raw = fn;
            };
            _this.construct = (...args) => {
                _this.func.apply(_this, ['constructor'].concat(args));
            };
            _this.destruct = (...args) => {
                _this.func.apply(_this, ['dispose'].concat(args));
            };
            _this.prop = (name, valueOrGetter, setter) => {
                // special names
                if (isSpecialMember(name)) {  throw `${className}.${name} can only be defined as a function.`; }
    
                // default value
                if (typeof valueOrGetter === 'undefined' && typeof setter === 'undefined') { valueOrGetter = null; }
    
                // add mixed attr
                if (mixin_being_applied !== null) {
                    attr('mixed', mixin_being_applied);
                }
    
                // collect attributes
                meta[name] = [].concat(bucket);
                meta[name].type = 'prop';
                meta[name].aspects = [];
                meta[name].interfaces = [];
                bucket = [];
                let attrs = meta[name];
    
                // conditional check
                if (!isConditionalMemberOK(name)) {
                    delete meta[name]; return;
                }
            
                // define
                if (hasAttr('override', attrs)) {
                    // when overriding a property, it can only be redefined completely
                    // check
                    let desc = Object.getOwnPropertyDescriptor(_this, name);
                    if (!desc || typeof desc.get !== 'function') {
                        throw `Not a property to override. (${className}.${name})`;
                    }
                    if (hasAttrEx('sealed', name) && !hasAttr('sealed', attrs)) {
                        throw `Cannot override a sealed property. (${className}.${name})`;
                    }
                    if (hasAttrEx('static', name) && !hasAttr('static', attrs)) { 
                        throw `Cannot override a static property. (${className}.${name})`;
                    }
                } else {
                    // duplicate check
                    if (isDefined(name)) { throw `${className}.${name} is already defined.`; }
                }
    
                // define or redefine
                if (typeof valueOrGetter !== 'function') {
                    let propHost = null,
                        uniqueName = '',
                        isStorageHost = false;
                    if (hasAttrEx('static', name)) { 
                        uniqueName = name;
                        if (hasAttrEx('session', name) || hasAttrEx('state', name)) {
                            throw `A static property cannot be stored in session/state. (${className}.${name})`;
                        }
                        propHost = staticInterface;
                        if (!propHost[uniqueName]) { 
                            propHost[uniqueName] = valueOrGetter; // shared (static) copy
                        }
                    } else if (hasAttrEx('session', name)) {
                        if (!sessionStorage) {
                            throw `Session store (sessionStorage) is not available. (${className}.${name})`;
                        }
                        uniqueName = className + '_' + name;
                        propHost = sessionStorage;
                        isStorageHost = true;
                        if (typeof propHost[uniqueName] === 'undefined') {
                            propHost[uniqueName] = JSON.stringify({value: valueOrGetter}); 
                        }
                    } else if (hasAttrEx('state', name)) {
                        if (!sessionStorage) {
                            throw `State store (localStorage) is not available. (${className}.${name})`;
                        }
                        uniqueName = className + '_' + name;
                        propHost = localStorage;
                        isStorageHost = true;
                        if (typeof propHost[uniqueName] === 'undefined') {
                            propHost[uniqueName] = JSON.stringify({value: valueOrGetter});
                        }
                    } else {
                        uniqueName = name;
                        propHost = props;
                        propHost[uniqueName] = valueOrGetter; // private copy
                    }
                    Object.defineProperty(_this, name, {
                        __proto__: null,
                        configurable: true,
                        enumerable: true,
                        get: () => { 
                            if (isStorageHost) { 
                                return JSON.parse(propHost[uniqueName]).value;
                            } else {
                                return propHost[uniqueName]; 
                            }
                        },
                        set: hasAttr('readonly', attrs) ? (value) => {
                            if (_this._.constructing || (hasAttr('once', attrs) && !propHost[uniqueName])) {
                                if (isStorageHost) {
                                    propHost[uniqueName] = JSON.stringify({value: value});
                                } else {
                                    propHost[uniqueName] = value;
                                }
                            } else {
                                throw `${name} is readonly.`;
                            }
                        } : (value) => {
                            if (isStorageHost) { 
                                propHost[uniqueName] = JSON.stringify({value: value});
                            } else {
                                propHost[uniqueName] = value;
                            }
                        }                            
                    });
                } else {
                    if (hasAttr('static', attrs)) { throw `Static properties cannot be defined with a getter/setter. (${className}.${name})`; }
                    if (hasAttr('session', attrs) || hasAttr('state', attrs)) { throw `Properties defined with a getter/setter cannot be stored in session/state. (${className}.${name})`; }
                    Object.defineProperty(_this, name, {
                        __proto__: null,
                        configurable: true,
                        enumerable: true,
                        get: valueOrGetter,
                        set: hasAttr('readonly', attrs) ? (value) => { 
                            if (_this._.constructing || (hasAttr('once', attrs) && !valueOrGetter())) {
                                if (typeof setter === 'function') { setter(value); }
                            } else {
                                throw `${name} is readonly.`;
                            }
                        } : (value) => {
                            if (typeof setter === 'function') { setter(value); }
                        }
                    });
                }     
    
                // apply attributes in order they are defined
                applyAttr(name);
    
                // finally hold the reference for reflector
                meta[name].ref = {
                    get: () => { return _this[name]; },
                    set: (value) => { _this[name] = value; }
                };
            };
            _this.event = (name, argProcessor) => {
                // special names
                if (isSpecialMember(name)) {  throw `${className}.${name} can only be defined as a function.`; }
    
                // duplicate check
                if (isDefined(name)) { throw `${className}.${name} is already defined.`; }
    
                // add meta
                meta[name] = [];
                meta[name].type = 'event';  
                meta[name].aspects = [];
                meta[name].interfaces = [];
                
                // discard attributes
                if (bucket.length > 0) {
                    // eslint-disable-next-line no-console
                    console.warn(`Attributes can only be applied to properties or functions. ${className}.${name} is an event.`);
                    bucket = []; 
                }
    
                // define event
                let _event = function(...args) {
                    // preprocess args
                    let processedArgs = {};
                    if (typeof argProcessor === 'function') {
                        processedArgs = argProcessor(...args);
                    }
    
                    // define event arg
                    let e = {
                            name: name,
                            args: processedArgs,
                            stop: false
                        };
                    for(let handler of events) {
                        handler(e);
                        if (e.stop) { break; }
                    }
                }.bind(_this);
                _event.subscribe = (fn) => {
                    events.push(fn);
                };
                _event.subscribe.all = () => {
                    return events.slice();
                };
                _event.unsubscribe = (fn) => {
                    let index = events.indexOf(fn);
                    if (index !== -1) {
                        events.splice(index, 1);
                    }
                };
                _event.unsubscribe.all = () => {
                    events = [];
                };
                Object.defineProperty(_this, name, {
                    configurable: false,
                    enumerable: true,
                    value: _event,
                    writable: false
                });
    
                // finally hold the reference for reflector
                meta[name].ref = _this[name];
            };
            _this.noop = noop;
            _this.noopAsync = noopAsync;
    
            // attach instance reflector
            _this._ = _this._ || {};
            _this._.type = 'instance';
            _this._.name = className;
            _this._.id = guid();
            _this._.instanceOf = _this._.instanceOf || [];
            if (!inherits) {
                _this._.instanceOf.push({name: 'Object', type: Object, meta: [], mixins: [], interfaces: []});
            }
            _this._.instanceOf.push({name: className, type: Class, meta: meta, mixins: mixins, interfaces: interfaces});
            _this._.inherits = Class;
            _this._.isInstanceOf = (name) => {
                if (name._ && name._.name) { name = name._.name; } // TODO: Fix it 
                return (_this._.instanceOf.findIndex((item) => { return item.name === name; }) !== -1);
            };
            _this._.raw = (name) => {
                if (meta[name] && meta[name].raw) { return meta[name].raw; }
                return null;
            },
            _this._.isMixed = (name) => { // TODO: if any derived class is mixed with this, it should also be checked.
                if (name._ && name._.name) { name = name._.name; } // TODO: Fix it 
                let result = false;
                for (let item of _this._.instanceOf) {
                    for(let mixin of item.mixins) {
                        if (mixin._.name === name) {
                            result = true; break;
                        }
                        if (result) { break; }
                    }
                }
                return result;                    
            };
            _this._.isImplements = (name) => { // TODO: If any derived class imolements this interface, it should check that as well
                if (name._ && name._.name) { name = name._.name; } // TODO: Fix it 
                let result = false;
                for (let item of _this._.instanceOf) {
                    for(let _interface of item.interfaces) {
                        if (_interface._.name === name) {
                            result = true; break;
                        }
                        if (result) { break; }
                    }
                }
                return result;                    
            };
            _this._._ = {
                hasAttr: hasAttr,
                hasAttrEx: hasAttrEx,
                isOwnMember: isOwnMember,
                isDerivedMember: isDerivedMember,
                isProtectedMember: isProtectedMember,
                isSealedMember: isSealedMember,
                isSerializableMember: isSerializableMember
            };
            _this._.serialize = () => {
                let json = {};
                processJson(_this, json);
                return json;
            };
            _this._.deserialize = (json) => {
                processJson(json, _this, true);
            };
    
            // helper object that gets passed to factory
            // this itself is attr function, the most common use, and can be use as-is, attr(...)
            // but also can be used as hook to pass many more helpers, attr func being one of them, to support helper.attr(), helper.sumethingElse() type syntax
            const factoryHelper = attr;
            factoryHelper.attr = attr;        
    
            // construct using factory
            factory.apply(_this, [factoryHelper]);
    
            // abstract consideration
            if (_flag !== theFlag && isAbstractClass()) {
                throw `Cannot create instance of an abstract class. (${className})`;
            }
    
            // apply mixins
            if (mixins.length !== 0) {
                for(let mixin of mixins) {
                    if (mixin._.type === 'mixin') {
                        mixin_being_applied = mixin;
                        mixin.apply(_this, [factoryHelper]);
                        mixin_being_applied = null;
                    }
                }
            }
    
            // remove definition helpers
            delete _this.func;
            delete _this.construct;
            delete _this.destruct;
            delete _this.prop;
            delete _this.event;
            delete _this.noop;
            delete _this.noopAsync;
    
            // weave members with configured advises
            weave();
    
            // // top level class
            if (!isNeedProtected) { 
                // constructor
                if (typeof _this._constructor === 'function') {
                    _this._.constructing = true;
                    _this._constructor(...classArgs);
                    _this._.constructor = this._constructor;
                    delete _this._constructor;
                    delete _this._.constructing;
                }
    
                // dispose
                if (typeof _this._dispose === 'function') {
                    _this._.dispose = _this._dispose;
                    delete _this._dispose;
                }
            }
    
            // get exposable _this
            let isCopy = false;
            doCopy('_'); // '_' is a very special member
            for(let member in _this) {
                isCopy = false;
                if (_this.hasOwnProperty(member)) {
                    isCopy = true;
                    if (isOwnMember(member)) {
                        if (isPrivateMember(member)) { isCopy = false; }
                        if (isCopy && (isProtectedMember(member) && !isNeedProtected)) { isCopy = false; }
                    } else {  // some derived member (protected or public) OR some directly added member
                        if (isProtectedMember(member) && !isNeedProtected) { isCopy = false; }
                        if (isCopy && !isDerivedMember(member)) { isCopy = false; } // some directly added member
                    } 
                }
                if (isCopy && isHiddenMember(member)) { isCopy = false; }
                if (isCopy) { doCopy(member); }
            }
    
            // sealed attribute for properties and functions
            // are handled at the end
            for(let member in _exposed_this) {
                if (!isSpecialMember(member) && isOwnMember(member) && isSealedMember(member)) {
                    Object.defineProperty(_exposed_this, member, {
                        configurable: false
                    });
                }
            }
    
            // validate that all intefaces are implemeted on exposed_this
            if (interfaces.length !== 0) {
                for(let _interface of interfaces) {
                    for(let _memberName in _interface) {
                        if (_interface.hasOwnProperty(_memberName) && _memberName !== '_') {
                            let _member = _interface[_memberName],
                                _type = typeof _exposed_this[_memberName];
                            if (_type === 'undefined') { throw `${_interface._.name}.${_memberName} is not defined.`; }
                            switch(_member.type) {
                                case 'func':
                                    if (_type !== 'function') { throw `${_interface._.name}.${_memberName} is not a function.`; } 
                                    if (meta[_memberName].interfaces.indexOf(_interface) === -1) { meta[_memberName].interfaces.push(_interface); }
                                    break;
                                case 'prop':
                                    if (_type === 'function') { throw `${_interface._.name}.${_memberName} is not a property.`; }
                                    if (meta[_memberName].interfaces.indexOf(_interface) === -1) { meta[_memberName].interfaces.push(_interface); }
                                    break;
                                case 'event':
                                    if (_type !== 'function' || typeof _exposed_this[_memberName].subscribe !== 'function') { throw `${_interface._.name}.${_memberName} is not an event.`; }
                                    if (meta[_memberName].interfaces.indexOf(_interface) === -1) { meta[_memberName].interfaces.push(_interface); }
                                    break;
                            }
                        }
                    }
                }
            }
    
            // public and (protected+private) instance interface
            _this._.pu = (isNeedProtected ? null : _exposed_this);
            _this._.pr = (isNeedProtected ? null : _this);
    
            // singleton
            if (isSingletonClass()) { // store for next use
                Class._.isSingleton = () => { return true; };
                Class._.singleInstance = () => { return Object.freeze(_exposed_this); }; // assume it sealed as well
                Class._.singleInstance.clear = () => { 
                    Class._.singleInstance = () => { return null; };
                    Class._.isSingleton = () => { return false; };
                };
                return Class._.singleInstance();
            } else {
                if (isSealedMember('_constructor')) { // sealed class consideration
                    Class._.isSealed = () => { return true; };
                    return Object.freeze(_exposed_this);
                } else {
                    return _exposed_this;
                }
            }
        };
    
        // attach class reflector
        Class._ = {
            inherits: inherits,
            mixins: mixins,
            interfaces: interfaces,
            name: className,
            type: 'class',
            namespace: null,
            singleInstance: () => { return null; },
            isSingleton: () => { return false; },
            isSealed: () => { return false; },
            isDerivedFrom: (name) => {
                if (name._ && name._.name) { name = name._.name; } // TODO: Fix it 
                let result = (name === 'Object'),
                    prv = inherits;
                if (!result) {
                    // eslint-disable-next-line no-constant-condition
                    while(true) {
                        if (prv === null) { break; }
                        if (prv._.name === name) { result = true; break; }
                        prv = prv._.inherits;
                    }
                }
                return result;
            },
            isMixed: (name) => { // TODO: if any parent class is mixed with this, it should also be checked.
                if (name._ && name._.name) { name = name._.name; } // TODO: Fix it 
                let result = false;
                for(let mixin of mixins) {
                    if (mixin._.name === name) {
                        result = true; break;
                    }
                }
                return result;                    
            },
            isImplements: (name) => { // TODO: if any parent class is mixed with this, it should also be checked.
                if (name._ && name._.name) { name = name._.name; } // TODO: Fix it 
                let result = false;
                for(let _interface of interfaces) {
                    if (_interface._.name === name) {
                        result = true; break;
                    }
                }
                return result;                    
            },
            static: {}
        };
        Class._.singleInstance.clear = () => { }; // no operation
    
        // register type with namespace
        flair.Namespace(Class);
    
        // return
        return Class;
    };
    
    // add to members list
    flair.members.push('Class');
    // Mixin
    // Mixin(mixinName, function() {})
    flair.Mixin = (mixinName, factory) => {
        // add name
        factory._ = {
            name: mixinName,
            type: 'mixin',
            namespace: null        
        };
    // TODO: check that mixin either can be defined as structure or should have at least basic class definition approach or allow mixing classes itself
    
    
        // register type with namespace
        flair.Namespace(factory);
    
        // return
        return factory;
    };
    
    // add to members list
    flair.members.push('Mixin');
    // Interface
    // Interface(interfaceName, function() {})
    flair.Interface = (interfaceName, factory) => {
        let meta = {},
            _this = {};
    
        // definition helpers
        const isSpecialMember = (member) => {
            return ['constructor', 'dispose', '_constructor', '_dispose', '_'].indexOf(member) !== -1;
        };     
        _this.func = (name) => {
            if (typeof meta[name] !== 'undefined') { throw `${interfaceName}.${name} is already defined.`; }
            if (isSpecialMember(name)) { throw `${interfaceName}.${name} can only be defined for a class.`; }
            meta[name] = [];
            meta[name].type = 'func';
        };
        _this.prop = (name) => {
            if (typeof meta[name] !== 'undefined') { throw `${interfaceName}.${name} is already defined.`; }
            if (isSpecialMember(name)) { throw `${interfaceName}.${name} can only be defined as a function for a class.`; }
            meta[name] = [];
            meta[name].type = 'prop';
        };
        _this.event = (name) => {
            if (typeof meta[name] !== 'undefined') { throw `${interfaceName}.${name} is already defined.`; }
            if (isSpecialMember(name)) { throw `${interfaceName}.${name} can only be defined as a function for a class.`; }
            meta[name] = [];
            meta[name].type = 'event';
        };
    
        // add name
        meta._ = {
            name: interfaceName,
            type: 'interface',
            namespace: null        
        };
    
        // register type with namespace
        flair.Namespace(meta);
    
        // run factory
        factory.apply(_this);
    
        // remove definition helpers
        delete _this.func;
        delete _this.prop;
        delete _this.event;
    
        // return
        return meta;
    };
    
    // add to members list
    flair.members.push('Interface');
    // Enum
    // Enum(name, def)
    //  name: name of the enum
    //  def: object with key/values or an array of values
    flair.Enum = (name, data) => {
        'use strict';
    
        // args validation
        if (!(typeof data === 'object' || Array.isArray(data))) { throw flair.Exception('ENUM01', 'Invalid enum data.'); }
    
        // enum type
        let _Enum = data;
        if (Array.isArray(data)) {
            let i = 0,
                _Enum = {};
            for(let value of data) {
                _Enum[i] = value; i++;
            }
        } 
    
        // meta extensions
        let mex = {
            keys: () => {
                let keys = [];
                for(let key in _Enum) {
                    if (_Enum.hasOwnProperty(key) && key !== '_') {
                        keys.push(key);
                    }
                }
                return keys;
            },
            values: () => {
                let values = [];
                for(let key in _Enum) {
                    if (_Enum.hasOwnProperty(key) && key !== '_') {
                        values.push(_Enum[key]);
                    }
                }
                return values;
            }
        };
    
        // return
        return flarized('enum', name, _Enum, mex);
    };
    flair.Enum.getKeys = (obj) => {
        try {
            return obj._.keys();
        } catch (e) {
            throw flair.Exception('ENUM02', 'Object is not an Enum.', e);
        }
    };
    flair.Enum.getValues = (obj) => {
        try {
            return obj._.values();
        } catch (e) {
            throw flair.Exception('ENUM02', 'Object is not an Enum.', e);
        }
    };
    flair.Enum.isDefined = (obj, keyOrValue) => {
        return (flair.Enum.getKeys().indexOf(keyOrValue) !== -1 || flair.Enum.getValues().indexOf(keyOrValue) !== -1);
    };
    
    // add to members list
    flair.members.push('Enum');
    // Proc
    // Proc(procName, fn)
    flair.Proc = (procName, isASync, fn) => {
        if (typeof isASync === 'function') {
            fn = isASync;
            isASync = false;
        }
        let _fn = fn;
        _fn.isASync = () => { return isASync; };
        _fn._ = {
            name: procName,
            type: 'proc',
            namespace: null,        
            invoke: (...args) => {
                fn(...args);
            }
        };
    
        // register type with namespace
        flair.Namespace(_fn);
    
        // return
        return Object.freeze(_fn);
    };
    
    
    // Resource
    // Resource(resName, resFile)
    flair.Resource = (resName, resFile, data) => {
        const b64EncodeUnicode = (str) => { // eslint-disable-line no-unused-vars
            // first we use encodeURIComponent to get percent-encoded UTF-8,
            // then we convert the percent encodings into raw bytes which
            // can be fed into btoa.
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
                function toSolidBytes(match, p1) {
                    return String.fromCharCode('0x' + p1);
            }));
        };
        const b64DecodeUnicode = (str) => {
            // Going backwards: from bytestream, to percent-encoding, to original string.
            return decodeURIComponent(atob(str).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
        };
        
        let resData = data; // data is base64 encoded string, added by build engine
        let resType = resFile.substr(resFile.lastIndexOf('.') + 1).toLowerCase(),
            textTypes = ['txt', 'xml', 'js', 'json', 'md', 'css', 'html', 'svg'];
        
        // decode
        if (textTypes.indexOf(resType) !== -1) { // text
            if (flair.options.env.isServer) {
                let buff = new Buffer(resData).toString('base64');
                resData = buff.toString('utf8');
            } else { // client
                resData = b64DecodeUnicode(resData); 
            }
        } else { // binary
            if (flair.options.env.isServer) {
                resData = new Buffer(resData).toString('base64');
            } else { // client
                // no change, leave it as is
            }        
        }
    
        let _res = {
            file: () => { return resFile; },
            type: () => { return resType; },
            get: () => { return resData; },
            load: (...args) => {
                if (flair.options.env.isClient) {
                    if (!_res._.isLoaded) {
                        _res._.isLoaded = true;
                        if (['gif', 'jpeg', 'jpg', 'png'].indexOf(resType) !== -1) { // image types
                            // args:    node
                            let node = args[0];
                            if (node) {
                                let image = new Image();
                                image.src = 'data:image/png;base64,' + data; // use base64 version itself
                                node.appendChild(image);
                                _res._.isLoaded = true;
                            }
                        } else { // css, js, html or others
                            let css, js, node, position = null;
                            switch(resType) {
                                case 'css':     // args: ()
                                    css = flair.options.env.global.document.createElement('style');
                                    css.type = 'text/css';
                                    css.name = resFile;
                                    css.innerHTML = resData;
                                    flair.options.env.global.document.head.appendChild(css);
                                    break;
                                case 'js':      // args: (callback)
                                    js = flair.options.env.global.document.createElement('script');
                                    js.type = 'text/javascript';
                                    js.name = resFile;
                                    js.src = resData;
                                    if (typeof cb === 'function') {
                                        js.onload = args[0]; // callback
                                        js.onerror = () => { _res._.isLoaded = false; }
                                    }
                                    flair.options.env.global.document.head.appendChild(js);
                                    break;           
                                case 'html':    // args: (node, position)
                                    // position can be: https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
                                    // if empty, it will replace node html
                                    node = args[0];
                                    position = args[1] || '';
                                    if (node) {
                                        if (position) {
                                            node.innerHTML = resData;
                                        } else {
                                            node.insertAdjacentHTML(position, resData);
                                        }
                                    }
                                    break;
                                default:
                                    // load not supported for all other types
                                    break;
                            }
                        }
                    }
                }
                return _res._.isLoaded;
            }
        };
        _res._ = {
            name: resName,
            type: 'resource',
            namespace: null,
            file: resFile,
            isLoaded: false,
            data: () => { return resData; }
        };
    
        // set json 
        _res.JSON = null;
        if (_res.type() === 'json') {
            try {
                _res.JSON = Object.freeze(JSON.parse(resData));
            } catch (e) {
                // ignore
            }
        }
    
        // register type with namespace
        flair.Namespace(_res);
    
        // return
        return Object.freeze(_res);
    };
    flair.Resource.get = (resName) => {
        let resObj = flair.Namespace.getType(resName);
        if (resObj._ && resObj._.type === 'resource') {
           return resObj.get();
        }
        return null;
    };
    
    // Structure
    // Structure(name, factory)
    //  name: name of the structure
    //  factory: factory function that take constructor arguments
    flair.Structure = (name, factory) => {
        'use strict';
    
        // args validation
        if (typeof factory !== 'function') { throw flair.Exception('STRU01', 'Invalid structure definition type.'); }
    
    
        // structure type
        let _Structure = function(...args) {
            let _obj = {};
    
            // construct structure using factory
            factory.apply(_obj, ...args);
    
            // object meta extensions
            let mex = {
                inherits: _Structure,
                isInstanceOf: (nm) => {
                    if (nm._ && nm._.name) { nm = nm._.name; } // TODO: fix
                    return _Structure._.name === nm;
                }
            };
    
            // return flarized
            return flarizedInstance('sinstance', _obj, mex);
        };
    
        // meta extensions
        let mex = {};
    
        // return
        return flarized('structure', name, _Structure, mex)
    };
    
    // add to members list
    flair.members.push('Structure');
    /**
     * @name using
     * @description Ensures the dispose of the given object instance is called, even if there was an error 
     *              in executing processor function
     * @example
     *  using(obj, fn)
     * @params
     *  obj: object - object that needs to be processed by processor function
     *                If a disposer is not defined for the object, it will not do anything
     *  fn: function - processor function
     * @returns any - returns anything that is returned by processor function, it may also be a promise
     * @throws
     *  InvalidArgumentException
     *  Any exception that is raised in given function, is passed as is
     */ 
    flair.using = (obj, fn) => {
        if (_typeOf(obj) !== 'instance') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
        if (_typeOf(fn) !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (fn)'); }
    
        let result = null,
            isDone = false,
            isPromiseReturned = false,
            doDispose = () => {
                if (!isDone && typeof obj._.dispose === 'function') {
                    isDone = true; obj._.dispose();
                }
            };
        try {
            result = fn(obj);
            if(result && typeof result.finally === 'function') { // a promise is returned
                isPromiseReturned = true;
                result = result.finally((args) => {
                    doDispose();
                    return args;
                });
            }
        } finally {
            if (!isPromiseReturned) { doDispose(); }
        }
    
        // return
        return result;
    };
    
    // add to members list
    flair.members.push('using');
    /**
     * @name as
     * @description Checks if given object can be consumed as an instance of given type
     * @example
     *  as(obj, type)
     * @params
     *  obj: object - object that needs to be checked
     *  type: string OR type - type to be checked for, it can be following:
     *                         > expected native javascript data types like 'string', 'number', 'function', 'array', 'date', etc.
     *                         > any 'flair' object or type
     *                         > inbuilt flair object types like 'class', 'structure', 'enum', etc.
     *                         > custom flair object instance types which are checked in following order:
     *                           >> for class instances: 
     *                              isInstanceOf given as type
     *                              isImplements given as interface 
     *                              isMixed given as mixin
     *                           >> for structure instances:
     *                              isInstance of given as structure type
     * @returns object - if can be used as specified type, return same object, else null
     * @throws
     *  InvalidArgumentException
     */ 
    flair.as = (obj, type) => {
        if (_is(obj, type)) { return obj; }
        return null;
    };
    
    // add to members list
    flair.members.push('as');
    /**
     * @name typeOf
     * @description Finds the type of given object
     * @example
     *  typeOf(obj)
     * @params
     *  obj: object - object that needs to be checked
     * @returns string - type of the given object
     *                   it can be following:
     *                    > expected native javascript data types like 'string', 'number', 'function', 'array', 'date', etc.
     *                    > inbuilt flair object types like 'class', 'structure', 'enum', etc.
     * @throws
     *  None
     */ 
    flair.typeOf = _typeOf;
    
    // add to members list
    flair.members.push('typeOf');
    /**
     * @name is
     * @description Checks if given object is of a given type
     * @example
     *  is(obj, type)
     * @params
     *  obj: object - object that needs to be checked
     *  type: string OR type - type to be checked for, it can be following:
     *                         > expected native javascript data types like 'string', 'number', 'function', 'array', 'date', etc.
     *                         > any 'flair' object or type
     *                         > inbuilt flair object types like 'class', 'structure', 'enum', etc.
     *                         > custom flair object instance types which are checked in following order:
     *                           >> for class instances: 
     *                              isInstanceOf given as type
     *                              isImplements given as interface 
     *                              isMixed given as mixin
     *                           >> for structure instances:
     *                              isInstance of given as structure type
     * @returns boolean - true/false
     * @throws
     *  InvalidArgumentException
     */ 
    flair.is = _is;
    
    // add to members list
    flair.members.push('is');
    /**
     * @name isDerivedFrom
     * @description Checks if given flair class type is derived from given class type, directly or indirectly
     * @example
     *  isDerivedFrom(type, parent)
     * @params
     *  type: class - flair class type that needs to be checked
     *  parent: string OR class - class type to be checked for being in parent hierarchy, it can be following:
     *                            > fully qualified class type name
     *                            > class type reference
     * @returns boolean - true/false
     * @throws
     *  InvalidArgumentException
     */ 
    flair.isDerivedFrom = _is.derivedFrom;
    
    // add to members list
    flair.members.push('isDerivedFrom');
    
    /**
     * @name isImplements
     * @description Checks if given flair class instance or class implements given interface
     * @example
     *  isImplements(obj, intf)
     * @params
     *  obj: object - flair object that needs to be checked
     *  intf: string OR interface - interface to be checked for, it can be following:
     *                              > fully qualified interface name
     *                              > interface type reference
     * @returns boolean - true/false
     * @throws
     *  InvalidArgumentException
     */ 
    flair.isImplements = _is.implements;
    
    // add to members list
    flair.members.push('isImplements');
    /**
     * @name isInstanceOf
     * @description Checks if given flair class/structure instance is an instance of given class/structure type or
     *              if given class instance implements given interface or has given mixin mixed somewhere in class 
     *              hierarchy
     * @example
     *  isInstanceOf(obj, type)
     * @params
     *  obj: object - flair object that needs to be checked
     *  type: string OR class OR structure OR interface OR mixin - type to be checked for, it can be following:
     *                         > fully qualified type name
     *                         > type reference
     * @returns boolean - true/false
     * @throws
     *  InvalidArgumentException
     */ 
    flair.isInstanceOf = _is.instanceOf;
    
    // add to members list
    flair.members.push('isInstanceOf');
    /**
     * @name isMixed
     * @description Checks if given flair class instance or class has mixed with given mixin
     * @example
     *  isMixed(obj, mixin)
     * @params
     *  obj: object - flair object that needs to be checked
     *  mixin: string OR mixin - mixin to be checked for, it can be following:
     *                           > fully qualified mixin name
     *                           > mixin type reference
     * @returns boolean - true/false
     * @throws
     *  InvalidArgumentException
     */ 
    flair.isMixed = _is.mixed;
    
    // add to members list
    flair.members.push('isMixed');
    let container = {};
    
    /**
     * @name Container
     * @description Returns registered types associated with given alias
     * @example
     *  Container(alias)
     *  Container(alias, isAll)
     * @params
     *  alias: string - name of alias to return registered items for
     *  isAll: boolean - whether to return all items or only first item
     * @returns array/item - depending upon the value of isAll, return only first or all registered items
     *                        returns null, if nothing is registered for given alias
     * @throws
     *  InvalidArgumentException
     */ 
    flair.Container = (alias, isAll) => {
        if (typeof alias !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (alias)'); }
        if (isAll) {
            return (container[alias] || []).slice();
        } else {
            if (container[alias] && container[alias].length > 0) {
                return container[alias][0];
            } else {
                return null;
            }
        }
    };
    
    /**
     * @name isRegistered
     * @description Checks if given alias is registered with container
     * @example
     *  isRegistered(alias)
     * @params
     *  alias: string - name of alias to check
     * @returns boolean - true/false
     * @throws
     *  InvalidArgumentException
     */ 
    flair.Container.isRegistered = (alias) => {
        if (typeof alias !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (alias)'); }
        return (typeof container[alias] !== 'undefined' &&  container[alias].length > 0);
    };
    
    /**
     * @name register
     * @description Register an actual type object OR a qualified name of a type OR a file, to resolve against given alias
     * @example
     *  register(alias, type)
     * @params
     *  alias: string - name of alias to register given type or qualified name
     *  type: object/string - it can be following:
     *      object - actual flair type or any non-primitive object
     *      string - qualified name of flair type OR path/name of a .js/.mjs file
     *      
     *      NOTE: Each type definition can also be defined for contextual consideration as:
     *      '<typeA> | <typeB>'
     *      when running on server, <typeA> would be considered, and when running on client <typeB> will be used* 
     * @returns boolean - true/false
     * @throws
     *  InvalidArgumentException
     *  UnsupportedTypeException
     */ 
    flair.Container.register = (alias, type) => {
        if (typeof alias !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is not valid. (alias)'); }
        if (!type) { throw new _Exception('InvalidArgument', 'Argument type is not valid. (type)'); }
    
        // get what is being registered
        if (_is(type, 'flair')) {
            // flair type
        } else if (typeof type === 'object') {
            // some object
        } else if (typeof type === 'string') {
            // get contextual type for Server/Client scenario
            type = which(type);
    
            if (type.endsWith('.js') || type.endsWith('.mjs')) { 
                // its a JS file
            } else { 
                // qualified name
                // or it can be some other type of file as well like css, jpeg, anything and it is allowed
            }
        } else { // unknown type
            throw new _Exception('UnsupportedType', `Type is not supported. (${_typeOf(type)})`);
        }
    
        // register
        if (!container[alias]) { container[alias] = []; }
        container[alias].push(type);
    
        // return
        return true;
    };
    
    /**
     * @name resolve
     * @description Returns registered type(s) or associated with given alias
     * @example
     *  resolve(alias)
     *  resolve(alias, isMultiResolve)
     *  resolve(alias, isMultiResolve, ...args)
     * @params
     *  alias: string - name of alias to resolve
     *  isMultiResolve: boolean - should it resolve with all registered types or only first registered
     *  args: any - any number of arguments to pass to instance created for registered class or structure type
     * @returns array - having list of resolved types, qualified names or urls or created instances
     * @throws
     *  InvalidArgumentException
     *  Any exception that is generated by constructor while creating instance of a Type is passed as is
     */ 
    flair.Container.resolve = (alias, isMultiResolve, ...args) => {
        if (typeof alias !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is not valid. (alias)'); }
        if (typeof isMultiResolve !== 'boolean') { throw new _Exception('InvalidArgument', 'Argument type is not valid. (isMultiResolve)'); }
    
        let result = null,
            getResolvedObject = (Type) => {
                let obj = Type; // whatever it was
                if (typeof Type === 'string') {
                    if (Type.endsWith('.js') || Type.endsWith('.mjs')) { 
                        // file, leave it as is
                    } else { // try to resolve it from a loaded type
                        let _Type = flair.Namespace.getType(Type); 
                        if (_Type) { Type = _Type; }
                    }
                }
    
                if (['class', 'structure'].indexOf(_typeOf(Type)) !== -1) { // only class and structure need a new instance
                    if (args) {
                        obj = new Type(...args); 
                    } else {
                        obj = new Type(); 
                    }
                }
                return obj;
            };
        
        if (container[alias] && container[alias].length > 0) {
            if (isMultiResolve) {
                result = [];
                for(let Type of container[alias]) {
                    result.push(getResolvedObject(Type));
                }
            } else {
                let Type = container[alias][0]; // pick first
                result = getResolvedObject(Type);
            }
        }
    
        // resolved
        return result;
    };
    
    // reset api
    flair.Container._ = {
        reset: () => { container = {}; }
    };
    
    // add to members list
    flair.members.push('Container');
    // Attribute
    flair.Attribute = flair.Class('Attribute', function(attr) {
        let decoratorFn = null;
        
        attr('abstract');
        this.construct((...args) => {
            // args can be static or dynamic or settings
            // static ones are defined just as is, e.g.,
            //  ('text', 012, false, Reference)
            // dynamic ones are defined as special string
            //  ('[publicPropOrFuncName]', 012, false, Reference)
            // when string is defined as '[...]', this argument is replaced by a 
            // function which can be called (with binded this) to get dynamic value of the argument
            // the publicPropName is the name of a public property or function
            // name of the same object where this attribute is applied
            // settings ones are defined as another special string
            this.args = [];
            for(let arg of args) {
                if (typeof arg === 'string') {
                    if (arg.startsWith('[') && arg.endsWith(']')) {
                        let fnName = arg.replace('[', '').replace(']', ''),
                            fn = function() {
                                let member = this[fnName]; // 'this' would change because of binding call when this function is called
                                if (typeof member === 'function') {
                                    return member();
                                } else {
                                    return member;
                                }
                            };
                            this.args.push(fn);
                    } else {
                        this.args.push(arg);
                    }
                } else {
                    this.args.push(arg);
                }
            }
        });
        
        this.prop('args', []);
        this.func('decorator', (fn) => {
            if (typeof fn === 'function') {
                decoratorFn = fn;
            }
            return decoratorFn;
        });
        this.func('resetEventInterface', (source, target) => {
            target.subscribe = source.subscribe;
            target.unsubscribe = source.unsubscribe;
            delete source.subscribe;
            delete source.unsubscribe;
        });
    });
    
    // async
    // async() 
    flair.Container.register('async', flair.Class('async', flair.Attribute, function() {
        this.decorator((obj, type, name, descriptor) => {
            // validate
            if (['func'].indexOf(type) === -1) { throw `async attribute cannot be applied on ${type} members.`; }
            if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `async attribute cannot be applied on special function.`; }
    
            // decorate
            let fn = descriptor.value;
            descriptor.value = function(...args) {
                return new Promise((resolve, reject) => {
                    let fnArgs = [resolve, reject].concat(args);
                    fn(...fnArgs);
                });
            }.bind(obj);
        });
    }));
    
    // deprecate
    // deprecate([message])
    //  - message: any custom message
    flair.Container.register('deprecate', flair.Class('deprecate', flair.Attribute, function() {
        this.decorator((obj, type, name, descriptor) => {
            // validate
            if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `deprecate attribute cannot be applied on special function.`; }
    
            // decorate
            let msg = `${name} is deprecated.`;
            let _get, _set, fn, ev = null;
            if (typeof this.args[0] !== 'undefined') { msg += ' ' + this.args[0] }
            switch(type) {
                case 'prop':
                    if (descriptor.get) {
                        _get = descriptor.get;                                
                        descriptor.get = function() {
                            // eslint-disable-next-line no-console
                            console.warn(msg);
                            return _get();
                        }.bind(obj);
                    }
                    if (descriptor.set) {
                        _set = descriptor.set;
                        descriptor.set = function(value) {
                            // eslint-disable-next-line no-console
                            console.warn(msg);
                            return _set(value);
                        }.bind(obj);
                    }   
                    break;
                case 'func':
                    fn = descriptor.value;
                    descriptor.value = function(...args) {
                        // eslint-disable-next-line no-console
                        console.warn(msg);
                        fn(...args);
                    }.bind(obj);
                    break;
                case 'event':
                    ev = descriptor.value;
                    descriptor.value = function(...args) {
                        // eslint-disable-next-line no-console
                        console.warn(msg);
                            ev(...args);
                    }.bind(obj);
                    this.resetEventInterface(fn, descriptor.value);
                    break;
            }
        });
    }));
    
    // enumerate
    // enumerate(flag)
    //  - flag: true/false
    flair.Container.register('enumerate', flair.Class('enumerate', flair.Attribute, function() {
        this.decorator((obj, type, name, descriptor) => {
            // validate
            if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `enumerate attribute cannot be applied on special function.`; }
    
            // decorate
            let flag = this.args[0];
            descriptor.enumerable = flag;
        });
    }));
    
    let incCycle = [];
    /**
     * @name include
     * @description Fetch, load and/or resolve an external dependency for required context
     * @example
     *  include(deps, fn)
     * @params
     *  deps: array - array of strings, each defining a dependency to fetch/load or resolve
     *      >> each dep definition string should be defined using following syntax:
     *          'name: definition'
     *          e.g., fs: fs OR MyClass: my.namespace.MyClass
     * 
     *          >> Each definition can take following form:
     *          >> <namespace>.<name>
     *              >> e.g., 'my.namespace.MyClass'
     *              >> this will be looked in given namespace first, so an already loaded type will be picked first
     *              >> if not found in given namespace, it will look for the assembly where this type might be registered
     *              >> if found in a registered assembly, it will load that assembly and again look for it in given namespace
     *          >> [<name>]
     *              >> e.g., '[IBase]'
     *              >> this can be a registered alias to any type and is resolved via DI container
     *              >> if resolved type is an string, it will again pass through <namespace>.<name> resolution process
     *          >> <name>
     *              >> e.g., 'fs'
     *              >> this can be a NodeJS module name (on server side) or a JavaScript module name (on client side)
     *              >> it will be loaded using configured moduleLoaderFn
     *              >> if no moduleLoaderFn is configured, it will throw an error if could not be resolved using default module loaders
     *          >> <path>/<file>.js|.mjs
     *              >> e.g., '/my/path/somefile.js'
     *              >> this can be a bare file to load to, it will be resolved using configured fileLoaderFn
     *              >> path is always treated in context of the root path - full, relative paths from current place are not supported
     *              >> to handle PRODUCTION and DEBUG scenarios automatically, use <path>/<file>{.min}.js|.mjs format. 
     *              >> it PROD symbol is available, it will use it as <path>/<file>.min.js otherwise it will use <path>/<file>.js
     *          >> <path>/<file.css|json|html|...>
     *              >> e.g., '/my/path/somefile.css'
     *              >>  if ths is not a js|mjs file, it will treat it as a resource file and will use fetch/require, as applicable
     *      
     *          NOTE: Each dep definition can also be defined for contextual consideration as:
     *          '<depA> | <depB>'
     *          when running on server, <depA> would be considered, and when running on client <depB> will be used
     * 
     *          IMPORTANT: Each dependency is resolved with a Resolved Object
     *  fn: function - function where to pass resolved dependencies
     *          >> this func is passed an extractor function (generally named as deps) and if there was any error in deps definitions
     *           (<name>) returns null if failed or not defined, or the dependency, if loaded
     *           (<name>, true) returns dependency or throw actual exception that caused dependency load to fail
     * @returns void
     * @throws
     *  None
     */ 
    flair.include = (deps, fn) => {
        let _depsType = _typeOf(deps),
            _depsError = null;
        if (_depsType !== 'string' && _depsType !== 'array') { _depsError = new _Exception('InvalidArgument', 'Argument type is invalid. (deps)'); }
        if (!_depsError && _depsType === 'string') { deps = [deps]; }
        if (!_depsError && typeof fn !== 'function') { _depsError = new _Exception('InvalidArgument', 'Argument type is invalid. (fn)'); }
    
        let resolvedItems = {},
            _deps = (_depsError ? null : deps.slice());
    
        let loader = (isServer, isModule, file) => {
            let loaders = flair.options.loaders,
                loaderOverrides = flair.options.loaderOverrides,
                loader = null;
            return new Promise((resolve, reject) => {
                let ext = file.substr(file.lastIndexOf('.') + 1).toLowerCase();
                if (isServer) {
                    if (isModule) {
                        loader = loaders.module.server || loaderOverrides.moduleLoaderServer || null;
                        if (typeof loader === 'function') {
                            loader(file).then(resolve).catch(reject);
                        } else {
                            try {
                                resolve(require(file));
                            } catch(e) {
                                reject(e);
                            }
                        }
                    } else { // file
                        loader = loaders.file.server || loaderOverrides.fileLoaderServer || null;
                        if (typeof loader === 'function') {
                            loader(file).then(resolve).catch(reject);
                        } else {
                            try {
                                let httpOrhttps = null,
                                    body = '';
                                if (file.startsWith('https')) {
                                    httpOrhttps = require('https');
                                } else {
                                    httpOrhttps = require('http'); // for urls where it is not defined
                                }
                                httpOrhttps.get(file, (resp) => {
                                    resp.on('data', (chunk) => { body += chunk; });
                                    resp.on('end', () => { 
                                        if (ext === 'json') { 
                                            resolve(JSON.parse(body));
                                        } else {
                                            resolve(body);
                                        }
                                    });
                                }).on('error', reject);
                            } catch(e) {
                                reject(e);
                            }
                        }
                    }
                } else { // client
                    if (isModule) {
                        loader = loaders.module.client || loaderOverrides.moduleLoaderClient || null;
                        if (typeof loader === 'function') {
                            loader(file).then(resolve).catch(reject);
                        } else { 
                            try {
                                if (typeof require !== 'undefined') { // if requirejs type library having require() is available to load modules / files on client
                                    require([file], resolve, reject);
                                } else { // load it as file on browser, this could be a problem for module types // TODO: this needs to be changed, when there is a case
                                    let js = flair.options.env.global.document.createElement('script');
                                    js.type = 'text/javascript';
                                    js.name = file;
                                    js.src = file;
                                    js.onload = resolve;
                                    js.onerror = reject;
                                    flair.options.env.global.document.head.appendChild(js);
                                }
                            } catch(e) {
                                reject(e);
                            }
                        }
                    } else { // file
                        loader = loaders.file.client || loaderOverrides.fileLoaderClient || null;
                        if (typeof loader === 'function') {
                            loader(file).then(resolve).catch(reject);
                        } else {
                            fetch(file).then((response) => {
                                if (response.status !== 200) {
                                    reject(response.status);
                                } else {
                                    if (ext === 'json') { // special case of JSON
                                        response.json().then(resolve).catch(reject);
                                    } else {
                                        resolve(response.text());
                                    }
                                }
                            }).catch(reject);
                        }                    
                    }
                }
            });
        };
    
        /**
         * @description Dependency extractor function that helps in extracting dependencies by name
         * @example
         *  (name)
         *  (name, isThrow)
         * @params
         *  name: string - name of the dependency to extract
         *  isThrow: bool - if dependency could not be loaded, whether to re-throw the actual exception that made it failed to load
         * @returns dependency object or null
         */
        let _dep_extract = (name, isThrow) => {
            if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is not valid. (name)'); }
            if (!resolvedItems[name]) { throw new _Exception('InvalidName', `Given name is not valid. (${name})`); }
            if (resolvedItems[name].error && isThrow) { throw resolvedItems[name].error; }
            return resolvedItems[name].dep;
        };
    
        let processedAll = () => {
            if (typeof fn === 'function') {
                fn(_dep_extract, _depsError); 
            }
        };
    
        let resolveNext = () => {
            if (_depsError || _deps.length === 0) {
                processedAll(); return;
            } else {
                let _dep = _deps.shift().trim(),
                    _depName = '',
                    _resolved = null,
                    _error = null;
    
                // get dep name
                if (_dep === '') { _depsError = new _Exception('InvalidArgument', `Argument type is invalid. (deps)`); processedAll(); return; }
                let _items = _dep.split(':');
                if (_items.length !== 2) { _depsError = new _Exception('InvalidArgument', `Argument type is invalid. (${_dep})`); processedAll(); return; }
                _depName = _items[0].trim();
                _dep = _items[1].trim();
                if (resolvedItems[_depName]) { _depsError = new _Exception('DuplicateName', `Duplicate names are not allowed. (${_depName})`); processedAll(); return; }
                resolvedItems[_depName] = {
                    error: null,
                    dep: null
                };
    
                // pick contextual dep
                _dep = which(_dep);
    
                // check if this is an alias registered on DI container
                let option1 = (done) => {
                    if (_dep.startsWith('[') && _dep.endsWith(']') && _dep.indexOf('.') === -1) {
                        let _dep2 = _dep.substr(1, _dep.length -2).trim(); // remove [ and ]
                        if (flair.Container.isRegistered(_dep2)) {
                            _resolved = flair.Container(_dep2); // first registered item
                            if (typeof _resolved === 'string') { // this was an alias to something else, treat it as not resolved
                                _dep = _resolved; // instead continue resolving with this new redirected _dep 
                                _resolved = null;
                            }
                        }
                    }
                    done();
                };            
    
                // check if it is available in any namespace
                let option2 = (done) => {
                    _resolved = flair.Namespace.getType(_dep); done();
                };
    
                // check if it is available in any unloaded assembly
                let option3 = (done) => {
                    let asm = flair.Assembly.get(_dep);
                    if (asm) { // if type exists in an assembly
                        if (!asm.isLoaded()) {
                            asm.load().then(() => {
                                _resolved = flair.Namespace.getType(_dep); done();
                            }).catch((e) => {
                                _error = new _Exception('AssemblyLoad', `Assembly load operation failed with error: ${e}. (${asm.file()})`); done();
                            });
                        } else {
                            _resolved = flair.Namespace.getType(_dep); done();
                        }
                    } else {
                        done();
                    }
                };
    
                // check if this is a file
                let option4 = (done) => {
                    let ext = _dep.substr(_dep.lastIndexOf('.') + 1).toLowerCase();
                    if (ext) {
                        if (ext === 'js' || ext === 'mjs') {
                            // pick contextual file for DEBUG/PROD
                            _dep = which(_dep, true);
                            
                            // this will be loaded as module in next option as a module
                            done();
                        } else { // some other file (could be json, css, html, etc.)
                            loader(flair.options.env.isServer, false, _dep).then((content) => {
                                _resolved = content; done();
                            }).catch((e) => {
                                _error = new _Exception('FileLoad', `File load operation failed with error: ${e}. (${_dep})`); done();
                            });
                        }
                    } else { // not a file
                        done();
                    }
                };
    
                // check if this is a module
                let option5 = (done) => {
                    loader(flair.options.env.isServer, true, _dep).then((content) => { // as last option, try to load it as module
                        _resolved = content; done();
                    }).catch((e) => {
                        _error = new _Exception('ModuleLoad', `Module load operation failed with error: ${e}. (${_dep})`); done();
                    });                
                };
    
                // done
                let resolved = (isExcludePop) => {
                    resolvedItems[_depName].error = _error;
                    resolvedItems[_depName].dep = _resolved; 
                    if (!isExcludePop) { incCycle.pop(); } // removed the last added dep
                    resolveNext();
                };
    
                // process
                if (_dep === '') { // nothing is defined to process
                    resolved(true); return;
                } else {
                    // cycle break check
                    if (incCycle.indexOf(_dep) !== -1) {
                        _error = new _Exception('CircularDependency', `Circular dependency identified. (${_dep})`);
                        resolved(true); return;
                    } else {
                        incCycle.push(_dep);
                    }
    
                    // run
                    option1(() => {
                        if (!_resolved) { option2(() => {
                            if (!_resolved) { option3(() => {
                                if (!_resolved) { option4(() => {
                                    if (!_resolved) { option5(() => {
                                        if (!_resolved) {
                                            _error = new _Exception('DependencyResolution', `Failed to resolve dependency. ${_dep}`);
                                            resolved(); return;
                                        } else { resolved(); }
                                    }) } else { resolved(); }
                                }) } else { resolved(); }
                            }) } else { resolved(); }
                        }) } else { resolved(); }
                    }); 
                }
            }
        }
    
        // start processing
        resolveNext();
    };
    
    // reset api
    flair.include._ = {
        reset: () => { incCycle = []; }
    };
    
    // add to members list
    flair.members.push('include');
    // inject
    // inject(type, [typeArgs])
    //  - type: 
    //      type class itself to inject, OR
    //      type class name, OR
    //      type class name on server | type class name on client
    //  - typeArgs: constructor args to pass when type class instance is created
    // NOTE: types being referred here must be available in container so sync resolve can happen
    flair.Container.register('inject', flair.Class('inject', flair.Attribute, function() {
        this.decorator((obj, type, name, descriptor) => {
            // validate
            if (['func', 'prop'].indexOf(type) === -1) { throw `inject attribute cannot be applied on ${type} members.`; }
            if (['_constructor', '_dispose'].indexOf(name) !== -1) { throw `inject attribute cannot be applied on special function.`; }
    // TODO: allow on constructor as well
            // decorate
            let Type = this.args[0],
                typeArgs = this.args[1],
                instance = null,
                fn = null;
            if (!Array.isArray(typeArgs)) { typeArgs = [typeArgs]; }
            if (typeof Type === 'string') { 
                // get contextual type
                Type = which(Type);
    
                // get instance
                instance = flair.Container.resolve(Type, false, ...typeArgs)
            } else {
                instance = new Type(...typeArgs);
            }
            switch(type) {
                case 'func':
                    fn = descriptor.value;
                    descriptor.value = function(...args) {
                        fn(instance, ...args); // TODO: push at the end
                    }.bind(obj);
                    break;
                case 'prop':
                    obj[name] = instance;                        
                    break;
            }
        });
    }));
    
    // multiinject
    // multiinject(type, [typeArgs])
    //  - type: 
    //      type class name, OR
    //      type class name on server | type class name on client
    //  - typeArgs: constructor args to pass when type class instance is created
    // NOTE: types being referred here must be available in container so sync resolve can happen
    flair.Container.register('multiinject', flair.Class('multiinject', flair.Attribute, function() {
        this.decorator((obj, type, name, descriptor) => {
            // validate
            if (['func', 'prop'].indexOf(type) === -1) { throw `multiinject attribute cannot be applied on ${type} members.`; }
            if (['_constructor', '_dispose'].indexOf(name) !== -1) { throw `multiinject attribute cannot be applied on special function.`; }
    
            // decorate
            let Type = this.args[0],
                typeArgs = this.args[1],
                instance = null,
                fn = null;
            if (!Array.isArray(typeArgs)) { typeArgs = [typeArgs]; }
            if (typeof Type === 'string') {
                // get contextual type
                Type = which(Type);
    
                // get instance
                instance = flair.Container.resolve(Type, true, ...typeArgs)
            } else {
                throw `multiinject attribute does not support direct type injections.`;
            }
            switch(type) {
                case 'func':
                    fn = descriptor.value;
                    descriptor.value = function(...args) {
                        fn(instance, ...args);
                    }.bind(obj);
                    break;
                case 'prop':
                    obj[name] = instance;                        
                    break;
            }
        });
    }));
    
    // Aspects
    let allAspects = [],
        regExpEscape = (s) => { return s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'); },
        wildcardToRegExp = (s) => { return new RegExp('^' + s.split(/\*+/).map(regExpEscape).join('.*') + '$'); };
    flair.Aspects = {};
    flair.Aspects.raw = () => { return allAspects; }
    flair.Aspects.register = (pointcut, Aspect) => {
        // pointcut: [namespace.]class[:func][/attr1[,attr2[,...]]]
        //      namespace/class/func:
        //          ~ - any
        //          *<text> - any name that ends with <text> 
        //          <text>* - any name that starts with <text>
        //          <text>  - exact name
        //      attribute:
        //          <text>  - exact name
        //
        //      Examples:
        //          ~                   - on all functions of all classes in all namespaces
        //          abc                 - on all functions of all classes names abc in root namespace (without any namespace)
        //          ~.abc               - on all functions of all classes names abc in all namespaces
        //          ~.abc:~             - on all functions of all classes names abc in all namespaces
        //          xyz.*               - on all functions of all classes in xyz namespace
        //          xyz.abc             - on all functions of class abc under xyz namespace
        //          xyz.abc:*           - on all functions of class abc under xyz namespace
        //          xyz.abc:f1          - on func f1 of class abc under xyz namespace
        //          xyz.abc:f*          - on all funcs that starts with f in class abc under xyz namespace
        //          xyz.xx*.abc         - on functions of all classes names abc under namespaces where pattern matches xyz.xx* (e.g., xyz.xx1 and xyz.xx2)
        //          xy*.xx*.abc         - on functions of all classes names abc under namespaces where pattern matches xyz.xx* (e.g., xy1.xx1 and xy2.xx1)
        //          abc/service         - on all functions of abc class in root namespace which has service attribute applied
        //          ~/service           - on all functions of all classes in all namespaces which has service attribute applied
        //          /service            - on all functions of all classes which has service attribute applied
        //          /service*           - on all functions of all classes which has service* attribute name pattern applied
    
    
        // split name and attributes
        let nm = pointcut || '~',
            ns = '',
            cls = '',
            fnc = '',
            attr = '~',     
            bucket = '';    
        if (nm.indexOf('/') !== -1) {
            let items = nm.split('/');
            nm = items[0].trim();
            attr = items[1].trim();
        }
    
        // get bucket to store in
        if (nm === '~') { 
            ns = '~';
            cls = '~';
            fnc = '~';
        } else if (nm === '') {
            ns = '^';
            cls = '~';
            fnc = '~';
        } else if (nm.indexOf('.') === -1) {
            ns = '^';
            if (nm.indexOf(':') === -1) {
                cls = nm;
                fnc = '~';
            } else {
                let itms = nm.split(':');
                cls = itms[0].trim();
                fnc = itms[1].trim();
            }
        } else {
            ns = nm.substr(0, nm.lastIndexOf('.'));
            nm = nm.substr(nm.lastIndexOf('.') + 1);
            if (nm.indexOf(':') === -1) {
                cls = nm;
                fnc = '~';
            } else {
                let itms = nm.split(':');
                cls = itms[0].trim();
                fnc = itms[1].trim();
            }        
        }
        if (ns === '*' || ns === '') { ns = '~'; }
        if (cls === '*' || cls === '') { cls = '~'; }
        if (fnc === '*' || fnc === '') { fnc = '~'; }
        if (attr === '*' || attr === '') { attr = '~'; }
        bucket = `${ns}=${cls}=${fnc}=${attr}`;
    
        // add bucket if not already there
        allAspects[bucket] = allAspects[bucket] || [];
        allAspects[bucket].push(Aspect);
    };
    flair.Aspects.get = (className, funcName, attrs) => {
        // get parts
        let funcAspects = [],
            ns = '',
            cls = '',
            fnc = funcName.trim();
    
        if (className.indexOf('.') !== -1) {
            ns = className.substr(0, className.lastIndexOf('.')).trim();
            cls = className.substr(className.lastIndexOf('.') + 1).trim(); 
        } else {
            ns = '^';
            cls = className.trim();
        }
    
        for(let bucket in allAspects) {
            let items = bucket.split('='),
                thisNS = items[0],
                rxNS = wildcardToRegExp(thisNS),
                thisCls = items[1],
                rxCls = wildcardToRegExp(thisCls),
                thisFnc = items[2],
                rxFnc = wildcardToRegExp(thisFnc),
                thisAttr = items[3],
                rxAttr = wildcardToRegExp(thisAttr),
                isMatched = (thisAttr === '~');
            
            if (((ns === thisNS || rxNS.test(ns)) &&
                (cls === thisCls || rxCls.test(cls)) &&
                (fnc === thisFnc || rxFnc.test(fnc)))) {
                if (!isMatched) {
                    for(let attr of attrs) {
                        if (attr.name === thisAttr || rxAttr.test(attr.name)) {
                            isMatched = true;
                            break; // matched
                        }
                    }
                }
                if (isMatched) {
                    for(let aspect of allAspects[bucket]) {
                        if (funcAspects.indexOf(aspect) === -1) {
                            funcAspects.push(aspect);
                        }
                    }                  
                }
            }
        }
    
        // return
        return funcAspects;
    };
    
    // Aspect
    flair.Aspect = flair.Class('Aspect', function(attr) {
        let beforeFn = null,
            afterFn = null,
            aroundFn = null;
        attr('abstract');
        this.construct((...args) => {
            this.args = args;
        });
        
        this.prop('args', []);
        this.func('before', (fn) => {
            if (typeof fn === 'function') {
                beforeFn = fn;
            }
            return beforeFn;
        });
        this.func('after', (fn) => {
            if (typeof fn === 'function') {
                afterFn = fn;
            }
            return afterFn;
        });
        this.func('around', (fn) => {
            if (typeof fn === 'function') {
                aroundFn = fn;
            }
            return aroundFn;
        });
    });
    
    // Serializer
    flair.Serializer = {};
    flair.Serializer.serialize = (instance) => { 
        if (instance._.type === 'instance') {
            return instance._.serialize(); 
        }
        return null;
    };
    flair.Serializer.deserialize = (Type, json) => {
        let instance = new Type();
        if (instance._.type === 'instance') {
            instance._.deserialize(json);
            return instance;
        }
        return null;
    };
    
    // Reflector
    flair.Reflector = function (forTarget) {
        // define
        const CommonTypeReflector = function(target) {
            this.getType = () => { return target._.type; };
            this.getName = () => { return target._.name || ''; };
            this.getNamespace = () => { 
                let _Namespace = target._.namespace;
                if (_Namespace) { return new NamespaceReflector(_Namespace); }
                return null; 
            };
            this.getAssembly = () => {
                let _Assembly = flair.Assembly.get(target._.name);
                if (_Assembly) { return new AssemblyReflector(_Assembly); }
                return null;
            }
            this.getTarget = () => { return target; };
            this.isInstance = () => { return target._.type === 'instance'; };
            this.isClass = () => { return target._.type === 'class'; };
            this.isEnum = () => { return target._.type === 'enum'; };
            this.isProc = () => { return target._.type === 'proc'; };
            this.isStructure = () => { return target._.type === 'structure'; };
            this.isStructureInstance = () => { return target._.type === 'sinstance'; };
            this.isNamespace = () => { return target._.type === 'namespace'; };
            this.isResource = () => { return target._.type === 'resource'; };
            this.isAssembly = () => { return target._.type === 'assembly'; };
            this.isMixin = () => { return target._.type === 'mixin'; };
            this.isInterface = () => { return target._.type === 'interface'; };
        };
        const CommonMemberReflector = function(type, target, name) {
            this.getType = () => { return 'member'; }
            this.getMemberType = () => { return type; }
            this.getTarget = () => { return target; }
            this.getTargetType = () => { return target._.type; }
            this.getName = () => { return name; }
        };
        const AttrReflector = function(Attr, name, args, target) {
            this.getType = () => { return 'attribute'; }
            this.getName = () => { return name; }
            this.getTarget = () => { return target; }
            this.getArgs = () => { return args.slice(); }
            this.getClass = () => { 
                if (Attr) { return new ClassReflector(Attr); }
                return null;
                }
        };
        const AspectReflector = function(Aspect, target) {
            this.getType = () => { return 'aspect'; }
            this.getName = () => { return Aspect._.name; }
            this.getTarget = () => { return target; }
            this.getClass = () => { 
                if (Aspect) { return new ClassReflector(Aspect); }
                return null;
                }
        };
        const CommonInstanceMemberReflector = function(type, target, name, ref) {
            let refl = new CommonMemberReflector(type, target, name);
            refl.getRef = () => { return ref; };
            refl.getAttributes = () => {
                let items = [],
                    attrs = [];
                for (let item of target._.instanceOf) {
                    if (item.meta[name]) {
                        attrs = item.meta[name];
                        for(let attr of attrs) {
                            items.push(new AttrReflector(attr.Attr, attr.name, attr.args, target));
                        }
                    }
                }
                return items;
            };
            refl.hasAttribute = (attrName) => {
                let isOk = false,
                    attrs = [];
                for (let item of target._.instanceOf) {
                    if (item.meta[name]) {
                        attrs = item.meta[name];
                        for(let attr of attrs) {
                            if (attr.name == attrName) {
                                isOk = true; break;
                            }
                        }
                    }
                    if (isOk) { break; }
                }
                return isOk;                 
            };
            refl.getAttribute = (attrName) => {
                let attrInfo = null;
                for (let item of target._.instanceOf) {
                    if (item.meta[name]) {
                        let attrs = item.meta[name];
                        for(let attr of attrs) {
                            if (attr.name === attrName) {
                                attrInfo = new AttrReflector(attr.Attr, attr.name, attr.args, target);
                                break;
                            }
                        }
                    }
                    if (attrInfo !== null) { break; }
                }
                return attrInfo;
            };
            refl.isEnumerable = () => {
                if (target[name]) { 
                    return Object.getOwnPropertyDescriptor(target, name).enumerable;
                }
                return false;
            };
            refl.isDeprecated = () => { return target._._.hasAttrEx('deprecate', name); };
            refl.isConditional = () => { return target._._.hasAttrEx('conditional', name); };
            refl.isOverridden = () => { return target._._.hasAttrEx('override', name); };
            refl.isOwn = () => { return target._.isOwnMember(name); };
            refl.isDerived = () => { return target._._.isDerivedMember(name); };
            refl.isPrivate = () => { return target._._.hasAttrEx('private', name); };
            refl.isProtected = () => { return target._._.isProtectedMember(name); };
            refl.isPublic = () => { return (!refl.isPrivate && !refl.isProtected); };
            refl.isSealed = () => { return target._._.isSealedMember(name); };
            refl.isMixed = () => { return target._._.hasAttrEx('mixed', name); };
            refl.getMixin = () => { 
                if (refl.isMixed()) {
                    let mixin = refl.getAttribute('mixed').getArgs()[0];
                    return new MixinReflector(mixin);
                }
                return null;
            };
            refl.isInterfaceEnforced = () => { return refl.getInterfaces().length > 0; };
            refl.getInterfaces = () => {
                let items = [],
                    interfaces = [];
                for (let item of target._.instanceOf) {
                    if (item.meta[name]) {
                        interfaces = item.meta[name].interfaces;
                        for(let iface of interfaces) {
                            items.push(new InterfaceReflector(iface, target));
                        }
                    }
                }
                return items;                    
            };        
            refl.isProp = () => { return type === 'prop'; }
            refl.isFunc = () => { return type === 'func'; }
            refl.isEvent = () => { return type === 'event'; }
            return refl;
        };
        const PropReflector = function(target, name, ref) {
            let refl = new CommonInstanceMemberReflector('prop', target, name, ref);
            refl.getValue = () => { return target[name]; };
            refl.setValue = (value) => { return target[name] = value; };
            refl.getRaw = () => { return ref; };
            refl.isReadOnly = () => { return target._._.hasAttrEx('readonly', name); };
            refl.isSetOnce = () => { return target._._.hasAttrEx('readonly', name) && target._._.hasAttrEx('once', name); };
            refl.isStatic = () => { return target._._.hasAttrEx('static', name); };
            refl.isSerializable = () => { return target._._.isSerializableMember(name); }
            return refl;
        };
        const FuncReflector = function(target, name, ref, raw) {
            let refl = new CommonInstanceMemberReflector('func', target, name, ref);
            refl.invoke = (...args) => { return target[name](...args); };
            refl.getAspects = () => {
                let items = [],
                    aspects = [];
                for (let item of target._.instanceOf) {
                    if (item.meta[name]) {
                        aspects = item.meta[name].aspects;
                        for(let aspect of aspects) {
                            items.push(new AspectReflector(aspect, target));
                        }
                    }
                }
                return items;                    
            };
            refl.getRaw = () => { return raw; };
            refl.isASync = () => { return target._._.hasAttrEx('async', name); }
            refl.isConstructor = () => { return name === '_constructor'; }
            refl.isDisposer = () => { return name === '_dispose'; }
            return refl;
        };
        const EventReflector = function(target, name, ref) {
            let refl = new CommonInstanceMemberReflector('event', target, name, ref);
            refl.raise = (...args) => { return ref(...args); }
            refl.isSubscribed = () => { return ref.subscribe.all().length > 0; }
            return refl;
        };
        const KeyReflector = function(target, name) {
            let refl = new CommonMemberReflector('key', target, name);
            refl.getValue = () => { return target[name]; }
            return refl;
        };
        const InstanceReflector = function(target) {
            let refl = new CommonTypeReflector(target),
                filterMembers = (members, type, attrs) => {
                    if (type === '' && attrs.length === 0) { return members.slice(); }
                    let filtered = [],
                        hasAllAttrs = true;
                    for(let member of members) {
                        if (member.getType() !== 'member') { continue; }
                        if (type !== '' && member.getMemberType() !== type) { continue; }
                        hasAllAttrs = true;
                        if (attrs.length !== 0) {
                            for(let attrName of attrs) {
                                if (!member.hasAttribute(attrName)) {
                                    hasAllAttrs = false;
                                    break; 
                                }
                            }
                        }
                        if (hasAllAttrs) {
                            filtered.push(member);
                        }
                    }
                    return filtered;
                },
                getMembers = (oneMember) => {
                    let members = [],
                        attrs = [], // eslint-disable-line no-unused-vars
                        lastMember = null,
                        member = null;
                    for(let instance of target._.instanceOf) {
                        for(let name in instance.meta) {
                            if (instance.meta.hasOwnProperty(name)) {
                                attrs = instance.meta[name];
                                switch(instance.meta[name].type) {
                                    case 'func':
                                        lastMember = new FuncReflector(target, name, instance.meta[name].ref, instance.meta[name].raw);
                                        members.push(lastMember);
                                        break;
                                    case 'prop':
                                        lastMember = new PropReflector(target, name, instance.meta[name].ref);
                                        members.push(lastMember);
                                        break;
                                    case 'event':
                                        lastMember = new EventReflector(target, name, instance.meta[name].argNames, instance.meta[name].ref);
                                        members.push(lastMember);
                                        break;
                                    default:
                                        throw 'Unknown member type';
                                }
                                if (typeof oneMember !== 'undefined' && name === oneMember) { 
                                    members = [];
                                    member = lastMember;
                                }
                            }
                            if (member !== null) { break; }
                        }
                        if (member !== null) { break; }
                    }
                    if (member !== null) { return member; }
                    return {
                        all: (...attrs) => { 
                            return filterMembers(members, '', attrs);
                        },
                        func: (...attrs) => { 
                            return filterMembers(members, 'func', attrs);
                        },
                        prop: (...attrs) => {
                            return filterMembers(members, 'prop', attrs);
                        },
                        event: (...attrs) => {
                            return filterMembers(members, 'event', attrs);
                        }
                    };                  
                };
            refl.getClass = () => { 
                if (target._.inherits !== null) {
                    return new ClassReflector(target._.inherits);
                }
                return null;
            };
            refl.getFamily = () => {
                let items = [],
                    prv = target._.inherits;
                // eslint-disable-next-line no-constant-condition
                while(true) {
                    if (prv === null) { break; }
                    items.push(new ClassReflector(prv));
                    prv = prv._.inherits;
                }
                return items;
            };
            refl.getMixins = () => { 
                let items = [],
                    family = refl.getFamily();
                for(let cls of family) {
                    items = items.concat(cls.getMixins());
                }
                return items;
            };
            refl.getInterfaces = () => { 
                let items = [],
                    family = refl.getFamily();
                for(let cls of family) {
                    items = items.concat(cls.getInterfaces());
                }
                return items;
            };
            refl.getMembers = (...attrs) => { 
                let members = getMembers();
                if (attrs.length !== 0) {
                    return members.all(...attrs);
                }
                return members;
            };
            refl.getMember = (name) => { return getMembers(name); };
            refl.isSingleton = () => { return refl.getClass().isSingleton(); };                       
            refl.isInstanceOf = (name) => { return target._.isInstanceOf(name); };
            refl.isMixed = (name) => { return target._.isMixed(name); };
            refl.isImplements = (name) => { return target._.isImplements(name); };
            return refl;              
        };
        const StructureInstanceReflector = function(target) {
            let refl = new CommonTypeReflector(target);
            refl.getStructure = () => { 
                if (target._.inherits !== null) {
                    return new StructureReflector(target._.inherits);
                }
                return null;
            };
            refl.getMembers = () => { 
                let keys = Object.keys(target),
                    _At = keys.indexOf('_');
                if (_At !== -1) {
                    keys.splice(_At, 1);
                }
                return keys;
            };
            refl.getMember = (name) => { return target[name]; };
            refl.invoke = (...args) => { return target[name](...args); };
            refl.isInstanceOf = (name) => { return target._.inherits._.name === name; };
            return refl;              
        };    
        const ClassReflector = function(target) {
            let refl = new CommonTypeReflector(target);
            refl.getParent = () => { 
                if (target._.inherits !== null) {
                    return new ClassReflector(target._.inherits);
                }
                return null;
            };
            refl.getFamily = () => {
                let items = [],
                    prv = target._.inherits;
                // eslint-disable-next-line no-constant-condition    
                while(true) {
                    if (prv === null) { break; }
                    items.push(new ClassReflector(prv));
                    prv = prv._.inherits;
                }
                return items;
            };       
            refl.getMixins = () => {
                let items = [];
                for(let mixin of target._.mixins) {
                    items.push(new MixinReflector(mixin));
                }
                return items;
            };
            refl.getInterfaces = () => {
                let items = [];
                for(let _interface of target._.interfaces) {
                    items.push(new InterfaceReflector(_interface));
                }
                return items;
            };
            refl.isSingleton = () => { return target._.isSingleton(); };                       
            refl.isSingleInstanceCreated = () => { return target._.singleInstance() !== null; };
            refl.isSealed = () => { return target._.isSealed(); }
            refl.isDerivedFrom = (name) => { return target._.isDerivedFrom(name); }
            refl.isMixed = (name) => { return target._.isMixed(name); }
            refl.isImplements = (name) => { return target._.isImplements(name); }
            return refl;                
        };
        const EnumReflector = function(target) {
            let refl = new CommonTypeReflector(target);
            refl.getMembers = () => { 
                let keys = target._.keys(),
                    members = [];
                for(let key of keys) {
                    members.push(new KeyReflector(target, key));
                }
                return members;
            };
            refl.getMember = (name) => {
                if (typeof target[name] === 'undefined') { throw `${name} is not defined.`; }
                return new KeyReflector(target, name);
            };
            refl.getKeys = () => { return target._.keys(); }
            refl.getValues = () => { return target._.values(); }
            return refl;
        };
        const ProcReflector = function(target) {
            let refl = new CommonTypeReflector(target);
            refl.isASync = () => { target.isASync(); };
            refl.invoke = (...args) => { return target._.invoke(...args); }
            return refl;
        };    
        const ResourceReflector = function(target) {
            let refl = new CommonTypeReflector(target);
            refl.getFile = () => { return target.file(); };
            refl.getResType = () => { return target.type(); };
            refl.getContent = () => { return target.get(); };
            return refl;
        };
        const StructureReflector = function(target) {
            let refl = new CommonTypeReflector(target);
            return refl;
        };            
        const NamespaceReflector = function(target) {
            let refl = new CommonTypeReflector(target);
            refl.getMembers = () => { 
                let types = target.getTypes(),
                    members = [];
                if (types) {
                    for(let type of types) {
                        switch(type._.type) {
                            case 'class': members.push(new ClassReflector(type)); break;
                            case 'enum': members.push(new EnumReflector(type)); break;
                            case 'structure': members.push(new StructureReflector(type)); break;
                            case 'mixin': members.push(new MixinReflector(type)); break;
                            case 'interface': members.push(new InterfaceReflector(type)); break;                    
                        }
                    }
                }
                return members;
            };
            refl.getMember = (qualifiedName) => {
                let Type = target.getType(qualifiedName),
                    member = null;
                if (Type) {
                    switch(Type._.type) {
                        case 'class': member = new ClassReflector(Type); break;
                        case 'enum': member = new EnumReflector(Type); break;
                        case 'structure': member = new StructureReflector(Type); break;
                        case 'mixin': member = new MixinReflector(Type); break;
                        case 'interface': member = new InterfaceReflector(Type); break;                    
                    }
                }
                return member;
            };
            refl.createInstance = (qualifiedName, ...args) => {
                return target.createInstance(qualifiedName, ...args);
            };
            return refl;
        };
        const AssemblyReflector = function(target) {
            let refl = new CommonTypeReflector(target);
            refl.getTypes = () => { 
                return target.types();
            };
            refl.getAssets = () => { 
                return target.assets();
            };
            refl.getADO = () => { return target._.ado; }
            refl.load = () => {
                return target.load();
            };
            return refl;
        };    
        const MixinReflector = function(target) {
            let refl = new CommonTypeReflector(target);
            return refl;
        };
        const InterfaceReflector = function(target) {
            let refl = new CommonTypeReflector(target),
                getMembers = () => {
                    let members = [];
                    for(let _memberName in target) {
                        if (target.hasOwnProperty(_memberName) && _memberName !== '_') {
                            members.push(new CommonMemberReflector(target[_memberName].type, target, _memberName));
                        }
                    }
                    return members;                     
                };
            refl.getMembers = () => { 
                return getMembers();
            }
            refl.getMember = (name) => {
                if (typeof target[name] === 'undefined') { throw `${name} is not defined.`; }
                return new CommonMemberReflector(target[name].type, target, name);
            };
            return refl;
        };
    
        // get
        let ref = null;
        switch(forTarget._.type) {
            case 'instance': ref = new InstanceReflector(forTarget); break;
            case 'sinstance': ref = new StructureInstanceReflector(forTarget); break;
            case 'class': ref = new ClassReflector(forTarget); break;
            case 'enum': ref = new EnumReflector(forTarget); break;
            case 'proc': ref = new ProcReflector(forTarget); break;
            case 'resource': ref = new ResourceReflector(forTarget); break;
            case 'structure': ref = new StructureReflector(forTarget); break;
            case 'namespace': ref = new NamespaceReflector(forTarget); break;
            case 'assembly': ref = new AssemblyReflector(forTarget); break;
            case 'mixin': ref = new MixinReflector(forTarget); break;
            case 'interface': ref = new InterfaceReflector(forTarget); break;
            default:
                throw `Unknown type ${forTarget._.type}.`;
        }
    
        // return
        return ref;
    };
    
    // add to members list
    flair.members.push('Reflector');

    // expose to global environment
    if (!options.env.supressGlobals) {
        for(let name of flair.members) {
            _global[name] = Object.freeze(flair[name]);
        }
    }
    flair.members = Object.freeze(flair.members);
    _global.flair = Object.freeze(flair); // this is still exposed, so can be used globally

    // return
    return _global.flair;
});