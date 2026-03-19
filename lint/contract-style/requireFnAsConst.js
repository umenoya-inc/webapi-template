/**
 * @type {import("oxlint/plugins-dev").Rule}
 */
const requireFnAsConst = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require `as const` on object literal returns inside defineContract's fn callback.",
    },
    messages: {
      requireAsConst:
        "defineContract の fn 内でオブジェクトリテラルを返す際は `as const` を付けてください。",
    },
    schema: [],
  },
  create(context) {
    /** @type {Set<object>} */
    const targetFunctions = new Set()
    let insideTargetFnDepth = 0

    /**
     * オブジェクトリテラルが as const なしで返されていたら報告する
     * @param {import("oxlint/plugins-dev").Node} expression
     * @param {import("oxlint/plugins-dev").Node} reportNode
     */
    function checkExpression(expression, reportNode) {
      if (expression.type === "ObjectExpression") {
        context.report({ node: reportNode, messageId: "requireAsConst" })
      }
    }

    /**
     * defineContract 呼び出しの引数から fn プロパティの関数ノードを抽出して登録する
     * @param {import("oxlint/plugins-dev").Node} node
     */
    function registerFnFromDefineContract(node) {
      if (
        node.callee.type !== "Identifier" ||
        node.callee.name !== "defineContract" ||
        node.arguments[0]?.type !== "ObjectExpression"
      ) {
        return
      }
      for (const prop of node.arguments[0].properties) {
        if (
          prop.type === "Property" &&
          prop.key?.type === "Identifier" &&
          prop.key.name === "fn" &&
          (prop.value.type === "ArrowFunctionExpression" ||
            prop.value.type === "FunctionExpression")
        ) {
          targetFunctions.add(prop.value)
        }
      }
    }

    /**
     * 関数ノードに入った際の深さ管理
     * @param {import("oxlint/plugins-dev").Node} node
     */
    function onFunctionEnter(node) {
      if (targetFunctions.has(node)) {
        insideTargetFnDepth = 1
        // アロー関数の式本体（暗黙の return）をチェック
        if (node.type === "ArrowFunctionExpression" && node.body.type !== "BlockStatement") {
          checkExpression(node.body, node)
        }
      } else if (insideTargetFnDepth > 0) {
        insideTargetFnDepth++
      }
    }

    /**
     * 関数ノードから出た際の深さ管理
     * @param {import("oxlint/plugins-dev").Node} node
     */
    function onFunctionExit(node) {
      if (targetFunctions.has(node)) {
        targetFunctions.delete(node)
        insideTargetFnDepth = 0
      } else if (insideTargetFnDepth > 0) {
        insideTargetFnDepth--
      }
    }

    return {
      CallExpression: registerFnFromDefineContract,

      ArrowFunctionExpression: onFunctionEnter,
      "ArrowFunctionExpression:exit": onFunctionExit,
      FunctionExpression: onFunctionEnter,
      "FunctionExpression:exit": onFunctionExit,

      ReturnStatement(node) {
        if (insideTargetFnDepth !== 1 || !node.argument) return
        checkExpression(node.argument, node)
      },
    }
  },
}

export default requireFnAsConst
