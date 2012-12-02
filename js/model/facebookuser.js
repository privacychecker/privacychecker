var FacebookUser = Backbone.Model.extend({
	
	defaults: {
		name: undefined,
		id: undefined
	},

	initialize: function(friend) {
		if (!friend.id || !friend.name) {
			throw new Exception("Invalid user (id or name missing)");
		}

		this.set("id", friend.id);
		this.set("name", friend.name);
	}

});

var FacebookUserCollection = Backbone.Collection.extend({
	
	model: FacebookUser,

	getByUid: function(uid) {
		// id is unique, so only one user will be returned
		return this.where({id: uid})[0];
	}

});