# specdrift アノテーション

ドキュメント（`docs/rule/*.md`, `docs/design/*.md`）にソースファイルとの紐付けを記述し、コード変更時に仕様の乖離を検出する。

## 宣言

ファイル先頭（タイトルの前）に specdrift 宣言を置く。

```markdown
<!-- specdrift v1 -->

# ドキュメントタイトル
```

## アノテーション

ソースファイルに言及しているセクションに `source` タグを付ける。

```markdown
## セクション見出し

<!-- source: src/path/to/file.ts@TODO -->

セクションの内容...

<!-- /source -->
```

- パスは `.specdrift` マーカーからの相対パス（= プロジェクトルートからの相対パス）
- 初回は `@TODO` を付け、`specdrift update` でハッシュを解決する
- ドキュメントの主題と直接関係ないソースにはアノテーションを付けない

## コマンド

- ハッシュ解決: `specdrift update <file>`
- 乖離チェック: `specdrift check <file>`

## Lint

`/commit` スキルの check フローに `specdrift check` を組み込むことで強制。
