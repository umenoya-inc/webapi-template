import { RuleTester } from "oxlint/plugins-dev"
import { describe, it } from "vite-plus/test"
import noNamespaceImport from "./noNamespaceImport.js"

RuleTester.describe = describe
RuleTester.it = it

const tester = new RuleTester({ languageOptions: { sourceType: "module" } })

tester.run("no-namespace-import", noNamespaceImport, {
  valid: ['import { pipe, string } from "valibot"', 'import app from "./app"'],
  invalid: [
    {
      code: 'import * as v from "valibot"',
      errors: [{ messageId: "noNamespaceImport" }],
    },
  ],
})
