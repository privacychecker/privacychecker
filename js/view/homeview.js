var HomeView = Backbone.View.extend({

	PROCEED_ID: "a#fb_proceed",
	RESET_ID: "a#fb_reset",
	LOGIN_ID: "a#fb_login",
	LOADING_ID: "div#fb_loading",

	events: {
		"click #fb_login": "fbLoginClickCb",
		"click #fb_reset": "fbResetClickCb",
		"click #fb_proceed": "fbProceedClickDb"
	},

	initialize: function() {
		console.log("Init: HomeView");
		this.template = Handlebars.compile(tpl.get("home"));

		this.player = FacebookPlayer.getInstance();
		this.player.on("login:change", _.bind(this.fbLoginChangeCb, this));
	},

	render: function(eventName) {
		var context = {
			user: this.player.get("name"),
			loggedin: this.player.loggedin
		};

		$(this.el).html(this.template(context));

		if (this.player.loggedin == undefined) {
			$(this.el).find(this.PROCEED_ID).hide();
			$(this.el).find(this.RESET_ID).hide();
			$(this.el).find(this.LOGIN_ID).hide();
			$(this.el).find(this.LOADING_ID).show();
		}
		else if(this.player.loggedin == false) {
			$(this.el).find(this.PROCEED_ID).hide();
			$(this.el).find(this.RESET_ID).hide();
			$(this.el).find(this.LOGIN_ID).show();
			$(this.el).find(this.LOADING_ID).hide();			
		}
		else {
			$(this.el).find(this.PROCEED_ID).hide();
			$(this.el).find(this.RESET_ID).hide();
			$(this.el).find(this.LOGIN_ID).hide();
			$(this.el).find(this.LOADING_ID).show();
		}

		return this;
	},

	fbLoginClickCb: function() {
		console.log("fbLoginClickCb - triggering login");
		this.player.login();

		return false;
	},

	fbResetClickCb: function() {
		console.log("fbResetClickCb - triggering logout");
		this.player.logout();

		return false;
	},

	fbProceedClickDb: function() {
		this.trigger("click:proceed");
		$('#collect')[0].scrollIntoView(true);
	},

	fbLoginChangeCb: function(status) {
		console.log("FbLoginChange - updating view", this.player.loggedin);

		if (this.player.loggedin && this.player.get("name") == undefined) {
			this.player.on("profile:loaded", _.bind(this.fbProfileLoadedCb, this));
		}
		else if(!this.player.loggedin) {
			$(this.el).find(this.PROCEED_ID).hide();
			$(this.el).find(this.RESET_ID).hide();
			$(this.el).find(this.LOGIN_ID).show();
			$(this.el).find(this.LOADING_ID).hide();
		}
		else {
			$(this.el).find(this.PROCEED_ID).hide();
			$(this.el).find(this.RESET_ID).hide();
			$(this.el).find(this.LOGIN_ID).hide();
			$(this.el).find(this.LOADING_ID).show();			
		}
	},

	fbProfileLoadedCb: function() {
		var go = i18n.t("app.welcome.go_as_current_user", {
			user: this.player.get("name")
		});
		$(this.el).find(this.PROCEED_ID).html(go);

		$(this.el).find(this.PROCEED_ID).show();
		$(this.el).find(this.RESET_ID).show();
		$(this.el).find(this.LOGIN_ID).hide();
		$(this.el).find(this.LOADING_ID).hide();
	}


});