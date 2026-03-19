import { resolve } from "node:path"
import { RuleTester } from "oxlint/plugins-dev"
import { describe, it } from "vite-plus/test"
import noModuleInternalImport from "./noModuleInternalImport.js"

RuleTester.describe = describe
RuleTester.it = it

// このルールは cwd + filename からパスを解決し、existsSync で barrel export を判定するため、
// 実プロジェクトのパスを使用する
const cwd = resolve(import.meta.dirname, "../..")
const src = (path) => resolve(cwd, "src", path)
const options = [{ basePath: "src", aliasPrefix: "@/" }]

const tester = new RuleTester({ cwd })

tester.run("no-module-internal-import", noModuleInternalImport, {
  valid: [
    // 別モジュールの barrel export
    {
      code: 'import { dbContext } from "@/db"',
      filename: src("envvar/envvar.ts"),
      options,
    },
    // 別モジュールのネストされた barrel export（実際に index.ts が存在する）
    {
      code: 'import { User } from "@/db/user"',
      filename: src("envvar/envvar.ts"),
      options,
    },
    // 同一モジュール内の相対パス
    {
      code: 'import { userTable } from "./userTable"',
      filename: src("db/user/createUser.ts"),
      options,
    },
    // 同一モジュール内で別サブモジュールへの相対パス（barrel export なし）
    {
      code: 'import { isDuplicateKeyError } from "../error/isDuplicateKeyError"',
      filename: src("db/user/createUser.ts"),
      options,
    },
  ],
  invalid: [
    // 別モジュールの内部ファイルに直接アクセス
    {
      code: 'import { userTable } from "@/db/user/userTable"',
      filename: src("envvar/envvar.ts"),
      options,
      errors: [{ messageId: "noInternalImport" }],
    },
    // 同一モジュール内で alias（barrel export）を使用
    {
      code: 'import { dbContext } from "@/db"',
      filename: src("db/user/createUser.ts"),
      options,
      errors: [{ messageId: "noAliasInsideModule" }],
    },
    // 同一モジュール内でネストされた alias を使用
    {
      code: 'import { User } from "@/db/user"',
      filename: src("db/error/isDuplicateKeyError.ts"),
      options,
      errors: [{ messageId: "noAliasInsideModule" }],
    },
    // 相対パスで別モジュールにアクセス
    {
      code: 'import { envvar } from "../../envvar/envvar"',
      filename: src("db/user/createUser.ts"),
      options,
      errors: [{ messageId: "noRelativeOutside" }],
    },
    // 同一モジュール内で barrel export を持つサブモジュールの内部ファイルに相対パスでアクセス
    {
      code: 'import { userTable } from "../user/userTable"',
      filename: src("db/error/dbExecute.ts"),
      options,
      errors: [{ messageId: "noSubmoduleInternalImport" }],
    },
  ],
})
