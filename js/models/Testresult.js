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
            message: "",
            is:      0,
            was:     0,
            type:    undefined
        },

        /**
         * Create a new Testresult.
         *
         * @method
         * @constructor
         * @param { {is: Object, was: Object}} result The result
         */
        initialize: function( result )
        {
            if ( result.is === undefined || result.was === undefined ) {
                throw new Error( 'Testresult missing input data', result );
            }

            console.log( "[TestResult] Init" );
        }

    }, {
        Type: {
            UNKNOWN: 0, LISTGUESS: 1, ENTITYGUESS: 2, HANGMAN: 3
        }
    } );

})();