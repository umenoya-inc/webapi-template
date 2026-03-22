import { afterAll, beforeAll, describe, expect } from "vite-plus/test"
import { string } from "fast-check"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { createTestDbContext } from "../testing/createTestDbContext.testutil"
import { propertyCheck, testBehavior } from "@/testing"
import { findUserByEmail } from "./findUserByEmail"
import { userTable } from "./userTable"

const insertUserRow = (
  ctx: DbContext,
  values: { name: string; email: string; passwordHash: string },
) => {
  const db = fromDbContext(ctx)
  return db.query((q) => q.insert(userTable).values(values).returning())
}

describe("findUserByEmail", () => {
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

  testBehavior(findUserByEmail, {
    "メールアドレスに該当するユーザーを取得": async (assert) => {
      await insertUserRow(ctx, {
        name: "Alice",
        email: "alice@example.com",
        passwordHash: "$2a$10$dummyhash",
      })
      const result = await findUserByEmail({ db: ctx })({ email: "alice@example.com" })
      const user = assert(result)
      expect(user.value.email).toBe("alice@example.com")
      expect(user.value.passwordHash).toBe("$2a$10$dummyhash")
      expect(user.value.id).toBeDefined()
    },
    "メールアドレスに該当するユーザーが存在しない": async (assert) => {
      const result = await findUserByEmail({ db: ctx })({ email: "nonexistent@example.com" })
      assert(result)
    },
    "入力値が不正": propertyCheck(
      findUserByEmail,
      {
        "emailが不正": { email: string() },
      },
      async (assert, input) => {
        const result = await findUserByEmail({ db: ctx })(input)
        assert(result)
      },
    ),
  })
})
