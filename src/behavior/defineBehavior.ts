import type { BehaviorBrand } from "./BehaviorBrand"
import type { Desc } from "./Desc"

/**
 * 関数に BehaviorBrand を付与し、testBehavior / mockBehavior で使用可能にする。
 *
 * スキーマ検証なしで振る舞いパスの型表現とテスト網羅強制を実現する。
 * fn の戻り値は okAs / failAs で Desc ブランド付きにする必要がある。
 * ランタイムコストはゼロ（関数をそのまま返す）。
 *
 * ```typescript
 * export const findUser = (db: DB) =>
 *   defineBehavior(async (input: { id: string }) => {
 *     const user = await db.find(input.id)
 *     if (!user) {
 *       return failAs("ユーザーが存在しない", "not_found")
 *     }
 *     return okAs("ユーザーを取得", user)
 *   })
 * ```
 */
export function defineBehavior<
  F extends (...args: any[]) => Promise<Desc<string, { ok: true }> | Desc<string, { ok: false }>>,
>(fn: F): F & BehaviorBrand {
  return fn as F & BehaviorBrand
}
