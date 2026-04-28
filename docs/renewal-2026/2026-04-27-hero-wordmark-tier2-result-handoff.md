# Hero Wordmark Tier 2 — Result + Next-Session Handoff (2026-04-27 JST)

Created: 2026-04-27 JST
Repo: `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio`
Branch: `feat/renewal-2026-phase2-motion-dot`
Primary route under tuning: `http://localhost:3000/en/experiments/wordmark`

---

## TL;DR for the next chat

**ユーザの判定: 「ほぼ変化がない」 — Tier 2 は失敗。**

Tier 1 (display mode / palette / brand-spec tracking) は受け入れられたが、Tier 2 (per-pair kerning + procedural background shader) は視覚的にほぼ何も変わらなかった。技術実装は健全 (tsc/lint clean、Playwright pass) だが、**視覚的 delta がユーザの期待値に届かなかった**。

このドキュメントは、なぜ変化が見えなかったかの **技術的ルートコーズ** と、次セッションで採るべき **3 つの方向性** を提示する。Tier 1 / Tier 2 の実装は全てコミット済ファイルとして残っているので、巻き戻し or 上書きの判断もユーザに委ねる。

---

## Project orientation (read this first)

### Repo

- **Working dir**: `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio`
- **App**: `apps/web` (Next.js 16 App Router, Turbopack)
- **Branch**: `feat/renewal-2026-phase2-motion-dot` (Tier 1+2 の変更未 commit)
- **Package manager**: `bun`
- **Persistent dev server**: `next-server (v16.0.7)` PID 9823 on `:3000` — `lsof -nP -iTCP:3000 -sTCP:LISTEN` で生存確認

### 親プラン (long-term goal)

`/Users/chibatakumi/.claude/plans/image-1-mellow-gadget.md` — "Hero Typography Cinematic Wordmark Refactor", Path C (Hybrid SVG + Three.js)

7-step staged plan:
1. **Step 1 — geometry foundation** ← まだここ
2. Step 2 — `HeroWordmarkScene.tsx` 抽出 + AmbientHomeHero 統合
3. Step 3 — ScrollTrigger pinning + 3-stage progression (blueprint → assembling → committed)
4. Step 4 — AmbientHomeHero 差し替え
5. Step 5-7 — camera tilt / idle breath / reduced-motion / Playwright

Step 1 には Tier 1 / Tier 2 のような static-quality tuning が含まれる。**Tier 2 失敗 = Step 1 で消耗してる状態。** 戦略判断 (下記) が必要。

### Prior handoff documents

- `docs/renewal-2026/2026-04-27-hero-wordmark-tuning-handoff.md` — Tier 1 開始時のハンドオフ (Phase 1-3 の旅程 + Tier 1-3 lever 一覧)。読むべき。
- `/Users/chibatakumi/.claude/plans/docs-renewal-2026-2026-04-27-hero-wordma-synthetic-candle.md` — Tier 1 plan (実行済)
- `/Users/chibatakumi/.claude/plans/2026-04-27-hero-wordmark-tier2-kerning-bg.md` — Tier 2 plan (実行済 → 失敗)
- `.claude/tasks/ACTIVE-PARALLEL-TASK.md` — Tier 1 / Tier 2 完了記録

---

## Tier 1 の到達点 (locked, 受け入れ済)

ユーザは Tier 1 の結果を「悪くない、チューニングで完成度を上げたい」と判定 → Tier 2 に進んだ。

### 4 OFL fonts × brand lock + palette + tracking

| Font | Brand lock | Tracking | Palette |
|---|---|---|---|
| Jost 800 Italic | Supreme — Futura STD Heavy Oblique alt | 0.00em | raw (`#fff` on `#0e0e0e`) |
| Inter ExtraBold | Saint Laurent — Helvetica Neue Bold alt | +0.18em | mono (`#fafafa` on `#000`) |
| Hanken Grotesk Black Italic | HBA italic — Helvetica Neue Black Italic alt | +0.06em | warm (`#f0ede5` on `#0a0807`) |
| Bebas Neue Regular | Display-logo standard | +0.05em | mono (`#fafafa` on `#000`) |

