(function()
{
    "use strict";

    var ns = namespace( "pc.common" );

    ns.Points = Backbone.Model.extend( {

        defaults: {
            start:         0,
            remaining:     0,
            losePerSecond: 100,
            duration:      undefined
        },

        initialize: function( p )
        {
            if ( !p.el ) {
                console.error( "[Points] No element to attach to" );
                throw "E_NO_ATTACHABLE_ELEMENT";
            }

            this.$el = p.el;

            this.set( 'remaining', this.get( 'start' ) );

            this._changePointsCb = function()
            {
                this.set( 'remaining', this.get( 'remaining' ) - this.get( 'losePerSecond' ) );
                this.$el.html( this.get( 'remaining' ) );

                if ( this.get( 'remaining' ) <= 0 ) {
                    console.info( "[Points] Points are now negative, time's up" );
                    this.stop();
                    this.trigger( 'timeout' );
                }
            };

            console.info( "[Points] Points for element", this.$el, "start", this.get( 'start' ), "losePS",
                this.get( 'losePerSecond' ) );

        },

        start: function()
        {
            console.debug( "[Points] Starting points timer" );

            this.set( 'remaining', this.get( 'start' ) );
            this._start = $.now();
            this._intervalFn = window.setInterval( _.bind( this._changePointsCb, this ), 1000 );
        },

        stop: function()
        {
            console.debug( "[Points] Stopping points timer, remaining", this.get( 'remaining' ) );

            window.clearInterval( this._intervalFn );

            // time is in millis
            this.set( 'duration', ( $.now() - this._start ) / 1000 );
            this._start = undefined;
        },

        event: function( toRemove )
        {
            console.debug( "[Points] Special points removal" );

            this.set( 'remaining', this.get( 'remaining' ) - toRemove );
            this.$el.html( this.get( 'remaining' ) );
        }

    } );

})();