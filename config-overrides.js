const {
    override,
    addBundleVisualizer,
    addWebpackAlias,
  } = require("customize-cra");
  const path = require("path");
  
  module.exports = override(  
    // add webpack bundle visualizer if BUNDLE_VISUALIZE flag is enabled
    process.env.BUNDLE_VISUALIZE == 1 && addBundleVisualizer(),
  
    // add an alias for "ag-grid-react" imports
    addWebpackAlias({
      ["fs"]: 'memfs'
    }),
  );
