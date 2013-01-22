var HangmanView = Backbone.View.extend({

	MAX_WRONG_ITEMS: 7,
	WRONG_ITEMS: 15,
	CORRECT_ITEMS: 15,

	initialize: function() {
		console.log("[HangmanView] Init: HangmanView");
		this.template = Handlebars.compile(tpl.get("hangman"));
		this.currentQuestion = undefined;

		this.on('next', _.bind(this.nextCb, this));
		this.on('died', _.bind(this.diedCb, this));
	},

	render: function(eventName) {
		$(this.el).html(this.template());

		// container for preloading the image
		this.container = $('<img>', {
			src: 'img/loader.gif',
			crossOrigin: ''
		}).css({
			display: 'none',
			position: 'absolute',
			left: '0px',
			top: '0px'
		});
		$('body').append(this.container);

		this.player = FacebookPlayer.getInstance();

		this.questions = [];

		_.each(TestData.getInstance().get('data'), _.bind(function(item) {

			if (item instanceof FacebookPicture) {
				var wrong = this._getWrongUsers(item);
				var correct = this._getCorrectUsers(item);
				this.questions.push({
					correct: correct,
					wrong: wrong,
					item: item,
					selectedWrong: new FacebookUserCollection(),
					selectedCorrect: new FacebookUserCollection()
				});
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

	nextCb: function() {
		console.debug('next triggered');

		var result = new TestResult({
			is: this.currentQuestion,
			was: HangmanView.RESULT.WON,
			type: TestResult.Type.HANGMAN
		});

		console.debug('[HangmanView] Question result was ', result);
		this.player.get('results').add(result);

		new OverlayInfo({
			text: i18n.t(HangmanView.LANG_GAME_WON),
			click: _.bind(this.next, this)
		}).show();

	},

	diedCb: function() {
		console.debug('died triggered');

		var result = new TestResult({
			is: this.currentQuestion,
			was: HangmanView.RESULT.LOST,
			type: TestResult.Type.HANGMAN
		});

		console.debug('[HangmanView] Question result was ', result);
		this.player.get('results').add(result);

		new OverlayInfo({
			text: i18n.t(HangmanView.LANG_GAME_LOST),
			click: _.bind(this.next, this)
		}).show();
	},

	next: function() {

		this.currentQuestion = this.questions.shift();

		if (this.currentQuestion === undefined) {

			console.debug('[HangmanView] Game finished');
			this.trigger('hangmanview:done');
			return;
		}
		
		console.debug('[HangmanView] Current entity: ', this.currentQuestion);

		// question answered do progress
		ProgressBar.getInstance().subto(this.askedQuestions, this.questionsLength);

		var item = this.currentQuestion.item;

		$(this.el).find(HangmanView.USERLIST_CONTAINER_ID).fadeOut('fast');
		$(this.el).find(HangmanView.IMAGE_CONTAINER).unbind('click').fadeOut('fast', _.bind(function() {

			$(this.el).find(HangmanView.IMAGE_CONTAINER).css('background-image', 'url(' + EstimateView.LOADER_GIF_SRC + ')').fadeIn('fast');

			var dominantColor = HangmanView.DEFAULT_COLOR,
				loaded = [];

			$(this.container).attr('src', item.get('source')).bind('load', _.bind(function(event) {

				// get dominant color and hope that it works (webkit based browser rndly fail)
				try {
						dominantColor = getDominantColor(event.target);
				}
				catch(e) {
					console.error('[HangmanView] Error getting dominant color, using default:', e);
				}

				// remove load event
				$(this.container).unbind();

				// image is now loaded, replace and add events
				$(this.el).find(HangmanView.IMAGE_CONTAINER).unbind('click').fadeOut('fast', _.bind(function() {

					// clear container and set name
					$(this.el).find(HangmanView.IMAGE_CONTAINER + ' ' + HangmanView.INFO_CONTAINER)
						.empty()
						.html(item.get('name'))
						.fadeIn('fast');
		
					// finally change image to correct one
					$(this.el).find(HangmanView.IMAGE_CONTAINER).
						css('background-image', 'url(' + item.get('source') + ')')
						.fadeIn('fast');

					// fancy background animation
					$(HangmanView.BACKGROUND_SELECTOR).transition({
						"background-color": 'rgb(' + dominantColor.join(',') + ')'
					});

					// create userlist
					this._creatUserList(this.currentQuestion);

					// we have successfully asked this question
					this.askedQuestions++;
				}, this));
			}, this));
		}, this));

	},

	_creatUserList: function(question) {

		var container = $(this.el).find(HangmanView.USERLIST_CONTAINER_ID).empty().fadeIn('fast');
		var correct = question.correct;
		var wrong = question.wrong;

		console.debug('[HangmanView] Creating userlist for item', question);
		var numWrongs = 0;

		for(var i = 0; i < HangmanView.MAX_USERS; ++i) {

			var user, itemType;
			// 1 = get wrong user unless wrong user threeshold reached AND there are correct users left
			if ($.randomBetween(0,1) && (correct.length !== 0 && numWrongs * HangmanView.MAX_WRONG_PERCENTAGE < HangmanView.MAX_USERS)) {
				user = wrong.shift();
				numWrongs++;
				itemType = false;
			}
			else {
				// we can only find correct user if there are some
				user = correct.shift();
				itemType = true;
			}

			console.debug("[HangmanView] Selected user", user);

			var userLi = $('<li>').hide(),
				that = this;
			userLi.addClass('user');
			// attach data to element
			userLi.data({
				user: user,
				correct: itemType
			});
			userLi.tooltip({
				title: user.get('name'),
				placement: 'right'
			});
			userLi.click(function() {
				that._validateclick(this);
			});
			userLi.css('background-image', 'url(' + _.template(HangmanView.FB_IMAGE_BASE_URL)({uid: user.id}) + ')');

			container.append(userLi);
			userLi.delay(i * HangmanView.USERLIST_DELAY_MODIFIER).fadeIn('slow');

		}

		console.debug('[HangmanView] Userlist created');

	},

	_validateclick: function(item) {

		var $item = $(item);
		var container = $(this.el).find(HangmanView.USERLIST_CONTAINER_ID);

		var correct = $item.data('correct');
		var user = $item.data('user');

		console.log('[HangmanView] Player selected ', user, ' which is ', correct);

		var statusEl = $('<div>');
		$item.addClass('done').append(statusEl);

		if (correct) {
			statusEl.addClass('correct');
		}
		// user select wrong item hangman +1
		else {
			statusEl.addClass('wrong');
			if (this.currentQuestion.selectedWrong.add(user).length > HangmanView.DIE_AFTER_NUM) {
				this.trigger('died');
				return;
			}
		}

		$item.unbind('click');

		// try to find remaing items
		var notdone = false;
		container.children('li:not(.done)').each(function(idx, el) {
			var $el = $(el);
			if (!$el.hasClass('done') && $el.data('correct')) notdone = true;
		});

		// if there are no remaing items trigger next one
		if (!notdone) this.trigger('next');

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

}, {

	USERLIST_CONTAINER_ID: '.userlist',
	IMAGE_CONTAINER: '.image',
	INFO_CONTAINER: '.image .info',

	FB_IMAGE_BASE_URL: "https://graph.facebook.com/<%- uid %>/picture?width=80&height=80",

	BACKGROUND_SELECTOR: '.carousel .item.active .background',
	DEFAULT_COLOR: [59,89,152],
	USERLIST_DELAY_MODIFIER: 50,

	LOADER_GIF_SRC: 'img/loader.gif',

	DIE_AFTER_NUM: 7,
	MAX_USERS: 20,
	MAX_WRONG_PERCENTAGE: 0.5,

	RESULT: {
		WON: 0, LOST: 1
	},

	LANG_GAME_LOST: "app.hangman.lost",
	LANG_GAME_WON: "app.hangman.won"

});