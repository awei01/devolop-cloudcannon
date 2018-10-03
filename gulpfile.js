const gulp = require('gulp')
const sass = require('gulp-sass')
const browserSync = require('browser-sync')
const cp = require('child_process')
const _paths = require('./_paths.js')
const through = require('through2')

/*
|--------------------
| jekyll building
| -------------------
*/
function buildJekyll (done) {
  const jekyll = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll'
  cp.spawn(jekyll, ['build', '--config', _paths.config], { stdio: 'inherit' })
    .on('close', done)
}
function buildIncrementalJekyll (done) {
  const jekyll = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll'
  cp.spawn(jekyll, ['build', '--config', _paths.config, '--incremental'], { stdio: 'inherit' })
    .on('close', done)
}
function watchJekyllConfig (done) {
  // need to ignore .jekyll-metadata otherwise, infinite loop
  gulp.watch(_paths.config, { usePolling: true }, buildJekyll)
}
function watchJekyllSrc (done) {
  // need to ignore .jekyll-metadata otherwise, infinite loop
  gulp.watch([_paths.config, _paths.src], { usePolling: true, ignored: /\.jekyll-metadata/ }, buildIncrementalJekyll)
}

/*
|--------------------
| CSS compilation
| -------------------
*/
function buildCss () {
  // output it to jekyll folder and let jekyll take care of copying
  // need to use glob pattern to grab all files
  return gulp.src(`${_paths.scss.src}/**`)
    .pipe(sass().on('error', sass.logError))
    .pipe(through.obj(function (file, encoding, cb) {
      // need to prepend the file with frontmatter so jekyll doesn't convert to binary file
      if (!file.isNull()) {
        const result = '---\n---\n' + file.contents.toString()
        file.contents = Buffer.from(result)
      }
      cb(null, file)
    }))
    .pipe(gulp.dest(_paths.scss.dest))
}
function watchCss () {
  gulp.watch(_paths.scss.src, { usePolling: true }, buildCss)
}

/*
|--------------------
| JS compilation
| -------------------
*/
function buildJs () {
  // output it to jekyll folder and let jekyll take care of copying
  return gulp.src(_paths.js.src)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(_paths.js.dest))
}
function watchJs () {
  gulp.watch(_paths.js.src, { usePolling: true }, buildJs)
}

/*
|--------------------
| Browsersync
| ---------------------
*/
const server = browserSync.create()
function reloadServer (done) {
  server.reload()
  done()
}
function startServer (done) {
  server.init({
    server: {
      baseDir: _paths.dest
    }
  })
  done()
}
function watchServer () {
  // need usePolling for my VM environment
  gulp.watch(_paths.dest, { usePolling: true }, reloadServer)
}

/*
|--------------------
| Tasks definition
| ---------------------
*/
gulp.task('develop', gulp.series(
  gulp.parallel(buildCss, buildJs),
  buildJekyll,
  startServer,
  gulp.parallel(watchServer, watchJekyllConfig, watchJekyllSrc, watchCss)
))

gulp.task('test', watchJs)
