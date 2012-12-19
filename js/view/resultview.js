var ResultView = Backbone.View.extend({

	GAME1_RESULT_ID: "div#result-game1",
	GAME2_RESULT_ID: "div#result-game2",
	GAME3_RESULT_ID: "div#result-game3",

	CORRECT_CONTENT: "<i class=\"icon-ok\"></i>",
	WRONG_CONTENT: "<i class=\"icon-remove\"></i>",

	LANG_RESULT1_HEADLINE: 'app.result.result1.headline',
	LANG_RESULT1_ADVICE: 'app.result.result1.advice',
	LANG_RESULT2_HEADLINE: 'app.result.result2.headline',
	LANG_RESULT2_ADVICE: 'app.result.result2.advice',
	LANG_RESULT3_HEADLINE: 'app.result.result3.headline',
	LANG_RESULT3_WRONG_PREFIX: 'app.result.result3.wrong_users_prefix',
	LANG_NAMELESS_ITEM: 'app.common.nameless_item',

	GAME1_RESULT_THRESOLD: 40,
	GAME2_RESULT_THRESOLD: 40,
	GAME3_RESULT_THRESOLD: 7,

	initialize: function() {
		console.log("[ResultView] Init");
		this.template = Handlebars.compile(tpl.get("result"));

		this.player = FacebookPlayer.getInstance();
		this.results = this.player.get('results');
	},

	render: function(eventName) {
		$(this.el).html(this.template());

		return this;
	},

	renderResults: function() {

		console.log('[ResultView] Rendering results..');

		this.createResultsGame1();
		this.createResultsGame2();
		this.createResultsGame3();

		console.log('[ResultView] Rendering results done');

	},

	createResultsGame1: function() {

		var results = this.results.where({ type: TestResult.Type.LISTGUESS });
		var container = $(this.el).find(this.GAME1_RESULT_ID);
		console.log('[ResultView] Results for Game #1:', results);

		var headline = $('<h1>');
		var resultlist = $('<ol>');
		container.append(headline).append(resultlist);

		var wrong = 0;
		_.each(results, _.bind(function(result) {

			var text = _.template("<%= name %> (<%= is %>/<%= was %>)")({
				name: result.get('message'),
				was: result.get('was'),
				is: result.get('is')
			});
			var question = $('<li>', {
				text: text
			});

			if (result.get('is') === result.get('was'))
				question.append($(this.CORRECT_CONTENT));
			else {
				question.append($(this.WRONG_CONTENT));
				wrong++;
			}

			resultlist.append(question);

		}, this));

		var percent = (1 - (wrong/results.length)) * 100;
		headline.text(i18n.t(this.LANG_RESULT1_HEADLINE, {
			listspercent: percent.toFixed(2)
		}));

		if (percent < this.GAME1_RESULT_THRESOLD) {
			var advice = $('<span>', {
				text: i18n.t(this.LANG_RESULT1_ADVICE)
			});
			headline.after(advice);
		}

	},

	createResultsGame2: function() {

		var results = this.results.where({ type: TestResult.Type.ENTITYGUESS });
		var container = $(this.el).find(this.GAME2_RESULT_ID);
		console.log('[ResultView] Results for Game #2:', results);

		var headline = $('<h1>');
		var resultlist = $('<ol>');
		container.append(headline).append(resultlist);

		var wrong = 0;
		_.each(results, _.bind(function(result) {

			var inRange = result.get('was').inRange(result.get('is'));
			var title = result.get('item').get('name');
			title = title === undefined ? i18n.t(this.LANG_NAMELESS_ITEM) : title;
			var question = $('<li>', {
				text: title
			});

			if (inRange)
				question.append($(this.CORRECT_CONTENT));
			else {
				question.append($(this.WRONG_CONTENT));
				wrong++;
			}

			resultlist.append(question);

		}, this));

		var percent = (1 - (wrong/results.length)) * 100;
		headline.text(i18n.t(this.LANG_RESULT2_HEADLINE, {
			listspercent: percent.toFixed(2)
		}));

		if (percent < this.GAME2_RESULT_THRESOLD) {
			var advice = $('<span>', {
				text: i18n.t(this.LANG_RESULT2_ADVICE)
			});
			headline.after(advice);
		}

	},

	createResultsGame3: function() {

		var results = this.results.where({ type: TestResult.Type.HANGMAN });
		var container = $(this.el).find(this.GAME3_RESULT_ID);
		console.log('[ResultView] Results for Game #3:', results);

		var headline = $('<h1>');
		var resultlist = $('<ol>');
		container.append(headline).append(resultlist);

		var wrong = 0;
		_.each(results, _.bind(function(result) {
			var wronglist = result.get('is');

			var title = result.get('item').get('name');
			title = title === undefined ? i18n.t(this.LANG_NAMELESS_ITEM) : title;
			var question = $('<li>', {
				text: title
			});
			resultlist.append(question);

			if (wronglist[0].length > 0) {
				var wrongDiv = $('<div>', {
					text: i18n.t(this.LANG_RESULT3_WRONG_PREFIX)
				}).css('width', '80%');

				var wrongU = [];
				wronglist[0].each(function(user) {
					wrongU.push(user.get('name'));
				});

				wrongDiv.append(wrongU.join(', '));

				if (wronglist[0].length >= this.GAME3_RESULT_THRESOLD) {
					++wrong;
					question.append($(this.WRONG_CONTENT));
				}
				else
					question.append($(this.CORRECT_CONTENT));

				question.append(wrongDiv);
			}
			else
				question.append($(this.CORRECT_CONTENT));

		}, this));

		var headlineT = i18n.t(this.LANG_RESULT3_HEADLINE, {
			numwon: (results.length - wrong),
			numgames: results.length
		});
		headline.text(headlineT);

	}

});