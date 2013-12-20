    
    //
    // parser factories
    var
        Parser = Class({
            
            constructor: function(grammar, LOCALS) {
                this.LOCALS = LOCALS;
                this.Style = grammar.Style || {};
                this.tokens = grammar.Parser || [];
            },
            
            LOCALS: null,
            Style: null,
            tokens: null,
            
            // ACE Tokenizer compatible
            getLineTokens: function(line, state, row) {
                
                var i, rewind, 
                    tokenizer, tokens, currentToken, type, numTokens = this.tokens.length, 
                    stream, stack
                ;
                
                var ERROR = this.Style.error || "error";
                var DEFAULT = this.LOCALS.DEFAULT;
                
                stream = new StringStream( line );
                tokens = []; 
                state = state || new StateContext( );
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
                        currentToken = { type: type, value: stream.current() };
                        stream.shift();
                    }
                    else if ( currentToken.type )
                    {
                        currentToken.value += stream.current();
                        stream.shift();
                    }
                    
                    if ( stream.eatSpace() ) 
                    {
                        state.currentToken = T_DEFAULT;
                        type = DEFAULT;
                        continue;
                    }
                    
                    while ( stack.length && !stream.eol() )
                    {
                        tokenizer = stack.pop();
                        type = tokenizer.tokenize(stream, state, this.LOCALS);
                        
                        // match failed
                        if ( false === type )
                        {
                            // error
                            if ( tokenizer.ERROR || tokenizer.isRequired )
                            {
                                // empty the stack
                                stack.length = 0;
                                // skip this character
                                stream.next();
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
                    
                    if ( !stream.eol() )
                    {
                        for (i=0; i<numTokens; i++)
                        {
                            tokenizer = this.tokens[i];
                            type = tokenizer.tokenize(stream, state, this.LOCALS);
                            
                            // match failed
                            if ( false === type )
                            {
                                // error
                                if ( tokenizer.ERROR || tokenizer.isRequired )
                                {
                                    // empty the stack
                                    stack.length = 0;
                                    // skip this character
                                    stream.next();
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
                    }
                    
                    if ( rewind ) continue;
                    
                    if ( !stream.eol() )
                    {
                        // unknown, bypass
                        stream.next();
                        state.currentToken = T_DEFAULT;
                        type = DEFAULT;
                    }
                }
                
                if ( type && type !== currentToken.type )
                {
                    if ( currentToken.type ) tokens.push( currentToken );
                    tokens.push( { type: type, value: stream.current() } );
                }
                else if ( currentToken.type )
                {
                    currentToken.value += stream.current();
                    tokens.push( currentToken );
                }
                currentToken = { type: null, value: "" };
                //console.log(tokens);
                
                // ACE Tokenizer compatible
                return { state: state, tokens: tokens };
            }
        }),
        
        getParser = function(grammar, LOCALS) {
            return new Parser(grammar, LOCALS);
        }
    ;
  