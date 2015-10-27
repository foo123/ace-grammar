// 1. a partial javascript grammar in simple JSON format
var js_grammar = {
        
// prefix ID for regular expressions used in the grammar
"RegExpID"                          : "RE::",
    
"Extra"                     : {
    
    "fold"                  : "brace"
    
},
    
// Style model
"Style"                             : {
     
     "comment"                      : "comment"
    ,"atom"                         : "constant"
    ,"keyword"                      : "keyword"
    ,"this"                         : "keyword"
    ,"builtin"                      : "support"
    ,"operator"                     : "operator"
    ,"identifier"                   : "identifier"
    ,"property"                     : "constant.support"
    ,"number"                       : "constant.numeric"
    ,"string"                       : "string"
    ,"regex"                        : "string.regexp"
    
},

// Lexical model
"Lex"                               : {
     
     "comment:comment"              : {"interleave":true,"tokens":[
                                    // line comment
                                    [  "//",  null ],
                                    // block comments
                                    [  "/*",   "*/" ]
                                    ]}
    ,"identifier"                   : "RE::/[_A-Za-z$][_A-Za-z0-9$]*/"
    ,"number"                       : [
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
                                    ]
    ,"string:escaped-block"         : ["RE::/(['\"])/",   1]
    ,"regex:escaped-line-block"     : ["/",    "RE::#/[gimy]{0,4}#"]
    ,"atom"                         : {"autocomplete":true,"meta":"JavaScript ATOM","tokens":[
                                    "this",
                                    "true", "false", 
                                    "null", "undefined", 
                                    "NaN", "Infinity"
                                    ]}
    ,"keyword"                      : {"autocomplete":true,"meta":"JavaScript KEYWORD","tokens":[ 
                                    "if", "while", "with", "else", "do", "try", "finally",
                                    "return", "break", "continue", "new", "delete", "throw",
                                    "var", "const", "let", "function", "catch",
                                    "for", "switch", "case", "default",
                                    "in", "typeof", "instanceof"
                                    ]}
    ,"builtin"                      : {"autocomplete":true,"meta":"JavaScript Builtin","tokens":[ 
                                    "Object", "Function", "Array", "String", "Date", "Number", "RegExp", "Exception",
                                    "setTimeout", "setInterval", "alert", "console", "window", "prototype", "constructor"
                                    ]}
    ,"builtin_property"             : "RE::/(prototype|constructor)\\b/"
    ,"ctx:action"                   : {"context":true}
    ,"\\ctx:action"                 : {"context":false}
    ,"_match:action"                : {"push":"$0"}
    ,"}_match:action"               : {"pop":"{","msg":"Bracket \"$0\" does not match"}
    ,")_match:action"               : {"pop":"(","msg":"Bracket \"$0\" does not match"}
    ,"]_match:action"               : {"pop":"[","msg":"Bracket \"$0\" does not match"}
    ,"unique_in_scope:action"       : {"unique":["prop","$1"],"in-context":true,"msg":"Duplicate object property \"$0\""}
    
},
    
// Syntax model (optional)
"Syntax"                            : {
     
     "literal_property1"            : "string | /0|[1-9][0-9]*/ | identifier"
    // back-reference, should be handled
    ,"literal_property"             : "literal_property1"
    ,"literal_value"                : "atom | string | regex | number | identifier | literal_array | literal_object"
    // here, modifier should apply to all of "literal_property1", via back-reference chain
    ,"literal_property_value"       : "(builtin_property.builtin | literal_property.property) unique_in_scope ':' literal_value"
    // grammar recursion here
    ,"literal_object"               : "'{' ctx _match (literal_property_value (',' literal_property_value)*)? '}' '}_match' \\ctx"
    // grammar recursion here
    ,"literal_array"                : "'[' _match (literal_value (',' literal_value)*)? ']' ']_match'"
    ,"brackets_matched"             : "'{' _match | '}' '}_match' | '(' _match | ')' ')_match' | '[' _match | ']' ']_match'"
    ,"js"                           : "comment | number | string | regex | keyword | operator | atom | literal_object | literal_array | brackets_matched"
    
},

// what to parse and in what order
"Parser"                            : [ ["js"] ]

};
