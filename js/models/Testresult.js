(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    /**
     * A testresult.<br />
     * A testresult is used to store data of a game
     *
     * @namespace pc.model
     * @class TestResult
     * @extends Backbone.Model
     */
    ns.TestResult = Backbone.Model.extend( {

        defaults: {
            correctValue: 0,
            userValue:    0,
            item:         undefined,
            gameType:     0,
            optional:      {}
        },

        /**
         * Create a new Testresult.
         *
         * @method
         * @constructor
         * @param { {item: Object, userValue: Object, correctValue: Object}} result The result
         */
        initialize: function( result )
        {
            if ( _.isUndefined( result.item ) || _.isUndefined( result.userValue ) ||
                _.isUndefined( result.correctValue ) ) {
                throw new Error( 'Testresult missing input data', result );
            }
        }

    });

})();