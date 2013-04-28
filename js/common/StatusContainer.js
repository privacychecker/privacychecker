(function()
{
    "use strict";

    var ns = namespace( "pc.common" );

    /**
     * Container for statuses<br />
     * Helper to create a status container with the image itself
     *
     * @namespace pc.common
     * @class StatusContainer
     * @extends Backbone.Model
     */
    ns.StatusContainer = Backbone.Model.extend( {

        /**
         * Create a new StatusContainer
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

            var messageContainer = $( '<p>', {
                "html": this.get( 'caption' )
            } ).addClass( 'message' );

            var dateContainer = $( '<p>', {
                "html": _.isNull( this.get( 'date' ) ) ? this.get( 'date' ) : "long long ago"
            } ).addClass( 'date' );

            this.el.addClass( 'status' ).append( messageContainer ).append( dateContainer );

        }

    }, {

        /**
         * Create a new StatusContainer. Simply a wrapper function.
         *
         * @method
         * @static
         * @param {String} message The caption of the status
         * @param {String} date The date of the status
         * @param {String} [location] The location of the status
         * @returns {pc.common.StatusContainer} The StatusContainer instance
         */
        create: function( message, date, location )
        {

            var container = new pc.common.StatusContainer();
            container.set( 'caption', message );
            container.set( 'date', date );
            if ( location ) container.set( 'location', location );

            return container;

        }

    } );

})();