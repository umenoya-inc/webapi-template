import { object, pipe, string, uuid } from "valibot"
import { eq } from "drizzle-orm"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { failAs, okAs } from "@/behavior"
import { defaultInputError, defineContract } from "@/contract"
import { requiredContext, defineEffect } from "@/effect"
import { Todo } from "./Todo"
import { todoTable } from "./todoTable"

/** ID を指定して TODO を取得する。 */
export const findTodoById = defineEffect(
  { context: requiredContext<{ db: DbContext }>() },
  (context) =>
    defineContract({
      input: object({
        id: pipe(string(), uuid()),
      }),
      output: Todo,
      onInputError: defaultInputError(["IDが不正"]),
      fn: async (input) => {
        const db = fromDbContext(context.db)
        const rows = await db.select().from(todoTable).where(eq(todoTable.id, input.id))
        if (rows.length === 0) {
          return failAs("IDに該当するTODOが存在しない", "not_found")
        }
        const row = rows[0]
        return okAs("IDに該当するTODOを取得", {
          value: { id: row.id, title: row.title },
        })
      },
    }),
)
