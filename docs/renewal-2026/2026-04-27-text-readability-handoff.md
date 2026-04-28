# Text Readability Investigation Handoff — 2026-04-27 JST

このドキュメントは、Phase B Liquid Glass HUD redesign 完了後の **次の課題:「motion-dot 背景上の通常テキストの可読性」** を次チャットで取り組むための完全引き継ぎです。

このドキュメントを正本とすること。前段の `2026-04-27-liquid-glass-hud-redesign-handoff.md` は Phase B の引き継ぎで、本タスク（テキスト可読性）には直接関係しない。

---

## 0. 現在位置

| 項目 | 内容 |
|---|---|
| Repository | `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio` |
| Branch | `feat/renewal-2026-phase2-motion-dot` |
| Current HEAD | `eb4df565 feat(renewal): Phase B Liquid Glass HUD redesign — 4-surface dock` |
| HEAD status | `origin/feat/renewal-2026-phase2-motion-dot` より `ahead 12` |
| Active routes for visual checks | `/`, `/journal`, `/experiments`, `/works`, `/about`, `/contact`, `/craft` |
| Next task | **通常テキスト（page body 文字、headline、本文、card label、caption 等）の可読性問題の調査と対応** |
| User's framing | 「メニューやコントローラーについては及第点。普通の文字が読みづらい件についてどう対応するか」 |

---

## 1. このチャットで起きたこと（時系列ダイジェスト）

### 1.1 開始状態

- 前チャットからの引き継ぎ: `docs/renewal-2026/2026-04-27-liquid-glass-hud-redesign-handoff.md`
- HEAD: `a7c5fe43 fix(renewal): restore liquid glass nav content layering`
- Phase A (nav z-order / sheet 境界) は committed、Phase B (motion-dot HUD redesign) が未着手

### 1.2 Phase B 計画フェーズ

ユーザー指針:
- 本質の進行を最優先、外殻は最小限
- 保守的意見を優先せずプロダクト品質最優先
- sequential-thinking を使う
- わからない場合は検索 / 質問
- Agent Teams で進める

並列調査 (Explore agent × 3) で確定した前提:
- HUD は 13+ の dark opaque pill (`rgba(20,20,22,0.92)` 系) で散在
- Liquid Glass system は `kind: "control"` 既存、FRONT_KINDS に含まれる
- shader は dynamic-offset uniform 方式（per-surface 描画）→ shader 改変不要、JS 側のみで MAX_SURFACES 拡張可
- `data-nav-menu-open` root attribute は未実装、`MotionStageProvider` overlay に stable class なし
- `LiquidGlassProvider` は React 経由 (`LiquidGlassSurface` → `data-liquid-glass-surface`) のみで、非 React DOM 登録経路なし
- `buildDrawList()` の事前 clamp バグ (`Math.min(state.surfaces.length, LIQUID_GLASS_MAX_SURFACES)`) が後続 control を front pass で落とす

ユーザー確認済み設計方向 (AskUserQuestion):
- Direction: **Status + Dock** (visionOS 寄り、4 surface 統合)
- Audio panel は今回スライスで Liquid Glass popover 化
- Hotkey legend は More button から開く 1 surface popover に統合（10 chip 廃止）

### 1.3 Phase B 実装フェーズ

3 stream 並列実装 (engineer subagent × 3):
- Stream A (Layer wiring): Nav.tsx + MotionStageProvider.tsx + layout.tsx
- Stream B (shader cap & draw fix): composite.ts + compose-factory.ts
- Stream C (provider observer): LiquidGlassProvider.tsx

その後、Slice 2 (HUD redesign) を本チャット主体で実施:
- `packages/motion-dot/src/ui/hud.ts` 全面書き換え (旧 882 行を 4-surface 設計に再構成)
- `packages/motion-dot/src/main.ts` の HUD wiring を新 API に切替
- `webgpu-motion-dom` lib 依存を hud.ts から除去（`createOverlayText`/`createPillButton`/`createHotkeyLegendPrimitive`/`setGroupVisibility`/`setVisibility`）
- `keyboard.ts` の `bindKeymap` 依存は維持

### 1.4 Phase B 検証結果

