(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    /**
     * A Facebook user.
     *
     * @namespace pc.model
     * @class FacebookUser
     * @extends Backbone.Model
     */
    ns.FacebookUser = Backbone.Model.extend( {

        defaults: {
            name: "John Doe",
            id:   undefined
        },

        /**
         * Create a new facebook user.
         *
         * @method
         * @constructor
         * @param friend {{id: Number, name: String, type: String?}}
         */
        initialize: function( friend )
        {
            if ( !friend.id || !friend.name ) {
                throw new pc.model.Exception( "Invalid user (id or name missing)" );
            }

            if ( !friend.type ) {
                this.set( "type", pc.model.FacebookUser.Type.FRIEND );
            }

            this.set( "id", friend.id );
            this.set( "name", friend.name );
        }

    }, {
        Type: {
            FRIEND: 0, FOREIGNER: 1
        }
    } );

})();