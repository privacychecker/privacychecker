var FacebookRandomCollector = Backbone.Model.extend({

	collect: function(settings) {
		if (settings === undefined) settings = {};

		var min = settings.min !== undefined ? settings.min : FacebookRandomCollector.DEFAULT_MIN;
		var users = settings.users !== undefined ? settings.users : new FacebookUserCollection();

		console.warn("[FacebookRandomCollector] Starting to collect, taking groups");
		this._collectGroup({
			users: users,
			min: min,

			done: _.bind(function(users) {
				this.trigger('frc:done', users);
			}, this),

			more: _.bind(function(users) {

				console.warn("[FacebookRandomCollector] Need more users, taking events");
				this._collectEvents({
					users: users,
					min: min,

					done: _.bind(function(users) {
						this.trigger('frc:done', [users]);
					}, this),

					more: _.bind(function(users) {
						console.error("[FacebookRandomCollector] Need more users, nothing to take");
						this.trigger('frc:less', users);
					}, this)
				});

			}, this)
		});
	},

	_collectGroup: function(cb) {

		var player = FacebookPlayer.getInstance();

		FB.api(FacebookRandomCollector.FB_GROUP_URL, _.bind(function(response) {
			if (!response.data) {
				this.trigger("frc:error");
				console.error("[FacebookRandomCollector] Error loading groups, response was: ", response);
				throw new Error({message: "[FacebookRandomCollector] Error loading groups, response was: " + response});
			}

			_.each(response.data, function(group) {
				if (group.members.data && group.members.data.length > 0) {
					_.each(group.members.data, function(member) {
						if (player.id !== member.id && player.getFriends().get(member.id) === undefined) {
							cb.users.add({name: member.name, id: member.id, type: FacebookUser.Type.FOREIGNER});
						}
					});
				}
			});

			console.debug('[FacebookRandomCollector] Found ' + cb.users.length + " users in groups: " , cb.users);

			if (cb.users.length < cb.min)
				cb.more(cb.users);
			else
				cb.done(cb.users);

		}, this));
	},

	_collectEvents: function(cb) {

		var player = FacebookPlayer.getInstance();

		FB.api(FacebookRandomCollector.FB_EVENT_URL, _.bind(function(response) {
			if (!response.data) {
				this.trigger("frc:error");
				console.error("[FacebookRandomCollector] Error loading groups, response was: ", response);
				throw new Error({message: "[FacebookRandomCollector] Error loading groups, response was: " + response});
			}

			_.each(response.data, function(event) {

				if (event.attending.data && event.attending.data.length > 0) {
					_.each(event.attending.data, function(attendee) {

						if (player.getFriends().get(attendee.id) === undefined)
							cb.users.add({name: attendee.name, id: attendee.id, type: FacebookUser.Type.FOREIGNER});
					});
				}

				if (cb.users.length < cb.min) {
					if (event.maybe.data && event.maybe.data.length > 0) {
						_.each(event.maybe.data, function(maybee) {

							if (player.getFriends().get(maybee.id) === undefined)
								cb.users.add({name: maybee.name, id: maybee.id, type: FacebookUser.Type.FOREIGNER});
						});
					}
				}

				if (cb.users.length < cb.min) {
					if (event.invited.data && event.invited.data.length > 0) {
						_.each(event.invited.data, function(invitee) {

							if (player.getFriends().get(invitee.id) === undefined)
								cb.users.add({name: invitee.name, id: invitee.id, type: FacebookUser.Type.FOREIGNER});
						});
					}
				}

				if (cb.users.length < cb.min) {
					if (event.declined.data && event.declined.data.length > 0) {
						_.each(event.declined.data, function(declinee) {

							if (player.getFriends().get(declinee.id) === undefined)
								cb.users.add({name: declinee.name, id: declinee.id, type: FacebookUser.Type.FOREIGNER});
						});
					}
				}
			});

			console.debug('[FacebookRandomCollector] Found ' + cb.users.length + " users in events: " , cb.users);

			if (cb.users.length < cb.min)
				cb.more(cb.users);
			else
				cb.done(cb.users);

		}, this));
	}

}, {

	FB_GROUP_URL: '/me/groups/?fields=members.limit(50).fields(id,name)&limit=3',
	FB_EVENT_URL: '/me/events?fields=attending.limit(10).fields(id,name),maybe.limit(10).fields(id,name),invited.limit(10).fields(id,name),declined.limit(10).fields(id,name)&limit=3',
	FB_FRIEND_FEED_URL: '/?fields=feed.limit(100).fields(likes.fields(id,name),comments.fields(from))', // ID as first

	DEFAULT_MIN: 30,

	getInstance: function() {
		if (this.__instance === undefined) {
			this.__instance = new this();
		}
		return this.__instance;
	}

});