var HeaderView = Backbone.View.extend({

	PLAYER_CONTAINER_ID: "li#header-player",
	FACEBOOK_BASE_URL: "https://facebook.com/",

	initialize: function() {
		console.log("Init: HeaderView");
		this.template = Handlebars.compile(tpl.get("header"));

		FacebookPlayer.getInstance().on("profile:loaded", _.bind(this.fbPlayerProfileLoadedCb, this));
	},

	render: function(eventName) {
		$(this.el).html(this.template());
		$(this.el).find(this.PLAYER_CONTAINER_ID).hide();
		return this;
	},

	fbPlayerProfileLoadedCb: function() {
		console.log("fbPlayerProfileLoadedCb - updating view");

		var player = FacebookPlayer.getInstance();
		var el = $(this.el).find(this.PLAYER_CONTAINER_ID);

		el.find("a").html(player.get("name"));
		el.find("a").attr("href", this.FACEBOOK_BASE_URL + player.get("id"));
		el.find("a").css("background-image", "url(" + player.get("picture") + ")");

		$(this.el).find(this.PLAYER_CONTAINER_ID).fadeIn(800);
	}

});