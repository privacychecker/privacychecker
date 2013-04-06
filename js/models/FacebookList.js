(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    /**
     * A Facebook list.
     *
     * @namespace pc.model
     * @class FacebookList
     * @extends Backbone.Model
     */
    ns.FacebookList = Backbone.Model.extend( {

        defaults: {
            name:    undefined,
            id:      undefined,
            type:    undefined,
            members: undefined
        }

    } );

})();