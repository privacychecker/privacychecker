var tpl = {

    // Hash of preloaded templates for the app
    templates:{},

    // Recursively pre-load all the templates for the app.
    // This implementation should be changed in a production environment. All the template files should be
    // concatenated in a single file.
    loadTemplates: function (names, callback) {

        var that = this;

        var loadTemplate = function (index) {
            var name = names[index];
            console.log('Loading template: ' + name);
            $.get('tpl/' + name + '.html?' + $.random(999999), function (data) {
                that.templates[name] = data;
                index++;
                if (index < names.length) {
                    loadTemplate(index);
                } else {
                    callback();
                }
            });
        };

        loadTemplate(0);
    },

    // Get template by name from hash of preloaded templates
    get: function (name) {
        return this.templates[name];
    }

};

jQuery.fn.center = function () {
    this.css("position","absolute");
    this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) + $(window).scrollTop()) + "px");
    this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + $(window).scrollLeft()) + "px");
    return this;
};

var OverlayInfo = Backbone.Model.extend({

    defaults: {
        text: "Text missing",
        click: function() {},

        autoDestroy: true,

        autoDismiss: false,
        dismissInterval: 10
    },

    initialize: function() {
        console.log('[OverlayInfo] Injecting to body');

        this.container = $('<div>').addClass('grayitizer').fadeOut('fast');

        var alert = $('<div>').addClass('alert').html(this.get('text'));
        alert.click(_.bind(function() {
            this.destroy();
            this.get('click')();
        }, this));
        this.container.append(alert);

        $('body').append(this.container);
    },

    show: function() {
        this.container.fadeIn('fast');
        this.container.children().center();
    },

    hide: function() {
        this.container.fadeOut('fast');
    },

    destroy: function() {
        this.container.fadeOut('fast', _.bind(function() {
            this.container.remove();
        }, this));
    }

});

var ProgressBar = Backbone.Model.extend({

    defaults: {
        max: 7,
        ptr: 0
    },

    initialize: function() {
        if ($(ProgressBar.DIVIDER_ID)) {
            var w = 1 / this.get('max') * 100;
            console.log("[ProgressBar] Setting divider width to " + w + "% based on " + this.get('max') + " items");
            $(ProgressBar.DIVIDER_ID + ' li').css('width', w + '%');
        }
    },

    to: function(ptr) {
        this.set('ptr', ptr);
        var w = this.get('ptr') / this.get('max') * 100;

        $(ProgressBar.PROGRESS_BAR_ID).transition({
            "width": w + "%"
        });

        if ($(ProgressBar.DIVIDER_ID)) {

            $(ProgressBar.DIVIDER_ID).children('li').each(function(index, el) {
                $el = $(el);
                if (index === undefined || index === ptr) $el.addClass('active');
                else $el.removeClass('active');
            });

        }
    },

    subto: function(ptr, max) {
        var cw = this.get('ptr') / this.get('max') * 100;
        console.log("SUB1", cw, this.get('ptr'), this.get('max'));
        var w = cw + (ptr / (max * this.get('max')) * 100);
        console.log("SUB2", ptr, max);

        $(ProgressBar.PROGRESS_BAR_ID).transition({
            "width": w + "%"
        });
    }

}, {

    DIVIDER_ID: '#divider ul',
    PROGRESS_BAR_ID: '#progressbar',
    INSTANCE: undefined,

    getInstance: function () {
        if (ProgressBar.INSTANCE === undefined)
            ProgressBar.INSTANCE = new ProgressBar();

        return ProgressBar.INSTANCE;
    }

});


