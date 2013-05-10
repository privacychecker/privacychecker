(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    /**
     * A Tooltip collection
     *
     * @namespace pc.model
     * @class TooltipCollection
     * @extends Backbone.Collection
     */
    ns.TooltipCollection = Backbone.Collection.extend( {
        model: pc.model.Tooltip,

        pin: function( $el, tooltipId )
        {
            if ( !($el instanceof jQuery) ) {
                throw "E_EL_IS_NO_JQUERY_OBJECT";
            }

            if ( _.isUndefined( tooltipId ) ) {
                this._pintAtKeyword( $el );
            }
            else {
                this._pinAtElement( $el, tooltipId );
            }
        },

        _pinAtElement: function( $el, tooltipId )
        {
            // search tooltip and create container
            var ns = pc.model.TooltipCollection,
                tooltip = this.findWhere( {key: tooltipId} );

            // exists tooltip?
            if ( _.isUndefined( tooltip ) ) throw "E_UNKNOWN_TOOLTIP_ID";

            // ok tooltip exists create container
            var tooltipShort = tooltip.get( 'short' ),
                inner = $( "<div>" ).addClass( 'tooltip-container' ).append( tooltipShort );

            if ( tooltip.get( 'long' ) !== null ) {
                var moreButton = $( "<a>", {
                    html: $.t( ns.LANG_TOOLTIP_MORE ),
                    href: "#/tooltip/" + tooltipId
                } ).addClass( 'btn btn-primary btn-small' );

                inner.append( moreButton );
            }

            // add a simple popover
            $el.popover( {
                html:      true,
                content:   inner,
                trigger:   'manual',
                delay:     100,
                placement: 'bottom'
            } );

            $el.mouseenter( _.bind( function()
            {
                if ( $el.data( '__popover' ) ) return;

                var closeCb = function()
                {
                    $( document.body ).unbind( 'click', closeCb );
                    $el.next( '.popover' ).first().unbind( 'mouseleave', closeCb );

                    $el.data( '__popover', false );
                    $el.popover( 'hide' );
                };

                $( document.body ).bind( 'click', closeCb );
                $el.data( '__popover', true );
                $el.popover( 'show' );
                $el.next( '.popover' ).first().bind( 'mouseleave', closeCb );
            }, this ) );

        },

        _pintAtKeyword: function( $el )
        {
            $el.find( "span[data-tooltip-key]" ).each( _.bind( function( i, key )
            {
                var $key = $( key ),
                    tooltipId = $key.data( 'tooltip-key' );

                console.debug( "[Tooltip] Found tooltip at ", $key, ": ", tooltipId );
                this._pinAtElement( $key, tooltipId );
            }, this ) );
        }

    }, {
        LANG_TOOLTIP_MORE: "app.tooltip.more",

        /**
         * Get a singleton instance of tooltipcollection.
         *
         * @method getInstance
         * @returns {pc.model.TooltipCollection} A singleton instance
         * @static
         */
        getInstance: function()
        {
            if ( this.__instance === undefined ) {
                this.__instance = new pc.model.TooltipCollection();
            }
            return this.__instance;
        }
    } );

})();