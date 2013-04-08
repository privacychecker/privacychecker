(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    /**
     * A facebook status
     *
     * @namespace pc.model
     * @class FacebookStatus
     * @extends Backbone.Model
     */
    ns.FacebookStatus = Backbone.Model.extend( {

        defaults: {
            /**
             * @property {Number} id id of the status
             */
            id:      undefined,
            /**
             * @property {String} message Message of the status
             */
            message: undefined,
            /**
             * @property {pc.common.PrivacyDefinition} privacy Privacy definition of the status
             */
            privacy: undefined,
            /**
             * @property {Date} date Date of the status
             */
            date: undefined,
            /**
             * @property {*} place A location attached to the status
             */
            place:   undefined
        },

        /**
         * Create a new FacebookStatus
         *
         * @method
         * @constructor
         * @param { {id: Number, message: String, [date]: Date, [place]: Object}} status
         */
        initialize: function( status )
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
         * @method validatePrivacy
         * @param {pc.model.FacebookUserCollection} friends
         * @param {pc.model.FacebookListCollection} friendlists
         */
        validatePrivacy: function( friends, friendlists )
        {
            this.get( 'privacy' ).flattenLists( friends, friendlists );
        },

        /**
         * Add PrivacyDefinition for class
         *
         * @method _getPrivacy
         * @private
         */
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