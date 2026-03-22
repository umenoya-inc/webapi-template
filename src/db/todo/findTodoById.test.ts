import { afterAll, beforeAll, describe, expect } from "vite-plus/test"
import { string } from "fast-check"
import type { DbContext } from "../DbContext"
import { createTestDbContext } from "../testing/createTestDbContext.testutil"
import { rawDb } from "../testing/rawDb.testutil"
import { propertyCheck, testBehavior } from "@/testing"
import { findTodoById } from "./findTodoById"
import { todoTable } from "./todoTable"

const insertTodoRow = (ctx: DbContext, values: { title: string }) =>
  rawDb(ctx).insert(todoTable).values(values).returning()

describe("findTodoById", () => {
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

  testBehavior(findTodoById, {
    "IDに該当するTODOを取得": async (assert) => {
      const [inserted] = await insertTodoRow(ctx, { title: "買い物" })
      const result = await findTodoById({ db: ctx })({ id: inserted.id })
      const todo = assert(result)
      expect(todo.value.id).toBe(inserted.id)
      expect(todo.value.title).toBe("買い物")
    },
    "IDに該当するTODOが存在しない": async (assert) => {
      const result = await findTodoById({ db: ctx })({
        id: "00000000-0000-0000-0000-000000000000",
      })
      assert(result)
    },
    "入力値が不正": propertyCheck(
      findTodoById,
      {
        "IDが不正": { id: string() },
      },
      async (assert, input) => {
        const result = await findTodoById({ db: ctx })(input)
        assert(result)
      },
    ),
  })
})
