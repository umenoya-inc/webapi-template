import { type ObjectEntries, type ObjectSchema, object } from "valibot"
import { inputConfigKey } from "./inputConfigKey"

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * ルートの入力ソース構成を定義し、各ソースのスキーマをマージした単一の object スキーマを返す。
 *
 * 返却されるスキーマは通常の valibot object スキーマとして `defineRouteContract` の `input` に渡せる。
 * 内部的に `inputConfigKey` シンボルで元の構成を保持しており、`defineRoute` がリクエストの
 * 各ソースからフィールドを自動抽出する際に参照する。
 *
 * @example
 * ```typescript
 * // パスパラメータのみ
 * defineRouteContract({
 *   input: routeInput({
 *     params: object({ id: pipe(string(), uuid()) }),
 *   }),
 *   // fn の input は { id: string } として型推論される
 * })
 *
 * // パスパラメータ + ボディ
 * defineRouteContract({
 *   input: routeInput({
 *     params: object({ id: pipe(string(), uuid()) }),
 *     body: object({ title: pipe(string(), minLength(1)) }),
 *   }),
 *   // fn の input は { id: string; title: string }
 * })
 *
 * // 入力なし（GET 一覧エンドポイント等）
 * defineRouteContract({
 *   input: routeInput({}),
 *   // fn の input は {}
 * })
 * ```
 */
export function routeInput<
  TParams extends ObjectEntries = {},
  TQuery extends ObjectEntries = {},
  THeaders extends ObjectEntries = {},
  TBody extends ObjectEntries = {},
>(config: {
  params?: ObjectSchema<TParams, any>
  query?: ObjectSchema<TQuery, any>
  headers?: ObjectSchema<THeaders, any>
  body?: ObjectSchema<TBody, any>
}): ObjectSchema<TParams & TQuery & THeaders & TBody, undefined> {
  const entries: ObjectEntries = {}
  if (config.params) Object.assign(entries, config.params.entries)
  if (config.query) Object.assign(entries, config.query.entries)
  if (config.headers) Object.assign(entries, config.headers.entries)
  if (config.body) Object.assign(entries, config.body.entries)
  const schema = object(entries)
  ;(schema as unknown as Record<symbol, unknown>)[inputConfigKey] = config
  return schema as ObjectSchema<TParams & TQuery & THeaders & TBody, undefined>
}
