import { afterAll, beforeAll, describe, expect } from "vite-plus/test"
import { string } from "fast-check"
import type { DbContext } from "../DbContext"
import { createTestDbContext } from "../testing/createTestDbContext.testutil"
import { rawDb } from "../testing/rawDb.testutil"
import { propertyCheck, testBehavior } from "@/testing"
import { authTokenTable } from "./authTokenTable"
import { findAuthToken } from "./findAuthToken"

const insertAuthTokenRow = (ctx: DbContext, values: { userId: string; expiresAt: Date }) =>
  rawDb(ctx).insert(authTokenTable).values(values).returning()

describe("findAuthToken", () => {
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

  testBehavior(findAuthToken, {
    "有効なトークンを取得": async (assert) => {
      const [inserted] = await insertAuthTokenRow(ctx, {
        userId: "00000000-0000-0000-0000-000000000001",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      const result = await findAuthToken({ db: ctx })({ token: inserted.token })
      const token = assert(result)
      expect(token.value.token).toBe(inserted.token)
      expect(token.value.userId).toBe("00000000-0000-0000-0000-000000000001")
    },
    "トークンが存在しないまたは期限切れ": async (assert) => {
      const [inserted] = await insertAuthTokenRow(ctx, {
        userId: "00000000-0000-0000-0000-000000000002",
        expiresAt: new Date(Date.now() - 1000),
      })
      const result = await findAuthToken({ db: ctx })({ token: inserted.token })
      assert(result)
    },
    "入力値が不正": propertyCheck(
      findAuthToken,
      {
        "トークンが不正": { token: string() },
      },
      async (assert, input) => {
        const result = await findAuthToken({ db: ctx })(input)
        assert(result)
      },
    ),
  })
})
