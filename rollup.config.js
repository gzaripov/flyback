const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
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
  ],
  external: ['fs', 'http', 'https', 'path', 'url', 'stream', 'zlib'],
  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.module,
      format: 'es',
    },
  ],
};
