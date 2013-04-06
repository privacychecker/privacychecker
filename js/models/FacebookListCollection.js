(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    ns.FacebookListCollection = Backbone.Collection.extend( {
        model: pc.model.FacebookList
    } );

})();