var HeaderView = Backbone.View.extend({

	initialize: function() {
		console.log("[HeaderView] Init: HeaderView");

		FacebookPlayer.getInstance().on("profile:loaded", _.bind(this.fbPlayerProfileLoadedCb, this));
	},

	render: function(eventName) {
		return this;
	},

	fbPlayerProfileLoadedCb: function() {
		console.log("[HeaderView] fbPlayerProfileLoadedCb - updating view");

		var player = FacebookPlayer.getInstance();
		var container = $(document).find(HeaderView.PLAYER_INFO_SELECTOR);

		var name = player.get("name");
		var image = HeaderView.PLAYER_IMAGE_SRC({uid: player.get("id")});

		var inject = $('<span>', {
			"html": name
		});

		container.fadeOut('fast', function() {
			container.remove('span').append(inject).fadeIn('fast');
		});
	}

}, {

	PLAYER_INFO_SELECTOR: ".player",
	PLAYER_IMAGE_SRC: _.template("https://graph.facebook.com/<%= uid %>/picture")

});