var PrivacyDefinition = Backbone.Model.extend({

	defaults: {
		level: undefined,
		exclude: [], //id
		include: []
	},

	flattenLists: function(lists) {
		//console.debug('[PrivacyDefinition] Flattening lists with ', lists);

		//console.debug('[PrivacyDefinition] Before: ', this.get('exclude'), this.get('include'));

		if (this.get('exclude').length > 0 || this.get('include').length > 0) {
			lists.each(_.bind(function(list) {

				var listid = list.get('id');
				// enabling this output slows down the browser massivly!
				// console.debug('[PrivacyDefinition] list #' + listid + '(Models: ', list.get('members').models, ')');

				if (_.contains(this.get('exclude'), listid)) {
					console.log('[PrivacyDefinition] Exclude list contains this list, replacing with listmembers');
					this.set('exclude', _.without(this.get('exclude'), listid));
					this.set('exclude', _.union(this.get('exclude'), list.get('members').models));
				}

				if (_.contains(this.get('include'), listid)) {
					console.log('[PrivacyDefinition] Include list contains this list, replacing with listmembers');
					this.set('include', _.without(this.get('include'), listid));
					this.set('include', _.union(this.get('include'), list.get('members').models));
				}
			}, this));
		}

		//console.debug('[PrivacyDefinition] After: ', this.get('exclude'), this.get('include'));

	},

	isAllowed: function(id) {
		return _.contains(this.get('include'), id);
	},

	isDenied: function(id) {
		return _.contains(this.get('exclude'), id);
	}

}, {
	Level: ["ALL", "FOF", "FRIENDS", "ME"]
});

var FacebookPicture = Backbone.Model.extend({

	defaults: {
		id: undefined,
		name: undefined,
		source: undefined,
		height: undefined,
		width: undefined,
		privacy: undefined
	},

	initialize: function(picture) {
		if (!picture.id ||  !picture.source) {
			console.error("Picture missing required data (id, source)", picture.id, picture.source);
			throw new Exception("Picture missing required data: id or source");
		}

		this.set("id", picture.id);
		this.set("name", picture.name);
		this.set("source", picture.source);
		this._getPrivacy();
	},

	// we need to convert all list ids to friend ids
	validatePrivacy: function(friendlists) {
		this.get('privacy').flattenLists(friendlists);
	},

	_getPrivacy: function() {

		this.set("privacy", new PrivacyDefinition());

		try {
			FB.api({
				method:	'fql.query',
				query:	FacebookPicture.FB_FQL_QUERY + this.get("id")
			}, _.bind(function(response) {

				if (!response || response.length != 1) {
					this.set("privacy", false);
					console.error("Unable to get privacy settings for picture " + this.get("id"));
					return;
				}

				if (!response[0].value) {
					this.set("privacy", false);
					console.error("No privacy setting for picture " + this.get("id"));
					return;
				}

				// global visibilty
				var level;
				switch(response[0].value) {
					case FacebookPicture.FB_FQL_VALUE_ALL:
						level = PrivacyDefinition.Level.ALL;
						break;
					case FacebookPicture.FB_FQL_VALUE_FOF:
						level = PrivacyDefinition.Level.FOF;
						break;
					case FacebookPicture.FB_FQL_VALUE_FRIENDS:
						level = PrivacyDefinition.Level.FRIENDS;
						break;
					case FacebookPicture.FB_FQL_VALUE_ME:
						level = PrivacyDefinition.Level.ME;
						break;
				}

				this.get("privacy").set("level", level);

				if (!_.isNull(response[0].allow)) {
					this.get("privacy").set("include", response[0].allow.split(FacebookPicture.FB_FQL_ID_SEPERATOR));
				}

				if (!_.isNull(response[0].deny)) {
					this.get("privacy").set("exclude", response[0].deny.split(FacebookPicture.FB_FQL_ID_SEPERATOR));
				}

				this.trigger('privacy');
			}, this));
		}
		catch(e) {
			console.error("Error while getting privacy for picture ", e);
		}

	}

}, {
	FB_FQL_QUERY: "SELECT value,allow,deny,owner_id,friends FROM privacy WHERE id = ",
	FB_FQL_VALUE_ALL: "ALL",
	FB_FQL_VALUE_FOF: "FRIENDS_OF_FRIENDS",
	FB_FQL_VALUE_FRIENDS: "ALL_FRIENDS",
	FB_FQL_VALUE_ME: "ME",
	FB_FQL_ID_SEPERATOR: ", "
});

var FacebookPictureCollection = Backbone.Collection.extend({
	
	model: FacebookPicture,

	getByPid: function(pid) {
		return this.where({id: pid});
	}

})