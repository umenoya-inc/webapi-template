import { eq } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test"
import type { DbContext } from "./DbContext"
import { dbTransaction } from "./dbTransaction"
import { fromDbContext } from "./fromDbContext"
import { createTestDbContext } from "./testing/createTestDbContext.testutil"
import { userTable } from "./user/userTable"

describe("dbTransaction", () => {
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

  it("ok: true を返した場合コミットされる", async () => {
    const result = await dbTransaction(ctx, async (txCtx) => {
      const db = fromDbContext(txCtx)
      await db.insert(userTable).values({
        name: "Alice",
        email: "alice@example.com",
        passwordHash: "hash",
      })
      return { ok: true as const, value: "inserted" }
    })

    expect(result.ok).toBe(true)

    const db = fromDbContext(ctx)
    const rows = await db.select().from(userTable).where(eq(userTable.email, "alice@example.com"))
    expect(rows).toHaveLength(1)
  })

  it("ok: false を返した場合ロールバックされる", async () => {
    const result = await dbTransaction(ctx, async (txCtx) => {
      const db = fromDbContext(txCtx)
      await db.insert(userTable).values({
        name: "Bob",
        email: "bob@example.com",
        passwordHash: "hash",
      })
      return { ok: false as const, reason: "duplicate" }
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe("duplicate")
    }

    const db = fromDbContext(ctx)
    const rows = await db.select().from(userTable).where(eq(userTable.email, "bob@example.com"))
    expect(rows).toHaveLength(0)
  })

  it("例外が発生した場合はそのまま throw する", async () => {
    await expect(
      dbTransaction(ctx, async () => {
        throw new Error("unexpected")
      }),
    ).rejects.toThrow("unexpected")
  })
})
