(function()
{
    "use strict";

    var ns = namespace( "pc.view" );

    ns.HeaderView = Backbone.View.extend( {

        initialize: function()
        {
            console.log( "[HeaderView] Init: HeaderView" );
            this.nameInjected = false;

            pc.model.FacebookPlayer.getInstance().on( "profile:loaded", _.bind( this.fbPlayerProfileLoadedCb, this ) );
        },

        render: function()
        {
            $( pc.view.HeaderView.LANGUAGE_CHANGE_SELECTOR ).click( _.bind( this.changeLanguageCb, this ) );
            $( pc.view.HeaderView.FLAG_ID ).attr( "src", $.t( pc.view.HeaderView.LANG_CURRENT_FLAG ) );

            return this;
        },

        fbPlayerProfileLoadedCb: function()
        {
            console.log( "[HeaderView] fbPlayerProfileLoadedCb - updating view" );

            var player = pc.model.FacebookPlayer.getInstance();
            var container = $( document ).find( pc.view.HeaderView.PLAYER_INFO_SELECTOR );

            if ( player.loggedin && !this.nameInjected ) {
                var name = player.get( "name" );
                //var image = pc.view.HeaderView.PLAYER_IMAGE_SRC( {uid: player.get( "id" )} );

                var inject = $( '<span>', {
                    "html": i18n.t( pc.view.HeaderView.LANG_LANGUAGE_GREETING, {name: name} )
                } );

                var logoutBtn = $( '<button>' ).click(function()
                {
                    console.log( "[HeaderView] Logout clicked" );
                    player.on( "login:done", function()
                    {
                        if ( !player.loggedin ) {
                            console.debug( "[HeaderView] Logout done" );
                            location.reload();
                        }
                    } );
                    player.logout();
                } ).addClass( 'btn btn-mini' );
                var logoutTxt = $( '<e>', {
                    "html":        "&#59201;",
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
            }
            else if ( !player.loggedin ) {
                container.empty();
                this.nameInjected = false;
            }
        },

        changeLanguageCb: function()
        {
            return window.confirm( i18n.t( pc.view.HeaderView.LANG_LANGUAGE_CONFIRM ) );
        }

    }, {

        PLAYER_INFO_SELECTOR: ".player",
        PLAYER_IMAGE_SRC:     _.template( "https://graph.facebook.com/<%= uid %>/picture" ),

        LANGUAGE_CHANGE_SELECTOR: '.language-menu li > a',
        FLAG_ID:                  ".dropdown img.flag",

        LANG_LANGUAGE_CONFIRM:  "app.header.language_confirm",
        LANG_LANGUAGE_GREETING: "app.header.hi",
        LANG_LANGUAGE_LOGOUT:   "app.header.logout",
        LANG_CURRENT_FLAG:      "app.header.flag_id"

    } );

})();