import oneExportPerFile from "./oneExportPerFile.js"

export default {
  meta: {
    name: "single-export",
  },
  rules: {
    "one-export-per-file": oneExportPerFile,
  },
}
