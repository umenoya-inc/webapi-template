/**
 * Contract 関数の env パラメータに渡すモックオブジェクトを型安全に構築する。
 *
 * 第1引数は型推論のアンカーとして使う（実行はしない）。
 * 第2引数に env オブジェクトを渡すと、Contract 関数の第2引数型と一致するか検証される。
 *
 * ```typescript
 * const env = mockEnv(getUserById, {
 *   findUserById: findUserByIdMock["IDに該当するユーザーを取得"],
 * })
 * const result = await getUserById(dummyCtx, env)({ id: dummyUserId })
 * ```
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

type ContractEnv<F> = F extends (ctx: any, env: infer E) => any ? E : never

export const mockEnv = <F extends (...args: any[]) => any>(
  _fn: F,
  env: ContractEnv<F>,
): ContractEnv<F> => env
