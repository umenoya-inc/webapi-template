import noTestutilInProduction from "./noTestutilInProduction.js"

export default {
  meta: {
    name: "test-boundary",
  },
  rules: {
    "no-testutil-in-production": noTestutilInProduction,
  },
}
