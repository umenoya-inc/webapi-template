import { string } from "fast-check"
import { parse } from "valibot"
import { describe, expect } from "vite-plus/test"
import type { DbContext } from "@/db"
import { User, findUserById } from "@/db/user"
import { mockBehavior, mockEnv, propertyCheck, testBehavior } from "@/testing"
import { getUserById } from "./getUserById"

const dummyCtx = {} as DbContext
const dummyUserId = "00000000-0000-0000-0000-000000000001"

describe("getUserById", () => {
  const findUserByIdMock = mockBehavior(findUserById, {
    "IDに該当するユーザーを取得": async () => ({
      ok: true,
      value: parse(User, {
        id: dummyUserId,
        name: "Alice",
        email: "alice@example.com",
      }),
    }),
    "IDに該当するユーザーが存在しない": async () => ({
      ok: false,
      reason: "not_found",
    }),
    "入力値が不正": async () => ({
      ok: false,
      reason: "validation_failed",
      fields: {},
    }),
  })

  testBehavior(getUserById, {
    "取得成功": async (assert) => {
      const env = mockEnv(getUserById, {
        findUserById: findUserByIdMock["IDに該当するユーザーを取得"],
      })
      const result = await getUserById(dummyCtx, env)({ id: dummyUserId })
      const ok = assert(result)
      expect(ok.value.id).toBe(dummyUserId)
      expect(ok.value.name).toBe("Alice")
      expect(ok.value.email).toBe("alice@example.com")
    },
    "ユーザーが見つからない": async (assert) => {
      const env = mockEnv(getUserById, {
        findUserById: findUserByIdMock["IDに該当するユーザーが存在しない"],
      })
      const result = await getUserById(dummyCtx, env)({ id: dummyUserId })
      assert(result)
    },
    "入力値が不正": propertyCheck(
      getUserById,
      {
        "IDが不正": { id: string() },
      },
      async (assert, input) => {
        const result = await getUserById(dummyCtx)(input)
        assert(result)
      },
    ),
  })
})
