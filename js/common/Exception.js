(function()
{
    "use strict";

    var ns = namespace( "pc.common" );

    /**
     * A generic exception.
     *
     * @namespace pc.common
     * @class Exception
     * @extends Backbone.Model
     */
    ns.Exception = Backbone.Model.extend( {

        defaults: {
            message: "unknown error"
        },

        /**
         * Create a new exception
         *
         * @method
         * @constructor
         * @param { {message: String}} p The error message
         */
        constructor: function( p )
        {
            if ( p.message !== undefined ) {
                this.set( "message", p.message );
            }
        }

    } );

})();
