import noWriteInQuery from "./noWriteInQuery.js"

export default {
  meta: {
    name: "db-safety",
  },
  rules: {
    "no-write-in-query": noWriteInQuery,
  },
}
