(function()
{
    "use strict";

    var ns = namespace( "pc.view" );

    ns.ResultView = Backbone.View.extend( {

        template: pc.template.ResultTemplate,

        initialize: function()
        {
            console.log( "[ResultView] Init" );
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
            this.$el.find('ul.wrongs > li' ).tooltip();

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
                publicItemWarning = false;

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
            }

            points = points >= 0 ? points : 0;

            return {
                points:                   points,
                show_create_list_warning: createListWarning,
                show_use_list_warning:    useListWarning,
                show_public_warning:      publicItemWarning
            };

        },

        _buildListHash: function()
        {

            var player = pc.model.FacebookPlayer.getInstance(),
                userLists = player.getFriendLists().where( { type: pc.model.FacebookList.Type.USER } ),
                numberHasLists = userLists.length,
                numberUsesLists = 0,
                numberPublicItems = 0,
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
                        excludeList = item.get( 'privacy' ).get( 'excludeList' );

                    if ( level === pc.common.PrivacyDefinition.Level.ALL ) {
                        console.info( "[ResultView] Found PUBLIC item", item );
                        numberPublicItems++;
                    }

                    // walk through all lists to validate if a item
                    _.each( userLists, function( list )
                    {
                        if ( list.id !== -1 && !_.contains( usedLists, list ) ) {
                            if ( excludeList.contains( list ) && includeList.contains( list ) ) {
                                console.info( "[ResultView] Item uses a unused list", item, list );
                                numberUsesLists++;
                                usedLists.push( list );
                            }
                        }
                        else {
                            console.debug( 'item invalid list', item, list );
                        }
                    } );

                }
            }, this ) );

            return {
                number_has_lists:    numberHasLists,
                number_uses_lists:   numberUsesLists,
                number_public_items: numberPublicItems,
                created_lists:       userLists.map(function( list )
                {
                    return list.get( 'name' );
                } ).join( ', ' ),
                used_lists:          _.map( usedLists,function( list )
                {
                    return list.get( 'name' );
                } ).join( ', ' )
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
                itemInformation;

            return hangmanResults.map( function( result )
            {
                itemInformation = {};

                var item = result.get( 'item' ),
                    wrongs = result.get( 'userValue' );

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

                return _.extend( itemInformation, {
                    duration: result.get( 'optional' ).duration.toFixed(),
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
        }
    }, {

        LANG_LISTS_FRIENDS_VERYGOOD: "app.results.lists.friend_verygood",
        LANG_LISTS_FRIENDS_GOOD:     "app.results.lists.friend_good",
        LANG_LISTS_FRIENDS_BAD:      "app.results.lists.friend_bad",
        LANG_LISTS_FRIENDS_VERYBAD:  "app.results.lists.friend_verybad",

        LANG_LISTS_USER_VERYGOOD: "app.results.lists.user_verygood",
        LANG_LISTS_USER_GOOD:     "app.results.lists.user_good",
        LANG_LISTS_USER_BAD:      "app.results.lists.user_bad",
        LANG_LISTS_USER_VERYBAD:  "app.results.lists.user_verybad",
        LANG_LISTS_USER_NONE:     "app.results.lists.user_none",

        LANG_LISTS_AUTO_VERYGOOD: "app.results.lists.auto_verygood",
        LANG_LISTS_AUTO_GOOD:     "app.results.lists.auto_good",
        LANG_LISTS_AUTO_BAD:      "app.results.lists.auto_bad",
        LANG_LISTS_AUTO_VERYBAD:  "app.results.lists.auto_verybad",
        LANG_LISTS_AUTO_NONE:     "app.results.lists.auto_none",

        LANG_ITEMS_LISTS_YES: "app.results.items.lists_yes",
        LANG_ITEMS_LISTS_NO:  "app.results.items.lists_no",

        LANG_ITEMS_PUBLIC_YES: "app.results.items.public_yes",
        LANG_ITEMS_PUBLIC_NO:  "app.results.items.public_no",

        LANG_HANGMAN_VERYGOOD: "app.results.hangman.verygood",
        LANG_HANGMAN_GOOD:     "app.results.hangman.good",
        LANG_HANGMAN_BAD:      "app.results.hangman.bad",
        LANG_HANGMAN_VERYBAD:  "app.results.hangman.verybad",

        POINTS_PER_CREATE_LIST: 1000,
        POINTS_PER_USE_LIST:    1000,
        POINTS_PER_PUBLIC_ITEM: 200

    } );

})();