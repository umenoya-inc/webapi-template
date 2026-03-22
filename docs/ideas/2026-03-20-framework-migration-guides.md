# 他フレームワーク経験者向けの入門ドキュメント

## 概要

既存フレームワークの知識を持つ開発者向けに、概念のマッピングで学習コストを下げる入門ドキュメントを用意するアイディア。「あなたが知っているこの概念は、ここではこう書く」という対応表形式。

## 候補となるターゲット

### NestJS 経験者向け

- `@Injectable()` + コンストラクタ注入 → `defineEffect` の `service` 宣言
- `@Guard()` / `AuthGuard` → `authMiddleware` + `requiredContext<{ auth }>`
- DTO + `class-validator` → Valibot スキーマ + `defineContract`
- 例外フィルター → `EffectChainError` + `defineRoute` の catch
- Module → `index.ts` barrel export によるアクセス制御

### Effect-TS 経験者向け

- `Layer` / `Context` → `defineEffect` の `service` / `context`
- `Effect.gen` → `defineContract` の `fn`（素の async 関数）
- `Effect.provide` → `defineRoute` の `provide`
- ランタイム不要、型推論のみで依存合成

### 素の Express / Hono 経験者向け

- ミドルウェア → `authMiddleware`（ここは同じ）
- `req.body` の手動バリデーション → `defineContract` の自動バリデーション
- 手動テスト / supertest → `testBehavior` + `mockService` による型強制テスト

## 背景

フレームワーク固有の「お作法」が多く、初見の開発者の学習コストが高い。既存知識とのブリッジがあるだけで理解速度が大幅に上がる。

## タイミング

フレームワークの設計がまだ進化途中のため、安定したタイミングで作成するのが効率的。現時点では概念の対応関係だけ整理しておく。
