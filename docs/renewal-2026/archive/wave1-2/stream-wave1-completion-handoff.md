# Wave 1 Completion Handoff — chibatakumi-portfolio Renewal 2026

| 項目 | 値 |
|---|---|
| 作成日 | 2026-04-26 JST |
| Wave | 1 — 4 Agent 並列 (motion shell + IA + design system + audio infra) |
| Branch | `feat/renewal-2026-phase2-motion-dot` (uncommitted、commit/push は user approve 後) |
| 起点 commit | `4f9fbb0a` (Wave 1 開始時) |
| 親計画 SSoT | `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md` |
| 本 Wave 1 計画 | `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/sequential-thinking-gemini-web-search-f-agile-cocke.md` (v3) |
| Stream Status SSoT | `docs/renewal-2026/stream-status/{1,2,3,4,5}.md` (全 5 件 + README 更新済) |
| Director audit | v3 適用済 (Critical 1-6 + Minor 7-9、user 明示 approve 経由) |
| 母数 | **36** (v4 で D2.8 Phase A+2 wiring を追加、Stream 2 7→8、35→36) |
| Plan revisions | v4 (anti-drift §7 realignment, D2.8 追加) / v3 (D3.5 de-scope, Wave 3 QA Wave) / v2 (partial 化 + Anti-Drift Discipline) / v1 (initial) |

---

## 1. Plan Compliance Audit (plan §7 D{N}.{n} 全 35 項目 verbatim copy + 状態)

### Stream 1 — Motion Core Library (5/6 closed = D1.1-D1.5 landed、D1.6 Wave 3)

- [x] **D1.1** `packages/motion-core` 新設 (commit `7e16c224`)
- [x] **D1.2** webgpu-motion-{shell,audio,post,art,dom,input,scene,ui} 8 packages submodule 取り込み (commit `7e16c224`、submodule HEAD `b96998b`)
- [x] **D1.3** gpu-{fx-presets, 2.5d-presets, film-post} 3 packages submodule 取り込み
- [x] **D1.4** `MotionParticipant<T>` API + 型定義
- [x] **D1.5** `packages/motion-grid` `packages/motion-flow` skeleton を participant 化
- [ ] **D1.6** webgpu-motion-libs 側 typing fix → **Wave 3 forward** (Wave 1 audit で実質 closed 確認、formal は D4.15 通過後)

### Stream 2 — motion-dot Package 化 (6/8 closed = D2.1-D2.6 landed、D2.7 二段検証、**D2.8 [~] partial — quality remediation 別 chat 引き継ぎ**)

- [x] **D2.1** motion-dot-new-webgpu source vendor (9 subdir)
- [x] **D2.2** package.json deps 6 件配線
- [x] **D2.3** `createDotScene` REAL factory (17 scene)
- [x] **D2.4** `DotScene` 統一 adapter contract
- [x] **D2.5** `createDotParticipant` scaffold
- [x] **D2.6** kinetic-handoff + composite-25d + fluid-scene re-export
- [ ] **D2.7** demo route 検証 → **Wave 2 smoke (1 line) + Wave 3 formal**
- [~] **D2.8** Phase A+2 wiring + Quality regression fix → **partial** (Wave 1 後段、user 明示 approve 経由で plan v4 §7 realign): (1) composite-25d gallery mode + keyboard cluster wire (motion-dot/index.ts +378 lines)、(2) **3 critical regression 修正** landed = (a) MotionStageProvider に `demoStyle: "beat"` 明示、(b) `DOT_SCENE_DISPLAY_NAMES` Title Case map 追加で TRANSITION_ANCHOR_POLICIES lookup 復元、(c) `INTENSITY_TUNING` 全 11 fields + `createPresentationModulation` (galleryMix damping) + `GALLERY_SCENE_DAMPING` per-scene + `applyGallerySceneDamping` per-panel 移植。typecheck 0 errors / baseline 4 維持 / build 全 route prerender 成功。**ただし 2026-04-26 user feedback「まだクオリティが追いついてない」経由で別 chat へ remediation 引き継ぎ**、専用 handoff: `docs/renewal-2026/motion-dot-quality-remediation-handoff.md` (§2.1/2.2 に追加 audit 候補を full enumeration、§5 に verbatim 起動 prompt)。HUD overlay は外殻として Wave 3 forward 維持

### Stream 3 — Visual Language Design System (3/5 closed = D3.1/D3.4/D3.6 landed、D3.2/D3.3 partial、D3.5 削除)

