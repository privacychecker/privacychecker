(function()
{
    "use strict";
    var ns = namespace( "pc.view" );

    ns.SelectView = Backbone.View.extend( {

            templateScope:     pc.template.SelectScopeTemplate,
            templateGame:      pc.template.SelectGameTemplate,
            templateGameItems: pc.template.SelectGameItemsTemplate,

            initialize: function()
            {
                console.log( "Init: SelectView" );
                this.currentPair = null;
                this.scope = undefined;
            },

            render: function()
            {

                var testdata = pc.model.TestData.getInstance(),
                    no_pictues = !testdata.hasEnoughPictures(),
                    no_statuses = !testdata.hasEnoughStatuses(),
                    no_one_of_both = (no_pictues || no_statuses) && !testdata.hasEnoughCombined(),
                    not_playable = no_pictues && no_statuses && no_one_of_both,
                    too_many_public = testdata.hasTooManyPublic();

                // render scope
                var options = {
                    no_pictures:     no_pictues,
                    no_statuses:     no_statuses,
                    no_one_of_both:  no_one_of_both,
                    not_playable:    not_playable,
                    too_many_public: too_many_public
                };

                console.info( "[SelectView] Rendering select scope template with options", options );
                this.$el.html( this.templateScope( options ) );

                try {
                    pc.model.TooltipCollection.getInstance().pin( this.$el.find( 'h1' ) );
                }
                catch ( e ) {
                    console.error( "[SelectView] Unable to attach tooltips:", e, "Skipping rest" );
                }

                // query for scope
                console.debug( "[SelectView] Rendering selectView - asking for scope" );
                this.$el.find( pc.view.SelectView.SCOPE_IMAGES_ID ).click( _.bind( function()
                {
                    console.info( "[SelectView] User wants to play with images" );
                    this.preload( pc.view.SelectView.GAME_SCOPE.IMAGES );
                }, this ) );

                this.$el.find( pc.view.SelectView.SCOPE_STATUSES_ID ).click( _.bind( function()
                {
                    console.info( "[SelectView] User wants to play with statuses" );
                    this.preload( pc.view.SelectView.GAME_SCOPE.STATUSES );
                }, this ) );

                this.$el.find( pc.view.SelectView.SCOPE_BOTH_ID ).click( _.bind( function()
                {
                    console.info( "[SelectView] User wants to play with images and statuses" );
                    this.preload( pc.view.SelectView.GAME_SCOPE.BOTH );
                }, this ) );

                return this;
            },

            preload: function( scope )
            {
                this.$el.fadeOut( 'fast' );

                this.scope = scope;

                try {
                    this.testData = pc.model.TestData.getInstance();
                    this.testData.setScope( this.scope );
                }
                catch ( e ) {
                    console.error( "[SelectView] Caught exception while querying testdata", e );
                    window.alert( i18n.t( pc.view.SelectView.LANG_INSUFFICIENT_DATA ) );
                    throw "E_TESTDATA_QUERRY_ERROR";
                }

                // preload images
                var imgsToPreload = this.testData.get( 'pictures' ).map( function( el )
                {
                    console.log( el );
                    return el.get( 'source' );
                } );

                if ( imgsToPreload.length > 0 ) {
                    console.log( "[SelectView] Preloading images:", imgsToPreload );

                    var loadingUtil = pc.common.LoadingUtil.getInstance(),
                        loadedItems = 0;
                    loadingUtil.reset();
                    loadingUtil.show();

                    $.imgpreload( imgsToPreload, {
                        each: function()
                        {
                            loadingUtil.percent( (++loadedItems / imgsToPreload.length) * 100 );
                            console.debug( "[SelectView] Image loaded", $( this ).attr( 'src' ) );
                        },
                        all:  _.bind( function()
                        {
                            console.log( "[SelectView] All images loaded" );
                            loadingUtil.percent( 100 );
                            loadingUtil.hide();
                            this.trigger( 'preload:done' );
                        }, this )
                    } );
                }
                else {
                    console.info( "[SelectView] No images to preload" );
                    this.trigger( 'preload:done' );
                }

            },

            start: function()
            {
                this.$el.fadeOut( 'fast', _.bind( function()
                {

                    // generate briefing
                    var briefing = pc.common.GameBriefing.getInstance();
                    briefing.make( $.t( pc.view.SelectView.LANG_BRIEFING ) );
                    briefing.headline( $.t( pc.view.SelectView.LANG_GAME_NAME ) );
                    briefing.cbLink( pc.view.SelectView.CB_LINK_ID );

                    try {
                        pc.model.TooltipCollection.getInstance().pin( this.$el.find( 'h1' ) );
                        pc.model.TooltipCollection.getInstance().pin( briefing.getTextContainer() );
                    }
                    catch ( e ) {
                        console.error( "[SelectView] Unable to attach tooltips:", e, "Skipping rest" );
                    }

                    briefing.show();

                    briefing.on( 'hidden', _.bind( function()
                    {
                        // show template and start game
                        this.$el.html( this.templateGame() );

                        // attach tooltip
                        try {
                            pc.model.TooltipCollection.getInstance().pin( this.$el.find( 'h1' ) );
                        }
                        catch ( e ) {
                            console.error( "[SelectView] Unable to attach tooltips:", e, "Skipping rest" );
                        }

                        this.$el.fadeIn( 'fast', _.bind( this.ask, this ) );
                    }, this ) );

                }, this ) );
            },

            _createItem: function( item )
            {

                var options = {};

                // form the question
                if ( item instanceof pc.model.FacebookPicture ) {
                    return {
                        picture: {
                            url:     item.get( 'source' ),
                            caption: item.get( 'caption' )
                        }
                    };
                }
                else if ( item instanceof pc.model.FacebookStatus ) {
                    return {
                        status: {
                            caption:  item.get( 'caption' ),
                            date:     pc.common.DateFormatHelper.formatShort( item.get( 'date' ) ),
                            location: item.get( 'location' )
                        }
                    };
                }

                return options;
            },

            ask: function( winner )
            {
                if ( !_.isNull( this.currentPair ) ) {
                    console.log( "[SelectView] Last comparision's winner was ", winner );
                    this.testData.setWinner( this.currentPair[0], this.currentPair[1], winner );
                    pc.common.ProgressBar.getInstance().subto( pc.model.TestData.getInstance().getCurrentRound(),
                        pc.model.TestData.getInstance().getMaxRounds() );
                }

                // template container
                var container = this.$el.find( '.container' );

                // we have remaining items
                this.currentPair = this.testData.getRateTupple();

                if ( !_.isNull( this.currentPair ) ) {

                    container.fadeOut( 'fast', _.bind( function()
                    {
                        container.empty();

                        var item1 = this.currentPair[0],
                            item2 = this.currentPair[1],
                            options = {
                                item1: this._createItem( item1 ),
                                item2: this._createItem( item2 )
                            };

                        console.info( "[SelectView] Rendering item template with options", options );
                        container.html( this.templateGameItems( options ) );

                        // add click events
                        container.find( '.item1' ).click( _.bind( this.ask, this, item1 ) );
                        container.find( '.item2' ).click( _.bind( this.ask, this, item2 ) );

                        container.fadeIn( 'fast' );

                    }, this ) );
                }
                else {
                    console.log( '[SelectView] Selection done, sending done trigger' );

                    pc.model.TestData.getInstance().extractTestData();

                    this.trigger( 'done' );
                }
            }

        },
        {

            SCOPE_IMAGES_ID:   '.scope button.images',
            SCOPE_STATUSES_ID: '.scope button.statuses',
            SCOPE_BOTH_ID:     '.scope button.both',

            LANG_INSUFFICIENT_DATA: "app.select.insufficient_data",
            LANG_BRIEFING:          "app.select.briefing",
            LANG_POINTS:            "app.common.points",

            LANG_GAME_NAME: "app.select.name",

            LANG_TOOLTIP_ITEMS:    "app.select.tooltip.item",
            LANG_TOOLTIP_PERSONAL: "app.select.tooltip.personal",
            LANG_TOOLTIP_RANKING:  "app.select.tooltip.ranking",

            CB_LINK_ID: "app.select",

            GAME_SCOPE: {
                IMAGES: 0, STATUSES: 1, BOTH: 2
            }

        }
    );

})();


