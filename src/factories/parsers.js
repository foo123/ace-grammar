    
    // ace supposed to be available
    var _ace = (typeof ace !== 'undefined') ? ace : { require: function() { return { }; } }, ace_require = _ace.require;
    
    //
    // parser factories
    var
        AceRange = ace_require('ace/range').Range || Object,
        // support indentation/behaviours/comments toggle
        AceTokenizer = ace_require('ace/tokenizer').Tokenizer || Object,
        AceTokenIterator = ace_require('ace/token_iterator').TokenIterator || Object,
        AceParser = Class(AceTokenizer, {
            
            constructor: function(grammar, LOC) {
                var ayto = this;
                // support comments toggle
                ayto.LC = grammar.Comments.line || null;
                ayto.BC = (grammar.Comments.block) ? { start: grammar.Comments.block[0][0], end: grammar.Comments.block[0][1] } : null;
                if ( ayto.LC )
                {
                    if ( T_ARRAY & get_type(ayto.LC) ) 
                    {
                        var rxLine = ayto.LC.map( escRegexp ).join( "|" );
                    } 
                    else 
                    {
                        var rxLine = escRegexp( ayto.LC );
                    }
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
                var lines = code.split(/\r\n|\r|\n/g), l = lines.length, i;
                var tokens = [], data;
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
                state = (state) ? state.clone( ) : new ParserState( );
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
                        token = { type: type, value: stream.cur(), error: currentError };
                        currentError = null;
                        stream.sft();
                    }
                    else if ( token.type )
                    {
                        token.value += stream.cur();
                        stream.sft();
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
                            if ( tokenizer.ERR || tokenizer.required )
                            {
                                // empty the stack
                                stack.length = 0;
                                // skip this character
                                stream.nxt();
                                // generate error
                                state.t = T_ERROR;
                                state.r = type = ERROR;
                                rewind = 1;
                                currentError = tokenizer.tn + " " + ((tokenizer.required) ? "is missing" : "syntax error");
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
                            if ( tokenizer.ERR || tokenizer.required )
                            {
                                // empty the stack
                                stack.length = 0;
                                // skip this character
                                stream.nxt();
                                // generate error
                                state.t = T_ERROR;
                                state.r = type = ERROR;
                                rewind = 1;
                                currentError = tokenizer.tn + " " + ((tokenizer.required) ? "is missing" : "syntax error");
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
                    aceTokens.push( { type: type, value: stream.cur(), error: currentError } );
                    currentError = null;
                }
                else if ( token.type )
                {
                    token.value += stream.cur();
                    aceTokens.push( token );
                }
                token = null;
                
                //console.log(aceTokens);
                
                // ACE Tokenizer compatible
                return { state: state, tokens: aceTokens };
            },
            
            tCL : function(state, session, startRow, endRow) {
                var ayto = this;
                var doc = session.doc;
                var ignoreBlankLines = true;
                var shouldRemove = true;
                var minIndent = Infinity;
                var tabSize = session.getTabSize();
                var insertAtTabStop = false;
                
                if ( !ayto.LC ) 
                {
                    if ( !ayto.BC ) return false;
                    
                    var lineCommentStart = ayto.BC.start;
                    var lineCommentEnd = ayto.BC.end;
                    var regexpStart = ayto.rxStart;
                    var regexpEnd = ayto.rxEnd;

                    var comment = function(line, i) {
                        if (testRemove(line, i)) return;
                        if (!ignoreBlankLines || /\S/.test(line)) 
                        {
                            doc.insertInLine({row: i, column: line.length}, lineCommentEnd);
                            doc.insertInLine({row: i, column: minIndent}, lineCommentStart);
                        }
                    };

                    var uncomment = function(line, i) {
                        var m;
                        if (m = line.match(regexpEnd))
                            doc.removeInLine(i, line.length - m[0].length, line.length);
                        if (m = line.match(regexpStart))
                            doc.removeInLine(i, m[1].length, m[0].length);
                    };

                    var testRemove = function(line, row) {
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
                    var lineCommentStart = (T_ARRAY == get_type(ayto.LC)) ? ayto.LC[0] : ayto.LC;
                    var regexpLine = ayto.rxLine;
                    var commentWithSpace = lineCommentStart + " ";
                    
                    insertAtTabStop = session.getUseSoftTabs();

                    var uncomment = function(line, i) {
                        var m = line.match(regexpLine);
                        if (!m) return;
                        var start = m[1].length, end = m[0].length;
                        if (!shouldInsertSpace(line, start, end) && m[0][end - 1] == " ")  end--;
                        doc.removeInLine(i, start, end);
                    };
                    
                    var comment = function(line, i) {
                        if (!ignoreBlankLines || /\S/.test(line)) 
                        {
                            if (shouldInsertSpace(line, minIndent, minIndent))
                                doc.insertInLine({row: i, column: minIndent}, commentWithSpace);
                            else
                                doc.insertInLine({row: i, column: minIndent}, lineCommentStart);
                        }
                    };
                    
                    var testRemove = function(line, i) {
                        return regexpLine.test(line);
                    };

                    var shouldInsertSpace = function(line, before, after) {
                        var spaces = 0;
                        while (before-- && line.charAt(before) == " ") spaces++;
                        if (spaces % tabSize != 0) return false;
                        var spaces = 0;
                        while (line.charAt(after++) == " ") spaces++;
                        if (tabSize > 2)  return spaces % tabSize != tabSize - 1;
                        else  return spaces % tabSize == 0;
                        return true;
                    };
                }

                function iterate( applyMethod ) { for (var i=startRow; i<=endRow; i++) applyMethod(doc.getLine(i), i); }


                var minEmptyLength = Infinity;
                
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

                if (minIndent == Infinity) 
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
                var ayto = this;
                var comment = ayto.BC;
                if (!comment) return;

                var iterator = new AceTokenIterator(session, cursor.row, cursor.column);
                var token = iterator.getCurrentToken();

                var sel = session.selection;
                var initialRange = session.selection.toOrientedRange();
                var startRow, colDiff;

                if (token && /comment/.test(token.type)) 
                {
                    var startRange, endRange;
                    while (token && /comment/.test(token.type)) 
                    {
                        var i = token.value.indexOf(comment.start);
                        if (i != -1) 
                        {
                            var row = iterator.getCurrentTokenRow();
                            var column = iterator.getCurrentTokenColumn() + i;
                            startRange = new AceRange(row, column, row, column + comment.start.length);
                            break;
                        }
                        token = iterator.stepBackward();
                    };

                    var iterator = new AceTokenIterator(session, cursor.row, cursor.column);
                    var token = iterator.getCurrentToken();
                    while (token && /comment/.test(token.type)) 
                    {
                        var i = token.value.indexOf(comment.end);
                        if (i != -1) 
                        {
                            var row = iterator.getCurrentTokenRow();
                            var column = iterator.getCurrentTokenColumn() + i;
                            endRange = new AceRange(row, column, row, column + comment.end.length);
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
        
        WorkerClient,
        
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
                
                supportAnnotations: false,
                
                //HighlightRules: null,
                //$behaviour: parser.$behaviour || null,

                createWorker: function(session) {
                    // TODO, IN PROGRESS
                    return null;
                    /*
                    if ( !mode.supportAnnotations ) return null;
                    
                    var worker = new AceWorkerClient(['ace'], thisPath.file, "AceGrammar");
                    
                    // create a worker for this grammar
                    worker.call('__init__', [grammar], function(){
                        // hook worker to enable error annotations
                        worker.on("error", function(e) {
                            session.setAnnotations(e.data);
                        });

                        worker.on("ok", function() {
                            session.clearAnnotations();
                        });
                    });
                    worker.attachToDocument(session.getDocument());
                    
                    return worker;
                    */
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
  