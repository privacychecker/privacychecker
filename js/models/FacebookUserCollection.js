(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    ns.FacebookUserCollection = Backbone.Collection.extend( {

        model: pc.model.FacebookUser,

        getByUid: function( uid )
        {
            // id is unique, so only one user will be returned
            return this.where( {id: uid} )[0];
        }

    } );

})();