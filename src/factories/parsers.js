    
    // ace supposed to be available
    var _ace = (typeof ace !== 'undefined') ? ace : { require: function() { return { }; }, config: {} }, 
        ace_require = _ace.require, ace_config = _ace.config
    ;
    
    //
    // parser factories
    var
        AceWorkerClient = Class(ace_require("ace/worker/worker_client").WorkerClient, {
            constructor: function(topLevelNamespaces, mod, classname) {
                var ayto = this, require = ace_require, config = ace_config;
                ayto.$sendDeltaQueue = ayto.$sendDeltaQueue.bind(ayto);
                ayto.changeListener = ayto.changeListener.bind(ayto);
                ayto.onMessage = ayto.onMessage.bind(ayto);
                if (require.nameToUrl && !require.toUrl)
                    require.toUrl = require.nameToUrl;

                var workerUrl;
                if (config.get("packaged") || !require.toUrl) {
                    workerUrl = config.moduleUrl(mod, "worker");
                } else {
                    var normalizePath = ayto.$normalizePath;
                    workerUrl = normalizePath(require.toUrl("ace/worker/worker.js", null, "_"));

                    var tlns = {};
                    topLevelNamespaces.forEach(function(ns) {
                        tlns[ns] = normalizePath(require.toUrl(ns, null, "_").replace(/(\.js)?(\?.*)?$/, ""));
                    });
                }
                
                ayto.$worker = new Worker(workerUrl);
                
                ayto.$worker.postMessage({
                    load: true,
                    ace_worker_base: thisPath.base + '/' + ace_config.moduleUrl("ace/worker/json")
                });

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
        }),
        
        Parser = Class(ace_require('ace/tokenizer').Tokenizer, {
            
            constructor: function(grammar, LOC) {
                var ayto = this, rxLine;
                // support comments toggle
                ayto.LC = grammar.Comments.line || null;
                ayto.BC = (grammar.Comments.block) ? { start: grammar.Comments.block[0][0], end: grammar.Comments.block[0][1] } : null;
                if ( ayto.LC )
                {
                    if ( T_ARRAY & get_type(ayto.LC) ) 
                        rxLine = ayto.LC.map( escRegexp ).join( "|" );
                    
                    else 
                        rxLine = escRegexp( ayto.LC );
                    
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
                ayto.Style = grammar.Style;
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
            Style: null,

            parse: function(code) {
                code = code || "";
                var lines = code.split(/\r\n|\r|\n/g), l = lines.length, i, tokens = [], data;
                data = { state: new State( ), tokens: null };
                
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
                    aceTokens, token, type, style, currentError = null,
                    stream, stack, DEFAULT = ayto.DEF, ERROR = ayto.ERR, Style = ayto.Style
                ;
                
                aceTokens = []; 
                stream = new Stream( line );
                state = (state) ? state.clone( 1 ) : new State( 1, 1 );
                state.l = 1+row;
                stack = state.stack;
                token = { type: null, value: "", error: null };
                type = null;
                style = null;
                
                // if EOL tokenizer is left on stack, pop it now
                if ( !stack.isEmpty() && T_EOL == stack.peek().tt && stream.sol() ) 
                {
                    stack.pop();
                }
                
                while ( !stream.eol() )
                {
                    rewind = 0;
                    
                    if ( style && style !== token.type )
                    {
                        if ( token.type ) aceTokens.push( token );
                        token = { type: style, value: stream.cur(1), error: currentError };
                        currentError = null;
                    }
                    else if ( token.type )
                    {
                        token.value += stream.cur(1);
                    }
                    style = false;
                    
                    // check for non-space tokenizer before parsing space
                    if ( (stack.isEmpty() || (T_NONSPACE != stack.peek().tt)) && stream.spc() )
                    {
                        state.t = type = DEFAULT;
                        style = DEFAULT;
                        continue;
                    }
                    
                    while ( !stack.isEmpty() && !stream.eol() )
                    {
                        if ( interleavedCommentTokens )
                        {
                            ci = 0; rewind2 = 0;
                            while ( ci < interleavedCommentTokens.length )
                            {
                                tokenizer = interleavedCommentTokens[ci++];
                                state.t = type = tokenizer.get(stream, state);
                                if ( false !== type )
                                {
                                    style = Style[type] || DEFAULT;
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
                        state.t = type = tokenizer.get(stream, state);
                    
                        // match failed
                        if ( false === type )
                        {
                            // error
                            if ( tokenizer.ERR || tokenizer.REQ )
                            {
                                // empty the stack
                                stack.empty('sID', tokenizer.sID);
                                // skip this character
                                stream.nxt();
                                // generate error
                                state.t = type = ERROR;
                                style = ERROR;
                                currentError = tokenizer.err();
                                rewind = 1;
                                break;
                            }
                            // optional
                            else
                            {
                                style = false;
                                continue;
                            }
                        }
                        // found token (not empty)
                        else if ( true !== type )
                        {
                            style = Style[type] || DEFAULT;
                            // match action error
                            if ( tokenizer.MTCH )
                            {
                                // empty the stack
                                stack.empty('sID', tokenizer.sID);
                                // generate error
                                state.t = type = ERROR;
                                style = ERROR;
                                currentError = tokenizer.err();
                            }
                            rewind = 1;
                            break;
                        }
                    }
                    
                    if ( rewind ) continue;
                    if ( stream.eol() ) break;
                    
                    for (i=0; i<numTokens; i++)
                    {
                        tokenizer = tokens[i];
                        state.t = type = tokenizer.get(stream, state);
                        
                        // match failed
                        if ( false === type )
                        {
                            // error
                            if ( tokenizer.ERR || tokenizer.REQ )
                            {
                                // empty the stack
                                stack.empty('sID', tokenizer.sID);
                                // skip this character
                                stream.nxt();
                                // generate error
                                state.t = type = ERROR;
                                style = ERROR;
                                currentError = tokenizer.err();
                                rewind = 1;
                                break;
                            }
                            // optional
                            else
                            {
                                style = false;
                                continue;
                            }
                        }
                        // found token (not empty)
                        else if ( true !== type )
                        {
                            style = Style[type] || DEFAULT;
                            // match action error
                            if ( tokenizer.MTCH )
                            {
                                // empty the stack
                                stack.empty('sID', tokenizer.sID);
                                // generate error
                                state.t = type = ERROR;
                                style = ERROR;
                                currentError = tokenizer.err();
                            }
                            rewind = 1;
                            break;
                        }
                    }
                    
                    if ( rewind ) continue;
                    if ( stream.eol() ) break;
                    
                    // unknown, bypass
                    stream.nxt();
                    state.t = type = DEFAULT;
                    style = DEFAULT;
                }
                
                if ( style && style !== token.type )
                {
                    if ( token.type ) aceTokens.push( token );
                    aceTokens.push( { type: style, value: stream.cur(1), error: currentError } );
                    currentError = null;
                }
                else if ( token.type )
                {
                    token.value += stream.cur(1);
                    aceTokens.push( token );
                }
                token = null;
                
                //console.log(aceTokens);
                
                // ACE Tokenizer compatible
                return { state: state, tokens: aceTokens };
            },
            
            tCL : function(state, session, startRow, endRow) {
                var ayto = this,
                    doc = session.doc,
                    ignoreBlankLines = true,
                    shouldRemove = true,
                    minIndent = Infinity,
                    tabSize = session.getTabSize(),
                    insertAtTabStop = false,
                    comment, uncomment, testRemove, shouldInsertSpace
                ;
                
                if ( !ayto.LC ) 
                {
                    if ( !ayto.BC ) return false;
                    
                    var lineCommentStart = ayto.BC.start,
                        lineCommentEnd = ayto.BC.end,
                        regexpStart = ayto.rxStart,
                        regexpEnd = ayto.rxEnd
                    ;

                    comment = function(line, i) {
                        if (testRemove(line, i)) return;
                        if (!ignoreBlankLines || /\S/.test(line)) 
                        {
                            doc.insertInLine({row: i, column: line.length}, lineCommentEnd);
                            doc.insertInLine({row: i, column: minIndent}, lineCommentStart);
                        }
                    };

                    uncomment = function(line, i) {
                        var m;
                        if (m = line.match(regexpEnd))
                            doc.removeInLine(i, line.length - m[0].length, line.length);
                        if (m = line.match(regexpStart))
                            doc.removeInLine(i, m[1].length, m[0].length);
                    };

                    testRemove = function(line, row) {
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
                    var lineCommentStart = (T_ARRAY == get_type(ayto.LC)) ? ayto.LC[0] : ayto.LC,
                        regexpLine = ayto.rxLine,
                        commentWithSpace = lineCommentStart + " ",
                        minEmptyLength
                    ;
                    
                    insertAtTabStop = session.getUseSoftTabs();

                    uncomment = function(line, i) {
                        var m = line.match(regexpLine), start, end;
                        if (!m) return;
                        start = m[1].length; end = m[0].length;
                        if (!shouldInsertSpace(line, start, end) && m[0][end - 1] == " ")  end--;
                        doc.removeInLine(i, start, end);
                    };
                    
                    comment = function(line, i) {
                        if (!ignoreBlankLines || /\S/.test(line)) 
                        {
                            if (shouldInsertSpace(line, minIndent, minIndent))
                                doc.insertInLine({row: i, column: minIndent}, commentWithSpace);
                            else
                                doc.insertInLine({row: i, column: minIndent}, lineCommentStart);
                        }
                    };
                    
                    testRemove = function(line, i) {
                        return regexpLine.test(line);
                    };

                    shouldInsertSpace = function(line, before, after) {
                        var spaces = 0;
                        while (before-- && line.charAt(before) == " ") spaces++;
                        if (spaces % tabSize != 0) return false;
                        spaces = 0;
                        while (line.charAt(after++) == " ") spaces++;
                        if (tabSize > 2)  return spaces % tabSize != tabSize - 1;
                        else  return spaces % tabSize == 0;
                        return true;
                    };
                }

                function iterate( applyMethod ) { for (var i=startRow; i<=endRow; i++) applyMethod(doc.getLine(i), i); }


                minEmptyLength = Infinity;
                
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

                if (Infinity == minIndent) 
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
                var ayto = this, 
                    TokenIterator = ace_require('ace/token_iterator').TokenIterator,
                    Range = ace_require('ace/range').Range,
                    comment = ayto.BC, iterator, token, sel,
                    initialRange, startRow, colDiff,
                    startRange, endRange, i, row, column
                ;
                if (!comment) return;

                iterator = new TokenIterator(session, cursor.row, cursor.column);
                token = iterator.getCurrentToken();

                sel = session.selection;
                initialRange = sel.toOrientedRange();

                if (token && /comment/.test(token.type)) 
                {
                    while (token && /comment/.test(token.type)) 
                    {
                        i = token.value.indexOf(comment.start);
                        if (i != -1) 
                        {
                            row = iterator.getCurrentTokenRow();
                            column = iterator.getCurrentTokenColumn() + i;
                            startRange = new Range(row, column, row, column + comment.start.length);
                            break;
                        }
                        token = iterator.stepBackward();
                    };

                    iterator = new TokenIterator(session, cursor.row, cursor.column);
                    token = iterator.getCurrentToken();
                    while (token && /comment/.test(token.type)) 
                    {
                        i = token.value.indexOf(comment.end);
                        if (i != -1) 
                        {
                            row = iterator.getCurrentTokenRow();
                            column = iterator.getCurrentTokenColumn() + i;
                            endRange = new Range(row, column, row, column + comment.end.length);
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
                
                supportGrammarAnnotations: 0,
                
                //HighlightRules: null,
                //$behaviour: parser.$behaviour || null,

                createWorker: function(session) {
                    
                    if ( !mode.supportGrammarAnnotations ) return null;
                    
                    // add this worker as an ace custom module
                    ace_config.setModuleUrl("ace/grammar_worker", thisPath.file);
                    
                    var worker = new AceWorkerClient(['ace'], "ace/grammar_worker", 'AceGrammarWorker');
                    
                    worker.attachToDocument(session.getDocument());
                    
                    // create a worker for this grammar
                    worker.call('Init', [grammar], function(){
                        //console.log('Init returned');
                        // hook worker to enable error annotations
                        worker.on("error", function(e) {
                            //console.log(e.data);
                            session.setAnnotations(e.data);
                        });

                        worker.on("ok", function() {
                            session.clearAnnotations();
                        });
                    });
                    
                    return worker;
                    
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
            
            return getAceMode( new Parser( parsedgrammar, LOCALS ), grammar );
        }
    ;
  