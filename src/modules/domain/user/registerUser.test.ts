import { parse } from "valibot"
import { describe, expect } from "vite-plus/test"
import type { DbContext } from "@/modules/db"
import { User, createUser } from "@/modules/db/user"
import { mockContract, testContract } from "@/modules/testing"
import { registerUser } from "./registerUser"

const dummyCtx = {} as DbContext
const dummyUserId = "00000000-0000-0000-0000-000000000001"

const createUserMock = mockContract(createUser, {
  success: async (input) => ({
    ok: true,
    value: parse(User, { id: dummyUserId, name: input.name, email: input.email }),
  }),
  duplicate_entry: async () => ({
    ok: false,
    reason: "duplicate_entry",
    field: "email",
  }),
  validation_failed: async () => ({
    ok: false,
    reason: "validation_failed",
    fields: {},
  }),
})

describe("registerUser", () => {
  testContract(registerUser, {
    success: async (assert) => {
      const result = await registerUser(dummyCtx, { createUser: createUserMock.success })({
        name: "Alice",
        email: "alice@example.com",
      })
      const user = assert(result)
      expect(user.value.name).toBe("Alice")
      expect(user.value.email).toBe("alice@example.com")
      expect(user.value.id).toBe(dummyUserId)
    },
    duplicate_entry: async (assert) => {
      const result = await registerUser(dummyCtx, {
        createUser: createUserMock.duplicate_entry,
      })({
        name: "Bob",
        email: "alice@example.com",
      })
      assert(result)
    },
    validation_failed: async (assert) => {
      const result = await registerUser(dummyCtx, { createUser: createUserMock.success })({
        name: "",
        email: "invalid",
      })
      assert(result)
    },
  })
})
