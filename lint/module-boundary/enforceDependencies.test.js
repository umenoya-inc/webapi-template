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
    // domain → db: domain/index.ts に @dependencies db がある場合
    {
      code: 'import { findUserById } from "@/db/user"',
      filename: src("domain/user/getUserById.ts"),
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
    // domain → db は許可されているが、db → domain は許可されていない
    // ※ db/index.ts に @dependencies で domain が宣言されていない場合
    // ただし db は @dependencies を宣言していないのでこのテストは valid になる
    // 実際にテストするには @dependencies を宣言したモジュールが必要
  ],
})
