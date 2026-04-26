> ⚠️ **SUPERSEDED 2026-04-26** — この patchwork remediation 計画は撤回されました。
> user directive「保守的意見は優先せず品質最優先 / motion-dot は本プロジェクトのままポートフォリオに移植したい」
> を受けて、原 motion-dot-new-webgpu/src/ を verbatim 移植する wholesale transplant に切替。
> 後継 plan: `life/.claude/plans/idempotent-knitting-dragon.md`
> 後継 handoff: `docs/renewal-2026/motion-dot-transplant-handoff-2026-04-26.md`
> 移植 commits: `d5702367` (transplant) + `42a15541` (boot defaults restore)

# motion-dot Quality Remediation Handoff

| 項目 | 値 |
|---|---|
| 作成日 | 2026-04-26 JST |
| 起点 user feedback | 「motion-dotですが美しいシーンとシーンの繋がりが再現できていないのとシーン自体のクオリティも元のプロジェクトに比べて落ちている気がします」+ 1 round 修正後「まだクオリティが追いついてないので別チャットに引き継ぎましょう」 |
| 引き継ぎ branch | `feat/renewal-2026-phase2-motion-dot` (uncommitted、Wave 1 + D2.8 partial 全変更 working tree 滞留) |
| Wave 1 親 handoff | `docs/renewal-2026/stream-wave1-completion-handoff.md` |
| 親計画 (SSoT) | `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md` |
| stream-status SSoT | `docs/renewal-2026/stream-status/2.md` D2.8 [~] partial |
| 比較対象 (canonical) | `/Volumes/SamsungPortableSSDX5001/documents/life/output/motion-dot-new-webgpu/` (元プロジェクト、quality reference) |

---

## 0. 次 chat 着手前の必須手順

1. 親計画 §0.4: §7 read / stream-status read / D{N}.{n} 宣言 (本 chat の D{N}.{n} = D2.8 quality remediation)
2. 本 handoff doc を end-to-end 通読
3. **元プロジェクト** `life/output/motion-dot-new-webgpu/` を **dev 起動して visual baseline を体感** (`cd life/output/motion-dot-new-webgpu && bun install && bun run dev` 想定、README 確認推奨)
4. 現 portfolio を dev 起動して **side-by-side 比較**: `bun run --cwd apps/web dev` → `/`(home cycle) と `/experiments/dot`(gallery)
5. 差分を 視覚的 / parameter / API surface の 3 軸で記録

---

## 1. 本 chat で landed した motion-dot 関連変更 (uncommitted)

### 1.1 Phase A+2 wiring (Agent 経由)

`packages/motion-dot/src/index.ts` (+378/-35 lines initial):
- `enableGalleryMode` + `panelCount` + `galleryScenes` options 追加、composite-25d (`createGalleryMode`) を init/update/render/dispose で wire
- keyboard cluster: `enableInput` 実装、document keydown listener (ArrowRight/Space/n/N→next、ArrowLeft/p/P→prev、r/R→reset)、isInputElement gate
- gallery + scene cycle は mutually exclusive (throws)
- panelCount は composite-25d の固定 LAYOUTS [2,4,8,12] にスナップ (例: panelCount=4)

`apps/web/src/app/[locale]/experiments/dot/client.tsx`:
- `enableGalleryMode: true, panelCount: 4, enableInput: true` で起動 (showcase peak)
- HUD は外殻として撤去

`apps/web/src/features/hero/components/AmbientHomeHero.tsx`:
- post-merge fix で `enableSceneCycle: true` + curated `["orbit", "river", "firefly", "molecular"]`

### 1.2 Quality regression fix (本 chat 直接実装、user feedback 受領後)

3 critical regressions が同定され修正 landed (この時点では quality 改善期待、しかし user は「まだ追いついていない」と判断):

#### Regression #1: AudioBus demoStyle "ambient" → "beat" 喪失

