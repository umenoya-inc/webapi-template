import { parse } from "valibot"
import { describe, expect } from "vite-plus/test"
import type { DbContext } from "@/db"
import { Todo, listTodos as dbListTodos } from "@/db/todo"
import { mockBehavior, mockService, testBehavior } from "@/testing"
import { listTodos } from "./listTodos"

const dummyCtx = {} as DbContext

describe("listTodos", () => {
  const listTodosMock = mockBehavior(dbListTodos, {
    "TODOが存在しない": async () => ({
      ok: true,
      value: [],
    }),
    "TODO一覧を取得": async () => ({
      ok: true,
      value: [
        parse(Todo, { id: "00000000-0000-0000-0000-000000000001", title: "買い物" }),
        parse(Todo, { id: "00000000-0000-0000-0000-000000000002", title: "掃除" }),
      ],
    }),
  })

  testBehavior(listTodos, {
    "一覧取得成功": async (assert) => {
      const service = mockService(listTodos, {
        listTodos: listTodosMock["TODO一覧を取得"],
      })
      const result = await listTodos(service)({ db: dummyCtx })()
      const ok = assert(result)
      expect(ok.value).toHaveLength(2)
      expect(ok.value[0].title).toBe("買い物")
      expect(ok.value[1].title).toBe("掃除")
    },
  })
})
