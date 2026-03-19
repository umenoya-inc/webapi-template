import { readFileSync } from "node:fs"
import { resolve, relative, sep } from "node:path"

/**
 * @type {import("oxlint/plugins-dev").Rule}
 */
const enforceDependencies = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce module dependency directions declared via @dependencies tag in index.ts JSDoc.",
    },
    messages: {
      disallowedDependency:
        "{{ sourceModule }} から {{ targetModule }} へのインポートは許可されていません。{{ sourceModule }}/index.ts の @dependencies に {{ targetModule }} を追加してください。",
    },
    schema: [
      {
        type: "object",
        properties: {
          basePath: { type: "string" },
          aliasPrefix: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const filename = context.filename
    const cwd = context.cwd
    const basePath = context.options[0]?.basePath ?? "src"
    const aliasPrefix = context.options[0]?.aliasPrefix ?? "@/"
    const baseDir = resolve(cwd, basePath)

    return {
      ImportDeclaration(node) {
        const source = node.source.value

        if (!source.startsWith(aliasPrefix)) return

        // テストファイルは対象外
        if (filename.endsWith(".test.ts") || filename.endsWith(".testutil.ts")) return

        // インポート元のトップレベルモジュールを特定
        if (!filename.startsWith(baseDir + sep)) return
        const sourceModule = getTopModule(filename, baseDir)
        if (!sourceModule) return

        // インポート先のパスを取得（エイリアス以降）
        const importPath = source.slice(aliasPrefix.length)
        const targetModule = importPath.split("/")[0]

        // 同一モジュール内は対象外
        if (sourceModule === targetModule) return

        // @dependencies を読み取り
        const allowedDeps = readDependencies(baseDir, sourceModule)

        // @dependencies が宣言されていない場合は制約なし（オプトイン）
        if (allowedDeps === null) return

        if (!allowedDeps.some((pattern) => matchDependency(pattern, importPath))) {
          context.report({
            node,
            messageId: "disallowedDependency",
            data: { sourceModule, targetModule },
          })
        }
      },
    }
  },
}

/**
 * ファイルパスからトップレベルモジュール名を取得
 * @param {string} filepath
 * @param {string} baseDir
 * @returns {string | null}
 */
function getTopModule(filepath, baseDir) {
  const rel = relative(baseDir, filepath)
  const first = rel.split(sep)[0]
  return first || null
}

/** @type {Map<string, string[] | null>} */
const depsCache = new Map()

/**
 * モジュールの index.ts から @dependencies タグを読み取る
 * @param {string} baseDir
 * @param {string} moduleName
 * @returns {string[] | null} 依存モジュール名の配列。@dependencies がなければ null
 */
function readDependencies(baseDir, moduleName) {
  const cacheKey = `${baseDir}/${moduleName}`
  if (depsCache.has(cacheKey)) {
    return depsCache.get(cacheKey)
  }

  const indexPath = resolve(baseDir, moduleName, "index.ts")
  let content
  try {
    content = readFileSync(indexPath, "utf-8")
  } catch {
    depsCache.set(cacheKey, null)
    return null
  }

  const match = content.match(/@dependencies\s+(.+)/)
  if (!match) {
    depsCache.set(cacheKey, null)
    return null
  }

  const deps = match[1]
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
  depsCache.set(cacheKey, deps)
  return deps
}

/**
 * 依存パターンとインポートパスのマッチング
 *
 * - "db"      → "db" のみ（トップレベルのみ）
 * - "db/*"    → "db" と "db/user" （直下のサブモジュールまで）
 * - "db/**"   → "db" と "db/user" と "db/user/nested" ...（全階層）
 *
 * @param {string} pattern
 * @param {string} importPath
 * @returns {boolean}
 */
function matchDependency(pattern, importPath) {
  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3)
    return importPath === prefix || importPath.startsWith(prefix + "/")
  }
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -2)
    if (importPath === prefix) return true
    if (!importPath.startsWith(prefix + "/")) return false
    // 直下のみ: prefix 以降にスラッシュが1つだけ
    const rest = importPath.slice(prefix.length + 1)
    return !rest.includes("/")
  }
  return importPath === pattern
}

export default enforceDependencies
