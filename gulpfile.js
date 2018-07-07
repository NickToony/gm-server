var gulp = require("gulp");
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");
var watch = require('gulp-watch');
var nodemon = require('gulp-nodemon');

gulp.task("build", function () {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("./dist"));
});

gulp.task('watch', function () {
    return watch('src/**/*.ts', { ignoreInitial: false }, function() {
        gulp.start('build');
    })
});

gulp.task('start', ['build'], function () {
    return nodemon({
        script: 'dist/index.js',
        watch: 'src',
        ext: 'ts',
        tasks: ['build']
    })
  })