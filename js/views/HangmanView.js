(function()
{
    "use strict";

    var ns = namespace( "pc.view" );

    ns.HangmanView = Backbone.View.extend( {

            templateGame:      pc.template.HangmanGameTemplate,
            templateGameItems: pc.template.HangmanGameItemsTemplate,
            templateResult:    pc.template.HangmanResultTemplate,

            initialize: function()
            {
                console.log( "[HangmanView] Init: HangmanView" );
                this.currentQuestion = undefined;
                this.questions = [];
                this.results = [];

                this.errors = 0;

            },

            render: function()
            {
                // render template
                this.$el.html( this.templateGame() );

                // collect questions
                this._collect();
                console.info( "[HangmanView] Selected the following lists for game:", this.questions );

                // generate briefing
                var briefing = pc.common.GameBriefing.getInstance();
                briefing.make( $.t( pc.view.HangmanView.LANG_BRIEFING ) );
                try {
                    pc.model.TooltipCollection.getInstance().pin( briefing.getTextContainer() );
                    pc.model.TooltipCollection.getInstance()
                        .pin( this.$el.find( pc.view.HangmanView.LIVESLIST_CONTAINER_ID ), "hangman_hearts" );
                    pc.model.TooltipCollection.getInstance()
                        .pin( this.$el.find( pc.view.HangmanView.POINT_CONTAINER_ID ), "hangman_points" );
                }
                catch ( e ) {
                    console.error( "[HangmanView] Unable to attach tooltips:", e, "Skipping rest" );
                }

                briefing.show();
                briefing.on( 'hidden', _.bind( this.ask, this ) );

                // add done event
                this.on( 'done', _.bind( this.doneCb, this ) );
            },

            ask: function()
            {
                // reset errors
                this.errors = 0;

                var container = this.$el.find( '.container' ).first();

                container.fadeOut( 'fast', _.bind( function()
                {

                    // clear container from last question
                    container.empty();

                    // ask next question by simply shifting
                    this.currentQuestion = this.questions.shift();
                    if ( _.isUndefined( this.currentQuestion ) ) {
                        console.info( "[HangmanView] No more questions to ask, showing result" );
                        this.result();
                        return;
                    }

                    var userlist = this.currentQuestion.users, // array
                        item = this.currentQuestion.item,// hash,
                        options = _.extend( this._createItem( item ), {
                            users:  userlist,
                            hearts: new Array( pc.view.HangmanView.DIE_AFTER_NUM )
                        } );

                    console.info( "[HangmanView] Rendering item template with options", options );

                    container.append( this.templateGameItems( options ) );

                    // add click events
                    this.$el.find( pc.view.HangmanView.USERLIST_CONTAINER_ID + "> li" )
                        .each( _.bind( function( i, head )
                        {
                            $( head ).tooltip();
                            $( head ).click( _.bind( this._validateClickCb, this, $( head ) ) );
                        }, this ) );

                    // hide results and proceed button
                    container.find( '.result > *' ).hide();
                    container.find( 'button.proceed' ).hide();

                    // attach tooltips
                    try {
                        pc.model.TooltipCollection.getInstance()
                            .pin( container.find( ".hearts" ), "hangman_hearts" );
                        pc.model.TooltipCollection.getInstance()
                            .pin( container.find( ".points" ), "hangman_points" );
                    }
                    catch ( e ) {
                        console.error( "[HangmanView] Unable to attach tooltips:", e, "Skipping rest" );
                    }

                    // finally show
                    container.fadeIn( 'fast' );

                    // start points
                    this.points = new pc.common.Points( {
                        el:            container.find( pc.view.HangmanView.POINT_CONTAINER_ID ),
                        start:         pc.view.HangmanView.START_POINTS,
                        losePerSecond: pc.view.HangmanView.LOSE_PER_SECOND
                    } );
                    this.points.start();

                    // add timeout event
                    this.points.on( 'timeout', _.bind( this.doneCb, this, pc.view.HangmanView.RESULT.TIMEOUT ) );

                }, this ) );
            },

            _collect: function()
            {

                var testData = _.clone( pc.model.TestData.getInstance().get( 'data' ) );

                _.each( testData, _.bind( function( item )
                {
                    this.questions.push( {
                        item:    item,
                        users:   _.shuffle( this._createUserList( item ) ),
                        clicked: []
                    } );
                }, this ) );

                console.info( "[HangmanView] Following data used for the test", this.questions );

            },

            _createItem: function( item )
            {

                var options = {};

                // form the question
                if ( item instanceof pc.model.FacebookPicture ) {
                    return {
                        picture: {
                            url:     item.get( 'source' ),
                            caption: item.get( 'caption' )
                        }
                    };
                }
                else if ( item instanceof pc.model.FacebookStatus ) {
                    return {
                        status: {
                            caption:  item.get( 'caption' ),
                            date:     pc.common.DateFormatHelper.formatShort( item.get( 'date' ) ),
                            location: item.get( 'location' )
                        }
                    };
                }

                return options;
            },

            _createUserList: function( item )
            {

                var player = pc.model.FacebookPlayer.getInstance(),
                    privacy = item.get( 'privacy' ),
                    includeComplete = new pc.model.FacebookUserCollection( _.shuffle( privacy.get( 'include' ).models ) ), // with friends and player!
                    includeUser = new pc.model.FacebookUserCollection( _.shuffle( privacy.get( 'includeUser' ).models ) ),
                    includeList = new pc.model.FacebookUserCollection(
                        _.shuffle( _.flatten( privacy.get( 'includeList' ).map( function( list )
                            {
                                console.log( list );
                                return list.get( 'members' ).models;
                            }
                        ) ) )
                    ),
                    excludeComplete = new pc.model.FacebookUserCollection( _.shuffle( privacy.get( 'exclude' ).models ) ), // with friends and player!
                    excludeUser = new pc.model.FacebookUserCollection( _.shuffle( privacy.get( 'excludeUser' ).models ) ),
                    excludeList = new pc.model.FacebookUserCollection(
                        _.shuffle( _.flatten( privacy.get( 'excludeList' ).map( function( list )
                            {
                                return list.get( 'members' ).models;
                            }
                        ) ) )
                    ),
                    foreigners = new pc.model.FacebookUserCollection( _.shuffle( player.getForeigners().models ) ),
                    userlistHash = [],
                    alreadyPicked = [];

                console.debug( "[HangmanView] (1) Item", item, "has the following lists to choose users" );
                console.debug( "[HangmanView] (2) includeComplete", includeComplete, "includeUser", includeUser,
                    "includeList", includeList );
                console.debug( "[HangmanView] (3) excludeComplete", excludeComplete, "excludeUser", excludeUser,
                    "excludeList", excludeList );

                // select pc.view.HangmanView.MAX_USERS * pc.view.HangmanView.MAX_CORRECT_PERCENTAGE correct users or less

                // pick user from includeUser except the player
                userlistHash = this._pickFromList(
                    includeUser.remove( {id: player.get( 'id' )} ),
                    pc.view.HangmanView.MAX_USERS * pc.view.HangmanView.MAX_CORRECT_PERCENTAGE,
                    alreadyPicked,
                    true
                );

                // includeList
                userlistHash = _.union( userlistHash, this._pickFromList(
                    includeList,
                    (pc.view.HangmanView.MAX_USERS * pc.view.HangmanView.MAX_CORRECT_PERCENTAGE) - userlistHash.length,
                    alreadyPicked,
                    true
                ) );

                // includeComplete
                userlistHash = _.union( userlistHash, this._pickFromList(
                    includeComplete,
                    (pc.view.HangmanView.MAX_USERS * pc.view.HangmanView.MAX_CORRECT_PERCENTAGE) - userlistHash.length,
                    alreadyPicked,
                    true
                ) );

                // add player if userlisthash is empty
                if ( userlistHash.length === 0 ) {
                    userlistHash.push( {
                        name:    player.get( 'name' ),
                        id:      player.get( 'id' ),
                        correct: true
                    } );
                }

                // excludeUser
                userlistHash = _.union( userlistHash, this._pickFromList(
                    excludeUser,
                    pc.view.HangmanView.MAX_USERS - userlistHash.length,
                    alreadyPicked,
                    false
                ) );

                // excludeList
                userlistHash = _.union( userlistHash, this._pickFromList(
                    excludeList,
                    pc.view.HangmanView.MAX_USERS - userlistHash.length,
                    alreadyPicked,
                    false
                ) );

                // excludeComplete
                userlistHash = _.union( userlistHash, this._pickFromList(
                    excludeComplete,
                    pc.view.HangmanView.MAX_USERS - userlistHash.length,
                    alreadyPicked,
                    false
                ) );

                // foreigners
                userlistHash = _.union( userlistHash, this._pickFromList(
                    foreigners,
                    pc.view.HangmanView.MAX_USERS - userlistHash.length,
                    alreadyPicked,
                    false
                ) );

                console.debug( "[HangmanView] (4) Picked the following users for item to test", userlistHash );

                return userlistHash;

            },

            _pickFromList: function( list, count, skip, correct )
            {
                console.debug( "[HangmanView] (1) Having to select", count, correct ? "correct" : "", "items from list",
                    list, "and to skip", skip );

                if ( count === 0 ) return[];

                var picked, returnList = [], i = 0;

                while ( i < list.length && i < count ) {

                    picked = list.at( i );
                    i++;

                    console.debug( "[HangmanView] (2) Picked ", picked, "from list", list, "at pos", i - 1 );

                    if ( _.isUndefined( picked ) || _.contains( skip, picked.get( 'id' ) ) ) continue;

                    returnList.push( {
                        name:    picked.get( 'name' ),
                        id:      picked.get( 'id' ),
                        correct: correct
                    } );
                    skip.push( picked.get( 'id' ) );
                }

                return returnList;
            },

            doneCb: function( result )
            {
                console.log( "[HangmanView] Result for item", this.currentQuestion.item, " was", result, this.errors );
                if ( result !== pc.view.HangmanView.RESULT.TIMEOUT ) this.points.stop();

                var resultContainer = this.$el.find( '.result' );

                if ( result !== pc.view.HangmanView.RESULT.WON ) this.points.set( 'remaining', 0 );

                pc.model.FacebookPlayer.getInstance().get( 'results' ).add( new pc.model.TestResult( {
                    item:         this.currentQuestion.item,
                    correctValue: this.currentQuestion.users,
                    userValue:    this.currentQuestion.clicked,
                    gameType:     pc.model.TestResult.Type.HANGMAN,
                    optional:     {
                        errors:   this.errors,
                        duration: this.points.get( 'duration' ),
                        points:   this.points.get( 'remaining' ),
                        result:   result
                    }
                } ) );

                this.$el.find( pc.view.HangmanView.USERLIST_CONTAINER_ID + "> li" ).unbind( 'click' );

                this._showResults();

                switch ( result ) {
                    case pc.view.HangmanView.RESULT.LOST:
                        resultContainer.children( '.lost' ).show();
                        break;

                    case pc.view.HangmanView.RESULT.WON:
                        resultContainer.children( '.won' ).show();
                        break;

                    case pc.view.HangmanView.RESULT.TIMEOUT:
                        resultContainer.children( '.timeout' ).show();
                        break;
                }

                // show proceed button
                this.$el.find( "button.proceed" ).fadeIn().click( _.bind( function()
                {
                    this.$el.find( "button.proceed" ).unbind( 'click' );
                    this.ask();
                }, this ) );
            },

            result: function()
            {

                this.$el.fadeOut( _.bind( function()
                {
                    var options = this._resultHangman();

                    console.info( "[HangmanView] Rending result template with", options );

                    this.$el
                        .html( this.templateResult( options ) )
                        .fadeIn();

                    this.trigger( 'hangmanview:done' );
                }, this ) );

            },

            _resultHangman: function()
            {

                var hangmanResults = pc.model.FacebookPlayer.getInstance()
                        .get( 'results' )
                        .where( { gameType: pc.model.TestResult.Type.HANGMAN } ),
                    totalDuration = 0,
                    totalErrors = 0,
                    totalPoints = 0,
                    itemInformation,
                    jsonResult,
                    rating;

                jsonResult = hangmanResults.map( function( result )
                {
                    totalDuration += result.get( 'optional' ).duration;
                    totalErrors += result.get( 'optional' ).errors;
                    totalPoints += result.get( 'optional' ).points;
                    itemInformation = {};

                    var item = result.get( 'item' );

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
                        points:   result.get( 'optional' ).points
                    } );
                } );

                rating = totalPoints > 37500 ? $.t( pc.view.HangmanView.LANG_RATING_VERYGOOD )
                    : totalPoints > 25000 ? $.t( pc.view.HangmanView.LANG_RATING_GOOD )
                             : totalPoints > 12500 ? $.t( pc.view.HangmanView.LANG_RATING_BAD )
                          : $.t( pc.view.HangmanView.LANG_RATING_VERYBAD );

                return {
                    results: jsonResult,
                    totals:  {
                        duration: totalDuration.toFixed(),
                        errors:   totalErrors,
                        points:   totalPoints,
                        rating:   rating
                    }
                };
            },

            _showResults: function()
            {

                var container = this.$el.find( pc.view.HangmanView.USERLIST_CONTAINER_ID );

                container.children( 'li:not(.done)' ).each( function( idx, el )
                {
                    var $el = $( el );
                    $el.addClass( 'done' );
                    $el.data( 'correct' ) ? $el.addClass( 'correct' ) : $el.addClass( 'wrong' );
                } );

            },

            _validateClickCb: function( $item )
            {
                var container = this.$el.find( pc.view.HangmanView.USERLIST_CONTAINER_ID ),
                    correct = $item.data( 'correct' );

                console.log( "[HangmanView] Player selected", correct ? "correct" : "wrong", $item );

                $item.addClass( 'done' );

                if ( correct ) {
                    $item.addClass( 'correct' );
                }
                // user select wrong item hangman +1
                else {
                    this.points.event( pc.view.HangmanView.LOSE_WRONG_CLICK );
                    this.errors++;
                    $item.addClass( 'wrong' );
                    this.$el.find( pc.view.HangmanView.LIVESLIST_CONTAINER_ID + " li:not(.lost):last" ).addClass( 'lost' );

                    if ( this.errors === pc.view.HangmanView.DIE_AFTER_NUM ) {
                        this.trigger( 'done', pc.view.HangmanView.RESULT.LOST );
                        return;
                    }
                }

                $item.unbind( 'click' );

                // try to find remaing items
                var notdone = false;
                container.children( 'li:not(.done)' ).each( function( idx, el )
                {
                    var $el = $( el );
                    if ( !$el.hasClass( 'done' ) && $el.data( 'correct' ) ) {
                        notdone = true;
                    }
                } );

                // if there are no remaing items trigger next one
                if ( !notdone ) {
                    this.trigger( 'done', pc.view.HangmanView.RESULT.WON );
                }

            }

        },
        {

            USERLIST_CONTAINER_ID:  '.userlist',
            LIVESLIST_CONTAINER_ID: '.hearts',
            RESULT_CONTAINER_ID:    '.result',
            POINT_CONTAINER_ID:     '.points',

            FB_IMAGE_BASE_URL: "https://graph.facebook.com/<%- uid %>/picture?width=80&height=80",

            USERLIST_DELAY_MODIFIER: 50,

            LOADER_GIF_SRC: 'img/loader.gif',

            MAX_QUESTIONS:          5,
            DIE_AFTER_NUM:          5,
            MAX_USERS:              20,
            MAX_CORRECT_PERCENTAGE: 0.5,
            WRONG_ITEMS:            10,
            CORRECT_ITEMS:          10,

            START_POINTS:     10000,
            LOSE_WRONG_CLICK: 1000,
            LOSE_PER_SECOND:  250,

            RESULT: {
                WON: 0, LOST: 1, TIMEOUT: 2
            },

            LANG_BRIEFING:        "app.hangman.briefing",
            LANG_RATING_VERYGOOD: "app.common.ratings.verygood",
            LANG_RATING_GOOD:     "app.common.ratings.good",
            LANG_RATING_BAD:      "app.common.ratings.bad",
            LANG_RATING_VERYBAD:  "app.common.ratings.verybad"

        }
    )
    ;

})
    ();