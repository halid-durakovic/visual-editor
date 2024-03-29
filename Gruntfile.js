/*!
 * Grunt file
 *
 * @package VisualEditor
 */

/*jshint node:true */
module.exports = function ( grunt ) {
	grunt.loadNpmTasks( 'grunt-banana-checker' );
	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-csslint' );
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-qunit' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-cssjanus' );
	grunt.loadNpmTasks( 'grunt-jscs' );
	grunt.loadTasks( 'build/tasks' );

	var modules = grunt.file.readJSON( 'build/modules.json' ),
		moduleUtils = require( './build/moduleUtils' ),
		introBuildFiles = moduleUtils.makeBuildList( modules, [ 'visualEditor.buildfiles.intro' ] ),
		coreBuildFiles = moduleUtils.makeBuildList( modules, [ 'visualEditor.build' ] );

	function demoMenu( callback ) {
		var pages = {},
			files = grunt.file.expand( 'demos/ve/pages/*.html' );
		files.forEach( function ( file ) {
			var matches = file.match( /^.*(pages\/(.+).html)$/ ),
				path = matches[1],
				name = matches[2];

			pages[name] = path;
		} );
		callback( JSON.stringify( pages, null, '\t' ).split( '\n' ).join( '\n\t\t' ) );
	}

	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),
		clean: {
			dist: [ 'dist/*/', 'dist/*.*' ]
		},
		concat: {
			buildJs: {
				dest: 'dist/visualEditor.js',
				src: introBuildFiles.scripts
					.concat( coreBuildFiles.scripts )
			},
			buildCss: {
				dest: 'dist/visualEditor.css',
				src: introBuildFiles.styles
					.concat( coreBuildFiles.styles )
			}
		},
		cssjanus: {
			dist: {
				src: 'dist/visualEditor.css',
				dest: 'dist/visualEditor.rtl.css'
			}
		},
		copy: {
			images: {
				src: 'modules/ve/ui/styles/images/**/*.*',
				strip: 'modules/ve/ui/styles/',
				dest: 'dist/'
			},
			i18n: {
				src: 'modules/ve/i18n/*.json',
				strip: 'modules/ve/',
				dest: 'dist/'
			}
		},
		buildloader: {
			iframe: {
				targetFile: '.docs/eg-iframe.html',
				template: '.docs/eg-iframe.html.template',
				modules: modules,
				load: [ 'visualEditor.desktop.standalone' ],
				pathPrefix: '../',
				indent: '\t\t'
			},
			desktopDemo: {
				targetFile: 'demos/ve/desktop.html',
				template: 'demos/ve/demo.html.template',
				modules: modules,
				load: [ 'visualEditor.desktop.standalone.demo' ],
				env: {
					debug: true
				},
				pathPrefix: '../../',
				indent: '\t\t',
				placeholders: { menu: demoMenu }
			},
			desktopDemoDist: {
				targetFile: 'demos/ve/desktop-dist.html',
				template: 'demos/ve/demo.html.template',
				modules: modules,
				load: [ 'visualEditor.desktop.standalone.demo.dist' ],
				pathPrefix: '../../',
				indent: '\t\t',
				placeholders: { menu: demoMenu }
			},
			mobileDemo: {
				targetFile: 'demos/ve/mobile.html',
				template: 'demos/ve/demo.html.template',
				modules: modules,
				load: [ 'visualEditor.mobile.standalone.demo' ],
				env: {
					debug: true
				},
				pathPrefix: '../../',
				indent: '\t\t',
				placeholders: { menu: demoMenu }
			},
			mobileDemoDist: {
				targetFile: 'demos/ve/mobile-dist.html',
				template: 'demos/ve/demo.html.template',
				modules: modules,
				load: [ 'visualEditor.mobile.standalone.demo.dist' ],
				pathPrefix: '../../',
				indent: '\t\t',
				placeholders: { menu: demoMenu }
			},
			test: {
				targetFile: 'modules/ve/tests/index.html',
				template: 'modules/ve/tests/index.html.template',
				modules: modules,
				env: {
					test: true
				},
				load: [ 'visualEditor.test' ],
				pathPrefix: '../../../',
				indent: '\t\t'
			}
		},
		jshint: {
			options: {
				jshintrc: true
			},
			all: [
				'*.js',
				'{.docs,build,demos,modules}/**/*.js'
			]
		},
		jscs: {
			src: [
				'<%= jshint.all %>',
				'!modules/ve/tests/ce/imetests/*.js'
			]
		},
		csslint: {
			options: {
				csslintrc: '.csslintrc'
			},
			all: '{.docs,build,demos,modules}/**/*.css'
		},
		banana: {
			all: 'modules/ve/i18n/'
		},
		qunit: {
			unicodejs: 'modules/unicodejs/index.html',
			ve: 'modules/ve/tests/index.html'
		},
		watch: {
			files: [
				'.{csslintrc,jscsrc,jshintignore,jshintrc}',
				'<%= jshint.all %>',
				'<%= csslint.all %>',
				'<%= qunit.ve %>',
				'<%= qunit.unicodejs %>'
			],
			tasks: 'test'
		}
	} );

	grunt.registerTask( 'lint', [ 'jshint', 'jscs', 'csslint', 'banana' ] );
	grunt.registerTask( 'unit', 'qunit' );
	grunt.registerTask( 'build', [ 'clean', 'git-build', 'concat', 'cssjanus', 'copy', 'buildloader' ] );
	grunt.registerTask( 'test', [ 'build', 'lint', 'unit' ] );
	grunt.registerTask( 'default', 'test' );
};