```bash
bun run --cwd apps/web lint -- src/features/liquid-glass src/shared/components/Nav.tsx 'src/app/[locale]/(portfolio)/layout.tsx' src/features/motion/MotionStageProvider.tsx
# exit 0, no warnings/errors

apps/web/node_modules/.bin/tsc --noEmit --incremental false -p apps/web --pretty false
# only known baseline: apps/web/src/features/interactive/film-lab/params-codec.test.ts:87 TS2352

apps/web/node_modules/.bin/tsc --noEmit --incremental false -p packages/motion-dot --pretty false
# clean (exit 0)

git diff --check
# clean

curl smoke (with running dev server):
# GET /journal      200 in 1851ms
# GET /experiments  200 in 415ms
# GET /             200 in 350ms
```

ブラウザ検証: ユーザーが目視確認、HUD/メニューは「及第点」と判定。

### 1.5 Phase B コミット

```
eb4df565 feat(renewal): Phase B Liquid Glass HUD redesign — 4-surface dock
8 files changed, 696 insertions(+), 367 deletions(-)
```

コミット対象（ファイル単位で明示 stage、dirty worktree 無関係ファイルは除外）:
- `apps/web/src/app/[locale]/(portfolio)/layout.tsx`
- `apps/web/src/features/liquid-glass/LiquidGlassProvider.tsx`
- `apps/web/src/features/liquid-glass/compose-factory.ts`
- `apps/web/src/features/liquid-glass/shaders/composite.ts`
- `apps/web/src/features/motion/MotionStageProvider.tsx`
- `apps/web/src/shared/components/Nav.tsx`
- `packages/motion-dot/src/main.ts`
- `packages/motion-dot/src/ui/hud.ts`

### 1.6 Phase B で確立した contract（次タスクで前提となる）

**Z-order (`apps/web/src/app/[locale]/(portfolio)/layout.tsx` inline `<style>`)**:
```css
:root {
  --rail-x: 18px;
  --rail-y: 12px;
  --rail-height: 60px;
  --motion-hud-top: calc(var(--rail-y) + var(--rail-height) + 18px);  /* = 90px */
  --z-motion-hud: 20;                  /* legacy, unused post-Phase B */
  --z-motion-hud-panel: 30;            /* legacy */
  --z-motion-hud-content: 1210;        /* HUD overlay (motion-stage-hud-overlay) */
  --z-nav-panel-scrim: 1090;
  --z-nav-front-glass: 1200;           /* LiquidGlassFrontChrome canvas */
  --z-nav-hit: 1210;                   /* nav hit/icon */
  --z-nav-panel-content: 1300;         /* open nav panel content */
  --z-nav-visual: var(--z-nav-front-glass);
  --z-nav-panel: var(--z-nav-panel-content);
}
:root[data-nav-menu-open] .motion-stage-hud-overlay { display: none; }
```

完全な layer stack（背面 → 前面）:
```
z=-10   motion-dot canvas (MotionStageProvider 背景, 動画的に常時動く)
z=0     page HTML (children, body content) ← ★問題はここ ★
z=20    --z-motion-hud (legacy 未使用)
z=30    --z-motion-hud-panel (legacy 未使用)
z=1090  nav scrim (open menu 中の full-viewport scrim)
z=1200  LiquidGlassFrontChrome canvas (WebGPU front-layer)
z=1210  nav hit/icon layer + motion-stage-hud-overlay (Phase B 統合)
z=1300  nav panel content (open menu DOM)
```

**Liquid Glass surface registration (Phase B で確立)**:
- React 経由: `<LiquidGlassSurface surfaceId="..." kind="..." />` → `data-liquid-glass-surface`
- 非 React DOM 経由: `data-liquid-glass-control="control.<id>"` 属性 → MutationObserver で auto-register、`kind: "control"` 固定
- 補助 dataset: `data-liquid-glass-radius`, `data-liquid-glass-intensity`, `data-liquid-glass-brightness`, `data-liquid-glass-tint`
- `LIQUID_GLASS_MAX_SURFACES = 48`、buildDrawList は filter→cap 順
- shader (`composite.wgsl`) は dynamic offset 方式、 shader 自体は変更せず増減対応

