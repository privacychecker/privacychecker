var HomeView = Backbone.View.extend({

	_go: false,

	events: {
		"click #startgame": "fbProceedClickDb",
		"click #changeplayer": "fbResetClickCb"
	},

	initialize: function() {
		console.log("[HomeView] Init: HomeView");
		this.template = Handlebars.compile(tpl.get("home"));

		this.player = FacebookPlayer.getInstance();
		this.player.on("login:change", _.bind(this.fbProfileLoadedCb, this));
	},

	render: function(eventName) {
		$(this.el).html(this.template());
		return this;
	},

	fbResetClickCb: function() {
		console.log("[HomeView] fbResetClickCb - triggering logout");
		this.player.logout();

		window.setTimeout(_.bind(this.fbProceedClickDb, this), 1000);

		return false;
	},

	fbProceedClickDb: function() {
		console.log("[HomeView] fbProceedClickDb - user wants to start");

		this._go = true;

		if (!this.player.loggedin) {
			console.warn("[HomeView] User is not logged in, triggering loggin");
			this.player.login();
			return false;
		}

		this.trigger("click:proceed");
	},

	fbProfileLoadedCb: function() {
		console.log("[HomeView] fbProfileLoadedCb", this.player.loggedin);
		if (this._go && this.player.loggedin) this.trigger("click:proceed");
	}

});