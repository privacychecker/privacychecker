(function()
{
    "use strict";

    var DEV = false;

    var ns = namespace( "pc.router" );

    ns.AppRouter = Backbone.Router.extend( {

        routes: {
            "*default": "home"
        },

        initialize: function()
        {
            console.log( "Init: Router" );
            if ( !this.headerView ) {
                this.headerView = new pc.view.HeaderView();
                this.headerView.render();
            }
            //$("header").html(this.headerView.el);
            $( pc.router.AppRouter.CONTROL_CONTAINER_ID ).unbind().hide();

            pc.common.ProgressBar.getInstance().set( 'max', pc.router.AppRouter.NUM_SLIDES );
            pc.common.ProgressBar.getInstance().to( 0 );

            $( pc.router.AppRouter.CHANGE_PLAYER_ID ).hide();

            this.homeView = new pc.view.HomeView();
            this.collectView = new pc.view.CollectView();
            this.selectView = new pc.view.SelectView();
            this.listGuessView = new pc.view.ListGuessView();
            this.estimateView = new pc.view.EstimateView();
            this.hangmanView = new pc.view.HangmanView();
            this.resultView = new pc.view.ResultView();

            this.player = pc.model.FacebookPlayer.getInstance();
            this.player.on( "profile:loaded", _.bind( this.profileLoadedCb, this ) );
            this.homeView.on( "click:proceed", _.bind( this.startCollectCb, this ) );
            this.collectView.on( "collect:done", _.bind( this.selectEntitiesCb, this ) );
            this.selectView.on( "select:done", _.bind( this.guessListSizeCb, this ) );
            this.listGuessView.on( "listguessview:done", _.bind( this.guessEntitySizeCb, this ) );
            this.estimateView.on( "estimateview:done", _.bind( this.hangmanStartCb, this ) );
            this.hangmanView.on( "hangmanview:done", _.bind( this.showResultsCb, this ) );
        },

        home: function()
        {
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

            $( pc.router.AppRouter.CAROUSEL_ID ).on( 'slid', function()
            {
                $( '.carousel .item.active .background' ).transition( {
                    "background-color": "rgb(59,89,152)"
                } );
            } );

        },

        selectEntitiesCb: function()
        {
            console.log( '[Controller] Starting Setup: Select most sensible entities' );
            $( pc.router.AppRouter.CAROUSEL_ID ).unbind();
            this.selectView.render();
            $( "#container-select" ).html( this.selectView.el );

            $( pc.router.AppRouter.CAROUSEL_ID ).carousel( 2 );
            pc.common.ProgressBar.getInstance().to( 2 );

            this.selectView.on( "preload:done", _.bind( function()
            {
                console.log( "[Controller] Preload done" );
                $( '.carousel .item.active' ).transition( {
                    "height": "700px"
                } );
                this.selectView.start();
            }, this ) );

        },

        guessListSizeCb: function()
        {
            console.log( '[Controller] Starting Game #1: List Size Guess' );
            $( pc.router.AppRouter.CAROUSEL_ID ).unbind();

            $( pc.router.AppRouter.CONTROL_CONTAINER_ID ).unbind().fadeIn( 'fast' ).click( _.bind( function()
            {
                this.listGuessView.render();
                $( '#container-guess' ).html( this.listGuessView.el );

                $( pc.router.AppRouter.CAROUSEL_ID ).carousel( 3 );
                pc.common.ProgressBar.getInstance().to( 3 );
                $( pc.router.AppRouter.CONTROL_CONTAINER_ID ).unbind().hide();

                $( pc.router.AppRouter.CAROUSEL_ID ).on( 'slid', function()
                {
                    $( '.carousel .item.active' ).transition( {
                        "height": "470px"
                    } );
                } );
            }, this ) );
            this._animateNextButton();
        },

        guessEntitySizeCb: function()
        {
            console.log( '[Controller] Starting Game #2: Entity Size Guess' );
            $( pc.router.AppRouter.CAROUSEL_ID ).unbind();

            $( pc.router.AppRouter.CONTROL_CONTAINER_ID ).unbind().fadeIn( 'fast' ).click( _.bind( function()
            {
                this.estimateView.render();
                $( '#container-estimate' ).html( this.estimateView.el );

                $( pc.router.AppRouter.CAROUSEL_ID ).carousel( 4 );
                pc.common.ProgressBar.getInstance().to( 4 );
                $( pc.router.AppRouter.CONTROL_CONTAINER_ID ).unbind().hide();

                $( pc.router.AppRouter.CAROUSEL_ID ).on( 'slid', function()
                {
                    $( '.carousel .item.active' ).transition( {
                        "height": "700px"
                    } );
                } );
            }, this ) );
            this._animateNextButton();

        },

        hangmanStartCb: function()
        {
            console.log( '[Controller] Starting Game #3: Hangman' );
            $( pc.router.AppRouter.CAROUSEL_ID ).unbind();

            $( pc.router.AppRouter.CONTROL_CONTAINER_ID ).unbind().fadeIn( 'fast' ).click( _.bind( function()
            {
                this.hangmanView.render();
                $( '#container-hangman' ).html( this.hangmanView.el );

                $( pc.router.AppRouter.CAROUSEL_ID ).carousel( 5 );
                pc.common.ProgressBar.getInstance().to( 5 );
                $( pc.router.AppRouter.CONTROL_CONTAINER_ID ).unbind().hide();

                $( pc.router.AppRouter.CAROUSEL_ID ).on( 'slid', function()
                {
                    $( '.carousel .item.active' ).transition( {
                        "height": "720px"
                    } );
                } );
            }, this ) );
            this._animateNextButton();
        },

        showResultsCb: function()
        {
            console.log( '[Controller] Showing results' );
            $( pc.router.AppRouter.CAROUSEL_ID ).unbind();

            $( pc.router.AppRouter.CONTROL_CONTAINER_ID ).unbind().fadeIn( 'fast' ).click( _.bind( function()
            {
                this.resultView.render();
                $( '#container-results' ).html( this.resultView.el );

                $( pc.router.AppRouter.CAROUSEL_ID ).carousel( 6 );
                pc.common.ProgressBar.getInstance().to( 6 );
                $( pc.router.AppRouter.CONTROL_CONTAINER_ID ).unbind().hide();

                $( pc.router.AppRouter.CAROUSEL_ID ).on( 'slid', _.bind( function()
                {
                    $( '.carousel .item.active' ).transition( {
                        "height": "470px"
                    } );
                    this.resultView.renderResults();
                }, this ) );
            }, this ) );
            this._animateNextButton();
        },

        _animateNextButton: function()
        {
            $( pc.router.AppRouter.CONTROL_CONTAINER_ID ).transition( {'width': '80px'}, 500, function()
            {
                $( this ).transition( {'width': '60px'}, 300, function()
                {
                    $( this ).transition( {'width': '80px'}, 500, function()
                    {
                        $( this ).transition( {'width': '60px'}, 300 );
                    } );
                } );
            } );
        }

    }, {

        CHANGE_PLAYER_ID: '#changeplayer',
        CAROUSEL_ID:      '#game-carousel',
        NUM_SLIDES:       7,

        CONTROL_CONTAINER_ID: '.carousel-control.right'

    } );

})();