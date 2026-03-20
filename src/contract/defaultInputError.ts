import type { BaseIssue } from "valibot"
import { flatten } from "valibot"
import type { Desc, InputScenarios } from "@/behavior"
import { failAs } from "@/behavior"

type DefaultInputError = Desc<
  "入力値が不正",
  {
    ok: false
    reason: "validation_failed"
    fields: Record<string, unknown>
  }
>

/**
 * デフォルトの onInputError ハンドラにシナリオラベルを付与して返す。
 *
 * バリデーション失敗時の戻り値は通常の DefaultInputError と同じだが、
 * InputScenarios ブランドが付与されるため、testBehavior の parameterize で
 * シナリオラベルがパラメータキーとして強制される。
 */
export function defaultInputError<const TScenarios extends readonly string[]>(
  scenarios: TScenarios,
): (
  issues: [BaseIssue<unknown>, ...BaseIssue<unknown>[]],
) => InputScenarios<DefaultInputError, TScenarios[number]> {
  return (issues) =>
    failAs({ desc: "入力値が不正", scenarios }, "validation_failed", {
      fields: flatten(issues).nested ?? {},
    })
}
