var TestData = Backbone.Model.extend({

	USE_PICTURES: true,
	USE_POSTS: false,
	MAX_INIT_ITEMS: 12,
	TEST_ROUNDS: 20,
	INITIAL_SCORE: 1000,
	TEST_DATA_SIZE: 5,

	/* attributes
	* pictures
	* posts
	*/

	initialize: function(player) {
		this.player = FacebookPlayer.getInstance();
		this.set('pictures', undefined);
		this.set('posts', undefined);
		this.set('data', undefined);

		if (this.USE_PICTURES)
			this._collectPictures();

		this.rateTupples = {};
		this.allreadyComparedTuples = [];
		this.ratePtr = 0;
		this.elo = new EloRating();
		this.remainingRates = this.TEST_ROUNDS;
	},

	getRateTupple: function() {

		var pictures = this.get('pictures');

		if (--this.remainingRates < 0) {
			console.debug('[TestData] Rating done: ', this.rateTupples);
			this._extractTestData();
			return undefined;
		}

		this.ratePtr = this.ratePtr % pictures.length;

		var one = pictures.at(this.ratePtr++);
		var two = null;

		var alreadyseen = true;
		while (alreadyseen || one === two) {
			two = pictures.at($.randomBetween(0, pictures.length));
			if (two === undefined) continue;
			alreadyseen = _.contains(this.allreadyComparedTuples, one.id+two.id);
		}

		this.allreadyComparedTuples.push(one.id+two.id);

		console.debug('[TestData] Pair is ', one, ' and ', two);

		return [one, two];

	},

	setWinner: function(one, two, winner) {

		var oneRating = this.rateTupples[one.id] !== undefined ? this.rateTupples[one.id] : this.INITIAL_SCORE;
		var twoRating = this.rateTupples[two.id] !== undefined ? this.rateTupples[two.id] : this.INITIAL_SCORE;

		this.elo.setNewSetings(oneRating, twoRating, one === winner ? 1 : 0, two === winner ? 1 : 0);
		var res = this.elo.getNewRatings();

		this.rateTupples[one.id] = res.a;
		this.rateTupples[two.id] = res.b;

		console.log('[TestData] New scores: ', res.a, res.b);

	},

	getMaxRounds: function() {
		return this.TEST_ROUNDS;
	},

	getCurrentRound: function() {
		return this.TEST_ROUNDS - this.remainingRates;
	},

	_collectPictures: function() {

		console.log('[TestData] Collecting pictures for test');

		var availablePics = this.player.getPictures();
		var pickedPics = new FacebookPictureCollection();
		var i = this.MAX_INIT_ITEMS;

		while (i-- > 0) {
			var pic = availablePics.at($.randomBetween(0, availablePics.length));

			if (!_.contains(pickedPics, pic)) pickedPics.push(pic);
			else ++i;
		}

		this.set('pictures', pickedPics);
		console.info('[TestData] Using the following ' + this.MAX_INIT_ITEMS + ' pictures for test:', this.get('pictures'));
	},

	_extractTestData: function() {

		var i = this.TEST_DATA_SIZE;
		var data = [];

		while (--i >=  0) {
			var highest = null;
			_.each(_.keys(this.rateTupples), _.bind(function(id) {
				if (highest === null || highest <= this.rateTupples[id])
					highest = id;
			}, this));

			delete this.rateTupples[highest];

			data.push(this.get('pictures').get(highest));
		}

		this.set('data', data);
		console.log('[TestData] The following data is select to test: ', data);

	}

}, {
	getInstance: function() {
		if (this.__instance === undefined) {
			this.__instance = new this();
		}
		return this.__instance;
	}
});