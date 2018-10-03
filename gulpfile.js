const gulp = require('gulp')
const sass = require('gulp-sass')
const browserSync = require('browser-sync')
const cp = require('child_process')
const jsYaml = require('js-yaml')
const jekyll = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll'
const fs = require('fs')
const path = require('path')

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

const _messages = {
  jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
}

gulp.task('build-jekyll', function (done) {
  // browserSync.notify(_messages.jekyllBuild)
  return cp.spawn(jekyll , ['build', '--config', _configPath, '--incremental'], { stdio: 'inherit' })
    .on('close', done)
})

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

gulp.task('develop', gulp.series(
  startServer,
  gulp.parallel(watchServer, watchCss)
))
