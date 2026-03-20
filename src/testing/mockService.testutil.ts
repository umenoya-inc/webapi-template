import type { EffectBrand, ResolvedService, ProvideService } from "@/effect"

/* eslint-disable @typescript-eslint/no-explicit-any */

/** DirectService の各エントリを `(context) => Fn` 型にマップする。 */
type MockServiceEntries<E> =
  E extends EffectBrand<any, infer Direct, any, any>
    ? {
        [K in keyof Direct]: Direct[K] extends EffectBrand<any, any, infer C, infer Fn>
          ? (context: C) => Fn
          : never
      }
    : never

/**
 * Effect 用のモック service を構築する。
 *
 * 第1引数は型推論のアンカーとして使う（実行はしない）。
 * 第2引数に直接依存の mockBehavior エントリを渡す。
 * mockBehavior のモックは `() => mockFn` として既にラップ済みなので、そのまま `(context) => Fn` として使える。
 *
 * ```typescript
 * const service = mockService(postUser, {
 *   createUser: createUserMock["ユーザーを新規作成"],
 * })
 * const result = await postUser(service)({ db: dummyCtx })(input)
 * ```
 */
export const mockService = <E extends ((...args: any[]) => any) & EffectBrand<any, any, any, any>>(
  _effect: E,
  entries: MockServiceEntries<E>,
): ResolvedService<ProvideService<E>> => {
  return entries as unknown as ResolvedService<ProvideService<E>>
}
