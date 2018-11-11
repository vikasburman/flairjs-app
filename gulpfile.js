const gulp = require('gulp');
const eslint = require('gulp-eslint');
const uglifyjs = require('uglify-js-harmony');
const uglify = require('gulp-uglify');
const minifier = require('gulp-uglify/minifier');
const jasmineNode = require('gulp-jasmine');
const pkg = require('./package.json');
const uglifyConfig = require('./build/.uglify.json');
const rename = require('gulp-rename');
const inject = require('gulp-inject-file');
const replace = require('gulp-string-replace');

// error handler
const errorHandler = (name) => {
    return function (err) {
        console.error('Error in task: ' + name);
        console.error('Error: ' + err.toString());
    };
};

// task: build
gulp.task('build', (done) => {
    gulp.src('./src/main.js')
        // assemble pieces
        .pipe(inject())
        .on('error', errorHandler('assemble'))

        // write assembled
        .pipe(rename((path) => {
            path.basename = 'oojs'
        }))
        .on('error', errorHandler('rename'))        
        .pipe(gulp.dest('./dist'))
        .on('error', errorHandler('write-assembled'))

        // check for issues
        .pipe(eslint('./build/.eslint.json'))
        // format errors, if any
        .pipe(eslint.format())
        // stop if errors
        .pipe(eslint.failAfterError())
        
        // minify
        .pipe(minifier(uglifyConfig.js, uglifyjs))
        .pipe(replace('oojs.js', 'oojs.min.js'))
        .on('error', errorHandler('minifier'))
        
        // write minified
        .pipe(rename((path) => {
            path.extname = '.min.js'; // from <name.whatever>.js to <name.whatever>.min.js
        }))
        .on('error', errorHandler('rename'))
        .pipe(gulp.dest('./dist'))
        .on('end', done)
        .on('error', errorHandler('write-minified'));
});

// task: test
gulp.task('test', (done) => {
    const jasminConfig = require('./build/.jasmine.json'),
        tests = ['./specs/*.spec.js'];
    gulp.src(tests)
        .pipe(jasmineNode(jasminConfig))
        .on('end', done)
        .on('error', errorHandler('jasmine'));
    // HACK: pipe() is not exising and hence end/error done() is not called via pipe, 
    // so calling done() manually below - this seems to be working so far
    // but need to be revisited for a better solution
    done(); 
});

// task: default
gulp.task('default', ['build', 'test'], () => {
});