(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    ns.FacebookPostCollection = Backbone.Collection.extend( {
        model: pc.model.FacebookPost
    } );

})();