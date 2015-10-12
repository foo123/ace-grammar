// 1. an almost complete javascript grammar in simple JSON format
var js_grammar = {
        
    // prefix ID for regular expressions used in the grammar
    "RegExpID" : "RE::",
    
    //
    // Style model
    "Style" : {
        // lang token type  -> Editor (style) tag
        "comment":    "comment",
        "atom":       "constant",
        "keyword":    "keyword",
        "this":       "keyword",
        "builtin":    "support",
        "operator":   "operator",
        "identifier": "identifier",
        "property":   "constant.support",
        "number":     "constant.numeric",
        "string":     "string",
        "regex":      "string.regexp"
    },

    
    //
    // Lexical model
    "Lex" : {
        
        // comments
        "comment" : {
            "type" : "comment",
            "interleave": true,
            "tokens" : [
                // line comment
                // start, end delims  (null matches end-of-line)
                [  "//",  null ],
                // block comments
                // start,  end    delims
                [  "/*",   "*/" ]
            ]
        },
        
        // general identifiers
        "identifier" : "RE::/[_A-Za-z$][_A-Za-z0-9$]*/",
        
        "property" : "RE::/[_A-Za-z$][_A-Za-z0-9$]*/",
        
        // numbers, in order of matching
        "number" : [
            // floats
            "RE::/\\d*\\.\\d+(e[\\+\\-]?\\d+)?/",
            "RE::/\\d+\\.\\d*/",
            "RE::/\\.\\d+/",
            // integers
            // hex
            "RE::/0x[0-9a-fA-F]+L?/",
            // binary
            "RE::/0b[01]+L?/",
            // octal
            "RE::/0o[0-7]+L?/",
            // decimal
            "RE::/[1-9]\\d*(e[\\+\\-]?\\d+)?L?/",
            // just zero
            "RE::/0(?![\\dx])/"
        ],

        // usual strings
        "string" : {
            "type" : "escaped-block",
            "escape" : "\\",
            // start, end of string (can be the matched regex group ie. 1 )
            "tokens" : [ "RE::/(['\"])/",   1 ]
        },
        
        // literal regular expressions
        "regex" : {
            "type" : "escaped-block",
            "escape" : "\\",
            // javascript literal regular expressions can be parsed similar to strings
            "tokens" : [ "/",    "RE::#/[gimy]{0,4}#" ]
        },
        
        // operators
        "operator" : {
            "combine" : true,
            "tokens" : [
                "\\", "+", "-", "*", "/", "%", "&", "|", "^", "~", "<", ">" , "!",
                "||", "&&", "==", "!=", "<=", ">=", "<>", ">>", "<<",
                "===", "!==", "<<<", ">>>" 
            ]
        },
        
        // delimiters
        "delimiter" : {
            "combine" : true,
            "tokens" : [
                "(", ")", "[", "]", "{", "}", ",", "=", ";", "?", ":",
                "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "++", "--",
                ">>=", "<<=", ">>>="
            ]
        },
            
        // atoms
        "atom" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [
                "this",
                "true", "false", 
                "null", "undefined", 
                "NaN", "Infinity"
            ]
        },

        // keywords
        "keyword" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [ 
                "if", "while", "with", "else", "do", "try", "finally",
                "return", "break", "continue", "new", "delete", "throw",
                "var", "const", "let", "function", "catch",
                "for", "switch", "case", "default",
                "in", "typeof", "instanceof"
            ]
        },
        
        // builtins
        "builtin" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [ 
                "Object", "Function", "Array", "String", "Date", "Number", "RegExp", "Exception",
                "setTimeout", "setInterval", "alert", "console"
            ]
        },
        
        "ctx_start": {
            "context-start": true
        },
        
        "ctx_end": {
            "context-end": true
        },
        
        "unique": {
            "unique": ["prop", "$0"],
            "msg": "Duplicate object property \"$0\"",
            "in-context": true
        },
        
        "unique_prop": {
            "unique": ["prop", "$1"],
            "msg": "Duplicate object property \"$0\"",
            "in-context": true
        }
    },
    
    //
    // Syntax model (optional)
    "Syntax" : {
        
        "literalProperty" : "string unique_prop | property unique",
        
        "literalValue" : "atom | string | regex | number | identifier | literalArray | literalObject",
        
        "literalPropertyValue" : "literalProperty ':' literalValue",
        
        // grammar recursion here
        "literalObject" : "'{' ctx_start (literalPropertyValue (',' literalPropertyValue)*)? '}' ctx_end",
        
        // grammar recursion here
        "literalArray" : "'[' (literalValue (',' literalValue)*)? ']'",
        
        "literalStatement" : {
            "type": "ngram",
            "tokens": [
                ["literalObject"],
                ["literalArray"]
            ]
        }
    },

    // what to parse and in what order
    "Parser" : [
        "comment",
        "number",
        "string",
        "regex",
        "keyword",
        "operator",
        "atom",
        "literalStatement"
    ]
};
