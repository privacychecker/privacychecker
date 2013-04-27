(function()
{
    "use strict";

    /**
     * Main entry point.
     */
    var app = {

        /**
         * Register Handlebar helper for i18n usage in templates
         *
         * @method
         */
        handlebars: function()
        {

            Handlebars.registerHelper( 't', function( i18n_key )
            {
                var result = i18n.t( i18n_key );
                return new Handlebars.SafeString( result );
            } );

            Handlebars.registerHelper( 'tr', function( context, options )
            {
                var opts = i18n.functions.extend( options.hash, context );
                if ( options.fn ) {
                    opts.defaultValue = options.fn( context );
                }

                var result = i18n.t( opts.key, opts );

                return new Handlebars.SafeString( result );
            } );
        },

        /**
         * Start the backbone router and listen for changes
         *
         * @method
         */
        start: function()
        {
            i18n.init( {
                    resGetPath:      'i18n/__lng__.json',
                    fallbackLng:     "en",
                    useLocalStorage: false
                }, function()
                {
                    console.log( "Language files loaded, initializing app" );
                    // translate index
                    $( 'body' ).i18n();

                    // start the page
                    var app = new pc.router.AppRouter();
                    Backbone.history.start();

                    $( "#load" ).fadeOut( 'slow', function()
                    {
                        $( this ).remove();
                    } );
                }
            );
        }
    };

    /**
     * lets bang when the document is ready
     *
     * @method
     */
    $( 'document' ).ready( function()
    {
        app.handlebars();
        app.start();
    } );

})();