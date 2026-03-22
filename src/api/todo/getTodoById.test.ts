import { string } from "fast-check"
import { parse } from "valibot"
import { describe, expect } from "vite-plus/test"
import type { DbContext } from "@/db"
import { Todo, findTodoById } from "@/db/todo"
import { mockBehavior, mockService, propertyCheck, testBehavior } from "@/testing"
import { getTodoById } from "./getTodoById"

const dummyCtx = {} as DbContext
const dummyTodoId = "00000000-0000-0000-0000-000000000001"

describe("getTodoById", () => {
  const findTodoByIdMock = mockBehavior(findTodoById, {
    "IDに該当するTODOを取得": async () => ({
      ok: true,
      value: parse(Todo, { id: dummyTodoId, title: "買い物" }),
    }),
    "IDに該当するTODOが存在しない": async () => ({
      ok: false,
      reason: "not_found",
    }),
    "入力値が不正": async () => ({
      ok: false,
      reason: "validation_failed",
      fields: {},
    }),
  })

  testBehavior(getTodoById, {
    "取得成功": async (assert) => {
      const service = mockService(getTodoById, {
        findTodoById: findTodoByIdMock["IDに該当するTODOを取得"],
      })
      const result = await getTodoById(service)({ db: dummyCtx })({ id: dummyTodoId })
      const ok = assert(result)
      expect(ok.value.id).toBe(dummyTodoId)
      expect(ok.value.title).toBe("買い物")
    },
    "TODOが見つからない": async (assert) => {
      const service = mockService(getTodoById, {
        findTodoById: findTodoByIdMock["IDに該当するTODOが存在しない"],
      })
      const result = await getTodoById(service)({ db: dummyCtx })({ id: dummyTodoId })
      assert(result)
    },
    "入力値が不正": propertyCheck(
      getTodoById,
      {
        "IDが不正": { id: string() },
      },
      async (assert, input) => {
        const service = mockService(getTodoById, {
          findTodoById: findTodoByIdMock["入力値が不正"],
        })
        const result = await getTodoById(service)({ db: dummyCtx })(input)
        assert(result)
      },
    ),
  })
})
