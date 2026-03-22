import { describe, expect, it } from "vite-plus/test"
import { pgExecute } from "./pgExecute"

describe("pgExecute", () => {
  it("成功時は ok: true と値を返す", async () => {
    const result = await pgExecute(async () => ({ id: "1", name: "Alice" }))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ id: "1", name: "Alice" })
    }
  })

  it("PostgreSQL unique_violation エラーを DbError に変換する", async () => {
    const pgError = { code: "23505", constraint: "users_email_unique" }
    const result = await pgExecute(async () => {
      throw pgError
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.kind).toBe("unique_violation")
      if (result.error.kind === "unique_violation") {
        expect(result.error.field).toBe("email")
      }
    }
  })

  it("PostgreSQL の未知のエラーコードを unknown DbError に変換する", async () => {
    const pgError = { code: "42P01" }
    const result = await pgExecute(async () => {
      throw pgError
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.kind).toBe("unknown")
    }
  })

  it("cause チェーンに埋まった PostgreSQL エラーも検出する", async () => {
    const pgError = { code: "23505", constraint: "users_name_unique" }
    const wrappedError = new Error("Drizzle error", { cause: pgError })
    const result = await pgExecute(async () => {
      throw wrappedError
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.kind).toBe("unique_violation")
      if (result.error.kind === "unique_violation") {
        expect(result.error.field).toBe("name")
      }
    }
  })

  it("DB エラー以外の例外はそのまま throw する", async () => {
    const error = new Error("Network timeout")
    await expect(
      pgExecute(async () => {
        throw error
      }),
    ).rejects.toThrow("Network timeout")
  })

  it("SQLSTATE 形式でない code を持つエラーは DB エラーとして扱わない", async () => {
    const nonPgError = { code: "ERR_NETWORK" }
    await expect(
      pgExecute(async () => {
        throw nonPgError
      }),
    ).rejects.toBe(nonPgError)
  })

  it("制約名からフィールド名を抽出できない場合は unknown を返す", async () => {
    const pgError = { code: "23505" }
    const result = await pgExecute(async () => {
      throw pgError
    })
    expect(result.ok).toBe(false)
    if (!result.ok && result.error.kind === "unique_violation") {
      expect(result.error.field).toBe("unknown")
    }
  })
})
