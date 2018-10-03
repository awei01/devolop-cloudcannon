const _paths = require('./_paths')

module.exports = {
  entry: {
    main: `${_paths.js.src}/main.js`
  },
  output: {
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.js'],
    modules: ['node_modules']
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
    ]
  }
}
