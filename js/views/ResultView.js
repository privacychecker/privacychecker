(function()
{
    "use strict";

    var ns = namespace( "pc.view" );

    ns.ResultView = Backbone.View.extend( {

        template: pc.template.ResultTemplate,

        events: {
            "click #playagain":   "playAgainCb",
            "click #sharepoints": "sharePointsCb"
        },

        initialize: function()
        {
            console.log( "[ResultView] Init" );
            this.points = 0;
        },

        render: function()
        {

            this.recommendationsHelper = {};

            this.hangmanResults = this._buildHangmanHash();
            this.listsResults = this._buildListHash();
            this.totalResults = this._buildTotalsHash();

            var options = {
                hangman: this.hangmanResults,
                lists:   this.listsResults,
                totals:  this.totalResults,
                points:  {
                    per_list:   pc.view.ResultView.POINTS_PER_CREATE_LIST,
                    use_list:   pc.view.ResultView.POINTS_PER_USE_LIST,
                    per_public: pc.view.ResultView.POINTS_PER_PUBLIC_ITEM
                }
            };

            console.info( "[ResultView] Rendering template with", options );

            this.$el.html( this.template( options ) );

            this.$el.find( '.collapsable' ).each( function( idx, el )
            {
                var $el = $( el ),
                    $btn = $el.find( '.head .control' ).first(),
                    $body = $el.find( '.body' ).first();

                $body.slideUp();
                $btn.click( function()
                {
                    $body.slideToggle();
                } );
            } );

            // enable tooltips
            this.$el.find( 'ul.wrongs > li' ).tooltip();
            this.$el.find( '.multi' ).tooltip();

            // enable smoothscroll
            this.$el.smoothScroll();

            // show recommendations
            this.trigger( "recommendations" );
        },

        _buildTotalsHash: function()
        {

            var points = 0,
                createListWarning = false,
                useListWarning = false,
                publicItemWarning = false,
                scoreGood = false,
                scoreNeutral = false,
                scoreBad = false;

            // hangman points
            _.each( this.hangmanResults, function( result )
            {
                points += result.points;
            } );

            // list points
            points += this.listsResults.number_has_lists * pc.view.ResultView.POINTS_PER_CREATE_LIST;
            points += this.listsResults.number_uses_lists * pc.view.ResultView.POINTS_PER_USE_LIST;
            points -= this.listsResults.number_public_items * pc.view.ResultView.POINTS_PER_PUBLIC_ITEM;

            if ( this.listsResults.number_has_lists === 0 ) {
                createListWarning = true;
                this.recommendationsHelper.lists_create = true;
            }
            if ( this.listsResults.number_uses_lists === 0 ) {
                useListWarning = true;
                this.recommendationsHelper.lists_use = true;
                this.recommendationsHelper.sharing = true;
            }
            if ( this.listsResults.number_public_items !== 0 ) {
                publicItemWarning = true;
                this.recommendationsHelper.publish_items = true;
                this.recommendationsHelper.defaults = true;
                this.recommendationsHelper.hide_past = true;
            }

            points = points >= 0 ? points : 0;

            if ( _.isBetween( points, pc.view.ResultView.POINTS_GOOD, 9999999999 ) ) {
                scoreGood = true;
            }
            else if ( _.isBetween( points, pc.view.ResultView.POINTS_NEUTRAL, pc.view.ResultView.POINTS_GOOD ) ) {
                scoreNeutral = true;
            }
            else if ( _.isBetween( points, 0, pc.view.ResultView.POINTS_NEUTRAL ) ) {
                scoreBad = true;
            }

            this.points = points;

            return {
                points:                   points,
                show_create_list_warning: createListWarning,
                show_use_list_warning:    useListWarning,
                show_public_warning:      publicItemWarning,
                score_good:               scoreGood,
                score_neutral:            scoreNeutral,
                score_bad:                scoreBad
            };

        },

        _buildListHash: function()
        {

            var player = pc.model.FacebookPlayer.getInstance(),
                userLists = player.getFriendLists().where( { type: pc.model.FacebookList.Type.USER } ),
                autoLists = player.getFriendLists().where( { type: pc.model.FacebookList.Type.AUTO } ),
                numberHasLists = userLists.length,
                maxListsAllowed = pc.view.ResultView.MAX_LISTS_USED,
                publicItems = [],
                usedLists = [];

            console.debug( "[ResultView] User has the following user lists", userLists );

            // iterate through all items we selected to see if he uses a list
            // find all public items (not only testdata)
            _.each( _.union( player.getPictures().models, player.getStatuses().models ), _.bind( function( item )
            {
                if ( !_.isUndefined( item.get( 'privacy' ) )
                    && !_.isUndefined( item.get( 'privacy' ).get( 'level' ) )
                    && !_.isUndefined( item.get( 'privacy' ).get( 'includeList' ) )
                    && !_.isUndefined( item.get( 'privacy' ).get( 'excludeList' ) ) ) {

                    var level = item.get( 'privacy' ).get( 'level' ),
                        includeList = item.get( 'privacy' ).get( 'includeList' ),
                        excludeList = item.get( 'privacy' ).get( 'excludeList' ),
                        bothLists = _.union( excludeList.models, includeList.models );

                    // public item
                    if ( level === pc.common.PrivacyDefinition.Level.ALL ) {
                        console.info( "[ResultView] Found PUBLIC item", item );

                        if ( item instanceof pc.model.FacebookPicture ) {
                            publicItems.push( {
                                picture: {
                                    url:     item.get( 'source' ),
                                    caption: item.get( 'caption' )
                                }
                            } );
                        }
                        else if ( item instanceof pc.model.FacebookStatus ) {
                            publicItems.push( {
                                status: {
                                    caption:  item.get( 'caption' ),
                                    date:     pc.common.DateFormatHelper.formatShort( item.get( 'date' ) ),
                                    location: item.get( 'location' )
                                }
                            } );
                        }
                    }

                    // walk through all lists to validate if a item
                    _.each( _.union( userLists, autoLists ), function( list )
                    {
                        if ( list.id !== -1 && !_.contains( usedLists, list ) ) {
                            _.each( bothLists, function( itemList )
                            {
                                if ( itemList.id === list.id ) {
                                    console.info( "[ResultView] Item uses a unused list", item, itemList );
                                    usedLists.push( list );
                                }
                            } );
                        }
                    } );
                }
            }, this ) );

            return {
                number_has_lists: numberHasLists < maxListsAllowed ? numberHasLists : maxListsAllowed,
                number_uses_lists: usedLists.length < maxListsAllowed ? usedLists.length : maxListsAllowed,
                number_public_items: publicItems.length,
                created_lists:       userLists.map( function( list )
                {
                    return list.get( 'name' );
                } ),
                used_lists:          _.map( usedLists, function( list )
                {
                    return list.get( 'name' );
                } ),
                public_items:        publicItems
            };

        },

        /**
         * Calculate results for every hangman game suitable for Handlebars
         *
         * @returns {Array<{duration: number, errors: number, points: number, item: Object}>}
         *  Array with results for every hangman game
         * @method _buildHangmanHash
         * @private
         */
        _buildHangmanHash: function()
        {

            var hangmanResults = pc.model.FacebookPlayer.getInstance().get( 'results' ),
                itemInformation,
                duration;

            return hangmanResults.map( function( result )
            {
                itemInformation = {};

                var item = result.get( 'item' ),
                    wrongs = result.get( 'userValue' ),
                    gameResult = result.get( 'optional' ).result;

                if ( item instanceof pc.model.FacebookPicture ) {
                    itemInformation = {
                        picture: {
                            url:     item.get( 'source' ),
                            caption: item.get( 'caption' )
                        }
                    };
                }
                else if ( item instanceof pc.model.FacebookStatus ) {
                    itemInformation = {
                        status: {
                            caption:  item.get( 'caption' ),
                            date:     pc.common.DateFormatHelper.formatShort( item.get( 'date' ) ),
                            location: item.get( 'location' )
                        }
                    };
                }

                //duration is timeout?
                duration =
                    gameResult === pc.view.HangmanView.RESULT.TIMEOUT ? $.t( pc.view.ResultView.LANG_HANGMAN_TIMEOUT )
                        : gameResult === pc.view.HangmanView.RESULT.LOST ? $.t( pc.view.ResultView.LANG_HANGMAN_LOST )
                        : result.get( 'optional' ).duration.toFixed() + ' ' + $.t( pc.view.ResultView.LANG_SECONDS );

                return _.extend( itemInformation, {
                    duration: duration,
                    errors:   result.get( 'optional' ).errors,
                    points:   result.get( 'optional' ).points,
                    wrongs:   _.map( wrongs, function( wrong )
                    {
                        return {
                            id:   wrong.get( 'id' ),
                            name: wrong.get( 'name' )
                        };
                    } )
                } );
            } );

        },

        getRecommendations: function()
        {
            return this.recommendationsHelper;
        },

        playAgainCb: function()
        {
            console.log( "[ResultView] Player wants to play again" );
            document.location.href = "http://www.friend-inspector.org";
        },

        sharePointsCb: function()
        {
            var points = this.points;

            FB.ui( {
                method:      'feed',
                link:        'http://www.friend-inspector.org',
                picture:     'http://www.friend-inspector.org/logo-share.jpg?v=123',
                name:        $.t( pc.view.ResultView.LANG_SHARE_TITLE, {points: points} ),
                description: $.t( pc.view.ResultView.LANG_SHARE_BODY ), actions: [
                    { 'name': $.t( pc.view.ResultView.LANG_SHARE_PLAY ), 'link': 'http://www.friend-inspector.org' }
                ]
            }, function( response )
            {
                console.info( "Posted to user's wall:", response );
            } );
        }

    }, {
        LANG_HANGMAN_TIMEOUT: "app.results.timeout",
        LANG_HANGMAN_LOST:    "app.results.lost",
        LANG_SECONDS:         "app.common.seconds",
        LANG_SHARE_TITLE:     "app.results.share.headline",
        LANG_SHARE_BODY:      "app.results.share.body",
        LANG_SHARE_PLAY:      "app.results.share.play",

        POINTS_PER_CREATE_LIST: 1000,
        POINTS_PER_USE_LIST:    1000,
        POINTS_PER_PUBLIC_ITEM: 200,

        POINTS_GOOD:    32500,
        POINTS_NEUTRAL: 15000,

        MAX_LISTS_USED: 5

    } );

})();