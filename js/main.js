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

		this.player = FacebookPlayer.getInstance();
		this.player.on("profile:loaded", _.bind(this.profileLoadedCb, this));
		this.homeView.on("click:proceed", _.bind(this.startCollectCb, this));
		this.collectView.on("collect:done", _.bind(this.selectEntitiesCb, this));
		this.selectView.on("select:done", _.bind(this.guessListSizeCb, this));
	},

	home: function() {
		this.homeView.render();
		$("#welcome").html(this.homeView.el);
	},

	profileLoadedCb: function() {
		console.log("[Controller] Facebook Player is ready, enabling collect view");
		this.collectView.render();
		$("#collect").html(this.collectView.el);
	},

	startCollectCb: function() {
		console.log('[Controller] Starting to collect data');
		this.player.getFriends();
	},

	selectEntitiesCb: function() {
		console.log('[Controller] Starting Setup: Select most sensible entities');
		this.selectView.render();
		$("#select").html(this.selectView.el);
	}, 

	guessListSizeCb: function() {
		console.log('[Controller] Starting Game #1: List Size Guess');
	}

});

tpl.loadTemplates(['home', 'collect', 'select', 'header'],
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