- 原因: 元プロジェクト `life/output/motion-dot-new-webgpu/src/main.ts:302` は明示的に `new AudioBus({ demoStyle: "beat" })` を使用 ("dot 120 BPM silent-time aesthetic を保つ" コメント明記)
- 現 MotionStage は `options.demoStyle ?? "ambient"` (motion-core/src/stage/index.ts L115)、MotionStageProvider は demoStyle 未指定 → default "ambient" → audio envelope 全体が違う
- fix: `apps/web/src/features/motion/MotionStageProvider.tsx` で `createMotionStage({ ..., demoStyle: "beat" })` を明示

#### Regression #2: TRANSITION_ANCHOR_POLICIES Title Case mismatch

- 原因: `packages/motion-dot/src/transition/kinetic-handoff.ts` の `TRANSITION_ANCHOR_POLICIES` keys は **Title Case** ("River Flow" / "Pendulum Wave" / "River Delta" / "Chain")
- 現 motion-dot は cycleSceneNames に lowercase DOT_SCENE_NAMES (orbit / river / pendulum / chain / delta 等) をそのまま渡しており、policy lookup 全 fall-through → **per-scene anchor / orbit / wobble / drift / startBlend / burstRadius / burstSpeed / burstScaleX/Y tuning が完全消失**
- fix: `DOT_SCENE_DISPLAY_NAMES` map (17 entries) を追加、cycleSceneNames を display name 経由に切替

```
orbit→Orbit / river→River Flow / magnet→Magnet / mitosis→Mitosis /
pendulum→Pendulum Wave / ripple→Ripple / delta→River Delta / flock→Flock /
helix→DNA Helix / phase-transition→Phase Transition / firefly→Firefly Sync /
molecular→Molecular / chain→Chain / converge→Converge /
text-attractor→Living Typography / grid-fluid→Grid Fluid / fluid→Fluid (GPU)
```

#### Regression #3: INTENSITY_TUNING gallery damping coefficients 全欠落

- 原因: 元 main.ts:87-99 の `INTENSITY_TUNING` 11 fields のうち、現 motion-dot は gate / range / contrast の 3 fields のみ port、gallery* 8 damping coefficients (galleryParticleLift / galleryThresholdDamping / gallerySoftnessDamping / galleryRimDamping / galleryBloomDamping / galleryGrainDamping / galleryChromaDamping / galleryVignetteDamping) が欠落
- fix: 全 11 fields object に統合、`createPresentationModulation(panelCount, shapedIntensity)` 関数で galleryMix-based damping、`GALLERY_SCENE_DAMPING` per-scene-index map (idx 1, 6 の particleIntensity / threshold / softness / rim 個別 override) + `applyGallerySceneDamping` を移植、render() 全面書換

---

## 2. user feedback 「まだクオリティが追いついてない」の含意 — 残る gap 候補

本 chat の修正後も quality 不足。次 chat で audit すべき領域:

### 2.1 私が ports していない原 main.ts 構造の可能性

