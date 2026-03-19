import { afterAll, beforeAll, describe, expect } from "vite-plus/test"
import type { DbContext } from "../DbContext"
import { createTestDbContext } from "../testing/createTestDbContext.testutil"
import { testContract } from "@/modules/testing"
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

  testContract(createUser, {
    "ユーザーを新規作成": async (assert) => {
      const result = await createUser(ctx)({
        name: "Alice",
        email: "alice@example.com",
      })
      const user = assert(result)
      expect(user.value.name).toBe("Alice")
      expect(user.value.email).toBe("alice@example.com")
      expect(user.value.id).toBeDefined()
    },
    "メールアドレスが既存ユーザーと重複": async (assert) => {
      const result = await createUser(ctx)({
        name: "Bob",
        email: "alice@example.com",
      })
      const error = assert(result)
      expect(error.field).toBe("email")
    },
    "入力値が不正": async (assert) => {
      const result = await createUser(ctx)({
        name: "",
        email: "invalid-email",
      })
      assert(result)
    },
  })
})
