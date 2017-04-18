var gulp = require('gulp');
var babel = require('gulp-babel');



gulp.task("client", function() {
  process.env.BABEL_ENV = 'core'
  return gulp.src("app/src/core/client/*.js").
    pipe(babel()).
    pipe(gulp.dest("app/build/client/"));
});

gulp.task("relay", function() {
  process.env.BABEL_ENV = 'core'
  return gulp.src("app/src/core/relay/*.js").
    pipe(babel()).
    pipe(gulp.dest("app/build/relay/"));
});

gulp.task("crypto", function() {
  process.env.BABEL_ENV = 'core'
  return gulp.src("app/src/core/crypt/*.js").
    pipe(babel()).
    pipe(gulp.dest("app/build/crypt/"));
});

gulp.task("watch", ['client', 'relay','crypto'], function() {
  gulp.watch('app/src/core/client/*', ['client']);
  gulp.watch('app/src/core/relay/*', ['relay']);
  gulp.watch('app/src/core/crypt/*', ['crypto']);
});
