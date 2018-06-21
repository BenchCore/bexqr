const sass = require('@stencil/sass');

exports.config = {
  namespace: 'bex-qr',
  bundles: [
    { components: ['bex-qr'] }
  ],
  plugins: [
    sass()
  ]
};

exports.devServer = {
  root: 'www',
  watchGlob: '**/**'
}
