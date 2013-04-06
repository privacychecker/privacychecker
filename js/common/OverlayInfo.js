(function()
{
    "use strict";

    var ns = namespace( "pc.common" );

    ns.OverlayInfo = Backbone.Model.extend( {

        defaults: {
            text:  "Text missing",
            click: function()
            {
            },

            autoDestroy: true,

            autoDismiss:     false,
            dismissInterval: 10
        },

        initialize: function()
        {
            console.log( '[OverlayInfo] Injecting to body' );

            this.container = $( '<div>' ).addClass( 'grayitizer' ).fadeOut( 'fast' );

            var alert = $( '<div>' ).addClass( 'alert' ).html( this.get( 'text' ) );
            alert.click( _.bind( function()
            {
                this.destroy();
                this.get( 'click' )();
            }, this ) );
            this.container.append( alert );

            $( 'body' ).append( this.container );
        },

        show: function()
        {
            this.container.fadeIn( 'fast' );
            this.container.children().center();
        },

        hide: function()
        {
            this.container.fadeOut( 'fast' );
        },

        destroy: function()
        {
            this.container.fadeOut( 'fast', _.bind( function()
            {
                this.container.remove();
            }, this ) );
        }

    } );

})();