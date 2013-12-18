    
    //
    // parser factories
    var
        Parser = Extends(Object, {
            
            constructor: function(grammar, LOCALS) {
                this.LOCALS = LOCALS;
                this.Style = grammar.Style || {};
                this.tokens = grammar.Parser || [];
            },
            
            LOCALS: null,
            Style: null,
            tokens: null,
            
            resetState: function( state ) {
                state = state || {};
                state.stack = []; 
                state.inBlock = null; 
                state.current = null; 
                state.currentToken = T_DEFAULT;
                state.init = null;
                return state;
            },
            
            copyState: function( state ) {
                var copy = {};
                for (var k in state)
                {
                    if ( T_ARRAY == get_type(state[k]) )
                        copy[k] = state[k].slice();
                    else
                        copy[k] = state[k];
                }
                return copy;
            },
            
            // ACE Tokenizer compatible
            getLineTokens: function(line, state, row) {
                
                var i, numTokens = this.tokens.length, rewind, token, style, stream, stack, tokens, startBlock = 0;
                
                var ERROR = this.Style.error || "error";
                var DEFAULT = this.LOCALS.DEFAULT;
                
                if ( !state ) state = this.resetState( state );
                state = this.copyState( state );
                stack = state.stack;
                stream = new Stream( line );
                tokens = []; 
                
                if ( !state.inBlock )
                {
                    startBlock = 1;
                }
                
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
                
                if ( startBlock && state.inBlock )
                {
                    state.startBlock = 1;
                }
                else
                {
                    state.startBlock = 0;
                }
                
                //console.log(tokens);
                //console.log(state);
                
                // ACE Tokenizer compatible
                return { state: state, tokens: tokens };
            }
        }),
        
        getParser = function(grammar, LOCALS) {
            return new Parser(grammar, LOCALS);
        }
    ;
  