const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const { IgnorePlugin } = require("webpack");
const path = require("path");

// The name of the lambdas and their respective file locations
const entries = {
  BasicAuthLambdaAuthorizer: "./src/infra/lambdas/BasicAuthLambdaAuthorizer.ts",
  DeleteOldEventsLambda: "./src/infra/lambdas/DeleteOldEventsLambda.ts",
  SaveRetrievalEventLambda: "./src/infra/lambdas/SaveRetrievalEventLambda.ts"
};

module.exports = () => {
  return {
    mode: "production",
    entry: entries,
    // Output each lambda as it's own directory with it's own index.js file, also called a bundle, in the dist/lambdas directory
    output: {
      filename: "./[name]/index.js",
      path: path.resolve(__dirname, "dist/lambdas")
    },
    target: "node",
    plugins: [
      // Outputs a stats page that shows bundle sizes and dependencies at dist/bundle-stats.html. View it in a browser.
      new BundleAnalyzerPlugin({
        analyzerMode: "static",
        reportFilename: "../bunde-stats.html",
        openAnalyzer: false
      }),
      // Ignores the pg-native package that comes with the postgres
      new IgnorePlugin({ resourceRegExp: /^pg-native$/ }),
      new IgnorePlugin({ resourceRegExp: /^aws-crt$/ })
    ],
    optimization: {
      minimize: false,
      usedExports: true
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "ts-loader",
              options: {
                // Specifically use the below config file when compile typescript
                configFile: "tsconfig-lambdas.json"
              }
            }
          ]
        }
      ]
    },
    resolve: {
      extensions: [".ts", ".js"]
    },
    externals: {
      // We don"t want to include aws-sdk in our bundles since AWS will include it for us
      "aws-sdk": "commonjs aws-sdk"
    }
  };
}