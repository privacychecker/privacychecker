var AppRouter = Backbone.Router.extend({

	routes: {
		"": "home"
	},

	initialize: function() {
		console.log("Init: Router");
		if (!this.headerView) {
			this.headerView = new HeaderView();
			this.headerView.render();
		}
		//$("header").html(this.headerView.el);
		$(AppRouter.CONTROL_CONTAINER_ID).unbind().hide();
		
		ProgressBar.getInstance().set('max', AppRouter.NUM_SLIDES);
		
		$(AppRouter.CHANGE_PLAYER_ID).hide();

		this.homeView = new HomeView();
		this.collectView = new CollectView();
		this.selectView = new SelectView();
		this.listGuessView = new ListGuessView();
		this.estimateView = new EstimateView();
		this.hangmanView = new HangmanView();
		this.resultView = new ResultView();

		this.player = FacebookPlayer.getInstance();
		this.player.on("profile:loaded", _.bind(this.profileLoadedCb, this));
		this.homeView.on("click:proceed", _.bind(this.startCollectCb, this));
		this.collectView.on("collect:done", _.bind(this.selectEntitiesCb, this));
		this.selectView.on("select:done", _.bind(this.guessListSizeCb, this));
		this.listGuessView.on("listguessview:done", _.bind(this.guessEntitySizeCb, this));
		this.estimateView.on("estimateview:done", _.bind(this.hangmanStartCb, this));
		this.hangmanView.on("hangmanview:done", _.bind(this.showResultsCb, this));
	},

	home: function() {
		this.homeView.render();
		$("#container-home").html(this.homeView.el);
	},

	profileLoadedCb: function() {
		console.log("[Controller] Facebook Player is ready, enabling collect view");
		$(AppRouter.CHANGE_PLAYER_ID).fadeIn('fast');
	},

	startCollectCb: function() {
		console.log('[Controller] Starting to collect data');
		this.collectView.render();
		$("#container-collect").html(this.collectView.el);

		$(AppRouter.CAROUSEL_ID).carousel(1);
		ProgressBar.getInstance().to(1);

		$(AppRouter.CAROUSEL_ID).on('slid', function() {
			$('.carousel .item.active .background').transition({
				"background-color": "rgb(59,89,152)"
			});
		});

	},

	selectEntitiesCb: function() {
		console.log('[Controller] Starting Setup: Select most sensible entities');
		this.selectView.render();
		$("#container-select").html(this.selectView.el);

		$(AppRouter.CAROUSEL_ID).carousel(2);
		ProgressBar.getInstance().to(2);

		$(AppRouter.CAROUSEL_ID).on('slid', function() {
			$('.carousel .item.active').transition({
				"height": "600px"
			});
		});

	},

	guessListSizeCb: function() {
		console.log('[Controller] Starting Game #1: List Size Guess');

		$(AppRouter.CONTROL_CONTAINER_ID).unbind().fadeIn('fast').click(_.bind(function() {
			this.listGuessView.render();
			$('#container-guess').html(this.listGuessView.el);

			$(AppRouter.CAROUSEL_ID).carousel(3);
			ProgressBar.getInstance().to(3);
			$(AppRouter.CONTROL_CONTAINER_ID).unbind().hide();

			$(AppRouter.CAROUSEL_ID).on('slid', function() {
				$('.carousel .item').transition({
					"height": "500px"
				});
			});
		}, this));
		this._animateNextButton();
	},

	guessEntitySizeCb: function() {
		console.log('[Controller] Starting Game #2: Entity Size Guess');

		$(AppRouter.CONTROL_CONTAINER_ID).unbind().fadeIn('fast').click(_.bind(function() {
			this.estimateView.render();
			$('#container-estimate').html(this.estimateView.el);

			$(AppRouter.CAROUSEL_ID).carousel(4);
			ProgressBar.getInstance().to(4);
			$(AppRouter.CONTROL_CONTAINER_ID).unbind().hide();

			$(AppRouter.CAROUSEL_ID).on('slid', function() {
				$('.carousel .item').transition({
					"height": "600px"
				});
			});
		}, this));
		this._animateNextButton();

	},

	hangmanStartCb: function() {
		console.log('[Controller] Starting Game #3: Hangman');

		$(AppRouter.CONTROL_CONTAINER_ID).unbind().fadeIn('fast').click(_.bind(function() {
			this.hangmanView.render();
			$('#container-hangman').html(this.hangmanView.el);

			$(AppRouter.CAROUSEL_ID).carousel(5);
			ProgressBar.getInstance().to(5);
			$(AppRouter.CONTROL_CONTAINER_ID).unbind().hide();

			$(AppRouter.CAROUSEL_ID).on('slid', function() {
				$('.carousel .item').transition({
					"height": "600px"
				});
			});
		}, this));
		this._animateNextButton();
	},

	showResultsCb: function() {
		console.log('[Controller] Showing results');

		$(AppRouter.CONTROL_CONTAINER_ID).unbind().fadeIn('fast').click(_.bind(function() {
			this.resultView.render();
			$('#container-results').html(this.resultView.el);

			$(AppRouter.CAROUSEL_ID).carousel(6);
			ProgressBar.getInstance().to(6);
			$(AppRouter.CONTROL_CONTAINER_ID).unbind().hide();

			$(AppRouter.CAROUSEL_ID).on('slid', _.bind(function() {
				$('.carousel .item').transition({
					"height": "500px"
				});
				this.resultView.renderResults();
			}, this));
		}, this));
		this._animateNextButton();
	},

	_animateNextButton: function() {
		$(AppRouter.CONTROL_CONTAINER_ID).transition({'width': '80px'}, 500, function() {
			$(this).transition({'width': '60px'}, 300, function() {
				$(this).transition({'width': '80px'}, 500, function() {
					$(this).transition({'width': '60px'}, 300);
				});
			});
		});
	}

}, {

	CHANGE_PLAYER_ID: '#changeplayer',
	CAROUSEL_ID: '#game-carousel',
	NUM_SLIDES: 7,

	CONTROL_CONTAINER_ID: '.carousel-control.right'

});

tpl.loadTemplates(['home', 'collect', 'select', 'guess', 'estimate', 'hangman', 'result', 'header'],
function () {
	$("section.container").each(function(idx) {
		$(this).width($(window).width());
	});

	i18n.init({
			resGetPath: 'locales/__lng__.json',
			fallbackLng: "en",
			useLocalStorage: false
		}, function(t) {
			console.log("Language files loaded, initializing app");
			// translate index
			$('body').i18n();

			// start the page
			app = new AppRouter();
			Backbone.history.start();

			$('.page').css({'width': ''});
		}
    );

	Handlebars.registerHelper('t', function(i18n_key) {
		var result = i18n.t(i18n_key);
		return new Handlebars.SafeString(result);
	});
	Handlebars.registerHelper('tr', function(context, options) {
		var opts = i18n.functions.extend(options.hash, context);
		if (options.fn) opts.defaultValue = options.fn(context);
		 
		var result = i18n.t(opts.key, opts);
 
		return new Handlebars.SafeString(result);
	});

});

var Exception = Backbone.Model.extend({
	
	defaults: {
		message: "unknown error"
	},

	constructor: function(p) {
		if (p.message !== undefined) this.set("message", p.message);
	}

});
