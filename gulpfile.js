var path = require('path');
var gulp = require('gulp');
// for errors
var plumber = require('gulp-plumber');
var notifier = require('node-notifier');
// server
var bs = require('browser-sync').create();
// images
var pngquant = require('imagemin-pngquant');
// templates
var jade = require('gulp-jade');
// styles, scripts
var sourcemaps = require('gulp-sourcemaps');
// styles
var less = require('gulp-less');
var AutoPrefix = require('less-plugin-autoprefix');
var autoprefix = new AutoPrefix({browsers: ['last 2 versions']});
var CleanCSS = require('less-plugin-clean-css');
var cleancss = new CleanCSS({advanced: true});
// scripts
var through = require('through2');
var browserify = require('browserify');
var watchify = require('watchify');
var babel = require('babelify');
var uglify = require('gulp-uglify');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');

var production = process.env.NODE_ENV == 'production';

// constants
var PNG_OPTS = {quality: '85-90', speed: 1};


/*
	error handling
*/
var onError = function(label) {
	label = label || 'Gulp';
	return plumber(function(err) {
		notifier.notify({message: `${label}: ${err.message}`});
		console.error(label, err.message, err.stack);
		this.emit('end');
	});
};


/*
	server with live reload
	the second option is dependencies that need to finish first
*/
gulp.task('serve', ['copy', 'templates', 'styles', 'scripts'], () => {
	bs.init({server: 'dist'});
	gulp.watch('./source/{fonts,images}/**/*', {debounceLeading: false}, copy);
	gulp.watch('./source/views/**/*.jade', ['reload-templates']);
	gulp.watch('./source/styles/**/*.less', ['styles']);
});


/*
	copy fonts and images to `dist`, and squash the PNG files
*/
function copy(file) {
	var folder = path.dirname(file.path).split('source')[1];
	return gulp.src(file.path, {cwd: 'source' + folder})
		.pipe(pngquant(PNG_OPTS)())
		.pipe(gulp.dest('source' + folder))
		.pipe(gulp.dest('dist' + folder))
		.pipe(bs.stream());
}

gulp.task('copy', function() {
	return gulp.src('./source/{fonts,images}/**/*')
		.pipe(gulp.dest('./dist'));
});



/*
	crate html from `.jade` templates
*/
gulp.task('templates', function() {
	// return the stream so Gulp knows we're finished
	return gulp.src('./source/views/*.jade')
		.pipe(onError('templates'))
		.pipe(jade())
		.pipe(gulp.dest('./dist'));
});

// wait for *all* templates to finish before reloading
gulp.task('reload-templates', ['templates'], () => bs.reload());



/*
	compile LESS files into one CSS
*/
gulp.task('styles', function() {
	var plugins = [autoprefix, production && cleancss].filter(x=>x);

	gulp.src('./source/styles/main.less')
		.pipe(onError('styles'))
		.pipe(sourcemaps.init())
		.pipe(less({plugins}))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('./dist/styles'))
		.pipe(bs.stream());
});



/*
	start from all `*main.js` entry points, require dependencies,
	transform from ESNext using Babel, and optionally uglify
*/
function watchified(file, enc, next) {
	var done = 0;
	var bundler = browserify(file.path, {debug: true}).transform(babel);
	if (!production) bundler = watchify(bundler);

	function makeBundle() {
		var bundle = bundler.bundle()
			.on('end', ()=>!done++ && next())
			.pipe(source(path.basename(file.path)));

		if (production) {
			bundle = bundle.pipe(buffer())
				.pipe(sourcemaps.init({loadMaps: true}))
				.pipe(uglify())
				.pipe(sourcemaps.write('.', {sourceRoot: '/'}));
		}

		bundle.pipe(gulp.dest('./dist/scripts'))
			.pipe(bs.stream());
	}

	bundler.on('update', makeBundle);
	makeBundle();
	return bundler;
}

gulp.task('scripts', function() {
	return gulp.src('./source/scripts/*main.js')
		.pipe(onError('scripts'))
		.pipe(through.obj(watchified));
});


gulp.task('build', ['copy', 'templates', 'styles', 'scripts']);
gulp.task('watch', ['copy', 'templates', 'styles', 'scripts', 'serve']);
gulp.task('default', ['watch']);
