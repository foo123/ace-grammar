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
    ,"field"                        : "string.regexp"
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
                                        
    ,"field"                        : {"tokens":["open","high","low","close","volume","oi","gap","range"],"except":"reserved","autocomplete":true}
    
    ,"indicator"                    : {"tokens":["dema","ema","kama","linreg","mid","ma","t3","tsf","wma","maxindex","minindex","lrslope","mom","ppo","roc","trix","rsi","std","apo","macd","adx","aroonosc","atr","natr","willr","midprice","sfk","sfd","ssd","ssk","ultosc","adosc","mfi","nr","fib","wa","moa","ya"],"except":"reserved","autocomplete":true}
    
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
    
    // use positive lookahead feature here to resolve an ambiguity
    //,"generalIndicatorForm"         : "/[a-z]+\\s+\\d/i& indicator number* | field"
    ,"generalIndicatorForm"         : "indicator number* | field"
    
    ,"stopCl"                       : "trailing?.moneyManagement stop.moneyManagement number+ units"
    
    ,"objectiveCl"                  : "objective.keyword number+ units"
    
    ,"horizonCl"                    : "horizon.keyword number timeUnits"
    
    ,"limit"                        : "until.keyword (condition stopCl? objectiveCl? horizonCl? | stopCl objectiveCl? horizonCl? | objectiveCl horizonCl? | horizonCl)"
    
    ,"condition"                    : "generalIndicatorForm? (unaryCl | binaryCl generalIndicatorForm)"
    
    ,"conditions"                   : "condition (and.keyword condition)*"
    
    ,"buysell"                      : "operation (pyramid.operation number)?"
    
    ,"timeframe"                    : "daily.timeInterval | number minutes.timeInterval"
    
    ,"market"                       : "symbol symbolQualifier"
    
    ,"FinQL"                        : "comment | buysell? timeframe? market conditions? limit?"

},

// what to parse and in what order
"Parser"                            : [ ["FinQL"] ]

};
