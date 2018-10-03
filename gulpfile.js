const gulp = require('gulp')
const sass = require('gulp-sass')
const browserSync = require('browser-sync')
const cp = require('child_process')
const jsYaml = require('js-yaml')
const fs = require('fs')
const path = require('path')

// configs and paths and such
const _configPath = path.resolve(__dirname, '_config.yml')
const _config = jsYaml.safeLoad(fs.readFileSync(_configPath))
const _paths = {
  src: path.resolve(__dirname, _config.source),
  dest: path.resolve(__dirname, _config.destination),
  scss: {
    src: path.resolve(__dirname, 'scss', '**'),
    dest: path.resolve(__dirname, _config.source, 'assets', 'css')
  }
}

// jekyll building
function buildJekyll (done) {
  const jekyll = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll'
  cp.spawn(jekyll, ['build', '--config', _configPath, '--incremental'], { stdio: 'inherit' })
    .on('close', done)
}
function watchJekyll (done) {
  // need to ignore .jekyll-metadata otherwise, infinite loop
  gulp.watch([_configPath, _paths.src], { usePolling: true, ignored: /\.jekyll-metadata/ }, buildJekyll)
    .on('all', console.log)
}

// CSS stuff
function buildCss () {
  // output it to jekyll folder and let jekyll take care of copying
  return gulp.src(_paths.scss.src)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(_paths.scss.dest))
}
function watchCss () {
  gulp.watch(_paths.scss.src, { usePolling: true }, buildCss)
}

gulp.task('build', gulp.series(buildCss), function (done) {
  console.log('building')
  done()
})

// browser stuff
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

// tasks
gulp.task('develop', gulp.series(
  startServer,
  gulp.parallel(watchServer, watchJekyll, watchCss)
))

gulp.task('test', watchJekyll)
