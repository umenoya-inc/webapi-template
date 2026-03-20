import { hash } from "bcryptjs"
import { string } from "fast-check"
import { describe, expect } from "vite-plus/test"
import type { DbContext } from "@/db"
import { createAuthToken } from "@/db/auth"
import { findUserByEmail } from "@/db/user"
import { mockBehavior, mockService, propertyCheck, testBehavior } from "@/testing"
import { postLogin } from "./postLogin"

const dummyCtx = {} as DbContext
const dummyUserId = "00000000-0000-0000-0000-000000000001"
const dummyToken = "00000000-0000-0000-0000-000000000010"
const dummyExpiresAt = new Date("2099-01-01T00:00:00Z")

let dummyPasswordHash: string

describe("postLogin", async () => {
  dummyPasswordHash = await hash("password123", 10)

  const findUserByEmailMock = mockBehavior(findUserByEmail, {
    "メールアドレスに該当するユーザーを取得": async () => ({
      ok: true,
      value: {
        id: dummyUserId,
        email: "alice@example.com",
        passwordHash: dummyPasswordHash,
      },
    }),
    "メールアドレスに該当するユーザーが存在しない": async () => ({
      ok: false,
      reason: "not_found",
    }),
    "入力値が不正": async () => ({
      ok: false,
      reason: "validation_failed",
      fields: {},
    }),
  })

  const createAuthTokenMock = mockBehavior(createAuthToken, {
    "トークンを発行": async () => ({
      ok: true,
      value: { token: dummyToken, expiresAt: dummyExpiresAt },
    }),
    "入力値が不正": async () => ({
      ok: false,
      reason: "validation_failed",
      fields: {},
    }),
  })

  testBehavior(postLogin, {
    "ログイン成功": async (assert) => {
      const service = mockService(postLogin, {
        findUserByEmail: findUserByEmailMock["メールアドレスに該当するユーザーを取得"],
        createAuthToken: createAuthTokenMock["トークンを発行"],
      })
      const result = await postLogin(service)({ db: dummyCtx })({
        email: "alice@example.com",
        password: "password123",
      })
      const ok = assert(result)
      expect(ok.value.token).toBe(dummyToken)
      expect(ok.value.expiresAt).toEqual(dummyExpiresAt)
    },
    "認証失敗": async (assert) => {
      const service = mockService(postLogin, {
        findUserByEmail: findUserByEmailMock["メールアドレスに該当するユーザーが存在しない"],
        createAuthToken: createAuthTokenMock["トークンを発行"],
      })
      const result = await postLogin(service)({ db: dummyCtx })({
        email: "unknown@example.com",
        password: "password123",
      })
      assert(result)
    },
    "入力値が不正": propertyCheck(
      postLogin,
      {
        "emailが不正": { email: string() },
      },
      async (assert, input) => {
        const service = mockService(postLogin, {
          findUserByEmail: findUserByEmailMock["入力値が不正"],
          createAuthToken: createAuthTokenMock["トークンを発行"],
        })
        const result = await postLogin(service)({ db: dummyCtx })(input)
        assert(result)
      },
    ),
  })
})
