/*global module:false*/
module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        jshint: {
            options: {
                eqeqeq: true,
                immed: true,
                latedef: true,
                noarg: true,
                sub: true,
                undef: true,
                eqnull: true,
                browser: true,
                devel: true,
                jquery: true
            },
            globals: {
                _: true,
                Backbone: true
            },
            tests: {
                globals: {
                    _: true,
                    Backbone: true,
                    module: true,
                    test: true,
                    deepEqual: true,
                    equal: true,
                    ok: true
                }
            }
        },
        lint: {
            src: '*.js',
            grunt: 'grunt.js',
            tests: 'tests/tests.js'
        },
        qunit: {
            index: ['tests/tests.html']
        },
        watch: {
            files: ['<config:lint.files>', 'dependencies/**', 'tests/**'],
            tasks: 'lint qunit'
        }
    });

    // Default task.
    grunt.registerTask('default', 'lint qunit');
};
