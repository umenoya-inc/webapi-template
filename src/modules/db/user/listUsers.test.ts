import { afterAll, beforeAll, describe, expect } from "vite-plus/test"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { createTestDbContext } from "../testing/createTestDbContext.testutil"
import { testContract } from "@/modules/testing"
import { listUsers } from "./listUsers"
import { userTable } from "./userTable"

const insertUserRow = (ctx: DbContext, values: { name: string; email: string }) => {
  const db = fromDbContext(ctx)
  return db.insert(userTable).values(values)
}

describe("listUsers", () => {
  let ctx: DbContext
  let cleanup: () => Promise<void>

  beforeAll(async () => {
    const result = await createTestDbContext({ userTable })
    ctx = result.ctx
    cleanup = result.cleanup
  }, 30000)

  afterAll(async () => {
    await cleanup?.()
  })

  testContract(listUsers, {
    "ユーザーが存在しない": async (assert) => {
      const result = await listUsers(ctx)()
      const ok = assert(result)
      expect(ok.value).toEqual([])
    },
    "登録済みユーザー一覧を取得": async (assert) => {
      await insertUserRow(ctx, { name: "Alice", email: "alice@example.com" })
      await insertUserRow(ctx, { name: "Bob", email: "bob@example.com" })

      const result = await listUsers(ctx)()
      const ok = assert(result)
      expect(ok.value).toHaveLength(2)
      expect(ok.value).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Alice", email: "alice@example.com" }),
          expect.objectContaining({ name: "Bob", email: "bob@example.com" }),
        ]),
      )
    },
  })
})
