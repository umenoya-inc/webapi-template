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
import type { ReasonedFallible } from "@/types/ReasonedFallible"

type OkResult<T> = { ok: true; value: T }
type FailureResult = Extract<ReasonedFallible, { ok: false }>
type FnResult<TRawValue, TFnError extends FailureResult> = OkResult<TRawValue> | TFnError

type ContractResult<
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnError extends FailureResult,
  TInputError,
> = OkResult<InferOutput<TOutputSchema>> | TFnError | TInputError

type DefaultInputError = {
  ok: false
  reason: "validation_failed"
  fields: Record<string, unknown>
}

type ContractOptionsWithInputError<
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnError extends FailureResult,
  TInputError,
> = {
  input: TInputSchema
  output: TOutputSchema
  onInputError: (issues: [InferIssue<TInputSchema>, ...InferIssue<TInputSchema>[]]) => TInputError
  fn: (input: InferOutput<TInputSchema>) => Promise<FnResult<InferInput<TOutputSchema>, TFnError>>
}

type ContractOptionsWithoutInputError<
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnError extends FailureResult,
> = {
  input: TInputSchema
  output: TOutputSchema
  fn: (input: InferOutput<TInputSchema>) => Promise<FnResult<InferInput<TOutputSchema>, TFnError>>
}

export function defineContract<
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnError extends FailureResult,
  TInputError,
>(
  options: ContractOptionsWithInputError<TInputSchema, TOutputSchema, TFnError, TInputError>,
): (
  input: InferInput<TInputSchema>,
) => Promise<ContractResult<TOutputSchema, TFnError, TInputError>>

export function defineContract<
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnError extends FailureResult,
>(
  options: ContractOptionsWithoutInputError<TInputSchema, TOutputSchema, TFnError>,
): (
  input: InferInput<TInputSchema>,
) => Promise<ContractResult<TOutputSchema, TFnError, DefaultInputError>>

export function defineContract(options: {
  input: BaseSchema<unknown, unknown, BaseIssue<unknown>>
  output: BaseSchema<unknown, unknown, BaseIssue<unknown>>
  onInputError?: (issues: [BaseIssue<unknown>, ...BaseIssue<unknown>[]]) => unknown
  fn: (input: unknown) => Promise<{ ok: true; value: unknown } | { ok: false; reason: string }>
}) {
  const onInputError =
    options.onInputError ??
    ((issues: [BaseIssue<unknown>, ...BaseIssue<unknown>[]]) => ({
      ok: false as const,
      reason: "validation_failed" as const,
      fields: flatten(issues).nested ?? {},
    }))

  return async (rawInput: unknown) => {
    const inputParsed = safeParse(options.input, rawInput)
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
