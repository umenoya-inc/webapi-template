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

type OkResult<T> = { ok: true; value: T }

type DefaultInputError = {
  ok: false
  reason: "validation_failed"
  fields: Record<string, unknown>
}

type ExtractFailure<T> = Extract<T, { ok: false }>

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

type ContractOptionsWithoutInputError<
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnReturn,
> = {
  input: TInputSchema
  output: TOutputSchema
  fn: (input: InferOutput<TInputSchema>) => Promise<TFnReturn>
}

export function defineContract<
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnReturn extends OkResult<InferInput<TOutputSchema>> | { ok: false },
  TInputError,
>(
  options: ContractOptionsWithInputError<TInputSchema, TOutputSchema, TFnReturn, TInputError>,
): (
  input: InferInput<TInputSchema>,
) => Promise<OkResult<InferOutput<TOutputSchema>> | ExtractFailure<TFnReturn> | TInputError>

export function defineContract<
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnReturn extends OkResult<InferInput<TOutputSchema>> | { ok: false },
>(
  options: ContractOptionsWithoutInputError<TInputSchema, TOutputSchema, TFnReturn>,
): (
  input: InferInput<TInputSchema>,
) => Promise<OkResult<InferOutput<TOutputSchema>> | ExtractFailure<TFnReturn> | DefaultInputError>

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
