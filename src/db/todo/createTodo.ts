import { minLength, object, pipe, string } from "valibot"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { okAs } from "@/behavior"
import { defaultInputError, defineContract } from "@/contract"
import { requiredContext, defineEffect } from "@/effect"
import { Todo } from "./Todo"
import { todoTable } from "./todoTable"

/** TODO を新規作成する。 */
export const createTodo = defineEffect(
  { context: requiredContext<{ db: DbContext }>() },
  (context) =>
    defineContract({
      input: object({
        title: pipe(string(), minLength(1)),
      }),
      output: Todo,
      onInputError: defaultInputError(["titleが空"]),
      fn: async (input) => {
        const db = fromDbContext(context.db)
        const result = await db.execute((q) =>
          q.insert(todoTable).values({ title: input.title }).returning(),
        )
        if (!result.ok) {
          throw new Error("Unexpected database error", { cause: result.error })
        }
        const row = result.value[0]
        return okAs("TODOを新規作成", {
          value: { id: row.id, title: row.title },
        })
      },
    }),
)
