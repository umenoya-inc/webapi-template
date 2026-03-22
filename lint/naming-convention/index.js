import noPluralTableName from "./noPluralTableName.js"
import noTableInBarrelExport from "./noTableInBarrelExport.js"

export default {
  meta: {
    name: "naming-convention",
  },
  rules: {
    "no-plural-table-name": noPluralTableName,
    "no-table-in-barrel-export": noTableInBarrelExport,
  },
}
