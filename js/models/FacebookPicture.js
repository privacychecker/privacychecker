(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    ns.FacebookPicture = Backbone.Model.extend( {

        defaults: {
            id:      undefined,
            name:    undefined,
            source:  undefined,
            height:  undefined,
            width:   undefined,
            privacy: undefined
        },

        initialize:      function( picture )
        {
            if ( !picture.id || !picture.source ) {
                console.error( "Picture missing required data (id, source)", picture.id, picture.source );
                throw new pc.common.Exception( "Picture missing required data: id or source" );
            }

            this.set( "id", picture.id );
            this.set( "name", picture.name );
            this.set( "source", picture.source );
            this._getPrivacy();
        },

        // we need to convert all list ids to friend ids
        validatePrivacy: function( friends, friendlists )
        {
            this.get( 'privacy' ).flattenLists( friends, friendlists );
        },

        _getPrivacy: function()
        {

            this.set( "privacy", new pc.common.PrivacyDefinition() );

            try {
                FB.api( {
                    method: 'fql.query',
                    query:  pc.model.FacebookPicture.FB_FQL_QUERY + this.get( "id" )
                }, _.bind( function( response )
                {

                    if ( !response || response.length !== 1 ) {
                        this.set( "privacy", false );
                        console.error( "Unable to get privacy settings for picture " + this.get( "id" ) );
                        this.trigger( 'privacy-error' );
                        return;
                    }

                    if ( !response[0].value ) {
                        this.set( "privacy", false );
                        console.error( "No privacy setting for picture " + this.get( "id" ) );
                        this.trigger( 'privacy-error' );
                        return;
                    }

                    // global visibilty
                    var level;
                    switch ( response[0].value ) {
                        case pc.model.FacebookPicture.FB_FQL_VALUE_ALL:
                            level = pc.common.PrivacyDefinition.Level.ALL;
                            break;
                        case pc.model.FacebookPicture.FB_FQL_VALUE_FOF:
                            level = pc.common.PrivacyDefinition.Level.FOF;
                            break;
                        case pc.model.FacebookPicture.FB_FQL_VALUE_FRIENDS:
                            level = pc.common.PrivacyDefinition.Level.FRIENDS;
                            break;
                        case pc.model.FacebookPicture.FB_FQL_VALUE_ME:
                            level = pc.common.PrivacyDefinition.Level.ME;
                            break;
                        case pc.model.FacebookPicture.FB_FQL_VALUE_NOBODY:
                            level = pc.common.PrivacyDefinition.Level.NOBODY;
                            break;
                        case pc.model.FacebookPicture.FB_FQL_VALUE_CUSTOM:
                            level = pc.common.PrivacyDefinition.Level.CUSTOM;
                            break;
                        default:
                            console.warn( '[FacebookPicture] Found unrecognized privacy level', response[0].value );
                    }

                    this.get( "privacy" ).set( "level", level );

                    var description = response[0].description;
                    if ( !_.isNull( description ) ) {

                        var excludeList = [], includeList = [], split;

                        if ( description.match( pc.model.FacebookPicture.FB_FQL_TWOLIST_SEPERATOR ) ) {
                            split = description.split( pc.model.FacebookPicture.FB_FQL_TWOLIST_SEPERATOR );
                            includeList = split[0].split( pc.model.FacebookPicture.FB_FQL_NAME_SEPERATOR );
                            excludeList = split[1].split( pc.model.FacebookPicture.FB_FQL_NAME_SEPERATOR );
                        }

                        else if ( description.match( pc.model.FacebookPicture.FB_FQL_EXCEPT_SEPERATOR ) ) {
                            excludeList =
                                description.replace( pc.model.FacebookPicture.B_FQL_EXCEPT_SEPERATOR,
                                    '' ).split( pc.model.FacebookPicture.FB_FQL_NAME_SEPERATOR );
                        }

                        else {
                            includeList =
                                description.split( pc.model.FacebookPicture.FB_FQL_NAME_SEPERATOR );
                        }

                        includeList.push( pc.model.FacebookPlayer.getInstance().get( 'name' ) );

                        this.get( "privacy" ).set( "excludeList", excludeList );
                        this.get( "privacy" ).set( "includeList", includeList );

                    }

                    this.trigger( 'privacy' );
                }, this ) );
            }
            catch ( e ) {
                console.error( "Error while getting privacy for picture ", e );
            }

        }

    }, {
        FB_FQL_QUERY:             "SELECT value,description,owner_id,friends FROM privacy WHERE id = ",
        FB_FQL_VALUE_ALL:         "EVERYONE",
        FB_FQL_VALUE_FOF:         "FRIENDS_OF_FRIENDS",
        FB_FQL_VALUE_FRIENDS:     "ALL_FRIENDS",
        FB_FQL_VALUE_ME:          "SELF",
        FB_FQL_VALUE_NOBODY:      "NOBODY",
        FB_FQL_VALUE_CUSTOM:      "CUSTOM",
        FB_FQL_NAME_SEPERATOR:    ", ",
        FB_FQL_TWOLIST_SEPERATOR: /; Except: /,
        FB_FQL_EXCEPT_SEPERATOR:  /Except: /
    } );

})();