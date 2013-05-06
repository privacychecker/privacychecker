(function()
{
    "use strict";

    var ns = namespace( "pc.common" );

    /**
     * Small helper class to format various date string
     *
     * @namespace pc.common
     * @class DateFormatHelper
     * @extends Backbone.Model
     */
    ns.DateFormatHelper = Backbone.Model.extend( {
    }, {
        /**
         * Format a date as DD. MM. YY, hh:mm
         *
         * @method formatShort
         * @static
         * @param {Date} date The date you want to have formatted
         * @returns {String} A string with the date formated as DD. MM. YY, hh:mm
         */
        formatShort: function( date )
        {
            if ( !_.isNull( date ) ) {
                return moment( date ).format( "DD. MM. YY, hh:mm" );
            }
            else {
                return "invalid_date";
            }
        }
    } );

})();