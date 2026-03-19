declare const contractBrand: unique symbol

/** defineContract の戻り値に付与されるブランド型。testContract / mockContract が再帰的に検出する。 */
export type ContractBrand = { readonly [contractBrand]: true }
