(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    /**
     * A Facebook user collection.
     *
     * @namespace pc.model
     * @class FacebookUserCollection
     * @extends Backbone.Collection
     */
    ns.FacebookUserCollection = Backbone.Collection.extend( {

        model: pc.model.FacebookUser,

        /**
         * Get a user with a specific id
         *
         * @param {Number} uid Id of the user
         * @returns {pc.model.FacebookUser} The user with the id or null
         */
        getByUid: function( uid )
        {
            // id is unique, so only one user will be returned
            return this.where( {id: uid} )[0];
        }

    } );

})();