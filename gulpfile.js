var gulp = require('gulp');
// for errors
var plumber = require('gulp-plumber');
var notifier = require('node-notifier');
// server
var bs = require('browser-sync').create();
// templates
var jade = require('gulp-jade');



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
gulp.task('serve', ['templates'], ()=>{
	bs.init({server: 'dist'});
	gulp.watch('source/views/**/*.jade', ['reload-templates']);
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


gulp.task('watch', ['templates', 'serve']);
gulp.task('default', ['watch']);

