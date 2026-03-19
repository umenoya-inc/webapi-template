import { afterAll, beforeAll, describe, expect } from "vite-plus/test"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { createTestDbContext } from "../testing/createTestDbContext.testutil"
import { testBehavior } from "@/modules/testing"
import { findUserById } from "./findUserById"
import { userTable } from "./userTable"

const insertUserRow = (ctx: DbContext, values: { name: string; email: string }) => {
  const db = fromDbContext(ctx)
  return db.insert(userTable).values(values).returning()
}

describe("findUserById", () => {
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

  testBehavior(findUserById, {
    "IDに該当するユーザーを取得": async (assert) => {
      const [inserted] = await insertUserRow(ctx, { name: "Alice", email: "alice@example.com" })
      const result = await findUserById(ctx)({ id: inserted.id })
      const user = assert(result)
      expect(user.value.id).toBe(inserted.id)
      expect(user.value.name).toBe("Alice")
      expect(user.value.email).toBe("alice@example.com")
    },
    "IDに該当するユーザーが存在しない": async (assert) => {
      const result = await findUserById(ctx)({ id: "00000000-0000-0000-0000-000000000000" })
      assert(result)
    },
    "入力値が不正": async (assert) => {
      const result = await findUserById(ctx)({ id: "not-a-uuid" })
      assert(result)
    },
  })
})
