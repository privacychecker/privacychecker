(function()
{
    "use strict";

    var ns = namespace( "pc.common" );

    ns.ProgressBar = Backbone.Model.extend( {

        defaults: {
            max: 7,
            ptr: 0
        },

        initialize: function()
        {
            if ( $( pc.common.ProgressBar.DIVIDER_ID ) ) {
                var w = 1 / this.get( 'max' ) * 100;
                console.log( "[ProgressBar] Setting divider width to " + w + "% based on " + this.get( 'max' ) + " items" );
                $( pc.common.ProgressBar.DIVIDER_ID + ' li' ).css( 'width', w + '%' );
            }
        },

        to: function( ptr )
        {
            this.set( 'ptr', ptr );
            var w = this.get( 'ptr' ) / this.get( 'max' ) * 100;

            $( pc.common.ProgressBar.PROGRESS_BAR_ID ).transition( {
                "width": w + "%"
            } );

            if ( $( pc.common.ProgressBar.DIVIDER_ID ) ) {

                $( pc.common.ProgressBar.DIVIDER_ID ).children( 'li' ).each( function( index, el )
                {
                    var $el = $( el );
                    if ( index === undefined || index === ptr ) {
                        $el.addClass( 'active' );
                    }
                    else {
                        $el.removeClass( 'active' );
                    }
                } );

            }
        },

        subto: function( ptr, max )
        {
            var cw = this.get( 'ptr' ) / this.get( 'max' ) * 100;
            console.log( "SUB1", cw, this.get( 'ptr' ), this.get( 'max' ) );
            var w = cw + (ptr / (max * this.get( 'max' )) * 100);
            console.log( "SUB2", ptr, max );

            $( pc.common.ProgressBar.PROGRESS_BAR_ID ).transition( {
                "width": w + "%"
            } );
        }

    }, {

        DIVIDER_ID:      '#divider ul',
        PROGRESS_BAR_ID: '#progressbar',
        INSTANCE:        undefined,

        getInstance: function()
        {
            if ( pc.common.ProgressBar.INSTANCE === undefined ) {
                pc.common.ProgressBar.INSTANCE = new pc.common.ProgressBar();
            }

            return pc.common.ProgressBar.INSTANCE;
        }

    } );

})();