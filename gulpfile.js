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
// constants
var PNG_OPTS = {quality: '85-90', speed: 1};



// error handling
var onError = function(label) {
	label = label || 'Gulp';
	return plumber(function(err) {
		notifier.notify({message: `${label}: ${err.message}`});
		console.error(label, err.message, err.stack);
		this.emit('end');
	});
};


// server with live reload
// the second option is dependencies that need to finish first
gulp.task('serve', ['copy', 'templates', 'styles'], ()=>{
	bs.init({server: 'dist'});
	gulp.watch('source/views/**/*.jade', ['reload-templates']);
	// give file time to copy with `debounceLeading` option
	gulp.watch('source/{fonts,images}/**/*', {debounceLeading: false}, copy);
});


function copy(file) {
	var folder = path.dirname(file.path).split('source')[1];
	return gulp.src(file.path, {cwd: 'source' + folder})
		.pipe(pngquant(PNG_OPTS)())
		.pipe(gulp.dest('source' + folder))
		.pipe(gulp.dest('dist' + folder))
		.pipe(bs.stream());
}

gulp.task('copy', function() {
	return gulp.src('source/{fonts,images}/**/*')
		.pipe(gulp.dest('dist'));
});


gulp.task('templates', function() {
	// return the stream so Gulp knows we're finished
	return gulp.src('source/views/*.jade')
		.pipe(onError('templates'))
		.pipe(jade())
		.pipe(gulp.dest('dist'));
});

// wait for *all* templates to finish before reloading
gulp.task('reload-templates', ['templates'], ()=>bs.reload());


gulp.task('watch', ['copy', 'templates', 'styles', 'serve']);
gulp.task('default', ['watch']);

