(function()
{
    "use strict";
    var ns = namespace( "pc.view" );

    ns.SelectView = Backbone.View.extend( {

        template: pc.template.SelectTemplate,

        initialize: function()
        {
            console.log( "Init: SelectView" );
            this.currentPair = null;
            this.scope = undefined;
        },

        render: function()
        {
            this.$el.html( this.template() );

            // show scope view
            this.$el.find( '.scope' ).show();
            // hide playground and result
            this.$el.find( '.body' ).hide();
            this.$el.find( '.result' ).hide();

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
            this.$el.find( ".scope" ).fadeOut( 'fast', _.bind( function()
            {
                this.$el.find( '.body' ).fadeIn( 'fast' );

                // generate briefing
                var briefing = pc.common.GameBriefing.getInstance();
                briefing.make( $.t( pc.view.SelectView.LANG_BRIEFING ) );

                try {
                    pc.model.TooltipCollection.getInstance().pin( briefing.getTextContainer() );
                }
                catch ( e ) {
                    console.error( "[SelectView] Unable to attach tooltips:", e, "Skipping rest" );
                }

                briefing.show();

                this.next();
            }, this ) );
        },

        _createObject: function( item )
        {

            if ( item instanceof pc.model.FacebookPicture ) {

                return pc.common.ImageContainer.create( item.get( 'source' ), item.get( 'caption' ) )
                    .toHtml();
            }
            else if ( item instanceof pc.model.FacebookStatus ) {
                return pc.common.StatusContainer.create( item.get( 'caption' ), item.get( 'date' ),
                        item.get( 'place' ) )
                    .toHtml();
            }

            return null;

        },

        next: function( winner )
        {
            if ( !_.isNull( this.currentPair ) ) {
                console.log( "[SelectView] Last comparision's winner was ", winner );
                this.testData.setWinner( this.currentPair[0], this.currentPair[1], winner );
                pc.common.ProgressBar.getInstance().subto( pc.model.TestData.getInstance().getCurrentRound(),
                    pc.model.TestData.getInstance().getMaxRounds() );
            }

            this.currentPair = this.testData.getRateTupple();

            if ( !_.isNull( this.currentPair ) ) {

                var item1 = this.currentPair[0];
                var item2 = this.currentPair[1];

                // hide items
                $( this.el ).find( pc.view.SelectView.ITEM_1_CONTAINER ).unbind( 'click' ).fadeOut( 'fast' );
                $( this.el ).find( pc.view.SelectView.ITEM_2_CONTAINER ).unbind( 'click' ).fadeOut( 'fast',
                    _.bind( function()
                    {
                        // show new items
                        var el1 = this._createObject( item1 );
                        var el2 = this._createObject( item2 );

                        $( this.el )
                            .find( pc.view.SelectView.ITEM_1_CONTAINER )
                            .empty()
                            .append( el1 )
                            .click( _.bind( function()
                            {
                                this.next( item1 );
                            }, this ) )
                            .fadeIn( 'fast' );

                        $( this.el )
                            .find( pc.view.SelectView.ITEM_2_CONTAINER )
                            .empty()
                            .append( el2 )
                            .click( _.bind( function()
                            {
                                this.next( item2 );
                            }, this ) )
                            .fadeIn( 'fast' );

                    }, this ) );

            }
            else {
                console.log( '[SelectView] Selection done' );
                this.result();
            }
        },

        result: function()
        {

            var itemLine = this.$el.find( pc.view.SelectView.RESULT_LIST_ID ).children( "li" ).first().remove(),
                orderedRatingItems = pc.model.TestData.getInstance().getOrderedList(),
                position = 0,
                lastPoints = 0;

            console.info( "[SelectView] Order after rating is", orderedRatingItems );

            _.each( orderedRatingItems, _.bind( function( el )
            {

                var usedItemLine = itemLine.clone();

                if ( lastPoints === 0 || el.get( 'points' ) < lastPoints ) {
                    position++;
                    usedItemLine.children( ".position" ).html( position );
                }
                if ( el instanceof pc.model.FacebookPicture ) {
                    var image = $( '<img>', {
                        src: el.get( 'source' ),
                        alt: el.get( 'caption' )
                    } ).css( 'visibility', 'hidden' );
                    usedItemLine.children( ".item" ).append( image ).imgLiquid();
                }
                usedItemLine.children( ".description" ).html( el.get( 'caption' ) );
                usedItemLine.children( ".points" ).html( el.get( 'points' ) + " " + $.t( pc.view.SelectView.LANG_POINTS ) );

                lastPoints = el.get( 'points' );

                this.$el.find( pc.view.SelectView.RESULT_LIST_ID ).append( usedItemLine );
            }, this ) );

            // extract test data for the next games
            pc.model.TestData.getInstance().extractTestData();

            this.$el.find( ".body" ).fadeOut( 'fast', _.bind( function()
            {
                this.$el.find( '.result' ).fadeIn( 'fast' );
                this.trigger( 'select:done' );
            }, this ) );

        }

    }, {

        ITEM_1_CONTAINER: '.item1',
        ITEM_2_CONTAINER: '.item2',

        SCOPE_IMAGES_ID:   '.scope button.images',
        SCOPE_STATUSES_ID: '.scope button.statuses',
        SCOPE_BOTH_ID:     '.scope button.both',

        RESULT_LIST_ID: '.result ul',

        LOADER_GIF_SRC: 'img/loader.gif',

        LANG_INSUFFICIENT_DATA: "app.select.insufficient_data",
        LANG_BRIEFING:          "app.select.briefing",
        LANG_POINTS:            "app.common.points",

        LANG_TOOLTIP_ITEMS:    "app.select.tooltip.item",
        LANG_TOOLTIP_PERSONAL: "app.select.tooltip.personal",
        LANG_TOOLTIP_RANKING:  "app.select.tooltip.ranking",

        GAME_SCOPE: {
            IMAGES: 0, STATUSES: 1, BOTH: 2
        }

    } );

})();


