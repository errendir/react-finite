import createRollupConfig from './base.rollup.config'

export default createRollupConfig({ 
  outputFile: "dist/react-finite-umd.js",
  outputFormat: "umd",
})