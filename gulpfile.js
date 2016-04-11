var gulp = require('gulp');
var del = require('del');
var concat = require('gulp-concat');
var templateCache = require('gulp-angular-templatecache');
var addStream = require('add-stream');
var karma = require('karma').Server;

var paths = {
    scripts: [
        'bower_components/angular/angular.js',
        'src/**/*.js'
    ],

    testScripts: [
        'bower_components/angular-mocks/angular-mocks.js',
        'test/**/*.spec.js'
    ],

    styles: [
        'src/**/*.css'
    ],

    html: [
        'src/*.html'
    ],

    templates: [
        'src/**/*tmpl.html'
    ]
};

function cacheTemplates () {
    return gulp.src(paths.templates)
        .pipe(templateCache({standalone:true}));
}

function concatScripts (isTest) {
    var scripts = paths.scripts.concat(isTest ? paths.testScripts : []);
    return gulp.src(scripts)
        .pipe(addStream.obj(cacheTemplates()))
        .pipe(concat('app.js'))
        .pipe(gulp.dest('build'));
}

gulp.task('clean', function () {
    return del(['build/**']);
});

gulp.task('build-scripts', function () {
    return concatScripts(false);
});

gulp.task('build-test-scripts', function () {
    return concatScripts(true);
});

gulp.task('copy-styles', function () {
    return gulp.src(paths.styles)
        .pipe(concat('app.css'))
        .pipe(gulp.dest('build'));
});

gulp.task('copy-html', function () {
    return gulp.src(paths.html)
        .pipe(gulp.dest('build'));
});

gulp.task('build', ['build-scripts','copy-html', 'copy-styles', 'clean']);

gulp.task('test', ['build-test-scripts', 'copy-html', 'copy-styles', 'clean'], function (done) {
    karma.start({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, done);
});

gulp.task('watch', function() {
    gulp.watch(paths.scripts, ['build-scripts']);
    gulp.watch(paths.templates, ['build-scripts']);
    gulp.watch(paths.styles, ['copy-styles']);
    gulp.watch(paths.html, ['copy-html']);
});

gulp.task('default', ['watch', 'build']);
