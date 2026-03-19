import type { DbContext } from "@/db"
import { defineBehavior, failAs, okAs } from "@/behavior"
import { registerUser } from "@/domain/user"

/** ユーザー作成 API のハンドラロジック。 */
export const postUser = (ctx: DbContext) =>
  defineBehavior(async (input: { name: string; email: string }) => {
    const result = await registerUser(ctx)(input)
    if (!result.ok) {
      if (result.reason === "duplicate_entry") {
        return failAs("メールアドレスが重複", "conflict")
      }
      return failAs("入力値が不正", "bad_request", { fields: result.fields })
    }
    return okAs("作成成功", {
      id: result.value.id,
      name: result.value.name,
      email: result.value.email,
    })
  })
