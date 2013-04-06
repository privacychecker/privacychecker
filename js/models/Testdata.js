(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    /**
     * A testdata set.<br />
     * Testdata represents a set of pictures and statuses used to play
     *
     * @namespace pc.model
     * @class TestData
     * @extends Backbone.Model
     */
    ns.TestData = Backbone.Model.extend( {

        USE_PICTURES:   true,
        USE_POSTS:      false,
        MAX_INIT_ITEMS: 12,
        TEST_ROUNDS:    20,
        INITIAL_SCORE:  1000,
        TEST_DATA_SIZE: 5,

        /**
         * Create a new set of testdata
         *
         * @method
         * @constructor
         */
        initialize: function()
        {
            this.player = pc.model.FacebookPlayer.getInstance();
            this.set( 'pictures', undefined );
            this.set( 'statuses', undefined );
            this.set( 'data', undefined );

            if ( this.USE_PICTURES ) {
                this._collectPictures();
            }

            this.rateTupples = {};
            this.alreadyComparedTuples = [];
            this.ratePtr = 0;
            this.elo = new EloRating(); // NOQA
            this.remainingRates = this.TEST_ROUNDS;
        },

        /**
         * Get a new pair of Testdata instances to rate.<br />
         * These pairs a are always different.
         *
         * @method getRateTupple
         * @returns {Array<pc.model.FacebookPicture|pc.model.FacebookStatus>} A pair to rate
         */
        getRateTupple: function()
        {

            var pictures = this.get( 'pictures' );

            if ( --this.remainingRates < 0 ) {
                console.debug( '[TestData] Rating done: ', this.rateTupples );
                this._extractTestData();
                return undefined;
            }

            this.ratePtr = this.ratePtr % pictures.length;

            var one = pictures.at( this.ratePtr++ ),
                two = null,
                alreadyseen = true;

            while ( alreadyseen || one === two ) {
                two = pictures.at( $.randomBetween( 0, pictures.length ) );
                if ( !two ) {
                    continue;
                }
                alreadyseen = _.contains( this.alreadyComparedTuples, one.id + two.id );
            }

            this.alreadyComparedTuples.push( one.id + two.id );

            console.debug( '[TestData] Pair is ', one, ' and ', two );

            return [one, two];

        },

        /**
         * Set the winner of a comparison.<br />
         * The winner gets points depending on the opponent's current rating.
         *
         * @method setWinner
         * @param {pc.model.FacebookPicture|pc.model.FacebookStatus} one
         * @param {pc.model.FacebookPicture|pc.model.FacebookStatus} two
         * @param {pc.model.FacebookPicture|pc.model.FacebookStatus} winner The winner must be either one or two
         */
        setWinner: function( one, two, winner )
        {

            var oneRating = this.rateTupples[one.id] !== undefined ? this.rateTupples[one.id] : this.INITIAL_SCORE;
            var twoRating = this.rateTupples[two.id] !== undefined ? this.rateTupples[two.id] : this.INITIAL_SCORE;

            this.elo.setNewSetings( oneRating, twoRating, one === winner ? 1 : 0, two === winner ? 1 : 0 );
            var res = this.elo.getNewRatings();

            this.rateTupples[one.id] = res.a;
            this.rateTupples[two.id] = res.b;

            console.log( '[TestData] New scores: ', res.a, res.b );

        },

        /**
         * How many rounds are used to rate items
         *
         * @method getMaxRounds
         * @returns {number} max rounds
         */
        getMaxRounds: function()
        {
            return this.TEST_ROUNDS;
        },

        /**
         * Current round of maxRounds
         *
         * @method getCurrentRound
         * @returns {number} current round
         */
        getCurrentRound: function()
        {
            return this.TEST_ROUNDS - this.remainingRates;
        },

        /**
         * Collect a few pictures from the player's collected picture set.<br />
         * These pictures are later used for comparison.<br />
         * Sets the pictures attribute
         *
         * @method _collectPictures
         * @private
         */
        _collectPictures: function()
        {
            console.log( '[TestData] Collecting pictures for test' );

            var availablePics = this.player.getPictures();
            var pickedPics = new pc.model.FacebookPictureCollection();

            if ( availablePics.length <= this.TEST_DATA_SIZE ) {
                console.error( "[TestData] Insufficient data", availablePics.length, this.TEST_DATA_SIZE );
                throw new pc.common.Exception( {message: "insufficient data"} );
            }

            var i = availablePics.length < this.MAX_INIT_ITEMS ? availablePics.length : this.MAX_INIT_ITEMS;

            console.debug( '[TestData] availablePics ' + availablePics.length + ' to pick ' + i );

            while ( i-- > 0 ) {
                var pic = availablePics.at( $.randomBetween( 0, availablePics.length ) );

                if ( pic !== undefined && pic.get( 'privacy' ).get( 'level' ) !== pc.common.PrivacyDefinition.Level.NOBODY && !pickedPics.contains( pic ) ) {
                    pickedPics.add( pic );
                }
                else {
                    ++i;
                }
            }

            this.set( 'pictures', pickedPics );
            console.info( '[TestData] Using the following ' + this.MAX_INIT_ITEMS + ' pictures for test:',
                this.get( 'pictures' ) );
        },

        /**
         * Get the TEST_DATA_SIZE elements with highest score from the test data collection.<br />
         * Sets the data attribute.
         *
         * @method _extractTestData
         * @private
         */
        _extractTestData: function()
        {

            var i = this.TEST_DATA_SIZE;
            var data = [];

            while ( --i >= 0 ) {
                var highest = null;
                _.each( _.keys( this.rateTupples ), _.bind( function( id )
                {
                    if ( highest === null || highest <= this.rateTupples[id] ) {
                        highest = id;
                    }
                }, this ) );

                delete this.rateTupples[highest];

                data.push( this.get( 'pictures' ).get( highest ) );
            }

            this.set( 'data', data );
            console.log( '[TestData] The following data is select to test: ', data );

        }

    }, {
        /**
         * Get a singleton instance of test data.
         *
         * @method getInstance
         * @returns {pc.model.TestData} A singleton instance
         * @static
         */
        getInstance: function()
        {
            if ( this.__instance === undefined ) {
                this.__instance = new pc.model.TestData();
            }
            return this.__instance;
        }
    } );

})();