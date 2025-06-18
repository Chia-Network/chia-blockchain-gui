import path from 'path';

const CONTEXT = __dirname;

export default {
  entry: {
    main: './src/electron/main.tsx',
    preload: './src/electron/preload.ts',
    preloadDialog: './src/electron/preloadDialog.ts',
  },
  devtool: 'source-map',
  target: 'electron-main',
  stats: 'errors-only',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    modules: [path.resolve(CONTEXT, 'node_modules'), path.resolve(CONTEXT, '../../node_modules'), 'node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.svg$/i,
        type: 'asset/inline',
      },
      {
        test: /\.(gif|png|jpe?g|ico|icns)$/i,
        type: 'asset/resource',
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, './build/electron'),
    filename: '[name].js',
    hashFunction: 'sha256',
  },
  externals: {
    fsevents: "require('fsevents')",
  },
};
