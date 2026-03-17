import { basename } from "node:path"

/**
 * @type {import("oxlint/plugins-dev").Rule}
 */
const noTestutilInProduction = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow importing *.testutil.ts files from non-test files.",
    },
    messages: {
      noTestutilImport:
        "テストユーティリティ（*.testutil.ts）はテストファイル（*.test.ts）からのみインポートできます。",
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename
    const base = basename(filename)

    // テストファイル自身からのアクセスは許可
    if (base.includes(".test.") || base.includes(".testutil.")) {
      return {}
    }

    return {
      ImportDeclaration(node) {
        const source = node.source.value
        if (source.includes(".testutil")) {
          context.report({
            node,
            messageId: "noTestutilImport",
          })
        }
      },
    }
  },
}

export default noTestutilInProduction
