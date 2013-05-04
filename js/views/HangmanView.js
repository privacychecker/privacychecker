(function()
{
    "use strict";

    var ns = namespace( "pc.view" );

    ns.HangmanView = Backbone.View.extend( {

        templateGame:   pc.template.HangmanGameTemplate,
        templateResult: pc.template.HangmanResultTemplate,

        initialize: function()
        {
            console.log( "[HangmanView] Init: HangmanView" );
            this.currentQuestion = undefined;
            this.errors = 0;
            this.player = pc.model.FacebookPlayer.getInstance();

        },

        render: function()
        {
            this.$el.html( this.templateGame() );

            // points
            this.on( 'done', _.bind( this.doneCb, this ) );
            this.points = new pc.common.Points( {
                el:            this.$el.find( pc.view.HangmanView.POINT_CONTAINER_ID ).first(),
                start:         pc.view.HangmanView.START_POINTS,
                losePerSecond: pc.view.HangmanView.LOSE_PER_SECOND
            } );
            this.points.on( 'timeout', _.bind( this.doneCb, this, pc.view.HangmanView.RESULT.TIMEOUT ) );

            this.questions = [];

            _.each( pc.model.TestData.getInstance().get( 'data' ), _.bind( function( item )
            {

                if ( item instanceof pc.model.FacebookPicture || item instanceof pc.model.FacebookStatus ) {
                    var wrongU = this._getWrongUsers( item );
                    var correctU = this._getCorrectUsers( item );
                    this.questions.push( {
                        correct:         correctU,
                        wrong:           wrongU,
                        item:            item,
                        selectedWrong:   new pc.model.FacebookUserCollection(),
                        selectedCorrect: new pc.model.FacebookUserCollection()
                    } );
                }
                else {
                    console.error( "Unknown item for guess game" );
                    throw "E_UNKNOWN_ITEM";
                }

            }, this ) );

            this.questionsLength = this.questions.length;
            this.askedQuestions = 0;

            console.debug( '[HangmanView] ' + this.questions.length + " entities to show" );

            this.next();

            return this;
        },

        doneCb: function( result )
        {
            console.log( "[HangmanView] Result for game was", result, this.errors );
            this.points.stop();

            if ( result === pc.view.HangmanView.RESULT.LOST ) this.points.set( 'remaining', 0 );

            this.player.get( 'results' ).add( new pc.model.TestResult( {
                is:       this.currentQuestion,
                was:      result,
                points:   this.points.get( 'remaining' ),
                duration: this.points.get( 'duration' ),
                errors:   this.errors,
                type:     pc.model.TestResult.Type.HANGMAN
            } ) );

            this._showResults();

            new pc.common.OverlayInfo( {
                text:  i18n.t( pc.view.HangmanView.LANG_GAME_WON ),
                click: _.bind( this.next, this )
            } ).show();
        },

        next: function()
        {

            this.currentQuestion = this.questions.shift();
            this.errors = 0;

            if ( this.currentQuestion === undefined ) {

                console.debug( '[HangmanView] Game finished' );
                this.result();
                return;
            }

            console.debug( '[HangmanView] Current entity: ', this.currentQuestion );

            // question answered do progress
            pc.common.ProgressBar.getInstance().subto( this.askedQuestions, this.questionsLength );

            var item = this.currentQuestion.item;

            this.$el.find( pc.view.HangmanView.USERLIST_CONTAINER_ID ).fadeOut( 'fast' );
            this.$el.find( pc.view.HangmanView.POINT_CONTAINER_ID ).fadeOut( 'fast' );
            this.$el.find( pc.view.HangmanView.ITEM_CONTAINER ).fadeOut( 'fast',
                _.bind( function()
                {
                    this.$el
                        .find( pc.view.HangmanView.ITEM_CONTAINER )
                        .empty()
                        .append( this._createObject( item ) )
                        .fadeIn( 'fast' );

                    // create userlist
                    this._creatUserList( this.currentQuestion );

                    // add lives
                    this.$el.find( pc.view.HangmanView.LIVESLIST_CONTAINER_ID )
                        .children( 'li' ).each( function( idx, el )
                        {
                            console.log( $( el ) );
                            $( el ).delay( idx * pc.view.HangmanView.USERLIST_DELAY_MODIFIER ).removeClass( 'lost' );
                        } );

                    this.$el.find( pc.view.HangmanView.POINT_CONTAINER_ID )
                        .html( pc.view.HangmanView.START_POINTS )
                        .fadeIn( 'fast' );

                    // we have successfully asked this question
                    this.askedQuestions++;
                    this.points.start();
                }, this ) );

        },

        result: function()
        {

            var hangmanResults = this.player.get( 'results' ).where( { type: pc.model.TestResult.Type.HANGMAN } ),
                jsonResult = [],
                totalDuration = 0,
                totalErrors = 0,
                totalPoints = 0,
                itemInformation,
                rating;

            jsonResult = hangmanResults.map( function( result )
            {
                totalDuration += result.get( 'duration' );
                totalErrors += result.get( 'errors' );
                totalPoints += result.get( 'points' );
                itemInformation = {};

                var item = result.get( 'is' ).item;
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
                            date:     item.get( 'date' ),
                            location: item.get( 'location' )
                        }
                    };
                }

                return _.extend( itemInformation, {
                    duration: result.get( 'duration' ),
                    errors:   result.get( 'errors' ),
                    points:   result.get( 'points' )
                } );
            } );

            rating = totalPoints > 37500 ? $.t( pc.view.HangmanView.LANG_RATING_VERYGOOD )
                : totalPoints > 25000 ? $.t( pc.view.HangmanView.LANG_RATING_GOOD )
                         : totalPoints > 12500 ? $.t( pc.view.HangmanView.LANG_RATING_BAD )
                      : $.t( pc.view.HangmanView.LANG_RATING_VERYBAD );

            this.$el.fadeOut( _.bind( function()
            {
                this.$el
                    .html( this.templateResult( {
                        results: jsonResult,
                        totals:  {
                            duration: totalDuration,
                            errors:   totalErrors,
                            points:   totalPoints,
                            rating:   rating
                        }
                    } ) )
                    .fadeIn();

                this.trigger( 'hangmanview:done' );
            }, this ) );

        },

        _createObject: function( item )
        {

            if ( item instanceof pc.model.FacebookPicture ) {

                return pc.common.ImageContainer.create( item.get( 'source' ), item.get( 'caption' ) )
                    .toHtml()
                    .addClass( 'polaroid leftern' );
            }
            else if ( item instanceof pc.model.FacebookStatus ) {
                return pc.common.StatusContainer.create( item.get( 'caption' ), item.get( 'date' ),
                        item.get( 'place' ) )
                    .toHtml();
            }

            console.warn( "[EstimateView] Invalid object to use" );
            return null;

        },

        _showResults: function()
        {

            var container = this.$el.find( pc.view.HangmanView.USERLIST_CONTAINER_ID );

            container.children( 'li:not(.done)' ).each( function( idx, el )
            {
                var $el = $( el );
                var statusEl = $( '<div>' );
                $el.addClass( 'done' ).append( statusEl );

                if ( $el.data( 'correct' ) ) {
                    statusEl.addClass( 'correct' );
                }
                else {
                    statusEl.addClass( 'wrong' );
                }
            } );

        },

        _creatUserList: function( question )
        {

            var container = this.$el.find( pc.view.HangmanView.USERLIST_CONTAINER_ID ).empty().fadeIn( 'fast' );
            var correct = question.correct;
            var wrong = question.wrong;

            console.debug( '[HangmanView] Creating userlist for item', question );
            console.debug( '[HangmanView] Having corrects: ', correct );
            console.debug( '[HangmanView] Having wrong: ', wrong );
            if ( wrong.length === 0 ) {
                console.warn( "[HangmanView] Wrong is empty...." );
                wrong = this._getWrongUsers( question.item );
            }

            var userpool = new pc.model.FacebookUserCollection(),
                numWrongs = 0,
                delaymod = 0;

            // select the lower of wrong users
            while ( numWrongs++ <= pc.view.HangmanView.DIE_AFTER_NUM ) {
                userpool.add( wrong.shift().set( '_hangmantypecorrect', false ) );
            }

            while ( userpool.length < pc.view.HangmanView.MAX_USERS ) {

                // coinflip = 0 -> get wrong user unless wrong user threeshold reached AND there are correct users left
                if ( !$.randomBetween( 0,
                    2 ) && numWrongs * pc.view.HangmanView.MAX_WRONG_PERCENTAGE < pc.view.HangmanView.MAX_USERS ) {
                    userpool.add( wrong.shift().set( '_hangmantypecorrect', false ) );
                    numWrongs++;
                }
                else if ( correct.length !== 0 ) {
                    // we can only find correct user if there are some
                    userpool.add( correct.shift().set( '_hangmantypecorrect', true ) );
                }

            }

            // shuffle and create the list
            _.each( userpool.shuffle(), _.bind( function( user )
            {

                console.debug( "[HangmanView] Selected user", user );
                var itemtype = user.get( '_hangmantypecorrect' );

                var userLi = $( '<li>' ).hide(),
                    that = this;
                userLi.addClass( 'user' );
                // attach data to element
                userLi.data( {
                    user:    user,
                    correct: itemtype
                } );
                userLi.tooltip( {
                    title:     user.get( 'name' ),
                    placement: 'right'
                } );
                userLi.click( function()
                {
                    that._validateclick( this );
                } );
                userLi.css( 'background-image',
                    'url(' + _.template( pc.view.HangmanView.FB_IMAGE_BASE_URL )( {uid: user.id} ) + ')' );

                container.append( userLi );
                userLi.delay( delaymod++ * pc.view.HangmanView.USERLIST_DELAY_MODIFIER ).fadeIn( 'slow' );

            }, this ) );

            console.debug( '[HangmanView] Userlist created' );

        },

        _validateclick: function( item )
        {
            var $item = $( item ),
                container = this.$el.find( pc.view.HangmanView.USERLIST_CONTAINER_ID ),
                correct = $item.data( 'correct' ),
                user = $item.data( 'user' );

            console.log( '[HangmanView] Player selected ', user, ' which is ', correct );

            var statusEl = $( '<div>' );
            $item.addClass( 'done' ).append( statusEl );

            if ( correct ) {
                statusEl.addClass( 'correct' );
            }
            // user select wrong item hangman +1
            else {
                this.points.event( pc.view.HangmanView.LOSE_WRONG_CLICK );
                this.errors++;
                statusEl.addClass( 'wrong' );
                this.$el.find( pc.view.HangmanView.LIVESLIST_CONTAINER_ID + " li:not(.lost):last" ).addClass( 'lost' );

                if ( this.currentQuestion.selectedWrong.add( user ).length > pc.view.HangmanView.DIE_AFTER_NUM - 1 ) {
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

        },

        _getWrongUsers: function( item )
        {
            var list = new pc.model.FacebookUserCollection(),
                privacy = item.get( 'privacy' ),
                level = privacy.get( 'level' ),
                exclude = privacy.get( 'exclude' ),
                include = privacy.get( 'include' ),
                foreigners = pc.model.FacebookPlayer.getInstance().getForeigners(),
                playerid = pc.model.FacebookPlayer.getInstance().get( 'id' ),
                user;

            switch ( level ) {

                case pc.common.PrivacyDefinition.Level.FOF:
                case pc.common.PrivacyDefinition.Level.FRIENDS:
                case pc.common.PrivacyDefinition.Level.ME:
                case pc.common.PrivacyDefinition.Level.CUSTOM:

                    while ( list.length < pc.view.HangmanView.WRONG_ITEMS ) {
                        user = undefined;
                        if ( exclude.length > 0 && $.randomBetween( 0, 1 ) === 0 ) {
                            user = exclude.at( $.randomBetween( 0, exclude.length ) );
                        }

                        if ( user === undefined ) {
                            user = foreigners.at( $.randomBetween( 0, foreigners.length ) );
                        }

                        if ( user !== undefined && user.get( 'id' ) !== playerid && !list.contains( user ) && !include.contains( user ) ) {
                            list.add( user );
                        }
                    }

                    break;

                case pc.common.PrivacyDefinition.Level.ALL:

                    user = undefined;
                    while ( list.length < pc.view.HangmanView.WRONG_ITEMS && exclude.length > list.length ) {
                        user = exclude.at( $.randomBetween( 0, exclude.length ) );

                        if ( user !== undefined && user.get( 'id' ) !== playerid && !list.contains( user ) && !include.contains( user ) ) {
                            list.add( user );
                        }
                    }

                    break;

                default:

                    console.warn( "[HangmanView] Found unknown privacy level for wrong users, taking only foreigners" );

                    user = undefined;
                    while ( list.length < pc.view.HangmanView.WRONG_ITEMS ) {
                        user = foreigners.at( $.randomBetween( 0, foreigners.length ) );

                        if ( user !== undefined && user.get( 'id' ) !== playerid && !list.contains( user ) && !include.contains( user ) ) {
                            list.add( user );
                        }
                    }

                    break;

            }

            console.debug( '[HangmanView] Wrong users for item ', item, ' are ', list );

            return list;

        },

        _getCorrectUsers: function( item )
        {

            var list = new pc.model.FacebookUserCollection(),
                privacy = item.get( 'privacy' ),
                level = privacy.get( 'level' ),
                exclude = privacy.get( 'exclude' ),
                include = privacy.get( 'include' ),
                foreigners = pc.model.FacebookPlayer.getInstance().getForeigners(),
                friends = pc.model.FacebookPlayer.getInstance().getFriends(),
                user;

            switch ( level ) {

                case pc.common.PrivacyDefinition.Level.FRIENDS:
                case pc.common.PrivacyDefinition.Level.FOF:
                case pc.common.PrivacyDefinition.Level.ME:

                    while ( list.length < pc.view.HangmanView.CORRECT_ITEMS ) {
                        user = undefined;
                        if ( include.length > 0 && $.randomBetween( 0, 1 ) === 0 ) {
                            user = include.at( $.randomBetween( 0, include.length ) );
                        }

                        if ( user === undefined ) {
                            user = friends.at( $.randomBetween( 0, friends.length ) );
                        }

                        if ( user === undefined || (list.contains( user ) && exclude.contains( user )) ) {
                            continue;
                        }

                        list.add( user );
                    }

                    break;

                case pc.common.PrivacyDefinition.Level.CUSTOM:

                    var i = 0;
                    while ( include.length !== 0 && list.length < this.CORRECT_ITEMS ) {
                        user = undefined;
                        if ( include.length > 0 ) {
                            user = include.at( $.randomBetween( 0, include.length ) );
                        }

                        if ( include.length < i ) {
                            break;
                        }

                        if ( user === undefined || (list.contains( user ) && exclude.contains( user )) ) {
                            continue;
                        }

                        list.add( user );
                        i++;
                    }

                    break;

                case pc.common.PrivacyDefinition.Level.ALL:

                    while ( list.length < pc.view.HangmanView.CORRECT_ITEMS ) {
                        user = undefined;
                        var coinflip = $.randomBetween( 0, 2 );
                        if ( include.length > 0 && coinflip === 0 ) {
                            user = include.at( $.randomBetween( 0, include.length ) );
                        }
                        else if ( coinflip === 1 ) {
                            user = friends.at( $.randomBetween( 0, friends.length ) );
                        }

                        if ( user === undefined ) {
                            user = foreigners.at( $.randomBetween( 0, foreigners.length ) );
                        }

                        if ( user === undefined || (list.contains( user ) && exclude.contains( user )) ) {
                            continue;
                        }

                        list.add( user );
                    }

                    break;

            }

            console.debug( '[HangmanView] Correct users for item ', item, ' are ', list );

            return list;

        }

    }, {

        USERLIST_CONTAINER_ID:  '.userlist',
        LIVESLIST_CONTAINER_ID: '.lives',
        ITEM_CONTAINER:         '.item',
        POINT_CONTAINER_ID:     '.points',

        FB_IMAGE_BASE_URL: "https://graph.facebook.com/<%- uid %>/picture?width=80&height=80",

        USERLIST_DELAY_MODIFIER: 50,

        LOADER_GIF_SRC: 'img/loader.gif',

        DIE_AFTER_NUM:        5,
        MAX_USERS:            20,
        MAX_WRONG_PERCENTAGE: 0.5,
        WRONG_ITEMS:          20,
        CORRECT_ITEMS:        20,

        START_POINTS:     10000,
        LOSE_WRONG_CLICK: 1000,
        LOSE_PER_SECOND:  250,

        RESULT: {
            WON: 0, LOST: 1, TIMEOUT: 2
        },

        LANG_GAME_LOST:       "app.hangman.game.lost",
        LANG_GAME_WON:        "app.hangman.game.won",
        LANG_GAME_TIMEOUT:    "app.hangman.game.timeout",
        LANG_RATING_VERYGOOD: "app.hangman.result.ratings.verygood",
        LANG_RATING_GOOD:     "app.hangman.result.ratings.good",
        LANG_RATING_BAD:      "app.hangman.result.ratings.bad",
        LANG_RATING_VERYBAD:  "app.hangman.result.ratings.verybad"


    } );

})();