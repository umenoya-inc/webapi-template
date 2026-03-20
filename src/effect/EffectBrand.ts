declare const effectBrand: unique symbol

/** defineEffect の戻り値に付与されるブランド型。service / context / fn 型を抽出可能にする。 */
export type EffectBrand<
  Service extends Record<string, unknown>,
  DirectService extends Record<string, unknown>,
  Context extends Record<string, unknown>,
  Fn,
> = {
  readonly [effectBrand]: {
    service: Service
    directService: DirectService
    context: Context
    fn: Fn
  }
}