### Tier 1 が追加した UI 機能 (`client.tsx`)

- `?font=jost|inter|hanken|bebas` URL param + ボタン切替
- `?mode=solid|wireframe|both` display mode toggle (default solid)
- `?frame=on|off` debug bounding box toggle (default off)
- `?palette=mono|warm|raw` palette toggle (font 割当 を上書き可能)
- caption に状態 1 行表示
- 画面左下に 4 行の積層トグル

### Tier 1 captures (キャプチャ参照用)

`output/playwright/2026-04-27-wordmark-{jost,inter,hanken,bebas}-{solid,wireframe}.png`
- 各 50KB 前後 (flat bg、grain noise なし)

---

## Tier 2 で実装したもの (技術的には全て動作)

### 1. Per-pair kerning override system (Lever 5)

- **`apps/web/src/features/hero/lib/wordmark-geometry.ts`**: `BuildWordmarkInput` に `kerningOverrides?: Record<string, number>` 追加。`getPathDataWithTracking` で `prevChar + char` ペアを構築し、override があれば `font.getKerningValue` を bypass。値は font-em units (例: `unitsPerEm = 1000` のフォントで `-40` = -0.04em の引き寄せ)。
- **`apps/web/src/app/[locale]/(portfolio)/experiments/wordmark/candidates.ts`**: 各 candidate に `kerningOverrides` 確定値:
  - Inter: `{ "TA": -40 }`
  - Hanken: `{ "TA": -50, "AK": -20 }`
  - Jost: `{ "MI": 15 }`
  - Bebas: `{}` (空 — condensed authored kerning が既に良好)

### 2. Procedural background shader (Lever 8)

- **`apps/web/src/app/[locale]/(portfolio)/experiments/wordmark/Background.tsx`** (新規): R3F の `<ScreenQuad>` (drei) + `<shaderMaterial>` で fullscreen procedural background。NDC 座標で camera 非依存。`depthWrite={false}` で wordmark 上に透過しない。
- **Shader 品質 (Stream 2 が template を超えて作り込んだ部分)**:
  - 3-tap decorrelated hash で 8bit precision banding 排除
  - 800px + 1400px 2-scale grain blend で sub-pixel film texture
  - 二乗 smoothstep (`v * v`) で cinematic vignette knee
  - aspect-corrected ellipse (`vec2(1.25, 1.0)` 補正) で 16:9 でも円形
  - cool-blue shadow tint (`vec3(0.88, 0.92, 1.0)` × 35% mix) で analog teal
  - `> 0.001` early skip で flat preset 時 GPU 負荷ゼロ
- **4 presets** (`BACKGROUND_PRESETS` in candidates.ts):
  - `flat`: vignette 0 / grain 0 / verticalBias 0 → 効果ゼロ
  - `vignette`: vignette 0.45 / grain 0 / verticalBias 0
  - `grain`: vignette 0 / grain 0.008 / verticalBias 0
  - `editorial`: vignette 0.30 / grain 0.005 / verticalBias 0.12 (合成)
- **per-font 割当**: Jost→flat / Inter→vignette / Hanken→editorial / Bebas→vignette

### 3. UI 拡張

- `?bg=flat|vignette|grain|editorial` URL param
- 5 行目 (top-most) のボタン行で bg 切替
- caption に `· bg ${type}` 追加

### 4. Playwright capture matrix

- 12 PNG: 4 fonts × {tier2-final, tier2-flatbg, tier2-wire}
- `output/playwright/2026-04-27-wordmark-{font}-tier2-{final|flatbg|wire}.png`

---

## なぜ「ほぼ変化がない」と感じたか — 技術的ルートコーズ

### 致命的問題 1: pure-black palette + 乗算 vignette = 不可視

**The shader does this:**
```glsl
color *= (1.0 - v);  // v = vignette amount, 0..0.45
```

