// a finQL grammar in simple JSON format
var finql_grammar = {
        
// prefix ID for regular expressions used in the grammar
"RegExpID"                          : "RE::",
    
// Style model
"Style"                             : {
    
     "comment"                      : "comment"
    ,"keyword"                      : "keyword"
    ,"units"                        : "constant.language"
    ,"timeUnits"                    : "constant.language"
    ,"price"                        : "constant.support"
    ,"timeInterval"                 : "constant.support"
    ,"operation"                    : "support"
    ,"moneyManagement"              : "support"
    ,"symbolQualifier"              : "string"
    ,"number"                       : "constant.numeric"
    ,"string"                       : "string"
    ,"operator"                     : "operator"
    ,"binaryOperator"               : "meta"
    ,"unaryOperator"                : "meta"
    ,"symbol"                       : "variable"
    ,"field"                        : "variable.parameter"
    ,"indicator"                    : "variable.parameter"
    
},

// Lexical model
"Lex"                               : {
    
     "comment"                      : {"type":"comment","interleave":true,"tokens":[
                                    // line comment
                                    // start, end delims  (null matches end-of-line)
                                    [  "#",  null ]
                                    ]}
    
    ,"number"                       : "RE::/\\d+(\\.\\d+)?/"
    
    ,"string"                       : {"type":"escaped-block","escape":"\\","tokens":
                                    // start, end of string (can be the matched regex group ie. 1 )
                                    [ "RE::/(['\"])/",   1 ]
                                    }
    
    ,"reserved"                     : ["above","below","crosses","crosses above","crosses below","buy","sell","buy and inverse sell","sell and inverse buy","pyramid","rolling","inverse","increasing","increasing by","decreasing","decreasing by","by","in","stock","contract","by contract","continuous","basket","until","horizon","hor","objective","obj","stop","target","trailing","and","as","like","self","similar"]
    
    ,"op1"                         : {"tokens":"RE::/(increasing|decreasing)\\b\\s+by\\b/",
                                        "autocomplete":["increasing by","decreasing by"]}
    
    ,"op2"                         : {"tokens":"RE::/(above|below|(crosses(\\b\\s+(above|below))?))\\b/",
                                        "autocomplete":["above","below","crosses","crosses above","crosses below"]}
    
    ,"operation"                    : {"tokens":"RE::/((buy(\\b\\s+and\\b\\s+inverse\\b\\s+sell)?)|(sell(\\b\\s+and\\b\\s+inverse\\b\\s+buy)?))\\b/",
                                        "autocomplete":["buy","sell","buy and inverse sell","sell and inverse buy"]}
    
    ,"pyramid"                      : {"tokens":["pyramid"],"autocomplete":true}
    
    ,"daily"                        : {"tokens":["daily"],"autocomplete":true}
    
    ,"minutes"                      : {"tokens":["minutes","min"],"autocomplete":true}
    
    ,"and"                          : {"tokens":["and"],"autocomplete":true}
    
    ,"in"                           : {"tokens":["in"],"autocomplete":true}
    
    ,"until"                        : {"tokens":["until"],"autocomplete":true}
    
    ,"trailing"                     : {"tokens":["trailing"],"autocomplete":true}
    
    ,"stop"                         : {"tokens":["stop"],"autocomplete":true}
    
    ,"objective"                    : {"tokens":["objective","obj"],"autocomplete":true}
    
    ,"horizon"                      : {"tokens":["horizon","hor"],"autocomplete":true}
    
    ,"symbol"                       : {"tokens":"RE::/[a-zA-Z][a-zA-Z0-9]+/","except":"reserved"}
    
    ,"symbolQualifier"              : {"tokens":"RE::/(continuous|basket|stock|(by\\b\\s+contract))\\b/",
                                        "autocomplete":["continuous","basket","stock","by contract"]}
                                        
    ,"field"                        : {"tokens":"RE::/[a-zA-Z]+/","except":"reserved"}
    
    ,"indicator"                    : {"tokens":"RE::/[a-zA-Z]+/","except":"reserved"}
    
    ,"units"                        : {"tokens":["dollars","points","ticks","percent"],"autocomplete":true}
    
    ,"timeUnits"                    : {"tokens":["years","months","weeks","days","minutes","seconds","ms"],"autocomplete":true}
    
    ,"operator"                     : {"tokens":[
                                    "+", "-", 
                                    "*", "/", 
                                    ">", "<", "<=", ">=", "!=", "<>",
                                    "="
                                    ]}

},

// Syntax model (optional)
"Syntax"                            : {
    
     "unaryCl"                      : "op1.unaryOperator number units in.unaryOperator number timeUnits"
    
    ,"binaryCl"                     : "op2.binaryOperator"
    
    ,"generalIndicatorForm"         : "indicator number* | field"
    
    ,"conditional"                  : "unaryCl | binaryCl generalIndicatorForm"
    
    ,"stopCl"                       : "trailing?.moneyManagement stop.moneyManagement number+ units"
    
    ,"objectiveCl"                  : "objective.keyword number+ units"
    
    ,"horizonCl"                    : "horizon.keyword number timeUnits"
    
    ,"limit"                        : "until.keyword (conditional stopCl? objectiveCl? horizonCl? | stopCl objectiveCl? horizonCl? | objectiveCl horizonCl? | horizonCl)"
    
    //,"condition"                    : "conditional | generalIndicatorForm conditional"
    
    ,"conditions"                   : "conditional (and.keyword conditional)*"
    
    ,"buysell"                      : "operation (pyramid.operation number)?"
    
    ,"timeframe"                    : "daily.timeInterval | number minutes.timeInterval"
    
    ,"market"                       : "symbol symbolQualifier"
    
    ,"FinQL"                        : "comment | buysell? timeframe? market conditions? limit?"

},

// what to parse and in what order
"Parser"                            : [ ["FinQL"] ]

};