| 項目 | original main.ts 該当 | 現 motion-dot 状態 | 検証要 |
|---|---|---|---|
| `presentationModulation.particleIntensity` 計算結果が source.setAudioReactive に伝搬 | line 159 で `particleIntensity` を計算して modulation に格納、後で source 側で消費する設計 | 現 motion-dot で `particleIntensity` を計算するが **どこにも consume されていない** (定数値のみ AudioReactiveBands.intensity に渡す pattern) | particle source の setAudioReactive がどう particleIntensity を使うか、main.ts の該当箇所と現実装を diff |
| Fluid scene の specific config (`count: 200, noiseScale: 2.0, noiseSpeed: 0.025, flowForce: 0.12, drag: 0.992, whiteRatio: 0.15`) | line 248-255 | 現 createDotParticipant では `opts.fluidParticleCount` のみ受け取り、他の noise/flow/drag/whiteRatio が default | fluid scene 使用時に元 default と一致するか |
| Scene-specific particle source の build options | 各 `create*Particles(device, options?)` で options を渡している箇所がないか | 現 buildVendorSource は options なしで呼び出し | gpu-fx-presets の各 create* の signature 確認、必要 options を CreateDotParticipantOptions に expose |
| KineticHandoff `onStateChange` callback | line 369: `onStateChange: syncOverlay` | 現 motion-dot は callback 未指定 | onStateChange が transition 視覚に影響する側面はあるか |
| 元 main.ts の `transitionScenes` には fluid も含まれる (entries に libScenes + fluidScenes 連結、line 281-287) | fluid を transition snapshot 対象に | 現 motion-dot は CYCLEABLE_DOT_SCENES から fluid 除外 (cycleable を Exclude<DotSceneName, "fluid"> に制限) | fluid を含めるべきか、含めない設計が visual quality に影響するか |
| 元 main.ts の `applyGallerySceneDamping` は scene index 1 と 6 に override | "Grid Fluid" idx 1 (libScenes order) / "Ripple" idx 6 で過剰 brightness を damp | 現 GALLERY_SCENE_DAMPING も idx 1/6 を damp、ただし **CYCLEABLE_DOT_SCENES の order が元 libScenes order と異なる** ため idx mismatch | 両 array の順序比較、必要なら scene 名 match 化 |
| 元 main.ts 全体の audio routing / postEnabled flag / film passthrough | line 305-306: `filmPost` と `filmPassthrough` の 2 段切替で audio 無効時は passthrough 使用 | 現 motion-dot は filmPost のみ、無効時の特別処理なし | audio 無効時の visual default が変わっているか |
| 元 main.ts 内の `legacyMetaball` (Fluid scene 専用 pass) | line 316-317 で動的 import | 現 motion-dot は fluid render path 未配線 (throws) | fluid scene を使うなら legacy metaball pass 移植が必要 |
| `attractor burst` の per-scene config (TRANSITION_ANCHOR_POLICIES) は Regression #2 で fix されたが、**ANCHOR 未定義の scene** (orbit / magnet / mitosis / ripple / flock / helix / phase-transition / firefly / molecular / converge / text-attractor / grid-fluid) は default policy のまま | original では default が canonical な値 | TRANSITION_ANCHOR_POLICIES の DEFAULT 値が現実装で合っているか確認 |

### 2.2 現 motion-dot package の独自実装が原 main.ts と異なる箇所

- `cachedShapedIntensity` の使われ方: 元では loop 内で都度計算、現 motion-dot は update() で計算して render() で参照 (cache pattern)、参照 race の risk
- `enableSceneCycle` の auto-cycle: 元では idx を main.ts が保持、現 motion-dot は cycleIdx を internal state、setCurrentIndex callback で同期
- offscreen pool: 元では ParticipantFrameContext.outputView の external 制御、現 motion-dot は `ensureOffscreenView` で internal allocation (gallery composite も同様 `ensureGalleryCompositeView`)、参照 view chain が違う可能性

### 2.3 file diff 推奨

side-by-side で以下 file を end-to-end diff することを推奨:

| 元プロジェクト | 現 portfolio | 重点 |
|---|---|---|
| `life/output/motion-dot-new-webgpu/src/main.ts` (920 lines 想定) | `packages/motion-dot/src/index.ts` + `apps/web/src/app/[locale]/experiments/dot/client.tsx` | createDotParticipant の init / update / render の振る舞いが main.ts のメインループと一致するか |
| `life/output/motion-dot-new-webgpu/src/transition/kinetic-handoff.ts` | `packages/motion-dot/src/transition/kinetic-handoff.ts` | 完全 copy のはずだが、defaults / 関数 signature が drift していないか確認 |
| `life/output/motion-dot-new-webgpu/src/scene/composite-25d.ts` | `packages/motion-dot/src/scene/composite-25d.ts` | 同上 |
| `life/output/motion-dot-new-webgpu/src/scene/fluid-scene.ts` | `packages/motion-dot/src/scene/fluid-scene.ts` | 同上 |
| `life/output/motion-dot-new-webgpu/src/render/metaball-pass.ts` | (現 portfolio に該当 file 不在?) | fluid scene 用 legacy metaball pass、現状未配線 |

### 2.4 dev side-by-side 比較項目

