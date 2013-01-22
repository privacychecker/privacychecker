var ListGuessView = Backbone.View.extend({

	initialize: function() {
		console.log("[ListGuessView] Init: ListGuessView");
		this.template = Handlebars.compile(tpl.get("guess"));
		this.currentQuestion = undefined;
	},

	render: function(eventName) {
		$(this.el).html(this.template());

		this.player = FacebookPlayer.getInstance();

		this.questions = [];

		this.questions.push({
			type: ListGuessView.QuestionType.ALL,
			is: this.player.getFriends().length,
			name: 'Freunde'
		});

		var i = 1;
		var lists = this.player.getFriendLists();

		while (i <= ListGuessView.MAX_QUESTIONS) {
			var list = lists.at($.randomBetween(0, lists.length));
			if (list === undefined) continue;

			this.questions.push({
				type: ListGuessView.QuestionType.LIST,
				is: list.get('members').length,
				name: list.get('name')
			});
			i++;
		}
		this.player.getFriendLists().each(_.bind(function(list) {
			if (this.questions.length + 1 > this.MAX_QUESTIONS) return;
			
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

		$(this.el).find(ListGuessView.RESPONSE_FIELD_ID).keypress(this.keypressCb);
		$(this.el).find(ListGuessView.ENTER_FIELD_ID).click(_.bind(function() {
			if (this._evaluateResponse())
				this.next();
		}, this));

		console.debug('[ListGuessView] ' + this.questions.length + " questions");

		this.next();

		return this;
	},

	next: function() {

		this.currentQuestion = this.questions.shift();

		if (this.currentQuestion === undefined) {
			$(this.el).find(ListGuessView.RESPONSE_FIELD_ID).unbind('keypress', this.keypressCb).prop('disabled', true);
			$(this.el).find(ListGuessView.ENTER_FIELD_ID).unbind('click').prop('disabled', true);

			console.debug('[ListGuessView] Game finished');
			this.trigger('listguessview:done');
			return;
		}

		var questionText = null;
		switch(this.currentQuestion.type) {
			case ListGuessView.QuestionType.ALL:
				questionText = i18n.t(ListGuessView.LANG_QUESTION_FRIEND);
				break;
			case ListGuessView.QuestionType.LIST:
				questionText = i18n.t(ListGuessView.LANG_QUESTION_LIST, {
					listname: this.currentQuestion.name
				});
				break;
		}
		
		console.debug('[ListGuessView] Current question: ' + questionText);

		$(this.el).fadeOut('fast', _.bind(function() {
			$(this.el).find(ListGuessView.QUESTION_FIELD_ID).empty().html(questionText);
			$(this.el).find(ListGuessView.RESPONSE_FIELD_ID).val('');
			$(this.el).fadeIn('fast');
			this.askedQuestions++;
		}, this));

	},

	_evaluateResponse: function() {

		var response = $(this.el).find(ListGuessView.RESPONSE_FIELD_ID).val();
		var correctV = this.currentQuestion.is;
		var listname = this.currentQuestion.name;

		if (!$.isNumeric(response)) return false;

		var responseI = parseInt(response);

		var result = new TestResult({
			is: responseI,
			was: correctV,
			type: TestResult.Type.LISTGUESS
		});

		console.debug('[ListGuessView] Question result was ', result);

		this.player.get('results').add(result);
		ProgressBar.getInstance().subto(this.askedQuestions, this.questionsLength);

		return true;

	}

}, {

	QUESTION_FIELD_ID: "h1.question",
	RESPONSE_FIELD_ID: "input.response",
	ENTER_FIELD_ID: "button[type=submit]",

	LANG_QUESTION_FRIEND: 'app.guess.question_friends',
	LANG_QUESTION_LIST: 'app.guess.question_list',

	MAX_QUESTIONS: 5,

	QuestionType: {
		ALL: 0, LIST: 1
	}
});