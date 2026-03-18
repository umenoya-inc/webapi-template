import { parse } from "valibot"
import { describe, expect } from "vite-plus/test"
import type { DbContext } from "@/modules/db"
import { User, findUserById } from "@/modules/db/user"
import { mockContract, testContract } from "@/modules/testing"
import { getUserById } from "./getUserById"

const dummyCtx = {} as DbContext
const dummyUserId = "00000000-0000-0000-0000-000000000001"

const findUserByIdMock = mockContract(findUserById, {
  success: async (input) => ({
    ok: true,
    value: parse(User, { id: input.id, name: "Alice", email: "alice@example.com" }),
  }),
  not_found: async () => ({
    ok: false,
    reason: "not_found",
  }),
  validation_failed: async () => ({
    ok: false,
    reason: "validation_failed",
    fields: {},
  }),
})

describe("getUserById", () => {
  testContract(getUserById, {
    success: async (assert) => {
      const result = await getUserById(dummyCtx, { findUserById: findUserByIdMock.success })({
        id: dummyUserId,
      })
      const user = assert(result)
      expect(user.value.id).toBe(dummyUserId)
      expect(user.value.name).toBe("Alice")
    },
    not_found: async (assert) => {
      const result = await getUserById(dummyCtx, { findUserById: findUserByIdMock.not_found })({
        id: dummyUserId,
      })
      assert(result)
    },
    validation_failed: async (assert) => {
      const result = await getUserById(dummyCtx, { findUserById: findUserByIdMock.success })({
        id: "not-a-uuid",
      })
      assert(result)
    },
  })
})
