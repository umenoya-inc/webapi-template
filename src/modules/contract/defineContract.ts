import {
  type BaseIssue,
  type BaseSchema,
  type InferInput,
  type InferIssue,
  type InferOutput,
  flatten,
  parse,
  safeParse,
} from "valibot"
import type { Desc } from "./Desc"
import { failAs } from "./failAs"

type DefaultInputError = Desc<
  "入力値が不正",
  {
    ok: false
    reason: "validation_failed"
    fields: Record<string, unknown>
  }
>

type ExtractFailure<T> = Extract<T, { ok: false }>

type ExtractOkLabel<T> = T extends Desc<infer L, { ok: true }> ? L : never

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
): (
  input: InferInput<TInputSchema>,
) => Promise<
  | Desc<ExtractOkLabel<TFnReturn>, { ok: true; value: InferOutput<TOutputSchema> }>
  | ExtractFailure<TFnReturn>
  | TInputError
>

// input + default onInputError
export function defineContract<
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnReturn extends
    | Desc<string, { ok: true; value: InferInput<TOutputSchema> }>
    | Desc<string, { ok: false }>,
>(
  options: ContractOptionsWithDefaultInputError<TInputSchema, TOutputSchema, TFnReturn>,
): (
  input: InferInput<TInputSchema>,
) => Promise<
  | Desc<ExtractOkLabel<TFnReturn>, { ok: true; value: InferOutput<TOutputSchema> }>
  | ExtractFailure<TFnReturn>
  | DefaultInputError
>

// no input
export function defineContract<
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnReturn extends
    | Desc<string, { ok: true; value: InferInput<TOutputSchema> }>
    | Desc<string, { ok: false }>,
>(
  options: ContractOptionsWithoutInput<TOutputSchema, TFnReturn>,
): () => Promise<
  | Desc<ExtractOkLabel<TFnReturn>, { ok: true; value: InferOutput<TOutputSchema> }>
  | ExtractFailure<TFnReturn>
>

export function defineContract(options: {
  input?: BaseSchema<unknown, unknown, BaseIssue<unknown>>
  output: BaseSchema<unknown, unknown, BaseIssue<unknown>>
  onInputError?: (issues: [BaseIssue<unknown>, ...BaseIssue<unknown>[]]) => unknown
  fn: (input?: unknown) => Promise<{ ok: true; value: unknown } | { ok: false; reason: string }>
}) {
  const onInputError =
    options.onInputError ??
    ((issues: [BaseIssue<unknown>, ...BaseIssue<unknown>[]]) =>
      failAs("入力値が不正", "validation_failed", { fields: flatten(issues).nested ?? {} }))

  if (!options.input) {
    return async () => {
      const result = await options.fn()
      if (!result.ok) {
        return result
      }
      return { ok: true, value: parse(options.output, result.value) }
    }
  }

  const inputSchema = options.input
  return async (rawInput: unknown) => {
    const inputParsed = safeParse(inputSchema, rawInput)
    if (!inputParsed.success) {
      return onInputError(inputParsed.issues)
    }

    const result = await options.fn(inputParsed.output)

    if (!result.ok) {
      return result
    }

    return { ok: true, value: parse(options.output, result.value) }
  }
}
