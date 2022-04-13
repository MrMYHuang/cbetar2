const customizeCra = require("customize-cra");
const path = require("path");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

module.exports = customizeCra.override(
  // add webpack bundle visualizer if BUNDLE_VISUALIZE flag is enabled
  process.env.BUNDLE_VISUALIZE == 1 && customizeCra.addBundleVisualizer(),

  // add an alias for "ag-grid-react" imports
  customizeCra.addWebpackAlias({
    ["fs"]: 'memfs'
  }),

  customizeCra.addWebpackPlugin(new NodePolyfillPlugin()),
  customizeCra.removeModuleScopePlugin(),

  customizeCra.adjustWorkbox(wb =>
    Object.assign(wb, {
      runtimeCaching: [
        {
          urlPattern: /.*\.woff2/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'webfonts'
          }
        }
      ]
    })
  )
);
