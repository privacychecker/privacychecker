(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    ns.FacebookPost = Backbone.Model.extend( {

        defaults: {
            message: undefined,
            id:      undefined,
            privacy: undefined
        }

    } );

})();