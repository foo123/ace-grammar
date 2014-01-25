/**
*
*   AceGrammar
*   @version: 0.6.6
*
*   Transform a grammar specification in JSON format, into an ACE syntax-highlight parser mode
*   https://github.com/foo123/ace-grammar
*
**/!function ( root, name, deps, factory, undef ) {

    var isNode = (typeof global !== "undefined" && {}.toString.call(global) == '[object global]') ? 1 : 0,
        isBrowser = (!isNode && typeof navigator !== "undefined") ? 1 : 0, 
        isWorker = (typeof importScripts === "function" && navigator instanceof WorkerNavigator) ? 1 : 0,
        A = Array, AP = A.prototype
    ;
    // Get current filename/path
    var getCurrentPath = function() {
            var file = null;
            if ( isNode ) 
            {
                // http://nodejs.org/docs/latest/api/globals.html#globals_filename
                // this should hold the current file in node
                file = __filename;
                return { path: __dirname, file: __filename };
            }
            else if ( isWorker )
            {
                // https://developer.mozilla.org/en-US/docs/Web/API/WorkerLocation
                // this should hold the current url in a web worker
                file = self.location.href;
            }
            else if ( isBrowser )
            {
                // get last script (should be the current one) in browser
                var scripts;
                if ((scripts = document.getElementsByTagName('script')) && scripts.length) 
                    file  = scripts[scripts.length - 1].src;
            }
            
            if ( file )
                return { path: file.split('/').slice(0, -1).join('/'), file: file };
            return { path: null, file: null };
        },
        thisPath = getCurrentPath(),
        makePath = function(base, dep) {
            if ( isNode )
            {
                //return require('path').join(base, dep);
                return dep;
            }
            if ( "." == dep.charAt(0) ) 
            {
                base = base.split('/');
                dep = dep.split('/'); 
                var index = 0, index2 = 0, i, l = dep.length, l2 = base.length;
                
                for (i=0; i<l; i++)
                {
                    if ( /^\.\./.test( dep[i] ) )
                    {
                        index++;
                        index2++;
                    }
                    else if ( /^\./.test( dep[i] ) )
                    {
                        index2++;
                    }
                    else
                    {
                        break;
                    }
                }
                index = ( index >= l2 ) ? 0 : l2-index;
                dep = base.slice(0, index).concat( dep.slice( index2 ) ).join('/');
            }
            return dep;
        }
    ;
    
    //
    // export the module in a umd-style generic way
    deps = ( deps ) ? [].concat(deps) : [];
    var i, dl = deps.length, ids = new A( dl ), paths = new A( dl ), fpaths = new A( dl ), mods = new A( dl ), _module_, head;
        
    for (i=0; i<dl; i++) { ids[i] = deps[i][0]; paths[i] = deps[i][1]; fpaths[i] = /\.js$/i.test(paths[i]) ? makePath(thisPath.path, paths[i]) : makePath(thisPath.path, paths[i]+'.js'); }
    
    // node, commonjs, etc..
    if ( 'object' == typeof( module ) && module.exports ) 
    {
        if ( undef === module.exports[name] )
        {
            for (i=0; i<dl; i++)  mods[i] = module.exports[ ids[i] ] || require( fpaths[i] )[ ids[i] ];
            _module_ = factory.apply(root, mods );
            // allow factory just to add to existing modules without returning a new module
            module.exports[ name ] = _module_ || 1;
        }
    }
    
    // amd, etc..
    else if ( 'function' == typeof( define ) && define.amd ) 
    {
        define( ['exports'].concat( paths ), function( exports ) {
            if ( undef === exports[name] )
            {
                var args = AP.slice.call( arguments, 1 ), dl = args.length;
                for (var i=0; i<dl; i++)   mods[i] = exports[ ids[i] ] || args[ i ];
                _module_ = factory.apply(root, mods );
                // allow factory just to add to existing modules without returning a new module
                exports[ name ] = _module_ || 1;
            }
        });
    }
    
    // web worker
    else if ( isWorker ) 
    {
        for (i=0; i<dl; i++)  
        {
            if ( !self[ ids[i] ] ) importScripts( fpaths[i] );
            mods[i] = self[ ids[i] ];
        }
        _module_ = factory.apply(root, mods );
        // allow factory just to add to existing modules without returning a new module
        self[ name ] = _module_ || 1;
    }
    
    // browsers, other loaders, etc..
    else
    {
        if ( undef === root[name] )
        {
            /*
            for (i=0; i<dl; i++)  mods[i] = root[ ids[i] ];
            _module_ = factory.apply(root, mods );
            // allow factory just to add to existing modules without returning a new module
            root[name] = _module_ || 1;
            */
            
            // load javascript async using <script> tags in browser
            var loadJs = function(url, callback) {
                head = head || document.getElementsByTagName("head")[0];
                var done = 0, script = document.createElement('script');
                
                script.type = 'text/javascript';
                script.language = 'javascript';
                script.src = url;
                script.onload = script.onreadystatechange = function() {
                    if (!done && (!script.readyState || script.readyState == 'loaded' || script.readyState == 'complete'))
                    {
                        done = 1;
                        script.onload = script.onreadystatechange = null;
                        head.removeChild( script );
                        script = null;
                        if ( callback )  callback();
                    }
                }
                // load it
                head.appendChild( script );
            };

            var loadNext = function(id, url, callback) { 
                    if ( !root[ id ] ) 
                        loadJs( url, callback ); 
                    else
                        callback();
                },
                continueLoad = function( i ) {
                    return function() {
                        if ( i < dl )  mods[ i ] = root[ ids[ i ] ];
                        if ( ++i < dl )
                        {
                            loadNext( ids[ i ], fpaths[ i ], continueLoad( i ) );
                        }
                        else
                        {
                            _module_ = factory.apply(root, mods );
                            // allow factory just to add to existing modules without returning a new module
                            root[ name ] = _module_ || 1;
                        }
                    };
                }
            ;
            if ( dl ) 
            {
                loadNext( ids[ 0 ], fpaths[ 0 ], continueLoad( 0 ) );
            }
            else
            {
                _module_ = factory.apply(root, mods );
                // allow factory just to add to existing modules without returning a new module
                root[ name ] = _module_ || 1;
            }
        }
    }


}(  /* current root */          this, 
    /* module name */           "AceGrammar",
    /* module dependencies */   [ ['Classy', './classy'],  ['RegExAnalyzer', './regexanalyzer'] ], 
    /* module factory */        function( Classy, RegexAnalyzer, undef ) {
        
        /* main code starts here */

        
    //
    // parser types
    var    
        DEFAULTSTYLE,
        DEFAULTERROR,
        
        //
        // javascript variable types
        INF = Infinity,
        T_NUM = 2,
        T_BOOL = 4,
        T_STR = 8,
        T_CHAR = 9,
        T_CHARLIST = 10,
        T_REGEX = 16,
        T_ARRAY = 32,
        T_OBJ = 64,
        T_NULL = 128,
        T_UNDEF = 256,
        T_UNKNOWN = 512,
        
        //
        // matcher types
        T_SIMPLEMATCHER = 2,
        T_COMPOSITEMATCHER = 4,
        T_BLOCKMATCHER = 8,
        
        //
        // token types
        T_ERROR = 4,
        T_DEFAULT = 8,
        T_SIMPLE = 16,
        T_EOL = 17,
        T_NONSPACE = 18,
        T_BLOCK = 32,
        T_ESCBLOCK = 33,
        T_COMMENT = 34,
        T_EITHER = 64,
        //T_NONE = 2048,
        T_ALL = 128,
        T_REPEATED = 256,
        T_ZEROORONE = 257,
        T_ZEROORMORE = 258,
        T_ONEORMORE = 259,
        T_GROUP = 512,
        T_NGRAM = 1024,
        
        //
        // tokenizer types
        groupTypes = {
            ONEOF: T_EITHER, EITHER: T_EITHER, ALL: T_ALL, ZEROORONE: T_ZEROORONE, ZEROORMORE: T_ZEROORMORE, ONEORMORE: T_ONEORMORE, REPEATED: T_REPEATED
        },
        
        tokenTypes = {
            BLOCK: T_BLOCK, COMMENT: T_COMMENT, ESCAPEDBLOCK: T_ESCBLOCK, SIMPLE: T_SIMPLE, GROUP: T_GROUP, NGRAM: T_NGRAM
        }
    ;
    
    var Class = Classy.Class;
    
    var AP = Array.prototype, OP = Object.prototype,
        slice = AP.slice, splice = AP.splice, concat = AP.concat, 
        hasKey = OP.hasOwnProperty, toStr = OP.toString, isEnum = OP.propertyIsEnumerable,
        
        Keys = Object.keys,
        
        get_type = function(v) {
            var type_of = typeof(v), to_string = toStr.call(v);
            
            if ('undefined' == type_of)  return T_UNDEF;
            
            else if ('number' == type_of || v instanceof Number)  return T_NUM;
            
            else if (null === v)  return T_NULL;
            
            else if (true === v || false === v)  return T_BOOL;
            
            else if (v && ('string' == type_of || v instanceof String))  return (1 == v.length) ? T_CHAR : T_STR;
            
            else if (v && ("[object RegExp]" == to_string || v instanceof RegExp))  return T_REGEX;
            
            else if (v && ("[object Array]" == to_string || v instanceof Array))  return T_ARRAY;
            
            else if (v && "[object Object]" == to_string)  return T_OBJ;
            
            // unkown type
            return T_UNKNOWN;
        },
        
        make_array = function(a, force) {
            return ( force || T_ARRAY != get_type( a ) ) ? [ a ] : a;
        },
        
        make_array_2 = function(a, force) {
            a = make_array( a, force );
            if ( force || T_ARRAY != get_type( a[0] ) ) a = [ a ]; // array of arrays
            return a;
        },
        
        clone = function(o) {
            var T = get_type( o ), T2;
            
            if ( !((T_OBJ | T_ARRAY) & T) ) return o;
            
            var co = {}, k;
            for (k in o) 
            {
                if ( hasKey.call(o, k) && isEnum.call(o, k) ) 
                { 
                    T2 = get_type( o[k] );
                    
                    if (T_OBJ & T2)  co[k] = clone(o[k]);
                    
                    else if (T_ARRAY & T2)  co[k] = o[k].slice();
                    
                    else  co[k] = o[k]; 
                }
            }
            return co;
        },
        
        extend = function() {
            var args = slice.call(arguments), argslen = args.length;
            
            if ( argslen<1 ) return null;
            else if ( argslen<2 ) return clone( args[0] );
            
            var o1 = args.shift(), o2, o = clone(o1), i, k, T; 
            argslen--;            
            
            for (i=0; i<argslen; i++)
            {
                o2 = args.shift();
                if ( !o2 ) continue;
                
                for (k in o2) 
                { 
                    if ( hasKey.call(o2, k) && isEnum.call(o2, k) )
                    {
                        if ( hasKey.call(o1, k) && isEnum.call(o1, k) ) 
                        { 
                            T = get_type( o1[k] );
                            
                            if ( (T_OBJ & ~T_STR) & T)  o[k] = extend( o1[k], o2[k] );
                            
                            //else if (T_ARRAY == T)  o[k] = o1[k].slice();
                            
                            //else  o[k] = o1[k];
                        }
                        else
                        {
                            o[k] = clone( o2[k] );
                        }
                    }
                }
            }
            return o;
        },
        
        escRegexp = function(str) {
            return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
        },
        
        groupReplace = function(pattern, token) {
            var parts, i, l, replacer;
            replacer = function(m, d){
                // the regex is wrapped in an additional group, 
                // add 1 to the requested regex group transparently
                return token[ 1 + parseInt(d, 10) ];
            };
            parts = pattern.split('$$');
            l = parts.length;
            for (i=0; i<l; i++) parts[i] = parts[i].replace(/\$(\d{1,2})/g, replacer);
            return parts.join('$');
        },
        
        byLength = function(a, b) { return b.length - a.length },
        
        hasPrefix = function(s, id) {
            return (
                (T_STR & get_type(id)) && (T_STR & get_type(s)) && id.length &&
                id.length <= s.length && id == s.substr(0, id.length)
            );
        },
        
        getRegexp = function(r, rid, cachedRegexes)  {
            if ( !r || (T_NUM == get_type(r)) ) return r;
            
            var l = (rid) ? (rid.length||0) : 0, i;
            
            if ( l && rid == r.substr(0, l) ) 
            {
                var regexSource = r.substr(l), delim = regexSource[0], flags = '',
                    regexBody, regexID, regex, chars, analyzer, i, ch
                ;
                
                // allow regex to have delimiters and flags
                // delimiter is defined as the first character after the regexID
                i = regexSource.length;
                while ( i-- )
                {
                    ch = regexSource[i];
                    if (delim == ch) 
                        break;
                    else if ('i' == ch.toLowerCase() ) 
                        flags = 'i';
                }
                regexBody = regexSource.substring(1, i);
                regexID = "^(" + regexBody + ")";
                //console.log([regexBody, flags]);
                
                if ( !cachedRegexes[ regexID ] )
                {
                    regex = new RegExp( regexID, flags );
                    analyzer = new RegexAnalyzer( regex ).analyze();
                    chars = analyzer.getPeekChars();
                    if ( !Keys(chars.peek).length )  chars.peek = null;
                    if ( !Keys(chars.negativepeek).length )  chars.negativepeek = null;
                    
                    // shared, light-weight
                    cachedRegexes[ regexID ] = [ regex, chars ];
                }
                
                return cachedRegexes[ regexID ];
            }
            else
            {
                return r;
            }
        },
        
        getCombinedRegexp = function(tokens, boundary)  {
            var peek = { }, i, l, b = "", bT = get_type(boundary);
            if ( T_STR == bT || T_CHAR == bT ) b = boundary;
            var combined = tokens
                        .sort( byLength )
                        .map( function(t) {
                            peek[ t.charAt(0) ] = 1;
                            return escRegexp( t );
                        })
                        .join( "|" )
                    ;
            return [ new RegExp("^(" + combined + ")"+b), { peek: peek, negativepeek: null }, 1 ];
        },
        
        isNode = (typeof global !== "undefined" && {}.toString.call(global) == '[object global]') ? 1 : 0,
        isBrowser = (!isNode && typeof navigator !== "undefined") ? 1 : 0, 
        isWorker = (typeof importScripts === "function" && navigator instanceof WorkerNavigator) ? 1 : 0,
        
        // Get current filename/path
        getCurrentPath = function() {
            var file = null, path, base, scripts;
            if ( isNode ) 
            {
                // http://nodejs.org/docs/latest/api/globals.html#globals_filename
                // this should hold the current file in node
                file = __filename;
                return { path: __dirname, file: __filename, base: __dirname };
            }
            else if ( isWorker )
            {
                // https://developer.mozilla.org/en-US/docs/Web/API/WorkerLocation
                // this should hold the current url in a web worker
                file = self.location.href;
            }
            else if ( isBrowser )
            {
                // get last script (should be the current one) in browser
                base = document.location.href.split('#')[0].split('?')[0].split('/').slice(0, -1).join('/');
                if ((scripts = document.getElementsByTagName('script')) && scripts.length) 
                    file = scripts[scripts.length - 1].src;
            }
            
            if ( file )
                return { path: file.split('/').slice(0, -1).join('/'), file: file, base: base };
            return { path: null, file: null, base: null };
        },
        thisPath = getCurrentPath()
    ;
    
    //
    // Stream Class
    var
        Max = Math.max, spaceRegex = /^[\s\u00a0]+/,
        // a wrapper-class to manipulate a string as a stream, based on Codemirror's StringStream
        ParserStream = Class({
            
            constructor: function( line ) {
                var ayto = this;
                ayto._ = null;
                ayto.s = (line) ? ''+line : '';
                ayto.start = ayto.pos = 0;
            },
            
            // abbreviations used for optimal minification
            
            _: null,
            s: '',
            start: 0,
            pos: 0,
            
            fromStream: function( _ ) {
                var ayto = this;
                ayto._ = _;
                ayto.s = ''+_.string;
                ayto.start = _.start;
                ayto.pos = _.pos;
                return ayto;
            },
            
            toString: function() { return this.s; },
            
            // string start-of-line?
            sol: function( ) { return 0 == this.pos; },
            
            // string end-of-line?
            eol: function( ) { return this.pos >= this.s.length; },
            
            // char match
            chr : function(pattern, eat) {
                var ayto = this, ch = ayto.s.charAt(ayto.pos) || null;
                if (ch && pattern == ch) 
                {
                    if (false !== eat) 
                    {
                        ayto.pos += 1;
                        if ( ayto._ ) ayto._.pos = ayto.pos;
                    }
                    return ch;
                }
                return false;
            },
            
            // char list match
            chl : function(pattern, eat) {
                var ayto = this, ch = ayto.s.charAt(ayto.pos) || null;
                if ( ch && (-1 < pattern.indexOf( ch )) ) 
                {
                    if (false !== eat) 
                    {
                        ayto.pos += 1;
                        if ( ayto._ ) ayto._.pos = ayto.pos;
                    }
                    return ch;
                }
                return false;
            },
            
            // string match
            str : function(pattern, startsWith, eat) {
                var ayto = this, len, pos = ayto.pos, str = ayto.s, ch = str.charAt(pos) || null;
                if ( ch && startsWith[ ch ] )
                {
                    len = pattern.length; 
                    if (pattern == str.substr(pos, len)) 
                    {
                        if (false !== eat) 
                        {
                            ayto.pos += len;
                            if ( ayto._ ) ayto._.pos = ayto.pos;
                        }
                        return pattern;
                    }
                }
                return false;
            },
            
            // regex match
            rex : function(pattern, startsWith, notStartsWith, group, eat) {
                var ayto = this, match, pos = ayto.pos, str = ayto.s, ch = str.charAt(pos) || null;
                if ( ch && ( startsWith && startsWith[ ch ] ) || ( notStartsWith && !notStartsWith[ ch ] ) )
                {
                    match = str.slice(pos).match(pattern);
                    if (!match || match.index > 0) return false;
                    if (false !== eat) 
                    {
                        ayto.pos += match[group||0].length;
                        if ( ayto._ ) ayto._.pos = ayto.pos;
                    }
                    return match;
                }
                return false;
            },

            // skip to end
            end: function() {
                var ayto = this;
                ayto.pos = ayto.s.length;
                if ( ayto._ ) ayto._.pos = ayto.pos;
                return ayto;
            },

            // get next char
            nxt: function( ) {
                var ayto = this, ch, s = ayto.s;
                if (ayto.pos < s.length)
                {
                    ch = s.charAt(ayto.pos++) || null;
                    if ( ayto._ ) ayto._.pos = ayto.pos;
                    return ch;
                }
            },
            
            // back-up n steps
            bck: function( n ) {
                var ayto = this;
                ayto.pos = Max(0, ayto.pos - n);
                if ( ayto._ ) ayto._.pos = ayto.pos;
                return ayto;
            },
            
            // back-track to pos
            bck2: function( pos ) {
                var ayto = this;
                ayto.pos = Max(0, pos);
                if ( ayto._ ) ayto._.pos = ayto.pos;
                return ayto;
            },
            
            // eat space
            spc: function( ) {
                var ayto = this, m, start = ayto.pos, s = ayto.s.slice(start);
                if ( m = s.match( spaceRegex ) ) 
                {
                    ayto.pos += m[0].length;
                    if ( ayto._ ) ayto._.pos = ayto.pos;
                }
                return ayto.pos > start;
            },
            
            // current stream selection
            cur: function( andShiftStream ) {
                var ayto = this, ret = ayto.s.slice(ayto.start, ayto.pos);
                if ( andShiftStream ) ayto.start = ayto.pos;
                return ret;
            },
            
            // move/shift stream
            sft: function( ) {
                this.start = this.pos;
                return this;
            }
        })
    ;
        
    //
    // ParserState Class
    var
        ParserState = Class({
            
            constructor: function( line, unique ) {
                var ayto = this;
                // this enables unique state "names"
                // thus forces highlight to update
                // however updates also occur when no update necessary ??
                ayto.id = unique ? new Date().getTime() : 0;
                ayto.l = line || 0;
                ayto.stack = [];
                ayto.t = T_DEFAULT;
                ayto.r = '0';
                ayto.inBlock = null;
                ayto.endBlock = null;
            },
            
            // state id
            id: 0,
            // state current line
            l: 0,
            // state token stack
            stack: null,
            // state current token id
            t: null,
            // state current token type
            r: null,
            // state current block name
            inBlock: null,
            // state endBlock for current block
            endBlock: null,
            
            clone: function( unique ) {
                var ayto = this, c = new ayto.$class( ayto.l, unique );
                c.t = ayto.t;
                c.r = ayto.r;
                c.stack = ayto.stack.slice();
                c.inBlock = ayto.inBlock;
                c.endBlock = ayto.endBlock;
                return c;
            },
            
            // used mostly for ACE which treats states as strings, 
            // make sure to generate a string which will cover most cases where state needs to be updated by the editor
            toString: function() {
                var ayto = this;
                //return ['', ayto.id, ayto.inBlock||'0'].join('_');
                //return ['', ayto.id, ayto.t, ayto.r||'0', ayto.stack.length, ayto.inBlock||'0'].join('_');
                //return ['', ayto.id, ayto.t, ayto.stack.length, ayto.inBlock||'0'].join('_');
                //return ['', ayto.id, ayto.t, ayto.r||'0', ayto.inBlock||'0'].join('_');
                //return ['', ayto.l, ayto.t, ayto.r, ayto.inBlock||'0', ayto.stack.length].join('_');
                return ['', ayto.id, ayto.l, ayto.t, ayto.inBlock||'0'].join('_');
            }
        })
    ;
        
    //
    // matcher factories
    var 
        SimpleMatcher = Class({
            
            constructor : function(type, name, pattern, key) {
                var ayto = this;
                ayto.type = T_SIMPLEMATCHER;
                ayto.tt = type || T_CHAR;
                ayto.tn = name;
                ayto.tk = key || 0;
                ayto.tg = 0;
                ayto.tp = null;
                ayto.p = null;
                ayto.np = null;
                
                // get a fast customized matcher for < pattern >
                switch ( ayto.tt )
                {
                    case T_CHAR: case T_CHARLIST:
                        ayto.tp = pattern;
                        break;
                    case T_STR:
                        ayto.tp = pattern;
                        ayto.p = {};
                        ayto.p[ '' + pattern.charAt(0) ] = 1;
                        break;
                    case T_REGEX:
                        ayto.tp = pattern[ 0 ];
                        ayto.p = pattern[ 1 ].peek || null;
                        ayto.np = pattern[ 1 ].negativepeek || null;
                        ayto.tg = pattern[ 2 ] || 0;
                        break;
                    case T_NULL:
                        ayto.tp = null;
                        break;
                }
            },
            
            // matcher type
            type: null,
            // token type
            tt: null,
            // token name
            tn: null,
            // token pattern
            tp: null,
            // token pattern group
            tg: 0,
            // token key
            tk: 0,
            // pattern peek chars
            p: null,
            // pattern negative peek chars
            np: null,
            
            get : function(stream, eat) {
                var matchedResult, ayto = this,
                    tokenType = ayto.tt, tokenKey = ayto.tk, 
                    tokenPattern = ayto.tp, tokenPatternGroup = ayto.tg,
                    startsWith = ayto.p, notStartsWith = ayto.np
                ;    
                // get a fast customized matcher for < pattern >
                switch ( tokenType )
                {
                    case T_CHAR:
                        if ( matchedResult = stream.chr(tokenPattern, eat) ) return [ tokenKey, matchedResult ];
                        break;
                    case T_CHARLIST:
                        if ( matchedResult = stream.chl(tokenPattern, eat) ) return [ tokenKey, matchedResult ];
                        break;
                    case T_STR:
                        if ( matchedResult = stream.str(tokenPattern, startsWith, eat) ) return [ tokenKey, matchedResult ];
                        break;
                    case T_REGEX:
                        if ( matchedResult = stream.rex(tokenPattern, startsWith, notStartsWith, tokenPatternGroup, eat) ) return [ tokenKey, matchedResult ];
                        break;
                    case T_NULL:
                        // matches end-of-line
                        (false !== eat) && stream.end(); // skipToEnd
                        return [ tokenKey, "" ];
                        break;
                }
                return false;
            },
            
            toString : function() {
                return ['[', 'Matcher: ', this.tn, ', Pattern: ', ((this.tp) ? this.tp.toString() : null), ']'].join('');
            }
        }),
        
        CompositeMatcher = Class(SimpleMatcher, {
            
            constructor : function(name, matchers, useOwnKey) {
                var ayto = this;
                ayto.type = T_COMPOSITEMATCHER;
                ayto.tn = name;
                ayto.ms = matchers;
                ayto.ownKey = (false!==useOwnKey);
            },
            
            // group of matchers
            ms : null,
            ownKey : true,
            
            get : function(stream, eat) {
                var i, m, matchers = this.ms, l = matchers.length, useOwnKey = this.ownKey;
                for (i=0; i<l; i++)
                {
                    // each one is a matcher in its own
                    m = matchers[i].get(stream, eat);
                    if ( m ) return ( useOwnKey ) ? [ i, m[1] ] : m;
                }
                return false;
            }
        }),
        
        BlockMatcher = Class(SimpleMatcher, {
            
            constructor : function(name, start, end) {
                var ayto = this;
                ayto.type = T_BLOCKMATCHER;
                ayto.tn = name;
                ayto.s = new CompositeMatcher(ayto.tn + '_Start', start, false);
                ayto.e = end;
            },
            
            // start block matcher
            s : null,
            // end block matcher
            e : null,
            
            get : function(stream, eat) {
                    
                var ayto = this, startMatcher = ayto.s, endMatchers = ayto.e, token;
                
                // matches start of block using startMatcher
                // and returns the associated endBlock matcher
                if ( token = startMatcher.get(stream, eat) )
                {
                    // use the token key to get the associated endMatcher
                    var endMatcher = endMatchers[ token[0] ], T = get_type( endMatcher ), T0 = startMatcher.ms[ token[0] ].tt;
                    
                    if ( T_REGEX == T0 )
                    {
                        // regex group number given, get the matched group pattern for the ending of this block
                        if ( T_NUM == T )
                        {
                            // the regex is wrapped in an additional group, 
                            // add 1 to the requested regex group transparently
                            endMatcher = new SimpleMatcher( T_STR, ayto.tn + '_End', token[1][ endMatcher+1 ] );
                        }
                        // string replacement pattern given, get the proper pattern for the ending of this block
                        else if ( T_STR == T )
                        {
                            // the regex is wrapped in an additional group, 
                            // add 1 to the requested regex group transparently
                            endMatcher = new SimpleMatcher( T_STR, ayto.tn + '_End', groupReplace(endMatcher, token[1]) );
                        }
                    }
                    return endMatcher;
                }
                
                return false;
            }
        }),
        
        getSimpleMatcher = function(name, pattern, key, cachedMatchers) {
            var T = get_type( pattern );
            
            if ( T_NUM == T ) return pattern;
            
            if ( !cachedMatchers[ name ] )
            {
                key = key || 0;
                var matcher;
                var is_char_list = 0;
                
                if ( pattern && pattern.isCharList )
                {
                    is_char_list = 1;
                    delete pattern.isCharList;
                }
                
                // get a fast customized matcher for < pattern >
                if ( T_NULL & T ) matcher = new SimpleMatcher(T_NULL, name, pattern, key);
                
                else if ( T_CHAR == T ) matcher = new SimpleMatcher(T_CHAR, name, pattern, key);
                
                else if ( T_STR & T ) matcher = (is_char_list) ? new SimpleMatcher(T_CHARLIST, name, pattern, key) : new SimpleMatcher(T_STR, name, pattern, key);
                
                else if ( /*T_REGEX*/T_ARRAY & T ) matcher = new SimpleMatcher(T_REGEX, name, pattern, key);
                
                // unknown
                else matcher = pattern;
                
                cachedMatchers[ name ] = matcher;
            }
            
            return cachedMatchers[ name ];
        },
        
        getCompositeMatcher = function(name, tokens, RegExpID, combined, cachedRegexes, cachedMatchers) {
            
            if ( !cachedMatchers[ name ] )
            {
                var tmp, i, l, l2, array_of_arrays = 0, has_regexs = 0, is_char_list = 1, T1, T2;
                var matcher;
                
                tmp = make_array( tokens );
                l = tmp.length;
                
                if ( 1 == l )
                {
                    matcher = getSimpleMatcher( name, getRegexp( tmp[0], RegExpID, cachedRegexes ), 0, cachedMatchers );
                }
                else if ( 1 < l /*combined*/ )
                {   
                    l2 = (l>>1) + 1;
                    // check if tokens can be combined in one regular expression
                    // if they do not contain sub-arrays or regular expressions
                    for (i=0; i<=l2; i++)
                    {
                        T1 = get_type( tmp[i] );
                        T2 = get_type( tmp[l-1-i] );
                        
                        if ( (T_CHAR != T1) || (T_CHAR != T2) ) 
                        {
                            is_char_list = 0;
                        }
                        
                        if ( (T_ARRAY & T1) || (T_ARRAY & T2) ) 
                        {
                            array_of_arrays = 1;
                            //break;
                        }
                        else if ( hasPrefix( tmp[i], RegExpID ) || hasPrefix( tmp[l-1-i], RegExpID ) )
                        {
                            has_regexs = 1;
                            //break;
                        }
                    }
                    
                    if ( is_char_list && ( !combined || !( T_STR & get_type(combined) ) ) )
                    {
                        tmp = tmp.slice().join('');
                        tmp.isCharList = 1;
                        matcher = getSimpleMatcher( name, tmp, 0, cachedMatchers );
                    }
                    else if ( combined && !(array_of_arrays || has_regexs) )
                    {   
                        matcher = getSimpleMatcher( name, getCombinedRegexp( tmp, combined ), 0, cachedMatchers );
                    }
                    else
                    {
                        for (i=0; i<l; i++)
                        {
                            if ( T_ARRAY & get_type( tmp[i] ) )
                                tmp[i] = getCompositeMatcher( name + '_' + i, tmp[i], RegExpID, combined, cachedRegexes, cachedMatchers );
                            else
                                tmp[i] = getSimpleMatcher( name + '_' + i, getRegexp( tmp[i], RegExpID, cachedRegexes ), i, cachedMatchers );
                        }
                        
                        matcher = (l > 1) ? new CompositeMatcher( name, tmp ) : tmp[0];
                    }
                }
                
                cachedMatchers[ name ] = matcher;
            }
            
            return cachedMatchers[ name ];
        },
        
        getBlockMatcher = function(name, tokens, RegExpID, cachedRegexes, cachedMatchers) {
            
            if ( !cachedMatchers[ name ] )
            {
                var tmp, i, l, start, end, t1, t2;
                
                // build start/end mappings
                start = []; end = [];
                tmp = make_array_2( tokens ); // array of arrays
                for (i=0, l=tmp.length; i<l; i++)
                {
                    t1 = getSimpleMatcher( name + '_0_' + i, getRegexp( tmp[i][0], RegExpID, cachedRegexes ), i, cachedMatchers );
                    if (tmp[i].length>1)
                    {
                        if ( T_REGEX == t1.tt && T_STR == get_type( tmp[i][1] ) && !hasPrefix( tmp[i][1], RegExpID ) )
                            t2 = tmp[i][1];
                        else
                            t2 = getSimpleMatcher( name + '_1_' + i, getRegexp( tmp[i][1], RegExpID, cachedRegexes ), i, cachedMatchers );
                    }
                    else
                    {
                        t2 = t1;
                    }
                    start.push( t1 );  end.push( t2 );
                }
                
                cachedMatchers[ name ] = new BlockMatcher(name, start, end);
            }
            
            return cachedMatchers[ name ];
        }
    ;
    
    //
    // tokenizer factories
    var
        _id_ = 0, getId = function() { return ++_id_; },
        emptyStack = function(stack, id) {
            if (id)
            {
                while (stack.length && id == stack[stack.length-1].sID) 
                    stack.pop();
            }
            else
            {
                stack.length = 0;
            }
            return stack;
        },
        
        SimpleToken = Class({
            
            constructor : function(name, token, style) {
                var ayto = this;
                ayto.tt = T_SIMPLE;
                ayto.tn = name;
                ayto.t = token;
                ayto.r = style;
                ayto.REQ = 0;
                ayto.ERR = 0;
                ayto.toClone = ['t', 'r'];
            },
            
            // stack id
            sID: null,
            // tokenizer/token name
            tn : null,
            // tokenizer type
            tt : null,
            // tokenizer token matcher
            t : null,
            // tokenizer return val
            r : null,
            REQ : 0,
            ERR : 0,
            toClone: null,
            
            err : function() {
                var tokenizer = this;
                if (T_NONSPACE == tokenizer.tt) return "NONSPACE Required";
                else if (T_EOL == tokenizer.tt) return "EOL Required";
                return (tokenizer.REQ) ? ('Token Missing "'+tokenizer.tn+'"') : ('Syntax Error "'+tokenizer.tn+'"');
            },
        
            get : function( stream, state ) {
                var ayto = this, token = ayto.t, type = ayto.tt;
                // match EOL ( with possible leading spaces )
                if ( T_EOL == type ) 
                { 
                    stream.spc();
                    if ( stream.eol() )
                    {
                        state.t = T_DEFAULT; 
                        //state.r = ayto.r; 
                        return ayto.r; 
                    }
                }
                // match non-space
                else if ( T_NONSPACE == type ) 
                { 
                    ayto.ERR = ( ayto.REQ && stream.spc() && !stream.eol() ) ? 1 : 0;
                    ayto.REQ = 0;
                }
                // else match a simple token
                else if ( token.get(stream) ) 
                { 
                    state.t = ayto.tt; 
                    //state.r = ayto.r; 
                    return ayto.r; 
                }
                return false;
            },
            
            require : function(bool) { 
                this.REQ = (bool) ? 1 : 0;
                return this;
            },
            
            push : function(stack, pos, token, stackId) {
                // associate a stack id with this token
                // as part of a posible syntax sequence
                if ( stackId ) token.sID = stackId;
                if ( pos < stack.length ) stack.splice( pos, 0, token );
                else stack.push( token );
            },
            
            clone : function() {
                var ayto = this, t, i, toClone = ayto.toClone, toClonelen;
                
                t = new ayto.$class();
                t.tt = ayto.tt;
                t.tn = ayto.tn;
                
                if (toClone && toClone.length)
                {
                    for (i=0, toClonelen = toClone.length; i<toClonelen; i++)   
                        t[ toClone[i] ] = ayto[ toClone[i] ];
                }
                return t;
            },
            
            toString : function() {
                return ['[', 'Tokenizer: ', this.tn, ', Matcher: ', ((this.t) ? this.t.toString() : null), ']'].join('');
            }
        }),
        
        BlockToken = Class(SimpleToken, {
            
            constructor : function(type, name, token, style, styleInterior, allowMultiline, escChar) {
                var ayto = this;
                ayto.$super('constructor', name, token, style);
                ayto.ri = ( 'undefined' == typeof(styleInterior) ) ? ayto.r : styleInterior;
                ayto.tt = type;
                // a block is multiline by default
                ayto.mline = ( 'undefined' == typeof(allowMultiline) ) ? 1 : allowMultiline;
                ayto.esc = escChar || "\\";
                ayto.toClone = ['t', 'r', 'ri', 'mline', 'esc'];
            },    
            
            // return val for interior
            ri : null,
            mline : 0,
            esc : null,
            
            get : function( stream, state ) {
            
                var ayto = this, ended = 0, found = 0, endBlock, next = "", continueToNextLine, stackPos, 
                    allowMultiline = ayto.mline, startBlock = ayto.t, thisBlock = ayto.tn, type = ayto.tt,
                    style = ayto.r, styleInterior = ayto.ri, differentInterior = (style != styleInterior),
                    charIsEscaped = 0, isEscapedBlock = (T_ESCBLOCK == type), escChar = ayto.esc,
                    isEOLBlock, alreadyIn, ret, streamPos, streamPos0, continueBlock
                ;
                
                /*
                    This tokenizer class handles many different block types ( BLOCK, COMMENT, ESC_BLOCK, SINGLE_LINE_BLOCK ),
                    having different styles ( DIFFERENT BLOCK DELIMS/INTERIOR ) etc..
                    So logic can become somewhat complex,
                    descriptive names and logic used here for clarity as far as possible
                */
                
                // comments in general are not required tokens
                if ( T_COMMENT == type ) ayto.REQ = 0;
                
                alreadyIn = 0;
                if ( state.inBlock == thisBlock )
                {
                    found = 1;
                    endBlock = state.endBlock;
                    alreadyIn = 1;
                    ret = styleInterior;
                }    
                else if ( !state.inBlock && (endBlock = startBlock.get(stream)) )
                {
                    found = 1;
                    state.inBlock = thisBlock;
                    state.endBlock = endBlock;
                    ret = style;
                }    
                
                if ( found )
                {
                    stackPos = state.stack.length;
                    
                    isEOLBlock = (T_NULL == endBlock.tt);
                    
                    if ( differentInterior )
                    {
                        if ( alreadyIn && isEOLBlock && stream.sol() )
                        {
                            ayto.REQ = 0;
                            state.inBlock = null;
                            state.endBlock = null;
                            return false;
                        }
                        
                        if ( !alreadyIn )
                        {
                            ayto.push( state.stack, stackPos, ayto.clone(), thisBlock );
                            state.t = type;
                            //state.r = ret; 
                            return ret;
                        }
                    }
                    
                    ended = endBlock.get(stream);
                    continueToNextLine = allowMultiline;
                    continueBlock = 0;
                    
                    if ( !ended )
                    {
                        streamPos0 = stream.pos;
                        while ( !stream.eol() ) 
                        {
                            streamPos = stream.pos;
                            if ( !(isEscapedBlock && charIsEscaped) && endBlock.get(stream) ) 
                            {
                                if ( differentInterior )
                                {
                                    if ( stream.pos > streamPos && streamPos > streamPos0)
                                    {
                                        ret = styleInterior;
                                        stream.bck2(streamPos);
                                        continueBlock = 1;
                                    }
                                    else
                                    {
                                        ret = style;
                                        ended = 1;
                                    }
                                }
                                else
                                {
                                    ret = style;
                                    ended = 1;
                                }
                                break;
                            }
                            else
                            {
                                next = stream.nxt();
                            }
                            charIsEscaped = !charIsEscaped && next == escChar;
                        }
                    }
                    else
                    {
                        ret = (isEOLBlock) ? styleInterior : style;
                    }
                    continueToNextLine = allowMultiline || (isEscapedBlock && charIsEscaped);
                    
                    if ( ended || (!continueToNextLine && !continueBlock) )
                    {
                        state.inBlock = null;
                        state.endBlock = null;
                    }
                    else
                    {
                        ayto.push( state.stack, stackPos, ayto.clone(), thisBlock );
                    }
                    
                    state.t = type;
                    //state.r = ret; 
                    return ret;
                }
                
                //state.inBlock = null;
                //state.endBlock = null;
                return false;
            }
        }),
                
        RepeatedTokens = Class(SimpleToken, {
                
            constructor : function( name, tokens, min, max ) {
                var ayto = this;
                ayto.tt = T_REPEATED;
                ayto.tn = name || null;
                ayto.t = null;
                ayto.ts = null;
                ayto.min = min || 0;
                ayto.max = max || INF;
                ayto.found = 0;
                ayto.toClone = ['ts', 'min', 'max', 'found'];
                if (tokens) ayto.set( tokens );
            },
            
            ts: null,
            min: 0,
            max: 1,
            found : 0,
            
            set : function( tokens ) {
                if ( tokens ) this.ts = make_array( tokens );
                return this;
            },
            
            get : function( stream, state ) {
            
                var ayto = this, i, token, style, tokens = ayto.ts, n = tokens.length, 
                    found = ayto.found, min = ayto.min, max = ayto.max,
                    tokensRequired = 0, streamPos, stackPos, stackId;
                
                ayto.ERR = 0;
                ayto.REQ = 0;
                streamPos = stream.pos;
                stackPos = state.stack.length;
                stackId = ayto.tn + '_' + getId();
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i].clone().require(1);
                    style = token.get(stream, state);
                    
                    if ( false !== style )
                    {
                        ++found;
                        if ( found <= max )
                        {
                            // push it to the stack for more
                            ayto.found = found;
                            ayto.push( state.stack, stackPos, ayto.clone(), stackId );
                            ayto.found = 0;
                            return style;
                        }
                        break;
                    }
                    else if ( token.REQ )
                    {
                        tokensRequired++;
                    }
                    if ( token.ERR ) stream.bck2( streamPos );
                }
                
                ayto.REQ = found < min;
                ayto.ERR = found > max || (found < min && 0 < tokensRequired);
                return false;
            }
        }),
        
        EitherTokens = Class(RepeatedTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens, 1, 1);
                this.tt = T_EITHER;
            },
            
            get : function( stream, state ) {
            
                var ayto = this, style, token, i, tokens = ayto.ts, n = tokens.length, 
                    tokensRequired = 0, tokensErr = 0, streamPos;
                
                ayto.REQ = 1;
                ayto.ERR = 0;
                streamPos = stream.pos;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i].clone();
                    style = token.get(stream, state);
                    
                    tokensRequired += (token.REQ) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        return style;
                    }
                    else if ( token.ERR )
                    {
                        tokensErr++;
                        stream.bck2( streamPos );
                    }
                }
                
                ayto.REQ = (tokensRequired > 0);
                ayto.ERR = (n == tokensErr && tokensRequired > 0);
                return false;
            }
        }),

        AllTokens = Class(RepeatedTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens, 1, 1);
                this.tt = T_ALL;
            },
            
            get : function( stream, state ) {
                
                var ayto = this, token, style, tokens = ayto.ts, n = tokens.length,
                    streamPos, stackPos, stackId;
                
                ayto.REQ = 1;
                ayto.ERR = 0;
                streamPos = stream.pos;
                stackPos = state.stack.length;
                stackId = ayto.tn + '_' + getId();
                token = tokens[ 0 ].clone().require( 1 );
                style = token.get(stream, state);
                
                if ( false !== style )
                {
                    for (var i=n-1; i>0; i--)
                        ayto.push( state.stack, stackPos+n-i-1, tokens[ i ].clone().require( 1 ), stackId );
                        
                    return style;
                }
                else if ( token.ERR /*&& token.REQ*/ )
                {
                    ayto.ERR = 1;
                    stream.bck2( streamPos );
                }
                else if ( token.REQ )
                {
                    ayto.ERR = 1;
                }
                
                return false;
            }
        }),
                
        NGramToken = Class(RepeatedTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens, 1, 1);
                this.tt = T_NGRAM;
            },
            
            get : function( stream, state ) {
                
                var ayto = this, token, style, tokens = ayto.ts, n = tokens.length, 
                    streamPos, stackPos, stackId;
                
                ayto.REQ = 0;
                ayto.ERR = 0;
                streamPos = stream.pos;
                stackPos = state.stack.length;
                stackId = ayto.tn + '_' + getId();
                token = tokens[ 0 ].clone().require( 0 );
                style = token.get(stream, state);
                
                if ( false !== style )
                {
                    for (var i=n-1; i>0; i--)
                        ayto.push( state.stack, stackPos+n-i-1, tokens[ i ].clone().require( 1 ), stackId );
                    
                    return style;
                }
                else if ( token.ERR )
                {
                    stream.bck2( streamPos );
                }
                
                return false;
            }
        }),
                
        getTokenizer = function(tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords) {
            
            if ( null === tokenID )
            {
                // EOL Tokenizer
                var token = new SimpleToken( tokenID, tokenID, DEFAULTSTYLE );
                token.tt = T_EOL;
                return token;
            }
            
            else if ( "" === tokenID )
            {
                // NONSPACE Tokenizer
                var token = new SimpleToken( tokenID, tokenID, DEFAULTSTYLE );
                token.tt = T_NONSPACE;
                return token;
            }
            
            else
            {
                tokenID = '' + tokenID;
                
                if ( !cachedTokens[ tokenID ] )
                {
                    var tok, token = null, type, combine, action, matchType, tokens, subTokenizers;
                
                    // allow token to be literal and wrap to simple token with default style
                    tok = Lex[ tokenID ] || Syntax[ tokenID ] || { type: "simple", tokens: tokenID };
                    
                    if ( tok )
                    {
                        // tokens given directly, no token configuration object, wrap it
                        if ( (T_STR | T_ARRAY) & get_type( tok ) )
                        {
                            tok = { type: "simple", tokens: tok };
                        }
                        
                        // provide some defaults
                        type = (tok.type) ? tokenTypes[ tok.type.toUpperCase().replace('-', '').replace('_', '') ] : T_SIMPLE;
                        
                        if ( T_SIMPLE & type )
                        {
                            if ( "" === tok.tokens )
                            {
                                // NONSPACE Tokenizer
                                token = new SimpleToken( tokenID, "", DEFAULTSTYLE );
                                token.tt = T_NONSPACE;
                                // pre-cache tokenizer to handle recursive calls to same tokenizer
                                cachedTokens[ tokenID ] = token;
                                return token;
                            }
                            else if ( null === tok.tokens )
                            {
                                // EOL Tokenizer
                                token = new SimpleToken( tokenID, "", DEFAULTSTYLE );
                                token.tt = T_EOL;
                                // pre-cache tokenizer to handle recursive calls to same tokenizer
                                cachedTokens[ tokenID ] = token;
                                return token;
                            }
                        }
            
                        tok.tokens = make_array( tok.tokens );
                        action = tok.action || null;
                        
                        if ( T_SIMPLE & type )
                        {
                            if ( tok.autocomplete ) getAutoComplete(tok, tokenID, keywords);
                            
                            // combine by default if possible using word-boundary delimiter
                            combine = ( 'undefined' ==  typeof(tok.combine) ) ? "\\b" : tok.combine;
                            token = new SimpleToken( 
                                        tokenID,
                                        getCompositeMatcher( tokenID, tok.tokens.slice(), RegExpID, combine, cachedRegexes, cachedMatchers ), 
                                        Style[ tokenID ] || DEFAULTSTYLE
                                    );
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                        }
                        
                        else if ( T_BLOCK & type )
                        {
                            if ( T_COMMENT & type ) getComments(tok, comments);

                            token = new BlockToken( 
                                        type,
                                        tokenID,
                                        getBlockMatcher( tokenID, tok.tokens.slice(), RegExpID, cachedRegexes, cachedMatchers ), 
                                        Style[ tokenID ] || DEFAULTSTYLE,
                                        // allow block delims / block interior to have different styles
                                        Style[ tokenID + '.inside' ],
                                        tok.multiline,
                                        tok.escape
                                    );
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            if ( tok.interleave ) commentTokens.push( token.clone() );
                        }
                        
                        else if ( T_GROUP & type )
                        {
                            tokens = tok.tokens.slice();
                            if ( T_ARRAY & get_type( tok.match ) )
                            {
                                token = new RepeatedTokens(tokenID, null, tok.match[0], tok.match[1]);
                            }
                            else
                            {
                                matchType = groupTypes[ tok.match.toUpperCase() ]; 
                                
                                if (T_ZEROORONE == matchType) 
                                    token = new RepeatedTokens(tokenID, null, 0, 1);
                                
                                else if (T_ZEROORMORE == matchType) 
                                    token = new RepeatedTokens(tokenID, null, 0, INF);
                                
                                else if (T_ONEORMORE == matchType) 
                                    token = new RepeatedTokens(tokenID, null, 1, INF);
                                
                                else if (T_EITHER & matchType) 
                                    token = new EitherTokens(tokenID, null);
                                
                                else //if (T_ALL == matchType)
                                    token = new AllTokens(tokenID, null);
                            }
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            
                            subTokenizers = [];
                            for (var i=0, l=tokens.length; i<l; i++)
                                subTokenizers = subTokenizers.concat( getTokenizer( tokens[i], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords ) );
                            
                            token.set( subTokenizers );
                            
                        }
                        
                        else if ( T_NGRAM & type )
                        {
                            // get n-gram tokenizer
                            token = make_array_2( tok.tokens.slice() ).slice(); // array of arrays
                            var ngrams = [], ngram;
                            
                            for (var i=0, l=token.length; i<l; i++)
                            {
                                // get tokenizers for each ngram part
                                ngrams[i] = token[i].slice();
                                // get tokenizer for whole ngram
                                token[i] = new NGramToken( tokenID + '_NGRAM_' + i, null );
                            }
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            
                            for (var i=0, l=token.length; i<l; i++)
                            {
                                ngram = ngrams[i];
                                
                                subTokenizers = [];
                                for (var j=0, l2=ngram.length; j<l2; j++)
                                    subTokenizers = subTokenizers.concat( getTokenizer( ngram[j], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens,  comments, keywords ) );
                                
                                // get tokenizer for whole ngram
                                token[i].set( subTokenizers );
                            }
                        }
                    }
                }
                return cachedTokens[ tokenID ];
            }
        },
        
        getComments = function(tok, comments) {
            // build start/end mappings
            var tmp = make_array_2(tok.tokens.slice()); // array of arrays
            var start, end, lead;
            for (i=0, l=tmp.length; i<l; i++)
            {
                start = tmp[i][0];
                end = (tmp[i].length>1) ? tmp[i][1] : tmp[i][0];
                lead = (tmp[i].length>2) ? tmp[i][2] : "";
                
                if ( null === end )
                {
                    // line comment
                    comments.line = comments.line || [];
                    comments.line.push( start );
                }
                else
                {
                    // block comment
                    comments.block = comments.block || [];
                    comments.block.push( [start, end, lead] );
                }
            }
        },
        
        getAutoComplete = function(tok, type, keywords) {
            var kws = [].concat(make_array(tok.tokens)).map(function(word) { return { word: word, meta: type }; });
            keywords.autocomplete = concat.apply( keywords.autocomplete || [], kws );
        },
        
        parseGrammar = function(grammar) {
            var RegExpID, tokens, numTokens, _tokens, 
                Style, Lex, Syntax, t, tokenID, token, tok,
                cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords;
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if ( grammar.__parsed ) return grammar;
            
            cachedRegexes = {}; cachedMatchers = {}; cachedTokens = {}; comments = {}; keywords = {};
            commentTokens = [];
            grammar = clone( grammar );
            
            RegExpID = grammar.RegExpID || null;
            grammar.RegExpID = null;
            delete grammar.RegExpID;
            
            Lex = grammar.Lex || {};
            grammar.Lex = null;
            delete grammar.Lex;
            
            Syntax = grammar.Syntax || {};
            grammar.Syntax = null;
            delete grammar.Syntax;
            
            Style = grammar.Style || {};
            
            _tokens = grammar.Parser || [];
            numTokens = _tokens.length;
            tokens = [];
            
            
            // build tokens
            for (t=0; t<numTokens; t++)
            {
                tokenID = _tokens[ t ];
                
                token = getTokenizer( tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords ) || null;
                
                if ( token )
                {
                    if ( T_ARRAY & get_type( token ) )  tokens = tokens.concat( token );
                    
                    else  tokens.push( token );
                }
            }
            
            grammar.Parser = tokens;
            grammar.cTokens = commentTokens;
            grammar.Style = Style;
            grammar.Comments = comments;
            grammar.Keywords = keywords;
            
            // this grammar is parsed
            grammar.__parsed = 1;
            
            return grammar;
        }
    ;
      
    // ace supposed to be available
    var _ace = (typeof ace !== 'undefined') ? ace : { require: function() { return { }; }, config: {} }, 
        ace_require = _ace.require, ace_config = _ace.config
    ;
    
    //
    // parser factories
    var
        AceWorkerClient = Class(ace_require("ace/worker/worker_client").WorkerClient, {
            constructor: function(topLevelNamespaces, mod, classname) {
                var ayto = this, require = ace_require, config = ace_config;
                ayto.$sendDeltaQueue = ayto.$sendDeltaQueue.bind(ayto);
                ayto.changeListener = ayto.changeListener.bind(ayto);
                ayto.onMessage = ayto.onMessage.bind(ayto);
                if (require.nameToUrl && !require.toUrl)
                    require.toUrl = require.nameToUrl;

                var workerUrl;
                if (config.get("packaged") || !require.toUrl) {
                    workerUrl = config.moduleUrl(mod, "worker");
                } else {
                    var normalizePath = ayto.$normalizePath;
                    workerUrl = normalizePath(require.toUrl("ace/worker/worker.js", null, "_"));

                    var tlns = {};
                    topLevelNamespaces.forEach(function(ns) {
                        tlns[ns] = normalizePath(require.toUrl(ns, null, "_").replace(/(\.js)?(\?.*)?$/, ""));
                    });
                }
                
                ayto.$worker = new Worker(workerUrl);
                
                ayto.$worker.postMessage({
                    load: true,
                    ace_worker_base: thisPath.base + '/' + ace_config.moduleUrl("ace/worker/json")
                });

                ayto.$worker.postMessage({
                    init : true,
                    tlns: tlns,
                    module: mod,
                    classname: classname
                });

                ayto.callbackId = 1;
                ayto.callbacks = {};

                ayto.$worker.onmessage = ayto.onMessage;
            }
        }),
        AceParser = Class(ace_require('ace/tokenizer').Tokenizer, {
            
            constructor: function(grammar, LOC) {
                var ayto = this, rxLine;
                // support comments toggle
                ayto.LC = grammar.Comments.line || null;
                ayto.BC = (grammar.Comments.block) ? { start: grammar.Comments.block[0][0], end: grammar.Comments.block[0][1] } : null;
                if ( ayto.LC )
                {
                    if ( T_ARRAY & get_type(ayto.LC) ) 
                        rxLine = ayto.LC.map( escRegexp ).join( "|" );
                    
                    else 
                        rxLine = escRegexp( ayto.LC );
                    
                    ayto.rxLine = new RegExp("^(\\s*)(?:" + rxLine + ") ?");
                }
                if ( ayto.BC )
                {
                    ayto.rxStart = new RegExp("^(\\s*)(?:" + escRegexp(ayto.BC.start) + ")");
                    ayto.rxEnd = new RegExp("(?:" + escRegexp(ayto.BC.end) + ")\\s*$");
                }

                ayto.DEF = LOC.DEFAULT;
                ayto.ERR = grammar.Style.error || LOC.ERROR;
                
                // support keyword autocompletion
                ayto.Keywords = grammar.Keywords.autocomplete || null;
                
                ayto.Tokens = grammar.Parser || [];
                ayto.cTokens = (grammar.cTokens.length) ? grammar.cTokens : null;
            },
            
            ERR: null,
            DEF: null,
            LC: null,
            BC: null,
            rxLine: null,
            rxStart: null,
            rxEnd: null,
            Keywords: null,
            cTokens: null,
            Tokens: null,

            parse: function(code) {
                code = code || "";
                var lines = code.split(/\r\n|\r|\n/g), l = lines.length, i, tokens = [], data;
                data = { state: new ParserState( ), tokens: null };
                
                for (i=0; i<l; i++)
                {
                    data = this.getLineTokens(lines[i], data.state, i);
                    tokens.push(data.tokens);
                }
                return tokens;
            },
            
            // ACE Tokenizer compatible
            getLineTokens: function(line, state, row) {
                
                var ayto = this, i, rewind, rewind2, ci,
                    tokenizer, interleavedCommentTokens = ayto.cTokens, tokens = ayto.Tokens, numTokens = tokens.length, 
                    aceTokens, token, type, currentError = null,
                    stream, stack, DEFAULT = ayto.DEF, ERROR = ayto.ERR
                ;
                
                aceTokens = []; 
                stream = new ParserStream( line );
                state = (state) ? state.clone( 1 ) : new ParserState( 1, 1 );
                state.l = 1+row;
                stack = state.stack;
                token = { type: null, value: "" };
                type = null;
                
                // if EOL tokenizer is left on stack, pop it now
                if ( stack.length && T_EOL == stack[stack.length-1].tt ) stack.pop();
                
                while ( !stream.eol() )
                {
                    rewind = 0;
                    
                    if ( type && type !== token.type )
                    {
                        if ( token.type ) aceTokens.push( token );
                        token = { type: type, value: stream.cur(1), error: currentError };
                        currentError = null;
                        //stream.sft();
                    }
                    else if ( token.type )
                    {
                        token.value += stream.cur(1);
                        //stream.sft();
                    }
                    
                    // check for non-space tokenizer before parsing space
                    if ( !stack.length || T_NONSPACE != stack[stack.length-1].tt )
                    {
                        if ( stream.spc() )
                        {
                            state.t = T_DEFAULT;
                            state.r = type = DEFAULT;
                            continue;
                        }
                    }
                    
                    while ( stack.length && !stream.eol() )
                    {
                        if ( interleavedCommentTokens )
                        {
                            ci = 0; rewind2 = 0;
                            while ( ci < interleavedCommentTokens.length )
                            {
                                tokenizer = interleavedCommentTokens[ci++];
                                state.r = type = tokenizer.get(stream, state);
                                if ( false !== type )
                                {
                                    rewind2 = 1;
                                    break;
                                }
                            }
                            if ( rewind2 )
                            {
                                rewind = 1;
                                break;
                            }
                        }
                    
                        tokenizer = stack.pop();
                        state.r = type = tokenizer.get(stream, state);
                    
                        // match failed
                        if ( false === type )
                        {
                            // error
                            if ( tokenizer.ERR || tokenizer.REQ )
                            {
                                // empty the stack
                                //stack.length = 0;
                                emptyStack(stack, tokenizer.sID);
                                // skip this character
                                stream.nxt();
                                // generate error
                                state.t = T_ERROR;
                                state.r = type = ERROR;
                                rewind = 1;
                                currentError = tokenizer.err();
                                break;
                            }
                            // optional
                            else
                            {
                                continue;
                            }
                        }
                        // found token
                        else
                        {
                            rewind = 1;
                            break;
                        }
                    }
                    
                    if ( rewind ) continue;
                    if ( stream.eol() ) break;
                    
                    for (i=0; i<numTokens; i++)
                    {
                        tokenizer = tokens[i];
                        state.r = type = tokenizer.get(stream, state);
                        
                        // match failed
                        if ( false === type )
                        {
                            // error
                            if ( tokenizer.ERR || tokenizer.REQ )
                            {
                                // empty the stack
                                //stack.length = 0;
                                emptyStack(stack, tokenizer.sID);
                                // skip this character
                                stream.nxt();
                                // generate error
                                state.t = T_ERROR;
                                state.r = type = ERROR;
                                rewind = 1;
                                currentError = tokenizer.err();
                                break;
                            }
                            // optional
                            else
                            {
                                continue;
                            }
                        }
                        // found token
                        else
                        {
                            rewind = 1;
                            break;
                        }
                    }
                    
                    if ( rewind ) continue;
                    if ( stream.eol() ) break;
                    
                    // unknown, bypass
                    stream.nxt();
                    state.t = T_DEFAULT;
                    state.r = type = DEFAULT;
                }
                
                if ( type && type !== token.type )
                {
                    if ( token.type ) aceTokens.push( token );
                    aceTokens.push( { type: type, value: stream.cur(1), error: currentError } );
                    currentError = null;
                }
                else if ( token.type )
                {
                    token.value += stream.cur(1);
                    aceTokens.push( token );
                }
                token = null;
                
                //console.log(aceTokens);
                
                // ACE Tokenizer compatible
                return { state: state, tokens: aceTokens };
            },
            
            tCL : function(state, session, startRow, endRow) {
                var ayto = this,
                    doc = session.doc,
                    ignoreBlankLines = true,
                    shouldRemove = true,
                    minIndent = Infinity,
                    tabSize = session.getTabSize(),
                    insertAtTabStop = false,
                    comment, uncomment, testRemove, shouldInsertSpace
                ;
                
                if ( !ayto.LC ) 
                {
                    if ( !ayto.BC ) return false;
                    
                    var lineCommentStart = ayto.BC.start,
                        lineCommentEnd = ayto.BC.end,
                        regexpStart = ayto.rxStart,
                        regexpEnd = ayto.rxEnd
                    ;

                    comment = function(line, i) {
                        if (testRemove(line, i)) return;
                        if (!ignoreBlankLines || /\S/.test(line)) 
                        {
                            doc.insertInLine({row: i, column: line.length}, lineCommentEnd);
                            doc.insertInLine({row: i, column: minIndent}, lineCommentStart);
                        }
                    };

                    uncomment = function(line, i) {
                        var m;
                        if (m = line.match(regexpEnd))
                            doc.removeInLine(i, line.length - m[0].length, line.length);
                        if (m = line.match(regexpStart))
                            doc.removeInLine(i, m[1].length, m[0].length);
                    };

                    testRemove = function(line, row) {
                        if (regexpStart.test(line)) return true;
                        var tokens = session.getTokens(row);
                        for (var i = 0; i < tokens.length; i++) 
                        {
                            if (tokens[i].type === 'comment') return true;
                        }
                    };
                } 
                else 
                {
                    var lineCommentStart = (T_ARRAY == get_type(ayto.LC)) ? ayto.LC[0] : ayto.LC,
                        regexpLine = ayto.rxLine,
                        commentWithSpace = lineCommentStart + " ",
                        minEmptyLength
                    ;
                    
                    insertAtTabStop = session.getUseSoftTabs();

                    uncomment = function(line, i) {
                        var m = line.match(regexpLine), start, end;
                        if (!m) return;
                        start = m[1].length; end = m[0].length;
                        if (!shouldInsertSpace(line, start, end) && m[0][end - 1] == " ")  end--;
                        doc.removeInLine(i, start, end);
                    };
                    
                    comment = function(line, i) {
                        if (!ignoreBlankLines || /\S/.test(line)) 
                        {
                            if (shouldInsertSpace(line, minIndent, minIndent))
                                doc.insertInLine({row: i, column: minIndent}, commentWithSpace);
                            else
                                doc.insertInLine({row: i, column: minIndent}, lineCommentStart);
                        }
                    };
                    
                    testRemove = function(line, i) {
                        return regexpLine.test(line);
                    };

                    shouldInsertSpace = function(line, before, after) {
                        var spaces = 0;
                        while (before-- && line.charAt(before) == " ") spaces++;
                        if (spaces % tabSize != 0) return false;
                        spaces = 0;
                        while (line.charAt(after++) == " ") spaces++;
                        if (tabSize > 2)  return spaces % tabSize != tabSize - 1;
                        else  return spaces % tabSize == 0;
                        return true;
                    };
                }

                function iterate( applyMethod ) { for (var i=startRow; i<=endRow; i++) applyMethod(doc.getLine(i), i); }


                minEmptyLength = Infinity;
                
                iterate(function(line, i) {
                    var indent = line.search(/\S/);
                    if (indent !== -1) 
                    {
                        if (indent < minIndent)  minIndent = indent;
                        if (shouldRemove && !testRemove(line, i)) shouldRemove = false;
                    } 
                    else if (minEmptyLength > line.length)
                    {
                        minEmptyLength = line.length;
                    }
                });

                if (Infinity == minIndent) 
                {
                    minIndent = minEmptyLength;
                    ignoreBlankLines = false;
                    shouldRemove = false;
                }

                if (insertAtTabStop && minIndent % tabSize != 0)
                    minIndent = Math.floor(minIndent / tabSize) * tabSize;

                iterate(shouldRemove ? uncomment : comment);
            },

            tBC : function(state, session, range, cursor) {
                var ayto = this, 
                    TokenIterator = ace_require('ace/token_iterator').TokenIterator,
                    Range = ace_require('ace/range').Range,
                    comment = ayto.BC, iterator, token, sel,
                    initialRange, startRow, colDiff,
                    startRange, endRange, i, row, column
                ;
                if (!comment) return;

                iterator = new TokenIterator(session, cursor.row, cursor.column);
                token = iterator.getCurrentToken();

                sel = session.selection;
                initialRange = sel.toOrientedRange();

                if (token && /comment/.test(token.type)) 
                {
                    while (token && /comment/.test(token.type)) 
                    {
                        i = token.value.indexOf(comment.start);
                        if (i != -1) 
                        {
                            row = iterator.getCurrentTokenRow();
                            column = iterator.getCurrentTokenColumn() + i;
                            startRange = new Range(row, column, row, column + comment.start.length);
                            break;
                        }
                        token = iterator.stepBackward();
                    };

                    iterator = new TokenIterator(session, cursor.row, cursor.column);
                    token = iterator.getCurrentToken();
                    while (token && /comment/.test(token.type)) 
                    {
                        i = token.value.indexOf(comment.end);
                        if (i != -1) 
                        {
                            row = iterator.getCurrentTokenRow();
                            column = iterator.getCurrentTokenColumn() + i;
                            endRange = new Range(row, column, row, column + comment.end.length);
                            break;
                        }
                        token = iterator.stepForward();
                    }
                    if (endRange)
                        session.remove(endRange);
                    if (startRange) 
                    {
                        session.remove(startRange);
                        startRow = startRange.start.row;
                        colDiff = -comment.start.length;
                    }
                } 
                else 
                {
                    colDiff = comment.start.length;
                    startRow = range.start.row;
                    session.insert(range.end, comment.end);
                    session.insert(range.start, comment.start);
                }
                if (initialRange.start.row == startRow)
                    initialRange.start.column += colDiff;
                if (initialRange.end.row == startRow)
                    initialRange.end.column += colDiff;
                session.selection.fromOrientedRange(initialRange);
            },
            
            // Default indentation, TODO
            indent : function(line) { return line.match(/^\s*/)[0]; },
            
            getNextLineIndent : function(state, line, tab) { return line.match(/^\s*/)[0]; }
        }),
        
        getParser = function(grammar, LOCALS) {
            return new AceParser(grammar, LOCALS);
        },
        
        getAceMode = function(parser, grammar) {
            
            var mode;
            
            // ACE-compatible Mode
            return mode = {
                /*
                // Maybe needed in later versions..
                
                createModeDelegates: function (mapping) { },

                $delegator: function(method, args, defaultHandler) { },
                */
                
                // the custom Parser/Tokenizer
                getTokenizer: function() { return parser; },
                
                supportGrammarAnnotations: 0,
                
                //HighlightRules: null,
                //$behaviour: parser.$behaviour || null,

                createWorker: function(session) {
                    
                    if ( !mode.supportGrammarAnnotations ) return null;
                    
                    // add this worker as an ace custom module
                    ace_config.setModuleUrl("ace/grammar_worker", thisPath.file);
                    
                    var worker = new AceWorkerClient(['ace'], "ace/grammar_worker", 'AceGrammarWorker');
                    
                    worker.attachToDocument(session.getDocument());
                    
                    // create a worker for this grammar
                    worker.call('Init', [grammar], function(){
                        //console.log('Init returned');
                        // hook worker to enable error annotations
                        worker.on("error", function(e) {
                            //console.log(e.data);
                            session.setAnnotations(e.data);
                        });

                        worker.on("ok", function() {
                            session.clearAnnotations();
                        });
                    });
                    
                    return worker;
                    
                },
                
                transformAction: function(state, action, editor, session, param) { },
                
                //lineCommentStart: parser.LC,
                //blockComment: parser.BC,
                toggleCommentLines: function(state, session, startRow, endRow) { return parser.tCL(state, session, startRow, endRow); },
                toggleBlockComment: function(state, session, range, cursor) { return parser.tBC(state, session, range, cursor); },

                //$getIndent: function(line) { return parser.indent(line); },
                getNextLineIndent: function(state, line, tab) { return parser.getNextLineIndent(state, line, tab); },
                checkOutdent: function(state, line, input) { return false; },
                autoOutdent: function(state, doc, row) { },

                //$createKeywordList: function() { return parser.$createKeywordList(); },
                getKeywords: function( append ) { 
                    var keywords = parser.Keywords;
                    if ( !keywords ) return [];
                    return keywords.map(function(word) {
                        var w = word.word, wm = word.meta;
                        return {
                            name: w,
                            value: w,
                            score: 1000,
                            meta: wm
                        };
                    });
                },
                getCompletions : function(state, session, pos, prefix) {
                    var keywords = parser.Keywords;
                    if ( !keywords ) return [];
                    var len = prefix.length;
                    return keywords.map(function(word) {
                        var w = word.word, wm = word.meta, wl = w.length;
                        var match = (wl >= len) && (prefix == w.substr(0, len));
                        return {
                            name: w,
                            value: w,
                            score: (match) ? (1000 - wl) : 0,
                            meta: wm
                        };
                    });
                }
            };
        },
        
        getMode = function(grammar, DEFAULT) {
            
            var LOCALS = { 
                    // default return code for skipped or not-styled tokens
                    // 'text' should be used in most cases
                    DEFAULT: DEFAULT || DEFAULTSTYLE,
                    ERROR: DEFAULTERROR
                }
            ;
            
            grammar = clone(grammar);
            // build the grammar
            var parsedgrammar = parseGrammar( grammar );
            //console.log(grammar);
            
            return getAceMode( getParser( parsedgrammar, LOCALS ), grammar );
        }
    ;
      
    //
    // workers factories
    if ( isWorker )
    {
    
        var window = this;
        onmessage = function(e) {
            var msg = e.data;
            if (msg.load && msg.ace_worker_base) 
            {        
                // import an ace base worker with needed dependencies ??
                importScripts(msg.ace_worker_base);
                Init.call(window);
            } 
        };
        
        function Init()
        {
            ace.define('ace/grammar_worker', ['require', 'exports', 'module' , 'ace/worker/mirror'], function(require, exports, module) {

                var Mirror = require("./worker/mirror").Mirror;
                exports.AceGrammarWorker = Class(Mirror, {

                    constructor: function( sender ) {
                        var ayto = this;
                        ayto.$super('constructor', sender);
                        ayto.setTimeout( 500 );
                        //ayto.parser = getParser( parseGrammar( current_grammar ), { DEFAULT: DEFAULTSTYLE, ERROR: DEFAULTERROR } );
                    },
                    
                    parser: null,
                    
                    
                    Init: function( grammar, id ) {
                        var ayto = this, sender = ayto.sender;
                        //console.log('Init called '+id);
                        //console.log(grammar);
                        ayto.parser = getParser( parseGrammar( grammar ), { DEFAULT: DEFAULTSTYLE, ERROR: DEFAULTERROR } );
                        sender.callback(1, id);
                    },
                    
                    
                    onUpdate: function() {
                        var ayto = this, sender = ayto.sender, parser = ayto.parser,
                            code, linetokens, tokens, errors,
                            line, lines, t, token, column, errorFound = 0
                        ;
                        
                        if ( !parser )
                        {
                            sender.emit("ok", []);
                            return;
                        }
                        
                        code = ayto.doc.getValue();
                        if ( !code || !code.length ) 
                        {
                            sender.emit("ok", []);
                            return;
                        }
                        
                        errors = [];
                        linetokens = parser.parse( code );
                        lines = linetokens.length;
                        
                        for (line=0; line<lines; line++) 
                        {
                            tokens = linetokens[ line ];
                            if ( !tokens || !tokens.length )  continue;
                            
                            column = 0;
                            for (t=0; t<tokens.length; t++)
                            {
                                token = tokens[t];
                                
                                if ( parser.ERR == token.type )
                                {
                                    errors.push({
                                        row: line,
                                        column: column,
                                        text: token.error || "Syntax Error",
                                        type: "error",
                                        raw: token.error || "Syntax Error"
                                    });
                                    
                                    errorFound = 1;
                                }
                                column += token.value.length;
                            }
                        }
                        if (errorFound)
                        {
                            sender.emit("error", errors);
                        }
                        else
                        {
                            sender.emit("ok", []);
                        }
                    }
                });
            });
        }
    }
  /**
*
*   AceGrammar
*   @version: 0.6.6
*
*   Transform a grammar specification in JSON format, into an ACE syntax-highlight parser mode
*   https://github.com/foo123/ace-grammar
*
**/
    
    //
    //  Ace Grammar main class
    /**[DOC_MARKDOWN]
    *
    * ###AceGrammar Methods
    *
    * __For node with dependencies:__
    *
    * ```javascript
    * AceGrammar = require('build/ace_grammar.js').AceGrammar;
    * // or
    * AceGrammar = require('build/ace_grammar.bundle.js').AceGrammar;
    * ```
    *
    * __For browser with dependencies:__
    *
    * ```html
    * <script src="../build/ace_grammar.bundle.js"></script>
    * <!-- or -->
    * <script src="../build/classy.js"></script>
    * <script src="../build/regexanalyzer.js"></script>
    * <script src="../build/ace_grammar.js"></script>
    * <script> // AceGrammar.getMode(..) , etc.. </script>
    * ```
    *
    [/DOC_MARKDOWN]**/
    DEFAULTSTYLE = "text";
    DEFAULTERROR = "invalid";
    var AceGrammar = {
        
        VERSION : "0.6.6",
        
        // extend a grammar using another base grammar
        /**[DOC_MARKDOWN]
        * __Method__: *extend*
        *
        * ```javascript
        * extendedgrammar = AceGrammar.extend(grammar, basegrammar1 [, basegrammar2, ..]);
        * ```
        *
        * Extend a grammar with basegrammar1, basegrammar2, etc..
        *
        * This way arbitrary dialects and variations can be handled more easily
        [/DOC_MARKDOWN]**/
        extend : extend,
        
        // parse a grammar
        /**[DOC_MARKDOWN]
        * __Method__: *parse*
        *
        * ```javascript
        * parsedgrammar = AceGrammar.parse(grammar);
        * ```
        *
        * This is used internally by the AceGrammar Class
        * In order to parse a JSON grammar to a form suitable to be used by the syntax-highlight parser.
        * However user can use this method to cache a parsedgrammar to be used later.
        * Already parsed grammars are NOT re-parsed when passed through the parse method again
        [/DOC_MARKDOWN]**/
        parse : parseGrammar,
        
        // get an ACE-compatible syntax-highlight mode from a grammar
        /**[DOC_MARKDOWN]
        * __Method__: *getMode*
        *
        * ```javascript
        * mode = AceGrammar.getMode(grammar, [, DEFAULT]);
        * ```
        *
        * This is the main method which transforms a JSON grammar into an ACE syntax-highlight parser.
        * DEFAULT is the default return value ("text" by default) for things that are skipped or not styled
        * In general there is no need to set this value, unless you need to return something else
        [/DOC_MARKDOWN]**/
        getMode : getMode
    };


    /* main code ends here */
    
    /* export the module "AceGrammar" */
    return AceGrammar;
});