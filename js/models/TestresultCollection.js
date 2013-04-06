(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    ns.TestresultCollection = Backbone.Collection.extend( {
        model: pc.model.TestResult
    } );

})();