import typescript from "rollup-plugin-typescript2"
import resolve from "rollup-plugin-node-resolve"
import commonjs from "rollup-plugin-commonjs"

export default function createRollupConfig({ inputFile, outputFile, outputFormat, bundleReact }) {
  return {
    input: inputFile || "./src/index.tsx",
    name: "ReactFinite",
    output: {
      file: outputFile,
      format: outputFormat,
    },
    external: bundleReact ? [] : [ "react", "react-dom" ],
    globals: bundleReact ? {} : { "react": "React", "react-dom": "ReactDOM" },
    plugins: [
      typescript(),
      resolve({ module: true, jsnext: true, main: true }),
      commonjs({ include: "node_modules/**" })
    ],
    watch: {
      include: "src/**"
    }
  }
}