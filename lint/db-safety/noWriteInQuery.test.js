import { RuleTester } from "oxlint/plugins-dev"
import { describe, it } from "vite-plus/test"
import noWriteInQuery from "./noWriteInQuery.js"

RuleTester.describe = describe
RuleTester.it = it

const tester = new RuleTester()

tester.run("no-write-in-query", noWriteInQuery, {
  valid: [
    // query 内で select（読み取り）
    {
      code: "db.query((q) => q.select().from(userTable))",
      filename: "/project/src/db/user/findUserById.ts",
    },
    // execute 内で insert（書き込み）
    {
      code: "db.execute((q) => q.insert(userTable).values({}).returning())",
      filename: "/project/src/db/user/createUser.ts",
    },
    // execute 内で update（書き込み）
    {
      code: "db.execute((q) => q.update(userTable).set({}).where())",
      filename: "/project/src/db/user/updateUser.ts",
    },
    // execute 内で delete（書き込み）
    {
      code: "db.execute((q) => q.delete(userTable).where())",
      filename: "/project/src/db/user/deleteUser.ts",
    },
    // テストファイルは対象外
    {
      code: "db.query((q) => q.insert(userTable).values({}))",
      filename: "/project/src/db/user/createUser.test.ts",
    },
    // testutil ファイルは対象外
    {
      code: "db.query((q) => q.insert(userTable).values({}))",
      filename: "/project/src/db/testing/helper.testutil.ts",
    },
    // query だが無関係のメソッド呼び出し
    {
      code: "db.query((q) => q.select().from(table).where(eq(table.id, id)))",
      filename: "/project/src/db/user/findUserById.ts",
    },
    // query ではないメソッド内の insert
    {
      code: "something.other((q) => q.insert(table))",
      filename: "/project/src/db/user/createUser.ts",
    },
  ],
  invalid: [
    // query 内で insert
    {
      code: "db.query((q) => q.insert(userTable).values({}).returning())",
      filename: "/project/src/db/user/createUser.ts",
      errors: [{ messageId: "noWriteInQuery" }],
    },
    // query 内で update
    {
      code: "db.query((q) => q.update(userTable).set({}).where())",
      filename: "/project/src/db/user/updateUser.ts",
      errors: [{ messageId: "noWriteInQuery" }],
    },
    // query 内で delete
    {
      code: "db.query((q) => q.delete(userTable).where())",
      filename: "/project/src/db/user/deleteUser.ts",
      errors: [{ messageId: "noWriteInQuery" }],
    },
    // function 式でも検出
    {
      code: "db.query(function(q) { return q.insert(userTable).values({}) })",
      filename: "/project/src/db/user/createUser.ts",
      errors: [{ messageId: "noWriteInQuery" }],
    },
  ],
})
