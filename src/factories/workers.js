    
    //
    // workers factories
    var
        WorkerClient = ace_require("ace/worker/worker_client").WorkerClient,
        AceWorkerClient = Class(WorkerClient, {
            
            constructor: function(topLevelNamespaces, mod, classname) {
                var require = ace_require, config = _ace.config;
                var ayto = this;
                ayto.$sendDeltaQueue = ayto.$sendDeltaQueue.bind(ayto);
                ayto.changeListener = ayto.changeListener.bind(ayto);
                ayto.onMessage = ayto.onMessage.bind(ayto);
                if (require.nameToUrl && !require.toUrl)
                    require.toUrl = require.nameToUrl;

                var workerUrl = mod;
                if (config.get("packaged") || !require.toUrl) {
                    //workerUrl = config.moduleUrl(mod, "worker");
                } else {
                    var normalizePath = ayto.$normalizePath;
                    //workerUrl = normalizePath(require.toUrl("ace/worker/worker.js", null, "_"));

                    var tlns = {};
                    topLevelNamespaces.forEach(function(ns) {
                        tlns[ns] = normalizePath(require.toUrl(ns, null, "_").replace(/(\.js)?(\?.*)?$/, ""));
                    });
                }
                
                console.log(workerUrl);
                ayto.$worker = new Worker(workerUrl);
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
        })
    ;

    if ( isWorker )
    {
        ;(function(window) {
        if (typeof window.window != "undefined" && window.document) {
            return;
        }

        window.console = function() {
            var msgs = Array.prototype.slice.call(arguments, 0);
            postMessage({type: "log", data: msgs});
        };
        window.console.error =
        window.console.warn = 
        window.console.log =
        window.console.trace = window.console;

        window.window = window;
        window.ace = window;

        window.onerror = function(message, file, line, col, err) {
            if (err)
                console.error("Worker " + err.stack);
            else
                console.error("Worker " + file + " " + line + " " + col);
        };

        window.normalizeModule = function(parentId, moduleName) {
            if (moduleName.indexOf("!") !== -1) {
                var chunks = moduleName.split("!");
                return window.normalizeModule(parentId, chunks[0]) + "!" + window.normalizeModule(parentId, chunks[1]);
            }
            if (moduleName.charAt(0) == ".") {
                var base = parentId.split("/").slice(0, -1).join("/");
                moduleName = (base ? base + "/" : "") + moduleName;
                
                while(moduleName.indexOf(".") !== -1 && previous != moduleName) {
                    var previous = moduleName;
                    moduleName = moduleName.replace(/^\.\//, "").replace(/\/\.\//, "/").replace(/[^\/]+\/\.\.\//, "");
                }
            }
            
            return moduleName;
        };

        window.require = function(parentId, id) {
            if (!id) {
                id = parentId
                parentId = null;
            }
            if (!id.charAt)
                throw new Error("worker.js require() accepts only (parentId, id) as arguments");

            id = window.normalizeModule(parentId, id);

            var module = window.require.modules[id];
            if (module) {
                if (!module.initialized) {
                    module.initialized = true;
                    module.exports = module.factory().exports;
                }
                return module.exports;
            }
            
            var chunks = id.split("/");
            if (!window.require.tlns)
                return console.log("unable to load " + id);
            chunks[0] = window.require.tlns[chunks[0]] || chunks[0];
            var path = chunks.join("/") + ".js";
            
            window.require.id = id;
            importScripts(path);
            return window.require(parentId, id);
        };
        window.require.modules = {};
        window.require.tlns = {};

        window.define = function(id, deps, factory) {
            if (arguments.length == 2) {
                factory = deps;
                if (typeof id != "string") {
                    deps = id;
                    id = window.require.id;
                }
            } else if (arguments.length == 1) {
                factory = id;
                deps = []
                id = window.require.id;
            }

            if (!deps.length)
                deps = ['require', 'exports', 'module']

            if (id.indexOf("text!") === 0) 
                return;
            
            var req = function(childId) {
                return window.require(id, childId);
            };

            window.require.modules[id] = {
                exports: {},
                factory: function() {
                    var module = this;
                    var returnExports = factory.apply(this, deps.map(function(dep) {
                      switch(dep) {
                          case 'require': return req
                          case 'exports': return module.exports
                          case 'module':  return module
                          default:        return req(dep)
                      }
                    }));
                    if (returnExports)
                        module.exports = returnExports;
                    return module;
                }
            };
        };
        window.define.amd = {}

        window.initBaseUrls  = function initBaseUrls(topLevelNamespaces) {
            require.tlns = topLevelNamespaces;
        }

        window.initSender = function initSender() {

            var EventEmitter = window.require("ace/lib/event_emitter").EventEmitter;
            var oop = window.require("ace/lib/oop");
            
            var Sender = function() {};
            
            (function() {
                
                oop.implement(this, EventEmitter);
                        
                this.callback = function(data, callbackId) {
                    postMessage({
                        type: "call",
                        id: callbackId,
                        data: data
                    });
                };
            
                this.emit = function(name, data) {
                    postMessage({
                        type: "event",
                        name: name,
                        data: data
                    });
                };
                
            }).call(Sender.prototype);
            
            return new Sender();
        }

        window.main = null;
        window.sender = null;

        window.onmessage = function(e) {
            var msg = e.data;
            if (msg.command) {
                if (main[msg.command])
                    main[msg.command].apply(main, msg.args);
                else
                    throw new Error("Unknown command:" + msg.command);
            }
            else if (msg.init) {        
                initBaseUrls(msg.tlns);
                require("ace/lib/es5-shim");
                sender = initSender();
                var clazz = require(msg.module)[msg.classname];
                main = new clazz(sender);
            } 
            else if (msg.event && sender) {
                sender._emit(msg.event, msg.data);
            }
        };
        })(this);// https://github.com/kriskowal/es5-shim
        
        require('ace/ace');
        
        var window = this,
            
            //Mirror = ace_require("ace/worker/mirror").Mirror,
            Document = ace.require('ace/document').Document,
            lang = ace.require('ace/lib/lang'),
            AceWorker = Class({
            
                constructor: function(sender) {
                    var ayto = this;
                    ayto.sender = sender;
                    var doc = ayto.doc = new Document("");

                    var deferredUpdate = ayto.deferredUpdate = lang.delayedCall(ayto.onUpdate.bind(ayto));

                    sender.on("change", function(e) {
                        doc.applyDeltas(e.data);
                        if (ayto.$timeout)
                            return deferredUpdate.schedule(ayto.$timeout);
                        ayto.onUpdate();
                    });
                    ayto.$timeout = 500;
                },
                
                sender: null,
                doc: null,
                parser: null,
                $timeout: 500,
                
                __init__: function( grammar ) {
                    this.parser = getParser( parseGrammar( grammar ), { DEFAULT: DEFAULTSTYLE, ERROR: DEFAULTERROR } );
                },
                
                setTimeout: function(timeout) {
                    this.$timeout = timeout;
                },
                
                setValue: function(value) {
                    this.doc.setValue(value);
                    this.deferredUpdate.schedule(this.$timeout);
                },
                
                getValue: function(callbackId) {
                    this.sender.callback(this.doc.getValue(), callbackId);
                },
                
                isPending: function() {
                    return this.deferredUpdate.isPending();
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
                                    row: line+1,
                                    column: column+1,
                                    text: token.error || "Syntax Error",
                                    type: "error",
                                    raw: token.error || "Syntax Error"
                                });
                                
                                errorFound = 1;
                                //break;
                            }
                            column += token.value.length;
                        }
                        /*
                        if (errorFound) 
                        {
                            // break;
                        }
                        */
                    }
                    if (errorFound)
                        sender.emit("error", errors);
                    else
                        sender.emit("ok", []);
                }
            })
        ;
    }
  