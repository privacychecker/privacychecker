var FacebookList = Backbone.Model.extend({

	defauts: {
		name: undefined,
		id: undefined,
		type: undefined,
		members: undefined
	}

});

var FacebookListCollection = Backbone.Collection.extend({
	
	model: FacebookList
	
});