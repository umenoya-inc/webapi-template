import { parse } from "valibot"
import { describe, expect, it } from "vite-plus/test"
import type { DbContext } from "@/modules/db"
import { User, createUser } from "@/modules/db/user"
import { mockContract } from "@/modules/testing"
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
  it("ユーザーを登録して User を返す", async () => {
    const result = await registerUser(dummyCtx, { createUser: createUserMock.success })({
      name: "Alice",
      email: "alice@example.com",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) expect.unreachable("result should be ok")
    expect(result.value.name).toBe("Alice")
    expect(result.value.email).toBe("alice@example.com")
    expect(result.value.id).toBe(dummyUserId)
  })

  it("email が重複した場合 duplicate_entry を返す", async () => {
    const result = await registerUser(dummyCtx, {
      createUser: createUserMock.duplicate_entry,
    })({
      name: "Bob",
      email: "alice@example.com",
    })

    expect(result.ok).toBe(false)
    if (result.ok) expect.unreachable("result should not be ok")
    expect(result).toMatchObject({
      reason: "duplicate_entry",
      field: "email",
    })
  })

  it("バリデーションエラー時に validation_failed を返す", async () => {
    const result = await registerUser(dummyCtx, { createUser: createUserMock.success })({
      name: "",
      email: "invalid",
    })

    expect(result.ok).toBe(false)
    if (result.ok) expect.unreachable("result should not be ok")
    expect(result.reason).toBe("validation_failed")
  })
})
