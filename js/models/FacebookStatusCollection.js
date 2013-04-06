(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    ns.FacebookStatusCollection = Backbone.Collection.extend( {
        model: pc.model.FacebookStatus
    } );

})();