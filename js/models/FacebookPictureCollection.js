(function()
{
    "use strict";

    var ns = namespace( "pc.model" );

    ns.FacebookPictureCollection = Backbone.Collection.extend( {

        model: pc.model.FacebookPicture,

        getByPid: function( pid )
        {
            return this.where( {id: pid} );
        }

    } );

})();
