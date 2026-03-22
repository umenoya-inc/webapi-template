import { describe, expect, it } from "vite-plus/test"
import { defineEffect } from "./defineEffect"
import { effectDepsKey } from "./effectDepsKey"
import { requiredContext } from "./requiredContext"

/* eslint-disable @typescript-eslint/no-explicit-any */

describe("defineEffect", () => {
  it("Leaf: context のみの Effect を定義できる", () => {
    const context = requiredContext<{ db: unknown }>()
    const effect = defineEffect({ context }, (ctx) => {
      return async () => ({ ok: true, value: ctx })
    })

    expect(typeof effect).toBe("function")
  })

  it("Composite: service のみの Effect を定義できる", () => {
    const leaf = defineEffect({ context: requiredContext<{ db: unknown }>() }, (_ctx) => {
      return async () => ({ ok: true, value: "leaf" })
    })

    const composite = defineEffect({ service: { leaf } } as any, (service: any) => (_ctx: any) => {
      return async () => service.leaf(_ctx)()
    })

    expect(typeof composite).toBe("function")
  })

  it("Node: service + context の Effect を定義できる", () => {
    const leaf = defineEffect({ context: requiredContext<{ db: unknown }>() }, (_ctx) => {
      return async () => ({ ok: true, value: "leaf" })
    })

    const node = defineEffect(
      { service: { leaf }, context: requiredContext<{ auth: unknown }>() } as any,
      (service: any) => (_ctx: any) => {
        return async () => service.leaf(_ctx)()
      },
    )

    expect(typeof node).toBe("function")
  })

  it("effectDepsKey に deps を格納する", () => {
    const context = requiredContext<{ db: unknown }>()
    const effect = defineEffect({ context }, (_ctx) => {
      return async () => ({ ok: true, value: 1 })
    })

    const deps = (effect as any)[effectDepsKey]
    expect(deps).toBeDefined()
    expect(deps).toHaveProperty("context")
  })

  it("Leaf Effect の fn を呼び出せる", async () => {
    const effect = defineEffect(
      { context: requiredContext<{ db: string }>() },
      (ctx) => async () => ({ ok: true, value: ctx.db }),
    )

    const fn = effect({ db: "test-db" })
    const result = await fn()
    expect(result).toEqual({ ok: true, value: "test-db" })
  })
})
