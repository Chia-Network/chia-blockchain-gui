import webpack from 'webpack';
import path from 'path';

export default {
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  entry: './src/electron/test.tsx',
  target: 'electron-main',
  stats: 'errors-only',
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, './build/electron'),
    filename: 'test.js',
    hashFunction: 'sha256',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.FLUENTFFMPEG_COV': false,
    }),
  ],
};
