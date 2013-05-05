(function()
{
    "use strict";

    var ns = namespace( "pc.view" );

    /**
     * First game.<br />
     * This game has two steps:
     * <ul>
     *     <li>Ask questions about lists, user has to guess the correct number</li>
     *     <li>Show a item and ask the user to say how many people can see it</li>
     * </ul>
     *
     * @namespace pc.view
     * @class ListGuessView
     * @extends Backbone.Model
     *
     * @events done gametype Triggered when a game is done
     */
    ns.ListGuessView = Backbone.View.extend( {

            templateGame:   pc.template.GuessGameTemplate,
            templateResult: pc.template.GuessResultTemplate,
            templateItems:  pc.template.GuessGameItemsTemplate,

            initialize: function()
            {
                console.log( "[ListGuessView] Init: ListGuessView" );
                this.currentQuestion = undefined;
                this.questions = [];
                this.results = [];
            },

            render: function()
            {
                // render container
                this.$el.html( this.templateGame() );

                // collect Questions
                this._collect();
                console.info( "[ListGuessView] Selected the following lists for game:", this.questions );

                // ask first
                this.ask();
            },

            ask: function()
            {

                var container = this.$el.find( '.container' ).first();

                container.fadeOut( 'fast', _.bind( function()
                {

                    // clear container from last question
                    container.empty();

                    // ask next question by simply shifting
                    this.currentQuestion = this.questions.shift();
                    if ( _.isUndefined( this.currentQuestion ) ) {
                        console.info( "[ListGuessView] No more questions to ask, showing result" );
                        this.result();
                        return;
                    }

                    // what kind of question we're asking?

                    var type = this.currentQuestion.type,
                        item = this.currentQuestion.item,
                        options = {};

                    switch ( type ) {
                        case pc.view.ListGuessView.QuestionType.ALL:
                        case  pc.view.ListGuessView.QuestionType.AUTO_LIST:
                        case  pc.view.ListGuessView.QuestionType.USER_LIST:
                            options = this._prepareListForTemplate( item, type );
                            break;

                        case  pc.view.ListGuessView.QuestionType.ITEM:
                            options = this._prepareItemForTemplate( item );
                            break;
                    }

                    container.append( this.templateItems( options ) );

                    container.find( "form" ).submit( _.bind( function( event )
                    {
                        event.preventDefault();
                        console.debug( "[ListGuessView] User wants to answer" );
                        this._evaluateResponseCb();
                    }, this ) );

                    container.find( ".warning" ).hide();

                    container.fadeIn( 'fast' );

                }, this ) );

            },

            result: function()
            {
                var options = {};

                options.lists = this._resultLists();

                console.debug( "[ListGuessView] Rending result view with options", options );
                // render container
                this.$el.fadeOut( _.bind( function()
                {
                    this.$el.html( this.templateResult( options ) ).fadeIn();
                    this.$el.find( ".collapse" ).collapse();
                }, this ) );

            },

            _collect: function()
            {
                var player = pc.model.FacebookPlayer.getInstance(),
                    autoLists = player.getFriendLists().where( { type: pc.model.FacebookList.Type.AUTO } ),
                    userLists = player.getFriendLists().where( { type: pc.model.FacebookList.Type.USER } ),
                    itemsFromTestData = pc.model.TestData.getInstance().get( 'data' ),
                    usedUserLists = 0,
                    usedAutoLists = 0,
                    alreadyUsedLists = [],
                    toPick = pc.view.ListGuessView.MAX_QUESTIONS,
                    pickedListItem,
                    pickedListType;

                // first question is always how many friends a user has
                var question = {
                    item:    new pc.model.FacebookList( {
                        name:    $.t( pc.view.ListGuessView.LANG_FRIENDS ),
                        id:      0,
                        type:    pc.model.FacebookList.Type.AUTO,
                        members: player.getFriends()
                    } ),
                    type:    pc.view.ListGuessView.QuestionType.ALL,
                    correct: player.getFriends().length
                };

                this.questions.push( question );

                // make sure we have enough
                if ( toPick > autoLists.length + userLists.length ) toPick = autoLists.length + userLists.length;

                // randomly pick
                while ( toPick !== this.questions.length ) {

                    pickedListItem = undefined;
                    pickedListType = undefined;

                    // coinflip = 1 -> autoList
                    if ( ( _.random( 1 ) && usedAutoLists < autoLists.length) || usedUserLists >= userLists.length ) {

                        pickedListItem = autoLists[ _.random( autoLists.length ) ];
                        pickedListType = pc.view.ListGuessView.QuestionType.AUTO_LIST;
                        usedAutoLists++;

                    }
                    else if ( usedUserLists < userLists.length ) {

                        pickedListItem = userLists[ _.random( userLists.length ) ];
                        pickedListType = pc.view.ListGuessView.QuestionType.USER_LIST;
                        usedUserLists++;

                    }

                    if ( !_.isUndefined( pickedListItem ) && !_.contains( alreadyUsedLists, pickedListItem ) ) {
                        this.questions.push( {
                            item:    pickedListItem,
                            type:    pickedListType,
                            correct: pickedListItem.get( 'members' ).length
                        } );
                        alreadyUsedLists.push( pickedListItem );
                    }

                }
                // add status or images from testdata
                _.each( itemsFromTestData, _.bind( function( item )
                {
                    var correctValue = this._getVisibilityValueForItem( item );

                    this.questions.push( {
                        item:    item,
                        type:    pc.view.ListGuessView.QuestionType.ITEM,
                        correct: correctValue
                    } );
                }, this ) );

            },

            _prepareListForTemplate: function( list, type )
            {

                var name = list.get( 'name' ),
                    question;

                // form the question
                switch ( type ) {

                    case pc.view.ListGuessView.QuestionType.ALL:
                        question = $.t( pc.view.ListGuessView.LANG_QUESTION_FRIENDS );
                        break;

                    case pc.view.ListGuessView.QuestionType.AUTO_LIST:
                    case pc.view.ListGuessView.QuestionType.USER_LIST:
                        question = $.t( pc.view.ListGuessView.LANG_QUESTION_LIST, {
                            "listname": name
                        } );
                        break;
                }

                return {
                    "question":   question,
                    "isAutoList": type === pc.view.ListGuessView.QuestionType.AUTO_LIST
                };

            },

            _prepareItemForTemplate: function( item )
            {

                var options = {item: true};

                // form the question
                if ( item instanceof pc.model.FacebookPicture ) {
                    _.extend( options, {
                        picture: {
                            url:     item.get( 'source' ),
                            caption: item.get( 'caption' )
                        }
                    } );
                }
                else if ( item instanceof pc.model.FacebookStatus ) {
                    _.extend( options, {
                        status: {
                            caption:  item.get( 'caption' ),
                            date:     item.get( 'date' ),
                            location: item.get( 'location' )
                        }
                    } );
                }

                return options;
            },

            _evaluateResponseCb: function()
            {

                var container = this.$el.find( '.container' ).first(),
                    userValue = parseInt( container.find( "form > input.response" ).val(), 10 ),
                    correctValue = this.currentQuestion.correct,
                    item = this.currentQuestion.item,
                    type;

                // validate number
                if ( _.isNaN( userValue ) || userValue < 0 ) {
                    console.warn( "[ListGuessView] User value is not a number", userValue );
                    container.find( "form > input.question" ).val( "" );
                    container.find( ".warning" ).fadeIn().delay( pc.view.ListGuessView.HIDE_WARNING_AFTER ).fadeOut();
                    return;
                }

                console.info( "[ListGuessView] Used guessed", userValue, "correct is", correctValue );

                if ( item instanceof pc.model.FacebookPicture || item instanceof pc.model.FacebookStatus ) {
                    type = pc.model.TestResult.Type.ENTITYGUESS;
                }
                else if ( item instanceof pc.model.FacebookList ) type = pc.model.TestResult.Type.LISTGUESS;

                // add result to list
                pc.model.FacebookPlayer.getInstance().get( 'results' ).add( new pc.model.TestResult( {
                    is:      this.currentQuestion,
                    was:     userValue,
                    correct: correctValue,
                    type:    type
                } ) );

                // ask next question
                this.ask();
            },

            _getVisibilityValueForItem: function( item )
            {
                var privacy = item.get( 'privacy' ),
                    level = privacy.get( 'level' ),
                    friends = pc.model.FacebookPlayer.getInstance().getFriends(),
                    visibleFor;

                switch ( level ) {

                    case pc.common.PrivacyDefinition.Level.ALL:
                        visibleFor = Infinity;
                        break;

                    case pc.common.PrivacyDefinition.Level.FOF:
                        visibleFor = friends.length * pc.view.ListGuessView.FOF_MULTIPLIER;

                        visibleFor -= privacy.get( 'exclude' ).length * pc.view.ListGuessView.FOF_MULTIPLIER;
                        visibleFor += privacy.get( 'include' ).length * pc.view.ListGuessView.FOF_MULTIPLIER;

                        break;

                    case pc.common.PrivacyDefinition.Level.FRIENDS:
                        visibleFor = friends.length + 1; // + me

                        visibleFor -= privacy.get( 'exclude' ).length;
                        visibleFor += privacy.get( 'include' ).length;

                        break;

                    case pc.common.PrivacyDefinition.Level.ME:
                    case pc.common.PrivacyDefinition.Level.CUSTOM:
                        visibleFor = 1; // me
                        visibleFor += privacy.get( 'include' ).length;

                        break;

                    case pc.common.PrivacyDefinition.Level.NOBODY:
                        visibleFor = 0;

                        break;

                    default:
                        console.error( "[ListGuessView] Invalid privacy type: " + level );
                        throw "E_INVALID_PRIVACY_TYPE";
                }

                return visibleFor;
            },

            _resultLists: function()
            {
                var player = pc.model.FacebookPlayer.getInstance(),
                    resultForsLists = player.get( 'results' ).where( {type: pc.model.TestResult.Type.LISTGUESS} );

                // get user lists
                var userLists = this._findType( resultForsLists, pc.view.ListGuessView.QuestionType.USER_LIST ),
                    autoLists = this._findType( resultForsLists, pc.view.ListGuessView.QuestionType.AUTO_LIST ),
                    friendLists = this._findType( resultForsLists, pc.view.ListGuessView.QuestionType.ALL );

                console.debug( "[ListGuessView] User lists results:", userLists, "Auto lists results", autoLists,
                    "Friend list result", friendLists );

                // friends
                var friendsDifference = (friendLists[0].get( 'was' ) - friendLists[0].get( 'correct' )) / friendLists[0].get( 'correct' );

                friendsDifference = friendsDifference < 0 ? friendsDifference * (-1) : friendsDifference;
                var resultFriends = friendsDifference > pc.view.ListGuessView.FRIEND_STEPS.BAD
                    ? $.t( pc.view.ListGuessView.LANG_FRIENDS_OVERVIEW_BAD,
                    { percent: (friendsDifference * 100).toFixed() } )
                    : $.t( pc.view.ListGuessView.LANG_FRIENDS_OVERVIEW_GOOD,
                    { percent: (friendsDifference * 100).toFixed()} );

                // auto
                var autoOverallPercentage = 0,
                    autoResult = $.t( pc.view.ListGuessView.LANG_AUTO_OVERVIEW_NONE ),
                    autoDetails = {},
                    autoDifference = 0;

                if ( autoLists.length !== 0 ) {
                    autoDetails = _.map( autoLists, _.bind( function( list )
                    {
                        var difference = (list.get( 'was' ) - list.get( 'correct' )) / list.get( 'correct' );
                        difference = difference < 0 ? difference * (-1) : difference;
                        autoOverallPercentage += difference;
                        return {
                            name:       list.get( 'is' ).item.get( 'name' ),
                            was:        list.get( 'was' ),
                            is:         list.get( 'correct' ),
                            difference: (difference * 100).toFixed(),
                            rating:     this._makeRating( difference, pc.view.ListGuessView.AUTO_STEPS )
                        };
                    }, this ) );

                    autoDifference = autoOverallPercentage / autoDetails.length;

                    autoResult = $.t( pc.view.ListGuessView.LANG_AUTO_OVERVIEW_BAD,
                        { percent: (autoDifference * 100).toFixed() } );
                    if ( autoDifference < pc.view.ListGuessView.AUTO_STEPS.GOOD ) {
                        autoResult = $.t( pc.view.ListGuessView.LANG_AUTO_OVERVIEW_GOOD,
                            { percent: (autoDifference * 100).toFixed() } );
                    }
                }

                // user
                var userOverallPercentage = 0,
                    userResult = $.t( pc.view.ListGuessView.LANG_USER_OVERVIEW_NONE ),
                    userDetails = {},
                    userDifference = 0;

                if ( userLists.length !== 0 ) {
                    userDetails = _.map( userLists, _.bind( function( list )
                    {
                        var difference = (list.get( 'was' ) - list.get( 'correct' )) / list.get( 'correct' );
                        difference = difference < 0 ? difference * (-1) : difference;
                        userOverallPercentage += difference;
                        return {
                            name:       list.get( 'is' ).item.get( 'name' ),
                            was:        list.get( 'was' ),
                            is:         list.get( 'correct' ),
                            difference: (difference * 100).toFixed(),
                            rating:     this._makeRating( difference, pc.view.ListGuessView.USER_STEPS )
                        };
                    }, this ) );

                    userDifference = userOverallPercentage / userDetails.length;

                    userResult = $.t( pc.view.ListGuessView.LANG_USER_OVERVIEW_BAD,
                        { percent: (userDifference * 100).toFixed() } );
                    if ( userDifference < pc.view.ListGuessView.USER_STEPS.GOOD ) {
                        userResult = $.t( pc.view.ListGuessView.LANG_USER_OVERVIEW_GOOD,
                            { percent: (userDifference * 100).toFixed() } );
                    }
                }

                // user
                return {
                    friends: {
                        result_text: resultFriends,
                        details:     {
                            was:        friendLists[0].get( 'was' ),
                            is:         friendLists[0].get( 'correct' ),
                            difference: (friendsDifference * 100).toFixed(),
                            rating:     this._makeRating( friendsDifference, pc.view.ListGuessView.FRIEND_STEPS )
                        }
                    },
                    auto:    {
                        result_text: autoResult,
                        details:     autoDetails
                    },
                    user:    {
                        result_text: userResult,
                        details:     userDetails
                    }
                };
            },

            _findType: function( lists, type )
            {
                var response = [];
                console.debug( "[ListGuessView] Finding type", type, "for lists", lists );
                _.each( lists, function( list )
                {
                    if ( list.get( 'is' ).type === type ) response.push( list );
                } );

                return response;
            },

            _makeRating: function( rating, selection )
            {
                return rating < selection.BAD ? $.t( pc.view.ListGuessView.LANG_RATING_BAD )
                    : rating < selection.GOOD ? $.t( pc.view.ListGuessView.LANG_RATING_GOOD )
                           : rating < selection.VERYGOOD ? $.t( pc.view.ListGuessView.LANG_RATING_VERYGOOD )
                          : $.t( pc.view.ListGuessView.LANG_RATING_VERYBAD );
            }

        },
        {

            MAX_QUESTIONS:      5,
            MIN_USER_CREATED:   2,
            HIDE_WARNING_AFTER: 3000,
            FOF_MULTIPLIER:     1.5,

            FRIEND_STEPS: {
                VERYGOOD: 0.1,
                GOOD:     0.2,
                BAD:      0.4
            },
            AUTO_STEPS:   {
                VERYGOOD: 0.2,
                GOOD:     0.4,
                BAD:      0.8
            },
            USER_STEPS:   {
                VERYGOOD: 0.15,
                GOOD:     0.3,
                BAD:      0.6
            },

            LANG_FRIENDS:          "app.common.friends",
            LANG_QUESTION_FRIENDS: "app.guess.game.lists.question_friends",
            LANG_QUESTION_LIST:    "app.guess.game.lists.question_list",
            LANG_QUESTION_ITEMS:   "app.guess.game.items.question",

            LANG_FRIENDS_OVERVIEW_BAD:  "app.guess.result.lists.friends_bad",
            LANG_FRIENDS_OVERVIEW_GOOD: "app.guess.result.lists.friends_good",

            LANG_AUTO_OVERVIEW_BAD:  "app.guess.result.lists.auto_bad",
            LANG_AUTO_OVERVIEW_GOOD: "app.guess.result.lists.auto_good",
            LANG_AUTO_OVERVIEW_NONE: "app.guess.result.lists.auto_none",

            LANG_USER_OVERVIEW_BAD:  "app.guess.result.lists.user_bad",
            LANG_USER_OVERVIEW_GOOD: "app.guess.result.lists.user_good",
            LANG_USER_OVERVIEW_NONE: "app.guess.result.lists.user_none",

            LANG_RATING_VERYGOOD: "app.common.ratings.verygood",
            LANG_RATING_GOOD:     "app.common.ratings.good",
            LANG_RATING_BAD:      "app.common.ratings.bad",
            LANG_RATING_VERYBAD:  "app.common.ratings.verybad",

            QuestionType: {
                ALL: 0, AUTO_LIST: 1, USER_LIST: 2, ITEM: 3
            }
        }
    )
    ;

})();