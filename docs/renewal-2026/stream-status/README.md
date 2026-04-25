# Stream Status — Single Source of Truth

このディレクトリは Renewal 2026 の **5 Streams の状態を一元管理する SSoT**。

## 目的

chat handoff doc と Stream 完了判定を分離する。

- **handoff doc** (`docs/renewal-2026/stream-{N}-...-handoff.md`): chat 間の引き継ぎ補助、session 単位
- **stream-status/{N}.md** (本ディレクトリ): 当該 Stream の plan §7 D{N}.{n} checklist の現状、commit ref、verification 状態

handoff doc が「完了」と書いても、stream-status/{N}.md の checklist が未充足なら Stream は未完了。

## 正本

親計画: `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md`

- §7.0 Stream 完了判定基準
- §8.5 Anti-Drift Discipline
- §15 Scope Drift Postmortem (2026-04-25)

## 更新ルール

- 各 chat は handoff doc 作成と同時に対応 stream-status/{N}.md を更新
- D{N}.{n} の `[x]` / `[~]` partial / `[ ]` を最新化、landed item は commit ref を `landed:` 行に記録
- 部分実装で `[x]` にすることは禁止（要件全充足のみ `[x]`）
- partial 実装 `[~]` 使用時は notes に「Wave N で landed: 〜 / Wave M で finalize: 〜」を full enumeration
- 失敗 / 保留事項は `notes` セクションに記録

## Wave / D{N}.{n} 母数 (v4, 2026-04-26 user-approved)

- 全体 D{N}.{n}: **36** (v4 で D2.8 Phase A+2 wiring を追加、Stream 2 7→8、35→36)
- Wave 1 (4 agent 並列、core motion shell + IA + design + cleanup) + Wave 1 後段 Phase A+2 polish: D4.7/4.8/4.9/4.10/4.12 + D3.1/3.4/3.6 + D5.3 + **D2.8** を [x]、D4.11/D5.7/D3.3/D3.2 を [~] partial
- Wave 2 (next chat、core 進行): D5.1/5.2/5.4/5.5/5.6 + D4.11 残 + D3.3 残 + D3.2 残 + D4.13 + D2.7 smoke
- Wave 3 (QA Wave、core 全 visual approve 後): D4.14 e2e + D4.15 preview deploy + D1.6 typing fix + D5.7 doc+Search Console + D2.7 formal + (HUD overlay は外殻として此処に absorb 可)

## 進捗算出

`(landed [x]) / 36` を母数とする。partial `[~]` は **0.5 換算しない** — 充足したら `[x]` へ移行、未充足なら `[~]` 維持。Wave 1 完了時の進捗は `[x]` 数のみで算出。

## Plan revision history

- v1: initial (Wave 1 expected = D4.11/D5.7/D3.3 [x] 全充足、Storybook 4 stories、母数 36)
- v2: Director Critical 1-6 + Minor 7-9 (D4.11/D5.7/D3.3 [~] partial 化、bun install merge step etc.)
- v3: Director Edit 1-6 user 明示 approve (D3.5 Storybook 完全 de-scope、Wave 3 QA Wave 新設、D5.7 縮小、母数 36→35)
- v4: anti-drift §7 realignment user 明示 approve (D2.8 Phase A+2 wiring 追加、母数 35→36)
