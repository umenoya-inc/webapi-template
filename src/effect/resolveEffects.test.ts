import { describe, expect, it } from "vite-plus/test"
import { EffectChainError } from "./EffectChainError"
import type { EffectTrace } from "./EffectTrace"
import { defineEffect } from "./defineEffect"
import { requiredContext } from "./requiredContext"
import { resolveEffects } from "./resolveEffects"

/* eslint-disable @typescript-eslint/no-explicit-any */

describe("resolveEffects", () => {
  it("leaf Effect のエラーに Effect 名が付与される", async () => {
    const failing = defineEffect({ context: requiredContext<{ db: unknown }>() }, (_context) => {
      return async () => {
        throw new Error("DB connection failed")
      }
    })

    const resolved = resolveEffects({ failing } as any)
    await expect(resolved.failing({})()).rejects.toThrow(EffectChainError)
    await expect(resolved.failing({})()).rejects.toThrow(
      "Effect chain [failing]: DB connection failed",
    )
  })

  it("ネストした Effect チェーンのエラーに経路情報が付与される", async () => {
    const inner = defineEffect({ context: requiredContext<{ db: unknown }>() }, (_context) => {
      return async (_input: { id: string }) => {
        throw new Error("Unexpected error")
      }
    })

    const outer = defineEffect({ service: { inner } } as any, (service: any) => (_context: any) => {
      return async (input: { userId: string }) => {
        return await service.inner(_context)({ id: input.userId })
      }
    })

    const resolved = resolveEffects({ inner, outer } as any)
    try {
      await resolved.outer({})({ userId: "user-1" })
      expect.unreachable("should have thrown")
    } catch (e) {
      expect(e).toBeInstanceOf(EffectChainError)
      const err = e as EffectChainError
      expect(err.chain).toEqual(["outer", "inner"])
      expect(err.message).toBe("Effect chain [outer → inner]: Unexpected error")
      expect(err.cause).toBeInstanceOf(Error)
      expect((err.cause as Error).message).toBe("Unexpected error")
    }
  })

  it("エラーに各 Effect への入力値が記録される", async () => {
    const inner = defineEffect({ context: requiredContext<{ db: unknown }>() }, (_context) => {
      return async (_input: { id: string }) => {
        throw new Error("not found")
      }
    })

    const outer = defineEffect({ service: { inner } } as any, (service: any) => (_context: any) => {
      return async (input: { userId: string }) => {
        return await service.inner(_context)({ id: input.userId })
      }
    })

    const resolved = resolveEffects({ inner, outer } as any)
    try {
      await resolved.outer({})({ userId: "user-1" })
      expect.unreachable("should have thrown")
    } catch (e) {
      const err = e as EffectChainError
      expect(err.inputs).toEqual({
        outer: { userId: "user-1" },
        inner: { id: "user-1" },
      })
    }
  })

  it("エラーに各 Effect の実行時間が記録される", async () => {
    const inner = defineEffect({ context: requiredContext<{ db: unknown }>() }, (_context) => {
      return async () => {
        throw new Error("failed")
      }
    })

    const resolved = resolveEffects({ inner } as any)
    try {
      await resolved.inner({})()
      expect.unreachable("should have thrown")
    } catch (e) {
      const err = e as EffectChainError
      expect(err.durations).toHaveProperty("inner")
      expect(typeof err.durations.inner).toBe("number")
      expect(err.durations.inner).toBeGreaterThanOrEqual(0)
    }
  })

  it("onTrace コールバックで成功時のトレースが取得できる", async () => {
    const greet = defineEffect({ context: requiredContext<{ db: unknown }>() }, (_context) => {
      return async (_input: { name: string }) => {
        return { ok: true, value: "hello" }
      }
    })

    const traces: EffectTrace[] = []
    const resolved = resolveEffects({ greet } as any, (t) => traces.push(t))
    await resolved.greet({})({ name: "Alice" })

    expect(traces).toHaveLength(1)
    expect(traces[0].effect).toBe("greet")
    expect(traces[0].input).toEqual({ name: "Alice" })
    expect(traces[0].durationMs).toBeGreaterThanOrEqual(0)
  })

  it("引数なしの Effect では input が undefined になる", async () => {
    const noInput = defineEffect({ context: requiredContext<{ db: unknown }>() }, (_context) => {
      return async () => {
        throw new Error("failed")
      }
    })

    const resolved = resolveEffects({ noInput } as any)
    try {
      await resolved.noInput({})()
      expect.unreachable("should have thrown")
    } catch (e) {
      const err = e as EffectChainError
      expect(err.inputs).toEqual({ noInput: undefined })
    }
  })
})
