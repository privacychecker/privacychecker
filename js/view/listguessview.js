var ListGuessView = Backbone.View.extend({

	QUESTION_FIELD_ID: "div#question",
	RESPONSE_FIELD_ID: "input#response",
	PROGRESS_ID: "div#guess1-progress",

	LANG_QUESTION_FRIEND: 'app.listguess.question_friends',
	LANG_QUESTION_LIST: 'app.listguess.question_list',
	LANG_GUESS_HIGH: 'app.listguess.guess_results.high',
	LANG_GUESS_LOW: 'app.listguess.guess_results.low',
	LANG_GUESS_CORRECT: 'app.listguess.guess_results.correct',

	MAX_QUESTIONS: 5,

	initialize: function() {
		console.log("[ListGuessView] Init: ListGuessView");
		this.template = Handlebars.compile(tpl.get("listguess"));
		this.currentQuestion = undefined;
	},

	render: function(eventName) {
		$(this.el).html(this.template());

		this.player = FacebookPlayer.getInstance();

		this.questions = [];

		this.questions.push({
			type: ListGuessView.QuestionType.ALL,
			is: this.player.getFriends().length
		});

		this.player.getFriendLists().each(_.bind(function(list) {
			if (this.questions.length + 1 > this.MAX_QUESTIONS) return;
			this.questions.push({
				type: ListGuessView.QuestionType.LIST,
				is: list.get('members').length,
				name: list.get('name')
			});
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

		console.debug('[ListGuessView] ' + this.questions.length + " questions");

		this.next();

		return this;
	},

	next: function() {

		this.currentQuestion = this.questions.shift();

		if (this.currentQuestion === undefined) {
			$(this.el).find(this.RESPONSE_FIELD_ID).unbind('keypress', this.keypressCb);

			$(this.el).find(this.PROGRESS_ID).css("width", "100%").html(this.askedQuestions + '/' + this.questionsLength);
			$(this.el).find(this.PROGRESS_ID).first().parent().removeClass('active');

			console.debug('[ListGuessView] Game finished');
			this.trigger('listguessview:done');
			return;
		}

		var questionText = null;
		switch(this.currentQuestion.type) {
			case ListGuessView.QuestionType.ALL:
				questionText = i18n.t(this.LANG_QUESTION_FRIEND);
				break;
			case ListGuessView.QuestionType.LIST:
				questionText = i18n.t(this.LANG_QUESTION_LIST, {
					listname: this.currentQuestion.name
				});
				break;
		}
		
		console.debug('[ListGuessView] Current question: ' + questionText);

		var question = $('<p>', {
			html: questionText
		});

		$(this.el).find(this.PROGRESS_ID)
			.css("width", this.askedQuestions / this.questionsLength * 100 + "%")
			.html(this.askedQuestions + '/' + this.questionsLength);

		$(this.el).find(this.RESPONSE_FIELD_ID).fadeOut('fast');
		$(this.el).find(this.QUESTION_FIELD_ID).fadeOut('fast', _.bind(function() {
			$(this.el).find(this.QUESTION_FIELD_ID).empty().append(question).fadeIn('fast');
			$(this.el).find(this.RESPONSE_FIELD_ID).val('').fadeIn('fast');
			this.askedQuestions++;
		}, this));

	},

	_evaluateResponse: function() {

		var response = $(this.el).find(this.RESPONSE_FIELD_ID).val();
		var correctV = this.currentQuestion.is;

		if (!$.isNumeric(response)) return false;

		var responseI = parseInt(response);

		var message;
		if (responseI > correctV) message = i18n.t(this.LANG_GUESS_HIGH);
		else if (responseI == correctV) message = i18n.t(this.LANG_GUESS_CORRECT);
		else if (responseI < correctV) message = i18n.t(this.LANG_GUESS_LOW);

		var result = new TestResult({
			is: responseI,
			was: correctV,
			type: TestResult.Type.LISTGUESS,
			message: message
		});

		console.debug('[ListGuessView] Question result was ', result);

		this.player.get('results').add(result);

		return true;

	}

}, {
	QuestionType: {
		ALL: 0, LIST: 1
	}
});