    
    // ace supposed to be available
    var _ace = ace || { require: function() { return { }; } }, ace_require = _ace.require;
    
    //
    // parser factories
    var
        AceRange = ace_require('ace/range').Range || Object,
        // support folding/unfolding
        /*
        AceFoldMode = ace_require('ace/mode/folding/fold_mode').FoldMode || Object,
        ParserFoldMode = Class(AceFoldMode, {
            constructor: function(start, stop) {
                this.foldingStartMarker = start || null;
                this.foldingStopMarker = stop || null;
            },
            
            foldingStartMarker : null,
            foldingStopMarker : null,
            
            getFoldWidget : function(session, foldStyle, row) {
                if ( !this.foldingStartMarker ) return;
                var line = session.getLine(row);
                if (this.foldingStartMarker.test(line)) return "start";
                if (foldStyle == "markbeginend" && this.foldingStopMarker && this.foldingStopMarker.test(line)) return "end";
                return "";
            },

            getFoldWidgetRange : function(session, foldStyle, row, forceMultiline) {
                var line = session.getLine(row);
                var match = line.match(this.foldingStartMarker);
                if (match) 
                {
                    var i = match.index;

                    if (match[1])  return this.openingBracketBlock(session, match[1], row, i);

                    var range = session.getCommentFoldRange(row, i + match[0].length, 1);

                    if (range && !range.isMultiLine()) 
                    {
                        if (forceMultiline) 
                            range = this.getSectionRange(session, row);
                        else if (foldStyle != "all")   
                            range = null;
                    }

                    return range;
                }

                if (foldStyle === "markbegin")  return;

                var match = line.match(this.foldingStopMarker);
                if (match) 
                {
                    var i = match.index + match[0].length;

                    if (match[1])
                        return this.closingBracketBlock(session, match[1], row, i);

                    return session.getCommentFoldRange(row, i, -1);
                }
            },

            getSectionRange : function(session, row) {
                var line = session.getLine(row);
                var startIndent = line.search(/\S/);
                var startRow = row;
                var startColumn = line.length;
                row = row + 1;
                var endRow = row;
                var maxRow = session.getLength();
                while (++row < maxRow) 
                {
                    line = session.getLine(row);
                    var indent = line.search(/\S/);
                    if (indent === -1)
                        continue;
                    if  (startIndent > indent)
                        break;
                    var subRange = this.getFoldWidgetRange(session, "all", row);

                    if (subRange) 
                    {
                        if (subRange.start.row <= startRow) 
                            break;
                        else if (subRange.isMultiLine()) 
                            row = subRange.end.row;
                        else if (startIndent == indent) 
                            break;
                    }
                    endRow = row;
                }

                return new AceRange(startRow, startColumn, endRow, session.getLine(endRow).length);
            },

            indentationBlock : function(session, row, column) {
                var re = /\S/;
                var line = session.getLine(row);
                var startLevel = line.search(re);
                if (startLevel == -1) return;

                var startColumn = column || line.length;
                var maxRow = session.getLength();
                var startRow = row;
                var endRow = row;

                while (++row < maxRow) 
                {
                    var level = session.getLine(row).search(re);

                    if (level == -1)
                    continue;

                    if (level <= startLevel)
                    break;

                    endRow = row;
                }

                if (endRow > startRow) 
                {
                    var endColumn = session.getLine(endRow).length;
                    return new AceRange(startRow, startColumn, endRow, endColumn);
                }
            },

            openingBracketBlock : function(session, bracket, row, column, typeRe) {
                var start = {row: row, column: column + 1};
                var end = session.$findClosingBracket(bracket, start, typeRe);
                if (!end) return;

                var fw = session.foldWidgets[end.row];
                if (fw == null)
                fw = session.getFoldWidget(end.row);

                if (fw == "start" && end.row > start.row) 
                {
                    end.row --;
                    end.column = session.getLine(end.row).length;
                }
                return AceRange.fromPoints(start, end);
            },

            closingBracketBlock : function(session, bracket, row, column, typeRe) {
                var end = {row: row, column: column};
                var start = session.$findOpeningBracket(bracket, end);

                if (!start) return;

                start.column++;
                end.column--;

                return  AceRange.fromPoints(start, end);
            }
        }),
        */
        // support indentation/behaviours/comments toggle
        AceBehaviour = /*ace_require('ace/mode/behaviour').Behaviour ||*/ null,
        AceTokenizer = ace_require('ace/tokenizer').Tokenizer || Object,
        AceTokenIterator = ace_require('ace/token_iterator').TokenIterator || Object,
        AceParser = Class(AceTokenizer, {
            
            constructor: function(grammar, LOC) {
                //this.LOC = LOC;
                //this.Grammar = grammar;
                //this.Comments = grammar.Comments || {};
                
                // support comments toggle
                this.LC = grammar.Comments.line || null;
                this.BC = (grammar.Comments.block) ? { start: grammar.Comments.block[0][0], end: grammar.Comments.block[0][1] } : null;
                if ( this.LC )
                {
                    if ( T_ARRAY & get_type(this.LC) ) 
                    {
                        var rxLine = this.LC.map( escRegexp ).join( "|" );
                    } 
                    else 
                    {
                        var rxLine = escRegexp( this.LC );
                    }
                    this.rxLine = new RegExp("^(\\s*)(?:" + rxLine + ") ?");
                }
                if ( this.BC )
                {
                    this.rxStart = new RegExp("^(\\s*)(?:" + escRegexp(this.BC.start) + ")");
                    this.rxEnd = new RegExp("(?:" + escRegexp(this.BC.end) + ")\\s*$");
                }

                this.DEF = LOC.DEFAULT;
                this.ERR = grammar.Style.error || LOC.ERROR;
                
                // support keyword autocompletion
                this.Keywords = grammar.Keywords.autocomplete || null;
                
                this.Tokens = grammar.Parser || [];
                this.cTokens = (grammar.cTokens.length) ? grammar.cTokens : null;
                
                /*if (this.cTokens)
                    this.Tokens = this.cTokens.concat(this.Tokens);*/
            },
            
            //LOC: null,
            //Grammar: null,
            //Comments: null,
            //$behaviour: null,
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

            // ACE Tokenizer compatible
            getLineTokens: function(line, state, row) {
                
                var i, rewind, rewind2, ci,
                    tokenizer, interleavedCommentTokens = this.cTokens, tokens = this.Tokens, numTokens = tokens.length, 
                    aceTokens, token, type, 
                    stream, stack, DEFAULT = this.DEF, ERROR = this.ERR
                ;
                
                //state && console.log([row, state.l, state.stack.length ? state.stack[state.stack.length-1].tn : null, state.inBlock]);
                aceTokens = []; 
                stream = new ParserStream( line );
                state = (state) ? state.clone( ) : new ParserState( );
                state.l = 1+row;
                stack = state.stack;
                token = { type: null, value: "" };
                type = null;
                
                while ( !stream.eol() )
                {
                    rewind = 0;
                    
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
                        state.r = type = DEFAULT;
                        continue;
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
                    aceTokens.push( { type: type, value: stream.cur() } );
                }
                else if ( token.type )
                {
                    token.value += stream.cur();
                    aceTokens.push( token );
                }
                token = null; //{ type: null, value: "" };
                
                // if EOL tokenizer is left on stack, pop it now
                if ( stack.length && T_EOL == stack[stack.length-1].tt )  stack.pop();
                
                //console.log(aceTokens);
                //console.log([row, state.l, stack.length ? stack[stack.length-1].tn : null, state.inBlock]);
                
                // ACE Tokenizer compatible
                return { state: state, tokens: aceTokens };
            },
            
            tCL : function(state, session, startRow, endRow) {
                var doc = session.doc;
                var ignoreBlankLines = true;
                var shouldRemove = true;
                var minIndent = Infinity;
                var tabSize = session.getTabSize();
                var insertAtTabStop = false;
                
                if ( !this.LC ) 
                {
                    if ( !this.BC ) return false;
                    
                    var lineCommentStart = this.BC.start;
                    var lineCommentEnd = this.BC.end;
                    var regexpStart = this.rxStart;
                    var regexpEnd = this.rxEnd;

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
                    var lineCommentStart = (T_ARRAY == get_type(this.LC)) ? this.LC[0] : this.LC;
                    var regexpLine = this.rxLine;
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
                var comment = this.BC;
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
                            break
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
                        colDiff = -comment.start.length
                    }
                } 
                else 
                {
                    colDiff = comment.start.length
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
        
        getAceMode = function(parser) {
            
            // ACE-compatible Mode
            return {
                /*
                // Maybe needed in later versions..
                
                createModeDelegates: function (mapping) { },

                $delegator: function(method, args, defaultHandler) { },
                */
                
                // the custom Parser/Tokenizer
                getTokenizer: function() { return parser; },
                
                //HighlightRules: null,
                //$behaviour: parser.$behaviour || null,

                createWorker: function(session) { return null; },

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
            
            // build the grammar
            grammar = parseGrammar( grammar );
            //console.log(grammar);
            
            return getAceMode( getParser( grammar, LOCALS ) );
        }
    ;
  