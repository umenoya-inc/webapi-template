import pluralize from "pluralize"

/**
 * @type {import("oxlint/plugins-dev").Rule}
 */
const noPluralTableName = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow plural table names in pgTable(). Table names should be singular.",
    },
    messages: {
      noPluralTableName:
        'テーブル名 "{{name}}" は複数形です。単数形 "{{singular}}" を使ってください。',
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        // pgTable("tableName", ...) を検出
        if (node.callee.type !== "Identifier" || node.callee.name !== "pgTable") {
          return
        }

        const firstArg = node.arguments[0]
        if (!firstArg || firstArg.type !== "Literal" || typeof firstArg.value !== "string") {
          return
        }

        const tableName = firstArg.value
        if (pluralize.isPlural(tableName) && !pluralize.isSingular(tableName)) {
          context.report({
            node: firstArg,
            messageId: "noPluralTableName",
            data: {
              name: tableName,
              singular: pluralize.singular(tableName),
            },
          })
        }
      },
    }
  },
}

export default noPluralTableName
