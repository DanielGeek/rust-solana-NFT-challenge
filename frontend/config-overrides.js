const webpack = require('webpack');

module.exports = function override(config, env) {
  config.resolve.fallback = config.resolve.fallback || {};
  Object.assign(config.resolve.fallback, {
    assert: require.resolve('assert/'),
    fs: false,
    crypto: require.resolve("crypto-browserify"),
    process: require.resolve('process/browser'),
    crypto: require.resolve("crypto-browserify")
  });
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  );
  return config;
};
