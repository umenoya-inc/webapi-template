declare const inputScenariosBrand: unique symbol

/**
 * Desc に入力シナリオのラベルを付与するブランド型。
 *
 * ランタイムには影響せず、型レベルでのみ意味を持つ。
 * failAs / okAs の戻り値、または defineContract の DefaultInputError に付与される。
 * testBehavior の parameterize で、シナリオラベルがパラメータキーとして強制される。
 */
export type InputScenarios<T, S extends string> = T & { readonly [inputScenariosBrand]: S }
