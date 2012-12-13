var FacebookPlayer = Backbone.Model.extend({

	STATUS_LOGGED_IN: "connected",
	FB_SCOPE: "email, user_groups, user_events, user_likes, user_photos, user_relationships, user_status, user_videos, read_friendlists, read_stream, friends_about_me",
	FB_ME_URL: "/me?fields=id,name,gender,locale",
	FB_FRIENDS_URL: "/me/friends?fields=id,name",
	FB_FRIENDLIST_URL: "/me/friendlists/?fields=members.fields(id),id,name",
	FB_PICTURES_URL: "/me/albums?fields=id,name,photos.fields(id,name,source,height,width,from)",
	FB_FEED_URL: "/me/feed",
	FB_GRAPH_BASE: "https://graph.facebook.com/",
	FB_IMAGE_SUFFIX: "/picture?type=square",
	DELAY_INIT_EVENT: 2500,

	loggedin: undefined,
	_friends: undefined,
	_friendlists: undefined,
	_pictures: undefined,
	_posts: undefined,

	defaults: {
		id: undefined,
		name: undefined,
		locale: undefined,
		picture: undefined,
		gender: undefined
	},

	initialize: function() {
		console.log("[FacebookPlayer] New FacebookPlayer");

		FB.Event.subscribe('auth.authResponseChange', _.bind(this._authResponseChangeCb, this));

		FB.init({
			appId: '508385819190108',
			status: true,
			cookie: true
		});

		this._initEventFired = false;
		this.set('results', new TestResultCollection());

		setTimeout(_.bind(function() {
			if (!this._initEventFired) {
				this.loggedin = false;
				this.trigger("login:change", [this.loggedin]);
			}
		}, this), this.DELAY_INIT_EVENT);
	},

	login: function() {
		console.log("[FacebookPlayer] Loggin player in");

		this.trigger("login:start");

		FB.login(_.bind(function() {
			this._authResponseChangeCb();
			this.trigger("login:done");
		}, this), {
			scope: this.FB_SCOPE
		});
	},

	logout: function() {
		console.log("[FacebookPlayer] Loggin player out");

		this.trigger("login:start");

		FB.logout(_.bind(function() {
			this._authResponseChangeCb();
			this.trigger("login:done");
		}, this));
	},

	_authResponseChangeCb: function(resp) {
		var oldLoggedIn = this.loggedin;

		if (!resp.status) return;

		if (resp.status == this.STATUS_LOGGED_IN) this.loggedin = true;
		else this.loggedin = false;

		console.log("[FacebookPlayer] old: " + oldLoggedIn + " new: " + this.loggedin);

		// load the userprofile if user is loggedin
		if (this.loggedin && this.get("name") === undefined) {
			this._loadProfile();
		}

		if ((resp.status == this.STATUS_LOGGED_IN) != oldLoggedIn) this.trigger("login:change", [this.loggedin]);
		this._initEventFired = true;
	},

	_loadProfile: function() {
		FB.api(this.FB_ME_URL, _.bind(function(response) {
			console.log('[FacebookPlayer] ', response);

			this.set("name", response.name),
			this.set("id", response.id),
			this.set("locale", response.locale);
			this.set("gender", response.gender);
			this.set("picture", this.FB_GRAPH_BASE + response.id + this.FB_IMAGE_SUFFIX);

			this.trigger("profile:loaded");
		}, this));
	},

	getFriends: function() {
		if (this._friends === undefined) {
			this._loadFriends();
			return undefined;
		}

		return this._friends;
	},

	_loadFriends: function() {
		this.trigger("friends:start");
		FB.api(this.FB_FRIENDS_URL, _.bind(function(response) {
			if (!response.data) {
				this.trigger("friends:error");
				console.error("[FacebookPlayer] Error loading friends, response was: ", response);
				return;
			}

			// parse all friends
			this._friends = new FacebookUserCollection(_.map(response.data, function(friend) {
				//console.debug("Parsing friend", friend);
				try {
					return new FacebookUser({name: friend.name, id: friend.id});
				}
				catch (e) {
					console.error("[FacebookPlayer] Unable to parse friend: " + e.message);
				}
			}));

			console.log("[FacebookPlayer] Friends of " + this.get("id") + ": ", this._friends);
			this.trigger("friends:finished");

		}, this));
	},

	getForeigners: function() {
		if (this._foreigners === undefined) {
			this._loadForeigners();
			return undefined;
		}

		return this._foreigners;
	},

	_loadForeigners: function() {
		var frc = FacebookRandomCollector.getInstance();
		this.trigger("random:start");
		frc.on('frc:done', _.bind(function(users) {
			this._foreigners = users;
			console.log("[FacebookPlayer] Foreigners of " + this.get("id") + ": ", this._foreigners);
			this.trigger("random:finished");
		}, this));
		frc.collect();
	},

	getFriendLists: function() {
		if(this._friendlists === undefined) {
			this._loadFriendLists();
			return undefined;
		}

		return this._friendlists;
	},

	_loadFriendLists: function() {
		this.trigger("friendlist:start");
		if (this.getFriends() === undefined) {
				this.trigger("friendlist:error");
				console.log("[FacebookPlayer] Error loading friendlist, friends not loaded");
				return;
		}
			
		FB.api(this.FB_FRIENDLIST_URL, _.bind(function(response) {
			if (!response.data) {
				this.trigger("friendlist:error");
				console.error("[FacebookPlayer] Error loading friendlist, response was: ", response);
				return;
			}

			if (response.data.length === 0) {
				console.warn("[FacebookPlayer] Users has no lists");
				this.trigger("friendlist:finished");
			}

			// parse all friends
			this._friendlists = new FacebookListCollection(_.map(response.data, _.bind(function(list) {
				var lid = list.id;
				//console.debug("Parsing friendlist", lid, list);

				var friendList = new FacebookList({
					id: list.id,
					name: list.name,
					type: list.list_type,
					members: new FacebookUserCollection()
				});

				if (list.members && list.members.data) {
					_.each(list.members.data, _.bind(function(member) {
						//console.debug("Adding " + this._friends.getByUid(member.id).get("name") + " to list " + list.name);
						friendList.get("members").add(this._friends.getByUid(member.id));
					}, this));
				}

				return friendList;
			}, this)));


			this.trigger("friendlist:finished");
			console.log("[FacebookPlayer] Friendlists of " + this.get("id") + ": ", this._friendlists);
		}, this));
	},

	getPictures: function() {
		if(this._pictures === undefined) {
			this._loadPictures();
			return undefined;
		}

		return this._pictures;
	},

	_loadPictures: function() {
		this.trigger("pictures:start");
			
		FB.api(this.FB_PICTURES_URL, _.bind(function(response) {
			if (!response.data) {
				this.trigger("pictures:error");
				console.error("[FacebookPlayer] Error loading pictures, response was: ", response);
				return;
			}

			if (response.data.length === 0) {
				console.warn("[FacebookPlayer] Users has no albums");
				this.trigger("pictures:finished");
			}

			this._pictures = new FacebookPictureCollection();

			var picturesNum = 0;
			_.each(response.data, _.bind(function(album) {

				if (album.photos) {
					picturesNum += album.photos.data.length;

					this._pictures.add(_.map(album.photos.data, _.bind(function(photo) {
						try {
							var pic = new FacebookPicture({
								id: photo.id,
								name: photo.name,
								source: photo.source,
								width: photo.width,
								height: photo.height
							});
							pic.on('privacy', _.bind(function() {
								if (--picturesNum === 0) {
									console.log("[FacebookPlayer] " + this._pictures.length + " Pictures of " + this.get("id") + ": ", this._pictures);
									this.trigger("pictures:finished");
								}
							}, this));
							return pic;
						}
						catch(e) {
							console.error("[FacebookPlayer] Error creating FacebookPicture: ", e);
						}
					}, this)));
				}

			}, this));
		}, this));
	},

	getPosts: function() {
		if (this._posts === undefined) {
			this._loadPosts();
			return undefined;
		}

		return this._posts;
	},

	_loadPosts: function() {
		this.trigger("posts:start");
		if (this.getFriends() === undefined) {
				this.trigger("posts:error");
				console.log("[FacebookPlayer] Error loading posts, friends not loaded");
				return;
		}

		FB.api(this.FB_FEED_URL, _.bind(function(response) {
			if (!response.data) {
				this.trigger("posts:error");
				console.error("[FacebookPlayer] Error loading psots, response was: ", response);
				return;
			}

			// parse all posts
			this._posts = new FacebookPostCollection(_.filter(response.data, _.bind(function(post) {
				//console.debug("Parsing post", post);

				// only own posts and post where privacy is set
				if (post.from.id == this.id && post.privacy !== undefined) {
					//console.log("Found post from player", post);
					return new FacebookPost({message: post.message, id: post.id, privacy: post.privacy});
				}
			}, this)));

			console.log("[FacebookPlayer] Posts of " + this.get("id") + ": ", this._posts);
			this.trigger("posts:finished");

		}, this));

	}

}, {
	getInstance: function() {
		if (this.__instance === undefined) {
			this.__instance = new this();
		}
		return this.__instance;
	}
});