- [x] **D3.1** Tailwind 4 plugin で dot-new palette tokens を expose (Wave 1 Agent C)
- [~] **D3.2** Typography scale 移管 → **partial** (design-system token landed、globals.css 側 migration 残 → 次 chat finalize)
- [~] **D3.3** Light mode default 化 → **partial** (Light mode infra landed、Filmtone Open Q2 解決は Wave 2 F)
- [x] **D3.4** Component primitives 4 種 (Logo / Wordmark / SoundToggle / NavRail) 実装 (Wave 1 Agent C)
- ~~D3.5 Storybook~~ — **v3 で完全 de-scope** (user 明示 approve、Director Edit 1)
- [x] **D3.6** `apps/web/src/components/Logo.tsx` を design-system Logo に置換 (Wave 1 Agent C)

### Stream 4 — Portfolio Shell Renewal (11/15 closed = D4.1-D4.10/D4.12 landed、D4.11 partial、D4.13/14/15 forward)

- [x] **D4.1** MotionStage core 実装
- [x] **D4.2** `next.config.ts transpilePackages` 拡張
- [x] **D4.3** workspace deps 配線
- [x] **D4.4** `apps/web/src/features/motion/` boundary
- [x] **D4.5** `/[locale]/experiments/{dot,grid,flow}` 3 route + experiments/layout.tsx (Wave 1 で MotionStageProvider 撤去)
- [x] **D4.6** motion-{dot,grid,flow} Phase A wiring
- [x] **D4.7** persistent `<MotionCanvas>` を root layout に移動 (Wave 1 Agent A)
- [x] **D4.8** Home Hero 全面書き換え (Wave 1 Agent A + post-merge carry-over fix: 前 chat commit `e1e52b7a` の KineticHandoff scene cycle を AmbientHomeHero に carry、`enableSceneCycle: true` + curated 4 scene cycle ["orbit", "river", "firefly", "molecular"] で plan §4.4 整合)
- [x] **D4.9** 新 IA routes 実装 (13 file = 7 routes + 6 motion-studies、Wave 1 Agent B)
- [x] **D4.10** 旧 routes 解体 7 dir 削除 (Wave 1 Agent B、film-lab 除く)
- [~] **D4.11** Redirect map → **partial** (**8 non-Filmtone paths × 2 forms = 16 entries** landed、Filmtone 8 paths × 2 = 16 entries は Wave 2 F → 最終 32 entries)
- [x] **D4.12** Page transition orchestrator (260行→65行、Wave 1 Agent A)
- [ ] **D4.13** next-intl 全 new route ja/en 動作検証 → **Wave 2 forward**
- [ ] **D4.14** e2e tests 4 種 → **Wave 3 forward** (Director Edit 2)
- [ ] **D4.15** Vercel preview deploy 検証 → **Wave 3 forward** (Director Edit 2)

### Stream 5 — Filmtone Subsumption + Audio Integration (1/7 closed = D5.3 landed、D5.7 partial、5/7 Wave 2 forward)

- [ ] **D5.1** `/works/filmtone/*` 8 sub-route migration → **Wave 2 forward**
- [ ] **D5.2** API ルート整理 → **Wave 2 forward**
- [x] **D5.3** GlobalAudioController + AudioBusProvider 実装 (Wave 1 Agent E)
- [ ] **D5.4** Sound icon mount (D5.3 controller × D3.4 SoundToggle wire-up) → **Wave 2 forward**
- [ ] **D5.5** `/experiments/*` mic input opt-in → **Wave 2 forward**
- [ ] **D5.6** Filmtone case study ページの dynamic data 非依存化 → **Wave 2 forward**
- [~] **D5.7** Filmtone redirect SEO 維持 → **partial** (新 IA canonical inline landed Wave 1、Filmtone canonical inline Wave 2、doc + Search Console 退役申請 Wave 3)

### Wave 1 進捗集計 (v4 + post-execution audit による D2.8 格下げ反映)

- Wave 1 で `[x]` 化した D{N}.{n}: D4.7, D4.8, D4.9, D4.10, D4.12, D3.1, D3.4, D3.6, D5.3 = **9 件**
- Wave 1 で `[~]` partial 化した D{N}.{n}: D4.11, D5.7, D3.2, D3.3, **D2.8** = **5 件** (D2.8 は post-execution に user feedback 経由で格下げ)
- Wave 1 終了時点 `[x]` 累計: 17 (Wave 0) + 9 (Wave 1) = **26 / 36 = 72.2%**
- 母数推移: v1=36 → v3=35 (D3.5 削除) → v4=36 (D2.8 追加)、partial は 0.5 換算しないため `[~]` 5 件は分子に未計上
- 注: D2.8 は wiring + 3 regression fix landed だが quality parity 未達のため `[x]` 不可。next chat (`motion-dot-quality-remediation-handoff.md`) で finalize 予定

