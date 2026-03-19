/**
 * Contract 関数の末尾引数（env）に渡すモックオブジェクトを型安全に構築する。
 *
 * 第1引数は型推論のアンカーとして使う（実行はしない）。
 * 第2引数に env オブジェクトを渡すと、Contract 関数の末尾引数型と一致するか検証される。
 *
 * ```typescript
 * const env = mockEnv(getUserById, {
 *   findUserById: findUserByIdMock["IDに該当するユーザーを取得"],
 * })
 * const result = await getUserById(dummyCtx, env)({ id: dummyUserId })
 * ```
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/** 関数の末尾引数の型を抽出する（オプショナル引数にも対応） */
type LastArg<F> = F extends (...args: infer P) => any
  ? Required<P> extends [...any[], infer L]
    ? L
    : never
  : never

export const mockEnv = <F extends (...args: any[]) => any>(_fn: F, env: LastArg<F>): LastArg<F> =>
  env
