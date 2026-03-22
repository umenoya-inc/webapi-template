import { afterAll, beforeAll, describe, expect } from "vite-plus/test"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { createTestDbContext } from "../testing/createTestDbContext.testutil"
import { testBehavior } from "@/testing"
import { listTodos } from "./listTodos"
import { todoTable } from "./todoTable"

const insertTodoRow = (ctx: DbContext, values: { title: string }) => {
  const db = fromDbContext(ctx)
  return db.insert(todoTable).values(values)
}

describe("listTodos", () => {
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

  testBehavior(listTodos, {
    "TODOが存在しない": async (assert) => {
      const result = await listTodos({ db: ctx })()
      const ok = assert(result)
      expect(ok.value).toEqual([])
    },
    "TODO一覧を取得": async (assert) => {
      await insertTodoRow(ctx, { title: "買い物" })
      await insertTodoRow(ctx, { title: "掃除" })

      const result = await listTodos({ db: ctx })()
      const ok = assert(result)
      expect(ok.value).toHaveLength(2)
      expect(ok.value).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: "買い物" }),
          expect.objectContaining({ title: "掃除" }),
        ]),
      )
    },
  })
})
