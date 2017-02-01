var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var eslint = require('gulp-eslint');

gulp.task('styles', function() {
	gulp.src('sass/**/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer({
			browsers: ['>1%', 'last 2 versions', 'IE 8'],
			cascade: false
		}))
		.pipe(gulp.dest('./dist/css'))
		.pipe(browserSync.stream());;
});

gulp.task('lint', () => {
	return gulp.src(['dist/js/**/*.js','!dist/js/vendor/**'])
		.pipe(eslint({
			rules: {
				"strict": 2,
				"no-cond-assign": 2,
				"no-constant-condition": 2,
				"no-control-regex": 2,
				"no-dupe-args": 2,
				"no-dupe-keys": 2,
				"no-empty": 2,
				"no-extra-semi": 2,
				"no-func-assign": 2,
				"no-inner-declarations": 2,
				"no-invalid-regexp": 2,
				"no-obj-calls": 2,
				"no-sparse-arrays": 2,
				"no-unexpected-multiline": 2,
				"no-unreachable": 2,
				"no-unsafe-finally": 2,
				"use-isnan": 2,
				"valid-typeof": 2,
				"no-redeclare": 2,
				"no-self-assign": 2,
				"no-fallthrough": 1,
				"no-irregular-whitespace": 1,
				"indent": [1, 'tab'],
				"eqeqeq": 1,
				"no-undef": 1,
				"no-unused-vars": 1,
				"no-implicit-globals": 1
			},
			globals: [],
			envs: [
				"browser",
				"jquery"
			]
		}))
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});


// Compress images

var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');

gulp.task('img', () => {
	return gulp.src('images/*.+(png|jpg|jpeg|gif|svg)')
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [
				{removeViewBox: false},
				{cleanupIDs: false}
			],
			use: [pngquant()]
		}))
		.pipe(gulp.dest('./dist'));
});

// Jasmine task

var jasmineBrowser = require('gulp-jasmine-browser');

gulp.task('jas', function() {
	return gulp.src(['src/**/*.js', 'tests/**/*_spec.js'])
		//.pipe(watch('tests/**/*_spec.js'))
		.pipe(jasmineBrowser.specRunner())
		.pipe(jasmineBrowser.server({port: 8888}));
});

// BrowserSync server

gulp.task('serve', ['styles', 'lint'], function() {

	browserSync.init({
		server: "./dist"
	});

	gulp.watch("sass/*.scss", ['styles']);
	gulp.watch("dist/js/**/*.js", ['lint']);
	gulp.watch("dist/*.html").on('change', browserSync.reload);
});

//Default task

gulp.task('default', ['serve']);
