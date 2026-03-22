import { array, object, pipe, string, uuid } from "valibot"
import { matchBehavior, okAs } from "@/behavior"
import { listTodos as dbListTodos } from "@/db/todo"
import { defineEffect } from "@/effect"
import { defineRouteContract } from "../defineRouteContract"

/** TODO 一覧取得 API のハンドラロジック。 */
export const listTodos = defineEffect(
  { service: { listTodos: dbListTodos } },
  (service) => (context) =>
    defineRouteContract({
      output: array(
        object({
          id: pipe(string(), uuid()),
          title: string(),
        }),
      ),
      responses: {
        "一覧取得成功": { status: 200, description: "TODO 一覧を取得" },
      },
      fn: async () =>
        matchBehavior(await service.listTodos(context)(), {
          success: (r) =>
            okAs("一覧取得成功", {
              value: r.value.map((t) => ({ id: t.id, title: t.title })),
            }),
        }),
    }),
)
