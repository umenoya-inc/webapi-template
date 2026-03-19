import { RuleTester } from "oxlint/plugins-dev"
import { describe, it } from "vite-plus/test"
import requireFnAsConst from "./requireFnAsConst.js"

RuleTester.describe = describe
RuleTester.it = it

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
})

tester.run("require-fn-as-const", requireFnAsConst, {
  valid: [
    // as const 付きの成功ケース
    `defineContract({
      input: schema,
      output: schema,
      fn: async (input) => {
        return { ok: true, value: input } as const
      },
    })`,
    // as const 付きのエラーケース
    `defineContract({
      input: schema,
      output: schema,
      fn: async (input) => {
        return { ok: false, reason: "not_found" } as const
      },
    })`,
    // 変数を返すケース（as const 不要）
    `defineContract({
      input: schema,
      output: schema,
      fn: async (input) => {
        const result = await something()
        return result
      },
    })`,
    // defineContract 外のオブジェクトリテラル返却は対象外
    `function foo() { return { ok: true } }`,
    // fn 内のネストした関数のオブジェクトリテラル返却は対象外
    `defineContract({
      input: schema,
      output: schema,
      fn: async (input) => {
        const items = list.map((item) => {
          return { id: item.id }
        })
        return { ok: true, value: items } as const
      },
    })`,
  ],
  invalid: [
    // as const なしの成功ケース
    {
      code: `defineContract({
        input: schema,
        output: schema,
        fn: async (input) => {
          return { ok: true, value: input }
        },
      })`,
      errors: [{ messageId: "requireAsConst" }],
    },
    // as const なしのエラーケース
    {
      code: `defineContract({
        input: schema,
        output: schema,
        fn: async (input) => {
          return { ok: false, reason: "not_found" }
        },
      })`,
      errors: [{ messageId: "requireAsConst" }],
    },
    // 複数の return で両方とも as const なし
    {
      code: `defineContract({
        input: schema,
        output: schema,
        fn: async (input) => {
          if (error) {
            return { ok: false, reason: "error" }
          }
          return { ok: true, value: input }
        },
      })`,
      errors: [{ messageId: "requireAsConst" }, { messageId: "requireAsConst" }],
    },
    // 一方だけ as const なし
    {
      code: `defineContract({
        input: schema,
        output: schema,
        fn: async (input) => {
          if (error) {
            return { ok: false, reason: "error" } as const
          }
          return { ok: true, value: input }
        },
      })`,
      errors: [{ messageId: "requireAsConst" }],
    },
  ],
})
