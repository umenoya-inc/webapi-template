import { effectDepsKey } from "./effectDepsKey"

/* eslint-disable @typescript-eslint/no-explicit-any */

type EffectFn = ((...args: any[]) => any) & { [key: symbol]: any }
type ServiceMap = Record<string, EffectFn>
type ResolvedMap = Record<string, (context: any) => any>

/** フラットな Effect 群を再帰的に解決し、各 Effect を `(context) => Fn` にする。 */
export function resolveEffects(service: ServiceMap): ResolvedMap {
  const resolved: ResolvedMap = {}
  const resolving = new Set<string>()

  function resolve(key: string, effect: EffectFn): (context: any) => any {
    if (resolved[key]) return resolved[key]
    if (resolving.has(key)) {
      throw new Error(`Circular dependency detected: ${key}`)
    }
    resolving.add(key)

    const deps = (effect as Record<symbol, any>)[effectDepsKey] as
      | { service?: ServiceMap }
      | undefined
    const childService = deps?.service

    let result: (context: any) => any
    if (childService && Object.keys(childService).length > 0) {
      const resolvedChildren: ResolvedMap = {}
      for (const [childKey, childEffect] of Object.entries(childService)) {
        resolvedChildren[childKey] = resolve(childKey, service[childKey] ?? childEffect)
      }
      result = effect(resolvedChildren)
    } else {
      result = effect as (context: any) => any
    }

    resolving.delete(key)
    resolved[key] = result
    return result
  }

  for (const [key, effect] of Object.entries(service)) {
    resolve(key, effect)
  }
  return resolved
}
