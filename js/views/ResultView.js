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
                listResult.friends.rating === results.GOOD ? $.t( ns.LANG_LISTS_FRIENDS_GOOD )
                    : $.t( ns.LANG_LISTS_FRIENDS_BAD );

            var resultForUser =
                listResult.user.rating === results.GOOD ? $.t( ns.LANG_LISTS_USER_GOOD )
                    : listResult.user.rating === results.BAD ? $.t( ns.LANG_LISTS_USER_BAD )
                    : $.t( ns.LANG_LISTS_USER_NONE );

            var resultForAuto =
                listResult.auto.rating === results.GOOD ? $.t( ns.LANG_LISTS_AUTO_GOOD )
                    : listResult.auto.rating === results.BAD ? $.t( ns.LANG_LISTS_AUTO_BAD )
                    : $.t( ns.LANG_LISTS_USER_NONE );

            // recommendations
            if ( listResult.friends.rating === results.BAD ) this.recommendationsHelper.friend = true;
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
                itemResult.lists.details.length > 0 ? $.t( ns.LANG_ITEMS_LISTS_YES )
                    : $.t( ns.LANG_ITEMS_LISTS_NO );

            var resultForUsers =
                itemResult.users.details.length > 0 ? $.t( ns.LANG_ITEMS_FRIENDS_YES )
                    : $.t( ns.LANG_ITEMS_FRIENDS_NO );

            var resultForPublic =
                itemResult.public.details.length > 0 ? $.t( ns.LANG_ITEMS_PUBLIC_YES )
                    : $.t( ns.LANG_ITEMS_PUBLIC_NO );

            // recommendations
            if ( itemResult.lists.details.length === 0 ) this.recommendationsHelper.lists_use = true;
            if ( itemResult.users.details.length === 0 ) this.recommendationsHelper.sharing = true;
            if ( itemResult.public.details.length > 0 ) {
                this.recommendationsHelper.defaults = true;
                this.recommendationsHelper.hide_past = true;
            }

            return {
                result_text: {
                    lists:   resultForLists,
                    friends: resultForUsers,
                    public:  resultForPublic
                },
                details:     _.union( itemResult.lists.details, itemResult.users.details, itemResult.public.details )
            };

        },

        _resultHangman: function()
        {
            var hangmanResult = this.hangmanView._resultHangman(),
                ns = pc.view.ResultView;

            var resultText =
                hangmanResult.totals.points > ns.HANGMAN_BAD_START ?
                $.t( ns.LANG_HANGMAN_GOOD, {points: hangmanResult.totals.points} )
                    : $.t( ns.LANG_HANGMAN_BAD, {points: hangmanResult.totals.points} );

            // recommendations
            if ( hangmanResult.totals.points <= ns.HANGMAN_BAD_START ) this.recommendationsHelper.friend = true;

            this.recommendationsHelper.publish_items = true;

            return {
                result_text: resultText,
                details:     hangmanResult.results
            };

        }

    }, {

        LANG_LISTS_FRIENDS_GOOD: "app.results.lists.friend_good",
        LANG_LISTS_FRIENDS_BAD:  "app.results.lists.friend_bad",

        LANG_LISTS_USER_GOOD: "app.results.lists.user_good",
        LANG_LISTS_USER_BAD:  "app.results.lists.user_bad",
        LANG_LISTS_USER_NONE: "app.results.lists.user_none",

        LANG_LISTS_AUTO_GOOD: "app.results.lists.user_good",
        LANG_LISTS_AUTO_BAD:  "app.results.lists.user_bad",
        LANG_LISTS_AUTO_NONE: "app.results.lists.user_none",

        LANG_ITEMS_LISTS_YES: "app.results.items.lists_yes",
        LANG_ITEMS_LISTS_NO:  "app.results.items.lists_no",

        LANG_ITEMS_FRIENDS_YES: "app.results.items.friends_yes",
        LANG_ITEMS_FRIENDS_NO:  "app.results.items.friends_no",

        LANG_ITEMS_PUBLIC_YES: "app.results.items.public_yes",
        LANG_ITEMS_PUBLIC_NO:  "app.results.items.public_no",

        LANG_HANGMAN_BAD:  "app.results.hangman.good",
        LANG_HANGMAN_GOOD: "app.results.hangman.bad",

        HANGMAN_BAD_START: 20000

    } );

})();