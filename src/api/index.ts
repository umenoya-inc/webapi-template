/**
 * @packageDocumentation
 * ## api モジュール
 *
 * HTTP API のハンドラロジックとルート定義を提供する。
 * 各ドメインはサブモジュールとして構成される。
 *
 * ### エクスポート
 *
 * - `defineRoute` — ハンドラ関数から OpenAPI 付きルートハンドラを生成する
 * - `defineRouteContract` — ルート専用コントラクト（defineContract + responses マップ）
 *
 * @dependencies db/**, behavior, contract
 */

export { defineRoute } from "./defineRoute"
export { defineRouteContract } from "./defineRouteContract"
