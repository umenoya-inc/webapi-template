/**
 * defineRouteContract が返す関数に responses マップを付与するためのシンボルキー。
 *
 * defineRoute が Desc ラベルからステータスコードを引く際に使用する。
 */
export const responsesKey: unique symbol = Symbol("responses")