**禁止事項（前チャットからの継続）**:
- DOM capture API (`html2canvas` / `getDisplayMedia` / `captureStream` / `drawImage`)
- WebGL fallback
- dirty worktree の無関係ファイル編集 (`git reset/checkout/clean` 禁止)
- `--no-verify` 等のフック skip

---

## 2. 次のタスク: 通常テキストの可読性問題

### 2.1 ユーザーの問題提起

> 「普通の文字が読みづらい件についてどう対応するかを検討したい」

「メニューやコントローラー」（=Phase A の nav と Phase B の HUD）は及第点に達した。次は **portfolio の本文・見出し・キャプション・カードラベル等の通常テキスト** が motion-dot canvas 背景で読みづらい問題を扱う。

### 2.2 想定される根本原因（次チャットで検証必要）

#### 原因 A: motion-dot 背景の輝度・色の動的変化
- motion-dot は z=-10 で 16+ scene を切り替えながら描画される generative animation
- scene によっては明るい / 暗い / 高彩度 / 低彩度の領域が動く
- 静的色のテキストでは contrast が局所的に崩れる時間帯がある

#### 原因 B: page wrapper の透過性
- `apps/web/src/app/[locale]/(portfolio)/layout.tsx` の outer wrapper は `data-theme="light"` のみ。**bg なし** (motion-dot canvas を見せるため `background-color` を意図的に外している、line 22-25 のコメント参照)
- 結果、page HTML (z=0) は透過で、後ろの motion-dot がそのまま透ける
- 本文の `<article>`/`<section>` 等のコンテナにも背景なしのケースが多いと推測

#### 原因 C: `data-theme="light"` 配下のテキスト色
- light theme 既定値が dark substrate を想定しておらず、`color: hsl(0 0% 8%)` 等の暗いテキストが暗い motion-dot canvas に乗ると読めない
- 一部 page で意図的に dark theme に切替えているか不明

#### 原因 D: text-shadow / outline の不在
- 動的背景上の text 可読性を担保する標準テクは `text-shadow` / outline / sub-scrim のいずれか
- 現状、portfolio body 全体での適用状況は未調査

#### 原因 E: section 単位の scrim/glass 不在
- nav と HUD は Liquid Glass material で読みやすさを確保
- だが portfolio の本文セクション (hero / journal entry / works grid / about prose 等) は同等の treatment が無い可能性

### 2.3 次チャットでの最初のステップ

**Phase 1: 現状把握（Explore 並列）**

並列で以下を調査せよ:

**Stream X1: ルートとレイアウトの実態**
- `/` (`apps/web/src/app/[locale]/(portfolio)/page.tsx` 想定、実際には別の構成かも)
- `/journal` (`apps/web/src/app/[locale]/(portfolio)/journal/...`)
- `/experiments` (`apps/web/src/app/[locale]/(portfolio)/experiments/...`)
- `/works` `/about` `/contact` `/craft`

各ルートで:
- ページ root に背景があるか / 透過か
- main の `<article>` `<section>` `<h1>` `<p>` 系の color / background / text-shadow
- 文字コントラストが motion-dot 背景に対して足りるか

**Stream X2: theme system の実態**
- `apps/web/src/app/globals.css` の `:root` / `[data-theme="light"]` / `[data-theme="dark"]` トークン定義
- 直近 commit `5c5a215f fix(theme): activate Radix dark palette on data-theme=dark surfaces` の変更を git show で確認
- `apps/web/src/styles/` 配下のトークンファイル
- text color トークン (`--text-base`, `--text-muted` 等) の実際の値

**Stream X3: motion-dot 背景の輝度プロファイル**
- `packages/motion-dot/src/scene/*` で各 scene の色域
- どの scene がどの程度の luminance / saturation / motion を出すか
- 全 16 scene の代表色 / 動きの激しさ
- substrate texture (post-effect 後) の典型 luminance 範囲

### 2.4 想定される対応案（決め打ちせず、現状把握後に検討）

#### Approach 1: Universal text-shadow / glow (最軽量)
- portfolio body の text に `text-shadow` token を導入
- 動的背景にどんな色が来ても contrast を底上げ
- 利点: 1 行の CSS 変更で全体改善、JS なし
- 欠点: text-shadow は editorial typography の繊細さを損なう可能性、CJK では fuzzy になりやすい

