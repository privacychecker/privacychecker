(function()
{
    "use strict";

    var ns = namespace( "pc.common" );

    /**
     * A facebook privacy definition for different items like pictures or statuses
     *
     * @namespace pc.common
     * @class PrivacyDefinition
     * @extends Backbone.Model
     */
    ns.PrivacyDefinition = Backbone.Model.extend( {

        defaults: {
            /**
             * @property {String} level The visibility level
             */
            level:       undefined,
            excludeTemp: [], // temp
            includeTemp: [], // temp
            /**
             * @property {pc.model.FacebookUserCollection} exclude All members which cannot see the item
             */
            exclude:     [],
            /**
             * @property {pc.model.FacebookUserCollection} include All members which can see the item
             */
            include:     [],
            /**
             * @property {pc.model.FacebookUserCollection} includeUser All user explicit allowed for this item
             */
            includeUser: [],
            /**
             * @property {pc.model.FacebookListCollection} includeUser All lists explicit allowed for this item
             */
            includeList: [],
            /**
             * @property {pc.model.FacebookUserCollection} excludeUser All user explicit denied for this item
             */
            excludeUser: [],
            /**
             * @property {pc.model.FacebookListCollection} excludeGroup All lists explicit denied for this item
             */
            excludeList: []
        },

        /**
         * Query privacy definition from facebook via fql using:
         * <pre>SELECT value,description,owner_id,friends FROM privacy WHERE id = <id></pre>
         *
         * @method load
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

                    this.set( "excludeTemp", parsedData.exclude );
                    this.set( "includeTemp", parsedData.include );
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

        /**
         * Transform list ids to plain user ids
         *
         * @method flattenLists
         * @param {pc.model.FacebookUserCollection} friends All friends of current player
         * @param {pc.model.FacebookListCollection} lists All lists of current player
         */
        flattenLists: function( friends, lists )
        {

            var player = pc.model.FacebookPlayer.getInstance(),
                playerHash = {
                    name: player.get( 'name' ),
                    id:   player.get( 'id' )
                };
            //console.debug('[PrivacyDefinition] Flattening lists with ', lists);

            //console.debug('[PrivacyDefinition] Before: ', this.get('exclude'), this.get('include'));
            //
            console.debug( '[PrivacyDefinition] plain lists are: ', this.get( 'excludeTemp' ),
                this.get( 'includeTemp' ) );

            this.set( 'exclude', new pc.model.FacebookUserCollection() );
            this.set( 'include', new pc.model.FacebookUserCollection() );

            this.set( 'excludeUser', new pc.model.FacebookUserCollection() );
            this.set( 'includeUser', new pc.model.FacebookUserCollection() );

            this.set( 'excludeList', new pc.model.FacebookListCollection() );
            this.set( 'includeList', new pc.model.FacebookListCollection() );

            if ( this.get( 'excludeTemp' ).length > 0 || this.get( 'includeTemp' ).length > 0 ) {
                lists.each( _.bind( function( list )
                {
                    var listname = list.get( 'name' );

                    // enabling this output slows down the browser massivly!
                    //console.debug('[PrivacyDefinition] list ' + listname, _.contains(this.get('excludeTemp'), listname), _.contains(this.get('includeTemp'), listname));

                    if ( _.contains( this.get( 'excludeTemp' ), listname ) ) {
                        console.log( '[PrivacyDefinition] Exclude id contains this list, replacing with listmembers' );
                        this.get( 'exclude' ).add( list.get( 'members' ).models );
                        this.get( 'excludeList' ).add( list );
                    }

                    if ( _.contains( this.get( 'includeTemp' ), listname ) ) {
                        console.log( '[PrivacyDefinition] Include id contains this list, replacing with listmembers' );
                        this.get( 'include' ).add( list.get( 'members' ).models );
                        this.get( 'includeList' ).add( list );
                    }
                }, this ) );

                friends.each( _.bind( function( friend )
                {

                    var friendname = friend.get( 'name' );

                    if ( _.contains( this.get( 'excludeTemp' ), friendname ) ) {
                        console.log( '[PrivacyDefinition] Exclude id contains friend, replacing.' );
                        this.get( 'exclude' ).add( friend );
                        this.get( 'excludeUser' ).add( friend );
                    }

                    if ( _.contains( this.get( 'includeTemp' ), friendname ) ) {
                        console.log( '[PrivacyDefinition] Include id contains friend, replacing.' );
                        this.get( 'include' ).add( friend );
                        this.get( 'includeUser' ).add( friend );
                    }
                }, this ) );

                // "Friends" list is not in lists, manually validate
                if ( _.contains( this.get( 'includeTemp' ), pc.common.PrivacyDefinition.FRIENDS_LIST_NAME ) ) {
                    console.log( '[PrivacyDefinition] Include id contains friends_list, replacing.' );
                    this.get( 'include' ).add( player.getFriends().models );
                    this.get( 'includeList' ).add( new pc.model.FacebookList( {
                        id:      -1,
                        name:    pc.common.PrivacyDefinition.FRIENDS_LIST_NAME,
                        members: player.getFriends()
                    } ) );
                }

                if ( _.contains( this.get( 'excludeTemp' ), pc.common.PrivacyDefinition.FRIENDS_LIST_NAME ) ) {
                    console.log( '[PrivacyDefinition] Include id contains friends_list, replacing.' );
                    this.get( 'exclude' ).add( player.getFriends().models );
                    this.get( 'excludeList' ).add( new pc.model.FacebookList( {
                        id:      -1,
                        name:    pc.common.PrivacyDefinition.FRIENDS_LIST_NAME,
                        members: player.getFriends()
                    } ) );
                }

                // player is not in any list
                if ( _.contains( this.get( 'includeTemp' ), player.get( 'name' ) ) ) {
                    console.log( '[PrivacyDefinition] Include id contains player, replacing.' );
                    this.get( 'include' ).add( playerHash );
                    this.get( 'includeUser' ).add( playerHash );
                }

                // should not be possible but hey..
                if ( _.contains( this.get( 'excludeTemp' ), player.get( 'name' ) ) ) {
                    console.log( '[PrivacyDefinition] Exclude id contains player, replacing.' );
                    this.get( 'exclude' ).add( playerHash );
                    this.get( 'excludeUser' ).add( playerHash );
                }

            }

            console.debug( '[PrivacyDefinition] Definition for item: ', this.get( 'exclude' ), this.get( 'include' ) );

            this.trigger( 'done' );

        },

        /**
         * Parse data returned from facebook after a fql query.<br/>
         * Response always looks like:
         * <pre>{
         *   "data": [
         *     {
         *       "value": "ALL_FRIENDS",
         *       "description": "Friends",
         *       "owner_id": 1542712615,
         *       "friends": "NO_FRIENDS"
         *     }
         *   ]
         * }</pre>
         *
         * @method _parseResponse
         * @param {Array<Object{value: String, description: String, owner_id: Number, friends: String}>} response A facebook response
         * @returns {{include: Array, exclude: Array, level: String}} The parsed data
         * @throws "E_RESPONSE_IS_UNDEF" If the response is undefined or has wrong structure
         * @throws "E_UNKNOWN_PRIVACY_DEFINITION" If the privacy definition is unknown
         * @throws "E_EMPTY_PRIVACY_DESCRIPTION" If the privacy description is empty (no users listed, ...)
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

            // if we're on friends visibility, description field is using 'Your friends', custom uses 'Friends'
            if (level === pc.common.PrivacyDefinition.Level.FRIENDS) {
                includeList.push( pc.common.PrivacyDefinition.FRIENDS_LIST_NAME );
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
        FB_FQL_EXCEPT_SEPERATOR:  /Except: /,

        FRIENDS_LIST_NAME: "Friends"

    } );

})();