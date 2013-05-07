(function()
{
    "use strict";

    var ns = namespace( "pc.common" );

    /**
     * Small helper to calculate the relative difference between two numbers
     *
     * @namespace pc.common
     * @class RelativeDifferenceCalculator
     * @extends Backbone.Model
     */
    ns.RelativeDifferenceCalculator = Backbone.Model.extend( {
    }, {

        /**
         * Calculate the relative difference between the two values
         *
         * @param {number} correct The correct number
         * @param {number} guess The number the user guessed
         * @returns {number} A number from 0..1
         */
        calculate: function( correct, guess )
        {
            if ( correct === 0 && guess === 0 ) return 0;

            if ( correct < guess ) {
                return (guess - correct) / guess;
            }
            else {
                return (correct - guess) / correct;
            }
        }
    } );

})();