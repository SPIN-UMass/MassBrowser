var gulp = require('gulp');
var babel = require('gulp-babel');



// gulp.task("client", function() {
//   process.env.BABEL_ENV = 'core'
//   return gulp.src("app/src/core/client/*.js").
//     pipe(babel()).
//     pipe(gulp.dest("app/build/client/"));
// });
//
// gulp.task("relay", function() {
//   process.env.BABEL_ENV = 'core'
//   return gulp.src("app/src/core/relay/*.js").
//     pipe(babel()).
//     pipe(gulp.dest("app/build/relay/"));
// });
//
// gulp.task("crypto", function() {
//   process.env.BABEL_ENV = 'core'
//   return gulp.src("app/src/core/crypt/*.js").
//     pipe(babel()).
//     pipe(gulp.dest("app/build/crypt/"));
// });
// gulp.task("API", function() {
//   process.env.BABEL_ENV = 'api'
//   return gulp.src("app/src/api/*.js").
//   pipe(babel()).
//   pipe(gulp.dest("app/build/api/"));
// });
gulp.task("compile", function() {
  process.env.BABEL_ENV = 'core'
  return gulp.src(["app/src/**/*.js", "!app/src/renderer/**/*.js", "!app/src/app/**/*.js"]).
  pipe(babel()).
  pipe(gulp.dest("app/build/"));
});


gulp.task("watch", ['compile'], function() {
  gulp.watch('app/src/**/*.js', ['compile']);

});
