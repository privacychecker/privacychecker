var TestData = Backbone.Model.extend({

	USE_PICTURES: true,
	USE_POSTS: false,
	MAX_INIT_ITEMS: 15,
	ITEMS_TO_TEST: 3,
	INITIAL_SCORE: 1000,

	/* attributes
	* pictures
	* posts
	*/

	initialize: function(player) {
		this.player = FacebookPlayer.getInstance();
		this.set('pictures', undefined);
		this.set('posts', undefined);

		if (this.USE_PICTURES)
			this._collectPictures();

		this.rateTupples = {};
		this.allreadyComparedTuples = [];
		this.ratePointer = 0;
		this.elo = new EloRating();
	},

	getRateTupple: function() {

		var ptr = this.ratePointer;

		if (ptr >= this.get('pictures').length) return undefined;

		var one = this.get('pictures').at(ptr++);
		var two = this.get('pictures').at(ptr++);

		this.ratePointer = ptr;
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
	}

}, {
	getInstance: function() {
		if (this.__instance === undefined) {
			this.__instance = new this();
		}
		return this.__instance;
	}
});