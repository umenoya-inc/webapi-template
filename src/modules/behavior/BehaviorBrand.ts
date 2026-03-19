declare const behaviorBrand: unique symbol

/** defineBehavior の戻り値に付与されるブランド型。testBehavior / mockBehavior が再帰的に検出する。 */
export type BehaviorBrand = { readonly [behaviorBrand]: true }
