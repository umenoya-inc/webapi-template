import { afterAll, beforeAll, describe, expect } from "vite-plus/test"
import type { DbContext } from "../DbContext"
import { createTestDbContext } from "../testing/createTestDbContext.testutil"
import { constant, string } from "fast-check"
import { propertyCheck, testBehavior } from "@/testing"
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

  testBehavior(createUser, {
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
    "入力値が不正": propertyCheck(
      createUser,
      {
        "nameが空": { name: constant("") },
        "emailが不正": { email: string() },
        "name文字数超過": { name: string({ minLength: 101 }) },
      },
      async (assert, input) => {
        const result = await createUser(ctx)(input)
        assert(result)
      },
    ),
  })
})
