(function()
{
    "use strict";

    var ns = namespace( "pc.view" );

    ns.CollectView = Backbone.View.extend( {

        collected:  [],
        _tocollect: 6,

        template: pc.template.CollectTemplate,

        initialize: function()
        {
            console.log( "Init: CollectView" );
            this.collected = [];

            this.on( "collected:new", _.bind( this.validateCollectionDb, this ) );

            this.player = pc.model.FacebookPlayer.getInstance();
            this.player.on( "friends:start", _.bind( this.fbLoadFriendsStartCb, this ) );
            this.player.on( "friends:error", _.bind( this.fbLoadFriendsErrorCb, this ) );
            this.player.on( "friends:finished", _.bind( this.fbLoadFriendsFinishedCb, this ) );

            this.player.on( "random:start", _.bind( this.fbLoadRandomStartCb, this ) );
            this.player.on( "random:error", _.bind( this.fbLoadRandomErrorCb, this ) );
            this.player.on( "random:finished", _.bind( this.fbLoadRandomFinishedCb, this ) );

            this.player.on( "friendlist:start", _.bind( this.fbLoadFriendlistStartCb, this ) );
            this.player.on( "friendlist:error", _.bind( this.fbLoadFriendlistErrorCb, this ) );
            this.player.on( "friendlist:finished", _.bind( this.fbLoadFriendlistFinishedCb, this ) );

            this.player.on( "pictures:start", _.bind( this.fbLoadPicturesStartCb, this ) );
            this.player.on( "pictures:error", _.bind( this.fbLoadPicturesErrorCb, this ) );
            this.player.on( "pictures:finished", _.bind( this.fbLoadPicturesFinishedCb, this ) );

            this.player.on( "statuses:start", _.bind( this.fbLoadStatusesStartCb, this ) );
            this.player.on( "statuses:error", _.bind( this.fbLoadStatusesErrorCb, this ) );
            this.player.on( "statuses:finished", _.bind( this.fbLoadStatusesFinishedCb, this ) );
        },

        render: function()
        {
            $( this.el ).html( this.template() );

            $( this.el ).find( pc.view.CollectView.COLLECT_BTN_ID ).click( _.bind( this.startCollectCb, this ) );

            return this;
        },

        startCollectCb: function()
        {
            console.log( '[CollectView] Starting to collect users data' );

            // set button loading and start collecting friends
            $( this.el ).find( pc.view.CollectView.COLLECT_BTN_ID ).button( 'loading' ).html( i18n.t( pc.view.CollectView.LANG_BTN_LOADING ) ).prop( 'disabled',
                true );
            this.player.getFriends();
        },

        validateCollectionDb: function()
        {
            pc.common.ProgressBar.getInstance().subto( this.collected.length, this._tocollect );
            var player = pc.model.FacebookPlayer.getInstance();

            if ( _.contains( this.collected, "friends" ) && _.contains( this.collected,
                "lists" ) && _.contains( this.collected, "foreigners" ) &&
                _.contains( this.collected, "pictures" ) && _.contains( this.collected, "posts" ) ) {

                console.log( "[CollectView] All data collected", this.collected );
                console.log("[CollectView] User has ",
                    player.getFriends().length, "friends",
                    player.getFriendLists().length, "lists",
                    player.getPictures().length, "pictures",
                    player.getStatuses().length, "statuses",
                    player.getForeigners().length, "foreigners"
                );

                this.readPrivacySettings( {
                    success: _.bind( function()
                    {
                        console.log( "[CollectView] All done" );
                        this.trigger( "collect:done" );
                    }, this )
                } );
            }
            else {
                console.warn( "[CollectView] Not all data collected", this.collected );
            }
        },

        readPrivacySettings: function( cb )
        {
            console.log( "[CollectView] Transforming privacy ids from pictures to user ids" );
            this.player.getPictures().each( _.bind( function( picture )
            {
                //console.debug("[CollectView] Finalizing privacy settings for picture: ", picture);
                picture.validatePrivacy( this.player.getFriends(), this.player.getFriendLists() );
            }, this ) );

            console.log( "[CollectView] Transforming privacy ids from statuses to user ids" );
            this.player.getStatuses().each( _.bind( function( status )
            {
                //console.debug("[CollectView] Finalizing privacy settings for picture: ", picture);
                status.validatePrivacy( this.player.getFriends(), this.player.getFriendLists() );
            }, this ) );

            cb.success();
        },

        fbLoadFriendsStartCb: function()
        {
        },

        fbLoadFriendsErrorCb: function()
        {
            if ( window.confirm( i18n.t( pc.view.CollectView.LANG_ERROR_LOADING ) ) ) {
                location.reload();
            }
        },

        fbLoadFriendsFinishedCb: function()
        {
            this.collected.push( "friends" );
            this.trigger( "collected:new" );

            this.player.getFriendLists();
            this.player.getPictures();
            this.player.getStatuses();
            this.player.getForeigners();
        },

        fbLoadRandomStartCb: function()
        {
        },

        fbLoadRandomErrorCb: function()
        {
            if ( window.confirm( i18n.t( pc.view.CollectView.LANG_GENERIC_ERROR_LOADING ) ) ) {
                location.reload();
            }
        },

        fbLoadRandomFinishedCb: function()
        {
            this.collected.push( "foreigners" );
            this.trigger( "collected:new" );
        },

        fbLoadFriendlistStartCb: function()
        {
        },

        fbLoadFriendlistErrorCb: function()
        {
            if ( window.confirm( i18n.t( pc.view.CollectView.LANG_FRIENDLIST_ERROR_LOADING ) ) ) {
                location.reload();
            }
        },

        fbLoadFriendlistFinishedCb: function()
        {
            this.collected.push( "lists" );
            this.trigger( "collected:new" );
        },

        fbLoadPicturesStartCb: function()
        {
        },

        fbLoadPicturesErrorCb: function()
        {
            if ( window.confirm( i18n.t( pc.view.CollectView.LANG_GENERIC_ERROR_LOADING ) ) ) {
                location.reload();
            }
        },

        fbLoadPicturesFinishedCb: function()
        {
            this.collected.push( "pictures" );
            this.trigger( "collected:new" );
        },

        fbLoadStatusesStartCb: function()
        {
        },

        fbLoadStatusesErrorCb: function()
        {
            if ( window.confirm( i18n.t( pc.view.CollectView.LANG_GENERIC_ERROR_LOADING ) ) ) {
                location.reload();
            }
        },

        fbLoadStatusesFinishedCb: function()
        {
            this.collected.push( "posts" );
            this.trigger( "collected:new" );
        }

    }, {

        COLLECT_BTN_ID: 'button.trigger-collect',

        LANG_BTN_LOADING:   'app.collect.next_button_loading',
        LANG_GENERIC_ERROR_LOADING: 'app.collect.generic_error',
        LANG_FRIENDLIST_ERROR_LOADING: 'app.collect.generic_error'

    } );

})();