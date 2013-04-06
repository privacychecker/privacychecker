(function()
{
    "use strict";

    var ns = namespace( "pc.view" );

    ns.ResultView = Backbone.View.extend( {

        template: pc.template.ResultTemplate,

        initialize: function()
        {
            console.log( "[ResultView] Init" );

            this.player = pc.model.FacebookPlayer.getInstance();
            this.results = this.player.get( 'results' );
        },

        render: function()
        {
            $( this.el ).html( this.template() );

            return this;
        },

        renderResults: function()
        {

            console.log( '[ResultView] Rendering results..' );

            this.createResultsGame1();
            this.createResultsGame2();
            this.createResultsGame3();

            console.log( '[ResultView] Rendering results done' );

            pc.common.ProgressBar.getInstance().subto( 1, 1 );

        },

        createResultsGame1: function()
        {

            var results = this.results.where( { type: pc.model.TestResult.Type.LISTGUESS } );
            console.log( '[ResultView] Results for Game #1:', results );

            var numQ = results.length;
            var numE = results.length;

            _.each( results, function( result )
            {
                if ( result.get( 'is' ) !== result.get( 'was' ) ) numE--;
            } );

            var advice, summerize;
            if ( numE / numQ > pc.view.ResultView.GOOD_RANGE ) {
                summerize = i18n.t( pc.view.ResultView.LANG_GAME1_PREFIX + pc.view.ResultView.LANG_GOOD_PREFIX + pc.view.ResultView.LANG_SUMMERIZE );
                advice = i18n.t( pc.view.ResultView.LANG_GAME1_PREFIX + pc.view.ResultView.LANG_GOOD_PREFIX + pc.view.ResultView.LANG_ADVICE );
            }
            else if ( numE / numQ < pc.view.ResultView.BAD_RANGE ) {
                summerize = i18n.t( pc.view.ResultView.LANG_GAME1_PREFIX + pc.view.ResultView.LANG_BAD_PREFIX + pc.view.ResultView.LANG_SUMMERIZE );
                advice = i18n.t( pc.view.ResultView.LANG_GAME1_PREFIX + pc.view.ResultView.LANG_BAD_PREFIX + pc.view.ResultView.LANG_ADVICE );
            }
            else {
                summerize = i18n.t( pc.view.ResultView.LANG_GAME1_PREFIX + pc.view.ResultView.LANG_NEUTRAL_PREFIX + pc.view.ResultView.LANG_SUMMERIZE );
                advice = i18n.t( pc.view.ResultView.LANG_GAME1_PREFIX + pc.view.ResultView.LANG_NEUTRAL_PREFIX + pc.view.ResultView.LANG_ADVICE );
            }

            $( this.el ).find( pc.view.ResultView.GAME_1_SELECTOR_SUMMERIZE ).empty().html( summerize );
            $( this.el ).find( pc.view.ResultView.GAME_1_SELECTOR_ADVICE ).empty().html( advice );

        },

        createResultsGame2: function()
        {

            var results = this.results.where( { type: pc.model.TestResult.Type.ENTITYGUESS } );
            console.log( '[ResultView] Results for Game #1:', results );

            var numQ = results.length;
            var numE = results.length;

            _.each( results, function( result )
            {
                if ( !result.get( 'was' ).inRange( result.get( 'is' ) ) ) numE--;
            } );

            var advice, summerize;
            if ( numE / numQ > pc.view.ResultView.GOOD_RANGE ) {
                summerize = i18n.t( pc.view.ResultView.LANG_GAME2_PREFIX + pc.view.ResultView.LANG_GOOD_PREFIX + pc.view.ResultView.LANG_SUMMERIZE );
                advice = i18n.t( pc.view.ResultView.LANG_GAME2_PREFIX + pc.view.ResultView.LANG_GOOD_PREFIX + pc.view.ResultView.LANG_ADVICE );
            }
            else {
                summerize = i18n.t( pc.view.ResultView.LANG_GAME2_PREFIX + pc.view.ResultView.LANG_BAD_PREFIX + pc.view.ResultView.LANG_SUMMERIZE );
                advice = i18n.t( pc.view.ResultView.LANG_GAME2_PREFIX + pc.view.ResultView.LANG_BAD_PREFIX + pc.view.ResultView.LANG_ADVICE );
            }

            $( this.el ).find( pc.view.ResultView.GAME_2_SELECTOR_SUMMERIZE ).empty().html( summerize );
            $( this.el ).find( pc.view.ResultView.GAME_2_SELECTOR_ADVICE ).empty().html( advice );

        },

        createResultsGame3: function()
        {

            var results = this.results.where( { type: pc.model.TestResult.Type.HANGMAN } );
            console.log( '[ResultView] Results for Game #1:', results );

            var numQ = results.length;
            var numE = results.length;
            var numW = results.length;

            _.each( results, function( result )
            {
                if ( result.get( 'was' ) === pc.view.HangmanView.RESULT.LOST ) numE--;
                if ( result.get( 'is' ).item.get( 'privacy' ).get( 'level' ) === pc.common.PrivacyDefinition.Level.FOF ||
                    result.get( 'is' ).item.get( 'privacy' ).get( 'level' ) === pc.common.PrivacyDefinition.Level.ALL ) {
                    numW--;
                }
            } );

            var advice, summerize;
            if ( numW / numQ < pc.view.GOOD_RANGE ) {
                summerize = i18n.t( pc.view.ResultView.LANG_GAME3_PREFIX + pc.view.ResultView.LANG_BAD_PREFIX + pc.view.ResultView.LANG_SUMMERIZE );
                advice = i18n.t( pc.view.ResultView.LANG_GAME3_PREFIX + pc.view.ResultView.LANG_BAD_PREFIX + pc.view.ResultView.LANG_ADVICE );
            }
            else {
                summerize = i18n.t( pc.view.ResultView.LANG_GAME3_PREFIX + pc.view.ResultView.LANG_GOOD_PREFIX + pc.view.ResultView.LANG_SUMMERIZE );
                advice = i18n.t( pc.view.ResultView.LANG_GAME3_PREFIX + pc.view.ResultView.LANG_GOOD_PREFIX + pc.view.ResultView.LANG_ADVICE );
            }

            $( this.el ).find( pc.view.ResultView.GAME_3_SELECTOR_SUMMERIZE ).empty().html( summerize );
            $( this.el ).find( pc.view.ResultView.GAME_3_SELECTOR_ADVICE ).empty().html( advice );

            if ( numE / numQ < pc.view.ResultView.GOOD_RANGE ) {
                $( this.el ).find( pc.view.ResultView.GAME_3_SELECTOR_ADVICE ).append( i18n.t( pc.view.ResultView.LANG_GAME3_PREFIX + pc.view.ResultView.LANG_LOST_PREFIX ) );
            }

        }

    }, {

        GOOD_RANGE:     0.7,
        BAD_RANGE:      0.3,
        WARN_THREESOLD: 0.25,

        LANG_GOOD_PREFIX:    ".good",
        LANG_NEUTRAL_PREFIX: ".neutral",
        LANG_BAD_PREFIX:     ".bad",
        LANG_LOST_PREFIX:    ".lost",

        LANG_SUMMERIZE: ".summerize",
        LANG_ADVICE:    ".advice",

        LANG_GAME1_PREFIX: "app.results.game1",
        LANG_GAME2_PREFIX: "app.results.game2",
        LANG_GAME3_PREFIX: "app.results.game3",

        GAME_1_SELECTOR_SUMMERIZE: ".guess-result .summerize",
        GAME_1_SELECTOR_ADVICE:    ".guess-result .advice",
        GAME_2_SELECTOR_SUMMERIZE: ".estimate-result .summerize",
        GAME_2_SELECTOR_ADVICE:    ".estimate-result .advice",
        GAME_3_SELECTOR_SUMMERIZE: ".hangman-result .summerize",
        GAME_3_SELECTOR_ADVICE:    ".hangman-result .advice"

    } );

})();