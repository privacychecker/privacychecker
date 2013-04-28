(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    /**
     * A facebook picture
     *
     * @namespace pc.model
     * @class FacebookPicture
     * @extends Backbone.Model
     */
    ns.FacebookPicture = Backbone.Model.extend( {

        defaults: {
            /**
             * @property {Number} id id of the picture
             */
            id:      undefined,
            /**
             * @property {String} [caption] Name of the picture
             */
            caption:    undefined,
            /**
             * @property {String} source Url of the picture
             */
            source:  undefined,
            /**
             * @property {Number} height Height of the picture in px
             */
            height:  undefined,
            /**
             * @property {Number} width Width of the picture in px
             */
            width:   undefined,
            /**
             * @property {pc.common.PrivacyDefinition} privacy Privacy definition of the picture
             */
            privacy: undefined,
            /**
             * @property {Number} Points received by rating
             */
             points: 0
        },

        /**
         * Create a new FacebookPicture
         *
         * @method
         * @constructor
         * @param { {id: Number, source: String, [name]:String}} picture
         */
        initialize:      function( picture )
        {
            if ( !picture.id || !picture.source ) {
                console.error( "[FacebookPicture] Missing required data (id, source)", picture.id, picture.source );
                throw new pc.common.Exception( "[FacebookPicture] Missing required data: id or source" );
            }

            this.set( "id", picture.id );
            this.set( "caption", picture.name );
            this.set( "source", picture.source );
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