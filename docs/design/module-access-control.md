# index.ts によるモジュールアクセス制御

## 概要

`src/` 配下のアクセス制御を、`index.ts` の有無とトップレベルモジュールの壁という2つの仕組みで実現する。ディレクトリ構造そのものがアクセスポリシーを表現する。

## 2つの原則

### 1. トップレベルモジュールの壁は越えられない

`src/` 直下のディレクトリ（`db/`, `domain/`, `behavior/` 等）がトップレベルモジュールとなる。異なるトップレベルモジュール間のアクセスは、必ず `@/<module>` エイリアス経由の barrel export を通る。相対パスでモジュール外に出ることはできない。

### 2. index.ts の有無がサブモジュール境界を決める

トップレベルモジュール内のサブディレクトリは、`index.ts` を持つかどうかで役割が変わる。

- **`index.ts` あり** → カプセル化されたサブモジュール。外部からは barrel export 経由でのみアクセスできる
- **`index.ts` なし** → モジュール内部の整理用ディレクトリ。同一トップレベルモジュール内から自由にアクセスできる

## 依存方向の宣言（@dependencies）

`index.ts` の JSDoc に `@dependencies` タグを記述すると、そのモジュールがインポートできるモジュールを制限できる。

```typescript
// src/domain/index.ts
/**
 * @packageDocumentation
 * ## domain モジュール
 *
 * @dependencies db, contract
 */
```

この宣言により、`domain` モジュール内のファイルは `@/db` と `@/contract`（およびそれらのサブモジュール）のみインポートできる。`@/envvar` や `@/routes` 等をインポートすると lint エラーになる。

- **オプトイン** — `@dependencies` がないモジュールは制約なし。どこからでもインポートできる
- **テストファイルは対象外** — `.test.ts` / `.testutil.ts` は `@dependencies` の制約を受けない
- **lint で強制** — `module-boundary/enforce-dependencies` ルールで自動検証される

## 例

```
src/db/
├── error/                 # index.ts なし → db/ 内で自由に共有
│   ├── DbError.ts
│   └── pgExecute.ts
├── testing/               # index.ts なし → db/ 内で自由に共有
│   └── createTestDbContext.testutil.ts
├── user/                  # index.ts あり → カプセル化されたサブモジュール
│   ├── index.ts
│   ├── User.ts
│   ├── createUser.ts
│   └── userTable.ts
├── DbClient.ts
├── DbContext.ts
├── fromDbContext.ts
└── index.ts
```

この構造では:

- `db/user/createUser.ts` → `db/fromDbContext.ts` を相対 import できる（同一トップレベルモジュール内）
- `db/user/createUser.ts` → `db/error/pgExecute.ts` は直接 import しない（`DbClient` 内部に隠蔽）
- `domain/user/` → `db/user/` の内部ファイルにアクセスできない（トップレベルモジュールの壁）
- `domain/user/` → `domain/todo/` の内部ファイルにアクセスできない（両方 `index.ts` を持つサブモジュール）

## 設計判断

**`index.ts` を置かないことで開放する。** 通常のアクセス制御は「何かを追加して可視性を制限する」が、この設計では逆に「`index.ts` を追加しないことで、親モジュール内での自由な共有を許可する」。`index.ts` を追加した瞬間にそのディレクトリはカプセル化される。

**設定より規約。** `index.ts` の有無と `@dependencies` タグという規約で、モジュール間のアクセスポリシーを表現する。ディレクトリ構造と `index.ts` を見るだけで依存関係が読み取れる。

**lint で強制する。** この規約はカスタム oxlint プラグイン（`module-boundary/no-module-internal-import`, `module-boundary/enforce-dependencies`）で自動的に検証される。

## 参考

- [Rust のモジュールシステム](https://doc.rust-lang.org/book/ch07-00-managing-growing-projects-with-packages-crates-and-modules.html) — `mod.rs` がモジュールの公開 API を定義し、`pub` をつけないものはモジュール外から不可視になる。`index.ts` の役割はこれに近い
- [Convention over Configuration](https://en.wikipedia.org/wiki/Convention_over_configuration) — 設定ファイルではなくディレクトリ構造の規約でアクセスポリシーを表現する考え方
