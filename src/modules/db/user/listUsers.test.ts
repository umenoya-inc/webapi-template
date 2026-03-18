import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { createTestDbContext } from "../testing/createTestDbContext.testutil"
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

  it("ユーザーが存在しない場合は空配列を返す", async () => {
    const result = await listUsers(ctx)({})

    expect(result.ok).toBe(true)
    if (!result.ok) expect.unreachable("result should be ok")
    expect(result.value).toEqual([])
  })

  it("作成済みのユーザー一覧を返す", async () => {
    await insertUserRow(ctx, { name: "Alice", email: "alice@example.com" })
    await insertUserRow(ctx, { name: "Bob", email: "bob@example.com" })

    const result = await listUsers(ctx)({})

    expect(result.ok).toBe(true)
    if (!result.ok) expect.unreachable("result should be ok")
    expect(result.value).toHaveLength(2)
    expect(result.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Alice", email: "alice@example.com" }),
        expect.objectContaining({ name: "Bob", email: "bob@example.com" }),
      ]),
    )
  })
})
