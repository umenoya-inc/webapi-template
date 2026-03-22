import { basename } from "node:path"

const WRITE_METHODS = new Set(["insert", "update", "delete"])

/**
 * @type {import("oxlint/plugins-dev").Rule}
 */
const noWriteInQuery = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow write operations (insert/update/delete) inside DbClient.query(). Use execute() for writes.",
    },
    messages: {
      noWriteInQuery:
        "書き込み操作（{{method}}）には query ではなく execute を使ってください。query は読み取り専用です。",
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename
    const base = basename(filename)

    // テストファイルは対象外
    if (base.includes(".test.") || base.includes(".testutil.")) {
      return {}
    }

    // query コールバックのパラメータ名を追跡するスタック
    const queryParamStack = []

    return {
      CallExpression(node) {
        // *.query(q => ...) または *.query(function(q) { ... }) を検出
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "query" &&
          node.arguments.length > 0
        ) {
          const callback = node.arguments[0]
          if (
            (callback.type === "ArrowFunctionExpression" ||
              callback.type === "FunctionExpression") &&
            callback.params.length > 0 &&
            callback.params[0].type === "Identifier"
          ) {
            queryParamStack.push(callback.params[0].name)
          }
        }
      },
      "CallExpression:exit"(node) {
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "query" &&
          node.arguments.length > 0
        ) {
          const callback = node.arguments[0]
          if (
            (callback.type === "ArrowFunctionExpression" ||
              callback.type === "FunctionExpression") &&
            callback.params.length > 0 &&
            callback.params[0].type === "Identifier" &&
            queryParamStack.length > 0 &&
            queryParamStack[queryParamStack.length - 1] === callback.params[0].name
          ) {
            queryParamStack.pop()
          }
        }
      },
      MemberExpression(node) {
        if (queryParamStack.length === 0) return

        // q.insert / q.update / q.delete を検出
        if (
          node.object.type === "Identifier" &&
          queryParamStack.includes(node.object.name) &&
          node.property.type === "Identifier" &&
          WRITE_METHODS.has(node.property.name)
        ) {
          context.report({
            node,
            messageId: "noWriteInQuery",
            data: { method: node.property.name },
          })
        }
      },
    }
  },
}

export default noWriteInQuery
