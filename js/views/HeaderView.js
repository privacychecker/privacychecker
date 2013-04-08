(function()
{
    "use strict";

    var ns = namespace( "pc.view" );

    ns.HeaderView = Backbone.View.extend( {

        initialize: function()
        {
            console.log( "[HeaderView] Init: HeaderView" );

            pc.model.FacebookPlayer.getInstance().on( "profile:loaded", _.bind( this.fbPlayerProfileLoadedCb, this ) );
        },

        render: function()
        {
            $( pc.view.HeaderView.LANGUAGE_CHANGE_SELECTOR ).click( _.bind( this.changeLanguageCb, this ) );
            return this;
        },

        fbPlayerProfileLoadedCb: function()
        {
            console.log( "[HeaderView] fbPlayerProfileLoadedCb - updating view" );

            var player = pc.model.FacebookPlayer.getInstance();
            var container = $( document ).find( pc.view.HeaderView.PLAYER_INFO_SELECTOR );

            var name = player.get( "name" );
            //var image = pc.view.HeaderView.PLAYER_IMAGE_SRC( {uid: player.get( "id" )} );

            var inject = $( '<span>', {
                "html": i18n.t( pc.view.HeaderView.LANG_LANGUAGE_GREETING, {name: name} )
            } );

            var logoutBtn = $( '<button>' ).addClass( 'btn btn-mini' ).click(function() {
                console.log("[HeaderView] Logout clicked");
                player.logout();
            });
            var logoutTxt = $( '<i>', {
                "html":        "&#128275;",
                "data-toggle": "tooltip",
                "title":       i18n.t( pc.view.HeaderView.LANG_LANGUAGE_LOGOUT )
            } ).tooltip( {
                    "placement": "bottom",
                    "html":      true
                } );
            logoutBtn.append( logoutTxt );

            container.fadeOut( 'fast', function()
            {
                container.remove( 'span' ).append( inject ).append( logoutBtn ).fadeIn( 'fast' );
            } );
        },

        changeLanguageCb: function()
        {
            return !window.confirm( i18n.t( pc.view.HeaderView.LANG_LANGUAGE_CONFIRM ) );
        }

    }, {

        PLAYER_INFO_SELECTOR: ".player",
        PLAYER_IMAGE_SRC:     _.template( "https://graph.facebook.com/<%= uid %>/picture" ),

        LANGUAGE_CHANGE_SELECTOR: '.language-menu li > a',

        LANG_LANGUAGE_CONFIRM:  "app.header.language_confirm",
        LANG_LANGUAGE_GREETING: "app.header.hi",
        LANG_LANGUAGE_LOGOUT:   "app.header.logout"

    } );

})();