/**
 * 型注釈の AST を再帰的に走査し、型の展開コストをスカラー値で算出する。
 * コストが閾値を超えた場合に警告を出す。
 *
 * @type {import("oxlint/plugins-dev").Rule}
 */
const typeExpansionCost = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Warn when a type annotation's estimated expansion cost exceeds a threshold.",
    },
    messages: {
      highCost:
        "型の展開コストが {{ cost }} です（閾値: {{ threshold }}）。interface の導入や型の分割を検討してください。",
    },
    schema: [
      {
        type: "object",
        properties: {
          threshold: { type: "number" },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] ?? {}
    const threshold = options.threshold ?? 20

    return {
      // export type Foo = ...
      ExportNamedDeclaration(node) {
        if (!node.declaration) return

        if (node.declaration.type === "TSTypeAliasDeclaration") {
          const typeAnnotation = node.declaration.typeAnnotation
          if (!typeAnnotation) return
          const cost = computeCost(typeAnnotation)
          if (cost > threshold) {
            context.report({
              node: node.declaration.id,
              messageId: "highCost",
              data: { cost: String(cost), threshold: String(threshold) },
            })
          }
        }

        // export const foo: ReturnType = ... / export function foo(): ReturnType { ... }
        if (node.declaration.type === "VariableDeclaration") {
          for (const decl of node.declaration.declarations) {
            checkTypeAnnotation(context, decl.id?.typeAnnotation, decl.id, threshold)
          }
        }

        if (node.declaration.type === "FunctionDeclaration") {
          checkTypeAnnotation(context, node.declaration.returnType, node.declaration.id, threshold)
        }
      },
    }
  },
}

/**
 * @param {import("oxlint/plugins-dev").Context} context
 * @param {import("oxlint/plugins-dev").Node | null | undefined} typeAnnotationWrapper
 * @param {import("oxlint/plugins-dev").Node | null | undefined} reportNode
 * @param {number} threshold
 */
function checkTypeAnnotation(context, typeAnnotationWrapper, reportNode, threshold) {
  if (!typeAnnotationWrapper || !reportNode) return

  // TSTypeAnnotation wraps the actual type node
  const typeNode =
    typeAnnotationWrapper.type === "TSTypeAnnotation"
      ? typeAnnotationWrapper.typeAnnotation
      : typeAnnotationWrapper

  if (!typeNode) return

  const cost = computeCost(typeNode)
  if (cost > threshold) {
    context.report({
      node: reportNode,
      messageId: "highCost",
      data: { cost: String(cost), threshold: String(threshold) },
    })
  }
}

/**
 * 型ノードの展開コストを再帰的に計算する。
 *
 * @param {import("oxlint/plugins-dev").Node} node
 * @returns {number}
 */
function computeCost(node) {
  if (!node || !node.type) return 1

  switch (node.type) {
    // --- 名前付き型への参照: 展開が止まる ---
    case "TSTypeReference":
      return 1 + computeTypeArgsCost(node.typeArguments ?? node.typeParameters)

    // --- intersection / union: メンバーのコスト合算 ---
    case "TSIntersectionType":
    case "TSUnionType":
      return sumCosts(node.types)

    // --- オブジェクトリテラル: プロパティのコスト合算 ---
    case "TSTypeLiteral":
      return Math.max(1, sumMemberCosts(node.members))

    // --- conditional type: 全パーツの合算 ---
    case "TSConditionalType":
      return (
        computeCost(node.checkType) +
        computeCost(node.extendsType) +
        computeCost(node.trueType) +
        computeCost(node.falseType)
      )

    // --- mapped type: 固定コスト + 値型のコスト ---
    case "TSMappedType":
      return 5 + computeCost(node.typeAnnotation)

    // --- 配列 / タプル ---
    case "TSArrayType":
      return 1 + computeCost(node.elementType)

    case "TSTupleType":
      return sumCosts(node.elementTypes)

    // --- 関数型: パラメータ + 戻り値 ---
    case "TSFunctionType":
    case "TSConstructorType":
      return sumParamCosts(node.params) + computeCost(node.returnType)

    // --- typeof ---
    case "TSTypeQuery":
      return 1

    // --- keyof / readonly / rest ---
    case "TSTypeOperator":
      return 1 + computeCost(node.typeAnnotation)

    // --- indexed access: T[K] ---
    case "TSIndexedAccessType":
      return computeCost(node.objectType) + computeCost(node.indexType)

    // --- infer ---
    case "TSInferType":
      return 1

    // --- template literal type ---
    case "TSTemplateLiteralType":
      return 1 + sumCosts(node.types ?? [])

    // --- parenthesized ---
    case "TSParenthesizedType":
      return computeCost(node.typeAnnotation)

    // --- import type ---
    case "TSImportType":
      return 1

    // --- プリミティブ / リテラル / その他の末端 ---
    default:
      return 1
  }
}

/**
 * @param {import("oxlint/plugins-dev").Node[] | undefined} types
 * @returns {number}
 */
function sumCosts(types) {
  if (!types || types.length === 0) return 1
  let total = 0
  for (const t of types) {
    total += computeCost(t)
  }
  return total
}

/**
 * @param {import("oxlint/plugins-dev").Node[] | undefined} members
 * @returns {number}
 */
function sumMemberCosts(members) {
  if (!members || members.length === 0) return 1
  let total = 0
  for (const m of members) {
    // TSPropertySignature, TSMethodSignature, TSIndexSignature, etc.
    const typeAnn = m.typeAnnotation
    if (typeAnn && typeAnn.type === "TSTypeAnnotation") {
      total += computeCost(typeAnn.typeAnnotation)
    } else {
      total += 1
    }
  }
  return total
}

/**
 * @param {import("oxlint/plugins-dev").Node | undefined} typeArgs
 * @returns {number}
 */
function computeTypeArgsCost(typeArgs) {
  if (!typeArgs || !typeArgs.params) return 0
  let total = 0
  for (const arg of typeArgs.params) {
    total += computeCost(arg)
  }
  return total
}

/**
 * @param {import("oxlint/plugins-dev").Node[] | undefined} params
 * @returns {number}
 */
function sumParamCosts(params) {
  if (!params || params.length === 0) return 0
  let total = 0
  for (const p of params) {
    const typeAnn = p.typeAnnotation
    if (typeAnn && typeAnn.type === "TSTypeAnnotation") {
      total += computeCost(typeAnn.typeAnnotation)
    } else {
      total += 1
    }
  }
  return total
}

export default typeExpansionCost
