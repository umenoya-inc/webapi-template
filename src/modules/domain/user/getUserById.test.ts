import { parse } from "valibot"
import { describe, expect, it } from "vite-plus/test"
import type { DbContext } from "@/modules/db"
import { User, findUserById } from "@/modules/db/user"
import { mockContract } from "@/modules/testing"
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
})

describe("getUserById", () => {
  it("ユーザーを取得して User を返す", async () => {
    const result = await getUserById(dummyCtx, { findUserById: findUserByIdMock.success })({
      id: dummyUserId,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) expect.unreachable("result should be ok")
    expect(result.value.id).toBe(dummyUserId)
    expect(result.value.name).toBe("Alice")
  })

  it("存在しない場合 not_found を返す", async () => {
    const result = await getUserById(dummyCtx, { findUserById: findUserByIdMock.not_found })({
      id: dummyUserId,
    })

    expect(result.ok).toBe(false)
    if (result.ok) expect.unreachable("result should not be ok")
    expect(result.reason).toBe("not_found")
  })

  it("不正な ID 形式の場合 validation_failed を返す", async () => {
    const result = await getUserById(dummyCtx, { findUserById: findUserByIdMock.success })({
      id: "not-a-uuid",
    })

    expect(result.ok).toBe(false)
    if (result.ok) expect.unreachable("result should not be ok")
    expect(result.reason).toBe("validation_failed")
  })
})
