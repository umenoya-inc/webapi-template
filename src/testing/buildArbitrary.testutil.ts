/**
 * Contract 関数から入力スキーマを取り出し、オーバーライド付きの arbitrary を構築する。
 *
 * valibot-fast-check への依存はこのファイルに閉じる。
 */

import type { BaseIssue, BaseSchema } from "valibot"
import { type Arbitrary, record } from "fast-check"
import { vfc } from "valibot-fast-check"

/* eslint-disable @typescript-eslint/no-explicit-any */

export function buildArbitrary(
  contractFn: (...args: any[]) => any,
  schemaKey: symbol,
  overrides: Record<string, Arbitrary<unknown>>,
): Arbitrary<Record<string, unknown>> {
  const schema = findInputSchema(contractFn, schemaKey)
  if (!schema) {
    throw new Error(
      "propertyCheck: 関数に入力スキーマが見つかりません。defineContract で定義された関数を渡してください。",
    )
  }

  const v = vfc()
  const baseArb = v.inputOf(schema) as Arbitrary<Record<string, unknown>>

  if (Object.keys(overrides).length === 0) {
    return baseArb
  }

  // ベース arbitrary からオブジェクトを生成し、オーバーライドフィールドを差し替える
  return baseArb.chain((base) => {
    const arbRecord: Record<string, Arbitrary<unknown>> = {}
    for (const key of Object.keys(base)) {
      arbRecord[key] =
        key in overrides ? overrides[key] : v.inputOf(extractFieldSchema(schema, key))
    }
    return record(arbRecord)
  })
}

/**
 * 関数から入力スキーマを再帰的に探索する。
 *
 * 型レベルの ExtractBehaviorInput と同じパターンで、
 * 直接スキーマが見つからなければ引数なしで呼び出して内側の関数を探る。
 */
function findInputSchema(
  fn: (...args: any[]) => any,
  schemaKey: symbol,
): BaseSchema<unknown, unknown, BaseIssue<unknown>> | undefined {
  const direct = (fn as unknown as Record<symbol, unknown>)[schemaKey] as
    | BaseSchema<unknown, unknown, BaseIssue<unknown>>
    | undefined
  if (direct) return direct

  // 引数なしで呼び出して内側の関数を探る（defineContract はスキーマ付与のみで副作用なし）
  try {
    const inner = fn()
    if (typeof inner === "function") {
      return findInputSchema(inner, schemaKey)
    }
  } catch {
    // 呼び出しに失敗した場合は探索終了
  }
  return undefined
}

/** object スキーマからフィールドのスキーマを取り出す */
function extractFieldSchema(
  schema: BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  fieldName: string,
): BaseSchema<unknown, unknown, BaseIssue<unknown>> {
  const entries = (schema as any).entries
  if (entries && fieldName in entries) {
    return entries[fieldName]
  }
  throw new Error(`propertyCheck: フィールド "${fieldName}" のスキーマが見つかりません。`)
}
