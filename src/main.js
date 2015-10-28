/**
*
*   AceGrammar
*   @version: @@VERSION@@
*
*   Transform a grammar specification in JSON format, into an ACE syntax-highlight parser mode
*   https://github.com/foo123/ace-grammar
*   https://github.com/foo123/editor-grammar
*
**/


var 
isNode = !!(("undefined" !== typeof global) && ("[object global]" === toString.call(global))),
isBrowser = !!(!isNode && ("undefined" !== typeof navigator)),
isWorker = !!(isBrowser && ("function" === typeof importScripts) && (navigator instanceof WorkerNavigator)),
this_path = (function(isNode, isBrowser, isWorker) {
    // Get current filename/path
    var file = null, path = null, base = null, scripts;
    if ( isNode ) 
    {
        // http://nodejs.org/docs/latest/api/globals.html#globals_filename
        // this should hold the current file in node
        file = __filename; path = __dirname; base = __dirname;
    }
    else if ( isWorker )
    {
        // https://developer.mozilla.org/en-US/docs/Web/API/WorkerLocation
        // this should hold the current url in a web worker
        file = self.location.href; path = file.split('/').slice(0, -1).join('/');
    }
    else if ( isBrowser )
    {
        // get last script (should be the current one) in browser
        base = document.location.href.split('#')[0].split('?')[0].split('/').slice(0, -1).join('/');
        if ((scripts = document.getElementsByTagName('script')) && scripts.length)
        {
            file = scripts[scripts.length - 1].src;
            path = file.split('/').slice(0, -1).join('/');
        }
    }
    return { path: path, file: file, base: base };
})(isNode, isBrowser, isWorker),

// ace supposed to be available
$ace$ = (typeof ace !== 'undefined') ? ace : { require: function() { return { }; }, config: {} }
;


