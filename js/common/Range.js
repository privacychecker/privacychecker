(function()
{
    "use strict";

    var ns = namespace( "pc.common" );

    ns.Range = Backbone.Model.extend( {

        initialize: function( p )
        {
            if ( p.upper === undefined || p.lower === undefined ) {
                throw new Error( {message: "Range needs lower and upper value"} );
            }
            else if ( p.upper < p.lower ) {
                throw new Error( {message: "Upper needs to be higher than lower"} );
            }

            this.set( 'lower', p.lower );
            this.set( 'upper', p.upper );
        },

        inRange: function( num )
        {
            return (num >= this.get( 'lower' ) && num <= this.get( 'upper' ));
        }

    } );

})();