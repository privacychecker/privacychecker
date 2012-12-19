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
		$("header").html(this.headerView.el);

		this.homeView = new HomeView();
		this.collectView = new CollectView();
		this.selectView = new SelectView();
		this.listGuessView = new ListGuessView();
		this.entityGuessView = new EntityGuessView();
		this.hangmanView = new HangmanView();
		this.resultView = new ResultView();

		this.player = FacebookPlayer.getInstance();
		this.player.on("profile:loaded", _.bind(this.profileLoadedCb, this));
		this.homeView.on("click:proceed", _.bind(this.startCollectCb, this));
		this.collectView.on("collect:done", _.bind(this.selectEntitiesCb, this));
		this.selectView.on("select:done", _.bind(this.guessListSizeCb, this));
		this.listGuessView.on("listguessview:done", _.bind(this.guessEntitySizeCb, this));
		this.entityGuessView.on("entityguessview:done", _.bind(this.hangmanStartCb, this));
		this.hangmanView.on("hangmanview:done", _.bind(this.showResultsCb, this));
	},

	home: function() {
		this.homeView.render();
		$("#work").html(this.homeView.el);
	},

	profileLoadedCb: function() {
		console.log("[Controller] Facebook Player is ready, enabling collect view");
	},

	startCollectCb: function() {
		console.log('[Controller] Starting to collect data');
		this.collectView.render();
		$("#work").html(this.collectView.el);
		this.player.getFriends();
	},

	selectEntitiesCb: function() {
		console.log('[Controller] Starting Setup: Select most sensible entities');
		this.selectView.render();
		$("#work").html(this.selectView.el);
	},

	guessListSizeCb: function() {
		console.log('[Controller] Starting Game #1: List Size Guess');
		this.listGuessView.render();
		$('#work').html(this.listGuessView.el);
	},

	guessEntitySizeCb: function() {
		console.log('[Controller] Starting Game #2: Entity Size Guess');
		this.entityGuessView.render();
		$('#work').html(this.entityGuessView.el);
	},

	hangmanStartCb: function() {
		console.log('[Controller] Starting Game #3: Hangman');
		this.hangmanView.render();
		$('#work').html(this.hangmanView.el);
	},

	showResultsCb: function() {
		console.log('[Controller] Showing results');
		this.resultView.render();
		$('#work').html(this.resultView.el);
		this.resultView.renderResults();
	}

});

tpl.loadTemplates(['home', 'collect', 'select', 'listguess', 'entityguess', 'hangman', 'result', 'header'],
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
			app = new AppRouter();
			Backbone.history.start();
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
