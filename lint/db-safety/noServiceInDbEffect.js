import { basename, sep } from "node:path"

/**
 * @type {import("oxlint/plugins-dev").Rule}
 */
const noServiceInDbEffect = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow service dependencies in defineEffect within db/ module. DB layer should only contain leaf effects.",
    },
    messages: {
      noServiceInDb:
        "db/ 内の defineEffect に service を宣言しないでください。db/ は leaf effect（context のみ）に限定してください。",
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

    // db/ モジュール内のファイルのみ対象
    const dbPrefix = `${sep}${basePath}${sep}db${sep}`
    if (!filename.includes(dbPrefix)) {
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
        const serviceProperty = firstArg.properties.find(
          (prop) =>
            prop.type === "Property" &&
            prop.key.type === "Identifier" &&
            prop.key.name === "service",
        )

        if (serviceProperty) {
          context.report({
            node: serviceProperty,
            messageId: "noServiceInDb",
          })
        }
      },
    }
  },
}

export default noServiceInDbEffect
