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
                    console.info( "[TestData] Scope is IMAGES" );
                    this.set( 'pictures', this._collectPictures() );
                    break;
                case pc.model.TestData.Scope.STATUSES:
                    console.info( "[TestData] Scope is STATUSES" );
                    this.set( 'statuses', this._collectStatuses() );
                    break;
                case pc.model.TestData.Scope.BOTH:
                    console.info( "[TestData] Scope is BOTH" );
                    this.set( 'pictures', this._collectPictures() );
                    this.set( 'statuses', this._collectStatuses() );
                    break;
                default:
                    console.error( "[TestData] Unknown game scope:", scope );
                    throw "E_UNKNOWN_SCOPE";
            }

            var pointer = this.MAX_INIT_ITEMS;
            this.rateSource = _.union( this.get( 'pictures' ).models, this.get( 'statuses' ).models );
            this.rateSource = _.shuffle( this.rateSource );

            console.debug( "[TestData] Collected and shuffled data", this.rateSource, "with scope", scope );

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
            console.debug( this.rateSource );
            if ( --this.remainingRates < 0 || this.alreadyComparedTuples.length > Math.pow( 2,
                this.rateSource.length ) ) {
                console.debug( '[TestData] Rating done: ', this.rateTupples );
                return null;
            }

            this.ratePtr = this.ratePtr % this.rateSource.length;

            console.debug( "[TestData] Selecting rate tupple from ", this.rateSource, "at pointer", this.ratePtr );

            var one = this.rateSource[ this.ratePtr++ ],
                two = null,
                alreadyseen = true;

            console.debug( '[TestData] (1) Pair is ', one, ' and ', two );

            while ( alreadyseen || one === two ) {

                two = this.rateSource[ _.random( this.rateSource.length ) ];
                if ( _.isUndefined( two ) ) {
                    continue;
                }

                alreadyseen = _.contains( this.alreadyComparedTuples, parseInt( one.id, 10 ) + parseInt( two.id, 10 ) );
            }

            this.alreadyComparedTuples.push( parseInt( one.id, 10 ) + parseInt( two.id, 10 ) );

            console.debug( '[TestData] (2) Pair is ', one, ' and ', two );

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

            // attach the points to the item
            one.set( 'points', res.a );
            two.set( 'points', res.b );

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
         * Get a list of all items ordered by their rating (desc)
         *
         * @method getOrderedList
         * @returns {Array} A array with all items ordered by points descending
         */
        getOrderedList: function()
        {

            var list = [],
                i = this.MAX_INIT_ITEMS,
                highest = 0,
                pickedId = 0,
                el,
                rateTupples = _.clone( this.rateTupples );

            while ( --i >= 0 ) {
                _.each( _.keys( rateTupples ), _.bind( function( id )
                {
                    if ( highest === 0 || highest <= rateTupples[id] ) {
                        pickedId = id;
                        highest = rateTupples[id];
                    }
                }, this ) );

                console.debug( "[TestData] Highest rating found is ", highest, pickedId );

                if ( pickedId === 0 ) {
                    console.warn( '[TestData] Picked id is 0, skipping' );
                    continue;
                }

                delete rateTupples[pickedId];

                el = this.get( 'pictures' ).get( pickedId );
                if ( !el ) el = this.get( 'statuses' ).get( pickedId );
                el.set( 'points', highest );
                list.push( el );

                console.log( "[TestData] Selected item to use: ", pickedId );

                el = undefined;
                pickedId = 0;
                highest = 0;
            }

            return list;
        },

        /**
         * Get the TEST_DATA_SIZE elements with highest score from the test data collection.<br />
         * Sets the data attribute.
         *
         * @method extractTestData
         */
        extractTestData: function()
        {

            if ( this.get( 'data' ) !== undefined ) return;

            var data = [],
                orderedList = this.getOrderedList();

            if ( orderedList.length <= this.TEST_DATA_SIZE ) {
                console.error( "[TestData] Insufficient data", orderedList.length, this.TEST_DATA_SIZE, orderedList );
                throw "E_INSUFFICIENT_DATA";
            }

            for ( var i = this.TEST_DATA_SIZE; i > 0; i-- ) {
                data.push( orderedList.shift() );
            }

            this.set( 'data', data );
            console.log( '[TestData] The following data is select to test: ', data );

        },

        /**
         * Validate if a player has enough pictures to play
         *
         * @returns {boolean} True if player has enough
         * @method hasEnoughPictures
         */
        hasEnoughPictures: function()
        {
            return (this._collectPictures().length >= (this.MAX_INIT_ITEMS));
        },

        /**
         * Validate if a player has enough statuses to play
         *
         * @returns {boolean} True if player has enough
         * @method hasEnoughStatuses
         */
        hasEnoughStatuses: function()
        {
            return (this._collectStatuses().length >= (this.MAX_INIT_ITEMS));
        },

        /**
         * Validate if a player has enough statuses and pictures to play
         *
         * @returns {boolean} True if player has enough
         * @method hasEnoughCombined
         */
        hasEnoughCombined: function()
        {
            return ((this._collectStatuses().length + this._collectPictures().length ) >= (this.MAX_INIT_ITEMS));
        },

        /**
         * Validate if a palyer has too many public items and therefore cannot play
         *
         * @returns {boolean} True if a player has too many public items and no private
         * @method hasTooManyPublic
         */
        hasTooManyPublic: function() {
            var totalItemsPlayer = this.player.getPictures().length + this.player.getStatuses().length;
            return (totalItemsPlayer >= this.MAX_INIT_ITEMS && !this.hasEnoughCombined());
        },

        /**
         * Collect a few pictures from the player's collected picture set.<br />
         * These pictures are later used for comparison.
         *
         * @method _collectPictures
         * @private
         * @returns {Array} A arr with MAX_INIT_ITEMS or less pictures
         */
        _collectPictures: function()
        {
            console.log( '[TestData] Collecting pictures for test' );

            var availablePics = this.player.getPictures();
            var pickedPlain = this._genericCollector( availablePics );
            var pickedPics = new pc.model.FacebookPictureCollection( pickedPlain );

            console.info( '[TestData] Using the following ' + this.MAX_INIT_ITEMS + ' pictures for test:',
                pickedPics );

            return pickedPics;
        },

        /**
         * Collect a few statuses from the player's collected statuses set.<br />
         * These statuses are later used for comparison.
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

            console.info( '[TestData] Using the following ' + this.MAX_INIT_ITEMS + ' statuses for test:',
                pickedStatuses );

            return pickedStatuses;
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

            arr = new Backbone.Collection( _.compact( arr.map( function( el )
            {
                if ( !_.isUndefined( el.get( 'privacy' ) ) && !_.isUndefined( el.get( 'privacy' ).get( 'level' ) ) &&
                    el.get( 'privacy' ).get( 'level' ) !== pc.common.PrivacyDefinition.Level.ALL &&
                    el.get( 'privacy' ).get( 'level' ) !== pc.common.PrivacyDefinition.Level.NOBODY ) {
                    return el;
                }
                else {
                    console.debug( "[TestData] Removed invalid item, ", el );
                    return null;
                }
            } ) ) );

            var i = arr.length < this.MAX_INIT_ITEMS ? arr.length : this.MAX_INIT_ITEMS;

            console.debug( '[TestData] available ' + arr.length + ' to pick ' + i );

            while ( i > picked.length ) {
                var rndm = _.random( arr.length - 1 );
                var item = arr.at( rndm );

                if ( _.isUndefined( item ) || _.isUndefined( item.get( 'privacy' ).get( 'level' ) ) || _.contains( picked,
                    item ) ) {
                    continue;
                }

                picked.push( item );

            }

            return picked;

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