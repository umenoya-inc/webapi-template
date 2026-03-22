# インフラ関数の戻り値型には名前付き interface を宣言する

## ルール

複雑なジェネリック型を返すインフラ関数（`defineEffect`, `defineContract`, `defineRouteContract` 等）は、戻り値の型を `Function & Brand` の intersection ではなく、callable な名前付き `interface` として宣言する。呼び出し側では推論に任せ、型注釈は不要。

## 目的

- **hover の可読性:** 名前付き interface は hover で展開されないため、深くネストした型の truncation を防ぐ
- **AI ツールのトークン効率:** intersection の二重展開が解消され、型情報取得のトークン消費を大幅に削減する
- **型構造の意図の伝達:** `LeafEffect<C, Fn>` のような名前から、Effect の種類が一目でわかる

## 例

```typescript
// ✅ 戻り値型を callable interface で宣言
interface LeafEffect<OwnContext extends Record<string, unknown>, Fn> extends EffectBrand<
  {},
  {},
  OwnContext,
  Fn
> {
  (context: OwnContext): Fn
}

export function defineEffect<OwnContext extends Record<string, unknown>, Fn>(
  deps: { context: OwnContext },
  fn: (context: OwnContext) => Fn,
): LeafEffect<OwnContext, Fn>
```

```typescript
// ❌ intersection で直接記述
export function defineEffect<OwnContext extends Record<string, unknown>, Fn>(
  deps: { context: OwnContext },
  fn: (context: OwnContext) => Fn,
): ((context: OwnContext) => Fn) & EffectBrand<{}, {}, OwnContext, Fn>
```

## 適用対象

ビジネスロジックの関数は対象外。以下のようなインフラ関数に限定する。

- `defineEffect` — Effect の定義
- `defineContract` — スキーマ検証付き関数の定義
- `defineRouteContract` — ルート用の Contract 定義

## 例外

ジェネリックな関数型 `F` をそのまま intersection で返すパターン（`defineBehavior` の `F & BehaviorBrand`）は、`F` の call signature を interface で再現することが困難なため、intersection のまま許容する。
