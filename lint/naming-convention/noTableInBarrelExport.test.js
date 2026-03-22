import { RuleTester } from "oxlint/plugins-dev"
import { describe, it } from "vite-plus/test"
import noTableInBarrelExport from "./noTableInBarrelExport.js"

RuleTester.describe = describe
RuleTester.it = it

const tester = new RuleTester()

tester.run("no-table-in-barrel-export", noTableInBarrelExport, {
  valid: [
    // ドメインモデルのエクスポート（OK）
    {
      code: 'export { User } from "./User"',
      filename: "/project/src/db/user/index.ts",
    },
    // DB 操作関数のエクスポート（OK）
    {
      code: 'export { createUser } from "./createUser"',
      filename: "/project/src/db/user/index.ts",
    },
    // index.ts 以外のファイルは対象外
    {
      code: 'export { userTable } from "./userTable"',
      filename: "/project/src/db/user/createUser.ts",
    },
    // 複数エクスポートで Table を含まないもの
    {
      code: 'export { User } from "./User"\nexport { createUser } from "./createUser"',
      filename: "/project/src/db/user/index.ts",
    },
  ],
  invalid: [
    // テーブル定義のエクスポート
    {
      code: 'export { userTable } from "./userTable"',
      filename: "/project/src/db/user/index.ts",
      errors: [{ messageId: "noTableExport", data: { name: "userTable" } }],
    },
    // リネーム付きエクスポート
    {
      code: 'export { userTable as UserTable } from "./userTable"',
      filename: "/project/src/db/user/index.ts",
      errors: [{ messageId: "noTableExport", data: { name: "UserTable" } }],
    },
    // 複数エクスポートの中に Table が混在
    {
      code: 'export { User, userTable } from "./user"',
      filename: "/project/src/db/user/index.ts",
      errors: [{ messageId: "noTableExport", data: { name: "userTable" } }],
    },
  ],
})
