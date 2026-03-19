/**
 * エラー値に説明ラベルを付与するファントム型。
 *
 * ランタイムには影響せず、型レベルでのみ意味を持つ。
 * failAs と組み合わせて使用する。
 */
export type Desc<Label extends string, T> = T & { readonly __desc?: Label }
