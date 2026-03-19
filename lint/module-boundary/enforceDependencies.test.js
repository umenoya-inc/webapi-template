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
    // domain → db/**: サブモジュールへのアクセスも許可
    {
      code: 'import { findUserById } from "@/db/user"',
      filename: src("domain/user/getUserById.ts"),
      options,
    },
    // domain → db/**: トップレベルも許可
    {
      code: 'import { globalDbContext } from "@/db"',
      filename: src("domain/user/getUserById.ts"),
      options,
    },
    // domain → contract/**: サブモジュールも許可
    {
      code: 'import { defineContract } from "@/contract"',
      filename: src("domain/user/registerUser.ts"),
      options,
    },
    // routes → domain/**: サブモジュールへのアクセス許可
    {
      code: 'import { registerUser } from "@/domain/user"',
      filename: src("routes/userRoute.ts"),
      options,
    },
    // routes → db: トップレベルのみ許可
    {
      code: 'import { globalDbContext } from "@/db"',
      filename: src("routes/userRoute.ts"),
      options,
    },
    // routes → behavior: トップレベルのみ許可
    {
      code: 'import { matchBehavior } from "@/behavior"',
      filename: src("routes/userRoute.ts"),
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
    // routes → db/user: db はトップレベルのみ許可、サブモジュールは不可
    {
      code: 'import { createUser } from "@/db/user"',
      filename: src("routes/userRoute.ts"),
      options,
      errors: [{ messageId: "disallowedDependency" }],
    },
    // routes → behavior/failAs: behavior はトップレベルのみ許可
    {
      code: 'import { failAs } from "@/behavior/failAs"',
      filename: src("routes/userRoute.ts"),
      options,
      errors: [{ messageId: "disallowedDependency" }],
    },
    // routes → contract: 宣言されていないモジュールへのアクセスは不可
    {
      code: 'import { defineContract } from "@/contract"',
      filename: src("routes/userRoute.ts"),
      options,
      errors: [{ messageId: "disallowedDependency" }],
    },
  ],
})
