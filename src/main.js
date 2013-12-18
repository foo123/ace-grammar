    
    var 
        parse = function(grammar) {
            var RegExpID, RegExpGroups, tokens, numTokens, _tokens, 
                Style, Lex, Syntax, t, tokenID, token, tok,
                parsedRegexes = {}, parsedMatchers = {}, parsedTokens = {};
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if ( grammar.__parsed )  return grammar;
            
            grammar = extend(grammar, defaultGrammar);
            
            RegExpID = grammar.RegExpID || null;
            grammar.RegExpID = null;
            delete grammar.RegExpID;
            
            RegExpGroups = grammar.RegExpGroups || {};
            grammar.RegExpGroups = null;
            delete grammar.RegExpGroups;
            
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
                
                token = getTokenizer( tokenID, RegExpID, RegExpGroups, Lex, Syntax, Style, parsedRegexes, parsedMatchers, parsedTokens ) || null;
                
                if ( token )
                {
                    if ( T_ARRAY == get_type( token ) )
                        tokens = tokens.concat( token );
                    
                    else
                        tokens.push( token );
                }
            }
            
            grammar.Parser = tokens;
            grammar.Style = Style;
            
            // this grammar is parsed
            grammar.__parsed = true;
            
            return grammar;
        },
        
        //
        // default grammar settings
        defaultGrammar = {
            
            // prefix ID for regular expressions used in the grammar
            "RegExpID" : null,
            
            // lists of (simple/string) tokens to be grouped into one regular expression,
            // else matched one by one, 
            // this is usefull for speed fine-tuning the parser
            "RegExpGroups" : null,
            
            //
            // Style model
            "Style" : {
                
                // lang token type  -> ACE (style) tag
                "error":                "error"
            },

            //
            // Lexical model
            "Lex" : null,
            
            //
            // Syntax model and context-specific rules (optional)
            "Syntax" : null,
            
            // what to parse and in what order
            "Parser" : null
        }
    ;
    
    /*
    var ace_OOP_inherits = (function() {
        var createObject = Object.create || function(prototype, properties) {
            var Type = function () {};
            Type.prototype = prototype;
            object = new Type();
            object.__proto__ = prototype;
            if (typeof properties !== 'undefined' && Object.defineProperties) {
                Object.defineProperties(object, properties);
            }
        };
        return function(ctor, superCtor) {
            ctor.super_ = superCtor;
            ctor.prototype = createObject(superCtor.prototype, {
                constructor: {
                    value: ctor,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
        };
    }());
    */
    
    //
    //  Ace Grammar main class
    /**[DOC_MARKDOWN]
    *
    * ###AceGrammar Methods
    *
    [/DOC_MARKDOWN]**/
    var self = {
        
        VERSION : VERSION,
        
        init : function(RegExAnalyzer) {
            RegexAnalyzer = RegExAnalyzer;
        },
        
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
        parse : parse,
        
        // get an ACE-compatible syntax-highlight mode from a grammar
        /**[DOC_MARKDOWN]
        * __Method__: *getMode*
        *
        * ```javascript
        * mode = AceGrammar.getMode(grammar, [, DEFAULT]);
        * ```
        *
        * This is the main method which transforms a JSON grammar into an ACE syntax-highlight parser.
        * DEFAULT is the default return value (null by default) for things that are skipped or not styled
        * In general there is no need to set this value, unlees you need to return something else
        [/DOC_MARKDOWN]**/
        getMode : function(grammar, DEFAULT) {
            
            // build the grammar
            grammar = parse( grammar );
            
            //console.log(grammar);
            
            var 
                LOCALS = { 
                    // default return code, when no match or empty found
                    // 'text' should be used in most cases
                    DEFAULT: DEFAULT || DEFAULTTYPE
                },
                parser, aceMode
            ;
            
            // generate parser with token factories (grammar, LOCALS are available locally by closures)
            parser = parserFactory( grammar, LOCALS );
            
            aceMode = {
                
                // the custom Parser/Tokenizer
                getTokenizer : function(){
                    return function() { 
                        return parser;
                    };
                }(),
                

                /*
                *   Maybe needed in later versions..
                */
                
                HighlightRules : null, //TextHighlightRules;
                $behaviour : null, //new Behaviour();

                lineCommentStart : "",
                blockComment : "",

                toggleCommentLines : function(state, session, startRow, endRow) {
                    return false;
                },

                toggleBlockComment : function(state, session, range, cursor) {
                },

                getNextLineIndent : function(state, line, tab) {
                    return line.match(/^\s*/)[0];
                },

                checkOutdent : function(state, line, input) {
                    return false;
                },

                autoOutdent : function(state, doc, row) {
                },

                $getIndent : function(line) {
                    return line.match(/^\s*/)[0];
                },

                createWorker : function(session) {
                    return null;
                },

                createModeDelegates : function (mapping) {
                },

                $delegator : function(method, args, defaultHandler) {
                },

                transformAction : function(state, action, editor, session, param) {
                },
                
                getKeywords : function( append ) {
                    return [];
                },
                
                $createKeywordList : function() {
                    return [];
                },

                getCompletions : function(state, session, pos, prefix) {
                    return [];
                }
                
            };
            
            // ACE Mode compatible
            return aceMode;
        }
    };
