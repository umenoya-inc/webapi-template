import { basename } from "node:path"

/**
 * @type {import("oxlint/plugins-dev").Rule}
 */
const oneExportPerFile = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce one export per file and require the exported symbol name to match the filename.",
    },
    messages: {
      tooManyExports:
        "1ファイルから複数のシンボルをエクスポートしないでください。エクスポートは1ファイルにつき1つに制限してください。",
      nameMismatch:
        'エクスポートされるシンボル名 "{{ symbolName }}" がファイル名 "{{ fileName }}" と一致しません。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename

    // index.ts は barrel export 用なので除外
    const base = basename(filename)
    if (base === "index.ts" || base === "index.js") {
      return {}
    }

    /** @type {{ name: string | null, kind: "value" | "type", node: import("oxlint/plugins-dev").Node }[]} */
    const exports = []

    return {
      ExportNamedDeclaration(node) {
        const kind = node.exportKind === "type" ? "type" : "value"

        // re-export: export { foo } from "./bar"
        if (node.source) {
          for (const spec of node.specifiers) {
            const specKind = spec.exportKind === "type" ? "type" : kind
            exports.push({ name: spec.exported.name, kind: specKind, node })
          }
          return
        }

        // export const foo = ... / export function foo() ...
        if (node.declaration) {
          const name = getDeclarationName(node.declaration)
          const declKind = isTypeDeclaration(node.declaration) ? "type" : kind
          exports.push({ name, kind: declKind, node })
          return
        }

        // export { foo, bar }
        for (const spec of node.specifiers) {
          const specKind = spec.exportKind === "type" ? "type" : kind
          exports.push({ name: spec.exported.name, kind: specKind, node })
        }
      },

      ExportDefaultDeclaration(node) {
        exports.push({ name: null, kind: "value", node })
      },

      ExportAllDeclaration(node) {
        exports.push({ name: node.exported?.name ?? null, kind: "value", node })
      },

      "Program:exit"() {
        const unique = deduplicateTypeValuePairs(exports)

        if (unique.length === 1) {
          checkNameMatch(context, unique[0], filename)
          return
        }

        if (unique.length > 1) {
          for (let i = 1; i < unique.length; i++) {
            context.report({
              node: unique[i].node,
              messageId: "tooManyExports",
            })
          }
        }
      },
    }
  },
}

/**
 * 同名の value export と type export のペアを1つのエクスポートとみなす
 * @param {{ name: string | null, kind: "value" | "type", node: import("oxlint/plugins-dev").Node }[]} exports
 * @returns {{ name: string | null, node: import("oxlint/plugins-dev").Node }[]}
 */
function deduplicateTypeValuePairs(exports) {
  /** @type {Map<string, { value: typeof exports[0] | null, type: typeof exports[0] | null }>} */
  const named = new Map()
  /** @type {typeof exports} */
  const unnamed = []

  for (const exp of exports) {
    if (!exp.name) {
      unnamed.push(exp)
      continue
    }
    const entry = named.get(exp.name) ?? { value: null, type: null }
    if (exp.kind === "type") {
      entry.type = exp
    } else {
      entry.value = exp
    }
    named.set(exp.name, entry)
  }

  /** @type {{ name: string | null, node: import("oxlint/plugins-dev").Node }[]} */
  const result = []

  for (const [name, entry] of named) {
    // value export を優先して代表ノードにする
    const representative = entry.value ?? entry.type
    result.push({ name, node: representative.node })
  }

  for (const exp of unnamed) {
    result.push({ name: exp.name, node: exp.node })
  }

  return result
}

/**
 * @param {import("oxlint/plugins-dev").Declaration} declaration
 * @returns {string | null}
 */
function getDeclarationName(declaration) {
  switch (declaration.type) {
    case "VariableDeclaration": {
      const first = declaration.declarations[0]
      if (first?.id?.type === "Identifier") {
        return first.id.name
      }
      return null
    }
    case "FunctionDeclaration":
    case "ClassDeclaration":
    case "TSTypeAliasDeclaration":
    case "TSInterfaceDeclaration":
    case "TSEnumDeclaration":
      return declaration.id?.name ?? null
    default:
      return null
  }
}

/**
 * @param {import("oxlint/plugins-dev").Declaration} declaration
 * @returns {boolean}
 */
function isTypeDeclaration(declaration) {
  return (
    declaration.type === "TSTypeAliasDeclaration" || declaration.type === "TSInterfaceDeclaration"
  )
}

/**
 * @param {import("oxlint/plugins-dev").Context} context
 * @param {{ name: string | null, node: import("oxlint/plugins-dev").Node }} exportInfo
 * @param {string} filename
 */
function checkNameMatch(context, exportInfo, filename) {
  const symbolName = exportInfo.name
  if (!symbolName) return

  const base = basename(filename)
  const fileName = base.replace(/\.[^.]+$/, "")

  if (symbolName !== fileName) {
    context.report({
      node: exportInfo.node,
      messageId: "nameMismatch",
      data: { symbolName, fileName },
    })
  }
}

export default oneExportPerFile
