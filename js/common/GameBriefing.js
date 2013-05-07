(function()
{
    "use strict";

    var ns = namespace( "pc.common" );

    ns.GameBriefing = Backbone.Model.extend( {

        /**
         * Create a new briefing instance
         *
         * @method initialize
         * @constructor
         */
        initialize: function()
        {
            this.$el = $( pc.common.GameBriefing.BRIEFING_CONTAINER_ID );

            if ( this.$el === undefined ) {
                throw "E_EL_IS_UNDEFINED";
            }

            this._create();

            console.debug( "[GameBriefing] Created briefing instance in el", this.$el );
        },

        /**
         * Set the briefing text
         *
         * @method make
         * @param {string} text The text to show in the briefing (html allowed)
         */
        make: function( text )
        {
            this.text.html( text );
        },

        /**
         * Show the briefing overlay
         *
         * @method show
         */
        show: function()
        {
            this.$el.children().first();
            this.$el.fadeIn();
            this.trigger( 'shown' );
        },

        /**
         * Hide the briefing overlay
         *
         * @method hide
         */
        hide: function()
        {
            this.$el.fadeOut();
            this.trigger( 'hidden' );
        },

        /**
         * Create the briefing overlay in $el
         *
         * @method _create
         * @private
         */
        _create: function()
        {
            var container = $( '<div>' ).addClass( 'briefing-container' );

            var closeBtn = $( '<button>', {
                html: $.t(pc.common.GameBriefing.LANG_CLOSE_BTN)
            } ).addClass( 'btn btn-primary' ).click( _.bind( this.hide, this ) );
            var textEl = $( '<p>' );

            container.append( textEl );
            container.append( closeBtn );

            this.$el.empty().append( container );

            this.text = textEl;
        }

    }, {
        BRIEFING_CONTAINER_ID: "div#briefing",

        LANG_CLOSE_BTN: "app.briefing.close",

        /**
         * Get a singleton instance of GameBriefing.
         *
         * @method getInstance
         * @returns {pc.model.GameBriefing} A singleton instance
         * @static
         */
        getInstance: function()
        {
            if ( this.__instance === undefined ) {
                this.__instance = new pc.common.GameBriefing();
            }
            return this.__instance;
        }

    } );

})();