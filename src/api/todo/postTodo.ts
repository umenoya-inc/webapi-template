import { minLength, object, pipe, string, uuid } from "valibot"
import { failAs, matchBehavior, okAs } from "@/behavior"
import { defaultInputError } from "@/contract"
import { createTodo } from "@/db/todo"
import { defineEffect } from "@/effect"
import { defineRouteContract } from "../defineRouteContract"

/** TODO 作成 API のハンドラロジック。 */
export const postTodo = defineEffect(
  { service: { createTodo } },
  (service) => (context) =>
    defineRouteContract({
      input: object({
        title: pipe(string(), minLength(1)),
      }),
      output: object({
        id: pipe(string(), uuid()),
        title: string(),
      }),
      onInputError: defaultInputError(["titleが空"]),
      responses: {
        "作成成功": { status: 201, description: "TODO を新規作成" },
        "入力値が不正": { status: 400, description: "入力値が不正" },
      },
      fn: async (input) =>
        matchBehavior(await service.createTodo(context)(input), {
          success: (r) =>
            okAs("作成成功", {
              value: { id: r.value.id, title: r.value.title },
            }),
          validation_failed: (r) => failAs("入力値が不正", "bad_request", { fields: r.fields }),
        }),
    }),
)
