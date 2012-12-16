var FacebookUser = Backbone.Model.extend({
	
	defaults: {
		name: undefined,
		id: undefined
	},

	initialize: function(friend) {
		if (!friend.id || !friend.name) {
			throw new Exception("Invalid user (id or name missing)");
		}

		if (!friend.type) this.set("type", FacebookUser.Type.FRIEND);

		this.set("id", friend.id);
		this.set("name", friend.name);
	}

}, {
	Type: {
		FRIEND: 0, FOREIGNER: 1
	}
});

var FacebookUserCollection = Backbone.Collection.extend({
	
	model: FacebookUser,

	getByUid: function(uid) {
		// id is unique, so only one user will be returned
		return this.where({id: uid})[0];
	}

});