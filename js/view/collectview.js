var CollectView = Backbone.View.extend({

	FRIENDS_ID: "#collect-friends",
	LISTS_ID: "#collect-lists",
	PICTURES_ID: "#collect-pictures",
	POSTS_ID: "#collect-posts",
	SETTINGS_ID: "#collect-settings",
	PROGRESS_ID: "#collect-progress",

	WORKING_CONTENT: "<i class=\"icon-time\"></i>",
	DONE_CONTENT: "<i class=\"icon-ok\"></i>",
	ERROR_CONTENT: "<i class=\"icon-remove\"></i>",

	collected: [],
	_tocollect: 5,

	initialize: function() {
		console.log("Init: CollectView");
		this.collected = [];

		this.template = Handlebars.compile(tpl.get("collect"));

		this.on("collected:new", _.bind(this.validateCollectionDb, this));

		this.player = FacebookPlayer.getInstance();
		this.player.on("friends:start", _.bind(this.fbLoadFriendsStartCb, this));
		this.player.on("friends:error", _.bind(this.fbLoadFriendsErrorCb, this));
		this.player.on("friends:finished", _.bind(this.fbLoadFriendsFinishedCb, this));

		this.player.on("friendlist:start", _.bind(this.fbLoadFriendlistStartCb, this));
		this.player.on("friendlist:error", _.bind(this.fbLoadFriendlistErrorCb, this));
		this.player.on("friendlist:finished", _.bind(this.fbLoadFriendlistFinishedCb, this));

		this.player.on("pictures:start", _.bind(this.fbLoadPicturesStartCb, this));
		this.player.on("pictures:error", _.bind(this.fbLoadPicturesErrorCb, this));
		this.player.on("pictures:finished", _.bind(this.fbLoadPicturesFinishedCb, this));

		this.player.on("posts:start", _.bind(this.fbLoadPostsStartCb, this));
		this.player.on("posts:error", _.bind(this.fbLoadPostsErrorCb, this));
		this.player.on("posts:finished", _.bind(this.fbLoadPostsFinishedCb, this));
	},

	render: function(eventName) {
		$(this.el).html(this.template());

		this.FRIENDS_ID = $(this.el).find(this.FRIENDS_ID);
		this.LISTS_ID = $(this.el).find(this.LISTS_ID);
		this.PICTURES_ID = $(this.el).find(this.PICTURES_ID);
		this.POSTS_ID = $(this.el).find(this.POSTS_ID);
		this.SETTINGS_ID = $(this.el).find(this.SETTINGS_ID);
		this.PROGRESS_ID = $(this.el).find(this.PROGRESS_ID);

		return this;
	},

	validateCollectionDb: function() {
		if (_.contains(this.collected, "friends") && _.contains(this.collected, "lists")
			&& _.contains(this.collected, "pictures") && _.contains(this.collected, "posts")) {
			console.log("[CollectView] All data collected", this.collected);

			this.readPrivacySettings({
				success: _.bind(function() {
					this.PROGRESS_ID.css("width", "100%");
					console.log("[CollectView] All done");
					this.trigger("collect:done");
				}, this)
			});
		}
		else
			console.warn("[CollectView] Not all data collected", this.collected);
	},

	readPrivacySettings: function(cb) {
		this.SETTINGS_ID.append(this.WORKING_CONTENT);

		console.log("[CollectView] Transforming privacy ids from pictures to user ids");
		this.player.getPictures().each(_.bind(function(picture) {

			//console.debug("[CollectView] Finalizing privacy settings for picture: ", picture);
			picture.validatePrivacy(this.player.getFriendLists());

		}, this));

		this.SETTINGS_ID.append(this.DONE_CONTENT);

		cb.success();
	},

	fbLoadFriendsStartCb: function() {
		this.FRIENDS_ID.append(this.WORKING_CONTENT);
	},

	fbLoadFriendsErrorCb: function() {
		this.FRIENDS_ID.append(this.ERROR_CONTENT);
	},

	fbLoadFriendsFinishedCb: function() {
		this.collected.push("friends");
		this.FRIENDS_ID.append(this.DONE_CONTENT);
		this.trigger("collected:new");
		this.PROGRESS_ID.css("width", this.collected.length / this._tocollect * 100 + "%");

		this.player.getFriendLists();
		this.player.getPictures();
		this.player.getPosts();
	},

	fbLoadFriendlistStartCb: function() {
		this.LISTS_ID.append(this.WORKING_CONTENT);
	},

	fbLoadFriendlistErrorCb: function() {
		this.LISTS_ID.append(this.ERROR_CONTENT);
	},

	fbLoadFriendlistFinishedCb: function() {
		this.collected.push("lists");
		this.LISTS_ID.append(this.DONE_CONTENT);
		this.trigger("collected:new");
		this.PROGRESS_ID.css("width", this.collected.length / this._tocollect * 100 + "%");
	},

	fbLoadPicturesStartCb: function() {
		this.PICTURES_ID.append(this.WORKING_CONTENT);
	},

	fbLoadPicturesErrorCb: function() {
		this.PICTURES_ID.append(this.ERROR_CONTENT);
	},

	fbLoadPicturesFinishedCb: function() {
		this.collected.push("pictures");
		this.PICTURES_ID.append(this.DONE_CONTENT);
		this.trigger("collected:new");
		this.PROGRESS_ID.css("width", this.collected.length / this._tocollect * 100 + "%");
	},

	fbLoadPostsStartCb: function() {
		this.POSTS_ID.append(this.WORKING_CONTENT);
	},

	fbLoadPostsErrorCb: function() {
		this.POSTS_ID.append(this.ERROR_CONTENT);
	},

	fbLoadPostsFinishedCb: function() {
		this.collected.push("posts");
		this.POSTS_ID.append(this.DONE_CONTENT);
		this.trigger("collected:new");
		this.PROGRESS_ID.css("width", this.collected.length / this._tocollect * 100 + "%");
	}

});