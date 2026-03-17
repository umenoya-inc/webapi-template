import {
  type BaseIssue,
  type BaseSchema,
  type InferInput,
  type InferIssue,
  type InferOutput,
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

type ContractOptions<
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

export const defineContract = <
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnError extends FailureResult,
  TInputError,
>(
  options: ContractOptions<TInputSchema, TOutputSchema, TFnError, TInputError>,
): ((
  input: InferInput<TInputSchema>,
) => Promise<ContractResult<TOutputSchema, TFnError, TInputError>>) => {
  return async (rawInput) => {
    const inputParsed = safeParse(options.input, rawInput)
    if (!inputParsed.success) {
      return options.onInputError(inputParsed.issues)
    }

    const result = await options.fn(inputParsed.output)

    if (!result.ok) {
      return result
    }

    return { ok: true, value: parse(options.output, result.value) }
  }
}
