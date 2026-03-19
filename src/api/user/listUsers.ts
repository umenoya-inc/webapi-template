import { array, email, object, pipe, string, uuid } from "valibot"
import { matchBehavior, okAs } from "@/behavior"
import { listUsers as dbListUsers } from "@/db/user"
import { defineRouteContract } from "../defineRouteContract"

/** ユーザー一覧取得 API のハンドラロジック。 */
export const listUsers = (
  ctx: Parameters<typeof dbListUsers>[0],
  env: { listUsers: typeof dbListUsers } = { listUsers: dbListUsers },
) =>
  defineRouteContract({
    output: array(
      object({
        id: pipe(string(), uuid()),
        name: string(),
        email: pipe(string(), email()),
      }),
    ),
    responses: {
      "一覧取得成功": { status: 200, description: "ユーザー一覧を取得" },
    },
    fn: async () =>
      matchBehavior(await env.listUsers(ctx)(), {
        success: (r) =>
          okAs("一覧取得成功", {
            value: r.value.map((u) => ({ id: u.id, name: u.name, email: u.email })),
          }),
      }),
  })
