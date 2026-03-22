import { basename, sep } from "node:path"

/**
 * @type {import("oxlint/plugins-dev").Rule}
 */
const noLeafInApiEffect = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow leaf effects (no service dependency) in defineEffect within api/ module. API layer should delegate to db/ layer via service.",
    },
    messages: {
      noLeafInApi:
        "api/ 内の defineEffect には service を宣言してください。api/ は db/ 層の Effect に依存する composite/node effect に限定してください。",
    },
    schema: [
      {
        type: "object",
        properties: {
          basePath: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const filename = context.filename
    const base = basename(filename)
    const basePath = context.options[0]?.basePath ?? "src"

    // テストファイルは対象外
    if (base.includes(".test.") || base.includes(".testutil.")) {
      return {}
    }

    // api/ モジュール内のファイルのみ対象
    const apiPrefix = `${sep}${basePath}${sep}api${sep}`
    if (!filename.includes(apiPrefix)) {
      return {}
    }

    return {
      CallExpression(node) {
        // defineEffect(...) を検出
        if (node.callee.type !== "Identifier" || node.callee.name !== "defineEffect") {
          return
        }

        // 第1引数がオブジェクト式であること
        const firstArg = node.arguments[0]
        if (!firstArg || firstArg.type !== "ObjectExpression") {
          return
        }

        // service プロパティが存在するか
        const hasService = firstArg.properties.some(
          (prop) =>
            prop.type === "Property" &&
            prop.key.type === "Identifier" &&
            prop.key.name === "service",
        )

        if (!hasService) {
          context.report({
            node: firstArg,
            messageId: "noLeafInApi",
          })
        }
      },
    }
  },
}

export default noLeafInApiEffect
