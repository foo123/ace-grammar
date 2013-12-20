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
!function ( moduleFactory ) {

    //
    // export the module
    
    // node, CommonJS, etc..
    if ( 'object' == typeof( module ) && module.exports ) 
    {
        moduleFactory( module.exports );
    }
    
    // AMD, etc..
    else if ( 'function' == typeof( define ) && define.amd ) 
    {
        define( ['exports'], function( exports ) {
            moduleFactory( exports );
        });
    }
    
    // browser, etc..
    else 
    {
        moduleFactory( this );
    }


}.call( this, function( exports, undef ) {
    
    if ( exports.AceGrammar ) return;
    
    // dependencies on Classy and RegExAnalyzer
    var Class = exports.Classy.Class;
    var RegexAnalyzer = exports.RegExAnalyzer;
    
    var VERSION = "@@VERSION@@";
