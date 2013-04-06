(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    ns.FacebookList = Backbone.Model.extend( {

        defaults: {
            name:    undefined,
            id:      undefined,
            type:    undefined,
            members: undefined
        }

    } );

})();