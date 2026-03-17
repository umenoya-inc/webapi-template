import { describe, expect, it, afterEach } from "vite-plus/test"
import { createTestDbContext } from "../testing/createTestDbContext.testutil"
import { createUser } from "./createUser"
import { userTable } from "./userTable"

describe("createUser", () => {
  let cleanup: () => Promise<void>

  afterEach(async () => {
    await cleanup?.()
  })

  it("ユーザーを作成して Branded な User を返す", async () => {
    const { ctx, cleanup: c } = await createTestDbContext({ userTable })
    cleanup = c

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
    const { ctx, cleanup: c } = await createTestDbContext({ userTable })
    cleanup = c

    await createUser(ctx)({
      name: "Alice",
      email: "alice@example.com",
    })

    const result = await createUser(ctx)({
      name: "Bob",
      email: "alice@example.com",
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("duplicate_entry")
  })

  it("バリデーションエラー時に validation_failed を返す", async () => {
    const { ctx, cleanup: c } = await createTestDbContext({ userTable })
    cleanup = c

    const result = await createUser(ctx)({
      name: "",
      email: "invalid-email",
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("validation_failed")
  })
})
