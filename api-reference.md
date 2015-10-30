

###AceGrammar Methods

__For node:__

```javascript
var AceGrammar = require('build/ace_grammar.js');
```

__For browser:__

```html
<script src="build/ace_grammar.js"></script>
```




__Method__: `clone`

```javascript
cloned_grammar = AceGrammar.clone( grammar [, deep=true] );
```

Clone (deep) a `grammar`

Utility to clone objects efficiently
    


__Method__: `extend`

```javascript
extended_grammar = AceGrammar.extend( grammar, basegrammar1 [, basegrammar2, ..] );
```

Extend a `grammar` with `basegrammar1`, `basegrammar2`, etc..

This way arbitrary `dialects` and `variations` can be handled more easily
    


__Method__: `pre_process`

```javascript
pre_processed_grammar = AceGrammar.pre_process( grammar );
```

This is used internally by the `AceGrammar` Class `parse` method
In order to pre-process a `JSON grammar` (in-place) to transform any shorthand configurations to full object configurations and provide defaults.
It also parses `PEG`/`BNF` (syntax) notations into full (syntax) configuration objects, so merging with other grammars can be easier if needed.
    


__Method__: `parse`

```javascript
parsed_grammar = AceGrammar.parse( grammar );
```

This is used internally by the `AceGrammar` Class
In order to parse a `JSON grammar` to a form suitable to be used by the syntax-highlight parser.
However user can use this method to cache a `parsedgrammar` to be used later.
Already parsed grammars are NOT re-parsed when passed through the parse method again
    


__Method__: `getMode`

```javascript
mode = AceGrammar.getMode( grammar, [, DEFAULT, ace] );
```

This is the main method which transforms a `JSON grammar` into an `ACE` syntax-highlight parser.
`DEFAULT` is the default return value (`"text"` by default) for things that are skipped or not styled
In general there is no need to set this value, unless you need to return something else
The `ace` reference can also be passed as parameter, for example,
if `ace` is not already available when the add-on is first loaded (e.g via an `async` callback)
    


__Parser Class__: `Parser`

```javascript
Parser = AceGrammar.Parser;
```

The Parser Class used to instantiate a highlight parser, is available.
The `getMode` method will instantiate this parser class, which can be overriden/extended if needed, as needed.
In general there is no need to override/extend the parser, unless you definately need to.
    