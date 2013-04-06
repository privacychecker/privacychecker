(function()
{
    "use strict";

    var ns = namespace( "pc.common" );

    ns.PrivacyDefinition = Backbone.Model.extend( {

        defaults: {
            level:       undefined,
            excludeList: [], // temp
            includeList: [], // temp
            exclude:     [], // simple id array
            include:     []
        },

        /**
         * Query privacy definition from facebook via fql using:
         * SELECT value,description,owner_id,friends FROM privacy WHERE id = <id>
         */
        load: function()
        {

            this.trigger( 'load' );

            FB.api( {
                method: 'fql.query',
                query:  _.template( pc.common.PrivacyDefinition.FB_FQL_QUERY, {id: this.id} )
            }, _.bind( function( response )
            {
                if ( response.length !== 1 ) {
                    console.error( "[PrivacyDefinition] Error loading privacy for item with id", this.get( 'id' ),
                        response );
                    this.trigger( 'error' );
                    return;
                }

                console.debug( "[PrivacyDefinition] Got privacy data for item with id ", this.id );

                try {
                    var parsedData = this._parseResponse( response );

                    this.set( "excludeList", parsedData.exclude );
                    this.set( "includeList", parsedData.include );
                    this.set( "level", parsedData.level );
                }
                catch ( e ) {
                    console.error( "[PrivacyDefinition] Unable to set privacy for item with id", this.id,
                        "because of: ", e );
                    this.trigger( 'error' );
                }

                console.debug( "[PrivacyDefinition] Done parsing privacy for item with id ", this.id );

                this.trigger( 'data' );

            }, this ) );
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

            this.trigger( 'done' );

        },

        /**
         * Parse data returned from facebook after a fql query.<br/>
         * Response always looks like:
         * {
         *   "data": [
         *     {
         *       "value": "ALL_FRIENDS",
         *       "description": "Friends",
         *       "owner_id": 1542712615,
         *       "friends": "NO_FRIENDS"
         *     }
         *   ]
         * }
         *
         * @param response [{value: String, description: String, owner_id: Number, friends: String}]
         * @returns {{include: Array, exclude: Array, level: String}}
         * @private
         */
        _parseResponse: function( response )
        {

            var includeList = [],
                excludeList = [],
                level,
                value = response[0].value,
                description = response[0].description,
                split;

            if ( _.isUndefined( response ) || response.length !== 1 || _.isUndefined( response[0].value ) ) {
                console.error( "[PrivacyDefinition] Error parsing privacy response, its empty", response );
                throw "E_RESPONSE_IS_UNDEF";
            }

            // global visibilty
            switch ( value ) {
                case pc.common.PrivacyDefinition.FB_FQL_VALUE_ALL:
                    level = pc.common.PrivacyDefinition.Level.ALL;
                    break;
                case pc.common.PrivacyDefinition.FB_FQL_VALUE_FOF:
                    level = pc.common.PrivacyDefinition.Level.FOF;
                    break;
                case pc.common.PrivacyDefinition.FB_FQL_VALUE_FRIENDS:
                    level = pc.common.PrivacyDefinition.Level.FRIENDS;
                    break;
                case pc.common.PrivacyDefinition.FB_FQL_VALUE_ME:
                    level = pc.common.PrivacyDefinition.Level.ME;
                    break;
                case pc.common.PrivacyDefinition.FB_FQL_VALUE_NOBODY:
                    level = pc.common.PrivacyDefinition.Level.NOBODY;
                    break;
                case pc.common.PrivacyDefinition.FB_FQL_VALUE_CUSTOM:
                    level = pc.common.PrivacyDefinition.Level.CUSTOM;
                    break;
                default:
                    console.error( '[PrivacyDefinition] Found unrecognized privacy level', response[0].value );
                    throw "E_UNKNOWN_PRIVACY_DEFINITION";
            }

            if ( _.isNull( description ) ) {
                console.error( "[PrivacyDefinition] Description for privacy is empty" );
                throw "E_EMPTY_PRIVACY_DESCRIPTION";
            }

            if ( description.match( pc.common.PrivacyDefinition.FB_FQL_TWOLIST_SEPERATOR ) ) {
                split = description.split( pc.common.PrivacyDefinition.FB_FQL_TWOLIST_SEPERATOR );
                includeList = split[0].split( pc.common.PrivacyDefinition.FB_FQL_NAME_SEPERATOR );
                excludeList = split[1].split( pc.common.PrivacyDefinition.FB_FQL_NAME_SEPERATOR );
            }

            else if ( description.match( pc.common.PrivacyDefinition.FB_FQL_EXCEPT_SEPERATOR ) ) {
                excludeList =
                    description.replace( pc.common.PrivacyDefinition.FB_FQL_EXCEPT_SEPERATOR,
                        '' ).split( pc.common.PrivacyDefinition.FB_FQL_NAME_SEPERATOR );
            }

            else {
                includeList =
                    description.split( pc.common.PrivacyDefinition.FB_FQL_NAME_SEPERATOR );
            }

            // current player always sees all items
            includeList.push( pc.model.FacebookPlayer.getInstance().get( 'name' ) );

            return {
                include: includeList,
                exclude: excludeList,
                level:   level
            };

        }
    }, {
        Level: {
            "ALL": 0, "FOF": 1, "FRIENDS": 2, "ME": 3, "NOBODY": 4, "CUSTOM": 5
        },

        FB_FQL_QUERY:             "SELECT value,description,owner_id,friends FROM privacy WHERE id = <%= id %>",
        FB_FQL_VALUE_ALL:         "EVERYONE",
        FB_FQL_VALUE_FOF:         "FRIENDS_OF_FRIENDS",
        FB_FQL_VALUE_FRIENDS:     "ALL_FRIENDS",
        FB_FQL_VALUE_ME:          "SELF",
        FB_FQL_VALUE_NOBODY:      "NO_FRIENDS",
        FB_FQL_VALUE_CUSTOM:      "CUSTOM",
        FB_FQL_NAME_SEPERATOR:    ", ",
        FB_FQL_TWOLIST_SEPERATOR: /; Except: /,
        FB_FQL_EXCEPT_SEPERATOR:  /Except: /

    } );

})();