#### Approach 2: Per-section glass / scrim
- 本文 section ごとに半透明 scrim or Liquid Glass surface を背面に配置
- nav / HUD と同じ system に統合
- 利点: 既存 `LiquidGlassSurface` の `kind: "panel"` がそのまま使える、material 一貫性
- 欠点: surface 数増加、レイアウト判断が route 単位で必要

#### Approach 3: motion-dot luminance dim
- motion-dot canvas 自体の輝度を全体的に下げる、もしくは saturation を抑える
- post-effect の output stage で `mix(out, vec3(0), 0.3)` 系の dim
- 利点: 1 箇所の変更で全 route が均一化、text 側は無変更
- 欠点: motion-dot の作品性が損なわれる可能性

#### Approach 4: Dynamic substrate luminance probe + text auto-contrast
- motion-dot substrate texture の局所 luminance を sampling し、text element の color を動的に切替
- text の親 container に luminance probe を仕込む
- 利点: 最も適応的
- 欠点: 実装コスト高、リアルタイム sampling のパフォーマンス影響、過剰設計の可能性大

#### Approach 5: route-level theme split
- motion-dot を見せたい route (`/`, `/experiments`) と、本文を読ませたい route (`/journal`, `/about`) で扱いを分ける
- 本文重視の route では motion-dot を opacity 下げる or hero のみに限定
- 利点: 用途別最適化
- 欠点: route ごとに UX が断片化

#### Approach 6: text container を Liquid Glass panel で包む (editorial readability)
- journal や article の本文 container を `<LiquidGlassSurface kind="panel">` で包む
- panel 自体が motion-dot を refract した状態で読めるよう紙面を確保
- 利点: visionOS-grade editorial reading experience、material 一貫性
- 欠点: surface 数 / レイアウト工数

**推奨**: 現状把握後、Approach 2 + 6 のハイブリッドが本質的（メニュー・HUD と同じ Liquid Glass material world で本文も成立させる）。Approach 1 (text-shadow) は CJK タイポでの可読性低下が大きいので避けたい。

### 2.5 既存ナレッジ（auto-memory）

ユーザーの auto-memory に CJK タイポグラフィ関連の蓄積:

- **CJK タイポグラフィ (2026-03-10)**:
  - `text-wrap: balance` は CJK で不自然な改行 → 使わない
  - CJK 幅制約は `ch` ではなく `em`
  - `word-break: auto-phrase`（Chrome 130+）を使う
  - 詳細: `.ai/knowledge/cjk-typography-pitfalls.md`

- **Hero Shader 写真可視性 (2026-03-10)**:
  - シェーダー暗化 + CSS グラデーションの **乗算効果** で文字消失することがある
  - text 可読性は text-shadow で代替可能（ただし CJK では慎重に）
  - 詳細: `.ai/knowledge/hero-shader-visibility.md`

- **Photography LP Heat Tokens (2026-03-09)**:
  - inline `rgba(255,196,61,N)` → `var(--heat-subtle/medium/intense)` で統一済み
  - color-mix でトークン化

これらは次チャットで参照可能。

---

## 3. 触ってよいファイル候補

このタスクで編集しうるファイル候補（要 Phase 1 確認後に絞り込み）:

| 種別 | パス | 意図 |
|---|---|---|
| 調査 | `apps/web/src/app/globals.css` | text/color トークン |
| 調査 | `apps/web/src/styles/` 配下全体 | デザイントークン |
| 調査 | `apps/web/src/app/[locale]/(portfolio)/page.tsx` または `**/page.tsx` | 各 route の root 構造 |
| 調査 | `apps/web/src/app/[locale]/(portfolio)/journal/...` | journal の wrapper / typography |
| 調査 | `apps/web/src/features/typography/` (存在すれば) | 共通タイポ component |
| 編集候補 | `apps/web/src/app/globals.css` | 共通 text token / text-shadow utility 追加 |
| 編集候補 | 各 route の page.tsx / layout.tsx | section 包み込み or scrim 追加 |
| 編集候補 | `apps/web/src/features/liquid-glass/route-accent.ts` | route 別 accent / opacity 制御 |
| 編集候補 (慎重) | `packages/motion-dot/src/post/*` | 全体 luminance dim (Approach 3) |
| 編集候補 (慎重) | `apps/web/src/features/liquid-glass/LiquidGlassFrontChrome.tsx` | front chrome 自体への変更 |

