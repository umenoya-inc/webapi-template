import { basename } from "node:path";

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
    const filename = context.filename;

    // index.ts は barrel export 用なので除外
    const base = basename(filename);
    if (base === "index.ts" || base === "index.js") {
      return {};
    }

    /** @type {{ name: string | null, node: import("oxlint/plugins-dev").Node }[]} */
    const exports = [];

    return {
      ExportNamedDeclaration(node) {
        // re-export: export { foo } from "./bar"
        if (node.source) {
          for (const spec of node.specifiers) {
            exports.push({ name: spec.exported.name, node });
          }
          return;
        }

        // export const foo = ... / export function foo() ...
        if (node.declaration) {
          const name = getDeclarationName(node.declaration);
          exports.push({ name, node });
          return;
        }

        // export { foo, bar }
        for (const spec of node.specifiers) {
          exports.push({ name: spec.exported.name, node });
        }
      },

      ExportDefaultDeclaration(node) {
        exports.push({ name: null, node });
      },

      ExportAllDeclaration(node) {
        exports.push({ name: node.exported?.name ?? null, node });
      },

      "Program:exit"() {
        if (exports.length === 1) {
          checkNameMatch(context, exports[0], filename);
          return;
        }

        if (exports.length > 1) {
          for (let i = 1; i < exports.length; i++) {
            context.report({
              node: exports[i].node,
              messageId: "tooManyExports",
            });
          }
        }
      },
    };
  },
};

/**
 * @param {import("oxlint/plugins-dev").Declaration} declaration
 * @returns {string | null}
 */
function getDeclarationName(declaration) {
  switch (declaration.type) {
    case "VariableDeclaration": {
      const first = declaration.declarations[0];
      if (first?.id?.type === "Identifier") {
        return first.id.name;
      }
      return null;
    }
    case "FunctionDeclaration":
    case "ClassDeclaration":
    case "TSTypeAliasDeclaration":
    case "TSInterfaceDeclaration":
    case "TSEnumDeclaration":
      return declaration.id?.name ?? null;
    default:
      return null;
  }
}

/**
 * @param {import("oxlint/plugins-dev").Context} context
 * @param {{ name: string | null, node: import("oxlint/plugins-dev").Node }} exportInfo
 * @param {string} filename
 */
function checkNameMatch(context, exportInfo, filename) {
  const symbolName = exportInfo.name;
  if (!symbolName) return;

  const base = basename(filename);
  const fileName = base.replace(/\.[^.]+$/, "");

  if (symbolName !== fileName) {
    context.report({
      node: exportInfo.node,
      messageId: "nameMismatch",
      data: { symbolName, fileName },
    });
  }
}

export default oneExportPerFile;
