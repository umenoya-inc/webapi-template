import noServiceInDbEffect from "./noServiceInDbEffect.js"
import noWriteInQuery from "./noWriteInQuery.js"

export default {
  meta: {
    name: "db-safety",
  },
  rules: {
    "no-write-in-query": noWriteInQuery,
    "no-service-in-db-effect": noServiceInDbEffect,
  },
}
