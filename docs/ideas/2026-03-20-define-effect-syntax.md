# defineEffect の構文改善

## 概要

defineEffect の3つのオーバーロード（leaf / service のみ / service + 固有 context）のうち、leaf と service のみのケースは deps を簡略化できる可能性がある。ただし第3ケース（service + 固有 context）の構文改善は難しく、現状の `{ service, context }` 構造が妥当という結論に至った。

## 検討した代替構文

### leaf Effect — fn 引数注釈から推論

```typescript
// Before
defineEffect({ context: requiredContext<{ db: DbContext }>() }, (context) => ...)

// After — deps 不要、引数の型注釈から推論
defineEffect((context: { db: DbContext }) => ...)
```

### service のみ — deps をフラットに

```typescript
// Before
defineEffect({ service: { createUser } }, (service) => (context) => ...)

// After — service ラッパー不要
defineEffect({ createUser }, (service) => (context) => ...)
```

### service + 固有 context — 未解決

以下の案を検討したが、いずれも一長一短：

- **withContext ラッパー**: `defineEffect(withContext<{ auth: AuthContext }>({ createUser }), ...)` — 読みやすいが第2ケースと見た目が変わる
- **第2引数**: `defineEffect({ createUser }, requiredContext<{ auth: AuthContext }>(), ...)` — 引数が3つになる
- **withContext ファクトリ**: `const defineApiEffect = withContext<{ auth: AuthContext }>(defineEffect)` — context パターンごとにファクトリが増殖する

## 見送りの理由

- 第3ケースは認証導入で頻出パターンになることが予想される
- leaf / service のみを改善しても、最頻出パターンが改善されないなら全体の一貫性が下がるだけ
- 現状の `{ service, context: requiredContext<...>() }` 構文は3ケースとも統一的で十分読みやすい

## 再検討のタイミング

- 認証が実装され、第3ケースが実際に頻出した時点で体験を再評価する
- TypeScript に部分型引数推論が入った場合、`defineEffect<{ auth: AuthContext }>({ createUser }, ...)` が可能になり根本的に解決する
