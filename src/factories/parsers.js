    
    //
    // parser factories
    var
        AceParser = Class({
            
            constructor: function(grammar, LOCALS) {
                this.LOC = LOCALS;
                this.Grammar = grammar;
                this.Comments = grammar.Comments || {};
                this.Tokens = grammar.Parser || [];
                this.DEF = this.LOC.DEFAULT;
                this.ERR = (grammar.Style && grammar.Style.error) ? grammar.Style.error : this.LOC.ERROR;
            },
            
            LOC: null,
            ERR: null,
            DEF: null,
            Grammar: null,
            Comments: null,
            Tokens: null,
            
            // ACE Tokenizer compatible
            getLineTokens: function(line, state, row) {
                
                var i, rewind, 
                    t, tokens = this.Tokens, numTokens = tokens.length, 
                    aceTokens, token, type, 
                    stream, stack,
                    LOC = this.LOC,
                    DEFAULT = this.DEF,
                    ERROR = this.ERR
                ;
                
                aceTokens = []; 
                stream = new ParserStream( line );
                state = state || new ParserState( );
                state = state.clone();
                state.id = 1+row;
                stack = state.stack;
                token = { type: null, value: "" };
                type = null;
                
                while ( !stream.eol() )
                {
                    rewind = false;
                    
                    if ( type && type !== token.type )
                    {
                        if ( token.type ) aceTokens.push( token );
                        token = { type: type, value: stream.cur() };
                        stream.sft();
                    }
                    else if ( token.type )
                    {
                        token.value += stream.cur();
                        stream.sft();
                    }
                    
                    if ( stream.spc() ) 
                    {
                        state.t = T_DEFAULT;
                        type = DEFAULT;
                        continue;
                    }
                    
                    while ( stack.length && !stream.eol() )
                    {
                        t = stack.pop();
                        type = t.get(stream, state, LOC);
                        
                        // match failed
                        if ( false === type )
                        {
                            // error
                            if ( t.ERROR || t.isRequired )
                            {
                                // empty the stack
                                stack.length = 0;
                                // skip this character
                                stream.nxt();
                                // generate error
                                state.t = T_ERROR;
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
                        t = tokens[i];
                        type = t.get(stream, state, LOC);
                        
                        // match failed
                        if ( false === type )
                        {
                            // error
                            if ( t.ERROR || t.isRequired )
                            {
                                // empty the stack
                                stack.length = 0;
                                // skip this character
                                stream.nxt();
                                // generate error
                                state.t = T_ERROR;
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
                    state.t = T_DEFAULT;
                    type = DEFAULT;
                }
                
                if ( type && type !== token.type )
                {
                    if ( token.type ) aceTokens.push( token );
                    aceTokens.push( { type: type, value: stream.cur() } );
                }
                else if ( token.type )
                {
                    token.value += stream.cur();
                    aceTokens.push( token );
                }
                token = { type: null, value: "" };
                //console.log(aceTokens);
                
                // ACE Tokenizer compatible
                return { state: state, tokens: aceTokens };
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
                
                lineCommentStart: (parser.Comments.line) ? parser.Comments.line[0] : null,
                blockComment: (parser.Comments.block) ? { start: parser.Comments.block[0][0], end: parser.Comments.block[0][1] } : null,

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
  