

###AceGrammar Methods

    


__Method__: *extend*

```javascript
extendedgrammar = AceGrammar.extend(grammar, basegrammar1 [, basegrammar2, ..]);
```

Extend a grammar with basegrammar1, basegrammar2, etc..

This way arbitrary dialects and variations can be handled more easily
        


__Method__: *parse*

```javascript
parsedgrammar = AceGrammar.parse(grammar);
```

This is used internally by the AceGrammar Class
In order to parse a JSON grammar to a form suitable to be used by the syntax-highlight parser.
However user can use this method to cache a parsedgrammar to be used later.
Already parsed grammars are NOT re-parsed when passed through the parse method again
        


__Method__: *getMode*

```javascript
mode = AceGrammar.getMode(grammar, [, DEFAULT]);
```

This is the main method which transforms a JSON grammar into an ACE syntax-highlight parser.
DEFAULT is the default return value ("invisible" by default) for things that are skipped or not styled
In general there is no need to set this value, unlees you need to return something else
        