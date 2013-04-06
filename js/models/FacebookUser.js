(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    ns.FacebookUser = Backbone.Model.extend( {

        defaults: {
            name: "John Doe",
            id:   undefined
        },

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