| 比較軸 | 元 motion-dot-new-webgpu | 現 portfolio AmbientHomeHero (home) | 現 portfolio /experiments/dot (gallery 4) |
|---|---|---|---|
| シーン繋がり (transition) の質 (anchor / orbit / burst の表情) | reference | (verify) | (verify) |
| 単一 scene の particle motion (audio reactive 反応) | reference | (verify) | (verify) |
| film post の bloom / grain / chroma / vignette 強度 | reference (silent baseline) | (verify) | (verify) |
| audio 有効時の envelope 反応 (beat 120 BPM) | reference | (verify) | (verify) |
| gallery mode 視覚密度 / 4 panel のバランス | reference (各 layout で確認) | N/A | (verify) |
| keyboard interaction (ArrowKeys / Space / r) の visual feedback | reference | N/A | (verify) |

---

## 3. 次 chat 想定作業フロー

1. 元プロジェクト dev 起動 + browser baseline 視覚記憶
2. 現 portfolio dev 起動 + 差分洗い出し
3. §2.1 + §2.2 の各候補を順次 audit、原因特定 → port
4. file diff で missing 構造があれば移植
5. 各修正の前後で side-by-side 比較確認
6. 完了判定: 元 motion-dot-new-webgpu と quality parity (transition 表情 / scene quality / audio envelope の 3 軸で user 確認)
7. 確定後 D2.8 を `[~]` → `[x]` に昇格、stream-status/2.md / Wave 1 handoff の関連箇所更新
8. Wave 1 progress 26/36 → 27/36 = 75% に再上昇

---

## 4. 重要参照 path

| 種別 | path |
|---|---|
| 元プロジェクト root | `/Volumes/SamsungPortableSSDX5001/documents/life/output/motion-dot-new-webgpu/` |
| 元 main.ts | `life/output/motion-dot-new-webgpu/src/main.ts` |
| 元 INTENSITY_TUNING + presentationModulation | main.ts:87-213 |
| 元 transitionScenes / kineticHandoff config | main.ts:281-370 |
| 現 motion-dot package | `packages/motion-dot/src/index.ts` |
| 現 createDotParticipant | packages/motion-dot/src/index.ts (本 chat で +500 lines 追加) |
| 現 MotionStageProvider | `apps/web/src/features/motion/MotionStageProvider.tsx` |
| 現 home AmbientHomeHero | `apps/web/src/features/hero/components/AmbientHomeHero.tsx` |
| 現 /experiments/dot client | `apps/web/src/app/[locale]/experiments/dot/client.tsx` |
| TRANSITION_ANCHOR_POLICIES | `packages/motion-dot/src/transition/kinetic-handoff.ts` (Title Case keys) |
| Wave 1 完了 handoff | `docs/renewal-2026/stream-wave1-completion-handoff.md` |
| Stream 2 SSoT | `docs/renewal-2026/stream-status/2.md` D2.8 [~] partial |

---

## 5. 次 chat 起動の verbatim prompt

