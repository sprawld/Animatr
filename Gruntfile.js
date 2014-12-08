module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

		concat: {   
			dist: {
				src: [
					'src/js/lib/prefixfree.js',
					'src/js/lib/jquery.keyframes.js',
					'src/js/animatr.js'
				],
				dest: 'dist/animatr.js',
			}
		},
		uglify: {
			build: {
				src: 'dist/animatr.js',
				dest: 'dist/animatr.min.js'
			}
		}
		
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['concat','uglify']);
};
