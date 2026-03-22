import { RuleTester } from "oxlint/plugins-dev"
import { describe, it } from "vite-plus/test"
import interfaceForObjectTypes from "./interfaceForObjectTypes.js"

RuleTester.describe = describe
RuleTester.it = it

const tester = new RuleTester()

tester.run("interface-for-object-types", interfaceForObjectTypes, {
  valid: [
    // interface（正しい）
    {
      code: "interface AuthContext { userId: string }",
      filename: "/project/src/api/auth/AuthContext.ts",
    },
    // union 型 → type で OK
    {
      code: 'type DbError = { kind: "unique_violation" } | { kind: "unknown" }',
      filename: "/project/src/db/error/DbError.ts",
    },
    // intersection 型 → type で OK
    {
      code: "type Combined = A & B",
      filename: "/project/src/types/Combined.ts",
    },
    // 推論型 → type で OK
    {
      code: "type User = InferOutput<typeof UserSchema>",
      filename: "/project/src/db/user/User.ts",
    },
    // conditional 型 → type で OK
    {
      code: "type Result<T> = T extends Error ? never : T",
      filename: "/project/src/types/Result.ts",
    },
    // プリミティブ → type で OK
    {
      code: "type UserId = string & Brand<'UserId'>",
      filename: "/project/src/db/user/UserId.ts",
    },
    // 関数型 → type で OK
    {
      code: "type Handler = (req: Request) => Response",
      filename: "/project/src/api/Handler.ts",
    },
    // テストファイルは対象外
    {
      code: "type MockData = { id: string; name: string }",
      filename: "/project/src/db/user/createUser.test.ts",
    },
    // computed property key（branded/phantom 型）→ type で OK
    {
      code: "type DbContext = { readonly [brand]: never }",
      filename: "/project/src/db/DbContext.ts",
    },
    // タプル型 → type で OK
    {
      code: "type Pair = [string, number]",
      filename: "/project/src/types/Pair.ts",
    },
    // リテラル型 → type で OK
    {
      code: 'type Status = "active" | "inactive"',
      filename: "/project/src/types/Status.ts",
    },
  ],
  invalid: [
    // 純粋なオブジェクト型に type を使っている
    {
      code: "type AuthContext = { userId: string }",
      filename: "/project/src/api/auth/AuthContext.ts",
      errors: [{ messageId: "useInterface", data: { name: "AuthContext" } }],
    },
    // 複数フィールドのオブジェクト型
    {
      code: "type Config = { host: string; port: number; debug: boolean }",
      filename: "/project/src/config/Config.ts",
      errors: [{ messageId: "useInterface", data: { name: "Config" } }],
    },
    // ネストされたオブジェクト型（最外層がオブジェクト型リテラル）
    {
      code: "type Options = { nested: { value: string } }",
      filename: "/project/src/Options.ts",
      errors: [{ messageId: "useInterface", data: { name: "Options" } }],
    },
  ],
})