```
chibatakumi-portfolio renewal 2026 D2.8 motion-dot quality remediation を継続してください。

== 必須前提 (skip 禁止) ==
1. 親計画 §0.4: /Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md §7 + stream-status/{1-5}.md 全件 read
2. 本 task の handoff doc 通読: /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/docs/renewal-2026/motion-dot-quality-remediation-handoff.md
3. 元プロジェクト visual baseline: /Volumes/SamsungPortableSSDX5001/documents/life/output/motion-dot-new-webgpu/ を dev 起動して目で焼き付ける

== 前 chat 状況 ==
- branch: feat/renewal-2026-phase2-motion-dot (uncommitted、Wave 1 + D2.8 partial 全 working tree 滞留)
- 起点 commit: 4f9fbb0a
- D2.8 [~] partial: Phase A+2 wiring (gallery mode + keyboard cluster) + 3 critical regression fix (demoStyle "beat" / Title Case mapping / INTENSITY_TUNING gallery damping) は landed、ただし user 視点で quality parity 未達
- typecheck: motion-dot 0 errors / apps/web baseline 4 errors / build 全 route prerender 成功
- 全体進捗: 26 / 36 = 72.2% (D2.8 を [~] partial に格下げした後の数値)

== 担当 D{N}.{n} ==
D2.8 motion-dot quality remediation のみ。Wave 2 の他 D{N}.{n} (D5.1 Filmtone migration 等) には触らない (別 chat の管轄)。

== 着手手順 ==
handoff doc §3 の作業フローに従う:
1. 元プロジェクト dev 起動 + baseline 視覚記憶
2. 現 portfolio dev 起動 + 差分洗い出し
3. handoff §2.1 + §2.2 の audit 候補を 1 件ずつ検証 → 原因特定 → port
4. 必要なら file diff (主に main.ts vs createDotParticipant) で missing 構造を移植
5. 各修正で side-by-side 比較
6. 完了判定: user 視覚 OK + typecheck 0 / build 成功
7. D2.8 を [x] 昇格、stream-status/2.md + Wave 1 handoff 関連箇所更新

== 制約 ==
- 保守的意見優先せず品質最優先 (user 既定 directive)
- 本質優先 / 外殻最小限 (HUD overlay は外殻として Wave 3 forward 維持)
- chat 独断 de-scope 禁止 (plan §0.3)
- handoff doc を invalidate しないために stream-status / Wave 1 handoff も同時更新
- silent fallback 禁止 (feedback_no_fallback_bug_hotbed)

「Agent Teamsで」可能、ただし motion-dot quality は単一 file (packages/motion-dot/src/index.ts) 中心の連続作業なので 1 agent 直接または main thread 直接が現実的。並列分解できる場合のみ分解。

着手前に元プロジェクト dev 起動 + 現 portfolio dev 起動の **side-by-side baseline 確認** が最優先。これなしで実装に入っても hit miss が続く。
```

---

## 6. commit / push の判断

本 chat 終了時点で uncommitted 変更が **67 file** 滞留 (Wave 1 全体 + D2.8 partial)。次 chat 着手前に user が:

(A) **このまま commit せず別 chat で続ける** — 次 chat が現状を verify しつつ作業継続。working tree は引き継がれる
(B) **D2.8 [~] partial state で commit** — 次 chat はクリーン base から remediation 着手、commit に「D2.8 partial」と明記

推奨は **(B)**: working tree が肥大化すると次 chat が逆向きの drift しやすい。現状を一旦 commit + push で固定、別 chat で D2.8 quality remediation を別 commit に分離する方が anti-drift 上 clean。

提案 commit message:

```
feat(renewal-2026): Wave 1 + D2.8 partial — motion shell + IA + design system + audio infra + gallery/keyboard wiring

Wave 1 (4 agent parallel + Director v3):
- Stream 4 D4.7-D4.10/D4.12 [x] (motion shell + IA, less D4.11 partial)
- Stream 3 D3.1/D3.4/D3.6 [x] + D3.2/D3.3 [~] partial (Storybook v3 de-scoped)
- Stream 5 D5.3 [x] + D5.7 [~] partial (Filmtone migration deferred to Wave 2 F)
- Stream 1 D1.6 audit verified clean at submodule HEAD b96998b

D2.8 Phase A+2 partial (anti-drift §7 realignment, plan v4):
- composite-25d gallery mode + keyboard cluster wired in createDotParticipant
- 3 critical regression fix landed: demoStyle "beat" restored, TRANSITION_ANCHOR_POLICIES
  Title Case mapping (DOT_SCENE_DISPLAY_NAMES), INTENSITY_TUNING gallery damping ported
- Quality parity vs original motion-dot-new-webgpu still pending — full remediation
  handoff: docs/renewal-2026/motion-dot-quality-remediation-handoff.md
- D2.8 marked [~] partial in stream-status/2.md

Director audit trail: v4 (D2.8 + 母数 36) / v3 (D3.5 de-scope + Wave 3 QA Wave) /
v2 (partial 化 + Anti-Drift Discipline) / v1 (initial)
```