---

## 2. Cross-Stream Visibility (全 5 Stream 状態)

| Stream | Wave 1 touched | landed [x] | partial [~] | open [ ] (Wave 2) | open [ ] (Wave 3) |
|---|---|---|---|---|---|
| 1 Motion Core | yes (audit) | 5 (D1.1-D1.5) | 0 | 0 | 1 (D1.6) |
| 2 motion-dot | yes (Phase A+2 polish + 3 regression fix、quality parity 未達) | 6 (D2.1-D2.6) | 1 (**D2.8**) | 1 (D2.8 quality remediation) + 0.5 (D2.7 smoke) | 0.5 (D2.7 formal) |
| 3 Design System | yes (Agent C) | 3 (D3.1, D3.4, D3.6) | 2 (D3.2, D3.3) | 2 (D3.2 残, D3.3 残) | 0 |
| 4 Portfolio Shell | yes (Agent A+B) | 11 (D4.1-D4.10, D4.12) | 1 (D4.11) | 2 (D4.11 残, D4.13) | 2 (D4.14, D4.15) |
| 5 Filmtone+Audio | yes (Agent B+E) | 1 (D5.3) | 1 (D5.7) | 5 (D5.1, D5.2, D5.4, D5.5, D5.6) | 1 (D5.7 doc) |
| **Total** | — | **26** | **5** | **10.5** | **4.5** |

注: D3.5 (Storybook) は v3 で削除済、本 table から除外。D2.8 は v4 で追加、post-execution に user feedback で `[x]` → `[~]` partial 格下げ。HUD overlay は外殻として Wave 3 (Stream 2) に absorb 可。motion-dot quality remediation は別 chat 専用 handoff `docs/renewal-2026/motion-dot-quality-remediation-handoff.md` で継続。

---

## 3. Scope Diff Table (Wave 1 expected vs actual + Director audit trail)

| 要求 (plan §7) | Wave 1 expected (v1) | Wave 1 actual (v3 後) | 差分 / 移管先 |
|---|---|---|---|
| D4.11 18 path 全配線 | `[x]` 全 18 paths | `[~]` partial **8 paths × 2 = 16 entries** landed | 8 Filmtone paths × 2 = 16 entries → **Wave 2 F**、works/contact 同 URL は redirect 不要、最終 32 entries (Director Critical 1 + post-Wave 1 audit correction) |
| D5.7 Filmtone redirect SEO 維持 | `[x]` 全充足 | `[~]` partial **新 IA base 6 routes canonical inline のみ** | Filmtone 8 canonical → Wave 2 F、motion-studies 6 canonical + doc + Search Console → **Wave 3** (Director Critical 2 + Edit 3 + post-Wave 1 audit correction) |
| D3.3 Light mode default + dark alt + Open Q2 解決 | `[x]` 全充足 | `[~]` partial Light mode infra のみ | Filmtone Open Q2 (data-theme=dark wrapper) → **Wave 2 F** (Director Critical 3) |
| D3.5 Storybook | `[x]` 4 stories + .storybook config | **削除済** | v3 で完全 de-scope (Director Edit 1、user 明示 approve、母数 36→35) |
| D4.13 next-intl 検証 | (Wave 2 想定) | (Wave 2 想定) | 不変 |
| D4.14 e2e tests | (Wave 2 想定) | **Wave 3** | Director Edit 2 で QA Wave に再分類 |
| D4.15 preview deploy | (Wave 2 想定) | **Wave 3** | Director Edit 2 で QA Wave に再分類 |
| D1.6 typing fix | (Wave 1 確認) | **Wave 3** | Director Edit 2 で QA Wave に再分類 (緊急度低、Wave 1 audit で実質確認済) |
| D2.7 demo verify | (Wave 1 直後) | **Wave 2 smoke + Wave 3 formal** | Director Edit 2 で二段検証化 |
| D3.2 typography 移管 | `[x]` globals.css 移管 | `[~]` partial token のみ | globals.css 側 migration → **次 chat finalize** (Director audit post-execution finding) |

### Director Audit Trail

- **Trigger**: Wave 1 計画 v1 が D4.11/D5.7/D3.3 を [x] とする §7.0 違反 3 件、Storybook 緩和の §0.3 違反予兆を Director が検出
- **Resolution path**: 計画 v2 (Critical 1-6 + Minor 7-9 反映) → user explicit approve 経由で v3 (Edit 1-6 = Storybook de-scope + Wave 3 QA Wave 新設 + D5.7 縮小 + 二段 forward + 母数修正) → 本 handoff doc 作成
- **Anti-Drift Discipline §8.5 充足**: 必須 4 セクション (本 §1/§2/§3/§4) + stream-status SSoT 全 5 件更新 + Wave 2/Wave 3 二段 forward enumeration

