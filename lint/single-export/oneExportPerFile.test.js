import { RuleTester } from "oxlint/plugins-dev"
import { describe, it } from "vite-plus/test"
import oneExportPerFile from "./oneExportPerFile.js"

RuleTester.describe = describe
RuleTester.it = it

const tester = new RuleTester()

tester.run("one-export-per-file", oneExportPerFile, {
  valid: [
    // 1つの値エクスポート
    {
      code: "export const foo = 1",
      filename: "/project/src/modules/test/foo.ts",
    },
    // 同名の値+型ペア（1つとみなす）
    {
      code: [
        'import { type InferOutput, pipe, object, string, brand } from "valibot"',
        "export const User = pipe(object({ name: string() }), brand('User'))",
        "export type User = InferOutput<typeof User>",
      ].join("\n"),
      filename: "/project/src/modules/db/user/User.ts",
      languageOptions: { sourceType: "module" },
    },
    // index.ts は除外
    {
      code: ['export { User } from "./User"', 'export { createUser } from "./createUser"'].join(
        "\n",
      ),
      filename: "/project/src/modules/db/user/index.ts",
    },
    // .testutil.ts のファイル名マッチ
    {
      code: "export const createTestDbContext = async () => {}",
      filename: "/project/src/modules/db/testing/createTestDbContext.testutil.ts",
    },
  ],
  invalid: [
    // 複数エクスポート
    {
      code: "export const foo = 1\nexport const bar = 2",
      filename: "/project/src/modules/test/foo.ts",
      errors: [{ messageId: "tooManyExports" }],
    },
    // シンボル名とファイル名の不一致
    {
      code: "export const mismatch = 1",
      filename: "/project/src/modules/test/wrongName.ts",
      errors: [{ messageId: "nameMismatch" }],
    },
    // 同名ペア + 別のエクスポート
    {
      code: [
        "export const User = {}",
        "export type User = typeof User",
        "export const other = 123",
      ].join("\n"),
      filename: "/project/src/modules/test/User.ts",
      languageOptions: { sourceType: "module" },
      errors: [{ messageId: "tooManyExports" }],
    },
  ],
})
