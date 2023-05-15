import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: './app.js', // Entry point of your Electron app
  output: {
    file: './bundle.js', // Output file for the bundled code
    format: 'cjs',
  },
  plugins: [
    resolve({
      browser: true,
    }),
    commonjs(),
  ],
  external: ['firebase'], // Exclude Firebase from the bundle
};
