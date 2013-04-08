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
            $( this.el ).html( this.template() );

            this.container = $( '<img>', {
                src:         'img/loader.gif',
                crossOrigin: ''
            } ).css( {
                    display:  'none',
                    position: 'absolute',
                    left:     '0px',
                    top:      '0px'
                } );
            $( 'body' ).append( this.container );

            this.player = pc.model.FacebookPlayer.getInstance();

            this.questions = [];

            _.each( pc.model.TestData.getInstance().get( 'data' ), _.bind( function( item )
            {

                if ( item instanceof pc.model.FacebookPicture ) {
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
                    console.error( "Unknown item for guess game" );
                    throw new Error( {message: "Unknown item for guess game"} );
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
                $( this.el ).find( pc.view.EstimateView.RESPONSE_FIELD_ID ).unbind( 'keypress',
                    this.keypressCb ).prop( 'disabled', true );
                $( this.el ).find( pc.view.EstimateView.ENTER_FIELD_ID ).unbind( 'click' ).prop( 'disabled', true );

                console.debug( '[EstimateView] Game finished' );
                this.trigger( 'estimateview:done' );
                return;
            }

            console.debug( '[EstimateView] Current entity: ', this.currentQuestion );
            var item = this.currentQuestion.item;

            // prepare new image
            $( this.el ).find( pc.view.EstimateView.RESPONSE_FIELD_ID ).val( '' ).prop( 'disabled', true );
            $( this.el ).find( pc.view.EstimateView.ENTER_FIELD_ID ).prop( 'disabled', true );
            $( this.el ).find( pc.view.EstimateView.IMAGE_CONTAINER + ' ' + pc.view.EstimateView.INFO_CONTAINER ).fadeOut( 'fast' );
            $( this.el ).find( pc.view.EstimateView.IMAGE_CONTAINER ).unbind( 'click' ).fadeOut( 'fast',
                _.bind( function()
                {

                    //$(this.el).find(EstimateView.IMAGE_CONTAINER + ' img').attr('src', EstimateView.LOADER_GIF_SRC);
                    //$(this.el).find(EstimateView.IMAGE_CONTAINER).fadeIn('fast');

                    $( this.container ).attr( 'src', item.get( 'source' ) ).bind( 'load', _.bind( function( event )
                    {

                        // remove load event
                        $( this.container ).unbind();

                        // image is now loaded, replace and add events
                        $( this.el ).find( pc.view.EstimateView.IMAGE_CONTAINER ).unbind( 'click' ).fadeOut( 'fast',
                            _.bind( function()
                            {

                                // clear container and set name
                                $( this.el ).find( pc.view.EstimateView.IMAGE_CONTAINER + ' ' + pc.view.EstimateView.INFO_CONTAINER )
                                    .empty()
                                    .html( item.get( 'name' ) )
                                    .fadeIn( 'fast' );

                                // finally change image to correct one
                                $( this.el ).find( pc.view.EstimateView.IMAGE_CONTAINER + ' img' ).
                                    attr( 'src', item.get( 'source' ) );

                                // show polaroid
                                $( this.el ).find( pc.view.EstimateView.IMAGE_CONTAINER ).fadeIn( 'fast' );

                                // reenable button and input field
                                $( this.el ).find( pc.view.EstimateView.RESPONSE_FIELD_ID ).prop( 'disabled',
                                    false ).keypress( this.keypressCb );
                                $( this.el ).find( pc.view.EstimateView.ENTER_FIELD_ID ).prop( 'disabled',
                                        false ).click( _.bind( function()
                                    {
                                        if ( this._evaluateResponse() ) {
                                            this.next();
                                        }
                                    }, this ) );

                                // we have successfully asked this question
                                this.askedQuestions++;
                            }, this ) );
                    }, this ) );
                }, this ) );

        },

        _evaluateResponse: function()
        {

            var response = $( this.el ).find( pc.view.EstimateView.RESPONSE_FIELD_ID ).val();
            // _evaluateResponse is triggered when switch to hangmanview, no clue why
            if ( this.currentQuestion === undefined ) {
                return;
            }

            var correctV = this.currentQuestion.is;
            var item = this.currentQuestion.item;

            if ( !$.isNumeric( response ) ) {
                return false;
            }

            var responseI = parseInt( response, 10 );

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

        _createObject: function( question )
        {

            var item = question.item;

            if ( item instanceof pc.model.FacebookPicture ) {

                return $( '<img>', {
                    src:     item.get( 'source' ),
                    title:   item.get( 'name' ),
                    'class': 'img-rounded'
                } ).click( _.bind( function()
                    {
                        this.next();
                    }, this ) );

            }
            //            else if ( item instanceof pc.model.FacebookPost ) {
            //
            //            }

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

        IMAGE_CONTAINER:   ".image",
        INFO_CONTAINER:    ".title",
        RESPONSE_FIELD_ID: "input.response",
        ENTER_FIELD_ID:    "button[type=submit]",

        LOADER_GIF_SRC: 'img/loader.gif'

    } );

})();