**Inter (palette mono = `#000000`) の場合**:
- `color = vec3(0, 0, 0)`
- `color * (1 - 0.45) = vec3(0, 0, 0)`
- **結果: 何も変わらない**

Saint Laurent / display-logo (Bebas) の brand color が strict 純黒であるため、mono palette + vignette は **数学的に視覚効果ゼロ**。Stream C (Tier 1) の brand spec lock と Tier 2 の vignette が直接衝突した。

**file size 確認**:
- `inter-tier2-final.png`: 50KB (flat と同サイズ → 効果なし)
- `bebas-tier2-final.png`: 51KB (同上)
- `hanken-tier2-final.png`: **485KB** (warm palette `#0a0807` ベースで grain noise が乗っている → ファイルサイズが entropy で膨らむ → 効果あり)

つまり 4 fonts のうち **Hanken だけが Tier 2 の bg shader 効果を視覚的に得ている**。

### 致命的問題 2: kerning override の visual delta が hero scale で perceptual に小さい

font-em units で `-40` を移動させても、`unitsPerEm = 1000` のフォント + fontSize 700 (px ではないが render scale ~1) で約 28 px の移動。ブラウザでこれは "わかる人にはわかる" レベルで、**ロゴ全体の印象は変わらない**。

ロゴデザインの完成度は **大局のシルエット** で決まる。CHIBA / TAKUMI 全体がどう配置されているか、字間がどれだけ均等か、視覚的に "ブランド" として読めるか。1-2 ペアの 28px ずれは **ブランド感の絶対値** には影響しない。

### 致命的問題 3: 「ブランドワードマーク級」の最後の差は kerning でも背景でもない

Saint Laurent / HBA / Supreme が hero scale で持つ "完成度" の差は:
- Custom letterforms (per-glyph 微調整)
- Optical adjustment (round letters scale-up, triangular scale-down)
- Stylistic alternates (Inter cv01-cv12 等)
- **そして何よりロゴ単体ではなく context**: 周囲の余白、配置、動き、撮影、印刷物との関係

Tier 2 の per-pair kerning + procedural bg は **Tier 3 / Step 2-7 が本来担うべき領域** に対して "外殻パッチ" を当てた状態。

---

## 次セッションへの戦略選択肢 (3 paths)

ユーザは "本質の進行を最優先" を強調している。ロゴ単体の static tuning に追加投資する価値が下がっている。次の判断は以下のうちから:

### Path A: Tier 2 を救う (短期 fix、視覚効果を出す)

**目的**: 既存の Tier 2 実装を活かす方向で、視認可能な delta を出す。