---

## 4. 残タスク full enumeration (plan §7 全 35 D{N}.{n} のうち未 closed 全部)

### 4.1 Wave 2 forward (= 次 chat 担当、core 進行)

next chat 着手指示の **verbatim 起動 prompt**:

```
chibatakumi-portfolio renewal 2026 Wave 2 を継続してください。

== SSoT (必読、§0.4 必須 3 手順 skip 禁止) ==
1. /Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md (親計画 §0/§7/§8.5/§15)
2. /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/docs/renewal-2026/stream-status/{1,2,3,4,5}.md + README.md
3. /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/docs/renewal-2026/stream-wave1-completion-handoff.md (本 handoff doc)

== Wave 1 完了状態 ==
- branch: feat/renewal-2026-phase2-motion-dot, 起点 commit 4f9fbb0a
- Wave 1 で 9 件 [x] + 4 件 [~] partial 化
- 母数 35 (D3.5 Storybook を v3 で完全 de-scope、user 明示 approve)
- 進捗: 26 / 35 = 74.3%
- typecheck baseline 4 errors 維持、build verify 成功、deep pass clean
- commit/push: user 同意後にまとめて実行 (本 handoff doc 完成時点で uncommitted)

== Wave 2 担当 D{N}.{n} (full enumeration) ==
core 進行 (Filmtone migration + Audio wire-up + 残 partial finalize):
- D5.1 Filmtone /works/filmtone/* 8 sub-route migration (旧 /film-lab/* から)
- D5.2 API ルート整理 (/api/film-lab/waitlist → /api/waitlist 汎用化等)
- D5.4 Sound icon mount (D5.3 controller × D3.4 SoundToggle を root layout に wire-up)
- D5.5 /experiments/* mic input opt-in
- D5.6 Filmtone case study dynamic data 非依存化
- D4.11 残: Filmtone 8 path redirect (film-lab + privacy/signature/roadmap/release-notes/support/download/og)、locale 2 形式で 16 entries 追加
- D3.3 残: Filmtone dark glass wrapper (data-theme="dark") 付与 or token migration (Open Q2 解決)
- D3.2 残: globals.css 側の clamp logic を design-system tokens 参照に置換
- D4.13 next-intl 全 new route ja/en 動作検証
- D2.7 smoke check (1 line): /experiments/dot で 1 scene 起動を browser 目視

== Anti-Drift Discipline ==
- chat 独断 de-scope 禁止 (plan §0.3、user 明示 approve 経由のみ)
- handoff doc 必須 4 セクション (Plan Compliance Audit / Cross-Stream Visibility / Scope Diff / 残タスク full enumeration) を session 終了時に提出
- Wave 2 完了時 stream-status/{1-5}.md を全件更新
- Wave 3 forward (D4.14 / D4.15 / D1.6 / D5.7 doc / D2.7 formal) は QA Wave、本 Wave 2 では着手しない

「Agent Teamsで」併用可。並列 4-5 stream 推奨 (D5.1+D5.6 / D5.4+D5.5 / D4.11残+D3.3残+D3.2残 / D4.13+D2.7 smoke 等)。

着手前に必ず §0.4 (A) §7 read / (B) stream-status read / (C) D{N}.{n} 宣言 を skip せず実行してください。
```

### 4.2 Wave 3 forward (= QA Wave、core 全 visual approve 後、別 chat)

QA Wave 着手指示の **verbatim 起動 prompt**:

