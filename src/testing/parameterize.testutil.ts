/**
 * 同じ振る舞いパスに対して複数の入力パターンをテストするパラメタライズドテストを定義する。
 *
 * testBehavior の各ラベルに渡すことで、params の各エントリが個別テストとして実行される。
 * 生成されるテスト名: `"ラベル: パラメータ名"`
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export function parameterize<TParam>(
  params: Record<string, TParam>,
  test: (assert: (result: any) => unknown, param: TParam) => Promise<void> | void,
): { __parameterize: true; params: Record<string, TParam>; test: typeof test } {
  return { __parameterize: true, params, test }
}
