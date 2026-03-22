import { basename } from "node:path"

/**
 * @type {import("oxlint/plugins-dev").Rule}
 */
const interfaceForObjectTypes = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require interface instead of type for plain object types. Union, intersection, mapped, conditional, and inferred types should use type.",
    },
    messages: {
      useInterface: 'オブジェクト型 "{{name}}" には type ではなく interface を使ってください。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename
    const base = basename(filename)

    // テストファイル・lint ファイルは対象外
    if (base.includes(".test.") || base.includes(".testutil.")) {
      return {}
    }

    return {
      TSTypeAliasDeclaration(node) {
        // type X = { ... } のパターンを検出
        if (node.typeAnnotation.type === "TSTypeLiteral") {
          // mapped type を除外: { [K in ...]: ... }
          // computed property key を除外: { [brand]: never } 等の branded/phantom 型
          const hasNonPlain = node.typeAnnotation.members.some(
            (m) =>
              m.type === "TSIndexSignature" ||
              m.type === "TSMappedType" ||
              (m.type === "TSPropertySignature" && m.computed),
          )
          if (hasNonPlain) return

          context.report({
            node,
            messageId: "useInterface",
            data: { name: node.id.name },
          })
        }
      },
    }
  },
}

export default interfaceForObjectTypes
