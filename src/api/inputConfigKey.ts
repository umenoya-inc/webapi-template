/**
 * routeInput が返すスキーマに入力ソース構成を付与するためのシンボルキー。
 *
 * defineRoute がリクエストの各ソース（params / query / headers / body）から
 * フィールドを抽出する際に使用する。
 */
export const inputConfigKey: unique symbol = Symbol("inputConfig")
