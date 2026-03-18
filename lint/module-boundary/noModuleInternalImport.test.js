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

const tester = new RuleTester({ cwd })

tester.run("no-module-internal-import", noModuleInternalImport, {
  valid: [
    // 別モジュールの barrel export
    {
      code: 'import { dbContext } from "@/modules/db"',
      filename: src("modules/envvar/envvar.ts"),
    },
    // 別モジュールのネストされた barrel export（実際に index.ts が存在する）
    {
      code: 'import { User } from "@/modules/db/user"',
      filename: src("modules/envvar/envvar.ts"),
    },
    // 同一モジュール内の相対パス
    {
      code: 'import { userTable } from "./userTable"',
      filename: src("modules/db/user/createUser.ts"),
    },
    // 同一モジュール内で別サブモジュールへの相対パス（barrel export なし）
    {
      code: 'import { isDuplicateKeyError } from "../error/isDuplicateKeyError"',
      filename: src("modules/db/user/createUser.ts"),
    },
  ],
  invalid: [
    // 別モジュールの内部ファイルに直接アクセス
    {
      code: 'import { userTable } from "@/modules/db/user/userTable"',
      filename: src("modules/envvar/envvar.ts"),
      errors: [{ messageId: "noInternalImport" }],
    },
    // 同一モジュール内で alias（barrel export）を使用
    {
      code: 'import { dbContext } from "@/modules/db"',
      filename: src("modules/db/user/createUser.ts"),
      errors: [{ messageId: "noAliasInsideModule" }],
    },
    // 同一モジュール内でネストされた alias を使用
    {
      code: 'import { User } from "@/modules/db/user"',
      filename: src("modules/db/error/isDuplicateKeyError.ts"),
      errors: [{ messageId: "noAliasInsideModule" }],
    },
    // 相対パスで別モジュールにアクセス
    {
      code: 'import { envvar } from "../../envvar/envvar"',
      filename: src("modules/db/user/createUser.ts"),
      errors: [{ messageId: "noRelativeOutside" }],
    },
    // 同一モジュール内で barrel export を持つサブモジュールの内部ファイルに相対パスでアクセス
    {
      code: 'import { createTodo } from "../todo/createTodo"',
      filename: src("modules/domain/user/registerUser.ts"),
      errors: [{ messageId: "noSubmoduleInternalImport" }],
    },
  ],
})
