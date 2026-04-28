# Hanken Geometric Construction Method — Hero Wordmark Core (2026-04-27 JST)

Created: 2026-04-27 JST
Repo: `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio`
Base font: **Hanken Grotesk Black Italic**
Target: `CHIBA TAKUMI`

---

## TL;DR

次の本質検証は、Hanken をそのまま組むことでも、完全な手書きロゴを作ることでもない。

やることは **font-derived geometric reconstruction**。

Hanken を下敷きにして、字形の骨格・比率・重心・傾き・カウンターを読み取り、それを grid / circle / tangent / rectangle / diagonal rule に変換して `CHIBA TAKUMI` 専用の構築ルールとして再生成する。

この方式で見たいものは「きれいなグリッド」ではなく、**フォント由来の見た目が、Takumi 専用の構築原理へ変換されたか**。

---

## Why This Exists

Tier 2 の kerning / background shader は失敗した。理由は、文字の外側を整えただけで、ロゴタイプの核である letterform construction に触れていなかったから。

添付された VITRAPEC / Braun / Dikel / Colorado 系の参照に共通するのは、フリーハンド感ではなく、**既存タイポグラフィを幾何技法で再記述する態度**である。

したがって、次に進めるべき問いはこれ:

> Hanken の italic grotesk を下敷きにしたとき、CHIBA TAKUMI 専用の幾何構築ルールを見つけられるか。

---

## Non-Goals

今やらないこと:

- playground UI
- slider
- variant grid
- WebGPU material
- ScrollTrigger hero integration
- export pipeline
- visual regression / QA
- library comparison
- paid font exploration

これらは、constructed wordmark に進む価値が見えてからでよい。

---

## Core Principle

### 1. Font Is the Scaffold, Not the Output

Hanken は完成品ではなく、計測対象。

見るもの:

- cap height
- stem width
- italic angle
- round glyph radius
- counter ratio
- terminal direction
- diagonal angle
- glyph width rhythm
- CHIBA / TAKUMI の word gap

そのままアウトラインを使うのではなく、Hanken の構造を **unit と primitive に翻訳する**。

### 2. Grid Is a Constraint, Not Decoration

construction grid は後付けの見せ場ではない。

グリッドの役割:

- baseline / cap line を固定する
- stem center を固定する
- circle center / radius を固定する
- diagonal の交点を固定する
- terminal cut の角度を固定する
- counter の比率を固定する

ガイド線が多いほど良いわけではない。wordmark では全ハンドルを見せると判断が濁る。必要なのは、字形の決定に使った線だけ。

### 3. Rebuild, Do Not Trace

トレースは Hanken のコピーになる。

再構築はこうする:

1. Hanken outline を薄く置く
2. 主要点を読む
3. grid unit に丸める
4. circle / rect / tangent / diagonal で置き換える
5. Hanken から意図的に外れた箇所を記録する

ロゴタイプの固有性は、この「意図的に外れた箇所」に出る。

---

## Hanken-Specific Reconstruction Hypothesis

Hanken Grotesk Black Italic の良さは、heavy grotesk の強さと italic の運動感にある。これを消さない。

ただし Hanken のままだと「整った文字」に留まるため、以下を構築ルールに変換する。

### Global DNA

初期仮説:

- `u`: 基本単位
- `capHeight`: `8u`
- `stroke`: `1.35u`
- `italicAngle`: Hanken 由来。ただし全 diagonal と terminal cut に共有する
- `roundRadius`: C / B / U の外周に共有
- `counterRatio`: B / A / U に共有
- `terminal`: flat ではなく、italic direction と同期した cut
- `wordGap`: font space ではなく lockup gap として定義

### C

Hanken の C は、そのままだとフォントの丸さが残る。

再構築では:

- outer radius と inner radius を unit 化する
- 開口部の terminal を italic angle に合わせて cut する
- terminal の上下位置を cap/baseline に吸着させず、光学的に少し内側へ入れる

見る点:

- C が単なる円弧ではなく、CHIBA の入口として働くか
- cut terminal が Hanken italic の速度を引き継ぐか

### H

H は構築ルールの anchor。

再構築では:

