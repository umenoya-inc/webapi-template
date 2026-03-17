import noModuleInternalImport from "./noModuleInternalImport.js";

export default {
  meta: {
    name: "module-boundary",
  },
  rules: {
    "no-module-internal-import": noModuleInternalImport,
  },
};
