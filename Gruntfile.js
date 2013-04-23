var path = require( 'path' );

module.exports = function( grunt )
{

    grunt.initConfig( {
        pkg: grunt.file.readJSON( 'package.json' ),
        tag: grunt.template.today( 'yyyymmddHHMMss' ),
        dir: {
            "img":    "./img",
            "js":     "./js/",
            "i18n":   "./i18n/",
            "test":   "./test/",
            "less":   "./less",
            "assets": "./build/assets",
            "vendor": "./vendor/"
        },

        meta: {
            banner: '/*' + "\n" +
                        ' * <%= pkg.name %> - v<%= pkg.version %> - build <%= grunt.template.today("yyyy-mm-dd HH:MM") %>' +
                        "\n" +
                        '<%= pkg.homepage ? " * " + pkg.homepage + "\\n" : "" %>' +
                        ' *' + "\n" +
                        ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>; ' +
                        'Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> (See LICENSE for third-party lib licenses)' +
                        "\n" +
                        ' */' + "\n"
        },

        clean: ["build/", "doc/"],

        copy: {
            assets: {
                files: [
                    {
                        src:     [
                            '<%= dir.img %>/**', '<%= dir.vendor %>/**/*.jpg',
                            '<%= dir.vendor %>/**/*.png'
                        ],
                        dest:    'build/assets',
                        filter:  'isFile',
                        flatten: true,
                        expand:  true
                    }
                ]
            },
            i18n:   {
                files: [
                    {
                        src:     [
                            '<%= dir.i18n %>/*.json'
                        ],
                        dest:    'build/i18n',
                        filter:  'isFile',
                        flatten: true,
                        expand:  true
                    }
                ]
            }
        },

        jshint: {
            options: {
                curly:     false, // allow if(true) foo();
                eqeqeq:    true,
                eqnull:    true,
                browser:   true,
                devel:     true,
                camelcase: false,
                latedef:   true,
                globals:   {
                    jQuery:     true,
                    $:          true,
                    i18n:       true,
                    Handlebars: true,
                    Backbone:   true,
                    pc:         true,
                    namespace:  true,
                    _:          true,
                    FB:         true
                }
            },
            all:     [ 'Gruntfile.js', '<%= dir.js %>/**/*.js', '<%= dir.test %>/**/*.js' ]
        },

        less: {
            dev:  {
                files: {
                    '<%= dir.assets %>/main.css': '<%= dir.less %>/main.less'
                }
            },
            prod: {
                options: {
                    optimization: 9
                },
                files:   {
                    '<%= dir.assets %>/main.css': '<%= dir.less %>/main.less'
                }
            }
        },

        nodeunit: {
            models: [ '<%= dir.js %>/test/models/**/*Test.js'],
            views:  [ '<%= dir.js %>/test/views/**/*Test.js'],
            base:   [ '<%= dir.js %>/test/*Test.js']
        },

        concat: {
            options: {
                stripBanners: true,
                banner:       '<%= meta.banner %>',
                separator:    ';;'
            },
            dist:    {
                src:  [
                    '<%= dir.js %>/models/**/*.js', '<%= dir.js %>/views/**/*.js',
                    '<%= dir.js %>/routers/**/*.js'
                ],
                dest: '<%= dir.assets %>/core.js'
            },
            common:  {
                src:  [ '<%= dir.js %>/common/**/*.js' ],
                dest: '<%= dir.assets %>/common.js'
            },
            home:    {
                src:  [ '<%= dir.js %>/app.js' ],
                dest: '<%= dir.assets %>/app.js'
            },
            ns:      {
                src:  [ '<%= dir.js %>/namespace.js' ],
                dest: '<%= dir.assets %>/namespace.js'
            },
            libs:    {
                src:  [
                    '<%= dir.vendor %>/underscore.js',
                    // jquery
                    '<%= dir.vendor %>/jquery.js', '<%= dir.vendor %>/jquery.random.js',
                    '<%= dir.vendor %>/jquery.center.js', '<%= dir.vendor %>/jquery.transit.js',
                    '<%= dir.vendor %>/jquery-smooth-scroll/jquery.smooth-scroll.js',
                    '<%= dir.vendor %>/jquery.imgpreload.js',
                    // backbone
                    '<%= dir.vendor %>/backbone.js', '<%= dir.vendor %>/backbone-subroute/backbone.subroute.js',
                    // bootstrap
                    '<%= dir.vendor %>/bootstrap/js/bootstrap-transition.js',
                    '<%= dir.vendor %>/bootstrap/js/bootstrap-alert.js',
                    '<%= dir.vendor %>/bootstrap/js/bootstrap-button.js',
                    '<%= dir.vendor %>/bootstrap/js/bootstrap-carousel.js',
                    '<%= dir.vendor %>/bootstrap/js/bootstrap-collapse.js',
                    '<%= dir.vendor %>/bootstrap/js/bootstrap-dropdown.js',
                    '<%= dir.vendor %>/bootstrap/js/bootstrap-modal.js',
                    '<%= dir.vendor %>/bootstrap/js/bootstrap-tooltip.js',
                    '<%= dir.vendor %>/bootstrap/js/bootstrap-popover.js',
                    '<%= dir.vendor %>/bootstrap/js/bootstrap-scrollspy.js',
                    '<%= dir.vendor %>/bootstrap/js/bootstrap-tab.js',
                    //handlebars
                    '<%= dir.vendor %>/handlebars/dist/handlebars.js',
                    //i18next
                    '<%= dir.vendor %>/i18next/release/i18next-1.6.0.js',
                    //
                    '<%= dir.vendor %>/EloRating-JavaScript/src/elo_rating.js'
                ],
                dest: '<%= dir.assets %>/vendor.js'
            }
        },

        handlebars: {
            compile: {
                options: {
                    namespace:   'pc.template',
                    processName: function( filename )
                    {
                        var basename = path.basename( filename ).split( '.' )[0];
                        return basename.charAt( 0 ).toUpperCase() + basename.slice( 1 ) + "Template";
                    }
                },
                files:   {
                    '<%= dir.assets %>/templates.js': '<%= dir.js %>/templates/*.hbs'
                }
            }
        },

        strip: {
            dist: {
                options: {
                    inline: true
                },
                src:     '<%= dir.assets %>/*.js'
            }
        },

        uglify: {
            options:  {
                banner: '<%= meta.banner %>',
                mangle: {
                    except: ['jQuery', 'Backbone', 'Handlebars']
                }
            },
            dist:     {
                files: {
                    '<%= dir.assets %>/core.js':      '<%= dir.assets %>/core.js',
                    '<%= dir.assets %>/common.js':    '<%= dir.assets %>/common.js',
                    '<%= dir.assets %>/app.js':       '<%= dir.assets %>/app.js',
                    '<%= dir.assets %>/vendor.js':    '<%= dir.assets %>/vendor.js',
                    '<%= dir.assets %>/namespace.js': '<%= dir.assets %>/namespace.js'
                }
            },
            template: {
                files: {
                    '<%= dir.assets %>/templates.js': '<%= dir.assets %>/templates.js'
                }
            }
        },

        cssmin: {
            options: {
                banner: '<%= meta.banner %>'
            },
            main:    {
                src:  '<%= dir.assets %>/main.css',
                dest: '<%= dir.assets %>/main.css'
            }
        },

        targethtml: {
            dist: {
                files: {
                    'build/index.html': 'index.html'
                }
            }
        },

        ver: {
            dev:  {
                //forceVersion: '<%= tag %>.dev',
                phases:  [
                    {
                        files:      [ '<%= dir.assets %>/*' ],
                        references: [
                            '<%= dir.assets %>/*', 'build/index.html', 'build/<%= dir.i18n %>/*.json'
                        ]
                    }
                ],
                version: 'build/version.json'
            },
            prod: {
                //forceVersion: '<%= tag %>.dev',
                phases:  [
                    {
                        files:      [ '<%= dir.assets %>/*' ],
                        references: [
                            '<%= dir.assets %>/*', 'build/index.html'
                        ]
                    }
                ],
                version: 'build/version.json'
            }
        },

        yuidoc: {
            compile: {
                name:        '<%= pkg.name %>',
                description: '<%= pkg.description %>',
                version:     '<%= pkg.version %>',
                url:         '<%= pkg.homepage %>',
                options:     {
                    paths:  [
                        '<%= dir.js %>/common', '<%= dir.js %>/models', '<%= dir.js %>/routers', '<%= dir.js %>/views',
                        '<%= dir.js %>/' ],
                    outdir: 'doc/'
                }
            }
        },

        contributors: {
            all: {
                path:   './build/contributers.txt',
                branch: 'develop'
            }
        },

        connect: {
            server: {
                options: {
                    port:      9001,
                    base:      'build',
                    keepalive: true
                }
            }
        }

    } );

    // load modules
    grunt.loadNpmTasks( 'grunt-notify' );
    grunt.loadNpmTasks( 'grunt-contrib-clean' );
    grunt.loadNpmTasks( 'grunt-contrib-copy' );
    grunt.loadNpmTasks( 'grunt-contrib-less' );
    grunt.loadNpmTasks( 'grunt-contrib-concat' );
    grunt.loadNpmTasks( 'grunt-contrib-jshint' );
    grunt.loadNpmTasks( 'grunt-contrib-nodeunit' );
    grunt.loadNpmTasks( 'grunt-contrib-uglify' );
    grunt.loadNpmTasks( 'grunt-contrib-yuidoc' );
    grunt.loadNpmTasks( 'grunt-contrib-handlebars' );
    grunt.loadNpmTasks( 'grunt-css' );
    grunt.loadNpmTasks( 'grunt-targethtml' );
    grunt.loadNpmTasks( 'grunt-strip' );
    grunt.loadNpmTasks( 'grunt-ver' );
    grunt.loadNpmTasks( 'grunt-git-contributors' );
    grunt.loadNpmTasks( 'grunt-contrib-connect' );

    // build tasks
    grunt.registerTask( 'prod', [
        'clean', 'jshint', 'copy:assets', 'copy:i18n', 'less:prod', 'nodeunit:models', 'nodeunit:views',
        'nodeunit:base', 'concat',
        'handlebars', 'strip:dist', 'uglify', 'cssmin', 'targethtml', 'ver:prod', 'yuidoc', 'contributors'
    ] );

    grunt.registerTask( 'dev', [
        'clean', 'jshint', 'copy', 'less:dev', 'concat',
        'handlebars', 'targethtml', 'ver:dev', 'yuidoc', 'contributors'
    ] );

    grunt.registerTask( 'local', [
        'clean', 'jshint', 'copy', 'less:dev', 'nodeunit:models', 'nodeunit:views', 'nodeunit:base', 'concat',
        'handlebars', 'targethtml'
    ] );

};