- left/right stem を `stroke` で固定
- crossbar height を capHeight の中央ではなく、Hanken の重心に合わせて少し下げる
- italic shear を stem に反映するか、直立 stem + diagonal terminals にするかを判断する

見る点:

- H が以降の I / B / A の stem rhythm を決めているか

### I

I は幅の基準。

再構築では:

- H stem と同じ stroke
- glyph width は最小化し、word rhythm の spacer として扱う
- terminal cut を入れる場合は上下で同一角度にする

見る点:

- I が弱い棒ではなく、CHIBA の圧縮点として機能するか

### B

B は最重要。ここでフォント感が残るか、ロゴ感に変わるかが決まる。

再構築では:

- vertical stem は H と同じ
- upper bowl / lower bowl を同一 radius で作るか、下だけ大きくするかを決める
- counter は Hanken 由来の自然曲線ではなく、円弧 + rect の合成に置換する
- center joint は滑らかにせず、構築上の接点として見せる

見る点:

- B が「フォントの B」ではなく、system の中で生成された B に見えるか

### A

A は CHIBA の終端であり、TAKUMI の A と再利用される shared glyph。

再構築では:

- left/right diagonal を `italicAngle` と関係づける
- apex を尖らせるか、flat/chamfer にするか決める
- counter triangle は自由形ではなく、diagonal intersection から導く
- crossbar は H の crossbar と高さ関係を持つ

見る点:

- A が Hanken の A から離れ、TAKUMI の K / M と同じ斜線 system に接続できるか

---

## Construction Procedure

最初の proof は UI なしでよい。

### Step 1 — Hanken Baseline

`CHIBA` を Hanken Black Italic で薄く表示する。

目的:

- trace するためではなく、計測するため
- final shape とのズレを見るため

### Step 2 — Guide Extraction

必要な guide だけ作る。

- baseline
- cap line
- stem left/right
- glyph advance columns
- C/B radius circles
- A diagonal lines
- shared italic angle lines

### Step 3 — Primitive Reconstruction

`C H I B A` を以下だけで再構築する。

- rect
- circle / arc
- line
- tangent
- polygon
- subtractive counter

Bezier は最後の手段。最初から Hanken の曲線を追わない。

### Step 4 — Intentional Deviations

Hanken と違う箇所を必ず記録する。

例:

- C terminal is cut at shared italic angle
- B counters share one radius system
- A apex is chamfered to avoid generic grotesk feel
- word rhythm uses lockup gap, not font space

この deviations がロゴの DNA になる。

### Step 5 — Decision

判定は 1 つだけ。

> Hanken よりも、CHIBA 専用の構築物に見えるか。

見えなければ、この construction rule は捨てる。見えれば TAKUMI へ進む。

---

## What To Capture In The First Proof

1 枚の画面に以下を並べる。

- left: Hanken baseline
- center: Hanken + construction guides overlay
- right: reconstructed CHIBA only

必要なら 2 行目に solid-only を置く。

この時点で controls は不要。判断したいのは interactivity ではなく、**構築原理が見えるか**。

---

## Reference Notes

- Wordmark construction grids should avoid exposing every handle; selective guide lines keep typography readable. See Akrivi's wordmark grid discussion: https://www.akrivi.io/learn/construction-grid-wordmark-gridit
- Logo grids and construction guides are useful when they create balance and constraint, but the final mark matters more than the grid presentation. See Creative Bloq's logo grid overview: https://www.creativebloq.com/logo-design/6-tips-using-grids-logo-design-11513984
- Parametric type design has a real lineage through Metafont / MetaPost: glyphs can be described through geometric and algebraic parameters rather than edited as arbitrary outlines. See the parametric type design paper: https://arxiv.org/abs/2502.07386
- Braun is a useful precedent because its identity is not generic type styling; the raised A and later exact arc treatment turned a word into a constructed mark. Background references: https://en.wikipedia.org/wiki/Braun_(company), https://de.wikipedia.org/wiki/Braun_(Elektroger%C3%A4te)

---

## Next Action

Create the first static proof:

`Hanken baseline → selective guides → reconstructed CHIBA`

No slider. No WebGPU. No QA. No variants.

