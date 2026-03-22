import { object, pipe, string, uuid } from "valibot"
import { failAs, matchBehavior, okAs } from "@/behavior"
import { defaultInputError } from "@/contract"
import { findTodoById } from "@/db/todo"
import { defineEffect } from "@/effect"
import { defineRouteContract } from "../defineRouteContract"
import { routeInput } from "../routeInput"

/** TODO 取得 API のハンドラロジック。 */
export const getTodoById = defineEffect(
  { service: { findTodoById } },
  (service) => (context) =>
    defineRouteContract({
      input: routeInput({
        params: object({ id: pipe(string(), uuid()) }),
      }),
      output: object({
        id: pipe(string(), uuid()),
        title: string(),
      }),
      onInputError: defaultInputError(["IDが不正"]),
      responses: {
        "取得成功": { status: 200, description: "TODO を取得" },
        "TODOが見つからない": { status: 404, description: "指定された ID の TODO が存在しない" },
        "入力値が不正": { status: 400, description: "入力値が不正" },
      },
      fn: async (input) =>
        matchBehavior(await service.findTodoById(context)(input), {
          success: (r) =>
            okAs("取得成功", {
              value: { id: r.value.id, title: r.value.title },
            }),
          not_found: () => failAs("TODOが見つからない", "not_found"),
          validation_failed: (r) => failAs("入力値が不正", "bad_request", { fields: r.fields }),
        }),
    }),
)
