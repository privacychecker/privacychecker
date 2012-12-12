var SelectView = Backbone.View.extend({

	ITEM_1_ID: "div#item1",
	ITEM_2_ID: "div#item2",
	PROGRESS_ID: "#select-progress",
	LOAD_URL: "img/loader.gif",

	initialize: function() {
		console.log("Init: SelectView");
		this.template = Handlebars.compile(tpl.get("select"));
		this.currentPair = undefined;
	},

	render: function(eventName) {
		$(this.el).html(this.template());

		this.testData = TestData.getInstance();
		$(this.el).find(this.PROGRESS_ID).html(this.testData.getCurrentRound() + '/' + this.testData.getMaxRounds());
		this.next();

		return this;
	},

	_createObject: function(item) {

		if (item instanceof FacebookPicture) {

			return $('<img>', {
				src: item.get('source'),
				title: item.get('name'),
				'class': 'img-rounded'
			}).click(_.bind(function() {
				this.next(item);
			}, this));

		}
		else if (item instanceof FacebookPost) {

		}

	},

	next: function(winner) {
		if (this.currentPair !== undefined) {
			console.log('[SelectView] Last comparision\'s winner was ', winner);
			this.testData.setWinner(this.currentPair[0], this.currentPair[1], winner);
			$(this.el).find(this.PROGRESS_ID).css("width", this.testData.getCurrentRound() / this.testData.getMaxRounds() * 100 + "%");
			$(this.el).find(this.PROGRESS_ID).html(this.testData.getCurrentRound() + '/' + this.testData.getMaxRounds());
		}

		this.currentPair = this.testData.getRateTupple();

		if (this.currentPair !== undefined) {
			
			var oneDiv = this._createObject(this.currentPair[0]);
			var twoDiv = this._createObject(this.currentPair[1]);

			$(this.el).find(this.ITEM_1_ID).fadeOut('fast');
			$(this.el).find(this.ITEM_2_ID).fadeOut('fast', _.bind(function() {
				$(this.el).find(this.ITEM_1_ID).empty().append(oneDiv).fadeIn('fast');
				$(this.el).find(this.ITEM_2_ID).empty().append(twoDiv).fadeIn('fast');
			}, this));

		}
		else {
			$(this.el).find(this.PROGRESS_ID).first().parent().removeClass('active');
			console.log('[SelectView] Selection done');
			this.trigger('select:done');
		}
	}

});