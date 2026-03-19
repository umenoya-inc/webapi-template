import { parse } from "valibot"
import { describe, expect } from "vite-plus/test"
import type { DbContext } from "@/modules/db"
import { User, listUsers } from "@/modules/db/user"
import { mockContract, testContract } from "@/modules/testing"
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
  "ユーザーが存在しない": async () => ({
    ok: true,
    value: [],
  }),
  "登録済みユーザー一覧を取得": {
    with_users: async () => ({
      ok: true,
      value: [alice, bob],
    }),
  },
})

describe("getUsers", () => {
  testContract(getUsers, {
    "ユーザーが存在しない": async (assert) => {
      const result = await getUsers(dummyCtx, {
        listUsers: listUsersMock["ユーザーが存在しない"],
      })()
      const ok = assert(result)
      expect(ok.value).toEqual([])
    },
    "登録済みユーザー一覧を取得": async (assert) => {
      const result = await getUsers(dummyCtx, {
        listUsers: listUsersMock["登録済みユーザー一覧を取得"].with_users,
      })()
      const ok = assert(result)
      expect(ok.value).toHaveLength(2)
      expect(ok.value).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Alice" }),
          expect.objectContaining({ name: "Bob" }),
        ]),
      )
    },
  })
})
