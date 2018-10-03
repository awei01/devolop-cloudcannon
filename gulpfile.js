const gulp = require('gulp')
const sass = require('gulp-sass')
const plumber = require('gulp-plumber')
const browserSync = require('browser-sync')
const cp = require('child_process')
const _paths = require('./_paths.js')
const through = require('through2')
const webpack = require('webpack-stream')
const webpackConfig = require('./webpack.config.js')
const del = require('del')

/*
|--------------------
| jekyll building
| -------------------
*/
function cleanDest () {
  return del(_paths.dest)
}

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
    .pipe(plumber())
    .pipe(sass())
    .pipe(_prependFrontmatter())
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
    .pipe(plumber({
      errorHandler: _handleError
    }))
    .pipe(webpack(webpackConfig))
    .pipe(_prependFrontmatter())
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
function _handleError (error) {
  server.notify(error.message, 10000)
}

/*
|--------------------
| Tasks definition
| ---------------------
*/
gulp.task('build', gulp.series(
  // clean the folder
  cleanDest,
  // build css and js simultaneously
  gulp.parallel(buildCss, buildJs),
  // then build jekyll
  buildJekyll
))

gulp.task('develop', gulp.series(
  'build',
  startServer,
  gulp.parallel(watchServer, watchJekyllConfig, watchJekyllSrc, watchCss, watchJs)
))


// utilities
function _prependFrontmatter () {
  return through.obj(function (file, encoding, cb) {
    // need to prepend the file with frontmatter so jekyll doesn't convert to binary file
    if (!file.isNull()) {
      const result = '---\n---\n' + file.contents.toString()
      file.contents = Buffer.from(result)
    }
    cb(null, file)
  })
}
