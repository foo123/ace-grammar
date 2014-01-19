    
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
  