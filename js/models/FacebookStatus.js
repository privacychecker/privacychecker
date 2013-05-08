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
             * @property {String} caption Message of the status
             */
            caption: undefined,
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
            place:   undefined,
            /**
             * @property {Number} Points received by rating
             */
            points: 0
        },

        /**
         * Create a new FacebookStatus
         *
         * @method
         * @constructor
         * @param { {id: Number, caption: String, [date]: Date, [place]: Object}} status
         */
        initialize: function( status )
        {
            if ( !status.id || !status.caption ) {
                console.error( "[FacebookStatus] Missing required data (id, caption)", status.id, status.caption );
                throw "E_MISSING_REQUIRED_DATA";
            }

            this.set( "id", status.id );
            this.set( "caption", status.caption );
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