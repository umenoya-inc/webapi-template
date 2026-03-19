declare const descBrand: unique symbol

/**
 * 値に説明ラベルを付与するブランド型。
 *
 * ランタイムには影響せず、型レベルでのみ意味を持つ。
 * failAs / okAs の戻り値型として使われ、
 * defineBehavior の fn 内で素のオブジェクトリテラル返却を型エラーにする。
 */
export type Desc<Label extends string, T> = T & { readonly [descBrand]: Label }
