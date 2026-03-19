import { parse } from "valibot"
import { describe, expect } from "vite-plus/test"
import type { DbContext } from "@/db"
import { User, createUser } from "@/db/user"
import { mockEnv, mockBehavior, testBehavior } from "@/testing"
import { registerUser } from "./registerUser"

const dummyCtx = {} as DbContext
const dummyUserId = "00000000-0000-0000-0000-000000000001"

describe("registerUser", () => {
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

  testBehavior(registerUser, {
    "ユーザーを登録": async (assert) => {
      const env = mockEnv(registerUser, {
        createUser: createUserMock["ユーザーを新規作成"],
      })
      const result = await registerUser(
        dummyCtx,
        env,
      )({
        name: "Alice",
        email: "alice@example.com",
      })
      const user = assert(result)
      expect(user.value.name).toBe("Alice")
      expect(user.value.email).toBe("alice@example.com")
      expect(user.value.id).toBe(dummyUserId)
    },
    "メールアドレスが既存ユーザーと重複": async (assert) => {
      const env = mockEnv(registerUser, {
        createUser: createUserMock["メールアドレスが既存ユーザーと重複"],
      })
      const result = await registerUser(
        dummyCtx,
        env,
      )({
        name: "Bob",
        email: "alice@example.com",
      })
      assert(result)
    },
    "入力値が不正": async (assert) => {
      const env = mockEnv(registerUser, {
        createUser: createUserMock["ユーザーを新規作成"],
      })
      const result = await registerUser(
        dummyCtx,
        env,
      )({
        name: "",
        email: "invalid",
      })
      assert(result)
    },
  })
})
