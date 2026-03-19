import type { BaseIssue, BaseSchema, InferInput, InferIssue, InferOutput } from "valibot"
import type { BehaviorBrand, Desc, DescLabel } from "@/behavior"
import { defineBehavior } from "@/behavior"
import { inputSchemaKey, outputSchemaKey } from "@/contract"
import { withSchema } from "@/contract"
import { responsesKey } from "./responsesKey"

/* eslint-disable @typescript-eslint/no-explicit-any */

type DefaultInputError = Desc<
  "入力値が不正",
  {
    ok: false
    reason: "validation_failed"
    fields: Record<string, unknown>
  }
>

type ExtractFailure<T> = Extract<T, { ok: false }>

type ReplaceOkValue<T, V> =
  T extends Desc<infer L, infer U>
    ? U extends { ok: true; value: unknown }
      ? Desc<L, Omit<U, "value"> & { value: V }>
      : never
    : never

type FullReturn<
  TFnReturn,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TInputError = DefaultInputError,
> = ReplaceOkValue<TFnReturn, InferOutput<TOutputSchema>> | ExtractFailure<TFnReturn> | TInputError

type ResponseEntry = { status: number; description?: string }

// with custom onInputError
export function defineRouteContract<
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
  responses: {
    [K in DescLabel<FullReturn<TFnReturn, TOutputSchema, TInputError>>]: ResponseEntry
  }
  fn: (input: InferOutput<TInputSchema>) => Promise<TFnReturn>
}): ((
  input: InferInput<TInputSchema>,
) => Promise<FullReturn<TFnReturn, TOutputSchema, TInputError>>) &
  BehaviorBrand

// with default onInputError
export function defineRouteContract<
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnReturn extends
    | Desc<string, { ok: true; value: InferInput<TOutputSchema> }>
    | Desc<string, { ok: false }>,
>(options: {
  input: TInputSchema
  output: TOutputSchema
  responses: { [K in DescLabel<FullReturn<TFnReturn, TOutputSchema>>]: ResponseEntry }
  fn: (input: InferOutput<TInputSchema>) => Promise<TFnReturn>
}): ((input: InferInput<TInputSchema>) => Promise<FullReturn<TFnReturn, TOutputSchema>>) &
  BehaviorBrand

export function defineRouteContract(options: {
  input: BaseSchema<unknown, unknown, BaseIssue<unknown>>
  output: BaseSchema<unknown, unknown, BaseIssue<unknown>>
  onInputError?: (issues: [BaseIssue<unknown>, ...BaseIssue<unknown>[]]) => unknown
  responses: Record<string, ResponseEntry>
  fn: (input: unknown) => Promise<unknown>
}) {
  const fn = defineBehavior(
    withSchema({
      input: options.input,
      output: options.output,
      onInputError: options.onInputError,
      fn: options.fn,
    } as any) as any,
  )
  ;(fn as Record<symbol, unknown>)[inputSchemaKey] = options.input
  ;(fn as Record<symbol, unknown>)[outputSchemaKey] = options.output
  ;(fn as Record<symbol, unknown>)[responsesKey] = options.responses
  return fn
}
