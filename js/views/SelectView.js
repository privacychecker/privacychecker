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
            this.$el.find( '.body' ).hide();

            var modal = $( this.el ).find( pc.view.SelectView.MODAL_GAME_SCOPE ).first();
            modal.modal( 'show', {
                "keyboard": false
            } );

            console.debug( "[SelectView] Rendering selectView - asking for scope" );

            modal.find( pc.view.SelectView.MODAL_GAME_SCOPE_IMAGES ).click( _.bind( function()
            {
                console.info( "[SelectView] User wants to play with images" );
                modal.modal( 'hide' );
                this.scope = pc.view.SelectView.GAME_SCOPE.IMAGES;
                this.preload();
            }, this ) );

            modal.find( pc.view.SelectView.MODAL_GAME_SCOPE_STATUS ).click( _.bind( function()
            {
                console.info( "[SelectView] User wants to play with statuses" );
                modal.modal( 'hide' );
                this.scope = pc.view.SelectView.GAME_SCOPE.STATUSES;
                this.preload();
            }, this ) );

            modal.find( pc.view.SelectView.MODAL_GAME_SCOPE_BOTH ).click( _.bind( function()
            {
                console.info( "[SelectView] User wants to play with images and statuses" );
                modal.modal( 'hide' );
                this.scope = pc.view.SelectView.GAME_SCOPE.BOTH;
                this.preload();
            }, this ) );

            return this;
        },

        preload: function()
        {

            try {
                this.testData = pc.model.TestData.getInstance();
                this.testData.setScope( this.scope );
            }
            catch ( e ) {
                console.error( "[SelectView] Caught exception while querying testdata", e );
                window.alert( i18n.t( pc.view.SelectView.LANG_INSUFFICIENT_DATA ) );
                throw "E_STOP";
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
            this.$el.find( '.body' ).fadeIn( 'fast' );
            this.next();
        },

        _createObject: function( item )
        {

            if ( item instanceof pc.model.FacebookPicture ) {

                return pc.common.ImageContainer.create( item.get( 'source' ), item.get( 'name' ) )
                    .toHtml()
                    .addClass( 'polaroid' );
            }
            else if ( item instanceof pc.model.FacebookStatus ) {
                return pc.common.StatusContainer.create( item.get( 'message' ), item.get( 'date' ),
                        item.get( 'place' ) )
                    .toHtml();
            }

            return null;

        },

        next: function( winner )
        {
            if ( !_.isNull(this.currentPair) ) {
                console.log( "[SelectView] Last comparision's winner was ", winner );
                this.testData.setWinner( this.currentPair[0], this.currentPair[1], winner );
                pc.common.ProgressBar.getInstance().subto( pc.model.TestData.getInstance().getCurrentRound(),
                    pc.model.TestData.getInstance().getMaxRounds() );
            }

            this.currentPair = this.testData.getRateTupple();

            if ( !_.isNull(this.currentPair) ) {

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
                this.trigger( 'select:done' );
            }
        }

    }, {

        ITEM_1_CONTAINER: '.item1',
        ITEM_2_CONTAINER: '.item2',

        MODAL_GAME_SCOPE:        '#game-scope',
        MODAL_GAME_SCOPE_IMAGES: 'button.images',
        MODAL_GAME_SCOPE_STATUS: 'button.statuses',
        MODAL_GAME_SCOPE_BOTH:   'button.both',

        LOADER_GIF_SRC: 'img/loader.gif',

        LANG_INSUFFICIENT_DATA: "app.select.insufficient_data",

        GAME_SCOPE: {
            IMAGES: 0, STATUSES: 1, BOTH: 2
        }

    } );

})();


