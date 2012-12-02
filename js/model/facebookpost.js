var FacebookPost = Backbone.Model.extend({
	
	defaults: {
		message: undefined,
		id: undefined,
		privacy: undefined
	}

})

var FacebookPostCollection = Backbone.Collection.extend({
	
	model: FacebookPost
})