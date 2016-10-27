var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();

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

// BrowserSync server

gulp.task('serve', ['styles'], function() {

    browserSync.init({
        server: "./dist"
    });

    gulp.watch("sass/*.scss", ['styles']);
    gulp.watch("dist/*.html").on('change', browserSync.reload);
});

//Default task

gulp.task('default', ['serve']);