module.exports = {
  mount: { './svelte': '/' },
  plugins: [
    '@snowpack/plugin-typescript',
    '@snowpack/plugin-svelte',
    ['@snowpack/plugin-sass', { sourceMap: false, style: 'compressed', embedSourceMap: false }],
    //'@snowpack/plugin-optimize'
  ],
  optimize: { bundle: true, splitting: false, minify: true, sourcemap: false },
  devOptions: { hmr: true },
  buildOptions: { out: './frontend', sourcemap: false },
  exclude: ['**/tsconfig.json'],
};
