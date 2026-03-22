/**
 * defineEffect が定義時に fn をダミー実行して得た結果関数を格納するシンボルキー。
 *
 * Effect を実行せずに、最終的に返される関数のメタデータ（シンボルキー等）を
 * 静的に参照するために使用する。
 */
export const effectResultKey: unique symbol = Symbol("effectResult")
