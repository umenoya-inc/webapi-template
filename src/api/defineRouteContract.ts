import type { BaseIssue, BaseSchema, InferInput, InferIssue, InferOutput } from "valibot"
import type { BehaviorBrand, Desc, DescLabel } from "@/behavior"
import { defineBehavior } from "@/behavior"
import { inputSchemaKey, outputSchemaKey } from "@/contract"
import { withSchema } from "@/contract"
import { responsesKey } from "./responsesKey"

/* eslint-disable @typescript-eslint/no-explicit-any */

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
  TInputError,
> = ReplaceOkValue<TFnReturn, InferOutput<TOutputSchema>> | ExtractFailure<TFnReturn> | TInputError

type FullReturnNoInput<
  TFnReturn,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
> = ReplaceOkValue<TFnReturn, InferOutput<TOutputSchema>> | ExtractFailure<TFnReturn>

interface ResponseEntry {
  status: number
  description?: string
}

// input + onInputError（input がある場合 onInputError は必須）
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

// no input
export function defineRouteContract<
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TFnReturn extends
    | Desc<string, { ok: true; value: InferInput<TOutputSchema> }>
    | Desc<string, { ok: false }>,
>(options: {
  output: TOutputSchema
  responses: { [K in DescLabel<FullReturnNoInput<TFnReturn, TOutputSchema>>]: ResponseEntry }
  fn: () => Promise<TFnReturn>
}): (() => Promise<FullReturnNoInput<TFnReturn, TOutputSchema>>) & BehaviorBrand

export function defineRouteContract(options: {
  input?: BaseSchema<unknown, unknown, BaseIssue<unknown>>
  output: BaseSchema<unknown, unknown, BaseIssue<unknown>>
  onInputError?: (issues: [BaseIssue<unknown>, ...BaseIssue<unknown>[]]) => unknown
  responses: Record<string, ResponseEntry>
  fn: (input?: unknown) => Promise<unknown>
}) {
  const fn = defineBehavior(
    withSchema({
      input: options.input,
      output: options.output,
      onInputError: options.onInputError,
      fn: options.fn,
    } as any) as any,
  )
  if (options.input) {
    ;(fn as Record<symbol, unknown>)[inputSchemaKey] = options.input
  }
  ;(fn as Record<symbol, unknown>)[outputSchemaKey] = options.output
  ;(fn as Record<symbol, unknown>)[responsesKey] = options.responses
  return fn
}
