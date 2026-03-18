# Contract の合成による宣言的 variant 導出

## 概要

複数の defineContract 関数を合成する際、依存先の variant を宣言的に透過・変換するルールを定義することで、`fn` の実装を書く前に戻り値の variant 集合を確定させる。

## 応用候補

- **variant の自動合成** — `findUserById(success | not_found)` + `saveTodo(success | duplicate_entry)` → `createTodo(success | not_found | duplicate_entry)` が依存関係の構造から導出される
- **variant の変換** — 依存先の `not_found` を `assignee_not_found` にリネームして透過するなど、呼び出し側に適した reason に変換する
- **未処理 variant の検出** — 依存先が返しうる variant のうち、`fn` 内で処理されていないものをコンパイル時に検出する

## 背景

現状は `return result` による透過で TypeScript が union を自動集約しており、実用上は動いている。宣言的な合成が価値を持つのは、モジュール間の依存が深くなり「この関数が返しうるエラーの全体像が追いにくい」と感じたとき。API の複雑さとのトレードオフがある。
