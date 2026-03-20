import { afterAll, beforeAll, describe, expect } from "vite-plus/test"
import { string } from "fast-check"
import type { DbContext } from "../DbContext"
import { createTestDbContext } from "../testing/createTestDbContext.testutil"
import { propertyCheck, testBehavior } from "@/testing"
import { authTokenTable } from "./authTokenTable"
import { createAuthToken } from "./createAuthToken"

describe("createAuthToken", () => {
  let ctx: DbContext
  let cleanup: () => Promise<void>

  beforeAll(async () => {
    const result = await createTestDbContext({ authTokenTable })
    ctx = result.ctx
    cleanup = result.cleanup
  }, 30000)

  afterAll(async () => {
    await cleanup?.()
  })

  testBehavior(createAuthToken, {
    "トークンを発行": async (assert) => {
      const result = await createAuthToken({ db: ctx })({
        userId: "00000000-0000-0000-0000-000000000001",
      })
      const token = assert(result)
      expect(token.value.token).toBeDefined()
      expect(token.value.expiresAt).toBeInstanceOf(Date)
      expect(token.value.expiresAt.getTime()).toBeGreaterThan(Date.now())
    },
    "入力値が不正": propertyCheck(
      createAuthToken,
      {
        "userIdが不正": { userId: string() },
      },
      async (assert, input) => {
        const result = await createAuthToken({ db: ctx })(input)
        assert(result)
      },
    ),
  })
})
