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

            templateGame:      pc.template.GuessGameTemplate,
            templateResult:    pc.template.GuessResultTemplate,
            templateGameItems: pc.template.GuessGameItemsTemplate,

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

                // generate briefing
                var briefing = pc.common.GameBriefing.getInstance();
                briefing.make( $.t( pc.view.ListGuessView.LANG_BRIEFING ) );
                briefing.headline( $.t( pc.view.ListGuessView.LANG_GAME_NAME ) );
                briefing.cbLink( pc.view.ListGuessView.CB_LINK_ID );

                try {
                    pc.model.TooltipCollection.getInstance().pin( briefing.getTextContainer() );
                    pc.model.TooltipCollection.getInstance().pin( this.$el.find( 'h1' ) );
                }
                catch ( e ) {
                    console.error( "[ListGuessView] Unable to attach tooltips:", e, "Skipping rest" );
                }

                briefing.show();

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

                    console.info( "[ListGuessView] Rendering item template with options", options );

                    container.append( this.templateGameItems( options ) );

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
                var options = {
                    lists: this._resultLists(),
                    items: this._resultItems()
                };

                console.debug( "[ListGuessView] Rending result view with options", options );
                // render container
                this.$el.fadeOut( _.bind( function()
                {
                    this.$el.html( this.templateResult( options ) );

                    // add tooltip
                    try {
                        pc.model.TooltipCollection.getInstance().pin( this.$el.find( 'h1' ) );
                    }
                    catch ( e ) {
                        console.error( "[ListGuessView] Unable to attach tooltips:", e, "Skipping rest" );
                    }

                    // add toggles
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

                    // ok everything ready
                    this.$el.fadeIn();

                }, this ) );

                this.trigger( 'game:done' );

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
                // pick 1 .. toPick/2
                var random = _.random( 1, Math.ceil( toPick / 2 ) ),
                    toPickUser = random < userLists.length ? random : userLists.length,
                    toPickAuto = toPick - toPickUser < autoLists.length ? toPick - toPickUser : autoLists.length;

                // pick users
                while ( toPickUser > 0 ) {

                    pickedListItem = userLists[ _.random( userLists.length ) ];
                    pickedListType = pc.view.ListGuessView.QuestionType.USER_LIST;

                    if ( !_.isUndefined( pickedListItem ) && !_.contains( alreadyUsedLists, pickedListItem ) ) {
                        this.questions.push( {
                            item:    pickedListItem,
                            type:    pickedListType,
                            correct: pickedListItem.get( 'members' ).length
                        } );
                        alreadyUsedLists.push( pickedListItem );
                        toPickUser--;
                    }

                }

                // pick auto
                while ( toPickAuto > 0 ) {

                    pickedListItem = autoLists[ _.random( userLists.length ) ];
                    pickedListType = pc.view.ListGuessView.QuestionType.AUTO_LIST;

                    if ( !_.isUndefined( pickedListItem ) && !_.contains( alreadyUsedLists, pickedListItem ) ) {
                        this.questions.push( {
                            item:    pickedListItem,
                            type:    pickedListType,
                            correct: pickedListItem.get( 'members' ).length
                        } );
                        alreadyUsedLists.push( pickedListItem );
                        toPickAuto--;
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
                            date:     pc.common.DateFormatHelper.formatShort( item.get( 'date' ) ),
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
                    questionType = this.currentQuestion.type,
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
                    item:         item,
                    userValue:    userValue,
                    correctValue: correctValue,
                    gameType:     type,
                    optional:     {
                        listQuestionType: questionType
                    }
                } ) );

                // ask next question
                this.ask();
            },

            _getVisibilityValueForItem: function( item )
            {
                var privacy = item.get( 'privacy' ),
                    level = privacy.get( 'level' ),
                    visibleFor,
                    reduce = 0;

                // only reduce when exclude list contains item from include
                privacy.get( 'exclude' ).each( function( excludee )
                {
                    if ( privacy.get( 'include' ).contains( excludee ) ) reduce++;
                } );

                console.debug( '[ListGuessView] Reducing include list', privacy.get( 'include' ), 'about', reduce,
                    privacy.get( 'exclude' ) );

                switch ( level ) {

                    case pc.common.PrivacyDefinition.Level.ALL:
                        visibleFor = Infinity;
                        break;

                    case pc.common.PrivacyDefinition.Level.FOF:
                        visibleFor =
                            (privacy.get( 'include' ).length - reduce) *
                                pc.view.ListGuessView.FOF_MULTIPLIER;

                        break;

                    case pc.common.PrivacyDefinition.Level.FRIENDS:
                    case pc.common.PrivacyDefinition.Level.ME:
                    case pc.common.PrivacyDefinition.Level.CUSTOM:
                    case pc.common.PrivacyDefinition.Level.NOBODY:
                        visibleFor = privacy.get( 'include' ).length - reduce;
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
                    resultForsLists = player.get( 'results' ).where( {gameType: pc.model.TestResult.Type.LISTGUESS} ),
                    ns = pc.view.ListGuessView;

                // get user lists
                var userLists = this._findType( resultForsLists, ns.QuestionType.USER_LIST ),
                    autoLists = this._findType( resultForsLists, ns.QuestionType.AUTO_LIST ),
                    friendLists = this._findType( resultForsLists, ns.QuestionType.ALL );

                console.debug( "[ListGuessView] User lists results:", userLists, "Auto lists results", autoLists,
                    "Friend list result", friendLists );

                // friends
                var friendsDifference = pc.common.RelativeDifferenceCalculator.calculate(
                        friendLists[0].get( 'correctValue' ),
                        friendLists[0].get( 'userValue' )
                    ),
                    friendResult,
                    friendRating;

                // friend rating
                if ( _.isBetween( friendsDifference, ns.FRIEND_STEPS.VERYGOOD ) ) {
                    friendResult = $.t( ns.LANG_FRIENDS_OVERVIEW_VERYGOOD,
                        {percent: (friendsDifference * 100).toFixed()}
                    );
                    friendRating = ns.Result.VERYGOOD;
                }
                else if ( _.isBetween( friendsDifference, ns.FRIEND_STEPS.VERYGOOD, ns.FRIEND_STEPS.GOOD ) ) {
                    friendResult = $.t( ns.LANG_FRIENDS_OVERVIEW_GOOD, {percent: (friendsDifference * 100).toFixed()} );
                    friendRating = ns.Result.GOOD;
                }
                else if ( _.isBetween( friendsDifference, ns.FRIEND_STEPS.GOOD, ns.FRIEND_STEPS.BAD ) ) {
                    friendResult = $.t( ns.LANG_FRIENDS_OVERVIEW_BAD, {percent: (friendsDifference * 100).toFixed()} );
                    friendRating = ns.Result.BAD;
                }
                else if ( _.isBetween( friendsDifference, ns.FRIEND_STEPS.BAD, 1 ) ) {
                    friendResult = $.t( ns.LANG_FRIENDS_OVERVIEW_VERYBAD,
                        {percent: (friendsDifference * 100).toFixed()}
                    );
                    friendRating = ns.Result.VERYBAD;
                }

                // auto
                var autoOverallPercentage = 0,
                    autoResult = $.t( ns.LANG_AUTO_OVERVIEW_NONE ),
                    autoRating = ns.Result.NONE,
                    autoDetails = [],
                    autoDifference = 0;

                if ( autoLists.length !== 0 ) {
                    autoDetails = _.map( autoLists, _.bind( function( list )
                    {
                        var difference = pc.common.RelativeDifferenceCalculator.calculate(
                            list.get( 'correctValue' ),
                            list.get( 'userValue' )
                        );
                        autoOverallPercentage += difference;
                        return {
                            item_name:     list.get( 'item' ).get( 'name' ),
                            user_value:    list.get( 'userValue' ),
                            correct_value: list.get( 'correctValue' ),
                            difference:    (difference * 100).toFixed(),
                            rating:        this._makeRating( difference, ns.AUTO_STEPS )
                        };
                    }, this ) );

                    autoDifference = autoOverallPercentage / autoDetails.length;

                    // auto rating
                    if ( _.isBetween( autoDifference, ns.AUTO_STEPS.VERYGOOD ) ) {
                        autoResult = $.t( ns.LANG_AUTO_OVERVIEW_VERYGOOD, {percent: (autoDifference * 100).toFixed()} );
                        autoRating = ns.Result.VERYGOOD;
                    }
                    else if ( _.isBetween( autoDifference, ns.AUTO_STEPS.VERYGOOD, ns.AUTO_STEPS.GOOD ) ) {
                        autoResult = $.t( ns.LANG_AUTO_OVERVIEW_GOOD, {percent: (autoDifference * 100).toFixed()} );
                        autoRating = ns.Result.GOOD;
                    }
                    else if ( _.isBetween( autoDifference, ns.AUTO_STEPS.GOOD, ns.AUTO_STEPS.BAD ) ) {
                        autoResult = $.t( ns.LANG_AUTO_OVERVIEW_BAD, {percent: (autoDifference * 100).toFixed()} );
                        autoRating = ns.Result.BAD;
                    }
                    else if ( _.isBetween( autoDifference, ns.AUTO_STEPS.BAD, 1 ) ) {
                        autoResult = $.t( ns.LANG_AUTO_OVERVIEW_VERYBAD, {percent: (autoDifference * 100).toFixed()} );
                        autoRating = ns.Result.VERYBAD;
                    }
                }

                // user
                var userOverallPercentage = 0,
                    userResult = $.t( ns.LANG_USER_OVERVIEW_NONE ),
                    userRating = ns.Result.NONE,
                    userDetails = [],
                    userDifference = 0;

                if ( userLists.length !== 0 ) {
                    userDetails = _.map( userLists, _.bind( function( list )
                    {
                        var difference = pc.common.RelativeDifferenceCalculator.calculate(
                            list.get( 'correctValue' ),
                            list.get( 'userValue' )
                        );

                        userOverallPercentage += difference;
                        return {
                            item_name:     list.get( 'item' ).get( 'name' ),
                            user_value:    list.get( 'userValue' ),
                            correct_value: list.get( 'correctValue' ),
                            difference:    (difference * 100).toFixed(),
                            rating:        this._makeRating( difference, ns.USER_STEPS )
                        };
                    }, this ) );

                    userDifference = userOverallPercentage / userDetails.length;

                    // user rating
                    if ( _.isBetween( userDifference, ns.USER_STEPS.VERYGOOD ) ) {
                        userResult = $.t( ns.LANG_USER_OVERVIEW_VERYGOOD, {percent: (userDifference * 100).toFixed()} );
                        userRating = ns.Result.VERYGOOD;
                    }
                    else if ( _.isBetween( userDifference, ns.USER_STEPS.VERYGOOD, ns.USER_STEPS.GOOD ) ) {
                        userResult = $.t( ns.LANG_USER_OVERVIEW_GOOD, {percent: (userDifference * 100).toFixed()} );
                        userRating = ns.Result.GOOD;
                    }
                    else if ( _.isBetween( userDifference, ns.USER_STEPS.GOOD, ns.USER_STEPS.BAD ) ) {
                        userResult = $.t( ns.LANG_USER_OVERVIEW_BAD, {percent: (userDifference * 100).toFixed()} );
                        userRating = ns.Result.BAD;
                    }
                    else if ( _.isBetween( userDifference, ns.USER_STEPS.BAD, 1 ) ) {
                        userResult = $.t( ns.LANG_USER_OVERVIEW_VERYBAD, {percent: (userDifference * 100).toFixed()} );
                        userRating = ns.Result.VERYBAD;
                    }
                }

                // user
                return {
                    friends: {
                        result_text: friendResult,
                        rating:      friendRating,
                        details:     {
                            item_name:     $.t( pc.view.ListGuessView.LANG_FRIENDS ),
                            user_value:    friendLists[0].get( 'userValue' ),
                            correct_value: friendLists[0].get( 'correctValue' ),
                            difference:    (friendsDifference * 100).toFixed(),
                            rating:        this._makeRating( friendsDifference, pc.view.ListGuessView.FRIEND_STEPS )
                        }
                    },
                    auto:    {
                        result_text: autoResult,
                        rating:      autoRating,
                        details:     autoDetails
                    },
                    user:    {
                        result_text: userResult,
                        rating:      userRating,
                        details:     userDetails
                    }
                };
            },

            _resultItems: function()
            {
                var player = pc.model.FacebookPlayer.getInstance(),
                    ns = pc.view.ListGuessView,
                    resultForsItems = player.get( 'results' ).where( {gameType: pc.model.TestResult.Type.ENTITYGUESS} ),
                    results = this._findType( resultForsItems, pc.view.ListGuessView.QuestionType.ITEM ),
                    individualResults = [],
                    publicResults = [],
                    overallDifference = 0,
                    hasLists = false;

                _.each( results, _.bind( function( result )
                {
                    var item = result.get( 'item' ),
                        privacy = item.get( 'privacy' ),
                        privacyLevel = privacy.get( 'level' ),
                        visibleFor = [],
                        deniedFor = [];

                    console.debug( '[ListGuessView] Current item to calculate result', item );

                    // final all non-public items
                    if ( privacyLevel !== pc.common.PrivacyDefinition.Level.ALL ) {
                        // depending on the privacy level a item is visible for kind of groups
                        switch ( privacyLevel ) {
                            case pc.common.PrivacyDefinition.Level.FRIENDS:
                                visibleFor.push( $.t( pc.view.ListGuessView.LANG_ALL_FRIENDS ) );
                                break;
                            case pc.common.PrivacyDefinition.Level.FOF:
                                visibleFor.push( $.t( pc.view.ListGuessView.LANG_FOF ) );
                                break;
                        }

                        // do we need to extend visibleFor or deniedFor?
                        if ( privacy.get( 'includeList' ).length > 0 || privacy.get( 'excludeList' ).length > 0 ) {

                            privacy.get( 'includeList' ).each( function( list )
                            {
                                // skips all_friends_list
                                if ( list.get( 'id' ) !== -1 ) {
                                    visibleFor.push( list.get( 'name' ) );
                                    hasLists = true;
                                }
                            } );
                            privacy.get( 'excludeList' ).each( function( list )
                            {
                                deniedFor.push( list.get( 'name' ) );
                                hasLists = true;
                            } );

                        }

                        // do we have user visibleFor or deniedFor
                        if ( (privacy.get( 'includeUser' ).length - 1) > 0 || privacy.get( 'excludeUser' ).length > 0 ) {
                            visibleFor = _.union( visibleFor,
                                _.map( privacy.get( 'includeUser' ).models, function( user )
                                {
                                    // skip player
                                    if ( user.get( 'id' ) !== player.get( 'id' ) ) {
                                        hasLists = true;
                                        return user.get( 'name' );
                                    }
                                } ) );
                            deniedFor = _.union( deniedFor,
                                _.map( privacy.get( 'excludeUser' ).models, function( list )
                                {
                                    hasLists = true;
                                    return list.get( 'name' );
                                } ) );

                        }

                        overallDifference += this.__calculateDifference( result );

                        // add to list
                        individualResults.push( this.__createItem( result, {
                            visible_for: visibleFor.join( ', ' ),
                            denied_for:  deniedFor.join( ', ' )
                        } ) );
                    }

                }, this ) );

                // find all public items (not only testdata)
                _.each( _.union( player.getPictures().models, player.getStatuses().models ), _.bind( function( item )
                {
                    if ( !_.isUndefined( item.get( 'privacy' ) )
                        && !_.isUndefined( item.get( 'privacy' ).get( 'level' ) )
                        && item.get( 'privacy' ).get( 'level' ) === pc.common.PrivacyDefinition.Level.ALL ) {

                        console.debug( '[ListGuessView] Found PUBLIC item', item );

                        // item need to wrapped in testresult
                        publicResults.push( this.__createItem( new pc.model.TestResult( {
                            item:         item,
                            userValue:    0,
                            correctValue: 0,
                            gameType:     pc.model.TestResult.Type.ENTITYGUESS
                        } ) ) );
                    }
                }, this ) );

                // make result texts
                var resultText,
                    publicResultText = $.t( pc.view.ListGuessView.LANG_ITEMS_PUBLIC_OVERVIEW_NO ),

                    percentage = overallDifference / results.length;

                console.log( percentage, overallDifference, results.length, hasLists );

                // group rating
                if ( _.isBetween( percentage, ns.ITEMS_STEPS.VERYGOOD ) ) {
                    if ( hasLists ) {
                        resultText = $.t( ns.LANG_ITEMS_LIST_OVERVIEW_VERYGOOD,
                            {percent: (percentage * 100).toFixed()}
                        );
                    }
                    else {
                        resultText = $.t( ns.LANG_ITEMS_LIST_OVERVIEW_NONE_VERYGOOD,
                            {percent: (percentage * 100).toFixed()}
                        );
                    }
                }
                else if ( _.isBetween( percentage, ns.ITEMS_STEPS.VERYGOOD, ns.ITEMS_STEPS.GOOD ) ) {
                    if ( hasLists ) {
                        resultText = $.t( ns.LANG_ITEMS_LIST_OVERVIEW_GOOD,
                            {percent: (percentage * 100).toFixed()}
                        );
                    }
                    else {
                        resultText = $.t( ns.LANG_ITEMS_LIST_OVERVIEW_NONE_GOOD,
                            {percent: (percentage * 100).toFixed()}
                        );
                    }
                }
                else if ( _.isBetween( percentage, ns.ITEMS_STEPS.GOOD, ns.ITEMS_STEPS.BAD ) ) {
                    if ( hasLists ) {
                        resultText = $.t( ns.LANG_ITEMS_LIST_OVERVIEW_BAD,
                            {percent: (percentage * 100).toFixed()}
                        );
                    }
                    else {
                        resultText = $.t( ns.LANG_ITEMS_LIST_OVERVIEW_NONE_BAD,
                            {percent: (percentage * 100).toFixed()}
                        );
                    }
                }
                else if ( _.isBetween( percentage, ns.ITEMS_STEPS.BAD, 1 ) ) {
                    if ( hasLists ) {
                        resultText = $.t( ns.LANG_ITEMS_LIST_OVERVIEW_VERYBAD,
                            {percent: (percentage * 100).toFixed()}
                        );
                    }
                    else {
                        resultText = $.t( ns.LANG_ITEMS_LIST_OVERVIEW_NONE_VERYBAD,
                            {percent: (percentage * 100).toFixed()}
                        );
                    }
                }

                if ( publicResults.length > 0 ) {
                    publicResultText = $.t( pc.view.ListGuessView.LANG_ITEMS_PUBLIC_OVERVIEW_YES,
                        { count: publicResults.length }
                    );
                }

                // calculate overalls
                return {
                    "individual": {
                        "result_text": resultText,
                        "details":     individualResults,
                        "has_lists":   hasLists
                    },
                    "public":     {
                        "result_text": publicResultText,
                        "details":     publicResults
                    }
                };

            },

            __calculateDifference: function( result )
            {
                var correctValue = result.get( 'correctValue' ),
                    userValue = result.get( 'userValue' ),
                    item = result.get( 'item' ),
                    difference = pc.common.RelativeDifferenceCalculator.calculate( correctValue, userValue );

                difference = difference < 0 ? difference * (-1) : difference;

                if ( _.isNaN( difference ) ) {
                    console.warn( "[ListGuessView] Got NaN value while calculating difference", difference );
                    difference = 0;
                }

                return difference;
            },

            __createItem: function( result, toMerge )
            {

                if ( _.isUndefined( toMerge ) ) toMerge = {};

                var correctValue = result.get( 'correctValue' ),
                    userValue = result.get( 'userValue' ),
                    item = result.get( 'item' ),
                    difference = this.__calculateDifference( result ),
                    itemHash;

                var hash = _.extend( {
                    correct_value: correctValue,
                    user_value:    userValue,
                    difference:    (difference * 100).toFixed()
                }, toMerge );

                if ( item instanceof pc.model.FacebookPicture ) {
                    itemHash =
                    {
                        picture: {
                            url:     item.get( 'source' ),
                            caption: item.get( 'caption' )
                        }
                    };
                } else if ( item instanceof pc.model.FacebookStatus ) {
                    itemHash =
                    {
                        status: {
                            date:    pc.common.DateFormatHelper.formatShort( item.get( 'date' ) ),
                            caption: item.get( 'caption' )
                        }
                    };
                }

                return _.extend( hash, itemHash );

            },

            _findType: function( lists, type )
            {
                var response = [];
                console.debug( "[ListGuessView] Finding type", type, "for lists", lists );
                _.each( lists, function( list )
                {
                    if ( list.get( 'optional' ).listQuestionType === type ) response.push( list );
                } );

                return response;
            },

            _makeRating: function( rating, selection )
            {
                var result = $.t( pc.view.ListGuessView.LANG_RATING_VERYBAD );

                if ( rating < selection.VERYGOOD ) {
                    result = $.t( pc.view.ListGuessView.LANG_RATING_VERYGOOD );
                }
                else if ( rating >= selection.VERYGOOD && rating < selection.GOOD ) {
                    result = $.t( pc.view.ListGuessView.LANG_RATING_GOOD );
                }
                else if ( rating >= selection.GOOD && rating < selection.BAD ) {
                    result = $.t( pc.view.ListGuessView.LANG_RATING_BAD );
                }

                return result;
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
            ITEMS_STEPS:  {
                VERYGOOD: 0.15,
                GOOD:     0.3,
                BAD:      0.6
            },

            LANG_BRIEFING:  "app.guess.briefing",
            LANG_GAME_NAME: "app.guess.name",
            CB_LINK_ID:     "app.guess",

            LANG_FRIENDS:          "app.common.friends",
            LANG_ALL_FRIENDS:      "app.common.all_friends",
            LANG_FOF:              "app.common.fof",
            LANG_PUBLIC:           "app.common.public",
            LANG_QUESTION_FRIENDS: "app.guess.game.lists.question_friends",
            LANG_QUESTION_LIST:    "app.guess.game.lists.question_list",
            LANG_QUESTION_ITEMS:   "app.guess.game.items.question",

            LANG_FRIENDS_OVERVIEW_VERYBAD:  "app.guess.result.lists.friends_verybad",
            LANG_FRIENDS_OVERVIEW_BAD:      "app.guess.result.lists.friends_bad",
            LANG_FRIENDS_OVERVIEW_GOOD:     "app.guess.result.lists.friends_good",
            LANG_FRIENDS_OVERVIEW_VERYGOOD: "app.guess.result.lists.friends_verygood",

            LANG_AUTO_OVERVIEW_VERYBAD:  "app.guess.result.lists.auto_verybad",
            LANG_AUTO_OVERVIEW_BAD:      "app.guess.result.lists.auto_bad",
            LANG_AUTO_OVERVIEW_GOOD:     "app.guess.result.lists.auto_good",
            LANG_AUTO_OVERVIEW_VERYGOOD: "app.guess.result.lists.auto_verygood",
            LANG_AUTO_OVERVIEW_NONE:     "app.guess.result.lists.auto_none",

            LANG_USER_OVERVIEW_VERYBAD:  "app.guess.result.lists.user_verybad",
            LANG_USER_OVERVIEW_BAD:      "app.guess.result.lists.user_bad",
            LANG_USER_OVERVIEW_GOOD:     "app.guess.result.lists.user_good",
            LANG_USER_OVERVIEW_VERYGOOD: "app.guess.result.lists.user_verygood",
            LANG_USER_OVERVIEW_NONE:     "app.guess.result.lists.user_none",

            LANG_ITEMS_LIST_OVERVIEW_VERYBAD:  "app.guess.result.items.list_verybad",
            LANG_ITEMS_LIST_OVERVIEW_BAD:      "app.guess.result.items.list_bad",
            LANG_ITEMS_LIST_OVERVIEW_GOOD:     "app.guess.result.items.list_good",
            LANG_ITEMS_LIST_OVERVIEW_VERYGOOD: "app.guess.result.items.list_verygood",

            LANG_ITEMS_LIST_OVERVIEW_NONE_VERYBAD:  "app.guess.result.items.list_none_verygood",
            LANG_ITEMS_LIST_OVERVIEW_NONE_BAD:      "app.guess.result.items.list_none_bad",
            LANG_ITEMS_LIST_OVERVIEW_NONE_GOOD:     "app.guess.result.items.list_none_good",
            LANG_ITEMS_LIST_OVERVIEW_NONE_VERYGOOD: "app.guess.result.items.list_none_verygood",

            LANG_ITEMS_PUBLIC_OVERVIEW_YES: "app.guess.result.items.public_yes",
            LANG_ITEMS_PUBLIC_OVERVIEW_NO:  "app.guess.result.items.public_no",

            LANG_RATING_VERYGOOD: "app.common.ratings.verygood",
            LANG_RATING_GOOD:     "app.common.ratings.good",
            LANG_RATING_BAD:      "app.common.ratings.bad",
            LANG_RATING_VERYBAD:  "app.common.ratings.verybad",

            QuestionType: {
                ALL: 0, AUTO_LIST: 1, USER_LIST: 2, ITEM: 3
            },

            Result: {
                VERYGOOD: 0, GOOD: 1, BAD: 2, VERYBAD: 3, NONE: 4
            }
        }
    )
    ;

})();