```
chibatakumi-portfolio renewal 2026 Wave 3 (QA Wave) を継続してください。
本 Wave は core 全 visual approve 後の最終 QA gate。plan §8 Phase 5 (Performance / a11y / device matrix 検証) を具体化したもの。

== SSoT ==
1. life/.claude/plans/portfolio-renewal-2026-04.md
2. chibatakumi-portfolio/docs/renewal-2026/stream-status/{1-5}.md
3. chibatakumi-portfolio/docs/renewal-2026/stream-wave2-completion-handoff.md (Wave 2 完了 handoff)

== Wave 3 担当 D{N}.{n} (full enumeration) ==
- D4.14 e2e tests 4 種 (旧 path → 新 path redirect / i18n ja/en / WebGPU unsupported screen / persistent canvas re-mount)
- D4.15 Vercel preview deploy 検証 (final visual gate、submodule 解決 + WebGPU 動作)
- D1.6 webgpu-motion-libs typing fix (Wave 1 audit で実質確認済、D4.15 で表面化したら前倒し)
- D5.7 finalize: (a) journal/motion-studies/{6 slugs} に canonical metadata inline 追加 (外殻 / SEO QA、6 file × 数行で軽微) (b) SEO migration procedure doc (docs/renewal-2026/seo-migration-procedure.md) 作成 (c) Search Console 退役申請手順実行 (production launch 後 ops、launch 前 doc landed のみ)
- D2.7 formal portfolio shell 経由 demo route 検証 (Wave 2 smoke 通過済前提、kinetic-handoff scene cycle / composite-25d gallery / 17 scene 全切替 / film post 配線 検証)

== exit criteria ==
- 全 35 D{N}.{n} closed → plan §0.1 の 7 条件全充足 → 「全面リニューアル完了」declare 可能
- production launch ready
```

---

## 5. user への action item (本 chat 終了時)

1. **Wave 1 working tree review**: `git status` で本 Wave 1 の touch 範囲確認 (M 12 / D 7 / ?? 17 file = 36 file)
2. **Filmtone visual regression local dev 確認** (Director Minor 8): `bun run --cwd apps/web dev` → browser で `/film-lab` `/film-lab/signature` 等を確認、Wave 2 F (Filmtone migration with `data-theme="dark"` wrapper) の優先度を explicit approve
3. **Commit / push 同意** (`feedback_minimize_decision_cost.md` 適用): logical 1 commit に集約予定
   - Suggested commit message:
     ```
     feat(renewal-2026): Wave 1 — motion shell + IA + design system + audio infra (4 agent parallel + Director v3)

     Stream 4 D4.7-D4.12 (motion shell + IA + transitions, less D4.11 partial)
     Stream 3 D3.1/D3.4/D3.6 [x] + D3.2/D3.3 [~] partial (Storybook v3 de-scoped per user approve)
     Stream 5 D5.3 [x] + D5.7 [~] partial (Filmtone migration deferred to Wave 2 F)
     Stream 1 D1.6 audit verified clean at submodule HEAD b96998b (formal close in Wave 3)

     Director audit v3 applied: D4.11/D5.7/D3.3 marked [~] partial per §7.0,
     D3.5 Storybook fully de-scoped (deliverables 6→5, denominator 36→35),
     Wave 3 QA Wave introduced for D4.14/D4.15/D1.6/D5.7 doc/D2.7 formal.
     ```
4. **Wave 2 起動**: 本 handoff §4.1 の verbatim prompt をそのまま新 chat に投入。「Agent Teamsで」併用可。

---

## 6. 補足 — Director audit trail (v3)

- **2026-04-26 v1 → v2**: Director Critical 1-6 + Minor 7-9 (D4.11/D5.7/D3.3 を [~] partial、Storybook 独断緩和禁止条項追加、Wave 2 §9 4 項目補完、apps/web/package.json を Agent C 書込境界、bun install merge step、Filmtone visual regression review step)
- **2026-04-26 v2 → v3 (user 明示 approve「本質優先 / 外殻最小 / QA は core 全 visual approve 後にのみ」)**: D3.5 Storybook 完全 de-scope、Wave 3 QA Wave 新設、D5.7 縮小 (canonical inline only)、Wave 2/Wave 3 二段 forward、母数 36→35
- **§0.3 violation なし**: chat 独断 de-scope ではなく user 明示 approve 経由
- **§8.5 Anti-Drift Discipline**: D3.5 削除と Wave 3 deferred を本 handoff §3 + §4 で full enumeration して trace 維持
- **適用 memory**: feedback_no_fallback_bug_hotbed / feedback_review_release_blockers_deep_pass / feedback_minimize_decision_cost / feedback_verify_before_quoting_handoff / feedback_design_quality_priority / feedback_film_mode_default_on
- **2026-04-26 v3+ post-Wave 1 disk-verify audit (Director)**: handoff/stream-status の数値ズレ 2 件発見、修正適用済 — (a) D4.11 redirect entries 「18/9 paths」→ 「16/8 paths」(stream-status/4.md + handoff §1/§3)、(b) D5.7 「motion-studies 6 件 canonical Wave 1 landed」主張は実態乖離 (6 motion-studies page.tsx に canonical 不在)、外殻として Wave 3 deferred に修正 (user 明示「本質優先 / 外殻最小 / QA は core 全 visual approve 後のみ」経由)。**Wave 1 commit 進行可、user 判断コスト: commit/push 同意 + Wave 2 prompt 投入の 2 step のみ。**
