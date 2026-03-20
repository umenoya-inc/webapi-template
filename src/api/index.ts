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
 * - `routeInput` — ルート入力のソース構成を定義する（params / query / headers / body）
 *
 * @dependencies db/**, behavior, contract, effect
 */

export { defineRoute } from "./defineRoute"
export { defineRouteContract } from "./defineRouteContract"
export { routeInput } from "./routeInput"
