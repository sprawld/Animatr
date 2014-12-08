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
		},
		
		usebanner: {
			taskName: {
				options: {
					position: 'top',
					banner: '/*! <%= pkg.name %> v<%= pkg.version %> - CSS3 animations with HTML5 data-attributes\n' +
							' * Copyright 2014 @sprawld http://sprawledoctopus.com/animatr/\n' +
							' * MIT License. Includes jQuery.Keyframes & PrefixFree\n' +
							' */',
					linebreak: true
				},
				files: {
					src: [ 'dist/animatr.min.js' ]
				}
			}
		}
		
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-banner');
	
    grunt.registerTask('default', ['concat','uglify','usebanner']);
};
