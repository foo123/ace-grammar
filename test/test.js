var AceGrammar = require("../build/acer_grammar.js");
var vm = require("vm"), fs = require("fs"), echo = console.log;

function require_js( path, context )
{
  context = context || {};
  var data = fs.readFileSync( path );
  vm.runInNewContext(data, context, path);
  return context;
}

var grammar = require_js('./grammars/json.js');

//echo( AceGrammar.VERSION );
//echo( grammar.xml_grammar );
echo( JSON.stringify(AceGrammar.pre_process( grammar.json_grammar ), null, 4) );


