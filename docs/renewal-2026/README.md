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

| ファイル | 状態 (Wave 2 完了時、2026-04-26) |
|---|---|
| [stream-status/1.md](./stream-status/1.md) | Stream 1 (Motion Core) — 🟡 D1.6 のみ Wave 3 (緊急度低) |
| [stream-status/2.md](./stream-status/2.md) | Stream 2 (motion-dot) — 🟢 smoke 通過、D2.7 formal のみ Wave 3 |
| [stream-status/3.md](./stream-status/3.md) | Stream 3 (Design System) — ✅ 完全 closed |
| [stream-status/4.md](./stream-status/4.md) | Stream 4 (Portfolio Shell) — 🟢 13/15 closed、D4.14/D4.15 Wave 3 QA |
| [stream-status/5.md](./stream-status/5.md) | Stream 5 (Filmtone + Audio) — 🟢 D5.1-D5.6 closed、D5.7 finalize Wave 3 |

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
| [stream-wave1-completion-handoff.md](./stream-wave1-completion-handoff.md) | **Wave 1 完了** (motion shell + IA + design system + audio infra) |
| [stream-wave2-completion-handoff.md](./stream-wave2-completion-handoff.md) | **Wave 2 完了** (Filmtone migration + audio wire-up + design finalize) ← 最新 |

handoff doc は session 単位の補助記録。Stream 完了判定は `stream-status/{N}.md` で行う。

## 全体進捗

母数 **36** (v3: 36→35 で D3.5 Storybook de-scope、v4: 35→36 で D2.8 motion-dot quality remediation 追加)。Wave 2 完了時点で landed 済み = **34 / 36 = 94.4%** (Wave 3 deferred 7 件: D1.6 / D2.7 formal / D2.8 quality / D3.1 corner / D4.14 / D4.15 / D5.7 残)。

| Wave | 期間 | landed 件数 | 累計 progress |
|---|---|---|---|
| Wave 0 (Phase 1〜Stream4 一部) | 〜2026-04-25 | 17 件 (D1.1-1.5 + D2.1-2.6 + D4.1-4.6) | 17/36 = 47.2% |
| Wave 1 (motion shell + IA + design system + audio infra) | 2026-04-26 | 8 件 (D4.7-4.10 + D4.12 + D3.4/3.6 + D5.3、D3.1 retroactive [~] 反映) | 25/36 = 69.4% |
| Wave 2 (Filmtone migration + audio wire-up + design finalize) | 2026-04-26 | 9 件 (D5.1/5.2/5.4/5.5/5.6 + D4.11/4.13 + D3.2/3.3) | 34/36 = **94.4%** |
| Wave 3 (QA Wave + remediation) | TBD | 7 件 (D1.6/D2.7 formal/D2.8 quality/D3.1 corner/D4.14/D4.15/D5.7 finalize) | exit criteria: 全 36 closed → plan §0.1 全 7 条件達成 → production launch ready |

詳細は plan §3.4 Phase 1〜Stream4 landed surface 実態 + §15 Scope Drift Postmortem + Wave 1/2 handoff doc 参照。

## Anti-Drift 要点

- **Stream 完了判定**: `stream-status/{N}.md` の checklist 全充足のみ（chat handoff doc は権限なし）
- **handoff doc 必須セクション**: Plan Compliance Audit / Cross-Stream Visibility / Scope Diff Table / 残タスク full enumeration（plan §8.5）
- **De-scope 禁止**: §4-§7 の縮減・後送り・削除は user 明示 approve なしには不可（plan §0.3）
- **新 chat 必須手順**: plan §7 + stream-status 全 5 件読み込み + 担当範囲宣言（plan §0.4）

詳細: plan §0 / §7.0 / §8.5 / §15
