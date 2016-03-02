'use strict';

var webpack = require('webpack'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  ExtractTextPlugin = require("extract-text-webpack-plugin"),
  autoprefixer = require('autoprefixer'),
  path = require('path'),
  srcPath = path.join(__dirname, 'src');

var isProduction = (process.env.NODE_ENV == 'production');

module.exports = {
  target: 'web',
  cache: true,
  entry: {
    fa: 'font-awesome/css/font-awesome.css',
    index: path.join(srcPath, 'index.js'),
  },
  resolve: {
    root: srcPath,
    extensions: ['', '.js'],
    modulesDirectories: ['node_modules', 'src']
  },
  output: {
    path: path.join(__dirname, (isProduction ? '../nwaddrbook/web/static/' : 'tmp')),
    publicPath: '',
    filename: '[name].js',
    pathInfo: true
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel?cacheDirectory&optional[]=runtime'
      },
      {
        test: /\.json$/,
        loader: 'json'
      },
      { test: /\.less$/, loader: "style!css!less" },
      {
        test: /\.css$/,
        exclude: /src/,
        loader: 'style-loader!css-loader!postcss-loader'
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        loader: 'style!css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!postcss-loader'
      },
      { test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=.]+)?$/, loader: 'file-loader' },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      PRODUCTION: isProduction,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
    new HtmlWebpackPlugin({
      inject: false,
      template: 'src/index.html',
      title: 'Network Addressbook'
    }),
    new webpack.NoErrorsPlugin(),
    //new ExtractTextPlugin("styles.css")
  ],
  postcss: [ autoprefixer({ browsers: ['last 2 versions'] }) ],

  node: {
      net: "empty"  // for authobahn
  },

  debug: !isProduction,
  //devtool: 'eval-cheap-module-source-map',
  devtool: 'source-map',
  devServer: {
    contentBase: './tmp',
    historyApiFallback: true
  }
};
