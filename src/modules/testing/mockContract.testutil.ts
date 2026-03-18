/**
 * defineContract ベースの関数に対する振る舞い別モックを定義する。
 *
 * 第1引数は型推論のアンカーとして使う（実行はしない）。
 * 第2引数に振る舞い名をキーとしたモック実装を渡す。
 * 各モック実装は `(input) => Promise<Result>` のシグネチャで、ctx のボイラープレートは不要。
 *
 * 戻り値は振る舞い名をキーとする、元の関数と同じ型のモックオブジェクト。
 */

type ContractFn<F> = F extends (...args: never[]) => infer Inner ? Inner : never
type ContractInput<F> = ContractFn<F> extends (input: infer I) => unknown ? I : never
type ContractResult<F> = ContractFn<F> extends (input: never) => infer R ? R : never

export const mockContract = <
  F extends (...args: never[]) => (input: never) => Promise<unknown>,
  B extends Record<string, (input: ContractInput<F>) => ContractResult<F>>,
>(
  _fn: F,
  behaviors: B,
): { [K in keyof B]: F } => {
  const result = {} as Record<string, unknown>
  for (const key of Object.keys(behaviors)) {
    result[key] = () => behaviors[key]
  }
  return result as { [K in keyof B]: F }
}
