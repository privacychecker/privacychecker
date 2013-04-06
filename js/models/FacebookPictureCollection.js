(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    /**
     * A Facebook picture collection.
     *
     * @namespace pc.model
     * @class FacebookPictureCollection
     * @extends Backbone.Collection
     */
    ns.FacebookPictureCollection = Backbone.Collection.extend( {

        model: pc.model.FacebookPicture,

        /**
         * Get a picture with a specific id
         *
         * @param {Number} pid Id of the picture
         * @returns {pc.model.FacebookPicture} The picture with the id or null
         */
        getByPid: function( pid )
        {
            return this.where( {id: pid} );
        }

    } );

})();
