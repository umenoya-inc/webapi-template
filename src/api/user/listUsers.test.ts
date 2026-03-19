import { parse } from "valibot"
import { describe, expect } from "vite-plus/test"
import type { DbContext } from "@/db"
import { User, listUsers as dbListUsers } from "@/db/user"
import { mockBehavior, mockEnv, testBehavior } from "@/testing"
import { listUsers } from "./listUsers"

const dummyCtx = {} as DbContext

describe("listUsers", () => {
  const listUsersMock = mockBehavior(dbListUsers, {
    "ユーザーが存在しない": async () => ({
      ok: true,
      value: [],
    }),
    "登録済みユーザー一覧を取得": async () => ({
      ok: true,
      value: [
        parse(User, {
          id: "00000000-0000-0000-0000-000000000001",
          name: "Alice",
          email: "alice@example.com",
        }),
        parse(User, {
          id: "00000000-0000-0000-0000-000000000002",
          name: "Bob",
          email: "bob@example.com",
        }),
      ],
    }),
  })

  testBehavior(listUsers, {
    "一覧取得成功": async (assert) => {
      const env = mockEnv(listUsers, {
        listUsers: listUsersMock["登録済みユーザー一覧を取得"],
      })
      const result = await listUsers(dummyCtx, env)()
      const ok = assert(result)
      expect(ok.value).toHaveLength(2)
      expect(ok.value[0].name).toBe("Alice")
      expect(ok.value[1].name).toBe("Bob")
    },
  })
})
