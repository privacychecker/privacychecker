(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    /**
     * A Tooltip.
     *
     * @namespace pc.model
     * @class Tooltip
     * @extends Backbone.Model
     */
    ns.Tooltip = Backbone.Model.extend( {

        defaults: {
            key:        undefined,
            short:      "no_short_text",
            long:       "no_long_text",
            "headline": "Tooltip"
        },

        initialize: function( p )
        {
            if ( _.isUndefined( p.key ) || _.isUndefined( p.long ) || _.isUndefined( p.short ) ) {
                throw "E_MISSING_PARAMETER";
            }

            console.debug( "[Tooltip] New tooltip ", p.id, p.short, "=>", p.long );
        }

    } );

})();