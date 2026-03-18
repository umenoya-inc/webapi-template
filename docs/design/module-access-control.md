# index.ts によるモジュールアクセス制御

## 概要

`src/modules/` 配下のアクセス制御を、`index.ts` の有無とトップレベルモジュールの壁という2つの仕組みだけで実現する。設定ファイルやアノテーションは不要で、ディレクトリ構造そのものがアクセスポリシーを表現する。

## 2つの原則

### 1. トップレベルモジュールの壁は越えられない

`src/modules/` 直下のディレクトリ（`db/`, `domain/`, `contract/` 等）がトップレベルモジュールとなる。異なるトップレベルモジュール間のアクセスは、必ず `@/modules/<module>` エイリアス経由の barrel export を通る。相対パスでモジュール外に出ることはできない。

### 2. index.ts の有無がサブモジュール境界を決める

トップレベルモジュール内のサブディレクトリは、`index.ts` を持つかどうかで役割が変わる。

- **`index.ts` あり** → カプセル化されたサブモジュール。外部からは barrel export 経由でのみアクセスできる
- **`index.ts` なし** → モジュール内部の整理用ディレクトリ。同一トップレベルモジュール内から自由にアクセスできる

## 例

```
src/modules/db/
├── error/                 # index.ts なし → db/ 内で自由に共有
│   ├── DbError.ts
│   └── dbExecute.ts
├── testing/               # index.ts なし → db/ 内で自由に共有
│   └── createTestDbContext.testutil.ts
├── user/                  # index.ts あり → カプセル化されたサブモジュール
│   ├── index.ts
│   ├── User.ts
│   ├── createUser.ts
│   └── userTable.ts
├── DbContext.ts
├── fromDbContext.ts
└── index.ts
```

この構造では:

- `db/user/createUser.ts` → `db/error/dbExecute.ts` を相対 import できる（`error/` は `index.ts` なし）
- `db/user/createUser.ts` → `db/fromDbContext.ts` を相対 import できる（同一トップレベルモジュール内）
- `domain/user/` → `db/user/` の内部ファイルにアクセスできない（トップレベルモジュールの壁）
- `domain/user/` → `domain/todo/` の内部ファイルにアクセスできない（両方 `index.ts` を持つサブモジュール）

## 設計判断

**`index.ts` を置かないことで開放する。** 通常のアクセス制御は「何かを追加して可視性を制限する」が、この設計では逆に「`index.ts` を追加しないことで、親モジュール内での自由な共有を許可する」。`index.ts` を追加した瞬間にそのディレクトリはカプセル化される。

**設定より規約。** `index.ts` の有無という単一の規約で、共有ユーティリティとカプセル化されたサブモジュールを区別する。ディレクトリ構造を見るだけでアクセスポリシーが読み取れる。

**lint で強制する。** この規約はカスタム oxlint プラグイン（`module-boundary/no-module-internal-import`）で自動的に検証される。開発者がルールを記憶する必要はなく、違反は CI で検出される。
