ace-grammar
===========

__Transform a JSON grammar into an ACE syntax-highlight parser__



A simple and light-weight ( ~ 15kB minified) [ACE](https://github.com/ajaxorg/ace) add-on

to generate syntax-highlight parsers (ace modes) from a grammar specification in JSON format.


See also:  [codemirror-grammar](https://github.com/foo123/codemirror-grammar)


__This is work in progress__

###Contents

* [Live Example](http://foo123.github.io/examples/ace-grammar)
* [Todo](#todo)
* [Features](#features)
* [How To use](#examples)
* [API Reference](/api-reference.md)
* [Other Examples](#examples)

[![Build your own syntax-highlight mode on the fly](/test/screenshot.png)](http://foo123.github.io/examples/ace-grammar)


###Todo

Indentation, Behaviours, etc.. are ACE defaults, looking for ways to add more elaborate indentation rules to the grammar specification. (maybe add "actions" to the grammar syntax part ?? )



###Features

* A grammar can extend another grammar (so arbitrary variations and dialects can be parsed more easily)
* Grammar includes: Style Model, Lex Model and Syntax Model (optional), plus a couple of settings (see examples)
* Generated syntax-highlight parsers are optimized for speed
* Can generate a syntax-highlight parser from a grammar interactively and on-the-fly ( see example, http://foo123.github.io/examples/ace-grammar )


###Examples:

See working examples under [/test](/test) folder.

![css-grammar](/test/grammar-css.png)

![xml-grammar](/test/grammar-xml.png)

![python-grammar](/test/grammar-python.png)

![php-grammar](/test/grammar-php.png)

