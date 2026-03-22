import { RuleTester } from "oxlint/plugins-dev"
import { describe, it } from "vite-plus/test"
import noLeafInApiEffect from "./noLeafInApiEffect.js"

RuleTester.describe = describe
RuleTester.it = it

const options = [{ basePath: "src" }]
const tester = new RuleTester()

tester.run("no-leaf-in-api-effect", noLeafInApiEffect, {
  valid: [
    // api/ 内の composite effect（service あり）
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
    // api/ 内の node effect（service + context あり）
    {
      code: `
        const getUserById = defineEffect(
          { service: { findUserById }, context: requiredContext() },
          (service) => (context) => defineRouteContract({})
        )
      `,
      filename: "/project/src/api/user/getUserById.ts",
      options,
    },
    // db/ 内の leaf effect — 対象外
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
    // テストファイルは対象外
    {
      code: `
        const mock = defineEffect(
          { context: requiredContext() },
          (context) => ({})
        )
      `,
      filename: "/project/src/api/user/postUser.test.ts",
      options,
    },
  ],
  invalid: [
    // api/ 内の leaf effect（service なし）
    {
      code: `
        const directDbAccess = defineEffect(
          { context: requiredContext() },
          (context) => defineRouteContract({})
        )
      `,
      filename: "/project/src/api/user/directDbAccess.ts",
      options,
      errors: [{ messageId: "noLeafInApi" }],
    },
    // api/ サブディレクトリでも検出
    {
      code: `
        const effect = defineEffect(
          { context: requiredContext() },
          (context) => defineRouteContract({})
        )
      `,
      filename: "/project/src/api/todo/effect.ts",
      options,
      errors: [{ messageId: "noLeafInApi" }],
    },
  ],
})
