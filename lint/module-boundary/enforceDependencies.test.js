import { resolve } from "node:path"
import { RuleTester } from "oxlint/plugins-dev"
import { describe, it } from "vite-plus/test"
import enforceDependencies from "./enforceDependencies.js"

RuleTester.describe = describe
RuleTester.it = it

const cwd = resolve(import.meta.dirname, "../..")
const src = (path) => resolve(cwd, "src", path)
const options = [{ basePath: "src", aliasPrefix: "@/" }]

const tester = new RuleTester({ cwd })

tester.run("enforce-dependencies", enforceDependencies, {
  valid: [
    // api → db/**: サブモジュールへのアクセスも許可
    {
      code: 'import { createUser } from "@/db/user"',
      filename: src("api/user/postUser.ts"),
      options,
    },
    // api → db: トップレベルも許可
    {
      code: 'import { globalDbContext } from "@/db"',
      filename: src("api/user/postUserRoute.ts"),
      options,
    },
    // api → behavior: トップレベルのみ許可
    {
      code: 'import { failAs } from "@/behavior"',
      filename: src("api/user/postUser.ts"),
      options,
    },
    // api → contract: トップレベルのみ許可
    {
      code: 'import { defaultInputError } from "@/contract"',
      filename: src("api/user/postUser.ts"),
      options,
    },
    // 同一モジュール内は常にOK
    {
      code: 'import { User } from "@/db/user"',
      filename: src("db/user/createUser.ts"),
      options,
    },
    // @dependencies が宣言されていないモジュールは制約なし
    {
      code: 'import { Desc } from "@/behavior"',
      filename: src("contract/defineContract.ts"),
      options,
    },
    // 相対パスは対象外
    {
      code: 'import { userTable } from "./userTable"',
      filename: src("db/user/createUser.ts"),
      options,
    },
  ],
  invalid: [
    // api → envvar: 宣言されていないモジュールへのアクセスは不可
    {
      code: 'import { envvar } from "@/envvar"',
      filename: src("api/user/postUser.ts"),
      options,
      errors: [{ messageId: "disallowedDependency" }],
    },
  ],
})
