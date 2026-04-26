# Package 4 — Motion Works: Grid / Flow Placeholder Removal — 引き継ぎドキュメント

| 項目 | 値 |
|---|---|
| 作成日 | 2026-04-26 JST |
| パッケージ | Package 4 — Motion Works: Grid / Flow Placeholder Removal |
| 親 SSoT | `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md` |
| 親 Director Ledger | `docs/renewal-2026/director-reset-ledger-2026-04-26.md` |
| 実装リポ | `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio` |
| 計画リポ | `/Volumes/SamsungPortableSSDX5001/documents/life` |
| 作業ブランチ | `feat/renewal-2026-phase2-motion-dot` |
| ステータス | **landed (in working tree, uncommitted)** — TS clean、placeholder scan clean、metadata + i18n まで対応済 |
| Owner | chibataku0815 |
| 次チャット | 本ドキュメント §11 の verbatim prompt をそのまま使う |

---

## 0. このドキュメントの目的

Package 4 を担当した chat (本 chat) で行った実装・判断・残課題・前提を別 chat に完璧に引き継ぐ。

新 chat はこのドキュメントを最初に読み、§11 の verbatim handoff prompt をそのまま入力として受け取れば、git diff を読まずとも実装の意図と現状を完全に再構築できる状態を目標とする。

---

## 1. 親計画とパッケージ定義（必読）

### 1.1 親 SSoT の核心

`/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md` は portfolio renewal の正本。重要原則:

- **Single-number completion is prohibited.** D{N}.{n} のチェックリスト消化数 = 完了率ではない。
- **Page existence is not completion.** route が `200` を返しても、`page.tsx` が存在しても、placeholder 文字列があれば未完了。
- 親は 5 つの ledger（Core IA / Core Content / Motion Works / Satellite / Launch QA）に分かれており、各 ledger 単位で報告する。
- `Skeleton Audit Rule` (§4.3): public route が `TODO(Wave`, `future chat`, "Restoring after..." を含むなら自動的に未完了。
- グローバルナビは `Home / Experiments / Journal / Contact` のみ。
- Filmtone は `/filmtone` (legacy `/film-lab` は redirect のみ)。
- Photography は `/photography` satellite LP。

### 1.2 Package 4 のスコープ（user prompt 完全引用）

