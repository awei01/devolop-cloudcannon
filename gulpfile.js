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
  const args = ['build', '--config', _paths.config]
  if (process.env.NODE_ENV === 'development') {
    args.push('--limit_posts')
    args.push(5)
  }
  cp.spawn(jekyll, args, { stdio: 'inherit' })
    .on('close', done)
}
function buildIncrementalJekyll (done) {
  const jekyll = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll'
  const args = ['build', '--config', _paths.config, '--incremental']
  if (process.env.NODE_ENV === 'development') {
    args.push('--limit_posts')
    args.push(5)
  }
  cp.spawn(jekyll, args, { stdio: 'inherit' })
    .on('close', done)
}
function watchJekyllConfig (done) {
  gulp.watch(_paths.config, { usePolling: true }, buildJekyll)
}
function watchJekyllSrc (done) {
  // need to ignore .jekyll-metadata otherwise, infinite loop
  // watch the src except for the js and css folders (we will push js and css files directly to the dist folder)
  gulp.watch([`${_paths.src}/**`], { usePolling: true, ignored: /(\.jekyll-metadata|js|css)/, queue: false, delay: 500 }, buildIncrementalJekyll)
}

/*
|--------------------
| CSS compilation
| -------------------
*/
function buildCss () {
  // output it to jekyll folder and let jekyll take care of copying
  // point gulp to our entry scss file
  return gulp.src(`${_paths.scss.src}/main.scss`)
    .pipe(_makePlumber())
    .pipe(sass({}))
    .pipe(gulp.dest(`${_paths.dest}/css`)) // copy directly to destination folder for faster development cycle
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
    .pipe(_makePlumber())
    .pipe(webpack(webpackConfig))
    .pipe(gulp.dest(`${_paths.dest}/js`)) // copy directly to destination folder for faster development cycle
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
let server
function reloadServer (done) {
  console.log('Sending refresh to browser')
  server && server.reload()
  done()
}
function startServer (done) {
  server = browserSync.create()
  server.init({
    server: {
      baseDir: _paths.dest,
      serveStaticOptions: {
        extensions: ['html']
      }
    },
    ghostMode: false
  })
  done()
}
function watchServer () {
  // need usePolling for my VM environment
  gulp.watch(_paths.dest, { usePolling: true, debounceDelay: 200 }, reloadServer)
}
function _handleError (error) {
  if (!server) { throw error }
  server.notify(error.message, 10000)
}

/*
|--------------------
| Tasks definition
| ---------------------
*/
gulp.task('prepare-build', gulp.series(
  // clean the folder
  cleanDest,
  // build css and js simultaneously
  gulp.parallel(buildCss, buildJs)
))

// do a full build
gulp.task('build', gulp.series('prepare-build', buildJekyll))

// do an incremental build and start watching the server
gulp.task('develop', gulp.series(
  'prepare-build',
  buildIncrementalJekyll,
  startServer,
  gulp.parallel(watchServer, watchJekyllConfig, watchJekyllSrc, watchCss, watchJs)
))

gulp.task('build-css', buildCss)
gulp.task('build-js', buildJs)

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

function _makePlumber () {
  return plumber({ errorHandler: _handleError })
}
