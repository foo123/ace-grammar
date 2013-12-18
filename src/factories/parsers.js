    
    //
    // parser factories
    var
        /*stackTrace = function(stack) {
            console.log( "Stack Trace Begin" );
            
            for (var i=stack.length-1; i>=0; i--)
                console.log( stack[i].toString() );
            
            console.log( "Stack Trace End" );
        },*/
        
        // a class resembling Codemirror StringStream for compatibility mode
        Stream = Extends(Object, {
            
            constructor: function( line ) {
                this.string = new String(line);
                this.pos = this.start = 0;
            },
            
            string: '',
            start: 0,
            pos: 0,
            
            eol: function() { 
                return this.pos >= this.string.length; 
            },
            
            sol: function() { 
                return 0 == this.pos; 
            },
            
            peek: function() { 
                return this.string.charAt(this.pos) || undefined; 
            },
            
            next: function() {
                if (this.pos < this.string.length)
                    return this.string.charAt(this.pos++);
            },
            
            eat: function(match) {
                var ch = this.string.charAt(this.pos);
                if ("string" == typeof match) var ok = ch == match;
                else var ok = ch && (match.test ? match.test(ch) : match(ch));
                if (ok) 
                {
                    ++this.pos; 
                    return ch;
                }
            },
            
            eatWhile: function(match) {
                var start = this.pos;
                while ( this.eat(match) ) {}
                return this.pos > start;
            },
            
            eatSpace: function() {
                var start = this.pos;
                while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) ++this.pos;
                return this.pos > start;
            },
            
            current: function() {
                var c = this.string.slice(this.start, this.pos);
                this.start = this.pos;
                return c;
            }
        }),
        
        parserFactory = function(grammar, LOCALS) {
            
            var parser = {
                
                getLineTokens: function() {
                    
                    var DEFAULT = LOCALS.DEFAULT,
                        Style = grammar.Style || {},
                        ERROR = Style.error || "error",
                        tokens = grammar.Parser || [],
                        numTokens = tokens.length,
                        state = { stack: [], inBlock: null, current: null, currentToken: T_DEFAULT }
                    ;
                    
                    return function(line, stateAce) {
                
                        // ACE Tokenizer compatible
                        var i, rewind, token, style, stack, aceTokens = [], stream = new Stream( line );
                        
                        stack = state.stack;
                        
                        while ( !stream.eol() )
                        {
                            rewind = false;
                            
                            if ( stream.eatSpace() ) 
                            {
                                state.current = null;
                                state.currentToken = T_DEFAULT;
                                aceTokens.push( { type: DEFAULT, value: stream.current() } );
                                continue;
                            }
                            
                            //stackTrace(stack);
                            
                            while ( stack.length && !stream.eol() )
                            {
                                token = stack.pop();
                                
                                /*if ( T_ACTION == token.type )
                                {
                                    console.log(token.toString());
                                    token.doAction(stream, state, LOCALS);
                                    continue;
                                }*/
                                
                                style = token.tokenize(stream, state, LOCALS);
                                
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
                                        //console.log(["ERROR", stream.current()]);
                                        // generate error
                                        state.current = null;
                                        state.currentToken = T_ERROR;
                                        aceTokens.push( { type: ERROR, value: stream.current() } );
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
                                    aceTokens.push( { type: style, value: stream.current() } );
                                    rewind = true;
                                    break;
                                }
                            }
                            
                            if ( rewind ) continue;
                            
                            if ( !stream.eol() )
                            {
                                for (i=0; i<numTokens; i++)
                                {
                                    token = tokens[i];
                                    style = token.tokenize(stream, state, LOCALS);
                                    
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
                                            //console.log(["ERROR", stream.current()]);
                                            // generate error
                                            state.current = null;
                                            state.currentToken = T_ERROR;
                                            aceTokens.push( { type: ERROR, value: stream.current() } );
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
                                        aceTokens.push( { type: style, value: stream.current() } );
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
                                aceTokens.push( { type: DEFAULT, value: stream.current() } );
                            }
                        }
                        
                        //console.log(aceTokens);
                        
                        // ACE Tokenizer compatible
                        return { state: stateAce, tokens: aceTokens };
                    }
                }()
            }
            return parser;
        }
    ;
  