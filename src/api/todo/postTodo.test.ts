import { constant } from "fast-check"
import { parse } from "valibot"
import { describe, expect } from "vite-plus/test"
import type { DbContext } from "@/db"
import { Todo, createTodo } from "@/db/todo"
import { mockBehavior, mockService, propertyCheck, testBehavior } from "@/testing"
import { postTodo } from "./postTodo"

const dummyCtx = {} as DbContext
const dummyTodoId = "00000000-0000-0000-0000-000000000001"

describe("postTodo", () => {
  const createTodoMock = mockBehavior(createTodo, {
    "TODOを新規作成": async (input) => ({
      ok: true,
      value: parse(Todo, { id: dummyTodoId, title: input.title }),
    }),
    "入力値が不正": async () => ({
      ok: false,
      reason: "validation_failed",
      fields: {},
    }),
  })

  testBehavior(postTodo, {
    "作成成功": async (assert) => {
      const service = mockService(postTodo, {
        createTodo: createTodoMock["TODOを新規作成"],
      })
      const result = await postTodo(service)({ db: dummyCtx })({ title: "買い物" })
      const ok = assert(result)
      expect(ok.value.title).toBe("買い物")
      expect(ok.value.id).toBe(dummyTodoId)
    },
    "入力値が不正": propertyCheck(
      postTodo,
      {
        "titleが空": { title: constant("") },
      },
      async (assert, input) => {
        const service = mockService(postTodo, {
          createTodo: createTodoMock["入力値が不正"],
        })
        const result = await postTodo(service)({ db: dummyCtx })(input)
        assert(result)
      },
    ),
  })
})
