import enforceDependencies from "./enforceDependencies.js"
import noModuleInternalImport from "./noModuleInternalImport.js"
import noTableInBarrelExport from "./noTableInBarrelExport.js"

export default {
  meta: {
    name: "module-boundary",
  },
  rules: {
    "enforce-dependencies": enforceDependencies,
    "no-module-internal-import": noModuleInternalImport,
    "no-table-in-barrel-export": noTableInBarrelExport,
  },
}
