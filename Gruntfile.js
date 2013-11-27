/*global module:false*/
module.exports = function(grunt) {

  grunt.initConfig({
    qunit: {
      index: ['tests/tests.html']
    },
    watch: {
      files: ['dependencies/**', 'tests/**'],
      tasks: 'qunit'
    }
  })

  grunt.loadNpmTasks('grunt-contrib-qunit')

  grunt.registerTask('default', 'qunit')
}
