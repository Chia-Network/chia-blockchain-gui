import externals from 'rollup-plugin-node-externals';
import babel from '@rollup/plugin-babel';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import svgr from '@svgr/rollup';
import pkg from './package.json';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

export default {
  input: './src/index.ts',
  plugins: [
    alias({
      entries: [
        {
          find: '@mui/styled-engine',
          replacement: '@mui/styled-engine-sc',
        },
      ],
    }),
    externals({
      deps: true,
    }),

    svgr({ typescript: true }),

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
  output: [
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
    },
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
    },
  ],
};