**触らないファイル**:
- dirty worktree の無関係ファイル (`packages/motion-flow/*`, `packages/motion-grid/*`, `apps/web/src/app/[locale]/(portfolio)/experiments/{flow,grid}/client.tsx` 等)
- `bun.lock`
- `.claude/settings.local.json`

---

## 4. 次チャット用の高精度引き継ぎプロンプト

以下を **そのままコピペ** で次の新規チャットの最初のメッセージに使う。プロジェクトコンテキスト、Phase B の前提、調査依頼、行動制約をすべて含む。

```text
Repository:
/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio

Branch: feat/renewal-2026-phase2-motion-dot
HEAD: eb4df565 feat(renewal): Phase B Liquid Glass HUD redesign — 4-surface dock
HEAD は origin/feat/renewal-2026-phase2-motion-dot より ahead 12 (push 前)

最初に必ず読むこと:
1. docs/renewal-2026/2026-04-27-text-readability-handoff.md  ← 本タスク正本
2. (参考) docs/renewal-2026/2026-04-27-liquid-glass-hud-redesign-handoff.md  ← Phase B の前提

タスク:
portfolio の通常テキスト（page body の見出し・本文・caption・card label 等）が
motion-dot canvas (z=-10 で動的に動く generative animation) 背景上で読みづらい
問題を、調査・設計・実装する。

ユーザーの正確な発言:
「メニューやコントローラーについては及第点の仕上がり。
 次は普通の文字が読みづらい件についてどう対応するかを検討したい」

つまり:
- nav (Phase A) と motion-dot HUD/dock (Phase B) は完了している
- それらは Liquid Glass material で可読性を確保している
- だが portfolio 本文 (`/`, `/journal`, `/experiments`, `/works`, `/about`, `/contact`, `/craft`)
  の通常テキストは motion-dot 背景に対して可読性が不足している
- これを Apple Liquid Glass design language の延長で解決したい

現在のレイヤー contract（Phase B で確立済み）:
  z=-10   motion-dot canvas (背景 generative)
  z=0     page HTML (本文) ← ★問題はここ ★
  z=1090  nav scrim
  z=1200  LiquidGlassFrontChrome canvas
  z=1210  nav hit + motion-stage-hud-overlay
  z=1300  open nav panel content

Liquid Glass material の登録経路（Phase B で整備済み）:
- React: <LiquidGlassSurface surfaceId="..." kind="nav|panel|rail|control" />
- 非 React DOM: data-liquid-glass-control="control.<id>" + 補助 dataset
- LIQUID_GLASS_MAX_SURFACES = 48, kind=panel が編集セクションに最適
- shader は dynamic offset 方式、shader 改変なしで増減可能

採用方針（ユーザー指示の継続）:
- 本質の進行を最優先、外殻は最小限
- 保守的意見を優先せずプロダクト品質最優先
- 思考は sequential-thinking
- わからない場合は検索 (gemini or web search) または質問
- 「Agent Teamsで」と言われたら独立 stream に分割して並列実行
- 推奨タイミングで次チャットに引き継ぐ

行動制約（厳守）:
- DOM capture API 全面禁止 (html2canvas / getDisplayMedia / captureStream / drawImage)
- WebGL fallback 禁止
- dirty worktree の無関係ファイルを編集しない（git reset/checkout/clean 厳禁）
  ・触らないファイル: packages/motion-flow/*, packages/motion-grid/*,
    apps/web/src/app/[locale]/(portfolio)/experiments/{flow,grid}/client.tsx,
    bun.lock, .claude/settings.local.json
- pre-commit hook を skip しない (--no-verify 禁止)
- text-shadow を使う場合 CJK では慎重に（auto-memory: CJK タイポ pitfalls）

最初に実施すること（Phase 1: 現状把握）:
Agent Teams で 3 stream 並列の Explore agent を spawn し、以下を調査する。

Stream X1: 各 route の本文 typography と wrapper の実態
- /, /journal, /experiments, /works, /about, /contact, /craft の page.tsx 構造
- 本文 container が背景を持つか、透過か
- h1/h2/p/caption の color / background / text-shadow
- どの route が motion-dot 背景に対して特に読みづらいか

Stream X2: theme system のトークン定義
- apps/web/src/app/globals.css の :root / [data-theme="light"] / [data-theme="dark"]
- apps/web/src/styles/ 配下のトークン
- 直近 commit 5c5a215f (Radix dark palette) の影響範囲
- text-base / text-muted / surface 系トークン値

Stream X3: motion-dot scene の輝度プロファイル
- packages/motion-dot/src/scene/* の各 scene
- 全 16 scene の代表色域、明るさ、動きの激しさ
- post-effect output の典型 luminance
- どの scene が text を最も読めなくするか

その上で、Approach 1〜6 のいずれか、もしくはハイブリッドを設計し、
ユーザーに方向性を確認 (AskUserQuestion with previews) してから実装に入る。

Approach 候補（handoff doc §2.4 に詳細）:
1. Universal text-shadow / glow (最軽量、CJK で要注意)
2. Per-section glass / scrim (本命候補)
3. motion-dot luminance dim (作品性とトレードオフ)
4. Dynamic substrate luminance probe (高コスト)
5. Route-level theme split
6. Text container を LiquidGlassSurface(kind=panel) で包む (本命候補)

推奨スタートは Approach 2 + 6 のハイブリッド検討、ただし現状把握前に決め打ちしない。

検証コマンド (Phase B と同じ):
bun run --cwd apps/web lint -- <touched files>
apps/web/node_modules/.bin/tsc --noEmit --incremental false -p apps/web --pretty false
apps/web/node_modules/.bin/tsc --noEmit --incremental false -p packages/motion-dot --pretty false
git diff --check

既知の TS baseline:
apps/web/src/features/interactive/film-lab/params-codec.test.ts:87 TS2352
これ以外の typecheck error が出たら必ず直す。

dev server 起動方法:
1. lsof -nP -iTCP:3000 -sTCP:LISTEN で誰も使ってないこと確認
2. ls apps/web/.next/dev/lock があれば PID 死亡確認の上 rm
3. bun run --cwd apps/web dev (run_in_background)
4. "Ready in" 表示まで待機

ブラウザビジュアル確認:
- /, /journal, /experiments, /works, /about, /contact, /craft それぞれで
  実際に文字が読めるか、motion-dot scene 切替中も読めるか
- DevTools Console で WebGPU validation warnings/errors が 0 か
- Phase B の HUD/dock/popover が壊れていないか（regression check）

着手前に必ず:
1. 上記 handoff doc 全体を読む
2. 現状把握 stream を spawn して結果を踏まえる
3. ユーザーに方向性を確認 (AskUserQuestion 推奨、previews 付き)
4. 同意の上で計画書を /Users/chibatakumi/.claude/plans/ に書く
5. ExitPlanMode で承認を得てから実装

不明点があれば実装前に質問。憶測で着手しない。
```

