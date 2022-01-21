import externals from 'rollup-plugin-node-externals';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import pkg from './package.json';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

export default {
  input: './src/index.ts',
  plugins: [
    json(), 

    externals({
      deps: true,
    }),

    // Allows node_modules resolution
    nodeResolve({ extensions }),

    // Allow bundling cjs modules. Rollup doesn't understand cjs
    commonjs(),

    // Compile TypeScript/JavaScript files
    babel({ 
      extensions,
      babelHelpers: 'runtime',
      include: ['src/**/*'],
    }),
  ],
  output: [{
    file: pkg.module,
    format: 'es',
    sourcemap: true,
  }, {
    file: pkg.main,
    format: 'cjs',
    sourcemap: true,
  }],
};
