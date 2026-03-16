# Web API Template

Hono + TypeScript + Vite+ による Web API テンプレート。

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
