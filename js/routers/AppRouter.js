(function()
{
    "use strict";

    var DEV = false;

    var ns = namespace( "pc.router" );

    ns.AppRouter = Backbone.Router.extend( {

        routes: {
            "briefing/:id": "briefingCb",
            "tooltip/:id":  "tooltipCb",
            "whynogame/":    "whynogameCb"
        },

        initialize: function()
        {
            console.log( "Init: Router" );
            if ( !this.headerView ) {
                this.headerView = new pc.view.HeaderView();
                this.headerView.render();
            }

            this._initializeTooltips();
            //$("header").html(this.headerView.el);
            $( pc.router.AppRouter.CONTROL_CONTAINER_ID ).unbind().hide();

            pc.common.ProgressBar.getInstance().set( 'max', pc.router.AppRouter.NUM_SLIDES );
            pc.common.ProgressBar.getInstance().to( 0 );

            $( pc.router.AppRouter.CHANGE_PLAYER_ID ).hide();

            this.homeView = new pc.view.HomeView();
            this.collectView = new pc.view.CollectView();
            this.selectView = new pc.view.SelectView();
            this.hangmanView = new pc.view.HangmanView();
            this.resultView = new pc.view.ResultView();

            this.tipsView = new pc.view.TipsView( {
                el: $( ".tips" ).first()
            } );
            this.tipsView.hide();

            this.player = pc.model.FacebookPlayer.getInstance();
            this.player.on( "profile:loaded", _.bind( this.profileLoadedCb, this ) );
            this.collectView.on( "collect:done", _.bind( this.selectEntitiesCb, this ) );
            this.selectView.on( "done", _.bind( this.hangmanStartCb, this ) );
            this.hangmanView.on( "done", _.bind( this.showResultsCb, this ) );
            this.resultView.on( "recommendations", _.bind( this.recommendationCb, this ) );

            this.homeView.render();
            $( "#container-home" ).html( this.homeView.el );

        },

        profileLoadedCb: function()
        {
            console.log( "[Controller] Facebook Player is ready, enabling collect view" );
            $( pc.router.AppRouter.CHANGE_PLAYER_ID ).fadeIn( 'fast' );
            if ( this.player.loggedin && !DEV ) {
                this.startCollectCb( true );
            }

            this.homeView.enableButton();
        },

        startCollectCb: function( autostart )
        {

            console.log( '[Controller] Starting to collect data' );
            $( pc.router.AppRouter.CAROUSEL_ID ).unbind();
            this.collectView.render();
            $( "#container-collect" ).html( this.collectView.el );

            pc.common.ProgressBar.getInstance().to( 1 );

            if ( autostart ) {
                console.log( "[Controller] Autostarting because player is logged in" );
                this.collectView.startCollectCb();
            }

            $( pc.router.AppRouter.CAROUSEL_ID ).carousel( 1 );

        },

        selectEntitiesCb: function()
        {
            this.collectView.off( 'collect:done' );
            console.log( '[Controller] Starting Setup: Select most sensible entities' );
            $( pc.router.AppRouter.CAROUSEL_ID ).unbind();
            this.selectView.render();
            $( "#container-select" ).html( this.selectView.el );

            $( pc.router.AppRouter.CAROUSEL_ID ).carousel( 2 );
            pc.common.ProgressBar.getInstance().to( 2 );

            this.selectView.on( "preload:done", _.bind( function()
            {
                this.selectView.start();
            }, this ) );

        },

        hangmanStartCb: function()
        {
            this.selectView.off( 'done' );

            console.log( '[Controller] Starting Game: Hangman' );
            $( pc.router.AppRouter.CAROUSEL_ID ).unbind();

            this.hangmanView.render();
            $( '#container-hangman' ).html( this.hangmanView.el );

            $( pc.router.AppRouter.CAROUSEL_ID ).carousel( 3 );
            pc.common.ProgressBar.getInstance().to( 3 );

        },

        showResultsCb: function()
        {
            console.log( '[Controller] Showing results' );
            $( pc.router.AppRouter.CAROUSEL_ID ).unbind();

            this.resultView.render();
            $( '#container-results' ).html( this.resultView.el );

            $( pc.router.AppRouter.CAROUSEL_ID ).carousel( 4 );
            pc.common.ProgressBar.getInstance().to( 4 );

        },

        recommendationCb: function()
        {
            console.log( '[Controller] Showing recommendations' );
            this.tipsView.renderRecommendation( this.resultView );
        },

        tooltipCb: function( tooltipId )
        {
            console.log( '[Controller] Showing tooltip with id', tooltipId );
            this.tipsView.renderTooltip( tooltipId );
        },

        briefingCb: function( briefingId )
        {
            console.log( '[Controller] Showing briefing with id', briefingId );
            this.tipsView.renderBriefing( briefingId );
        },

        whynogameCb: function()
        {
            console.log( '[Controller] Showing whynogamehelp' );
            this.tipsView.renderRecommendation( undefined, {
                defaults:  true,
                hide_past: true
            } );
        },

        _initializeTooltips: function()
        {
            var tooltipCollection = pc.model.TooltipCollection.getInstance(),
                Tooltip = pc.model.Tooltip;

            tooltipCollection.add( [
                new Tooltip( {
                    key:      "item",
                    headline: $.t( "app.tooltip.item.headline" ),
                    short:    $.t( "app.tooltip.item.short" ),
                    long:     $.t( "app.tooltip.item.long" )
                } ),
                new Tooltip( {
                    key:      "personal",
                    headline: $.t( "app.tooltip.personal.headline" ),
                    short:    $.t( "app.tooltip.personal.short" ),
                    long:     $.t( "app.tooltip.personal.long" )
                } ),
                new Tooltip( {
                    key:      "ranking",
                    headline: $.t( "app.tooltip.ranking.headline" ),
                    short:    $.t( "app.tooltip.ranking.short" ),
                    long:     $.t( "app.tooltip.ranking.long" )
                } ),
                new Tooltip( {
                    key:      "list",
                    headline: $.t( "app.tooltip.list.headline" ),
                    short:    $.t( "app.tooltip.list.short" ),
                    long:     $.t( "app.tooltip.list.long" )
                } ),
                new Tooltip( {
                    key:      "rated_item",
                    headline: $.t( "app.tooltip.rated_item.headline" ),
                    short:    $.t( "app.tooltip.rated_item.short" ),
                    long:     $.t( "app.tooltip.rated_item.long" )
                } ),
                new Tooltip( {
                    key:      "auto_list",
                    headline: $.t( "app.tooltip.auto_list.headline" ),
                    short:    $.t( "app.tooltip.auto_list.short" ),
                    long:     $.t( "app.tooltip.auto_list.long" )
                } ),
                new Tooltip( {
                    key:      "hangman_users",
                    headline: $.t( "app.tooltip.hangman_users.headline" ),
                    short:    $.t( "app.tooltip.hangman_users.short" ),
                    long:     $.t( "app.tooltip.hangman_users.long" )
                } ),
                new Tooltip( {
                    key:      "hangman_hearts",
                    headline: $.t( "app.tooltip.hangman_hearts.headline" ),
                    short:    $.t( "app.tooltip.hangman_hearts.short" ),
                    long:     $.t( "app.tooltip.hangman_hearts.long" )
                } ),
                new Tooltip( {
                    key:      "hangman_points",
                    headline: $.t( "app.tooltip.hangman_points.headline" ),
                    short:    $.t( "app.tooltip.hangman_points.short" ),
                    long:     $.t( "app.tooltip.hangman_points.long" )
                } )
            ] );
        }

    }, {

        CHANGE_PLAYER_ID: '#changeplayer',
        CAROUSEL_ID:      '#game-carousel',
        NUM_SLIDES:       4,

        CONTROL_CONTAINER_ID: '.carousel-control.right'

    } );

})();