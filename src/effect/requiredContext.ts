/** defineEffect の context 宣言で型だけを指定するためのヘルパー。 */
export function requiredContext<T extends Record<string, unknown>>(): T {
  return undefined as unknown as T
}
