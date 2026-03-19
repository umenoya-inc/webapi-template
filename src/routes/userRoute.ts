import { email, maxLength, minLength, object, pipe, string, uuid } from "valibot"
import { Hono } from "hono"
import { describeRoute, resolver, validator } from "hono-openapi"
import { matchBehavior } from "@/behavior"
import { globalDbContext } from "@/db"
import { postUser } from "./postUser"

/** API レスポンス: ユーザー */
const UserResponse = object({
  id: pipe(string(), uuid()),
  name: string(),
  email: pipe(string(), email()),
})

/** API リクエスト: ユーザー作成 */
const CreateUserRequest = object({
  name: pipe(string(), minLength(1), maxLength(100)),
  email: pipe(string(), email()),
})

export const userRoute = new Hono()

userRoute.post(
  "/",
  describeRoute({
    description: "ユーザーを新規作成する",
    responses: {
      201: {
        description: "作成成功",
        content: { "application/json": { schema: resolver(UserResponse) } },
      },
      400: {
        description: "入力値が不正",
      },
      409: {
        description: "メールアドレスが既に使用されている",
      },
    },
  }),
  validator("json", CreateUserRequest),
  async (c) => {
    const result = await postUser(globalDbContext)(c.req.valid("json"))
    return matchBehavior(result, {
      success: (r) => c.json(r.value, 201),
      conflict: () => c.json({ error: "email_already_exists" }, 409),
      bad_request: (r) => c.json({ error: "validation_failed", fields: r.fields }, 400),
    }) as Response
  },
)
