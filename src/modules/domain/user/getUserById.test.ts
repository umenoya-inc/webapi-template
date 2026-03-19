import { parse } from "valibot"
import { describe, expect } from "vite-plus/test"
import type { DbContext } from "@/modules/db"
import { User, findUserById } from "@/modules/db/user"
import { mockEnv, mockContract, testContract } from "@/modules/testing"
import { getUserById } from "./getUserById"

const dummyCtx = {} as DbContext
const dummyUserId = "00000000-0000-0000-0000-000000000001"

describe("getUserById", () => {
  const findUserByIdMock = mockContract(findUserById, {
    "IDに該当するユーザーを取得": async (input) => ({
      ok: true,
      value: parse(User, { id: input.id, name: "Alice", email: "alice@example.com" }),
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

  testContract(getUserById, {
    "IDに該当するユーザーを取得": async (assert) => {
      const env = mockEnv(getUserById, {
        findUserById: findUserByIdMock["IDに該当するユーザーを取得"],
      })
      const result = await getUserById(dummyCtx, env)({ id: dummyUserId })
      const user = assert(result)
      expect(user.value.id).toBe(dummyUserId)
      expect(user.value.name).toBe("Alice")
    },
    "IDに該当するユーザーが存在しない": async (assert) => {
      const env = mockEnv(getUserById, {
        findUserById: findUserByIdMock["IDに該当するユーザーが存在しない"],
      })
      const result = await getUserById(dummyCtx, env)({ id: dummyUserId })
      assert(result)
    },
    "入力値が不正": async (assert) => {
      const env = mockEnv(getUserById, {
        findUserById: findUserByIdMock["IDに該当するユーザーを取得"],
      })
      const result = await getUserById(dummyCtx, env)({ id: "not-a-uuid" })
      assert(result)
    },
  })
})
