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
            this.textEl.html( text );
        },

        /**
         * Set the briefing headline
         *
         * @method headline
         * @param {string} text The text to show in the headline (html allowed)
         */
        headline: function( text )
        {
            this.headlineEl.html( text );
        },

        /**
         * Set the cbLink for the close btn
         *
         * @param id The cbLink ID
         */
        cbLink: function( id )
        {
            this.closeBtn.attr( 'href', '#/briefing/' + id );
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
            return true;
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
            return true;
        },

        /**
         * Get the text container
         *
         * @returns {jQuery} The jQuery Object with the text
         */
        getTextContainer: function()
        {
            return this.text;
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

            var headline = $( '<h2>' );
            var closeBtn = $( '<a>', {
                href: "#",
                html: $.t( pc.common.GameBriefing.LANG_CLOSE_BTN )
            } ).addClass( 'btn btn-primary' ).click( _.bind( this.hide, this ) );
            var textEl = $( '<p>' );

            container.append( headline );
            container.append( textEl );
            container.append( closeBtn );

            this.$el.empty().append( container );

            this.headlineEl = headline;
            this.textEl = textEl;
            this.closeBtn = closeBtn;
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