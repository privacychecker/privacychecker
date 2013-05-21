(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    /**
     * A Facebook list collection.
     *
     * @namespace pc.model
     * @class FacebookListCollection
     * @extends Backbone.Collection
     */
    ns.FacebookListCollection = Backbone.Collection.extend( {
        model: pc.model.FacebookList
    } );

})();