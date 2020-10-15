const customizeCra = require("customize-cra");
const path = require("path");

module.exports = customizeCra.override(
  // add webpack bundle visualizer if BUNDLE_VISUALIZE flag is enabled
  process.env.BUNDLE_VISUALIZE == 1 && customizeCra.addBundleVisualizer(),

  // add an alias for "ag-grid-react" imports
  customizeCra.addWebpackAlias({
    ["fs"]: 'memfs'
  }),

  customizeCra.adjustWorkbox(wb =>
    Object.assign(wb, {
      runtimeCaching: [
        {
          urlPattern: /.*\.woff/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'webfonts'
          }
        }
      ]
    })
  )
);
