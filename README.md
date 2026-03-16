# Web API Template

Hono + TypeScript + Vite+ による Web API テンプレート。

## モジュール設計方針

本テンプレートでは、`src/modules/` 配下の各モジュールを擬似的なパッケージとして扱い、公開インターフェースと内部実装を分離する。

- **カプセル化** — 各モジュールは `index.ts` の barrel export で公開APIを制御する。内部実装のリファクタリングは、公開APIを変えない限り他モジュールに影響しない。
- **依存関係の明示化** — モジュール間のインポートは `@/modules/<module名>` エイリアスに統一する。import文を見るだけで依存方向がわかる。
- **検索性の担保** — 1ファイル1エクスポート、ファイル名とシンボル名を一致させることで、シンボル名からファイルを即座に特定できる。

詳細は [docs/rule/](docs/rule/) を参照。

## 初回セットアップ

### 1. Vite+ のインストール

```bash
curl -fsSL https://vite.plus | bash
```

インストーラーは `.bashrc` と `.profile` に環境設定を自動追記します。
zsh を使っている場合は、以下を `.zshrc` に手動で追記してください。

```bash
. "$HOME/.vite-plus/env"
```

追記後、ターミナルを再起動してください。

### 2. Node.js のセットアップ

`.node-version` に記載されたバージョンをインストールします。

```bash
vp env install
vp env pin
```

### 3. 依存関係のインストール

```bash
vp install
```
