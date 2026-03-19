/**
 * defineContract が返す関数に入力スキーマを付与するためのシンボルキー。
 *
 * propertyCheck がスキーマからベース arbitrary を生成する際に使用する。
 */
export const inputSchemaKey: unique symbol = Symbol("inputSchema")
