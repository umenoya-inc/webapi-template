import { RuleTester } from "oxlint/plugins-dev"
import { describe, it } from "vite-plus/test"
import noPluralTableName from "./noPluralTableName.js"

RuleTester.describe = describe
RuleTester.it = it

const tester = new RuleTester()

tester.run("no-plural-table-name", noPluralTableName, {
  valid: [
    // 単数形
    { code: 'pgTable("user", {})' },
    { code: 'pgTable("todo", {})' },
    { code: 'pgTable("order", {})' },
    { code: 'pgTable("auth_token", {})' },
    // 単数形だが s で終わる語
    { code: 'pgTable("status", {})' },
    { code: 'pgTable("address", {})' },
    // pgTable 以外の関数
    { code: 'otherFunction("users", {})' },
  ],
  invalid: [
    // 複数形
    {
      code: 'pgTable("users", {})',
      errors: [{ messageId: "noPluralTableName", data: { name: "users", singular: "user" } }],
    },
    {
      code: 'pgTable("todos", {})',
      errors: [{ messageId: "noPluralTableName", data: { name: "todos", singular: "todo" } }],
    },
    {
      code: 'pgTable("orders", {})',
      errors: [{ messageId: "noPluralTableName", data: { name: "orders", singular: "order" } }],
    },
    {
      code: 'pgTable("categories", {})',
      errors: [
        { messageId: "noPluralTableName", data: { name: "categories", singular: "category" } },
      ],
    },
  ],
})
