# defineEffect — 軽量 Effect System

## 概要

既存の `(service) => (context) => (input) => result` パターンを抽象化し、依存の自動合成と副作用の型レベル明示を実現する `defineEffect` を導入する。Effect-TS のような外部ライブラリに依存せず、TypeScript の型システムだけで構築する。

## 用語

Effect System の標準的な語彙を借用する。

| 用語        | 役割                                    | 対応する概念           |
| ----------- | --------------------------------------- | ---------------------- |
| **Effect**  | 副作用を持つ計算の型表現                | Effect / Eff           |
| **service** | 副作用の実体（Effect の集合）           | Service / Handler      |
| **context** | 副作用の実行に必要なリソース            | Context / Requirements |
| **provide** | Effect に service と context を供給する | provide / runWith      |

## 設計方針

### 決定事項

1. **service は省略不可** — デフォルト値を持たせず、常に明示的に provide する。依存グラフを型で完全に追跡するため
2. **context の型は自動導出、値は手動** — service に含まれる Effect の context 要求を intersection で自動導出する。値は呼び出し側が渡すことで、transaction 境界の制御権を保持する
3. **戻り値はブランド付き関数** — `Effect<Service, Context, Fn>` として service 型・context 型を抽出可能にする。既存の `BehaviorBrand` パターンを踏襲
4. **service はフラット化 + 同一キー制約** — 子 Effect の service が親にフラットに伝播する。同じキー名は同じ関数を参照する制約を受け入れる（1ファイル1エクスポートルールと整合）
5. **testBehavior とは結合しない** — テスト側は従来通り mockEnv で個別に mock する。Effect の関心（依存合成）とテストの関心（振る舞い検証）を分離
6. **service には Effect だけが入る** — 純粋な関数は service に入れず直接 import して呼ぶ。service は副作用を持つ依存の宣言に限定する
7. **context は Record 型に制約** — `Record<string, unknown>` に制約し、intersection が名前付きキーのマージとして直感的に動作する
8. **deps は名前付きオブジェクト** — `{ service, context }` の形で宣言し、どちらも省略可能

## 型定義

### Effect 型

```typescript
declare const effectBrand: unique symbol

type Effect<
  Service extends Record<string, Effect<any, any, any>>,
  Context extends Record<string, unknown>,
  Fn,
> = ((service: ResolvedService<Service>) => (context: Context) => Fn) & {
  readonly [effectBrand]: { service: Service; context: Context }
}
```

### ResolvedService — fn が受け取る service の型

service の各メンバーから service 層を剥がし、`(context) => Fn` の形にする。
型パラメータの Service には `Effect` 型を保持して依存グラフの伝播に使い、fn に渡すときは解決済みの形に変換する。

```typescript
type ResolvedService<Service extends Record<string, Effect<any, any, any>>> = {
  [K in keyof Service]: Service[K] extends Effect<any, infer C, infer F> ? (context: C) => F : never
}
```

### FlattenService — 子の service を再帰的にフラット化

```typescript
type FlattenService<Declared extends Record<string, Effect<any, any, any>>> = Declared &
  UnionToIntersection<
    {
      [K in keyof Declared]: Declared[K] extends Effect<infer ChildService, any, any>
        ? FlattenService<ChildService>
        : {}
    }[keyof Declared]
  >
```

同一キー・同一型は intersection で自然に解決する。同一キー・異なる型は intersection が矛盾してコンパイルエラー → 同一キー制約の型レベル強制。

### DeriveContext — service の依存から context を自動導出

```typescript
type DeriveContext<Service extends Record<string, Effect<any, any, any>>> = UnionToIntersection<
  {
    [K in keyof FlattenService<Service>]: FlattenService<Service>[K] extends Effect<
      any,
      infer C,
      any
    >
      ? C
      : never
  }[keyof FlattenService<Service>]
>
```

### defineEffect シグネチャ

```typescript
// service + context あり
function defineEffect<
  Declared extends Record<string, Effect<any, any, any>>,
  OwnContext extends Record<string, unknown>,
  Fn,
>(
  deps: { service: Declared; context: OwnContext },
  fn: (
    service: ResolvedService<FlattenService<Declared>>,
  ) => (context: OwnContext & DeriveContext<Declared>) => Fn,
): Effect<FlattenService<Declared>, OwnContext & DeriveContext<Declared>, Fn>

// context のみ（leaf Effect）
function defineEffect<OwnContext extends Record<string, unknown>, Fn>(
  deps: { context: OwnContext },
  fn: (context: OwnContext) => Fn,
): Effect<{}, OwnContext, Fn>

// service のみ（自分固有の context なし）
function defineEffect<Declared extends Record<string, Effect<any, any, any>>, Fn>(
  deps: { service: Declared },
  fn: (
    service: ResolvedService<FlattenService<Declared>>,
  ) => (context: DeriveContext<Declared>) => Fn,
): Effect<FlattenService<Declared>, DeriveContext<Declared>, Fn>
```

