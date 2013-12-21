    
    //
    // parser factories
    var
        AceParser = Class({
            
            constructor: function(grammar, LOCALS) {
                this.LOC = LOCALS;
                this.Grammar = grammar;
                this.Style = grammar.Style || {};
                this.Comments = grammar.Comments || {};
                this.tokens = grammar.Parser || [];
                this.DEF = this.LOC.DEFAULT;
                this.ERR = this.Style.error || this.LOC.ERROR;
            },
            
            LOC: null,
            ERR: null,
            DEF: null,
            Grammar: null,
            Style: null,
            Comments: null,
            tokens: null,
            
            // ACE Tokenizer compatible
            getLineTokens: function(line, state, row) {
                
                var i, rewind, 
                    tokenizer, tokens, currentToken, type, numTokens = this.tokens.length, 
                    stream, stack,
                    LOC = this.LOC,
                    DEFAULT = this.DEF,
                    ERROR = this.ERR
                ;
                
                stream = new StringStream( line );
                tokens = []; 
                state = state || new ParserState( );
                state = state.clone();
                state.id = 1+row;
                stack = state.stack;
                currentToken = { type: null, value: "" };
                type = null;
                
                while ( !stream.eol() )
                {
                    rewind = false;
                    
                    if ( type && type !== currentToken.type )
                    {
                        if ( currentToken.type ) tokens.push( currentToken );
                        currentToken = { type: type, value: stream.cur() };
                        stream.sft();
                    }
                    else if ( currentToken.type )
                    {
                        currentToken.value += stream.cur();
                        stream.sft();
                    }
                    
                    if ( stream.space() ) 
                    {
                        state.currentToken = T_DEFAULT;
                        type = DEFAULT;
                        continue;
                    }
                    
                    while ( stack.length && !stream.eol() )
                    {
                        tokenizer = stack.pop();
                        type = tokenizer.get(stream, state, LOC);
                        
                        // match failed
                        if ( false === type )
                        {
                            // error
                            if ( tokenizer.ERROR || tokenizer.isRequired )
                            {
                                // empty the stack
                                stack.length = 0;
                                // skip this character
                                stream.nxt();
                                // generate error
                                state.currentToken = T_ERROR;
                                type = ERROR;
                                rewind = true;
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
                            rewind = true;
                            break;
                        }
                    }
                    
                    if ( rewind ) continue;
                    if ( stream.eol() ) break;
                    
                    for (i=0; i<numTokens; i++)
                    {
                        tokenizer = this.tokens[i];
                        type = tokenizer.get(stream, state, LOC);
                        
                        // match failed
                        if ( false === type )
                        {
                            // error
                            if ( tokenizer.ERROR || tokenizer.isRequired )
                            {
                                // empty the stack
                                stack.length = 0;
                                // skip this character
                                stream.nxt();
                                // generate error
                                state.currentToken = T_ERROR;
                                type = ERROR;
                                rewind = true;
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
                            rewind = true;
                            break;
                        }
                    }
                    
                    if ( rewind ) continue;
                    if ( stream.eol() ) break;
                    
                    // unknown, bypass
                    stream.nxt();
                    state.currentToken = T_DEFAULT;
                    type = DEFAULT;
                }
                
                if ( type && type !== currentToken.type )
                {
                    if ( currentToken.type ) tokens.push( currentToken );
                    tokens.push( { type: type, value: stream.cur() } );
                }
                else if ( currentToken.type )
                {
                    currentToken.value += stream.cur();
                    tokens.push( currentToken );
                }
                currentToken = { type: null, value: "" };
                //console.log(tokens);
                
                // ACE Tokenizer compatible
                return { state: state, tokens: tokens };
            },
            
            $getIndent : function(line) { return line.match(/^\s*/)[0];  },
            
            // TODO
            getNextLineIndent : function(state, line, tab) { return line.match(/^\s*/)[0]; },
            
            getKeywords : function( append ) { return []; },
            
            $createKeywordList : function() { return []; },

            // TODO
            getCompletions : function(state, session, pos, prefix) { return []; }
        }),
        
        getParser = function(grammar, LOCALS) {
            return new AceParser(grammar, LOCALS);
        },
        
        getAceMode = function(parser) {
            
            // ACE-compatible Mode
            return {
                // the custom Parser/Tokenizer
                getTokenizer: function() { return parser; },
                
                lineCommentStart: (parser.Comments.lineCommentStart) ? parser.Comments.lineCommentStart[0] : null,
                blockComment: (parser.Comments.blockCommentStart && parser.Comments.blockCommentEnd) ? { start: parser.Comments.blockCommentStart[0], end: parser.Comments.blockCommentEnd[0] } : null,

                toggleCommentLines: function(state, session, startRow, endRow) { return false; },

                toggleBlockComment: function(state, session, range, cursor) {  },

                getNextLineIndent: function(state, line, tab) { return parser.getNextLineIndent(state, line, tab); },

                checkOutdent: function(state, line, input) { return false; },

                autoOutdent: function(state, doc, row) { },

                $getIndent: function(line) { return parser.$getIndent(line); },

                getKeywords: function( append ) { return parser.getKeywords(append); },
                
                $createKeywordList: function() { return parser.$createKeywordList(); },

                getCompletions: function(state, session, pos, prefix) { return parser.getCompletions(state, session, pos, prefix); },
                
                /*
                *   Maybe needed in later versions..
                */
                
                HighlightRules: null,
                $behaviour: null, //new Behaviour(),

                createWorker: function(session) { return null; },

                createModeDelegates: function (mapping) { },

                $delegator: function(method, args, defaultHandler) { },

                transformAction: function(state, action, editor, session, param) { }
                
            };
        }
    ;
  