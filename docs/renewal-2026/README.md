# Renewal 2026 — Documentation

このディレクトリは portfolio renewal 2026-04 プロジェクトのドキュメント。

## 親計画 (single source of truth)

`/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md`

新 chat 開始時の必須読み込み（plan §0.4）:

1. plan 全体（特に §0 Scope Lock / §7 D{N}.{n} checklist / §8.5 Anti-Drift Discipline / §15 Postmortem）
2. `stream-status/{1-5}.md` 全 5 件
3. 自分の chat の作業範囲を §7 から特定して宣言

## ディレクトリ構成

### `stream-status/` — Single Source of Truth

| ファイル | 状態 |
|---|---|
| [stream-status/1.md](./stream-status/1.md) | Stream 1 (Motion Core) — 🟡 D1.6 残 |
| [stream-status/2.md](./stream-status/2.md) | Stream 2 (motion-dot) — 🟡 D2.7 残 |
| [stream-status/3.md](./stream-status/3.md) | Stream 3 (Design System) — 🔴 NOT STARTED |
| [stream-status/4.md](./stream-status/4.md) | Stream 4 (Portfolio Shell) — 🟡 6/15 deliverables landed |
| [stream-status/5.md](./stream-status/5.md) | Stream 5 (Filmtone + Audio) — 🔴 NOT STARTED |

**Stream 完了判定の正本**は `stream-status/{N}.md` の D{N}.{n} checklist。chat handoff doc は完了判定権限を持たない（plan §7.0 / §8.5）。

### Chat handoff docs（session 引き継ぎ補助）

| ファイル | 内容 |
|---|---|
| [stream-1-motion-core-handoff.md](./stream-1-motion-core-handoff.md) | Stream 1 起点 |
| [stream-1-completion-handoff.md](./stream-1-completion-handoff.md) | Stream 1 完了 (Phase A + Phase B) |
| [stream-2-motion-dot-handoff.md](./stream-2-motion-dot-handoff.md) | Stream 2 起点 |
| [stream-2-completion-handoff.md](./stream-2-completion-handoff.md) | Stream 2 完了 |
| [stream-4-completion-handoff.md](./stream-4-completion-handoff.md) | Stream 4 部分完了 (4-A/4-C/4-B-dot) |
| [stream-4b-grid-flow-completion-handoff.md](./stream-4b-grid-flow-completion-handoff.md) | Stream 4-B grid+flow Phase A |

handoff doc は session 単位の補助記録。Stream 完了判定は `stream-status/{N}.md` で行う。

## 全体進捗

§7 全 36 D{N}.{n} のうち landed 済み = 14 / 36 ≈ **39%**

詳細は plan §3.4 Phase 1〜Stream4 landed surface 実態 + §15 Scope Drift Postmortem 参照。

## Anti-Drift 要点

- **Stream 完了判定**: `stream-status/{N}.md` の checklist 全充足のみ（chat handoff doc は権限なし）
- **handoff doc 必須セクション**: Plan Compliance Audit / Cross-Stream Visibility / Scope Diff Table / 残タスク full enumeration（plan §8.5）
- **De-scope 禁止**: §4-§7 の縮減・後送り・削除は user 明示 approve なしには不可（plan §0.3）
- **新 chat 必須手順**: plan §7 + stream-status 全 5 件読み込み + 担当範囲宣言（plan §0.4）

詳細: plan §0 / §7.0 / §8.5 / §15
