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

        render: function( listguessView, hangmanView )
        {
            this.listguessView = listguessView;
            this.hangmanView = hangmanView;

            this.recommendationsHelper = {};

            var options = {
                lists:   this._resultLists(),
                items:   this._resultItems(),
                hangman: this._resultHangman()
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

            // show recommendations
            this.trigger( "recommendations" );
        },

        getRecommendations: function()
        {
            return this.recommendationsHelper;
        },

        _resultLists: function()
        {

            var listResult = this.listguessView._resultLists(),
                results = pc.view.ListGuessView.Result,
                ns = pc.view.ResultView;

            // result texts
            var resultForFriends =
                listResult.friends.rating === results.VERYGOOD ? $.t( ns.LANG_LISTS_FRIENDS_VERYGOOD ) :
                listResult.friends.rating === results.GOOD ? $.t( ns.LANG_LISTS_FRIENDS_GOOD ) :
                listResult.friends.rating === results.BAD ? $.t( ns.LANG_LISTS_FRIENDS_BAD ) :
                $.t( ns.LANG_LISTS_FRIENDS_VERYBAD );

            var resultForUser =
                listResult.user.rating === results.VERYGOOD ? $.t( ns.LANG_LISTS_USER_VERYGOOD ) :
                listResult.user.rating === results.GOOD ? $.t( ns.LANG_LISTS_USER_GOOD ) :
                listResult.user.rating === results.BAD ? $.t( ns.LANG_LISTS_USER_BAD ) :
                listResult.user.rating === results.VERYBAD ? $.t( ns.LANG_LISTS_USER_VERYBAD ) :
                $.t( ns.LANG_LISTS_USER_NONE );

            var resultForAuto =
                listResult.auto.rating === results.VERYGOOD ? $.t( ns.LANG_LISTS_AUTO_VERYGOOD ) :
                listResult.auto.rating === results.GOOD ? $.t( ns.LANG_LISTS_AUTO_GOOD ) :
                listResult.auto.rating === results.BAD ? $.t( ns.LANG_LISTS_AUTO_BAD ) :
                listResult.auto.rating === results.VERYBAD ? $.t( ns.LANG_LISTS_AUTO_VERYBAD ) :
                $.t( ns.LANG_LISTS_AUTO_NONE );

            // recommendations
            if ( listResult.friends.rating === results.BAD || listResult.friends.rating === results.VERYBAD ) {
                this.recommendationsHelper.friend = true;
            }
            if ( listResult.user.details.length === 0 ) this.recommendationsHelper.lists_create = true;

            return {
                result_text: {
                    friends: resultForFriends,
                    user:    resultForUser,
                    auto:    resultForAuto
                },
                details:     _.union( listResult.friends.details, listResult.user.details, listResult.auto.details )
            };

        },

        _resultItems: function()
        {
            var itemResult = this.listguessView._resultItems(),
                ns = pc.view.ResultView;

            // result texts
            var resultForLists =
                itemResult.individual.has_lists ? $.t( ns.LANG_ITEMS_LISTS_YES )
                    : $.t( ns.LANG_ITEMS_LISTS_NO );

            var resultForPublic =
                itemResult.public.details.length > 0 ? $.t( ns.LANG_ITEMS_PUBLIC_YES )
                    : $.t( ns.LANG_ITEMS_PUBLIC_NO );

            // recommendations
            if ( !itemResult.individual.has_lists ) this.recommendationsHelper.lists_use = true;
            if ( !itemResult.individual.has_lists ) this.recommendationsHelper.sharing = true;
            if ( itemResult.public.details.length > 0 ) {
                this.recommendationsHelper.defaults = true;
                this.recommendationsHelper.hide_past = true;
            }

            return {
                result_text: {
                    lists:   resultForLists,
                    public:  resultForPublic
                },
                details:     _.union( itemResult.individual.details, itemResult.public.details )
            };

        },

        _resultHangman: function()
        {
            var hangmanResult = this.hangmanView._resultHangman(),
                results = pc.view.HangmanView.Rating,
                ns = pc.view.ResultView,
                points = hangmanResult.totals.points;

            var resultText =
                hangmanResult.totals.overall === results.VERYGOOD ? $.t( ns.LANG_HANGMAN_VERYGOOD, {points: points} ) :
                hangmanResult.totals.overall === results.GOOD ? $.t( ns.LANG_HANGMAN_GOOD, {points: points} ) :
                hangmanResult.totals.overall === results.BAD ? $.t( ns.LANG_HANGMAN_BAD, {points: points} ) :
                $.t( ns.LANG_HANGMAN_VERYBAD, {points: points} );

            // recommendations
            if ( hangmanResult.totals.overall <= results.BAD || hangmanResult.totals.overall <= results.VERYBAD ) {
                this.recommendationsHelper.friend = true;
            }

            this.recommendationsHelper.publish_items = true;

            return {
                result_text: resultText,
                details:     hangmanResult.results
            };

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

        LANG_LISTS_AUTO_VERYGOOD: "app.results.lists.user_verygood",
        LANG_LISTS_AUTO_GOOD:     "app.results.lists.user_good",
        LANG_LISTS_AUTO_BAD:      "app.results.lists.user_bad",
        LANG_LISTS_AUTO_VERYBAD:  "app.results.lists.user_verybad",
        LANG_LISTS_AUTO_NONE:     "app.results.lists.user_none",

        LANG_ITEMS_LISTS_YES: "app.results.items.lists_yes",
        LANG_ITEMS_LISTS_NO:  "app.results.items.lists_no",

        LANG_ITEMS_PUBLIC_YES: "app.results.items.public_yes",
        LANG_ITEMS_PUBLIC_NO:  "app.results.items.public_no",

        LANG_HANGMAN_VERYGOOD: "app.results.hangman.verygood",
        LANG_HANGMAN_GOOD:     "app.results.hangman.good",
        LANG_HANGMAN_BAD:      "app.results.hangman.bad",
        LANG_HANGMAN_VERYBAD:  "app.results.hangman.verybad"

    } );

})();