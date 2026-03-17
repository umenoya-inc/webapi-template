/**
 * @type {import("oxlint/plugins-dev").Rule}
 */
const noNamespaceImport = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow namespace imports (import * as name).",
    },
    messages: {
      noNamespaceImport:
        "Namespace Import（import * as ...）は禁止されています。Named Import を使用してください。",
    },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportNamespaceSpecifier") {
            context.report({
              node,
              messageId: "noNamespaceImport",
            })
          }
        }
      },
    }
  },
}

export default noNamespaceImport
