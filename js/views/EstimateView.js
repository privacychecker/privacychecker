(function()
{
    "use strict";
    var ns = namespace( "pc.view" );

    ns.EstimateView = Backbone.View.extend( {

        ITEM_PLACEHOLDER_ID: "div#entity",
        RESPONSE_FIELD_ID:   "input#response",
        PROGRESS_ID:         "div#guess2-progress",

        LANG_GUESS_WRONG:   'app.entityguess.guess_results.wrong',
        LANG_GUESS_CORRECT: 'app.entityguess.guess_results.correct',

        FOF_LOWER_NUMBER: 100,
        FOF_UPPER_NUMBER: 200,
        ALL_UPPER_NUMBER: 1000000000,

        template: pc.template.EstimateTemplate,

        initialize: function()
        {
            console.log( "[ListGuessView] Init: EstimateView" );
            this.currentQuestion = undefined;
        },

        render: function()
        {
            this.$el.html( this.template() );

            this.player = pc.model.FacebookPlayer.getInstance();

            this.questions = [];

            _.each( pc.model.TestData.getInstance().get( 'data' ), _.bind( function( item )
            {

                if ( item instanceof pc.model.FacebookPicture || item instanceof pc.model.FacebookStatus ) {
                    try {
                        var range = this._getThreashold( item );
                        this.questions.push( {
                            range: range,
                            item:  item
                        } );
                    }
                    catch ( e ) {
                        console.error( "Caught exception while creating item: ", e );
                    }
                }
                else {
                    console.error( "Unknown item for guess game:", item.constructor.name );
                    throw "E_UNKNOWN_ITEM";
                }

            }, this ) );

            this.questionsLength = this.questions.length;
            this.askedQuestions = 0;

            // add events to button and input field
            this.keypressCb = _.bind( function( e )
            {
                if ( (e.keyCode || e.which) === 13 ) {
                    e.preventDefault();
                    if ( this._evaluateResponse() ) {
                        this.next();
                    }
                }
            }, this );

            console.debug( '[EstimateView] ' + this.questions.length + " entities to show" );

            // trigger first question
            this.next();

            return this;
        },

        next: function()
        {

            // shift a question from array
            this.currentQuestion = this.questions.shift();

            // if current question is null the question array is empty and we've asked all questions
            if ( this.currentQuestion === undefined ) {
                this.$el.find( pc.view.EstimateView.RESPONSE_FIELD_ID ).unbind( 'keypress',
                    this.keypressCb ).prop( 'disabled', true );
                this.$el.find( pc.view.EstimateView.ENTER_FIELD_ID ).unbind( 'click' ).prop( 'disabled', true );

                console.debug( '[EstimateView] Game finished' );
                this.trigger( 'estimateview:done' );
                return;
            }

            console.debug( '[EstimateView] Current entity: ', this.currentQuestion );
            var item = this.currentQuestion.item;

            // prepare new image
            this.$el.find( pc.view.EstimateView.RESPONSE_FIELD_ID ).val( '' ).prop( 'disabled' );
            this.$el.find( pc.view.EstimateView.ENTER_FIELD_ID ).prop( 'disabled' );
            this.$el.find( pc.view.EstimateView.ITEM_CONTAINER ).fadeOut( 'fast', _.bind( function()
            {

                // show image
                this.$el
                    .find( pc.view.EstimateView.ITEM_CONTAINER )
                    .empty()
                    .append( this._createObject( item ) )
                    .fadeIn( 'fast' );

                // reenable button and input field
                this.$el.find( pc.view.EstimateView.RESPONSE_FIELD_ID )
                    .removeProp( 'disabled' )
                    .keypress( this.keypressCb );

                this.$el.find( pc.view.EstimateView.ENTER_FIELD_ID )
                    .removeProp( 'disabled' )
                    .click( _.bind( function()
                    {
                        if ( this._evaluateResponse() ) {
                            this.next();
                        }
                    }, this ) );

                // we have successfully asked this question
                this.askedQuestions++;

            }, this ) );

        },

        _evaluateResponse: function()
        {

            var $el = this.$el.find( pc.view.EstimateView.RESPONSE_FIELD_ID ).first();
            var response = $el.val();
            // _evaluateResponse is triggered when switch to hangmanview, no clue why
            if ( this.currentQuestion === undefined ) {
                return false;
            }
            // hide old tooltips
            $el.parent().popover( 'destroy' );

            var item = this.currentQuestion.item;

            // validate
            var responseI = parseInt( response, 10 );
            if ( !$.isNumeric( response ) || responseI < 0 ) {
                console.debug( "[EstimateView] Input is not valid" );

                $el.parent().popover( {
                    "content":   $.t( pc.view.EstimateView.LANG_NO_NUMERIC ),
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
                was:  this.currentQuestion.range,
                type: pc.model.TestResult.Type.ENTITYGUESS,
                item: item
            } );

            console.debug( '[EstimateView] Question result was ', result );

            this.player.get( 'results' ).add( result );

            // question answered do progress
            pc.common.ProgressBar.getInstance().subto( this.askedQuestions, this.questionsLength );

            return true;

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

            console.warn( "[EstimateView] Invalid object to use" );
            return null;

        },

        _getThreashold: function( item )
        {

            var upper;
            var lower;

            var privacy = item.get( 'privacy' );

            switch ( privacy.get( 'level' ) ) {

                case pc.common.PrivacyDefinition.Level.ALL:
                    upper = this.ALL_UPPER_NUMBER;
                    lower = pc.model.FacebookPlayer.getInstance().getFriends().length * this.FOF_UPPER_NUMBER;
                    break;

                case pc.common.PrivacyDefinition.Level.FOF:
                    upper = pc.model.FacebookPlayer.getInstance().getFriends().length * this.FOF_UPPER_NUMBER;
                    lower = pc.model.FacebookPlayer.getInstance().getFriends().length * this.FOF_LOWER_NUMBER;

                    upper -= privacy.get( 'exclude' ).length * this.FOF_UPPER_NUMBER;
                    lower -= privacy.get( 'exclude' ).length * this.FOF_LOWER_NUMBER;

                    upper += privacy.get( 'include' ).length * this.FOF_UPPER_NUMBER;
                    lower += privacy.get( 'include' ).length * this.FOF_LOWER_NUMBER;

                    break;

                case pc.common.PrivacyDefinition.Level.FRIENDS:
                    upper = pc.model.FacebookPlayer.getInstance().getFriends().length + 1;
                    lower = pc.model.FacebookPlayer.getInstance().getFriends().length + 1;

                    upper -= privacy.get( 'exclude' ).length;
                    lower -= privacy.get( 'exclude' ).length;

                    upper += privacy.get( 'include' ).length;
                    lower += privacy.get( 'include' ).length;

                    break;

                case pc.common.PrivacyDefinition.Level.ME:
                case pc.common.PrivacyDefinition.Level.CUSTOM:
                    upper = 1;
                    lower = 1;

                    upper += privacy.get( 'include' ).length;
                    lower += privacy.get( 'include' ).length;

                    break;

                case pc.common.PrivacyDefinition.Level.NOBODY:
                    upper = 0;
                    lower = 0;

                    break;

                default:
                    console.error( "Invalid privacy type: " + privacy.get( 'level' ) );
                    throw new Error( {message: "Invalid privacy type: " + privacy.get( 'level' )} );
            }

            var range = new pc.common.Range( {
                lower: lower,
                upper: upper
            } );
            range.set( 'type', privacy.get( 'level' ) );

            return range;

        }

    }, {

        ITEM_CONTAINER:    ".item",
        RESPONSE_FIELD_ID: "input.response",
        ENTER_FIELD_ID:    "button[type=submit]",

        LANG_NO_NUMERIC: "app.estimate.no_number"

    } );

})();