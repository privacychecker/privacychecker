(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    /**
     * A Facebook status collection.
     *
     * @namespace pc.model
     * @class FacebookStatusCollection
     * @extends Backbone.Collection
     */
    ns.FacebookStatusCollection = Backbone.Collection.extend( {
        model: pc.model.FacebookStatus
    } );

})();