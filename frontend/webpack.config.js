const path = require('path');
const webpack = require('webpack');

module.exports = (env) => {
    return {
        entry: './js/index.js',
        output: {
            filename: 'index.js',
            path: path.resolve(__dirname, 'dist'),
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.API_URL': JSON.stringify(env.API_URL || 'http://localhost:8080')
            }),
        ]
    }
};
