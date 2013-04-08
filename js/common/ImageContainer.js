(function()
{
    "use strict";

    var ns = namespace( "pc.common" );

    /**
     * Container for images<br />
     * Helper to create a image container with the image itself and a caption
     *
     * @namespace pc.common
     * @class ImageContainer
     * @extends Backbone.Model
     */
    ns.ImageContainer = Backbone.Model.extend( {

        /**
         * Create a new ImageContainer
         *
         * @method
         * @constructor
         */
        initialize: function()
        {
            this.on( 'change', this._create, this );
            this.el = $( '<div>' );
        },

        /**
         * Get the element to include
         *
         * @method
         * @returns {jQuery} Returns the jquery element to include on a page
         */
        toHtml: function()
        {
            return this.el;
        },

        /**
         * Create the image container html
         *
         * @event
         * @private
         */
        _create: function()
        {

            this.el.empty();

            var imgContainer = $( '<img>', {
                "src": this.get( 'url' )
            } );

            var captionEl = $( '<p>', {
                "html": this.get( 'caption' ) ? this.get( 'caption' ) : ""
            } ).addClass( 'title' );

            this.el.addClass( 'image' ).append( captionEl ).append( imgContainer );

        }

    }, {

        /**
         * Create a new ImageContainer. Simply a wrapper function.
         *
         * @method
         * @static
         * @param {String} imgurl The url of the image
         * @param {String} [caption] The caption of the image
         * @returns {pc.common.ImageContainer} The ImageContainer instance
         */
        create: function( imgurl, caption )
        {

            var container = new pc.common.ImageContainer();
            container.set( 'url', imgurl );
            if ( caption ) container.set( 'caption', caption );

            return container;

        }

    } );

})();