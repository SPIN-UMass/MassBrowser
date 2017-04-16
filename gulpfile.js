var gulp = require('gulp');
var babel = require('gulp-babel');



gulp.task("client", function() {
  process.env.BABEL_ENV = 'core'
  return gulp.src("app/src/core/client/*.js").
    pipe(babel()).
    pipe(gulp.dest("app/build/client/"));
});

gulp.task("server", function() {
  process.env.BABEL_ENV = 'core'
  return gulp.src("app/src/core/server/*.js").
    pipe(babel()).
    pipe(gulp.dest("app/build/server/"));
});

gulp.task("crypto", function() {
  process.env.BABEL_ENV = 'core'
  return gulp.src("app/src/core/crypt/*.js").
    pipe(babel()).
    pipe(gulp.dest("app/build/crypt/"));
});

gulp.task("watch", ['client', 'server','crypto'], function() {
  gulp.watch('app/src/core/client/*', ['client']);
  gulp.watch('app/src/core/server/*', ['server']);
  gulp.watch('app/src/core/crypt/*', ['crypto']);
});
