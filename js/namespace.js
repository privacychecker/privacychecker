var namespace = function( namespaceString )
{
    "use strict";

    var parts = namespaceString.split( '.' ),
        parent = window,
        currentPart = '';

    for ( var i = 0, length = parts.length; i < length; i++ ) {
        currentPart = parts[i];
        parent[currentPart] = parent[currentPart] || {};
        parent = parent[currentPart];
    }

    return parent;
};

// create default namespace for intellij idea cc
pc = {
    common:   {},
    model:    {},
    view:     {},
    router:   {},
    template: {}
};