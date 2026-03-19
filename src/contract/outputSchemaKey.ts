/**
 * defineContract が返す関数に出力スキーマを付与するためのシンボルキー。
 *
 * defineRoute がスキーマから OpenAPI ドキュメントを生成する際に使用する。
 */
export const outputSchemaKey: unique symbol = Symbol("outputSchema")
