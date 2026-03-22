import { afterAll, beforeAll, describe, expect } from "vite-plus/test"
import type { DbContext } from "../DbContext"
import { createTestDbContext } from "../testing/createTestDbContext.testutil"
import { rawDb } from "../testing/rawDb.testutil"
import { testBehavior } from "@/testing"
import { listUsers } from "./listUsers"
import { userTable } from "./userTable"

const insertUserRow = (
  ctx: DbContext,
  values: { name: string; email: string; passwordHash: string },
) => rawDb(ctx).insert(userTable).values(values)

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

  testBehavior(listUsers, {
    "ユーザーが存在しない": async (assert) => {
      const result = await listUsers({ db: ctx })()
      const ok = assert(result)
      expect(ok.value).toEqual([])
    },
    "登録済みユーザー一覧を取得": async (assert) => {
      await insertUserRow(ctx, {
        name: "Alice",
        email: "alice@example.com",
        passwordHash: "$2a$10$dummyhash",
      })
      await insertUserRow(ctx, {
        name: "Bob",
        email: "bob@example.com",
        passwordHash: "$2a$10$dummyhash",
      })

      const result = await listUsers({ db: ctx })()
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
