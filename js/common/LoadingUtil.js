(function()
{
    "use strict";

    var ns = namespace( "pc.common" );

    /**
     * A Range.<br />
     * A range represents a range between two numbers.
     *
     * @namespace pc.common
     * @class LoadingUtil
     * @extends Backbone.Model
     */
    ns.LoadingUtil = Backbone.Model.extend( {

        /**
         * Reset the loading modal: Hide and set size to 0%
         *
         * @method reset
         */
        reset: function()
        {
            $( pc.common.LoadingUtil.CONTAINER_ID ).modal('hide');
            $( pc.common.LoadingUtil.PROGRESS_BAR_ID ).css( 'width', '0%' );
        },

        /**
         * Change the bar width
         *
         * @method percent
         * @param {Number} percent The percentage to set the bar width
         */
        percent: function(percent) {
            if (percent < 0 || percent > 100) {
                console.error("[LoadingUtil] Invalid loading bar percentage: " + percent);
                return;
            }

            $( pc.common.LoadingUtil.PROGRESS_BAR_ID ).css( 'width', percent + '%');
        },

        /**
         * Show the loading modal
         *
         * @method show
         */
        show: function() {
            $( pc.common.LoadingUtil.CONTAINER_ID ).modal('show');
        },

        /**
         * Hide the loading modal
         *
         * @method hide
         */
        hide: function() {
            $( pc.common.LoadingUtil.CONTAINER_ID ).modal('hide');
        }

    }, {

        CONTAINER_ID:    "#loading-container",
        PROGRESS_BAR_ID: "#loading-container .bar",

        /**
         * Get a singleton instance of LoadingUtil.
         *
         * @method getInstance
         * @returns {pc.model.LoadingUtil} A singleton instance
         * @static
         */
        getInstance: function()
        {
            if ( this.__instance === undefined ) {
                this.__instance = new pc.common.LoadingUtil();
            }
            return this.__instance;
        }

    } );

})();