(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    /**
     * A test resulst collection.
     *
     * @namespace pc.model
     * @class TestresultCollection
     * @extends Backbone.Collection
     */
    ns.TestresultCollection = Backbone.Collection.extend( {
        model: pc.model.TestResult
    } );

})();