---

## 5. このドキュメント自体の取り扱い

- 本ファイル `docs/renewal-2026/2026-04-27-text-readability-handoff.md` は **未 commit 状態**で次チャットに渡す（dirty worktree の untracked file として残す）
- 次チャット担当が読み終わったら、調査メモなどを含めて適宜 commit するか、別途 archive するかは次チャット判断
- 旧 `docs/renewal-2026/2026-04-27-liquid-glass-hud-redesign-handoff.md` は Phase B 正本として保持、削除しない

---

## 6. Phase 2 計画策定完了 (2026-04-27 JST 第2チャット追記)

本タスクの **Phase 1 (現状把握) と Phase 2 (設計策定) が完了**。実装は次チャットで Phase 3 として開始する。

### 6.1 Phase 1 で発見した最重要事実

**`(portfolio)` light routes の token chain が壊れている。** `apps/web/src/app/globals.css` の `--surface-1/2/3`, `--bg-dark`, `--bg-darker`, `--text-base`, `--text-muted`, `--accent-amber*`, `--bg-overlay-*`, `--stroke-*` 等は全て `var(--slate-N)` / `var(--amber-N)` を参照しているが、Radix slate-dark / amber-dark palette は `[data-theme="dark"]` 配下 (lines 217–255) のみで定義されている。`(portfolio)` layout は `data-theme="light"` を設定しているため、**全エイリアスは `undefined` → `transparent` に解決される**。

