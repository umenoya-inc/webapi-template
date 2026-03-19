import type { BaseIssue, BaseSchema, InferInput, InferIssue, InferOutput } from "valibot"
import type { BehaviorBrand, Desc } from "@/behavior"
import { defineBehavior } from "@/behavior"
import { inputSchemaKey } from "./inputSchemaKey"
import { withSchema } from "./withSchema"

type DefaultInputError = Desc<
  "入力値が不正",
  {
    ok: false
    reason: "validation_failed"
    fields: Record<string, unknown>
  }
>

type ExtractFailure<T> = Extract<T, { ok: false }>

/** fn の ok:true 返却の Desc ラベルを保持したまま value 型を置換する（分配型） */
type ReplaceOkValue<T, V> =
  T extends Desc<infer L, { ok: true; value: unknown }> ? Desc<L, { ok: true; value: V }> : never

type ContractOptionsWithInputError<
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnReturn,
  TInputError,
> = {
  input: TInputSchema
  output: TOutputSchema
  onInputError: (issues: [InferIssue<TInputSchema>, ...InferIssue<TInputSchema>[]]) => TInputError
  fn: (input: InferOutput<TInputSchema>) => Promise<TFnReturn>
}

type ContractOptionsWithDefaultInputError<
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnReturn,
> = {
  input: TInputSchema
  output: TOutputSchema
  fn: (input: InferOutput<TInputSchema>) => Promise<TFnReturn>
}

type ContractOptionsWithoutInput<
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnReturn,
> = {
  output: TOutputSchema
  fn: () => Promise<TFnReturn>
}

// input + custom onInputError
export function defineContract<
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnReturn extends
    | Desc<string, { ok: true; value: InferInput<TOutputSchema> }>
    | Desc<string, { ok: false }>,
  TInputError,
>(
  options: ContractOptionsWithInputError<TInputSchema, TOutputSchema, TFnReturn, TInputError>,
): ((
  input: InferInput<TInputSchema>,
) => Promise<
  ReplaceOkValue<TFnReturn, InferOutput<TOutputSchema>> | ExtractFailure<TFnReturn> | TInputError
>) &
  BehaviorBrand

// input + default onInputError
export function defineContract<
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnReturn extends
    | Desc<string, { ok: true; value: InferInput<TOutputSchema> }>
    | Desc<string, { ok: false }>,
>(
  options: ContractOptionsWithDefaultInputError<TInputSchema, TOutputSchema, TFnReturn>,
): ((
  input: InferInput<TInputSchema>,
) => Promise<
  | ReplaceOkValue<TFnReturn, InferOutput<TOutputSchema>>
  | ExtractFailure<TFnReturn>
  | DefaultInputError
>) &
  BehaviorBrand

// no input
export function defineContract<
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnReturn extends
    | Desc<string, { ok: true; value: InferInput<TOutputSchema> }>
    | Desc<string, { ok: false }>,
>(
  options: ContractOptionsWithoutInput<TOutputSchema, TFnReturn>,
): (() => Promise<
  ReplaceOkValue<TFnReturn, InferOutput<TOutputSchema>> | ExtractFailure<TFnReturn>
>) &
  BehaviorBrand

export function defineContract(options: {
  input?: BaseSchema<unknown, unknown, BaseIssue<unknown>>
  output: BaseSchema<unknown, unknown, BaseIssue<unknown>>
  onInputError?: (issues: [BaseIssue<unknown>, ...BaseIssue<unknown>[]]) => unknown
  fn: (input?: unknown) => Promise<{ ok: true; value: unknown } | { ok: false; reason: string }>
}) {
  const fn = defineBehavior(withSchema(options as Parameters<typeof withSchema>[0]) as any)
  if (options.input) {
    ;(fn as Record<symbol, unknown>)[inputSchemaKey] = options.input
  }
  return fn
}