//
// parser factories
var AceParser = Class(Parser, {
    constructor: function AceParser( grammar, DEFAULT ) {
        var self = this, rxLine, FOLD = null, TYPE;
        
        Parser.call(self, grammar, "text", "invalid");
        self.$v$ = 'value';
        self.DEF = DEFAULT || self.$DEF;
        self.ERR = grammar.Style.error || self.$ERR;
        
        // support comments toggle
        self.LC = grammar.$comments.line || null;
        self.BC = grammar.$comments.block ? { start: grammar.$comments.block[0][0], end: grammar.$comments.block[0][1] } : null;
        if ( self.LC )
        {
            if ( T_ARRAY & get_type(self.LC) ) 
                rxLine = map( self.LC, esc_re ).join( "|" );
            
            else 
                rxLine = esc_re( self.LC );
            
            self.rxLine = new_re("^(\\s*)(?:" + rxLine + ")?");
        }
        if ( self.BC )
        {
            self.rxStart = new_re("^(\\s*)(?:" + esc_re(self.BC.start) + ")");
            self.rxEnd = new_re("(?:" + esc_re(self.BC.end) + ")\\s*$");
        }
        
        // comment-block folding
        if ( grammar.$comments.block && grammar.$comments.block.length )
        {
            TYPE = AceParser.Type( 'comment' );
            for(var i=0,l=grammar.$comments.block.length; i<l; i++)
            {
                self.$folders.push(AceParser.Fold.Delimited(
                    grammar.$comments.block[i][0],
                    grammar.$comments.block[i][1],
                    TYPE
                ));
            }
        }
        // user-defined folding
        if ( grammar.Fold && (T_STR & get_type(grammar.Fold)) ) FOLD = grammar.Fold[LOWER]();
        else if ( grammar.$extra.fold ) FOLD = grammar.$extra.fold[LOWER]();
        if ( FOLD )
        {
            FOLD = FOLD.split('+');  // can use multiple folders, separated by '+'
            iterate(function( i, FOLDER ) {
            var FOLD = trim(FOLDER[i]);
            if ( 'brace' === FOLD || 'cstyle' === FOLD )
            {
                var blocks = get_block_types( grammar, 1 );
                TYPE = blocks.length ? AceParser.Type( blocks, false ) : TRUE;
                self.$folders.push( AceParser.Fold.Delimited( '{', '}', TYPE ) );
                self.$folders.push( AceParser.Fold.Delimited( '[', ']', TYPE ) );
            }
            else if ( 'indent' === FOLD || 'indentation' === FOLD )
            {
                self.$folders.push( AceParser.Fold.Indented( ) );
            }
            else if ( 'markup' === FOLD || 'html' === FOLD || 'xml' === FOLD )
            {
                self.$folders.push( AceParser.Fold.Delimited( '<![CDATA[', ']]>', AceParser.Type(['comment','tag'], false) ) );
                self.$folders.push( AceParser.Fold.MarkedUp( AceParser.Type('tag'), '<', '>', '/' ) );
            }
            }, 0, FOLD.length-1, FOLD);
        }
    }
    
    ,LC: null
    ,BC: null
    ,rxLine: null
    ,rxStart: null
    ,rxEnd: null

    ,dispose: function( ) {
        var self = this;
        self.LC = self.BC = self.rxLine = self.rxStart = self.rxEnd = null;
        return Parser[PROTO].dispose.call( self );
    }
    
    ,getLineTokens: function( line, state, row ) {
        var self = this;
        state = new State( 1, state );
        // ACE Tokenizer compatible
        return {tokens:self.tokenize( Stream( line ), state, row ), state:state};
    }
    
    ,keywords: function( append, ace ) { 
        var self = this;
        if ( self.$grammar.$autocomplete )
        {
            return map(self.$grammar.$autocomplete, function( word ){
                return {
                    name: word.word,
                    value: word.word,
                    meta: word.meta,
                    score: 1
                };
            });
        }
        return [];
    }
    ,autocomplete: function( state, session, position, prefix, options, ace ) {
        var self = this;
        if ( self.$grammar.$autocomplete && prefix.length )
        {
            options = options || {};
            var case_insensitive_match = options[HAS]('caseInsesitiveMatch')? !!options.caseInsesitiveMatch : false,
                prefix_match = options[HAS]('prefixMatch')? !!options.prefixMatch : true,
                token = prefix, token_i = token[LOWER](), len = token.length;
            return operate(self.$grammar.$autocomplete, function( list, word ){
                var w = word.word, wl = w.length, 
                    wm, case_insensitive_word,
                    pos, pos_i, m1, m2, case_insensitive;
                if ( wl >= len )
                {
                    wm = word.meta;  case_insensitive_word = !!w.ci;
                    case_insensitive = case_insensitive_match || case_insensitive_word;
                    if ( case_insensitive ) { m1 = w[LOWER](); m2 = token_i; }
                    else  {  m1 = w;  m2 = token; }
                    if ( (pos_i = m1.indexOf( m2 )) >= 0 && (!prefix_match || (0 === pos_i)) )
                    {
                        pos = case_insensitive ? w.indexOf( token ) : pos_i;
                        list.push({
                            name: w,
                            value: w,
                            meta: wm,
                            // longer matches or matches not at start have lower match score
                            score: 1000 - 10*(wl-len) - 5*(pos<0?pos_i+3:pos)
                        });
                    }
                }
                return list;
            }, []);
        }
        return [];
    }
    
    ,indent: function( state, line, tab, ace ) { 
        return line.match(Stream.$SPACE$)[0]; 
    }
    
    ,iterator: function( session, ace ) {
        var tabSize = session.getTabSize();
        return {
         row: 0, col: 0, min: 0, max: 0
        ,line: function( row ) { return session.getLine( row ); }
        //,nlines: function( ) { return session.getLength( ); }
        ,first: function( ) { return 0; }
        ,last: function( ) { return session.getLength( )-1; }
        ,next: function( ) {
            var iter = this;
            if ( iter.row >= iter.max ) return;
            iter.col = 0; iter.row++;
            return true;
        }
        ,prev: function( ) {
            var iter = this;
            if ( iter.row <= iter.min ) return;
            iter.col = 0; iter.row--;
            return true;
        }
        ,indentation: function( line ) { return count_column( line, null, tabSize ); }
        ,token: function( row, col ) { return session.getTokenAt( row, col ).type; }
        };
    }
    
    ,fold: function( session, row, ace ) {
        var self = this, folders = self.$folders, i, l = folders.length, iter, fold;
        if ( l )
        {
            iter = self.iterator( session, ace );
            iter.row = row; iter.col = 0;
            for (i=0; i<l; i++)
                if ( fold = folders[ i ]( iter ) )
                    return fold;
        }
    }
    
    // toggle comment lines
    ,tCL: function( state, session, startRow, endRow ) {
        var parser = self, doc = session.doc,
            ignoreBlankLines = true,
            shouldRemove = true,
            minIndent = Infinity,
            tabSize = session.getTabSize(),
            insertAtTabStop = false,
            comment, uncomment, testRemove, shouldInsertSpace,
            lineCommentStart, lineCommentEnd, regexpStart, regexpEnd, 
            minEmptyLength, regexpLine, commentWithSpace
        ;
        
        if ( !parser.LC ) 
        {
            if ( !parser.BC ) return false;
            
            lineCommentStart = parser.BC.start;
            lineCommentEnd = parser.BC.end;
            regexpStart = parser.rxStart;
            regexpEnd = parser.rxEnd;

            comment = function( i ) {
                var line = doc.getLine(i);
                if (testRemove(line, i)) return;
                if (!ignoreBlankLines || /\S/.test(line)) 
                {
                    doc.insertInLine({row: i, column: line.length}, lineCommentEnd);
                    doc.insertInLine({row: i, column: minIndent}, lineCommentStart);
                }
            };

            uncomment = function( i ) {
                var line = doc.getLine(i), m;
                if (m = line.match(regexpEnd))
                    doc.removeInLine(i, line.length - m[0].length, line.length);
                if (m = line.match(regexpStart))
                    doc.removeInLine(i, m[1].length, m[0].length);
            };

            testRemove = function( line, row ) {
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
            lineCommentStart = (T_ARRAY === get_type(parser.LC)) ? parser.LC[0] : parser.LC;
            regexpLine = parser.rxLine;
            commentWithSpace = lineCommentStart + " ";
            
            insertAtTabStop = session.getUseSoftTabs();

            uncomment = function( i ) {
                var line = doc.getLine(i), m = line.match(regexpLine), start, end;
                if (!m) return;
                start = m[1].length; end = m[0].length;
                if (!shouldInsertSpace(line, start, end) && m[0][end - 1] == " ")  end--;
                doc.removeInLine(i, start, end);
            };
            
            comment = function( i ) {
                var line = doc.getLine(i);
                if (!ignoreBlankLines || /\S/.test(line)) 
                {
                    if (shouldInsertSpace(line, minIndent, minIndent))
                        doc.insertInLine({row: i, column: minIndent}, commentWithSpace);
                    else
                        doc.insertInLine({row: i, column: minIndent}, lineCommentStart);
                }
            };
            
            testRemove = function( line, i ) {
                return regexpLine.test(line);
            };

            shouldInsertSpace = function(line, before, after) {
                var spaces = 0;
                while (before-- && line[CHAR](before) == " ") spaces++;
                if (spaces % tabSize != 0) return false;
                spaces = 0;
                while (line[CHAR](after++) == " ") spaces++;
                if (tabSize > 2)  return spaces % tabSize != tabSize - 1;
                else  return spaces % tabSize == 0;
                return true;
            };
        }

        minEmptyLength = Infinity;
        
        iterate(function( i ) {
            var line = doc.getLine(i), indent = line.search(/\S/);
            if (indent !== -1) 
            {
                if (indent < minIndent)  minIndent = indent;
                if (shouldRemove && !testRemove(line, i)) shouldRemove = false;
            } 
            else if (minEmptyLength > line.length)
            {
                minEmptyLength = line.length;
            }
        }, startRow, endRow);

        if (Infinity == minIndent) 
        {
            minIndent = minEmptyLength;
            ignoreBlankLines = false;
            shouldRemove = false;
        }

        if (insertAtTabStop && minIndent % tabSize != 0)
            minIndent = Math.floor(minIndent / tabSize) * tabSize;

        iterate(shouldRemove ? uncomment : comment, startRow, endRow);
    }

    // toggle block comment
    ,tCB: function( state, session, range, cursor, TokenIterator, Range ) {
        var parser = self, comment = parser.BC, iterator, token, sel,
            initialRange, startRow, colDiff,
            startRange, endRange, i, row, column,
            comment_re = /comment/
        ;
        if (!comment) return;

        iterator = new TokenIterator( session, cursor.row, cursor.column );
        token = iterator.getCurrentToken();

        sel = session.selection;
        initialRange = sel.toOrientedRange();

        if (token && comment_re.test(token.type)) 
        {
            while (token && comment_re.test(token.type)) 
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
            while (token && comment_re.test(token.type)) 
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
    }
});
AceParser.Type = Type;
AceParser.Fold = Folder;

if ( isWorker ) onmessage = grammar_worker_init;

// worker factory
function grammar_worker_init( e )
{
    var msg = e ? e.data : null;
    if ( msg && msg.load && msg.ace_worker_base ) 
    {        
        // import an ace base worker with needed dependencies ??
        importScripts( msg.ace_worker_base );
        
        ace.define('ace/grammar_worker', 
            ['require', 'exports', 'module' , 'ace/worker/mirror'], 
            function( require, exports, module ) {
            var WorkerMirror = require("./worker/mirror").Mirror, AceGrammarWorker;
            
            // extends require("./worker/mirror").Mirror
            exports.AceGrammarWorker = AceGrammarWorker = Class(WorkerMirror, {
                constructor: function AceGrammarWorker( sender ) {
                    var self = this;
                    WorkerMirror.call( self, sender );
                    self.setTimeout( 300 );
                }
                
                ,$parser: null
                
                ,init_parser: function( grammar, id ) {
                    var self = this;
                    self.$parser = new AceParser( parse_grammar( grammar ) );
                    self.sender.callback( 1, id );
                }
                
                ,onUpdate: function( ) {
                    var self = this, sender = self.sender, parser = self.$parser,
                        code, code_errors, err, error, errors;
                    
                    if ( !parser ) { sender.emit( "ace_grammar_worker_ok", null ); return; }
                    
                    code = self.doc.getValue( );
                    if ( !code || !code.length ) { sender.emit( "ace_grammar_worker_ok", null ); return; }
                    
                    code_errors = parser.parse( code, ERRORS );
                    if ( !code_errors ) { sender.emit( "ace_grammar_worker_ok", null ); return; }
                    
                    errors = [];
                    for (err in code_errors)
                    {
                        if ( !code_errors[HAS](err) ) continue;
                        
                        error = code_errors[err];
                        errors.push({
                            row: error[0],
                            column: error[1],
                            text: error[4] || "Syntax Error",
                            type: "error",
                            raw: error[4] || "Syntax Error",
                            range: [error[0],error[1],error[2],error[3]]
                        });
                    }
                    if ( errors.length )  sender.emit("ace_grammar_worker_error", errors);
                    else  sender.emit("ace_grammar_worker_ok", null);
                }
            });
        });
    }
}

// adapted from ace Marker renderer
// renderer(html, range, left, top, config);
/*function getBorderClass(tl, tr, br, bl)
{
    return (tl ? 1 : 0) | (tr ? 2 : 0) | (br ? 4 : 0) | (bl ? 8 : 0);
}
function custom_text_marker( clazz, popup, session, Range )
{
    var title = esc_html( popup || "" );
    return function( html, range, left, top, config ) {
        var start = range.start.row, end = range.end.row,
            row = start, prev = 0, curr = 0,
            next = session.getScreenLastRowColumn(row),
            lineRange = new Range(row, range.start.column, row, curr),
            height = config.lineHeight,
            width = (range.end.column - range.start.column) * config.characterWidth,
            css_class
        ;
        for (; row <= end; row++)
        {
            lineRange.start.row = lineRange.end.row = row;
            lineRange.start.column = row == start ? range.start.column : session.getRowWrapIndent(row);
            lineRange.end.column = next;
            prev = curr;  curr = next;
            next = row + 1 < end ? session.getScreenLastRowColumn(row + 1) : row == end ? 0 : range.end.column;
            css_class = clazz + (row == start  ? " ace_start" : "") + " ace_br"
                    + getBorderClass(row == start || row == start + 1 && range.start.column, prev < curr, curr > next, row == end);
            html.push(
                "<div class='", css_class, "' title='", title, "' style='",
                "height:", height, "px;",
                "width:", width + (row == end ? 0 : config.characterWidth), "px;",
                "top:", top, "px;",
                "left:", left, "px;", "'></div>"
            );
        }
    };
}*/

function clear_markers( session, $markers )
{
    if ( !session[$markers] ) session[$markers] = [];
    var i, markers = session[$markers];
    if ( markers && markers.length )
    {
        for (i=0; i<markers.length; i++)
            session.removeMarker( markers[i] );
    }
    markers.length = 0;
}

function update_markers( session, errors, $markers, Range )
{
    var i, l = errors.length, err, markers;
    clear_markers( session, $markers );
    markers = session[$markers];
    for (i=0; i<l; i++)
    {
        err = errors[i];
        if ( err.range )
        {
            markers.push(
            session.addMarker(
                new Range(err.range[0], err.range[1], err.range[2], err.range[3]),
                "ace_error-marker",
                "text"/*custom_text_marker( "ace_error-marker", err.text, session, Range )*/,
                0/*back*/
            ));
            del(err, 'range');
        }
    }
}

function clear_annotations( session, $markers )
{
    clear_markers( session, $markers );
    session.clearAnnotations( );
}

function update_annotations( session, errors, $markers, Range )
{
    update_markers( session, errors, $markers, Range );
    session.setAnnotations( errors );
}


function get_mode( grammar, DEFAULT, ace ) 
{
    // ace required helpers
    ace = ace || $ace$;  /* pass ace reference if not already available */
    var ace_mode, grammar_copy = clone( grammar )
    ,Range = ace.require('ace/range').Range
    ,TokenIterator = ace.require('ace/token_iterator').TokenIterator
    // adapted from ace directly
    ,WorkerClient = ace.require("ace/worker/worker_client").WorkerClient
    ,AceWorker = Class(WorkerClient, {
        constructor: function AceWorker( topLevelNamespaces, mod, classname ) {
            var self = this, require = ace.require, config = ace.config;
            self.$sendDeltaQueue = self.$sendDeltaQueue.bind(self);
            self.changeListener = self.changeListener.bind(self);
            self.onMessage = self.onMessage.bind(self);
            if (require.nameToUrl && !require.toUrl) require.toUrl = require.nameToUrl;

            var workerUrl;
            if (config.get("packaged") || !require.toUrl) {
                workerUrl = config.moduleUrl(mod, "worker");
            } else {
                var normalizePath = self.$normalizePath;
                workerUrl = normalizePath(require.toUrl("ace/worker/worker.js", null, "_"));

                var tlns = {};
                topLevelNamespaces.forEach(function(ns) {
                    tlns[ns] = normalizePath(require.toUrl(ns, null, "_").replace(/(\.js)?(\?.*)?$/, ""));
                });
            }
            
            self.$worker = new Worker( workerUrl );
            
            self.$worker.postMessage({
                load: true,
                ace_worker_base: this_path.base + '/' + config.moduleUrl("ace/worker/json")
            });

            self.$worker.postMessage({
                init : true,
                tlns: tlns,
                module: mod,
                classname: classname
            });

            self.callbackId = 1;
            self.callbacks = {};

            self.$worker.onmessage = self.onMessage;
        }
    })
    // adapted from ace directly
    ,FoldMode = ace.require("ace/mode/folding/fold_mode").FoldMode
    ,AceFold = Class(FoldMode, {
        constructor: function( $folder ) {
            var self = this;
            FoldMode.call( self );
            self.$findFold = $folder;
        }
        ,getFoldWidget: function( session, foldStyle, row ) {
            var self = this, fold = self.$findFold( session, foldStyle, row );
            if ( fold )
            {
                if ( "markbeginend" === foldStyle && fold.end ) return "end";
                else return "start";
            }
            return "";
        }
        ,getFoldWidgetRange: function( session, foldStyle, row, forceMultiline ) {
            var fold = this.$findFold( session, foldStyle, row );
            if ( fold ) return new Range(fold[0], fold[1], fold[2], fold[3]);
        }
    })
    ;
    
    // ACE-compatible Mode
    ace_mode = {
        $id: uuid("ace_grammar_mode")
        ,$parser: new AceGrammar.Parser( parse_grammar( grammar ), DEFAULT )
        
        /*
        // maybe needed in later versions..?
        ,createModeDelegates: function (mapping) { }
        ,$delegator: function(method, args, defaultHandler) { }
        ,HighlightRules: null
        ,$behaviour: parser.$behaviour || null
        ,lineCommentStart: parser.LC
        ,blockComment: parser.BC
        ,$getIndent: function(line) { return parser.indent(line); }
        ,$createKeywordList: function() { return parser.$createKeywordList(); }
        */
        
        ,getTokenizer: function( ) {
            return ace_mode.$parser;
        }
        
        ,toggleCommentLines: function( state, session, startRow, endRow ) { 
            return ace_mode.$parser.tCL( state, session, startRow, endRow ); 
        }
        ,toggleBlockComment: function( state, session, range, cursor ) { 
            return ace_mode.$parser.tCB( state, session, range, cursor, TokenIterator, Range ); 
        }
        
        ,transformAction: function( state, action, editor, session, param ) {  }
        
        ,getNextLineIndent: function( state, line, tab ) { 
            return ace_mode.$parser.indent( state, line, tab ); 
        }
        ,checkOutdent: function( state, line, input ) {
            return false;
        }
        ,autoOutdent: function( state, doc, row ) {  }

        // custom, user-defined, code folding generated from grammar
        ,supportCodeFolding: true
        ,$folder: function folder( session, foldStyle, row ) {
            var fold, min_row, current_row, folder;
            if ( ace_mode.supportCodeFolding && ace_mode.$parser )
            {
                folder = ace_mode.$parser;
                
                if ( "markbeginend" === foldStyle )
                {
                    current_row = row; min_row = MAX(0, row-500); // check up to 500 rows up
                    fold = folder.fold( session, row, ace );
                    if ( fold )
                    {
                        fold.start = true; fold.end = false;
                        return fold;
                    }
                    // try to find if any block ends on this row, backwards
                    // TODO, maybe a bit slower, than direct backwards search
                    while ( row > min_row && (!fold || current_row !== fold[2]) ) fold = folder.fold( session, --row, ace );
                    if ( fold && current_row === fold[2] )
                    {
                        fold.start = false; fold.end = true;
                        return fold; // found end of fold, return end marker
                    }
                }
                
                else if ( fold = folder.fold( session, row, ace ) )
                {
                    fold.start = true; fold.end = false;
                    return fold;
                }
            }
        }
        ,foldingRules: null /* added below */
        // custom, user-defined, syntax lint-like validation/annotations generated from grammar
        ,supportGrammarAnnotations: false
        ,createWorker: function( session ) {
            if ( !ace_mode.supportGrammarAnnotations ) 
            {
                clear_annotations( session, ace_mode.$id+'$markers' );
                return null;
            }
            
            // add this worker as an ace custom module
            ace.config.setModuleUrl("ace/grammar_worker", this_path.file);
            var worker = new AceWorker(['ace'], "ace/grammar_worker", 'AceGrammarWorker');
            worker.attachToDocument( session.getDocument( ) );
            // create a worker for this grammar
            worker.call('init_parser', [grammar_copy], function( ){
                // hook worker to enable error annotations
                worker.on("ace_grammar_worker_error", function( e ) {
                    var errors = e.data;
                    update_annotations( session, errors, ace_mode.$id+'$markers', Range )
                });
                worker.on("ace_grammar_worker_ok", function() {
                    clear_annotations( session, ace_mode.$id+'$markers' );
                });
            });
            return worker;
        }
        // custom, user-defined, autocompletions generated from grammar
        ,supportAutoCompletion: true
        ,getCompletions: function( state, session, position, prefix ) {
            return ace_mode.supportAutoCompletion && ace_mode.$parser
            ? ace_mode.$parser.autocomplete( state, session, position, prefix, options, ace )
            : [];
        }
        
        ,dispose: function( ) {
            if ( ace_mode.$parser ) ace_mode.$parser.dispose( );
            ace_mode.$parser = null;
            ace_mode.foldingRules = ace_mode.$folder = null;
        }
    };
    ace_mode.foldingRules = new AceFold( ace_mode.$folder );
    return ace_mode;
}


//
//  Ace Grammar main class
/**[DOC_MARKDOWN]
*
* ###AceGrammar Methods
*
* __For node:__
*
* ```javascript
* var AceGrammar = require('build/ace_grammar.js').AceGrammar;
* ```
*
* __For browser:__
*
* ```html
* <script src="build/ace_grammar.js"></script>
* ```
*
[/DOC_MARKDOWN]**/
var AceGrammar = exports['@@MODULE_NAME@@'] = {
    
    VERSION: "@@VERSION@@",
    
    // clone a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `clone`
    *
    * ```javascript
    * cloned = AceGrammar.clone( grammar [, deep=true] );
    * ```
    *
    * Clone (deep) a `grammar`
    *
    * Utility to clone objects efficiently
    [/DOC_MARKDOWN]**/
    clone: clone,
    
    // extend a grammar using another base grammar
    /**[DOC_MARKDOWN]
    * __Method__: `extend`
    *
    * ```javascript
    * extendedgrammar = AceGrammar.extend( grammar, basegrammar1 [, basegrammar2, ..] );
    * ```
    *
    * Extend a `grammar` with `basegrammar1`, `basegrammar2`, etc..
    *
    * This way arbitrary `dialects` and `variations` can be handled more easily
    [/DOC_MARKDOWN]**/
    extend: extend,
    
    // pre-process a grammar (in-place)
    /**[DOC_MARKDOWN]
    * __Method__: `pre_process`
    *
    * ```javascript
    * AceGrammar.pre_process( grammar );
    * ```
    *
    * This is used internally by the `AceGrammar` Class `parse` method
    * In order to pre-process, in-place, a `JSON grammar` 
    * to transform any shorthand configurations to full object configurations and provide defaults.
    [/DOC_MARKDOWN]**/
    pre_process: preprocess_grammar,
    
    // parse a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `parse`
    *
    * ```javascript
    * parsedgrammar = AceGrammar.parse( grammar );
    * ```
    *
    * This is used internally by the `AceGrammar` Class
    * In order to parse a `JSON grammar` to a form suitable to be used by the syntax-highlight parser.
    * However user can use this method to cache a `parsedgrammar` to be used later.
    * Already parsed grammars are NOT re-parsed when passed through the parse method again
    [/DOC_MARKDOWN]**/
    parse: parse_grammar,
    
    // get an ACE-compatible syntax-highlight mode from a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `getMode`
    *
    * ```javascript
    * mode = AceGrammar.getMode( grammar, [, DEFAULT, ace] );
    * ```
    *
    * This is the main method which transforms a `JSON grammar` into an `ACE` syntax-highlight parser.
    * `DEFAULT` is the default return value (`"text"` by default) for things that are skipped or not styled
    * In general there is no need to set this value, unless you need to return something else
    * The `ace` reference can also be passed as parameter, for example,
    * if `ace` is not already available when the add-on is first loaded (e.g via an `async` callback)
    [/DOC_MARKDOWN]**/
    getMode: get_mode,
    
    // make Parser class available
    /**[DOC_MARKDOWN]
    * __Parser Class__: `Parser`
    *
    * ```javascript
    * Parser = AceGrammar.Parser;
    * ```
    *
    * The Parser Class used to instantiate a highlight parser, is available.
    * The `getMode` method will instantiate this parser class, which can be overriden/extended if needed, as needed.
    * In general there is no need to override/extend the parser, unless you definately need to.
    [/DOC_MARKDOWN]**/
    Parser: AceParser
};
