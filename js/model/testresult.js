var TestResult = Backbone.Model.extend({
	
	defaults: {
		message: "",
		is: 0,
		was: 0,
		type: undefined
	},

	initialize: function(p) {
		if (p.is === undefined || p.was === undefined) throw new Error('Testresult missing input data', p);

		console.log("[TestResult] Init");
	}

}, {
	Type: {
		UNKNOWN: 0, LISTGUESS: 1, ITEMGUESS: 2, HANGMAN: 3
	}
});

var TestResultCollection = Backbone.Collection.extend({
	
	model: TestResult

});