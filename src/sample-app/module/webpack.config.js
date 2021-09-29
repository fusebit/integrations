const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
require('dotenv').config();

module.exports = {
  mode: 'development',
  entry: {
    index: ['regenerator-runtime/runtime.js', './libc/client/index.js'],
  },
  devServer: {
    static: './libc/client',
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Development',
      template: 'public/index.html',
      inject: false,
    }),
    new webpack.DefinePlugin({
      env: {
        SLACK_INTEGRATION: JSON.stringify(process.env.SLACK_INTEGRATION),
        HUBSPOT_INTEGRATION: JSON.stringify(process.env.HUBSPOT_INTEGRATION),
        FUSEBIT_URL: JSON.stringify(process.env.FUSEBIT_URL),
      },

      LAST_BUILD_TIME: JSON.stringify(new Date().toISOString()),
    }),
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '{{APP_URL}}/client',
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
    ],
  },
};
