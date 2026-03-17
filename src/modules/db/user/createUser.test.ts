import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test"
import type { DbContext } from "../DbContext"
import { createTestDbContext } from "../testing/createTestDbContext.testutil"
import { createUser } from "./createUser"
import { userTable } from "./userTable"

describe("createUser", () => {
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

  it("ユーザーを作成して Branded な User を返す", async () => {
    const result = await createUser(ctx)({
      name: "Alice",
      email: "alice@example.com",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.name).toBe("Alice")
    expect(result.value.email).toBe("alice@example.com")
    expect(result.value.id).toBeDefined()
  })

  it("email が重複した場合 duplicate_entry を返す", async () => {
    const result = await createUser(ctx)({
      name: "Bob",
      email: "alice@example.com",
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result).toMatchObject({
      reason: "duplicate_entry",
      field: "email",
    })
  })

  it("バリデーションエラー時に validation_failed を返す", async () => {
    const result = await createUser(ctx)({
      name: "",
      email: "invalid-email",
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("validation_failed")
  })
})
