(function()
{
    "use strict";
    var ns = namespace( "pc.view" );

    ns.SelectView = Backbone.View.extend( {

        template: pc.template.SelectTemplate,

        initialize: function()
        {
            console.log( "Init: SelectView" );
            this.currentPair = undefined;
            this.lastselection = undefined;
        },

        render: function()
        {
            $( this.el ).html( this.template() );

            this.container1 = $( '<img>', {
                src: 'img/loader.gif'
            } ).css( {
                    display:  "none",
                    position: "absolute",
                    left:     "0px",
                    top:      "0px"
                } );
            this.container2 = $( '<img>', {
                src: 'img/loader.gif'
            } ).css( {
                    display:  "none",
                    position: "absolute",
                    left:     "0px",
                    top:      "0px"
                } );
            $( 'body' ).append( this.container1 ).append( this.container2 );

            try {
                this.testData = pc.model.TestData.getInstance();
            }
            catch ( e ) {
                console.error( "[SelectView] Caught exception while querying testdata", e );
                window.alert( i18n.t( pc.view.SelectView.LANG_INSUFFICIENT_DATA ) );
                throw "E_STOP";
            }

            this.next();

            return this;
        },

        _createObject: function( item )
        {

            if ( item instanceof pc.model.FacebookPicture ) {

                return $( '<img>', {
                    src:     item.get( 'source' ),
                    title:   item.get( 'name' ),
                    'class': 'img-rounded'
                } ).click( _.bind( function()
                    {
                        this.next( item );
                    }, this ) );

            }
            else if ( item instanceof pc.model.FacebookStatus ) {

            }

            return null;

        },

        next: function( winner )
        {
            if ( this.currentPair !== undefined ) {
                console.log( '[SelectView] Last comparision\'s winner was ', winner );
                this.testData.setWinner( this.currentPair[0], this.currentPair[1], winner );
                pc.common.ProgressBar.getInstance().subto( pc.model.TestData.getInstance().getCurrentRound(),
                    pc.model.TestData.getInstance().getMaxRounds() );
            }

            this.currentPair = this.testData.getRateTupple();

            if ( this.currentPair !== undefined ) {

                var item1 = this.currentPair[0];
                var item2 = this.currentPair[1];

                var opacity1 = 0.7, opacity2 = 0.7;
                if ( this.lastselection === 1 ) {
                    opacity1 = 1;
                }
                else if ( this.lastselection === 2 ) opacity2 = 1;

                $( this.el ).find( pc.view.SelectView.IMAGE_1_CONTAINER + ' ' + pc.view.SelectView.INFO_CONTAINER ).fadeTo( 0,
                    opacity1 );
                $( this.el ).find( pc.view.SelectView.IMAGE_2_CONTAINER + ' ' + pc.view.SelectView.INFO_CONTAINER ).fadeTo( 0,
                    opacity2 );
                $( this.el ).find( pc.view.SelectView.IMAGE_1_CONTAINER ).unbind( 'click' ).css( 'cursor',
                    'progress' ).fadeTo( 0, opacity1 );
                $( this.el ).find( pc.view.SelectView.IMAGE_2_CONTAINER ).unbind( 'click' ).css( 'cursor',
                        'progress' ).fadeTo( 0, opacity2, _.bind( function()
                    {

                        var loaded = [];

                        $( this.container1 ).attr( 'src', item1.get( 'source' ) ).bind( 'load', _.bind( function()
                        {
                            $( this.container1 ).unbind();
                            this.imagesLoadedCb( loaded.push( true ) );
                        }, this ) );

                        $( this.container2 ).attr( 'src', item2.get( 'source' ) ).bind( 'load', _.bind( function()
                        {
                            $( this.container2 ).unbind();
                            this.imagesLoadedCb( loaded.push( true ) );
                        }, this ) );

                    }, this ) );

            }
            else {
                console.log( '[SelectView] Selection done' );
                this.trigger( 'select:done' );
            }
        },

        imagesLoadedCb: function( img )
        {

            if ( img !== 2 ) return;

            var item1 = this.currentPair[0];
            var item2 = this.currentPair[1];

            $( this.el ).find( pc.view.SelectView.IMAGE_1_CONTAINER ).unbind( 'click' ).fadeOut( 'fast' );
            $( this.el ).find( pc.view.SelectView.IMAGE_2_CONTAINER ).unbind( 'click' ).fadeOut( 'fast',
                _.bind( function()
                {

                    $( this.el ).find( pc.view.SelectView.IMAGE_1_CONTAINER + ' ' + pc.view.SelectView.INFO_CONTAINER ).empty().html( item1.get( 'name' ) ).fadeTo( 'fast',
                        1 );
                    $( this.el ).find( pc.view.SelectView.IMAGE_2_CONTAINER + ' ' + pc.view.SelectView.INFO_CONTAINER ).empty().html( item2.get( 'name' ) ).fadeTo( 'fast',
                        1 );

                    $( this.el ).find( pc.view.SelectView.IMAGE_1_CONTAINER + ' img' ).attr( 'src',
                        item1.get( 'source' ) ).fadeIn( 'fast' );
                    $( this.el ).find( pc.view.SelectView.IMAGE_2_CONTAINER + ' img' ).attr( 'src',
                        item2.get( 'source' ) ).fadeIn( 'fast' );

                    $( this.el ).find( pc.view.SelectView.IMAGE_1_CONTAINER ).click( _.bind( function()
                    {
                        this.lastselection = 1;
                        this.next( item1 );
                    }, this ) ).css( 'cursor', 'pointer' ).fadeTo( 'fast', 1 );
                    $( this.el ).find( pc.view.SelectView.IMAGE_2_CONTAINER ).click( _.bind( function()
                    {
                        this.lastselection = 2;
                        this.next( item2 );
                    }, this ) ).css( 'cursor', 'pointer' ).fadeTo( 'fast', 1 );

                }, this ) );

        }

    }, {

        IMAGE_COTAINER:    '.select',
        IMAGE_1_CONTAINER: '.image1',
        IMAGE_2_CONTAINER: '.image2',
        INFO_CONTAINER:    '.title',

        LOADER_GIF_SRC: 'img/loader.gif',

        LANG_INSUFFICIENT_DATA: "app.select.insufficient_data"

    } );

})();


