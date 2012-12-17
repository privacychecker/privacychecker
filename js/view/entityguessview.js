var EntityGuessView = Backbone.View.extend({

	ITEM_PLACEHOLDER_ID: "div#entity",
	RESPONSE_FIELD_ID: "input#response",
	PROGRESS_ID: "div#guess2-progress",

	LANG_GUESS_WRONG: 'app.entityguess.guess_results.wrong',
	LANG_GUESS_CORRECT: 'app.entityguess.guess_results.correct',

	FOF_LOWER_NUMBER: 100,
	FOF_UPPER_NUMBER: 200,
	ALL_UPPER_NUMBER: 1000000000,

	initialize: function() {
		console.log("[ListGuessView] Init: EntityGuessView");
		this.template = Handlebars.compile(tpl.get("entityguess"));
		this.currentQuestion = undefined;
	},

	render: function(eventName) {
		$(this.el).html(this.template());

		this.player = FacebookPlayer.getInstance();

		this.questions = [];

		_.each(TestData.getInstance().get('data'), _.bind(function(item) {

			if (item instanceof FacebookPicture) {
				try {
					var range = this._getThreashold(item);
					this.questions.push({
						range: range,
						item: item
					});
				}
				catch(e) {
					console.error("Caught exception while creating item: ", e);
				}
			}
			else {
				console.error("Unknown item for guess game");
				throw new Error({message: "Unknown item for guess game"});
			}

		}, this));

		this.questionsLength = this.questions.length;
		this.askedQuestions = 0;

		this.keypressCb = _.bind(function(e) {
			if ((e.keyCode || e.which) == 13) {
				e.preventDefault();
				if (this._evaluateResponse())
					this.next();
			}
		}, this);

		$(this.el).find(this.RESPONSE_FIELD_ID).keypress(this.keypressCb);

		console.debug('[EntityGuessView] ' + this.questions.length + " entities to show");

		this.next();

		return this;
	},

	next: function() {

		this.currentQuestion = this.questions.shift();

		if (this.currentQuestion === undefined) {
			$(this.el).find(this.RESPONSE_FIELD_ID).unbind('keypress', this.keypressCb);

			$(this.el).find(this.PROGRESS_ID).css("width", "100%").html(this.askedQuestions + '/' + this.questionsLength);
			$(this.el).find(this.PROGRESS_ID).first().parent().removeClass('active');

			console.debug('[EntityGuessView] Game finished');
			this.trigger('entityguessview:done');
			return;
		}
		
		console.debug('[EntityGuessView] Current entity: ', this.currentQuestion);

		var item = this._createObject(this.currentQuestion);

		console.debug('[EntityGuessView] Created object: ', item);

		$(this.el).find(this.PROGRESS_ID)
			.css("width", this.askedQuestions / this.questionsLength * 100 + "%")
			.html(this.askedQuestions + '/' + this.questionsLength);

		$(this.el).find(this.RESPONSE_FIELD_ID).fadeOut('fast');
		$(this.el).find(this.ITEM_PLACEHOLDER_ID).fadeOut('fast', _.bind(function() {
			$(this.el).find(this.ITEM_PLACEHOLDER_ID).empty().append(item).fadeIn('fast');
			$(this.el).find(this.RESPONSE_FIELD_ID).val('').fadeIn('fast');
			this.askedQuestions++;
		}, this));

	},

	_evaluateResponse: function() {

		var response = $(this.el).find(this.RESPONSE_FIELD_ID).val();
		var correctV = this.currentQuestion.is;
		var item = this.currentQuestion.item;

		if (!$.isNumeric(response)) return false;

		var responseI = parseInt(response);

		var result = new TestResult({
			is: responseI,
			was: this.currentQuestion.range,
			type: TestResult.Type.ENTITYGUESS,
			item: item
		});

		console.debug('[ListGuessView] Question result was ', result);

		this.player.get('results').add(result);

		return true;

	},	

	_createObject: function(question) {

		var item = question.item;

		if (item instanceof FacebookPicture) {

			return $('<img>', {
				src: item.get('source'),
				title: item.get('name'),
				'class': 'img-rounded'
			}).click(_.bind(function() {
				this.next();
			}, this));

		}
		else if (item instanceof FacebookPost) {

		}

	},

	_getThreashold: function(item) {

		var upper;
		var lower;

		var privacy = item.get('privacy');

		switch(privacy.get('level')) {

			case PrivacyDefinition.Level.ALL:
				upper = this.ALL_UPPER_NUMBER;
				lower = FacebookPlayer.getInstance().getFriends().length * this.FOF_UPPER_NUMBER;
				break;

			case PrivacyDefinition.Level.FOF:
				upper = FacebookPlayer.getInstance().getFriends().length * this.FOF_UPPER_NUMBER;
				lower = FacebookPlayer.getInstance().getFriends().length * this.FOF_LOWER_NUMBER;

				upper -= privacy.get('exclude').length * this.FOF_UPPER_NUMBER;
				lower -= privacy.get('exclude').length * this.FOF_LOWER_NUMBER;

				upper += privacy.get('include').length * this.FOF_UPPER_NUMBER;
				lower += privacy.get('include').length * this.FOF_LOWER_NUMBER;

				break;

			case PrivacyDefinition.Level.FRIENDS:
				upper = FacebookPlayer.getInstance().getFriends().length;
				lower = FacebookPlayer.getInstance().getFriends().length;

				upper -= privacy.get('exclude').length;
				lower -= privacy.get('exclude').length;

				upper += privacy.get('include').length;
				lower += privacy.get('include').length;

				break;

			case PrivacyDefinition.Level.ME:
				upper = 1;
				lower = 1;

				upper += privacy.get('include').length;
				lower += privacy.get('include').length;

				break;

			case PrivacyDefinition.Level.NOBODY:
				upper = 0;
				lower = 0;
				
				break;

			default:
				throw new Error({message: "Invalid privacy type: " + privacy.get('level')});
		}

		var range = new Range({
			lower: lower,
			upper: upper
		});
		range.set('type', privacy.get('level'));

		return range;

	}

});

var Range = Backbone.Model.extend({

	initialize: function(p) {
		if (p.upper === undefined || p.lower === undefined) throw new Error({message: "Range needs lower and upper value"});
		else if (p.upper < p.lower) throw new Error({message: "Upper needs to be higher than lower"});

		this.lower = p.lower;
		this.upper = p.upper;
	},

	inRange: function(num) {
		return (num >= this.lower && num <= this.upper);
	}

});