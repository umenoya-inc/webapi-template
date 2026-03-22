import { afterAll, beforeAll, describe, expect } from "vite-plus/test"
import { constant } from "fast-check"
import type { DbContext } from "../DbContext"
import { createTestDbContext } from "../testing/createTestDbContext.testutil"
import { propertyCheck, testBehavior } from "@/testing"
import { createTodo } from "./createTodo"
import { todoTable } from "./todoTable"

describe("createTodo", () => {
  let ctx: DbContext
  let cleanup: () => Promise<void>

  beforeAll(async () => {
    const result = await createTestDbContext({ todoTable })
    ctx = result.ctx
    cleanup = result.cleanup
  }, 30000)

  afterAll(async () => {
    await cleanup?.()
  })

  testBehavior(createTodo, {
    "TODOを新規作成": async (assert) => {
      const result = await createTodo({ db: ctx })({ title: "買い物" })
      const ok = assert(result)
      expect(ok.value.title).toBe("買い物")
      expect(ok.value.id).toBeDefined()
    },
    "入力値が不正": propertyCheck(
      createTodo,
      {
        "titleが空": { title: constant("") },
      },
      async (assert, input) => {
        const result = await createTodo({ db: ctx })(input)
        assert(result)
      },
    ),
  })
})
