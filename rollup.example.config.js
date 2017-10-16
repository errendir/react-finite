import createRollupConfig from './base.rollup.config'

export default createRollupConfig({ 
  inputFile: "./src/example.tsx",
  outputFile: "dist/example-umd.js",
  outputFormat: "iife",
  bundleReact: false
})