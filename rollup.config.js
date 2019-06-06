const path = require('path');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const copy = require('rollup-plugin-copy');
const autoExternal = require('rollup-plugin-auto-external');
const pkg = require('./package.json');

const extensions = ['.js', '.ts'];

export default {
  input: 'src/index.ts',
  plugins: [
    resolve({ extensions, preferBuiltins: false }),
    commonjs(),
    babel({
      extensions,
      include: ['src/**/*'],
      exclude: 'node_modules/**',
    }),
    copy({
      targets: ['CHANGELOG.md', 'LICENSE.md', 'README.md', 'package.json'],
    }),
    autoExternal(),
  ],
  output: [
    {
      file: path.join('dist', pkg.main),
      format: 'cjs',
    },
    {
      file: path.join('dist', pkg.module),
      format: 'es',
    },
  ],
};
