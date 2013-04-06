(function()
{
    "use strict";

    var ns = namespace( "pc.common" );

    ns.Exception = Backbone.Model.extend( {

        defaults: {
            message: "unknown error"
        },

        constructor: function( p )
        {
            if ( p.message !== undefined ) {
                this.set( "message", p.message );
            }
        }

    } );

})();