その結果、`/about` `/craft` `/journal` の `bg-[var(--bg-dark)]` は何も描画していない。コミット `5c5a215f` は `(satellite)` と `(portfolio)/experiments` (どちらも dark-themed) のみ修正しており、`(portfolio)` light routes は未修正。

これは「scrim を足す」より深い、**substrate token system の根本バグ**である。

### 6.2 Phase 1 で確認した補助事実

- **route surface inventory (Stream X1)**: 7 routes 全てが motion-dot 透過に脆弱。`/works` のみ Three.js multiply bg + scrim 0.55–0.85 で保護済み。`/contact`, `/`, `/experiments` body は完全透過。`/journal` cards は `--surface-1` (= 84% slate-1 = undefined → transparent)。再利用可能な `<Section>` / `<Card>` component は存在しない。
- **motion-dot scene 輝度プロファイル (Stream X3)**: 16 scenes、particles は **mostly dark (#1A1A1A) at 90% dark + 10% white**。worst-3 = Grid Fluid (336 particles), Magnet (60+converging swarms), Phase Transition (48 sync pulse)。global dim 機構なし。`setComposePass()` extension point + `LiquidGlassFrameState` 経由で挿入可能。`GALLERY_SCENE_DAMPING` パターンが `main.ts:180-198` に既存 (Orbit/Flock を 0.46–0.50 にダンプ)。
- **既存 readability primitives (Stream X2)**: `.ui-panel`, `.frame-panel-editorial`, `.fl-card--frost`, `.film-lab-liquid-glass` は存在するが、上記 token chain バグにより light mode では未機能 (一部除く)。general-purpose な `text-shadow` utility は無し (chromatic effect 用のみ)。

### 6.3 Phase 2 で採用した設計方針: **Hybrid (Foundation + Selective Liquid Glass)**

ユーザーが AskUserQuestion で 3 択から選択:
- ❌ Plan A: Liquid Glass editorial surface 全面 (maximalist)
- ❌ Plan B: substrate dim + minimal CSS only (minimalist)
- ✅ **Hybrid: foundation (token fix + substrate dim) + 選択的 Liquid Glass on hero/feature cards**

詳細は完全な計画書を参照:
**`/Users/chibatakumi/.claude/plans/resilient-purring-pumpkin.md`** ← Phase 3 実装の正本

主要素:
1. **Token chain fix**: `:root` に literal OKLCH primitives (`--slate-1`〜`--slate-12`, `--amber-1/9/10/11`) と semantic mirror aliases (`--bg-dark`, `--text-base` 等) を追加
2. **Substrate dim signal**: `@property --motion-dot-readability` + `data-readability="focus|reading|immersive"` 属性 + `useReadabilityRegions` hook (IntersectionObserver + rAF lerp)
3. **Shader composite uniform**: `composite.ts` に `readability: f32` uniform 追加、substrate を `mix(vec3(0.82), substrate.rgb, readability)` でブレンド (lensing math より前)
4. **`<EditorialSection>` component**: `glass` prop で WebGPU LiquidGlassSurface (kind="panel") か CSS-only `.editorial-surface-flat` を選択
5. **Per-scene damping for worst-3**: Magnet (3), DNA Helix (9), Phase Transition (10) を `GALLERY_SCENE_DAMPING` に追加
6. **CJK typography hardening**: `.editorial-prose` utility (line-height 1.85, `word-break: auto-phrase`, `text-wrap: pretty`, NO text-shadow)

### 6.4 Phase 3 (実装) 開始時の正確なプロンプト

新規チャットで以下を貼り付けて開始:

```text
Repository: /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio
Branch: feat/renewal-2026-phase2-motion-dot
HEAD: eb4df565 feat(renewal): Phase B Liquid Glass HUD redesign — 4-surface dock

最初に必ず読むこと (順番厳守):
1. /Users/chibatakumi/.claude/plans/resilient-purring-pumpkin.md  ← Phase 3 実装の正本
2. docs/renewal-2026/2026-04-27-text-readability-handoff.md  ← 本タスク全体の引き継ぎ (§6 を最重視)
3. (参考) docs/renewal-2026/2026-04-27-liquid-glass-hud-redesign-handoff.md  ← Phase B 前提

タスク:
Phase 2 で承認された Hybrid plan の実装。Step 1 (token chain fix) から Step 9 (verification) まで順次実施し、
各 Step group ごとにコミット:
- Steps 1–2: "tokens" (globals.css token chain fix + editorial tokens + utilities + @property)
- Steps 3–6: "substrate dim" (useReadabilityRegions hook, LiquidGlassFrameState plumbing, shader uniform, scene damping)
- Step 7: "EditorialSection" (新規 component + index export)
- Step 8: per-route adoption (8a /about → 8b /craft → 8c /contact → 8d /journal → 8e / → 8f /experiments → 8g /works skip)

採用方針 (前チャット継続):
- 本質の進行を最優先、外殻は最小限
- 保守的意見を優先せずプロダクト品質最優先
- 思考は sequential-thinking
- Agent Teams で並列分解可能なところは並列
- わからない場合は検索 (gemini or web search) または質問
- 推奨タイミングで次チャットに引き継ぐ

行動制約 (厳守):
- DOM capture API 全面禁止 (html2canvas / getDisplayMedia / captureStream / drawImage)
- WebGL fallback 禁止
- dirty worktree の無関係ファイル編集禁止 (git reset/checkout/clean 厳禁)
  ・触らないファイル: packages/motion-flow/*, packages/motion-grid/*,
    apps/web/src/app/[locale]/(portfolio)/experiments/{flow,grid}/client.tsx,
    bun.lock, .claude/settings.local.json
- pre-commit hook を skip しない (--no-verify 禁止)
- Phase A/B contracts (nav z-stack, HUD overlay, surface registration paths) を破壊しない
- text-shadow を可読性主機能に使わない (CJK 不適合)

最初に実施すること:
1. 上記 plan file 全体と handoff doc §6 を読む
2. Step 1 (token chain fix) を実装し、`bun run --cwd apps/web lint` と tsc 通過を確認
3. dev server で `/`, `/journal`, `/about` の light theme を目視確認 (token fix だけで /about の bg-dark が見えるようになる)
4. 問題なければ "tokens" としてコミット (apps/web/src/app/globals.css のみ)
5. 続いて Steps 3–6 を実施、グループでコミット
6. Step 7 単独コミット
7. Step 8 各 route ごとにコミット (per-route 検証 → 次)

Step 5 (shader uniform 拡張) は最も regression risk が高い。先に compose-factory.ts の uniform pack を読んで、現在の uniform 構造を把握してから着手すること。

dev server 起動方法 (Phase B と同じ):
1. lsof -nP -iTCP:3000 -sTCP:LISTEN で誰も使ってないこと確認
2. ls apps/web/.next/dev/lock があれば PID 死亡確認の上 rm
3. bun run --cwd apps/web dev (run_in_background)
4. "Ready in" 表示まで待機

検証コマンド:
bun run --cwd apps/web lint
apps/web/node_modules/.bin/tsc --noEmit --incremental false -p apps/web --pretty false
apps/web/node_modules/.bin/tsc --noEmit --incremental false -p packages/motion-dot --pretty false
git diff --check

既知の TS baseline (do NOT fix):
apps/web/src/features/interactive/film-lab/params-codec.test.ts:87 TS2352

ブラウザビジュアル確認:
- 全 7 portfolio routes (/, /journal, /experiments, /works, /about, /contact, /craft) で
  light theme でテキスト可読、motion-dot は依然見える、reading section で dim 発火
- /film-lab/*, /photography で dark theme 無回帰
- nav menu + dock 同時開で surface count < 48
- prefers-reduced-motion で transition skip だが値は適用される
- prefers-reduced-transparency で .editorial-surface-flat が solid fallback

不明点があれば実装前に質問。憶測で着手しない。
```

### 6.5 本チャットで未 commit のもの

- `docs/renewal-2026/2026-04-27-text-readability-handoff.md` (この doc 自体、§6 追記版) ← 次チャット担当が初回コミットに含めるか別途判断
- それ以外、本チャットでは **コードファイルを一切変更していない** (plan mode で計画書のみ作成)
- 既存の dirty worktree 状態 (前チャットからの未コミット分) は変化なし
