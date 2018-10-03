const jsYaml = require('js-yaml')
const fs = require('fs')
const path = require('path')

// convert the jekyll config into a readable paths object for our build system
const cwd = __dirname
const config = path.resolve(cwd, '_config.yml')
const _jekyllConf = jsYaml.safeLoad(fs.readFileSync(config))
const src = path.resolve(cwd, _jekyllConf.source)
const dest = path.resolve(__dirname, _jekyllConf.destination)

module.exports = {
  cwd,
  config,
  src,
  dest,
  scss: {
    src: path.resolve(cwd, 'scss'),
    dest: path.resolve(src, 'css') // output into jekyll source and let jekyll build
  },
  js: {
    src: path.resolve(cwd, 'js'),
    dest: path.resolve(src, 'js') // output into jekyll source and let jekyll build
  }
}
