(function()
{
    "use strict";

    var ns = namespace( "pc.view" );

    ns.ListGuessView = Backbone.View.extend( {

        template: pc.template.GuessTemplate,

        initialize: function()
        {
            console.log( "[ListGuessView] Init: ListGuessView" );
            this.currentQuestion = undefined;
        },

        render: function()
        {
            this.$el.html( this.template() );

            this.player = pc.model.FacebookPlayer.getInstance();

            this.questions = [];

            this.questions.push( {
                type: pc.view.ListGuessView.QuestionType.ALL,
                is:   this.player.getFriends().length,
                name: 'Freunde'
            } );

            var lists = this.player.getFriendLists();
            var seenLists = [];

            while ( seenLists.length < pc.view.ListGuessView.MAX_QUESTIONS ) {
                // no more lists
                if ( seenLists.length === lists.length ) {
                    break;
                }

                var list = lists.at( $.randomBetween( 0, lists.length ) );
                if ( list === undefined || _.contains( seenLists, list ) ) {
                    continue;
                }

                this.questions.push( {
                    type: pc.view.ListGuessView.QuestionType.LIST,
                    is:   list.get( 'members' ).length,
                    name: list.get( 'name' )
                } );
                seenLists.push( list );
            }

            //this.player.getFriendLists().each( _.bind( function()
            //{
            //    if ( this.questions.length + 1 > this.MAX_QUESTIONS ) return;
            //}, this ) );

            this.questionsLength = this.questions.length;
            this.askedQuestions = 0;

            this.keypressCb = _.bind( function( e )
            {
                if ( (e.keyCode || e.which) === 13 ) {
                    e.preventDefault();
                    if ( this._evaluateResponse() ) {
                        this.next();
                    }
                }
            }, this );

            this.$el.find( pc.view.ListGuessView.RESPONSE_FIELD_ID ).keypress( this.keypressCb );
            this.$el.find( pc.view.ListGuessView.ENTER_FIELD_ID ).click( _.bind( function()
            {
                if ( this._evaluateResponse() ) {
                    this.next();
                }
            }, this ) );

            console.debug( '[ListGuessView] ' + this.questions.length + " questions" );

            this.next();

            return this;
        },

        next: function()
        {

            this.currentQuestion = this.questions.shift();

            if ( this.currentQuestion === undefined ) {
                this.$el.find( pc.view.ListGuessView.RESPONSE_FIELD_ID ).unbind( 'keypress',
                    this.keypressCb ).prop( 'disabled', true );
                this.$el.find( pc.view.ListGuessView.ENTER_FIELD_ID ).unbind( 'click' ).prop( 'disabled', true );

                console.debug( '[ListGuessView] Game finished' );
                this.trigger( 'listguessview:done' );
                return;
            }

            var questionText = null;
            switch ( this.currentQuestion.type ) {
                case pc.view.ListGuessView.QuestionType.ALL:
                    questionText = i18n.t( pc.view.ListGuessView.LANG_QUESTION_FRIEND );
                    break;
                case pc.view.ListGuessView.QuestionType.LIST:
                    questionText = i18n.t( pc.view.ListGuessView.LANG_QUESTION_LIST, {
                        listname: this.currentQuestion.name
                    } );
                    break;
            }

            console.debug( '[ListGuessView] Current question: ' + questionText );

            this.$el.fadeOut( 'fast', _.bind( function()
            {
                this.$el.find( pc.view.ListGuessView.QUESTION_FIELD_ID ).empty().html( questionText );
                this.$el.find( pc.view.ListGuessView.RESPONSE_FIELD_ID ).val( '' );
                this.$el.fadeIn( 'fast' );
                this.askedQuestions++;
            }, this ) );

        },

        _evaluateResponse: function()
        {

            var $el = this.$el.find( pc.view.EstimateView.RESPONSE_FIELD_ID ).first();
            var response = $el.val();
            var correctV = this.currentQuestion.is;

            // hide old tooltips
            $el.parent().popover( 'destroy' );

            // validate
            var responseI = parseInt( response, 10 );
            if ( !$.isNumeric( response ) || responseI < 0 ) {
                console.debug( "[SelectView] Input is not valid" );

                $el.parent().popover( {
                    "content":     $.t( pc.view.ListGuessView.LANG_NO_NUMERIC ),
                    "placement": "right"
                } ).popover( "show" );

                window.setTimeout( _.bind( function()
                {
                    $el.parent().popover( 'destroy' );
                }, this ), 4000 );

                return false;
            }

            var result = new pc.model.TestResult( {
                is:   responseI,
                was:  correctV,
                type: pc.model.TestResult.Type.LISTGUESS
            } );

            console.debug( '[ListGuessView] Question result was ', result );

            this.player.get( 'results' ).add( result );
            pc.common.ProgressBar.getInstance().subto( this.askedQuestions, this.questionsLength );

            return true;

        }

    }, {

        QUESTION_FIELD_ID: "h1.question",
        RESPONSE_FIELD_ID: "input.response",
        ENTER_FIELD_ID:    "button[type=submit]",

        LANG_QUESTION_FRIEND: "app.guess.question_friends",
        LANG_QUESTION_LIST:   "app.guess.question_list",
        LANG_NO_NUMERIC:      "app.guess.no_number",

        MAX_QUESTIONS: 5,

        QuestionType: {
            ALL: 0, LIST: 1
        }
    } );

})();