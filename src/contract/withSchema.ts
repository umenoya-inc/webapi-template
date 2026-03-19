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
import type { Desc } from "@/behavior"
import { failAs } from "@/behavior"

type ExtractFailure<T> = Extract<T, { ok: false }>

/** fn の ok:true 返却の Desc ラベルを保持したまま value 型を置換する（分配型、value 以外のフィールドは保持） */
type ReplaceOkValue<T, V> =
  T extends Desc<infer L, infer U>
    ? U extends { ok: true; value: unknown }
      ? Desc<L, Omit<U, "value"> & { value: V }>
      : never
    : never

// input + onInputError（input がある場合 onInputError は必須）
export function withSchema<
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnReturn extends
    | Desc<string, { ok: true; value: InferInput<TOutputSchema> }>
    | Desc<string, { ok: false }>,
  TInputError,
>(options: {
  input: TInputSchema
  output: TOutputSchema
  onInputError: (issues: [InferIssue<TInputSchema>, ...InferIssue<TInputSchema>[]]) => TInputError
  fn: (input: InferOutput<TInputSchema>) => Promise<TFnReturn>
}): (
  input: InferInput<TInputSchema>,
) => Promise<
  ReplaceOkValue<TFnReturn, InferOutput<TOutputSchema>> | ExtractFailure<TFnReturn> | TInputError
>

// no input
export function withSchema<
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnReturn extends
    | Desc<string, { ok: true; value: InferInput<TOutputSchema> }>
    | Desc<string, { ok: false }>,
>(options: {
  output: TOutputSchema
  fn: () => Promise<TFnReturn>
}): () => Promise<ReplaceOkValue<TFnReturn, InferOutput<TOutputSchema>> | ExtractFailure<TFnReturn>>

export function withSchema(options: {
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
      const { value, ...rest } = result
      return { ...rest, value: parse(options.output, value) }
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

    const { value, ...rest } = result
    return { ...rest, value: parse(options.output, value) }
  }
}
