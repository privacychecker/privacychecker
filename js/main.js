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

		this.player = FacebookPlayer.getInstance();
		this.player.on("profile:loaded", _.bind(this.profileLoadedCb, this));
		this.homeView.on("click:proceed", _.bind(this.startCollectCb, this));
	},

	home: function() {
		this.homeView.render();
		$("#welcome").html(this.homeView.el);
	},

	profileLoadedCb: function() {
		console.log("Facebook Player is ready, enabling collect view");
		this.collectView.render();
		$("#collect").html(this.collectView.el);
	},

	startCollectCb: function() {
		this.player.getFriends();
	}

});

tpl.loadTemplates(['home', 'collect', 'header'],
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
