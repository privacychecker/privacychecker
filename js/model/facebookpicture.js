var PrivacyDefinition = Backbone.Model.extend({

	defaults: {
		level: undefined,
		excludeList: [],
		includeList: [],
		exclude: [], // simple id array
		include: []
	},

	flattenLists: function(friends, lists) {
		//console.debug('[PrivacyDefinition] Flattening lists with ', lists);

		//console.debug('[PrivacyDefinition] Before: ', this.get('exclude'), this.get('include'));
		//
		console.debug('[PrivacyDefinition] plain lists are: ', this.get('excludeList'), this.get('includeList'));

		this.set('exclude', new FacebookUserCollection());
		this.set('include', new FacebookUserCollection());

		if (this.get('excludeList').length > 0 || this.get('includeList').length > 0) {
			lists.each(_.bind(function(list) {

				var listname = list.get('name');

				// enabling this output slows down the browser massivly!
				//console.debug('[PrivacyDefinition] list ' + listname, _.contains(this.get('excludeList'), listname), _.contains(this.get('includeList'), listname));

				if (_.contains(this.get('excludeList'), listname)) {
					console.log('[PrivacyDefinition] Exclude id contains this list, replacing with listmembers');
					this.get('exclude').add(list.get('members').models);
				}

				if (_.contains(this.get('includeList'), listname)) {
					console.log('[PrivacyDefinition] Include id contains this list, replacing with listmembers');
					this.get('include').add(list.get('members').models);
				}
			}, this));

			friends.each(_.bind(function(friend) {

				var friendname = friend.get('name');

				if (_.contains(this.get('excludeList'), friendname)) {
					console.log('[PrivacyDefinition] Exclude id contains friend, replacing.');
					this.get('exclude').add(friend);
				}

				if (_.contains(this.get('includeList'), friendname)) {
					console.log('[PrivacyDefinition] Include id contains friend, replacing.');
					this.get('include').add(friend);
				}
			}, this));
		}

		console.debug('[PrivacyDefinition] Definition for item: ', this.get('exclude'), this.get('include'));

	}

}, {
	Level: {
		"ALL": 0, "FOF": 1, "FRIENDS": 2, "ME": 3, "NOBODY": 4, "CUSTOM": 5
	}
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
	validatePrivacy: function(friends, friendlists) {
		this.get('privacy').flattenLists(friends, friendlists);
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
					this.trigger('privacy-error');
					return;
				}

				if (!response[0].value) {
					this.set("privacy", false);
					console.error("No privacy setting for picture " + this.get("id"));
					this.trigger('privacy-error');
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
					case FacebookPicture.FB_FQL_VALUE_NOBODY:
						level = PrivacyDefinition.Level.NOBODY;
						break;
					case FacebookPicture.FB_FQL_VALUE_CUSTOM:
						level = PrivacyDefinition.Level.CUSTOM;
						break;
				}

				this.get("privacy").set("level", level);

				var description = response[0].description;
				if (!_.isNull(description)) {

					var excludeList = [], includeList = [], split;

					if (description.match(FacebookPicture.FB_FQL_TWOLIST_SEPERATOR)) {
						split = description.split(FacebookPicture.FB_FQL_TWOLIST_SEPERATOR);
						includeList = split[0].split(FacebookPicture.FB_FQL_NAME_SEPERATOR);
						excludeList = split[1].split(FacebookPicture.FB_FQL_NAME_SEPERATOR);
					}

					else if (description.match(FacebookPicture.FB_FQL_EXCEPT_SEPERATOR)) {
						excludeList =
							description.replace(FacebookPicture.B_FQL_EXCEPT_SEPERATOR, '').split(FacebookPicture.FB_FQL_NAME_SEPERATOR);
					}

					else {
						includeList =
							description.split(FacebookPicture.FB_FQL_NAME_SEPERATOR);
					}

					this.get("privacy").set("excludeList", excludeList);
					this.get("privacy").set("includeList", includeList);

				}

				this.trigger('privacy');
			}, this));
		}
		catch(e) {
			console.error("Error while getting privacy for picture ", e);
		}

	}

}, {
	FB_FQL_QUERY: "SELECT value,description,owner_id,friends FROM privacy WHERE id = ",
	FB_FQL_VALUE_ALL: "ALL",
	FB_FQL_VALUE_FOF: "FRIENDS_OF_FRIENDS",
	FB_FQL_VALUE_FRIENDS: "ALL_FRIENDS",
	FB_FQL_VALUE_ME: "SELF",
	FB_FQL_VALUE_NOBODY: "NOBODY",
	FB_FQL_VALUE_CUSTOM: "CUSTOM",
	FB_FQL_NAME_SEPERATOR: ", ",
	FB_FQL_TWOLIST_SEPERATOR: /; Except: /,
	FB_FQL_EXCEPT_SEPERATOR: /Except: /
});

var FacebookPictureCollection = Backbone.Collection.extend({
	
	model: FacebookPicture,

	getByPid: function(pid) {
		return this.where({id: pid});
	}

})