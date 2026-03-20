import { constant, string } from "fast-check"
import { parse } from "valibot"
import { describe, expect } from "vite-plus/test"
import type { DbContext } from "@/db"
import { User, createUser } from "@/db/user"
import { mockBehavior, mockService, propertyCheck, testBehavior } from "@/testing"
import { postUser } from "./postUser"

const dummyCtx = {} as DbContext
const dummyUserId = "00000000-0000-0000-0000-000000000001"

describe("postUser", () => {
  const createUserMock = mockBehavior(createUser, {
    "ユーザーを新規作成": async (input) => ({
      ok: true,
      value: parse(User, { id: dummyUserId, name: input.name, email: input.email }),
    }),
    "メールアドレスが既存ユーザーと重複": async () => ({
      ok: false,
      reason: "duplicate_entry",
      field: "email",
    }),
    "入力値が不正": async () => ({
      ok: false,
      reason: "validation_failed",
      fields: {},
    }),
  })

  testBehavior(postUser, {
    "作成成功": async (assert) => {
      const service = mockService(postUser, {
        createUser: createUserMock["ユーザーを新規作成"],
      })
      const result = await postUser(service)({ db: dummyCtx })({
        name: "Alice",
        email: "alice@example.com",
      })
      const ok = assert(result)
      expect(ok.value.name).toBe("Alice")
      expect(ok.value.email).toBe("alice@example.com")
      expect(ok.value.id).toBe(dummyUserId)
    },
    "メールアドレスが重複": async (assert) => {
      const service = mockService(postUser, {
        createUser: createUserMock["メールアドレスが既存ユーザーと重複"],
      })
      const result = await postUser(service)({ db: dummyCtx })({
        name: "Bob",
        email: "alice@example.com",
      })
      assert(result)
    },
    "入力値が不正": propertyCheck(
      postUser,
      {
        "nameが空": { name: constant("") },
        "emailが不正": { email: string() },
        "name文字数超過": { name: string({ minLength: 101 }) },
      },
      async (assert, input) => {
        const service = mockService(postUser, {
          createUser: createUserMock["入力値が不正"],
        })
        const result = await postUser(service)({ db: dummyCtx })(input)
        assert(result)
      },
    ),
  })
})
