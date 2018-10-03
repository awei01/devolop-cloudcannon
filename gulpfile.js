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

const _messages = {
  jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
}

gulp.task('build-jekyll', function (done) {
  // browserSync.notify(_messages.jekyllBuild)
  return cp.spawn(jekyll , ['build', '--config', _configPath, '--incremental'], { stdio: 'inherit' })
    .on('close', done)
})

gulp.task('build-css', function () {
  const input = path.resolve(__dirname, 'scss', '**')
  // output it to jekyll folder and let jekyll take care of copying
  const output = path.resolve(__dirname, _config.source, 'assets', 'css')
  return gulp.src(input)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(output))
})

gulp.task('build', gulp.series('build-css'), function (done) {
  console.log('building')
  done()
})

gulp.task('browser-sync', gulp.series('build'), function() {
  browserSync({
    server: {
      baseDir: path.resolve(_config.destination)
    }
  })
})