**具体策**:
1. **mono palette を `#0a0a0a` に上げる** (Saint Laurent strict #000 から ~4% の妥協)。これで vignette が visible に。
2. **shader に bidirectional vignette を追加**: `color = mix(color * 1.05, color * (1.0 - v), v)` で center 微 brighten + corner darken。pure black でも見える。
3. **kerning 値を強める** (Inter TA -40 → -80, MI を再導入 +50)。

**Effort**: 30-60 min。1 chat で完結可。
**Risk**: ユーザの brand-loyal 判定に逆行する可能性 (Stream C の Tier 1 lock を緩める)。
**Outcome**: 視覚的 delta は出るが「本質」かどうかは別問題。

### Path B: Tier 2 を捨てて Step 2-3 に進む (推奨)

**目的**: ロゴ単体の static quality を打ち止めにして、**parent plan Step 2-3** に進む。`HeroWordmarkScene.tsx` を `AmbientHomeHero` に統合し、ScrollTrigger 駆動の 3-stage progression (blueprint → assembling → committed) を構築する。

**理由**:
- 「変化が見えない」のは **動きと文脈がないから**。動きがあれば 1 ペア 28px ずれでさえ "意図的な調整" として読める。
- Tier 3 (per-glyph optical / layout variations) は handoff §"Lever 10" で "Probably overkill" と本人が記述済。
- 親プラン Step 2-3 は **視覚的 transformation の本丸**。3-stage progression が動き始めれば、ロゴが "ブランドワードマーク" として読まれるかどうかが本物の文脈で評価できる。

**具体策**:
1. Step 2: `apps/web/src/features/hero/scenes/HeroWordmarkScene.tsx` を新規作成 (現 `Scene.tsx` を React component として再利用)。
2. `AmbientHomeHero.tsx` の `<h1>{site.author.name}</h1>` を `<HeroWordmarkScene>` に置換 (ただし font ロード待ちの skeleton を SVG fallback で持つ — handoff §"Untouched" 既定の `branding.wordmark` が使える)。
3. Step 3: GSAP ScrollTrigger で進行: scroll 0 → 0.3 で blueprint (wireframe), 0.3 → 0.7 で assembling (mesh fade-in + position settle), 0.7 → 1.0 で committed (frame OFF, palette mono lock)。

**Effort**: 2-3 chat sessions。Step 2 で 1 chat、Step 3 で 1 chat、Step 4-7 (camera tilt / idle / reduced-motion / Playwright) で 1 chat。
**Risk**: ScrollTrigger + R3F + 動的 font load の同期は罠が多い (handoff §⚠4 cold cache + §⚠6 dev server lock)。
**Outcome**: 親プランの本丸に進める。Tier 2 の Background shader は Step 3 の "committed" stage で活かせる (停止時の品質)。

### Path C: 全部巻き戻して別アプローチ (大きな再考)

**目的**: 現状実装 (Tier 1 + Tier 2) を全捨て or 凍結、AmbientHomeHero の現状 (`<h1>` + Tailwind clamp) のまま、**experimental ページのロゴ tuning から離れる**。

**理由**:
- Step 1 の static tuning に時間をかけすぎている。
- ユーザの本来の関心 (Cinematic-progressive 動的演出) からズレている。
- ロゴ単体は OFL font + tracking でほぼ "ブランド級" には到達しているとも取れる。

**具体策**:
1. `feat/renewal-2026-phase2-motion-dot` branch の Tier 1 + Tier 2 を 1 commit に纏めて凍結 (`feat(experiments/wordmark): static A/B/C/D framework with kerning + bg shader`)。
2. AmbientHomeHero は **触らない**。現在の SVG `branding.wordmark` (Geist) が production で十分機能している。
3. 別の renewal 課題に着手 (`docs/renewal-2026/` に他の handoff が複数ある: liquid-glass / journal / motion-dot 等)。

**Effort**: 30 min (commit + 凍結)。
**Risk**: 親プランが宙ぶらりんに。後で再開する場合のコンテキストロスト。
**Outcome**: ユーザがロゴ以外の課題に集中できる。

---

## 推奨: **Path B** (Step 2 へ進む)

「ほぼ変化がない」を引き起こした原因は **static delta が perceptual に小さい** こと。これを解くのは追加 tuning ではなく **動きと文脈**。Step 2-3 で初めて hero wordmark が "evolving brand mark" として機能する。

加えて、Path A の mono palette 緩和は brand lock を破る "退却"、Path C の凍結は親プランの放棄。Path B が **本質の進行** に最も合致。

ただし最終判断はユーザ。次チャット冒頭で 3 path を提示して選んでもらうこと。

---

## 現在のファイル構成 (Tier 1 + Tier 2 適用後)

### `/experiments/wordmark` 配下

```
apps/web/src/app/[locale]/(portfolio)/experiments/wordmark/
├── page.tsx           — Server shell (10 lines)
├── client.tsx         — Controller (URL params, useState×4, 5-row UI)
├── Scene.tsx          — Scene + FrameBox + FittedOrthographicCamera + display mode 分岐
├── Background.tsx     — ScreenQuad shaderMaterial + 4 presets (Tier 2)
└── candidates.ts      — Candidate[] + Palette + BackgroundType + PALETTES + BACKGROUND_PRESETS
```

### Geometry library (`apps/web/src/features/hero/lib/`)

```
├── wordmark-geometry.ts  — buildWordmarkLayers (tracking + kerningOverrides)
└── use-font.ts           — module-level Promise cache, React 19 idiom
```

### Playwright spec

```
apps/web/e2e/wordmark-geometry-test.spec.ts
  — Tier 2 capture matrix: 4 fonts × {final, flatbg, wire} = 12 PNGs
```

### Bundled fonts (OFL)

```
apps/web/public/fonts/
├── Jost-800-HevyItalic.otf     (40KB)
├── Inter-ExtraBold.woff        (31KB)
├── HankenGrotesk-BlackItalic.woff (18KB)
├── BebasNeue-Regular.ttf       (61KB)
└── LICENSE-{Jost,Inter,HankenGrotesk,BebasNeue}.txt
```

### Untouched (重要 — 触らない理由)

| Path | 理由 |
|---|---|
| `apps/web/src/shared/data/portfolio.ts` `branding.wordmark` | Nav.tsx + BrandWordmark.tsx (chrome) が consume。Hero と意図的に diverge。**置換禁止** |
| `apps/web/src/features/hero/components/AmbientHomeHero.tsx` | Step 4 統合先。現状 `<h1>{site.author.name}</h1>` + Tailwind clamp。Step 2-3 完了まで **触らない** |
| `apps/web/scripts/{extract-glyphs,modify-glyphs,build-wordmark}.ts` | Geist 由来の chrome wordmark build pipeline。out of scope |
| `apps/web/src/features/scroll-manager/hooks/useSectionSnap.ts` | Step 3 で `home-hero-wordmark` を array に追加するが、まだ |

---

## 制約 (handoff §⚠1-§8 を全て carry forward)

1. **`THREE.DoubleSide` 必須** — `wordmark-geometry.ts` の `geom.scale(1, -1, 1)` が triangle winding を invert。Default `THREE.FrontSide` だと canvas が **無音で blank**。Scene.tsx の全 `meshBasicMaterial` に `side={THREE.DoubleSide}`。Background.tsx の ScreenQuad は対象外 (NDC で正面、backface culling 関係なし)。

2. **`branding.wordmark` (Geist) は production 維持**。Hero 分岐 (Jost/Inter/Hanken/Bebas) は意図的。

3. **WOFF2 は opentype.js 1.3.4 で parse 不可**。OTF / TTF / WOFF (v1) のみ。Google Fonts CSS URL は modern browser で WOFF2 を返すので使うな。

4. **`useFont` の cold cache 200-500ms**。Playwright は **2500ms 待機必須**。

5. **`?font=` query param は canonical**。削除禁止。`?mode` `?frame` `?palette` `?bg` も同様 (Tier 1 + 2 で追加)。

6. **Dev server lock 競合**。`bun run dev` 二重起動で `.next/dev/lock` がブロック。PID 9823 の生存を `lsof -nP -iTCP:3000 -sTCP:LISTEN` で確認。

7. **Playwright headless dev artifact** (Next.js DevTools "1 Issue" badge / WebGPU error overlay)。spec が `[motion-dot]` / `WebGPU` を console error filter で除外済。本コードのバグではない。

8. **React 19 lint**: `react-hooks/set-state-in-effect` / `react-hooks/immutability` 違反禁止。`use-font.ts` は React 19 "derive state during render" idiom で URL 切替時の reset を実装。`OrthographicCamera makeDefault zoom={...}` は drei declarative (mutating `camera.zoom = ...` は禁止)。

9. **kerning override 単位**: font-em units (`unitsPerEm` 基準)、px ではない。`getKerningValue` 戻り値と同じ単位。

10. **shader uniforms の安定化**: `useMemo` で uniforms オブジェクトを cache、頻繁な再生成を避ける (Background.tsx 既に実装済)。

11. **vignette 数学的制約** (新): 乗算 darkening は pure black に効果なし。次セッションで mono palette を引き上げるか shader に bidirectional lift を追加するかの判断必要。

12. **kerning perceptual scale** (新): hero scale (fontSize 700-900) でも 1-2 ペアの override は全体印象に影響しない。kerning は polish step、core impression は tracking + letterform で決まる。

---

## Verification commands

```bash
cd /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/web

# 1. 健全性
bunx tsc --noEmit 2>&1 | grep -iE 'wordmark|candidates|Scene|Background|wordmark-geometry'   # 空 = OK
bun run lint 2>&1 | grep -iE 'wordmark/(client|page|Scene|candidates|Background)|hero/lib/wordmark-geometry|wordmark-geometry-test'  # 空 = OK

# 2. dev server
lsof -nP -iTCP:3000 -sTCP:LISTEN

# 3. 12-PNG capture を再生成
bunx playwright test e2e/wordmark-geometry-test.spec.ts --reporter=list

# 4. ブラウザで眼視 — Tier 2 final
open "http://localhost:3000/en/experiments/wordmark?font=jost&mode=solid&frame=off"      # bg=flat (font 割当)
open "http://localhost:3000/en/experiments/wordmark?font=inter&mode=solid&frame=off"     # bg=vignette (mono palette = ほぼ不可視)
open "http://localhost:3000/en/experiments/wordmark?font=hanken&mode=solid&frame=off"    # bg=editorial (warm palette = 唯一 visible)
open "http://localhost:3000/en/experiments/wordmark?font=bebas&mode=solid&frame=off"     # bg=vignette (mono palette = ほぼ不可視)

# 5. ブラウザで眼視 — Tier 2 with bg override (mono palette でも grain は見える)
open "http://localhost:3000/en/experiments/wordmark?font=inter&mode=solid&frame=off&bg=editorial"
open "http://localhost:3000/en/experiments/wordmark?font=inter&mode=solid&frame=off&bg=grain"

# 6. kerning effect 比較 (wireframe で geometry で見える)
open "http://localhost:3000/en/experiments/wordmark?font=inter&mode=wireframe&frame=off&bg=flat"
# vs Tier 1 baseline
open /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/output/playwright/2026-04-27-wordmark-inter-wireframe.png
```

---

## Decisions for the next chat to ask the user

1. **Path A / B / C のどれか?** (推奨は B = Step 2 へ進む)
2. **Path A の場合**: mono palette 緩和 (`#000` → `#0a0a0a`) は許容するか? それとも bidirectional vignette で shader 側で解決するか?
3. **Path C の場合**: Tier 1 + Tier 2 の commit を 1 つに纏めるか分割するか?
4. **未 commit な変更**: ユーザ自身でレビューしてから commit したいか、orchestrator が代行してよいか?

---

## ユーザの性格メモ (前 handoff から carry)

- **iterating fast and decisively**: "やり直し" = undo and try a different direction; "悪くない" = acceptable but not done; "ほぼ変化がない" (今回) = **strong negative — what I tried did NOT work, change strategy**
- **prioritizes design over conservatism**: 保守的な提案は嫌う
- **dislikes excessive confirmation**: AskUserQuestion を乱発しない
- **software engineer + photographer**: コードレベルは理解。デザインレベルの reasoning を説明する
- **reads memory and CLAUDE.md**: auto-memory + project CLAUDE.md は次セッションでも自動 load される
- **EN/JP fluent**: 最終出力は日本語、内部は英語で token 効率
- **expects parallel/efficient tool use**: 独立操作は 1 message で batch

---

## Closing notes

Tier 2 の失敗は技術的失敗ではない。**Stream B/C/D は cleanly に書け、 Stream 2 は GLSL shader を template 以上に作り込んだ**。問題は **問いの選択** だった。"per-pair kerning と procedural bg を足せば完成度が上がる" という前提自体が、ロゴデザインの完成度がそれらでは決まらないという現実と衝突した。

次セッションは **何を tune するか** ではなく **何を始めるか** の問いから出発すること。Step 2-3 が、ロゴが "evolving" として機能する文脈を初めて与える。Tier 2 の Background shader (vignette / grain / editorial) は Step 3 の "committed" stage の停止時 quality に流用できるので、無駄にはならない。

Good luck — and don't try to "fix" Tier 2. Move forward.
