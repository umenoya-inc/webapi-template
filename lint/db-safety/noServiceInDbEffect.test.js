import { RuleTester } from "oxlint/plugins-dev"
import { describe, it } from "vite-plus/test"
import noServiceInDbEffect from "./noServiceInDbEffect.js"

RuleTester.describe = describe
RuleTester.it = it

const options = [{ basePath: "src" }]
const tester = new RuleTester()

tester.run("no-service-in-db-effect", noServiceInDbEffect, {
  valid: [
    // db/ 内の leaf effect（context のみ）
    {
      code: `
        const createUser = defineEffect(
          { context: requiredContext() },
          (context) => defineContract({})
        )
      `,
      filename: "/project/src/db/user/createUser.ts",
      options,
    },
    // api/ 内の composite effect（service あり）— 対象外
    {
      code: `
        const postUser = defineEffect(
          { service: { createUser } },
          (service) => (context) => defineRouteContract({})
        )
      `,
      filename: "/project/src/api/user/postUser.ts",
      options,
    },
    // テストファイルは対象外
    {
      code: `
        const mock = defineEffect(
          { service: { createUser } },
          (service) => (context) => ({})
        )
      `,
      filename: "/project/src/db/user/createUser.test.ts",
      options,
    },
    // db/ 外のファイル
    {
      code: `
        const effect = defineEffect(
          { service: { something } },
          (service) => (context) => ({})
        )
      `,
      filename: "/project/src/domain/user/createUser.ts",
      options,
    },
  ],
  invalid: [
    // db/ 内で service を持つ defineEffect
    {
      code: `
        const compositeEffect = defineEffect(
          { service: { createUser } },
          (service) => (context) => defineContract({})
        )
      `,
      filename: "/project/src/db/user/compositeEffect.ts",
      options,
      errors: [{ messageId: "noServiceInDb" }],
    },
    // db/ のサブディレクトリでも検出
    {
      code: `
        const effect = defineEffect(
          { service: { findUser }, context: requiredContext() },
          (service) => (context) => defineContract({})
        )
      `,
      filename: "/project/src/db/order/createOrder.ts",
      options,
      errors: [{ messageId: "noServiceInDb" }],
    },
  ],
})
