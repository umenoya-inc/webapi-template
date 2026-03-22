import { basename } from "node:path"

/**
 * @type {import("oxlint/plugins-dev").Rule}
 */
const noTableInBarrelExport = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow exporting table definitions (*Table) from barrel exports (index.ts). Table definitions should remain internal to the submodule.",
    },
    messages: {
      noTableExport:
        'テーブル定義 "{{name}}" を barrel export に含めないでください。テーブル定義はサブモジュール内部でのみ使用します。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename
    const base = basename(filename)

    // index.ts のみ対象
    if (base !== "index.ts") {
      return {}
    }

    return {
      ExportNamedDeclaration(node) {
        // export { fooTable } from "./fooTable" パターン
        if (node.specifiers) {
          for (const specifier of node.specifiers) {
            const exportedName = specifier.exported?.name ?? specifier.local?.name ?? ""
            if (exportedName.endsWith("Table")) {
              context.report({
                node: specifier,
                messageId: "noTableExport",
                data: { name: exportedName },
              })
            }
          }
        }
      },
    }
  },
}

export default noTableInBarrelExport
