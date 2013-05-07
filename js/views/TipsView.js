(function()
{
    "use strict";

    var ns = namespace( "pc.view" );

    ns.TipsView = Backbone.View.extend( {

            templateTooltip:        pc.template.TipsTooltipTemplate,
            templateRecommendation: pc.template.TipsRecommendationTemplate,

            initialize: function()
            {
                console.log( "[TipsView] Init" );

                this.$el.on( 'click .close', "hide" );
            },

            hide: function()
            {
                this.$el.slideUp();
            },

            renderTooltip: function( tooltipId )
            {
                this.$el.slideUp( _.bind( function()
                {
                    this.$el
                        .empty()
                        .html( this.templateTooltip() );

                    this.$el.slideDown();
                }, this ) );

            },

            renderRecommendation: function( resultView )
            {
                var recommendations = !_.isUndefined( resultView ) ? resultView.getRecommendations() : {};

                this.$el.slideUp( _.bind( function()
                {

                    console.info( "[TipsView] Rendering recommendations template with options", recommendations );

                    this.$el
                        .empty()
                        .html( this.templateRecommendation( {
                                recommendations: recommendations
                            }
                        ) );

                    this.$el.slideDown();
                }, this ) );

                $.smoothScroll( {
                    scrollTarget: pc.view.TipsView.TIPS_CONTAINER_ID
                } );

            }

        },
        {
            TIPS_CONTAINER_ID: "#tips"
        } );

})();