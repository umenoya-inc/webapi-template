import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { createTestDbContext } from "../testing/createTestDbContext.testutil"
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

  it("存在するユーザーを Branded な User として返す", async () => {
    const [inserted] = await insertUserRow(ctx, { name: "Alice", email: "alice@example.com" })

    const result = await findUserById(ctx)({ id: inserted.id })

    expect(result.ok).toBe(true)
    if (!result.ok) expect.unreachable("result should be ok")
    expect(result.value.id).toBe(inserted.id)
    expect(result.value.name).toBe("Alice")
    expect(result.value.email).toBe("alice@example.com")
  })

  it("存在しない ID の場合 not_found を返す", async () => {
    const result = await findUserById(ctx)({ id: "00000000-0000-0000-0000-000000000000" })

    expect(result.ok).toBe(false)
    if (result.ok) expect.unreachable("result should not be ok")
    expect(result.reason).toBe("not_found")
  })

  it("不正な ID 形式の場合 validation_failed を返す", async () => {
    const result = await findUserById(ctx)({ id: "not-a-uuid" })

    expect(result.ok).toBe(false)
    if (result.ok) expect.unreachable("result should not be ok")
    expect(result.reason).toBe("validation_failed")
  })
})
