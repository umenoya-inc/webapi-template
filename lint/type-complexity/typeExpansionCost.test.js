import { RuleTester } from "oxlint/plugins-dev"
import { describe, it } from "vite-plus/test"
import typeExpansionCost from "./typeExpansionCost.js"

RuleTester.describe = describe
RuleTester.it = it

const tester = new RuleTester()

tester.run("type-expansion-cost", typeExpansionCost, {
  valid: [
    // プリミティブ型: コスト 1
    {
      code: "export type Name = string",
      filename: "/project/src/Name.ts",
    },
    // 名前付き型参照: コスト 1
    {
      code: "export type Alias = SomeInterface",
      filename: "/project/src/Alias.ts",
    },
    // 小さい union: コスト 3
    {
      code: 'export type Status = "ok" | "error" | "pending"',
      filename: "/project/src/Status.ts",
    },
    // 小さいオブジェクトリテラル: コスト 3
    {
      code: "export type Point = { x: number; y: number; z: number }",
      filename: "/project/src/Point.ts",
    },
    // 型引数付き参照: コスト 1 + 1 = 2
    {
      code: "export type Items = Array<string>",
      filename: "/project/src/Items.ts",
    },
    // 関数の戻り値型注釈（低コスト）
    {
      code: "export function getId(): string { return '' }",
      filename: "/project/src/getId.ts",
    },
    // 変数の型注釈（低コスト）
    {
      code: "export const name: string = ''",
      filename: "/project/src/name.ts",
    },
    // 閾値ぴったり（デフォルト 20）: OK
    {
      code: [
        "export type Big = {",
        "  a: string; b: string; c: string; d: string; e: string;",
        "  f: string; g: string; h: string; i: string; j: string;",
        "  k: string; l: string; m: string; n: string; o: string;",
        "  p: string; q: string; r: string; s: string; t: string;",
        "}",
      ].join("\n"),
      filename: "/project/src/Big.ts",
    },
  ],
  invalid: [
    // 閾値超過のオブジェクトリテラル（21プロパティ）
    {
      code: [
        "export type TooMany = {",
        "  a: string; b: string; c: string; d: string; e: string;",
        "  f: string; g: string; h: string; i: string; j: string;",
        "  k: string; l: string; m: string; n: string; o: string;",
        "  p: string; q: string; r: string; s: string; t: string;",
        "  u: string;",
        "}",
      ].join("\n"),
      filename: "/project/src/TooMany.ts",
      errors: [{ messageId: "highCost" }],
    },
    // 深い intersection: コスト 5 + 5 + 5 + 5 + 5 = 25 (各 mapped type)
    {
      code: [
        "export type Deep =",
        "  { [K in keyof A]: B } &",
        "  { [K in keyof C]: D } &",
        "  { [K in keyof E]: F } &",
        "  { [K in keyof G]: H } &",
        "  { [K in keyof I]: J }",
      ].join("\n"),
      filename: "/project/src/Deep.ts",
      errors: [{ messageId: "highCost" }],
    },
    // ネストした conditional type（コスト 16）を低い閾値で検出
    {
      code: [
        "export type Nested<T> =",
        "  T extends A",
        "    ? T extends B",
        "      ? T extends C",
        "        ? T extends D",
        "          ? T extends E ? R1 : R2",
        "          : R3",
        "        : R4",
        "      : R5",
        "    : R6",
      ].join("\n"),
      filename: "/project/src/Nested.ts",
      options: [{ threshold: 15 }],
      errors: [{ messageId: "highCost" }],
    },
    // カスタム閾値
    {
      code: "export type Pair = { a: string; b: number; c: boolean }",
      filename: "/project/src/Pair.ts",
      options: [{ threshold: 2 }],
      errors: [{ messageId: "highCost" }],
    },
    // 関数の戻り値型が複雑
    {
      code: [
        "export function create(): {",
        "  a: string; b: string; c: string; d: string; e: string;",
        "  f: string; g: string; h: string; i: string; j: string;",
        "  k: string; l: string; m: string; n: string; o: string;",
        "  p: string; q: string; r: string; s: string; t: string;",
        "  u: string;",
        "} { return {} as any }",
      ].join("\n"),
      filename: "/project/src/create.ts",
      errors: [{ messageId: "highCost" }],
    },
    // 変数の型注釈が複雑
    {
      code: [
        "export const config: {",
        "  a: string; b: string; c: string; d: string; e: string;",
        "  f: string; g: string; h: string; i: string; j: string;",
        "  k: string; l: string; m: string; n: string; o: string;",
        "  p: string; q: string; r: string; s: string; t: string;",
        "  u: string;",
        "} = {} as any",
      ].join("\n"),
      filename: "/project/src/config.ts",
      errors: [{ messageId: "highCost" }],
    },
  ],
})