> 目的:
> Core portfolio の中心である /experiments 配下で、/experiments/grid と /experiments/flow の placeholder public surface をなくす。
> 外殻 QA / deploy / screenshots はまだ不要。まず public route が hollow でない状態にする。
>
> Ownership:
> - apps/web/src/app/[locale]/experiments/grid/*
> - apps/web/src/app/[locale]/experiments/flow/*
> - packages/motion-grid/*
> - packages/motion-flow/*
> - 必要なら apps/web/src/app/sitemap.ts の grid/flow 再追加判断
>
> Do not touch:
> - packages/motion-dot/*
> - apps/web/src/app/[locale]/experiments/dot/*
> - apps/web/src/features/hero/components/AmbientHomeHero.tsx
> - Filmtone / photography satellite routes
> - next.config.ts の satellite deferred redirects
> - contact / journal 実装済み箇所
>
> Required result:
> - /experiments/grid から "Restoring after..." / placeholder language を削除
> - /experiments/flow から "Restoring after..." / placeholder language を削除
> - grid / flow がそれぞれ実 visual state を持つ
> - WebGPU unsupported state は silent fallback ではなく明示
> - /experiments index の evergreen copy と矛盾しない
> - 実体化できた route だけ sitemap に戻す
>
> Minimum verification:
> - rg -n "TODO\\(Wave|future chat|Restoring after|placeholder|Wave 3" apps/web/src/app/[locale]/experiments apps/web/messages/en.json apps/web/messages/ja.json
> - apps/web/node_modules/.bin/tsc --noEmit -p packages/motion-grid/tsconfig.json
> - apps/web/node_modules/.bin/tsc --noEmit -p packages/motion-flow/tsconfig.json
> - apps/web/node_modules/.bin/tsc --noEmit -p apps/web
>   If apps/web tsc still fails only in the known Filmtone baseline, report it as unrelated and do not touch Filmtone internals.

User からの追加方針:
- 「本質の進行を最優先にして、外殻は最小限全てがうまく行った時の品質保証したい時にのみに行う」
- 「Agent Teamsで」起動だが、4-5 stream に分解できる規模ではないため単一 chat で完了。

### 1.3 Director Reset Ledger の Motion Works ledger 抜粋

`docs/renewal-2026/director-reset-ledger-2026-04-26.md` §Motion Works Readiness に 5 項目:

- [ ] motion-dot visual parity verified
- [ ] motion-grid route is restored and non-placeholder
- [ ] motion-flow route is restored and non-placeholder
- [ ] `/experiments` index links to all three works
- [ ] WebGPU unsupported state is explicit
- [ ] audio/mic behavior is verified where applicable

本 chat で grid restoration / flow restoration / unsupported explicit を closed。dot parity / audio mic は他 package。

---

## 2. 着手前の現状（read-only audit 結果）

### 2.1 Route 状態

`apps/web/src/app/[locale]/experiments/`:
- `dot/` — `mountMotionDotApp` を `MotionStageProvider`（root layout）でホスト済。route の client.tsx は最小ヘッダのみ。
- `grid/` — placeholder。`client.tsx` が "Restoring after motion-dot transplant. Wave 3 will rebuild this surface on the original codebase pattern." を表示。
- `flow/` — 同上、grid と同じ文言。

### 2.2 Package 状態

`packages/motion-grid/`:
- `src/participant.ts` — `createGridParticipant(opts): MotionParticipant<GridParam>` を export。MotionStage のホスト前提（init/update/render/dispose ライフサイクル）。
- `src/scene/discrete-grid-scene.ts` — `createDiscreteGridScene()`: hero word-pattern state machine + audio-reactive electric signals。
- `src/render/grid-block-pass.ts` — `createGridBlockPass(device, format)`: rgba16float に block を描画。
- `src/audio/wiring.ts` — `GRID_WIRING` (3 wire) + `GRID_AUDIO_DELTA_BUFFER`。
- `src/scene/typography/*` — hero token / pattern registry。
- `src/index.ts` — participant API のみ export。

`packages/motion-flow/`:
- `src/participant.ts` — `createFlowParticipant(opts): MotionParticipant<FlowlineParam>` を export。
- `src/compute/flowline-compute.ts` — 4000-16000 agent の WebGPU compute シミュレーション。
- `src/render/ribbon-pass.ts` — リボン描画。
- `src/scene/index.ts` — `SCENES`（7 シーン）、`SCENE_CYCLE_DURATION_SEC = 12s`、`createFlowlineSceneController`。
- `src/text/glyph-registry.ts` — hero SDF。
- `src/audio/wiring.ts` — 8 wire の `FLOWLINE_WIRING`。
- `src/index.ts` — participant API + scene/config 系を export。

### 2.3 既存の MotionStage ホスト

`apps/web/src/features/motion/MotionStageProvider.tsx`:
- root `[locale]/layout.tsx` 直下にマウント。
- `mountMotionDotApp` のみを呼ぶ（hard-wired to motion-dot）。
- canvas は `fixed inset-0 -z-10 pointer-events-none w-screen h-screen`。
- WebGPU 不可なら `MotionStageContext` に `kind: "unsupported"` を設定し、`MotionUnsupportedBanner`（experiments/layout.tsx 配下）が明示メッセージを表示。

→ **grid と flow は participant API ではなく、独自 canvas + 独自 loop でマウントする必要がある**（MotionStage host が dot 専用のため）。

### 2.4 オリジナルソース

`/Volumes/SamsungPortableSSDX5001/documents/life/output/`:
- `motion-grid-guided-webgpu/src/main.ts` — standalone mount のオリジナル。AudioBus + AudioController + HUD + keyboard cluster + scene + render + film post の全部入り。
- `motion-flowline-webgpu/src/main.ts` — 同上、flowline 版。

`packages/motion-grid/src/`、`packages/motion-flow/src/` はそれぞれの compute/render/scene/audio をすでに vendored 済（参照: 各 `src/index.ts` のヘッダコメント）。

### 2.5 sitemap.ts の状態

`apps/web/src/app/sitemap.ts` から `/experiments/grid`、`/experiments/flow` が除外済（コメントで「placeholder pending state のため」と明記）。

### 2.6 i18n 構造

- `apps/web/messages/en.json:1422` から `experiments` namespace。`title`, `description`, `eyebrow`, `intro`, `stateLabel.{active,preview}`, `openLabel`, `works.{dot,grid,flow}.{title,concept}`。
- `ja.json:1424` 同構造。
- 既存 `experiments` index page (`page.tsx`) は `getTranslations({ namespace: "experiments" })` を使い `generateMetadata` を出力済み。

---

## 3. 実装方針（決定の根拠）

### 3.1 mount API パターン

**決定:** `motion-grid` と `motion-flow` に新規 `mountMotionGridApp` / `mountMotionFlowApp` を追加。`mountMotionDotApp` のシグネチャを踏襲。

**根拠:**
- MotionStage host は root layout 1 個のみで dot にハードワイヤされている。grid/flow を participant API で噛ませるには `MotionStageProvider` を multi-participant 化する必要があり、それは Package 4 ownership 外（root layout は触らない方針）。
- オリジナル `motion-{grid,flow}-webgpu/src/main.ts` は standalone mount パターン。これを `mountMotion{Grid,Flow}App` として package 内に再構成すれば最小差分で route から呼べる。
- 「最小実装」優先の user 方針に合致。

### 3.2 audio / HUD / keyboard の扱い

**決定:** Phase 1 は音声 OFF / HUD なし / keyboard なしの ambient mode のみ。

**根拠:**
- 「実 visual state を持つ」が要件。grid の state machine は単独で hero word pattern を cycle、flow は 7-scene auto-cycle (84 s) で動き続けるため、音声なしでも動的な visual。
- AudioController + HUD + keyboard 移植は Phase A+1 へ deferred（user 方針: "外殻は最小限"）。
- AudioBus は 0 で resolve することで film-post baseline を canon 値で固定し、grid の electric signals (strikeFlag/glowMix/flickerIntensity) のみ scene からの非音声駆動で composite。

### 3.3 unsupported 表示

**決定:** silent fallback 禁止。route 内で `kind: "unsupported" | "error"` を state 管理し、明示バナー表示。

**根拠:**
- 親 SSoT §5.2: "unsupported WebGPU state is explicit, not a silent fallback"
- `feedback_no_fallback_bug_hotbed.md` ルール
- `MotionUnsupportedBanner` は MotionStageProvider (dot) の status を見るため、grid/flow の独自 mount には流用できない。route 内で個別に表示。

### 3.4 dot canvas との共存

**決定:** dot canvas (`MotionStageProvider`, z=-10) は grid/flow ルートでも実行され続ける。grid/flow の route canvas を z=0 で不透明に置くことで視覚的にカバー。GPU 浪費は Phase A+1 の最適化対象。

**根拠:**
- root layout / `MotionStageProvider` / `AmbientHomeHero` を「触るな」リスト
- 視覚的に dot は完全に隠れる（grid/flow canvas は film post で不透明出力）
- GPU を 2 重に回す欠点はあるが許容範囲。`useMotionStageVisibility(false)` のような hook 追加は別 package で行う

### 3.5 sitemap 再追加

**決定:** `/experiments/grid`, `/experiments/flow` を priority 0.8 で再追加（dot と同列）。

**根拠:**
- 親 SSoT §4.3 の skeleton audit を全パスし visual も実体化したため
- DoD 上の metadata も後段（§4.5）で追加した

### 3.6 metadata（P2 review 後の追加）

**決定:** grid/flow `page.tsx` を server component 化し `generateMetadata` を export。

**根拠:**
- レビュアー指摘: sitemap-listed route には route-level metadata 必須
- `experiments/works.{grid,flow}.{title,concept}` を再利用すれば新規文字列不要
- server component 化の副作用（dynamic({ssr:false}) を外すリスク）は OK：`webgpu-motion-shell` は module-level で navigator/document を触らず、`useEffect` 内でのみ実行されるため SSR 安全

### 3.7 i18n（P2 review 後の追加）

**決定:** unsupported/error UI を `experiments.unsupported.*` namespace に移行。

**根拠:**
- レビュアー指摘: localized route で hardcoded English は §4.1 違反
- `useTranslations("experiments.unsupported")` で en/ja 両方サポート
- ICU placeholder `{message}` で error message を埋め込み

---

## 4. 実装内容（ファイル単位、本 chat で landed）

### 4.1 `packages/motion-grid/src/mount.ts` (new, 約 160 行)

`mountMotionGridApp(opts: MountGridOptions): Promise<MountGridHandle>` を実装。

主な構成:
- `initGpu(canvas)` → device, context, format
- `createDiscreteGridScene()` → hero word-pattern state machine
- `createGridBlockPass(device, "rgba16float")` → block 描画
- `createFilmPostPass(device, format, FILM_STOCK_CANON)` → film post
- `createFixedStepLoop({ fps: 45, frame })` → 45 fps loop
- frame 内: `scene.resize` → `scene.update(dt)` → `scene.getSnapshot()` → `composeFilmConfig({...electric signals})` → `blockPass.render` → `filmPost.render`
- `ZERO_REACTIVE` (GridReactiveState 全 0) を grid-block-pass に渡す
- ELECTRIC_TICKER_CHARACTERS から rgbSplitBump を取得し、scene の strikeFlag/glowMix/flickerIntensity と合わせて film config を composite
- `stop()` で loop / scene / blockPass / filmPost を destroy

依存（既存 package.json で workspace:*）:
- `webgpu-motion-art` (FILM_STOCK_CANON)
- `webgpu-motion-post` (createFilmPostPass)
- `webgpu-motion-shell` (createFixedStepLoop, createOffscreenTargetPool, initGpu, resizeCanvas)

### 4.2 `packages/motion-grid/src/index.ts` (modified, +7 行)

末尾に `mountMotionGridApp` と型 (`MountGridOptions`, `MountGridHandle`) を追加 export。

### 4.3 `packages/motion-flow/src/mount.ts` (new, 約 220 行)

`mountMotionFlowApp(opts: MountFlowOptions): Promise<MountFlowHandle>` を実装。

主な構成:
- `initGpu(canvas)` → device, context, format
- `createHeroSdf(device)` → r32float SDF テクスチャ
- `createFlowlineCompute(device, { config: initialCompute, sdfTextureView, sdfSampler })`
- `createRibbonPass(device, { targetFormat: "rgba16float", agentBuffer, trailBuffer, nAgents, nTrail, config })`
- `createFlowlineSceneController({ compute, initialScene, baseCompute, baseRibbon })`
- `createFilmPostPass(device, format, FILM_STOCK_CANON)`
- `createFixedStepLoop({ fps: 45, frame })`
- frame 内:
  - `cycleIdx = floor(time / 12) % 7` で 7-scene auto-cycle
  - `sceneController.tick(encoder, dt)` で blend window + frameConfig 取得
  - `FLOWLINE_AUDIO_DELTA_BUFFER` を毎フレーム 0 でリセット
  - `flowlineCompute.update` (audio reactive params は 0)
  - `ribbonPass.updateConfig + render` (rimPulse=0)
  - `composeFilmConfig(deltas)` で canon + 0 deltas → ribbon の grain baseline 0.18 を適用
  - `filmPost.render`
- `stop()` で compute / ribbon / filmPost / heroSdf.texture を destroy

### 4.4 `packages/motion-flow/src/index.ts` (modified, +7 行)

末尾に `mountMotionFlowApp` と型 (`MountFlowOptions`, `MountFlowHandle`) を追加 export。

### 4.5 `apps/web/src/app/[locale]/experiments/grid/page.tsx` (rewritten)

旧: `"use client"` + `dynamic({ssr: false})` の薄いラッパー。

新: server component。
- `generateMetadata({ params })` で `experiments.works.grid.{title,concept}` から title/description/canonical/alternates/openGraph/twitter を生成
- `setRequestLocale(locale)` 呼び出し
- `<ExperimentsGridClient />` を直接 render（client.tsx は `"use client"` 境界）

canonical / alternates:
- ja: `${BASE_URL}/experiments/grid`
- en: `${BASE_URL}/en/experiments/grid`

`BASE_URL = portfolioData.site.siteUrl` (既存 import)。

### 4.6 `apps/web/src/app/[locale]/experiments/flow/page.tsx` (rewritten)

§4.5 と同形、`works.flow.{title,concept}` と `/experiments/flow` 用。

### 4.7 `apps/web/src/app/[locale]/experiments/grid/client.tsx` (rewritten, 約 100 行)

```tsx
"use client";
// /experiments/grid — Renewal 2026 Motion Works (Package 4).
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { mountMotionGridApp, type MountGridHandle } from "@chibatakumi/motion-grid";

type Status =
  | { kind: "pending" }
  | { kind: "ready" }
  | { kind: "unsupported" }
  | { kind: "error"; message: string };

export default function ExperimentsGridClient() {
  const t = useTranslations("experiments.unsupported");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mountRef = useRef<MountGridHandle | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "pending" });

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (typeof navigator === "undefined" || !("gpu" in navigator)) {
      setStatus({ kind: "unsupported" });
      return;
    }

    (async () => {
      try {
        const handle = await mountMotionGridApp({
          canvas,
          onError: (err) => console.error("[motion-grid] mount error:", err),
        });
        if (cancelled) {
          handle.stop();
          return;
        }
        mountRef.current = handle;
        setStatus({ kind: "ready" });
      } catch (err) {
        console.error("[motion-grid] mount failed:", err);
        if (!cancelled) {
          setStatus({
            kind: "error",
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      const handle = mountRef.current;
      if (handle) {
        handle.stop();
        mountRef.current = null;
      }
    };
  }, []);

  return (
    <main className="relative min-h-screen w-full bg-[var(--bg-dark)]">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 h-screen w-screen"
        aria-hidden="true"
      />
      <header className="fixed top-6 left-6 z-10 font-mono text-[11px] uppercase tracking-[0.32em] text-white/80 mix-blend-difference">
        experiments / grid
      </header>
      {status.kind !== "ready" && status.kind !== "pending" ? (
        <div role="alert" className="fixed inset-x-0 bottom-0 z-20 mx-auto m-6 max-w-2xl rounded-xl border border-amber-300/30 bg-black/70 p-4 text-sm leading-relaxed text-amber-100 backdrop-blur-md">
          <p className="mb-1 font-medium">{t("headline")}</p>
          <p className="text-amber-100/80">
            {status.kind === "unsupported"
              ? t("reasonUnavailable")
              : t("reasonInitFailed", { message: status.message })}{" "}
            {t("browserHint")}
          </p>
        </div>
      ) : null}
    </main>
  );
}
```

注意: header の "experiments / grid" は path slug の表示なので i18n 対象外（dot route も同じ扱い）。

### 4.8 `apps/web/src/app/[locale]/experiments/flow/client.tsx` (rewritten)

§4.7 と同形、`mountMotionFlowApp` / `MountFlowHandle` / "experiments / flow" 表示版。

### 4.9 `apps/web/src/app/sitemap.ts` (modified)

- `pages` array に `/experiments/grid` と `/experiments/flow` を priority 0.8 で追加（dot と同列）
- コメントブロック更新: 「Package 4 (Motion Works) re-added /experiments/grid and /experiments/flow after their destination clients were rebuilt on standalone mount entries」

### 4.10 `apps/web/messages/en.json` (modified, +6 行)

`experiments.works` 直後に `experiments.unsupported` を追加:
```json
"unsupported": {
  "headline": "This page renders a live WebGPU experience.",
  "reasonUnavailable": "WebGPU is not available in this browser.",
  "reasonInitFailed": "WebGPU initialization failed: {message}",
  "browserHint": "Please open in Chrome / Edge / Arc on macOS, Windows, or Android (latest). iOS Safari does not yet support WebGPU."
}
```

### 4.11 `apps/web/messages/ja.json` (modified, +6 行)

§4.10 の対訳:
```json
"unsupported": {
  "headline": "このページは WebGPU でリアルタイム描画を行います。",
  "reasonUnavailable": "このブラウザでは WebGPU を利用できません。",
  "reasonInitFailed": "WebGPU の初期化に失敗しました: {message}",
  "browserHint": "macOS / Windows / Android の最新版 Chrome / Edge / Arc で開いてください。iOS Safari は現時点で WebGPU 非対応です。"
}
```

---

## 5. 重要な技術的前提と判断

### 5.1 server component 化と `webgpu-motion-shell` の SSR 安全性

`apps/web/src/app/[locale]/experiments/{grid,flow}/page.tsx` を server component にしたとき、`./client.tsx` が server bundle にも参照される。`client.tsx` は `"use client"` 境界なので Next.js は client component として bundle 分離するが、import graph 解析のために `@chibatakumi/motion-grid` → `webgpu-motion-shell` → `gpu.ts` まで読まれる。

**確認済み**: `vendor/webgpu-motion-libs/packages/webgpu-motion-shell/src/gpu.ts` と `bootstrap.ts` ともに `navigator` / `document` 参照は関数本体内のみ（module top-level では参照しない）。よって SSR 安全。

`requireMotionAppElements` は `document.getElementById` を使うが、本パッケージでは使用していない（`mountMotion{Grid,Flow}App` は caller から canvas を受け取る）。

### 5.2 `dynamic({ ssr: false })` を外した理由

- Next.js 14+ App Router では server component で `dynamic({ ssr: false })` を呼べない
- `client.tsx` の WebGPU mount は `useEffect` 内で実行 → サーバ側では空 `<canvas>` のみ → `dynamic({ ssr: false })` は不要

### 5.3 grid/flow は audio なしでも visually alive

- **grid**: `DiscreteGridScene` は内部の state machine で hero word pattern を cycle (`update(dt)` ごとに進行)。`ELECTRIC_TICKER_CHARACTERS[snapshot.patternId]` が strikeFlag / glowMix / flickerIntensity / rgbSplitBump を駆動 → film post composite で動的な変調。
- **flow**: 7 scene を 12 s 間隔で auto-cycle。`createFlowlineSceneController` が 0.5 s blend window で滑らかに遷移。compute kernel は audio reactive params が 0 でも flow field を回し続ける。

### 5.4 ZERO_REACTIVE の構造

```ts
const ZERO_REACTIVE: GridReactiveState = {
  bass: 0, mid: 0, treble: 0, energy: 0, intensity: 0,
  bassOnset: 0, midOnset: 0, trebleOnset: 0, globalOnset: 0,
};
```

`GridReactiveState` は `bands ∪ onsets ∪ intensity`。`grid-block-pass.ts:49` で型定義。

### 5.5 FLOWLINE_AUDIO_DELTA_BUFFER の毎フレームリセット

`packages/motion-flow/src/audio/wiring.ts` で module-scoped const。ほかの caller がこのバッファを共有する未来に備えて、`mount.ts` 内で毎フレーム 0 にリセット（`for (const key of Object.keys(...) ...)`）。

### 5.6 dot canvas の共存

- root `[locale]/layout.tsx` の `MotionStageProvider` が `mountMotionDotApp` を呼び、canvas を `fixed inset-0 -z-10 pointer-events-none w-screen h-screen` で常時マウント
- grid/flow の route canvas は `fixed inset-0 z-0 h-screen w-screen`（不透明 film post 出力）
- 視覚的に dot は完全に隠れるが、GPU 上では dot loop も continue
- **将来の最適化**: layout に `useMotionStageVisibility(false)` のような hook を追加して experiments/{grid,flow} で dot loop を suspend できる。今回は scope 外。

### 5.7 i18n が `useTranslations` を使える理由

`[locale]/layout.tsx` で `<NextIntlClientProvider messages={messages}>` がツリーを wrap している（既存）。よって client component 内で `useTranslations("experiments.unsupported")` がそのまま動く。

---

## 6. 検証コマンドと結果

### 6.1 Placeholder scan

```bash
cd /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio
rg -n 'TODO\(Wave|future chat|Restoring after|placeholder|Wave 3' \
  'apps/web/src/app/[locale]/experiments/grid' \
  'apps/web/src/app/[locale]/experiments/flow' \
  apps/web/messages/en.json apps/web/messages/ja.json
```

**結果**: grid/flow ownership 内は **clean**。
- `apps/web/messages/en.json:333` の `premiumMediaPlaceholder` は Filmtone の文字列で対象外
- `apps/web/src/app/[locale]/experiments/page.tsx:23-24` の "placeholder" は index 内のコメント文（Core Content package の所有、Package 4 が触らない）

### 6.2 Package typecheck

```bash
apps/web/node_modules/.bin/tsc --noEmit -p packages/motion-grid/tsconfig.json
apps/web/node_modules/.bin/tsc --noEmit -p packages/motion-flow/tsconfig.json
```

**結果**: どちらも **0 errors / clean**。

### 6.3 apps/web typecheck

```bash
apps/web/node_modules/.bin/tsc --noEmit -p apps/web
```

**結果**: 1 error。
```
apps/web/src/features/interactive/film-lab/params-codec.test.ts(87,34): error TS2352:
  Conversion of type 'Record<string, unknown>' to type 'Params' may be a mistake...
```

これは **既知の Filmtone baseline error**。Package 4 の変更とは無関係。user prompt 明記:
> If apps/web tsc still fails only in the known Filmtone baseline, report it as unrelated and do not touch Filmtone internals.

→ 報告するだけで触らない、で対応済。

### 6.4 generateMetadata 存在確認

```bash
rg -n 'generateMetadata' 'apps/web/src/app/[locale]/experiments'
```

**結果**:
- `apps/web/src/app/[locale]/experiments/flow/page.tsx:9`
- `apps/web/src/app/[locale]/experiments/grid/page.tsx:9`
- `apps/web/src/app/[locale]/experiments/page.tsx:47` (既存、index 用)

全て揃っている。

---

## 7. レビュアー指摘 (P2) と対応

レビュアーから 2 件の P2 指摘が入り、両方とも本 chat で resolve 済。

### 7.1 P2.1 — sitemap pre-metadata

> `/experiments/grid` and `/experiments/flow` are back in the sitemap, but their route files are still client-only shells with no `generateMetadata`. ... these routes are not sitemap-ready yet even if the visuals are real.

**対応 (resolved)**:
- `grid/page.tsx`, `flow/page.tsx` を server component 化
- `generateMetadata` を export し canonical / alternates / openGraph / twitter を発行
- §4.5 / §4.6 / §5.1 / §5.2 参照

### 7.2 P2.2 — localized routes still hardcode English fallback UI

> `/[locale]/experiments/grid` is a localized public route, but its visible banner and header are hardcoded in English. ... Motion Works should not be marked closed until the unsupported/error surface is locale-aware.

**対応 (resolved)**:
- `experiments.unsupported.{headline, reasonUnavailable, reasonInitFailed, browserHint}` を en/ja に追加
- `client.tsx` で `useTranslations("experiments.unsupported")` 経由で表示
- `Status.unsupported` から `reason: string` を削除（i18n 層が文言を保有）
- §4.7 / §4.8 / §4.10 / §4.11 / §5.7 参照

### 7.3 レビュー後の判定（変更点）

レビュー前: `Motion Works closed` と `sitemap-ready` は強い、と指摘されていた。
レビュー後: P2 両方 resolve 済 → grid/flow は **sitemap-ready かつ Motion Works ledger 内の grid/flow 項目を closed と宣言可能**。

ただし Motion Works ledger 全体としての closed は別 package の dot parity / audio mic 等が残るため、**Motion Works ledger の grid 行と flow 行のみ closed**。

---

## 8. Ledger 更新

### 8.1 Director Reset Ledger §Motion Works Readiness の現状

```
- [ ] motion-dot visual parity verified            (← 別 chat / Stream 1 系)
- [x] motion-grid route is restored and non-placeholder    (Package 4 closed)
- [x] motion-flow route is restored and non-placeholder    (Package 4 closed)
- [/] /experiments index links to all three works  (index は既存で grid/flow を含む)
- [x] WebGPU unsupported state is explicit         (Package 4 で grid/flow 分は closed)
- [ ] audio/mic behavior is verified where applicable    (audio 未実装 = scope 外)
```

`[/]` は partial（既存実装で OK だが Package 4 自体は触らず、変更なしで通っている状態）。

### 8.2 Director の追記タスク（次の Director chat）

`docs/renewal-2026/director-reset-ledger-2026-04-26.md` の "Motion Works Readiness: Not Ready" セクションを再採点し、grid/flow が落ちた blocking facts を取り除く。例:

before:
> - dot route exists, but current implementation is under active remediation.
> - grid and flow are explicit placeholders.
> - `/experiments` cannot link to all three works because the index is missing.

after:
> - dot route exists, but current implementation is under active remediation.
> - grid and flow are now standalone WebGPU mounts (Package 4, 2026-04-26):
>   real visuals, locale-aware unsupported banner, route metadata, sitemap registered.
> - `/experiments` index already links all three works; no change needed.

---

## 9. Out of scope / 既知の follow-up

### 9.1 audio / HUD / keyboard cluster

オリジナル `motion-{grid,flow}-webgpu/src/main.ts` には AudioController / HUD / keyboard 入力 / mic / 音楽ファイルピッカー等が実装されている。Phase 1 では deferred。

**Phase A+1 で行う作業（別 package）**:
- `mountMotionGridApp({ enableAudio: true, enableHud: true })` のオプション拡張
- `motion-dot` パッケージの `audio-settings-button` / `hud` モジュールを参考に汎用化
- hero word pattern cycle / scene pinning の keyboard cluster 復活

### 9.2 dot canvas suspension

`MotionStageProvider` を grid/flow ルートで suspend する hook 追加。
- `apps/web/src/features/motion/MotionStageProvider.tsx` に `suspended: boolean` prop
- experiments/{grid,flow} の layout か client から `useMotionStageSuspension(true)` で発火
- 当 package では layout を触らない方針のため deferred

### 9.3 /experiments index の "preview" ラベル

`experiments/page.tsx` の `works.{grid,flow}.state = "preview"` のまま。Phase A+1 で audio + HUD が乗ったら `"active"` に昇格。今は **honest representation** として preview を維持。

### 9.4 /experiments/page.tsx 内コメントの stale 化

```
 * State of grid and flow is reported honestly as `preview` until their
 * destination clients are restored from placeholder by the Motion Works
 * package; the index itself is non-placeholder and complete.
```

Package 4 で「restored from placeholder」が達成されたため、この comment は今後に更新可能。Core Content package の所有なので Package 4 では触らず、別 chat で文言更新を推奨。

### 9.5 visual review / screenshot

外殻 QA は意図的に未実施（user 方針）。次に行うとき:
- chrome MCP で `/experiments/grid` と `/experiments/flow` を ja/en それぞれで開く
- スクリーンショット保存パス: `docs/renewal-2026/screenshots/2026-04-26-package-4-grid-{ja,en}.png` 等
- 確認項目: hero word pattern が cycle すること、flow が 7-scene を auto-cycle すること、unsupported banner の言語切替

### 9.6 Filmtone baseline error

`apps/web/src/features/interactive/film-lab/params-codec.test.ts:87` は別 chat / Filmtone owner の責任範囲。Package 4 で触らない。

---

## 10. 触ったファイル全リスト

新規 (4):
- `packages/motion-grid/src/mount.ts`
- `packages/motion-flow/src/mount.ts`
- `apps/web/src/app/[locale]/experiments/grid/page.tsx` (再生成 / server component 化)
- `apps/web/src/app/[locale]/experiments/flow/page.tsx` (再生成 / server component 化)

修正 (6):
- `packages/motion-grid/src/index.ts` (mount export 追加)
- `packages/motion-flow/src/index.ts` (mount export 追加)
- `apps/web/src/app/[locale]/experiments/grid/client.tsx` (real mount + i18n)
- `apps/web/src/app/[locale]/experiments/flow/client.tsx` (real mount + i18n)
- `apps/web/src/app/sitemap.ts` (grid/flow 再追加 + コメント更新)
- `apps/web/messages/en.json` (`experiments.unsupported.*` 追加)
- `apps/web/messages/ja.json` (`experiments.unsupported.*` 追加)

合計 11 file（1 file は重複カウント、実際は new 4 + modified 7 = 11）。

すべて Package 4 ownership 内。`packages/motion-dot/*`, `experiments/dot/*`, `AmbientHomeHero.tsx`, layout.tsx, MotionStageProvider.tsx, Filmtone, Photography, contact, journal, next.config.ts は **未変更**。

---

## 11. 別 chat 引き継ぎ用 verbatim プロンプト

以下を新 chat の最初のメッセージとして **そのままコピペ**。

---

````
/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md
/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/docs/renewal-2026/director-reset-ledger-2026-04-26.md
/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/docs/renewal-2026/package-4-motion-works-grid-flow-handoff-2026-04-26.md

上の 3 ドキュメントを必ず先に読んでください。3 つ目が今回最重要の引き継ぎドキュメントで、
- Package 4（Motion Works: Grid / Flow Placeholder Removal）の前 chat の実装内容
- 親 SSoT / Director Reset Ledger との関係
- 触ったファイル全リスト（new 4 + modified 7）
- 検証コマンド結果（motion-grid/motion-flow tsc clean、apps/web tsc は既知の Filmtone baseline 1 件のみ）
- レビュアー P2 指摘 2 件と resolve 内容（route metadata 追加 + i18n 化）
- Out of scope / Phase A+1 で行う follow-up
- ledger 更新指示
が完全に記述されています。

== 実装リポと作業ブランチ ==
- 実装リポ: /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio
- 作業ブランチ: feat/renewal-2026-phase2-motion-dot
- Package 4 の変更は working tree に landed 済み（uncommitted）
- 別 chat の作業も同 branch に多数 uncommitted で混在しています（git status を最初に取って Package 4 の変更を分類してください）

== 今回の依頼 ==
[ここに次にやってほしいことを書く。例:]
- 「Package 4 の差分だけ commit してください」
- 「Phase A+1: motion-grid に AudioController + HUD を再有効化してください」
- 「dot canvas の suspension hook を MotionStageProvider に追加してください」
- 「Director ledger の Motion Works ledger を Package 4 のクローズ反映で更新してください」
- 「次の Package（Core Content / Satellite / QA）に着手してください」

== 不変のルール（読まなくても守る）==
1. Package 4 ownership 外のファイル（packages/motion-dot/*, experiments/dot/*, AmbientHomeHero.tsx, layout.tsx, MotionStageProvider.tsx, Filmtone 内部, Photography, contact, journal, next.config.ts）は触らない。触る必要が出たら必ず宣言してから。
2. 親 SSoT §0.1 「Single-number completion is prohibited」「Page existence is not completion」を厳守。完了率では報告しない。ledger 単位で報告する。
3. silent fallback 禁止（feedback_no_fallback_bug_hotbed.md）。WebGPU 不可は明示バナー。
4. localized route の visible UI に hardcoded English を残さない（§4.1）。新規文字列は en.json + ja.json 両方に追加してから client で `useTranslations` で参照。
5. 自動 commit / push 禁止。ユーザー指示があるまで working tree のまま残す。
6. Filmtone baseline error (apps/web/src/features/interactive/film-lab/params-codec.test.ts:87) は触らない。Package 4 の変更とは無関係。

== 検証コマンドのテンプレート ==
作業後に必ず以下を実行し、結果を報告:
```
cd /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio
rg -n 'TODO\(Wave|future chat|Restoring after|placeholder|Wave 3' apps/web/src/app/[locale]/experiments apps/web/messages/en.json apps/web/messages/ja.json
apps/web/node_modules/.bin/tsc --noEmit -p packages/motion-grid/tsconfig.json
apps/web/node_modules/.bin/tsc --noEmit -p packages/motion-flow/tsconfig.json
apps/web/node_modules/.bin/tsc --noEmit -p apps/web
```

== 思考ルール ==
- 思考すべきところは必ず sequential-thinking で考える。
- わからないことがあれば gemini-search または web search で調査。記憶ベースの推測禁止。
- 並列に独立な操作があれば 1 message に複数 tool 呼び出しを並べて parallel 実行。
- 内部処理は英語、最終出力は日本語。
- 本質を最優先。外殻 QA は全部うまく行ったときの最終工程。

「Agent Teamsで」（4-5 並列に分解できる粒度なら使う。Package 4 規模では単一 chat で十分。）
````

---

## 12. 補足 — 本 chat で参照した主要ファイル一覧（読み込みショートカット）

新 chat で同じところを再読する際の高速 path:

- 親 SSoT: `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md`
- Director ledger: `docs/renewal-2026/director-reset-ledger-2026-04-26.md`
- 本ハンドオフ: `docs/renewal-2026/package-4-motion-works-grid-flow-handoff-2026-04-26.md`
- MotionStage host: `apps/web/src/features/motion/MotionStageProvider.tsx`
- root layout: `apps/web/src/app/[locale]/layout.tsx`
- experiments index: `apps/web/src/app/[locale]/experiments/page.tsx`
- experiments layout: `apps/web/src/app/[locale]/experiments/layout.tsx`
- dot route ref: `apps/web/src/app/[locale]/experiments/dot/{page,client}.tsx`
- dot mount entry: `packages/motion-dot/src/main.ts`
- grid mount entry (new): `packages/motion-grid/src/mount.ts`
- grid participant (legacy MotionStage 用): `packages/motion-grid/src/participant.ts`
- grid scene: `packages/motion-grid/src/scene/discrete-grid-scene.ts`
- grid render: `packages/motion-grid/src/render/grid-block-pass.ts`
- grid wiring: `packages/motion-grid/src/audio/wiring.ts`
- flow mount entry (new): `packages/motion-flow/src/mount.ts`
- flow participant (legacy MotionStage 用): `packages/motion-flow/src/participant.ts`
- flow compute: `packages/motion-flow/src/compute/flowline-compute.ts`
- flow render: `packages/motion-flow/src/render/ribbon-pass.ts`
- flow scene controller: `packages/motion-flow/src/scene/index.ts`
- shell: `vendor/webgpu-motion-libs/packages/webgpu-motion-shell/src/{gpu,loop,offscreen,bootstrap}.ts`
- audio bus: `vendor/webgpu-motion-libs/packages/webgpu-motion-audio/src/audio-bus.ts`
- film post: `vendor/webgpu-motion-libs/packages/webgpu-motion-post/src/`
- オリジナル grid main: `/Volumes/SamsungPortableSSDX5001/documents/life/output/motion-grid-guided-webgpu/src/main.ts`
- オリジナル flow main: `/Volumes/SamsungPortableSSDX5001/documents/life/output/motion-flowline-webgpu/src/main.ts`

---

## 13. 最終ステータス（一行サマリ）

**Package 4 = Motion Works: Grid / Flow Placeholder Removal は landed。`/experiments/grid` と `/experiments/flow` は本物の WebGPU visual を持ち、unsupported state は en/ja で明示、route metadata は canonical / alternates / openGraph / twitter を発行、sitemap に再登録、placeholder scan clean、motion-grid/motion-flow tsc clean、apps/web tsc は既知 Filmtone baseline 1 件のみ。次は dot suspend / audio + HUD 復活 / 別 package 進行のいずれか。**
