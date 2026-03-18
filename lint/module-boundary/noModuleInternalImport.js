import { existsSync } from "node:fs"
import { resolve, dirname, relative, sep } from "node:path"

/**
 * @type {import("oxlint/plugins-dev").Rule}
 */
const noModuleInternalImport = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow importing internal files of a module. Only barrel exports (index.ts) are allowed.",
    },
    messages: {
      noInternalImport:
        "モジュールの内部ファイルに直接アクセスしないでください。@/modules/{{ modulePath }} 経由でインポートしてください。",
      noRelativeOutside:
        "相対パスでのモジュール外へのアクセスは禁止されています。@/modules/<module名> 経由でインポートしてください。",
      noAliasInsideModule:
        "同一モジュール内では相対パスを使用してください。エイリアス経由でのアクセスは禁止されています。",
      noSubmoduleInternalImport:
        "サブモジュールの内部ファイルに直接アクセスしないでください。barrel export 経由でインポートしてください。",
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename
    const cwd = context.cwd
    const srcDir = resolve(cwd, "src")
    const modulesDir = resolve(srcDir, "modules")

    return {
      ImportDeclaration(node) {
        const source = node.source.value

        // @/modules/ で始まるインポートをチェック
        if (source.startsWith("@/modules/")) {
          checkAliasImport(context, node, source, srcDir, modulesDir, filename)
          return
        }

        // 相対パスでモジュール外にアクセスしていないかチェック
        if (source.startsWith("../")) {
          checkRelativeImport(context, node, source, modulesDir, filename)
        }
      },
    }
  },
}

/**
 * @/modules/... 形式のインポートをチェック
 * @param {import("oxlint/plugins-dev").Context} context
 * @param {import("oxlint/plugins-dev").ImportDeclaration} node
 * @param {string} source
 * @param {string} srcDir
 * @param {string} modulesDir
 * @param {string} filename
 */
function checkAliasImport(context, node, source, srcDir, modulesDir, filename) {
  // @/modules/ 以降のパスを取得
  const afterModules = source.slice("@/modules/".length)
  const segments = afterModules.split("/")

  // @/modules/<module> のみの場合
  if (segments.length <= 1) {
    // 同一モジュール内からの alias アクセスはブロック
    if (isInsideModule(filename, modulesDir, segments[0])) {
      context.report({
        node,
        messageId: "noAliasInsideModule",
      })
    }
    return
  }

  // @/modules/<module>/<path> の場合
  // 同一モジュール内からの alias アクセスはブロック
  const targetTopModule = segments[0]
  if (isInsideModule(filename, modulesDir, targetTopModule)) {
    context.report({
      node,
      messageId: "noAliasInsideModule",
    })
    return
  }

  // インポート先がディレクトリ（= barrel export）かファイルかを判定
  const importPath = resolve(srcDir, source.slice("@/".length))
  if (isBarrelExport(importPath)) {
    // ディレクトリの index.ts に解決される → サブモジュールの barrel export なので OK
    return
  }

  // 最も近い barrel export のパスを提案
  const modulePath = findNearestModulePath(segments)

  context.report({
    node,
    messageId: "noInternalImport",
    data: { modulePath },
  })
}

/**
 * 相対パスインポートがモジュール外に出ていないかチェック
 * @param {import("oxlint/plugins-dev").Context} context
 * @param {import("oxlint/plugins-dev").ImportDeclaration} node
 * @param {string} source
 * @param {string} modulesDir
 * @param {string} filename
 */
function checkRelativeImport(context, node, source, modulesDir, filename) {
  // 現在のファイルが modules 配下でなければ対象外
  if (!filename.startsWith(modulesDir + sep)) {
    return
  }

  // 解決先のパスを取得
  const resolvedTarget = resolve(dirname(filename), source)

  // 解決先が modules 配下でなければモジュール外アクセス
  if (!resolvedTarget.startsWith(modulesDir + sep)) {
    context.report({
      node,
      messageId: "noRelativeOutside",
    })
    return
  }

  // 現在のファイルのトップレベルモジュールを取得
  const currentModule = getTopModule(filename, modulesDir)
  const targetModule = getTopModule(resolvedTarget, modulesDir)

  // 異なるトップレベルモジュールへの相対パスアクセスは禁止
  if (currentModule !== targetModule) {
    context.report({
      node,
      messageId: "noRelativeOutside",
    })
    return
  }

  // 同一トップレベルモジュール内で、barrel export を持つサブモジュールの境界を跨いでいないかチェック
  const topModuleDir = resolve(modulesDir, currentModule)
  if (crossesSubmoduleBoundary(filename, resolvedTarget, topModuleDir)) {
    context.report({
      node,
      messageId: "noSubmoduleInternalImport",
    })
  }
}

/**
 * 指定パスが barrel export（ディレクトリ + index.ts）かどうかを判定
 * @param {string} importPath
 * @returns {boolean}
 */
function isBarrelExport(importPath) {
  return existsSync(resolve(importPath, "index.ts")) || existsSync(resolve(importPath, "index.js"))
}

/**
 * 指定ファイルが特定モジュール内にあるかどうかを判定
 * @param {string} filename
 * @param {string} modulesDir
 * @param {string} moduleName
 * @returns {boolean}
 */
function isInsideModule(filename, modulesDir, moduleName) {
  const moduleDir = resolve(modulesDir, moduleName)
  return filename.startsWith(moduleDir + sep)
}

/**
 * ファイルパスからトップレベルモジュール名を取得
 * @param {string} filepath
 * @param {string} modulesDir
 * @returns {string}
 */
function getTopModule(filepath, modulesDir) {
  const rel = relative(modulesDir, filepath)
  return rel.split(sep)[0]
}

/**
 * セグメントから最も近いモジュールパスを推定
 * @param {string[]} segments
 * @returns {string}
 */
function findNearestModulePath(segments) {
  // 最後のセグメント（ファイル名）を除いたパスを提案
  if (segments.length === 2) {
    return segments[0]
  }
  return segments.slice(0, -1).join("/")
}

/**
 * 同一トップレベルモジュール内で、barrel export を持つサブモジュールの境界を跨いでいるかを判定する。
 * ターゲットがサブモジュール（index.ts を持つディレクトリ）内にあり、
 * かつソースがそのサブモジュール外にある場合に true を返す。
 * @param {string} sourceFile
 * @param {string} targetFile
 * @param {string} topModuleDir
 * @returns {boolean}
 */
function crossesSubmoduleBoundary(sourceFile, targetFile, topModuleDir) {
  // ターゲットからトップモジュールまで遡り、barrel export を持つ最寄りのサブモジュールを探す
  let dir = dirname(targetFile)
  while (dir !== topModuleDir && dir.startsWith(topModuleDir + sep)) {
    if (isBarrelExport(dir)) {
      // ターゲットはこのサブモジュール内にある。ソースもこのサブモジュール内か？
      if (!sourceFile.startsWith(dir + sep)) {
        return true
      }
      return false
    }
    dir = dirname(dir)
  }
  return false
}

export default noModuleInternalImport
