/**
*
*   AceGrammar
*   @version: @@VERSION@@
*   Transform a grammar specification in JSON format,
*   into an ACE syntax-highlight parser mode
*
*   https://github.com/foo123/ace-grammar
*
**/
!function (root, moduleName, moduleDefinition) {

    //
    // export the module
    
    // node, CommonJS, etc..
    if ( 'object' == typeof(module) && module.exports ) module.exports = moduleDefinition();
    
    // AMD, etc..
    else if ( 'function' == typeof(define) && define.amd ) define( moduleDefinition );
    
    // browser, etc..
    else root[ moduleName ] = moduleDefinition();


}(this, 'AceGrammar', function( undef ) {
    
    var VERSION = "@@VERSION@@";
