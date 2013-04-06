(function()
{
    "use strict";

    var ns = namespace( "pc.common" );

    ns.PrivacyDefinition = Backbone.Model.extend( {

        defaults: {
            level:       undefined,
            excludeList: [],
            includeList: [],
            exclude:     [], // simple id array
            include:     []
        },

        flattenLists: function( friends, lists )
        {
            //console.debug('[PrivacyDefinition] Flattening lists with ', lists);

            //console.debug('[PrivacyDefinition] Before: ', this.get('exclude'), this.get('include'));
            //
            console.debug( '[PrivacyDefinition] plain lists are: ', this.get( 'excludeList' ),
                this.get( 'includeList' ) );

            this.set( 'exclude', new pc.model.FacebookUserCollection() );
            this.set( 'include', new pc.model.FacebookUserCollection() );

            if ( this.get( 'excludeList' ).length > 0 || this.get( 'includeList' ).length > 0 ) {
                lists.each( _.bind( function( list )
                {

                    var listname = list.get( 'name' );

                    // enabling this output slows down the browser massivly!
                    //console.debug('[PrivacyDefinition] list ' + listname, _.contains(this.get('excludeList'), listname), _.contains(this.get('includeList'), listname));

                    if ( _.contains( this.get( 'excludeList' ), listname ) ) {
                        console.log( '[PrivacyDefinition] Exclude id contains this list, replacing with listmembers' );
                        this.get( 'exclude' ).add( list.get( 'members' ).models );
                    }

                    if ( _.contains( this.get( 'includeList' ), listname ) ) {
                        console.log( '[PrivacyDefinition] Include id contains this list, replacing with listmembers' );
                        this.get( 'include' ).add( list.get( 'members' ).models );
                    }
                }, this ) );

                friends.each( _.bind( function( friend )
                {

                    var friendname = friend.get( 'name' );

                    if ( _.contains( this.get( 'excludeList' ), friendname ) ) {
                        console.log( '[PrivacyDefinition] Exclude id contains friend, replacing.' );
                        this.get( 'exclude' ).add( friend );
                    }

                    if ( _.contains( this.get( 'includeList' ), friendname ) ) {
                        console.log( '[PrivacyDefinition] Include id contains friend, replacing.' );
                        this.get( 'include' ).add( friend );
                    }
                }, this ) );
            }

            console.debug( '[PrivacyDefinition] Definition for item: ', this.get( 'exclude' ), this.get( 'include' ) );

        }

    }, {
        Level: {
            "ALL": 0, "FOF": 1, "FRIENDS": 2, "ME": 3, "NOBODY": 4, "CUSTOM": 5
        }
    } );

})();