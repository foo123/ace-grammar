function ace_grammar_demo(_editor, code, langs)
{
    document.getElementById('editor-version').innerHTML = '1.2.0';
    document.getElementById('grammar-version').innerHTML = AceGrammar.VERSION;
    
    var Editor = ace.require("ace/editor").Editor,
        editor = ace.edit(_editor), session = editor.getSession();
    
    var main_lang, main_mode;
    
    for (var i=0,l=langs.length; i<l; i++)
    {
    var lang = langs[i].language, grammar = langs[i].grammar, mode;
    
    // 2. parse the grammar into an ACE syntax-highlight mode
    mode = AceGrammar.getMode( grammar );
    mode.name = lang;
    
    if ( 0 === i )
    {
        // main mode
        main_lang = lang; main_mode = mode;
        
        // enable syntax validation
        main_mode.supportGrammarAnnotations = true;
        // enable auto-completion
        main_mode.supportAutoCompletion = true;
        main_mode.autocompleter.options = {prefixMatch:true, caseInsensitiveMatch:false, inContext:true};
        // enable code-folding
        main_mode.supportCodeFolding = true;
        // enable code-matching
        main_mode.supportCodeMatching = true;
    }
    else
    {
        // submodes
        // add any sub/inner modes to main mode
        main_mode.submode( lang, mode );
    }
    }
    
    // 3. use it with ACE
    
    // editor commands
    var commands = {
        
        defaults : {
            toggleCommentLines : {win: "Ctrl-L", mac: "Command-L"},
            toggleCommentBlock : {win: "Alt-L", mac: "Alt-L"}
        },
        
        toggleCommentLines : {
            name: "toggleCommentLines",
            exec: function(editor) {
                editor.toggleCommentLines();
            },
            bindKey: null
        },
        
        toggleCommentBlock : {
            name: "toggleCommentBlock",
            exec: function(editor) {
                editor.toggleBlockComment();
            },
            bindKey: null
        }
    };
    commands.toggleCommentLines.bindKey = commands.defaults.toggleCommentLines;
    commands.toggleCommentBlock.bindKey = commands.defaults.toggleCommentBlock;

    // editpr options
    ace.config.defineOptions(Editor.prototype, "editor", {
        toggleCommentLinesKey: {
            set: function(val) {
                if (val) 
                    commands.toggleCommentLines.bindKey = val;
                else 
                    commands.toggleCommentLines.bindKey = commands.defaults.toggleCommentLines;
            },
            value: commands.defaults.toggleCommentLines
        },
        toggleCommentBlockKey: {
            set: function(val) {
                if (val) 
                    commands.toggleCommentBlock.bindKey = val;
                else 
                    commands.toggleCommentBlock.bindKey = commands.defaults.toggleCommentBlock;
            },
            value: commands.defaults.toggleCommentBlock
        },
        enableToggleCommentLines: {
            set: function(val) {
                if (val) 
                    this.commands.addCommand(commands.toggleCommentLines);
                else 
                    this.commands.removeCommand(commands.toggleCommentLines);
            },
            value: false
        },
        enableToggleCommentBlock: {
            set: function(val) {
                if (val) 
                    this.commands.addCommand(commands.toggleCommentBlock);
                else 
                    this.commands.removeCommand(commands.toggleCommentBlock);
            },
            value: false
        },
        onlyKeywordsAutoComplete: {
            set: function(val) {
                if ( this.getOption('enableBasicAutocompletion') )
                {
                    if (val) 
                    {
                        this._completers = this._completers || this.completers.slice();
                        // keyword completer taken from the grammar mode
                        this.completers = [ this.completers[2] ];
                    }
                    else if ( this._completers )
                    {
                        // default completers
                        this.completers = this._completers;
                        this._completers = null;
                    }
                }
            },
            value: false
        }
    });
    
    ace.config.loadModule("ace/ext/language_tools", function() {
        
        editor.setOptions({ 
            enableBasicAutocompletion: true,
            //enableSnippets: true,
            enableToggleCommentLines: true,
            enableToggleCommentBlock: true
        });
        editor.setOptions({ 
            onlyKeywordsAutoComplete: true
        });
        main_mode.matcher( editor );
        editor.setValue( code, -1 );
        session.setMode( main_mode );
        //session.setOptions({useWorker: false});
        session.setFoldStyle("markbeginend");
        //editor.clearSelection();
    });
    
    return editor;
}