var HangmanView = Backbone.View.extend({

	ITEM_PLACEHOLDER_ID: "div#entity",
	LIST_PLACEHOLDER_ID: "div#userlist",
	PROGRESS_ID: "div#hangman-progress",

	FB_IMAGE_BASE_URL: "https://graph.facebook.com/<%- uid %>/picture?type=square",

	MAX_WRONG_ITEMS: 7,
	WRONG_ITEMS: 15,
	CORRECT_ITEMS: 15,

	initialize: function() {
		console.log("[HangmanView] Init: HangmanView");
		this.template = Handlebars.compile(tpl.get("hangman"));
		this.currentQuestion = undefined;
	},

	render: function(eventName) {
		$(this.el).html(this.template());

		this.player = FacebookPlayer.getInstance();

		this.questions = [];

		_.each(TestData.getInstance().get('data'), _.bind(function(item) {

			if (item instanceof FacebookPicture) {
				//try {
					var wrong = this._getWrongUsers(item);
					var correct = this._getCorrectUsers(item);
					this.questions.push({
						correct: correct,
						wrong: wrong,
						item: item
					});
				//}
				//catch(e) {
				//	console.error("Caught exception while creating item: ", e);
				//}
			}
			else {
				console.error("Unknown item for guess game");
				throw new Error({message: "Unknown item for guess game"});
			}

		}, this));

		this.questionsLength = this.questions.length;
		this.askedQuestions = 0;

		console.debug('[HangmanView] ' + this.questions.length + " entities to show");

		this.next();

		return this;
	},

	next: function() {

		this.currentQuestion = this.questions.shift();

		if (this.currentQuestion === undefined) {

			$(this.el).find(this.PROGRESS_ID).css("width", "100%").html(this.askedQuestions + '/' + this.questionsLength);
			$(this.el).find(this.PROGRESS_ID).first().parent().removeClass('active');

			console.debug('[HangmanView] Game finished');
			this.trigger('hangmanview:done');
			return;
		}
		
		console.debug('[HangmanView] Current entity: ', this.currentQuestion);

		var item = this._createObject(this.currentQuestion);

		var userUl = $('<ul>');
		item.after(userUl);

		var remaining = this.CORRECT_ITEMS;
		var selectedWrong = new FacebookUserCollection();
		var selectedCorrect = new FacebookUserCollection();
		var selectable = new FacebookUserCollection();

		while(true) {

			var user = undefined;
			var correct = true;
			if ($.randomBetween(0,1) === 0 && this.currentQuestion.wrong.length > 0) {
				user = this.currentQuestion.wrong.shift();
				correct = false;
			}
			else if (this.currentQuestion.correct.length > 0) {
				user = this.currentQuestion.correct.shift();
			}

			if (user === undefined) {
				user = this.currentQuestion.wrong.shift();
				correct = false;
			}
			if (user === undefined) user = this.currentQuestion.correct.shift();

			selectable.add(user);

			var uimg = _.template(this.FB_IMAGE_BASE_URL)({uid: user.id});
			var qItem = this.currentQuestion.item;

			var that = this;
			var userLi = $('<li>').data({
				user: user,
				correct: correct
			}).click(function () {
				var $this = $(this);
				var correct = $this.data('correct');
				var user = $this.data('user');

				console.log('[HangmanView] Player selected', (correct ? 'correct' : 'wrong'), 'user: ', user);
				$this.fadeTo('fast', 0.4);
				$this.unbind('click');

				if (!correct) {
					$this.addClass('wrong');
					selectedWrong.add(user);

					if (that.MAX_WRONG_ITEMS <= selectedWrong.length) {
						var result = new TestResult({
							is: [selectedWrong, selectedCorrect],
							was: selectable,
							type: TestResult.Type.HANGMAN,
							item: qItem
						});

						FacebookPlayer.getInstance().get('results').add(result);
						console.log('[HangmanView] Player died:', result);
						that.next();
					}
					return;
				}

				$this.addClass('correct');
				selectedCorrect.add(user);

				if (--remaining === 0) {
					var result = new TestResult({
						is: [selectedWrong, selectedCorrect],
						was: selectable,
						type: TestResult.Type.HANGMAN,
						item: qItem
					});

					FacebookPlayer.getInstance().get('results').add(result);
					console.log('[HangmanView] Game done, next hangman:', result);
					that.next();
				}
				else
					console.debug('[HangmanView] Remaining correct items: ', remaining);
			});

			var userImg = $('<img>', {
				src: uimg
			});
			var userSpan = $('<div>', {
				html: user.get('name')
			});

			userUl.append(userLi.append(userImg).append(userSpan));

			if (this.currentQuestion.wrong.length <= 0 && this.currentQuestion.correct.length <= 0) break;

		}

		console.debug('[HangmanView] Created object: ', item);

		$(this.el).find(this.PROGRESS_ID)
			.css("width", this.askedQuestions / this.questionsLength * 100 + "%")
			.html(this.askedQuestions + '/' + this.questionsLength);

		$(this.el).find(this.LIST_PLACEHOLDER_ID).fadeOut('fast');
		$(this.el).find(this.ITEM_PLACEHOLDER_ID).fadeOut('fast', _.bind(function() {
			$(this.el).find(this.ITEM_PLACEHOLDER_ID).empty().append(item).fadeIn('fast');
			$(this.el).find(this.LIST_PLACEHOLDER_ID).empty().append(userUl).fadeIn('fast');
			this.askedQuestions++;
		}, this));

	},

	_createObject: function(question) {

		var item = question.item;

		if (item instanceof FacebookPicture) {

			return $('<img>', {
				src: item.get('source'),
				title: item.get('name'),
				'class': 'img-rounded'
			});

		}
		else if (item instanceof FacebookPost) {

		}

	},

	_getWrongUsers: function(item) {

		var list = new FacebookUserCollection();

		var privacy = item.get('privacy');
		var level = privacy.get('level');
		var exclude = privacy.get('exclude');
		var include = privacy.get('include');
		var foreigners = FacebookPlayer.getInstance().getForeigners();

		switch (level) {

			case PrivacyDefinition.Level.FOF:
			case PrivacyDefinition.Level.FRIENDS:
			case PrivacyDefinition.Level.ME:

				while(list.length < this.WRONG_ITEMS) {
					var user = undefined;
					if (exclude.length > 0 && $.randomBetween(0,1) === 0) {
						user = exclude.at($.randomBetween(0, exclude.length));
					}
					
					if (user === undefined)
						user = foreigners.at($.randomBetween(0, foreigners.length));
					
					if (user === undefined || (list.contains(user) && include.contains(user))) continue;

					list.add(user);
				}

			break;

			case PrivacyDefinition.Level.CUSTOM:

				var i = 0;
				while(list.length < this.CORRECT_ITEMS) {
					var user = undefined;
					if (exclude.length > 0) {
						user = exclude.at($.randomBetween(0, include.length));
					}

					if (exclude.length <= i) break;
					
					if (user === undefined || (list.contains(user) && include.contains(user))) continue;

					list.add(user);
					i++;
				}

			break;

			case PrivacyDefinition.Level.ALL:

				while(list.length < this.WRONG_ITEMS && exclude.length > list.length) {
					var user = exclude.at($.randomBetween(0, exclude.length));

					if (user === undefined || (list.contains(user) && include.contains(user))) continue;

					list.add(user);
				}

			break;

		}

		console.debug('[HangmanView] Wrong users for item ', item, ' are ', list);

		return list;

	},

	_getCorrectUsers: function(item) {

		var list = new FacebookUserCollection();

		var privacy = item.get('privacy');
		var level = privacy.get('level');
		var exclude = privacy.get('exclude');
		var include = privacy.get('include');
		var foreigners = FacebookPlayer.getInstance().getForeigners();
		var friends = FacebookPlayer.getInstance().getFriends();

		switch (level) {

			case PrivacyDefinition.Level.FRIENDS:
			case PrivacyDefinition.Level.FOF:
			case PrivacyDefinition.Level.ME:

				while(list.length < this.CORRECT_ITEMS) {
					var user = undefined;
					if (include.length > 0 && $.randomBetween(0,1) === 0) {
						user = include.at($.randomBetween(0, include.length));
					}
					
					if (user === undefined)
						user = friends.at($.randomBetween(0, friends.length));
					
					if (user === undefined || (list.contains(user) && exclude.contains(user))) continue;

					list.add(user);
				}

			break;

			case PrivacyDefinition.Level.CUSTOM:

				var i = 0;
				while(list.length < this.CORRECT_ITEMS) {
					var user = undefined;
					if (include.length > 0) {
						user = include.at($.randomBetween(0, include.length));
					}

					if (include.length <= i) break;
					
					if (user === undefined || (list.contains(user) && exclude.contains(user))) continue;

					list.add(user);
					i++;
				}

			break;

			case PrivacyDefinition.Level.ALL:

				while(list.length < this.CORRECT_ITEMS) {
					var user = undefined;
					var coinflip = $.randomBetween(0,2);
					if (include.length > 0 && coinflip === 0) {
						user = include.at($.randomBetween(0, include.length));
					}
					else if (coinflip === 1) {
						user = friends.at($.randomBetween(0, friends.length));
					}
					
					if (user === undefined)
						user = foreigners.at($.randomBetween(0, foreigners.length));
					
					if (user === undefined || (list.contains(user) && exclude.contains(user))) continue;

					list.add(user);
				}

			break;

		}

		console.debug('[HangmanView] Correct users for item ', item, ' are ', list);

		return list;

	}

});