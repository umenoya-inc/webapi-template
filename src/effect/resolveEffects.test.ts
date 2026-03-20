import { describe, expect, it } from "vite-plus/test"
import { EffectChainError } from "./EffectChainError"
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
