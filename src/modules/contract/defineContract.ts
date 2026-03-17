import {
  type BaseIssue,
  type BaseSchema,
  type InferInput,
  type InferIssue,
  type InferOutput,
  safeParse,
} from "valibot"

type ContractOptions<
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnResult,
  TInputError,
> = {
  input: TInputSchema
  output: TOutputSchema
  onInputError: (issues: InferIssue<TInputSchema>[]) => TInputError
  fn: (input: InferOutput<TInputSchema>) => Promise<TFnResult>
}

export const defineContract = <
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnResult,
  TInputError,
>(
  options: ContractOptions<TInputSchema, TOutputSchema, TFnResult, TInputError>,
): ((input: InferInput<TInputSchema>) => Promise<TFnResult | TInputError>) => {
  return async (rawInput) => {
    const parsed = safeParse(options.input, rawInput)
    if (!parsed.success) {
      return options.onInputError([...parsed.issues])
    }

    const result = await options.fn(parsed.output)

    if (process.env["NODE_ENV"] === "test") {
      const outputParsed = safeParse(options.output, result)
      if (!outputParsed.success) {
        throw new Error(`Contract output validation failed: ${JSON.stringify(outputParsed.issues)}`)
      }
    }

    return result
  }
}
