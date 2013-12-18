    
    //
    // parser factories
    var
        Parser = Extends(Object, {
            
            constructor: function(grammar, LOCALS) {
                this.LOCALS = LOCALS;
                this.Style = grammar.Style || {};
                this.tokens = grammar.Parser || [];
                this.state = null;
            },
            
            LOCALS: null,
            Style: null,
            tokens: null,
            state: null,
            
            resetState: function() {
                return this.state = { stack: [], inBlock: null, current: null, currentToken: T_DEFAULT };
            },
            
            // ACE Tokenizer compatible
            getLineTokens: function(line, aceState) {
                
                var i, numTokens = this.tokens.length, rewind, token, style, stream, state, stack, tokens;
                
                var ERROR = this.Style.error || "error";
                var DEFAULT = this.LOCALS.DEFAULT;
                
                if ( !aceState )
                {
                    this.resetState();
                    aceState = "inParser";
                }
                
                state = this.state;
                stack = state.stack;
                stream = new Stream( line );
                tokens = []; 
                
                while ( !stream.eol() )
                {
                    rewind = false;
                    
                    if ( stream.eatSpace() ) 
                    {
                        state.current = null;
                        state.currentToken = T_DEFAULT;
                        tokens.push( { type: DEFAULT, value: stream.current() } );
                        stream.shift();
                        continue;
                    }
                    
                    while ( stack.length && !stream.eol() )
                    {
                        token = stack.pop();
                        style = token.tokenize(stream, state, this.LOCALS);
                        
                        // match failed
                        if ( false === style )
                        {
                            // error
                            if ( token.ERROR || token.isRequired )
                            {
                                // empty the stack
                                state.stack.length = 0;
                                // skip this character
                                stream.next();
                                // generate error
                                state.current = null;
                                state.currentToken = T_ERROR;
                                tokens.push( { type: ERROR, value: stream.current() } );
                                stream.shift();
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
                            state.current = token.tokenName;
                            tokens.push( { type: style, value: stream.current() } );
                            stream.shift();
                            rewind = true;
                            break;
                        }
                    }
                    
                    if ( rewind ) continue;
                    
                    if ( !stream.eol() )
                    {
                        for (i=0; i<numTokens; i++)
                        {
                            token = this.tokens[i];
                            style = token.tokenize(stream, state, this.LOCALS);
                            
                            // match failed
                            if ( false === style )
                            {
                                // error
                                if ( token.ERROR || token.isRequired )
                                {
                                    // empty the stack
                                    state.stack.length = 0;
                                    // skip this character
                                    stream.next();
                                    // generate error
                                    state.current = null;
                                    state.currentToken = T_ERROR;
                                    tokens.push( { type: ERROR, value: stream.current() } );
                                    stream.shift();
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
                                state.current = token.tokenName;
                                tokens.push( { type: style, value: stream.current() } );
                                stream.shift();
                                rewind = true;
                                break;
                            }
                        }
                    }
                    
                    if ( rewind ) continue;
                    
                    if ( !stream.eol() )
                    {
                        // unknown, bypass
                        stream.next();
                        state.current = null;
                        state.currentToken = T_DEFAULT;
                        tokens.push( { type: DEFAULT, value: stream.current() } );
                        stream.shift();
                    }
                }
                
                //console.log(tokens);
                
                // ACE Tokenizer compatible
                return { state: aceState, tokens: tokens };
            }
        }),
        
        parserFactory = function(grammar, LOCALS) {
            return new Parser(grammar, LOCALS);
        }
    ;
  