import noLeafInApiEffect from "./noLeafInApiEffect.js"
import noServiceInDbEffect from "./noServiceInDbEffect.js"

export default {
  meta: {
    name: "effect-structure",
  },
  rules: {
    "no-leaf-in-api-effect": noLeafInApiEffect,
    "no-service-in-db-effect": noServiceInDbEffect,
  },
}
