const webpack = require('webpack');

module.exports = {
    webpack: {
        configure: (webpackConfig, { env, paths }) => {
            webpackConfig.resolve.fallback = {
                ...webpackConfig.resolve.fallback,
                // Add your polyfills here
                stream: require.resolve('stream-browserify'),
                path: require.resolve('path-browserify'),
            };
            webpackConfig.plugins.push(
                new webpack.ProvidePlugin({
                    process: 'process/browser',
                }),
            );
            return webpackConfig;
        },
    },
};
