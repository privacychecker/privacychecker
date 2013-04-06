(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    ns.FacebookStatus = Backbone.Model.extend( {

        defaults: {
            message: undefined,
            id:      undefined,
            privacy: undefined,
            place:   undefined
        },

        /**
         * Create a new FacebookStatus
         *
         * @param status {{id: Number, message: String}}
         * @constructor
         */
        initialize:      function( status )
        {
            if ( !status.id || !status.message ) {
                console.error( "[FacebookStatus] Missing required data (id, message)", status.id, status.message );
                throw new pc.common.Exception( "Status missing required data: id or message" );
            }

            this.set( "id", status.id );
            this.set( "message", status.message );
            this.set( "place", status.place );
            this._getPrivacy();
        },

        /**
         * Transform list ids to ids of all list's members
         *
         * @param friends pc.model.FacebookUserCollection
         * @param friendlists pc.model.FacebookListCollection
         */
        validatePrivacy: function( friends, friendlists )
        {
            this.get( 'privacy' ).flattenLists( friends, friendlists );
        },

        _getPrivacy: function()
        {
            var privacy = new pc.common.PrivacyDefinition( {id: this.id} );
            this.set( "privacy", privacy );

            privacy.on( 'data', _.bind( function()
                {
                    this.trigger( 'privacy-done' );
                }, this ) ).on( 'error', _.bind( function()
                {
                    this.trigger( 'privacy-error' );
                }, this ) );

            privacy.load();
        }

    } );

})();