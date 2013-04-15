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
            this.set( 'pictures', new pc.model.FacebookPictureCollection() );
            this.set( 'statuses', new pc.model.FacebookStatusCollection() );
            this.set( 'data', undefined );

            this.rateTupples = {};
            this.alreadyComparedTuples = [];
            this.ratePtr = 0;
            this.elo = new EloRating(); // NOQA
            this.remainingRates = this.TEST_ROUNDS;
            this.rateSource = [];
        },

        /**
         * Set the scope for the game.<br />
         * Can be set to use images or statuses only or a combination of both
         *
         * @method setScope
         * @param {pc.model.TestData.Scope} scope The scope to use
         * @throws "E_UNKNOWN_SCOPE" If the scope is unknown
         */
        setScope: function( scope )
        {
            switch ( scope ) {
                case pc.model.TestData.Scope.IMAGES:
                    this._collectPictures();
                    break;
                case pc.model.TestData.Scope.STATUSES:
                    this._collectStatuses();
                    break;
                case pc.model.TestData.Scope.BOTH:
                    this._collectPictures();
                    this._collectStatuses();
                    break;
                default:
                    console.error( "[TestData] Unknown game scope:", scope );
                    throw "E_UNKNOWN_SCOPE";
            }

            console.debug( "[TestData] Collected data", this.rateSource, "with scope", scope );

            var pointer = this.MAX_INIT_ITEMS;
            this.rateSource = _.union( this.get( 'pictures' ).models, this.get( 'statuses' ).models );
            this.rateSource = _.shuffle( this.rateSource );
            console.debug( "[TestData] Shuffled rate source array", this.rateSource );

            // trim the array
            this.rateSource = _.compact( _.map( this.rateSource, function( el )
            {
                if ( --pointer >= 0 ) {
                    return el;
                }
                else {
                    return null;
                }
            } ) );

            console.info( "[TestData] Selected the following data for rating: ", this.rateSource );

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
            if ( --this.remainingRates < 0 || this.alreadyComparedTuples.length > Math.pow( 2,
                this.rateSource.length ) ) {
                console.debug( '[TestData] Rating done: ', this.rateTupples );
                this._extractTestData();
                return null;
            }

            this.ratePtr = this.ratePtr % this.rateSource.length;

            var one = this.rateSource[ this.ratePtr++ ],
                two = null,
                alreadyseen = true;

            while ( alreadyseen || one === two ) {

                two = this.rateSource[ $.randomBetween( 0, this.rateSource.length ) ];
                if ( !two ) {
                    continue;
                }

                alreadyseen = _.contains( this.alreadyComparedTuples, parseInt( one.id, 10 ) + parseInt( two.id, 10 ) );
            }

            this.alreadyComparedTuples.push( parseInt( one.id, 10 ) + parseInt( two.id, 10 ) );

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
            var pickedPlain = this._genericCollector( availablePics );
            var pickedPics = new pc.model.FacebookPictureCollection( pickedPlain );

            this.set( 'pictures', pickedPics );
            console.info( '[TestData] Using the following ' + this.MAX_INIT_ITEMS + ' pictures for test:',
                this.get( 'pictures' ) );
        },

        /**
         * Collect a few statuses from the player's collected statuses set.<br />
         * These statuses are later used for comparison.<br />
         * Sets the statuses attribute
         *
         * @method _collectStatuses
         * @private
         */
        _collectStatuses: function()
        {
            console.log( '[TestData] Collecting statuses for test' );

            var availableStatuses = this.player.getStatuses();
            var pickedPlain = this._genericCollector( availableStatuses );
            var pickedStatuses = new pc.model.FacebookStatusCollection( pickedPlain );

            this.set( 'statuses', pickedStatuses );
            console.info( '[TestData] Using the following ' + this.MAX_INIT_ITEMS + ' statuses for test:',
                this.get( 'statuses' ) );
        },

        /**
         * Randomly select MAX_INIT_ITEMS from arr.
         *
         * @method _genericCollector
         * @param {Array<pc.model.FacebookPicture|pc.model.FacebookStatus>} arr The source arr to select from
         * @returns {Array} A arr with MAX_INIT_ITEMS items from arr
         * @private
         */
        _genericCollector: function( arr )
        {

            var picked = [];

            if ( arr.length <= this.TEST_DATA_SIZE ) {
                console.error( "[TestData] Insufficient data", arr.length, this.TEST_DATA_SIZE );
                throw new pc.common.Exception( {message: "insufficient data"} );
            }

            var i = arr.length < this.MAX_INIT_ITEMS ? arr.length : this.MAX_INIT_ITEMS;

            console.debug( '[TestData] available ' + arr.length + ' to pick ' + i );

            while ( i-- > 0 ) {
                var pic = arr.at( $.randomBetween( 0, arr.length ) );

                if ( pic && pic.get( 'privacy' ).get( 'level' ) !== pc.common.PrivacyDefinition.Level.NOBODY && !_.contains( picked,
                    pic ) ) {
                    picked.push( pic );
                }
                else {
                    ++i;
                }
            }

            return picked;

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

            var i = this.TEST_DATA_SIZE,
                data = [],
                el,
                highest,
                pickedId = 0;

            while ( --i >= 0 ) {
                 highest = null;
                _.each( _.keys( this.rateTupples ), _.bind( function( id )
                {
                    if ( highest === null || highest <= this.rateTupples[id] ) {
                        pickedId = id;
                        highest = this.rateTupples[id];
                        console.debug("[TestData] Highest rating found is ", highest, pickedId );
                    }
                }, this ) );

                if (pickedId === 0) {
                    console.warn('[TestData] Picked id is 0, skipping');
                    continue;
                }

                delete this.rateTupples[pickedId];

                el = this.get( 'pictures' ).get( pickedId );
                if ( !el ) el = this.get( 'statuses' ).get( pickedId );
                data.push( el );

                console.log("[TestData] Selected item to use: ", pickedId);

                el = undefined;
                pickedId = 0;
            }

            this.set( 'data', data );
            console.log( '[TestData] The following data is select to test: ', data );

        }

    }, {

        /**
         * @property { {String: Number}} scope Enum defining the game scope
         */
        Scope: {
            IMAGES: 0, STATUSES: 1, BOTH: 2
        },

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