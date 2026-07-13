# ドキュメント案内

> Status: Canonical
> Scope: `docs/` の入口と責務境界
> Owner: chibatakumi-portfolio
> Review trigger: 文書の正本・配置・所有リポジトリが変わるとき

この `docs/` は、portfolio リポジトリで保守する公開サイト・ブランド・実装補助の文書置き場である。ここにある文書の役割と正本を先に確認し、同じ情報を別の場所へ複製しない。

運用ルールは [DOCUMENTATION-GOVERNANCE.md](./DOCUMENTATION-GOVERNANCE.md) を正本とする。

## 最初に読むもの

| 用途 | 読む文書 | 正本 |
| --- | --- | --- |
| リポジトリの役割と開発導線 | [../README.md](../README.md) | このリポジトリ |
| 文書の置き場・更新方法 | [DOCUMENTATION-GOVERNANCE.md](./DOCUMENTATION-GOVERNANCE.md) | このリポジトリ |
| portfolio と life の責務境界 | [guides/life-repository-connection.md](./guides/life-repository-connection.md) | このリポジトリ |
| ブランド資産・利用規則 | [brand-identity-mini-guide.md](./brand-identity-mini-guide.md) | このリポジトリ |
| 2026 renewal の履歴と当時の判断 | [renewal-2026/README.md](./renewal-2026/README.md) | `renewal-2026/` 内の明記された正本 |

## 領域別の案内

| 領域 | 内容 | 追加先の判断 |
| --- | --- | --- |
| `guides/` | このリポジトリ固有の短い運用・実装ガイド | 実装者が繰り返し参照する、かつ外部リポジトリに正本がない場合のみ |
| `journal/` | Journal の編集方針、展開計画、引き継ぎ記録 | 公開コンテンツの編集契約や直接の根拠 |
| `marketing/` | キャンペーンの brief、分析、制作資料 | 施策単位の記録。終了後は新規の正本にしない |
| `logomark/` | ロゴマークの調査・設計・調整根拠 | ブランド資産の変更に関係する場合 |
| `photography/` | Photography LP の実装・i18n 引き継ぎ | 当該公開面の保守に必要な場合 |
| `remotion/` | Remotion に関する比較・検証メモ | 当該アプリの再現可能な判断・手順の場合 |
| `renewal-2026/` | 2026 renewal の履歴・エビデンス | 履歴として保持。新しい通常運用の文書は追加しない |

## 別リポジトリが正本のもの

| 対象 | 正本 | このリポジトリでの扱い |
| --- | --- | --- |
| Filmtone の製品仕様・Desktop/iOS リリース・公証 | [`vendor/filmtone/docs/`](../vendor/filmtone/docs/) | `vendor/filmtone` は参照用 submodule。変更は standalone の Filmtone リポジトリで行い、ここでは submodule を更新する |
| タスク管理、長期計画、クロスセッション handoff | life リポジトリ | このリポジトリには短い導線だけを置く。詳細は [役割分担](./guides/life-repository-connection.md) を参照 |
| 公開サイトの実装仕様 | `apps/web/` のコードと近接する `README.md` / `DESIGN.md` | 実装と同期が必要な情報はコードの近くに置く |

## 迷ったとき

1. その情報を変更する責務を持つリポジトリを特定する。
2. 既存の正本があれば更新し、ここには重複を書かない。
3. 新規文書が必要なときだけ、[運用ルール](./DOCUMENTATION-GOVERNANCE.md) の分類・命名・ライフサイクルに従う。
