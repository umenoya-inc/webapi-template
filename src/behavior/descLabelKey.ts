/**
 * okAs / failAs が返すオブジェクトに Desc ラベル文字列を保持するためのシンボルキー。
 *
 * defineRouteContract の responses マップからステータスコードを引く際に使用する。
 */
export const descLabelKey: unique symbol = Symbol("descLabel")
