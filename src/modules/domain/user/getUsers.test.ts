import { parse } from "valibot"
import { describe, expect, it } from "vite-plus/test"
import type { DbContext } from "@/modules/db"
import { User, listUsers } from "@/modules/db/user"
import { mockContract } from "@/modules/testing"
import { getUsers } from "./getUsers"

const dummyCtx = {} as DbContext

const alice = parse(User, {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Alice",
  email: "alice@example.com",
})
const bob = parse(User, {
  id: "00000000-0000-0000-0000-000000000002",
  name: "Bob",
  email: "bob@example.com",
})

const listUsersMock = mockContract(listUsers, {
  with_users: async () => ({
    ok: true,
    value: [alice, bob],
  }),
  empty: async () => ({
    ok: true,
    value: [],
  }),
})

describe("getUsers", () => {
  it("ユーザー一覧を返す", async () => {
    const result = await getUsers(dummyCtx, { listUsers: listUsersMock.with_users })({})

    expect(result.ok).toBe(true)
    if (!result.ok) expect.unreachable("result should be ok")
    expect(result.value).toHaveLength(2)
    expect(result.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Alice" }),
        expect.objectContaining({ name: "Bob" }),
      ]),
    )
  })

  it("ユーザーが存在しない場合は空配列を返す", async () => {
    const result = await getUsers(dummyCtx, { listUsers: listUsersMock.empty })({})

    expect(result.ok).toBe(true)
    if (!result.ok) expect.unreachable("result should be ok")
    expect(result.value).toEqual([])
  })
})