## defineRoute との統合

### provide による依存供給

defineRoute が Effect の唯一の provide ポイント。service と context を名前付きで分けて渡す。

```typescript
type RouteOptions<E extends Effect<any, any, any>> = {
  effect: E
  provide: (c: HonoContext) => {
    service: ProvideService<E> // フラット化された全依存の Effect を要求
    context: ProvideContext<E> // 導出された context の値を要求
  }
  description: string
}

type ProvideService<E> = E extends Effect<infer S, any, any> ? S : never
type ProvideContext<E> = E extends Effect<any, infer C, any> ? C : never
```

### provide に渡す service は Effect そのもの

provide では生の Effect を渡す。defineRoute 内部がフラットな Effect 群を再帰的に解決し、各 Effect に service を注入して `(context) => Fn` にする。

### defineRoute 内部の処理フロー

1. `provide(c)` から service（Effect 群）と context（リソース値）を受け取る
2. service のフラットな Effect 群を再帰的に解決（各 Effect に service を注入して `(context) => Fn` にする）
3. トップレベルの Effect に解決済み service を渡す
4. リクエストごとに context を渡して実行

### transaction との関係

provide で渡す context はデフォルトのリソース（globalDbContext 等）。transaction 内では fn の中で局所的に context を差し替える。defineEffect の設計がこれを妨げない（context は値として手動で渡せるため）。

```typescript
const postUser = defineEffect(
  { service: { createUser }, context: { db: DbContext } },
  (service) => (context) =>
    defineRouteContract({
      fn: async (input) => {
        // fn 内で transaction を開始し、context を差し替え
        return await dbTransaction(async (txDb) => {
          return matchBehavior(
            await service.createUser({ db: txDb })(input),
            { ... }
          )
        })
      }
    })
)

// provide は globalDbContext のまま
defineRoute({
  effect: postUser,
  provide: (c) => ({
    service: { createUser },
    context: { db: globalDbContext },
  }),
  description: "ユーザーを新規作成する",
})
```

## コード例

```typescript
// leaf Effect — context のみ
const findUserByEmail = defineEffect(
  { context: { db: DbContext } },
  (context) => defineContract({ ... })
)

// service + context あり
const createUser = defineEffect(
  { service: { findUserByEmail }, context: { db: DbContext } },
  (service) => (context) =>
    defineContract({
      fn: async (input) => {
        const found = await service.findUserByEmail(context)(input.email)
        // ...
      }
    })
)

// service のみ（自分固有の context なし、service から導出）
const postUser = defineEffect(
  { service: { createUser } },
  (service) => (context) =>
    // context: { db: DbContext }（createUser から自動導出）
    defineRouteContract({
      fn: async (input) => {
        const result = await service.createUser(context)(input)
      }
    })
)

// defineRoute での provide
postUserRoute.post(
  "/",
  ...defineRoute({
    effect: postUser,
    provide: (c) => ({
      service: { createUser, findUserByEmail },
      context: { db: globalDbContext },
    }),
    description: "ユーザーを新規作成する",
  }),
)
```

## 設計判断の背景

### service に Effect だけが入る理由

純粋な関数（hashPassword 等）は副作用がなく、差し替える理由がない。直接 import して呼べばよい。service を「副作用を持つ依存の宣言」に限定することで、ResolvedService は常に `(context) => Fn` の統一的な形になる。

### context を自動解決しない理由

transaction 境界は呼び出し側の判断。context を自動解決すると、globalDbContext にバインドされてしまい transaction 内で差し替えられない。型だけ導出し、値は手動で渡す。

### context を Record に制約する理由

opaque 型同士の intersection は何が起きるかわかりにくいが、Record なら「キーが増えていく」という直感的な合成になる。provide 時も `{ db: ..., cache: ... }` のように構造が明確。

### 依存グラフが型に現れる価値

フラット化により、トップレベルの Effect の型に依存グラフ全体が現れる。これにより：

- defineRoute の provide で渡し忘れがコンパイルエラー
- 循環依存が型の無限再帰として検出される
- テスト時に「何を mock すべきか」が型から読み取れる

### provide で service と context を分ける理由

service（Effect 群）と context（リソース値）は性質が異なる。フラットにまとめると依存が増えたときに混乱する。名前付きで分けることで「何を渡しているか」の意図が明確になる。

## 関連

- [DepsOf による依存コンテキストの合成](2026-03-20-depsof-context-composition.md) — context の型導出部分はこのアイディアの発展形
- [behavior モジュール](../../src/behavior/index.ts) — `BehaviorBrand` のブランドパターンを踏襲
- [contract モジュール](../../src/contract/index.ts) — `defineContract` の上に載せる形
