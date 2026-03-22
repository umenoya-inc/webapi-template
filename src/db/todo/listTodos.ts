import { array } from "valibot"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { okAs } from "@/behavior"
import { defineContract } from "@/contract"
import { requiredContext, defineEffect } from "@/effect"
import { Todo } from "./Todo"
import { todoTable } from "./todoTable"

/** TODO 一覧を取得する。 */
export const listTodos = defineEffect(
  { context: requiredContext<{ db: DbContext }>() },
  (context) =>
    defineContract({
      output: array(Todo),
      fn: async () => {
        const db = fromDbContext(context.db)
        const rows = await db.query((q) => q.select().from(todoTable))
        if (rows.length === 0) {
          return okAs("TODOが存在しない", { value: [] })
        }
        return okAs("TODO一覧を取得", {
          value: rows.map((row) => ({ id: row.id, title: row.title })),
        })
      },
    }),
)
