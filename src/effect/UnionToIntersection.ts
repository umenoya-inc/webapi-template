/** Union 型を Intersection 型に変換するユーティリティ型。 */
export type UnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (
  x: infer I,
) => void
  ? I
  : never
