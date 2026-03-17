import { RuleTester } from "oxlint/plugins-dev"
import { describe, it } from "vite-plus/test"
import noTestutilInProduction from "./noTestutilInProduction.js"

RuleTester.describe = describe
RuleTester.it = it

const tester = new RuleTester()

tester.run("no-testutil-in-production", noTestutilInProduction, {
  valid: [
    // テストファイルからの testutil インポート
    {
      code: 'import { createTestDbContext } from "../testing/createTestDbContext.testutil"',
      filename: "/project/src/modules/db/user/createUser.test.ts",
    },
    // testutil ファイルから別の testutil インポート
    {
      code: 'import { helper } from "./helper.testutil"',
      filename: "/project/src/modules/db/testing/setup.testutil.ts",
    },
    // 通常ファイルから通常ファイルをインポート
    {
      code: 'import { User } from "./User"',
      filename: "/project/src/modules/db/user/createUser.ts",
    },
  ],
  invalid: [
    // 通常ファイルから testutil をインポート
    {
      code: 'import { createTestDbContext } from "../testing/createTestDbContext.testutil"',
      filename: "/project/src/modules/db/user/createUser.ts",
      errors: [{ messageId: "noTestutilImport" }],
    },
  ],
})
