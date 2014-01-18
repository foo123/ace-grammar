/**
*
*   AceGrammar
*   @version: @@VERSION@@
*
*   Transform a grammar specification in JSON format, into an ACE syntax-highlight parser mode
*   https://github.com/foo123/ace-grammar
*
**/
    
    //
    //  Ace Grammar main class
    /**[DOC_MARKDOWN]
    *
    * ###AceGrammar Methods
    *
    * __For node with dependencies:__
    *
    * ```javascript
    * AceGrammar = require('build/ace_grammar.js').AceGrammar;
    * // or
    * AceGrammar = require('build/ace_grammar.bundle.js').AceGrammar;
    * ```
    *
    * __For browser with dependencies:__
    *
    * ```html
    * <script src="../build/ace_grammar.bundle.js"></script>
    * <!-- or -->
    * <script src="../build/classy.js"></script>
    * <script src="../build/regexanalyzer.js"></script>
    * <script src="../build/ace_grammar.js"></script>
    * <script> // AceGrammar.getMode(..) , etc.. </script>
    * ```
    *
    [/DOC_MARKDOWN]**/
    DEFAULTSTYLE = "text";
    DEFAULTERROR = "invalid";
    var AceGrammar = {
        
        VERSION : "@@VERSION@@",
        
        // extend a grammar using another base grammar
        /**[DOC_MARKDOWN]
        * __Method__: *extend*
        *
        * ```javascript
        * extendedgrammar = AceGrammar.extend(grammar, basegrammar1 [, basegrammar2, ..]);
        * ```
        *
        * Extend a grammar with basegrammar1, basegrammar2, etc..
        *
        * This way arbitrary dialects and variations can be handled more easily
        [/DOC_MARKDOWN]**/
        extend : extend,
        
        // parse a grammar
        /**[DOC_MARKDOWN]
        * __Method__: *parse*
        *
        * ```javascript
        * parsedgrammar = AceGrammar.parse(grammar);
        * ```
        *
        * This is used internally by the AceGrammar Class
        * In order to parse a JSON grammar to a form suitable to be used by the syntax-highlight parser.
        * However user can use this method to cache a parsedgrammar to be used later.
        * Already parsed grammars are NOT re-parsed when passed through the parse method again
        [/DOC_MARKDOWN]**/
        parse : parseGrammar,
        
        // get an ACE-compatible syntax-highlight mode from a grammar
        /**[DOC_MARKDOWN]
        * __Method__: *getMode*
        *
        * ```javascript
        * mode = AceGrammar.getMode(grammar, [, DEFAULT]);
        * ```
        *
        * This is the main method which transforms a JSON grammar into an ACE syntax-highlight parser.
        * DEFAULT is the default return value ("text" by default) for things that are skipped or not styled
        * In general there is no need to set this value, unless you need to return something else
        [/DOC_MARKDOWN]**/
        getMode : getMode
    };
