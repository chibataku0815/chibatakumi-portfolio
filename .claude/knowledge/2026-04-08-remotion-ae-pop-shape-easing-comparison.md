# Remotion AE Pop Shape Easing Comparison — Function Extraction Pattern

## 結論

AE チュートリアルを Remotion に移植するときは、`shape の見た目` と `easing 比較 UI` と `scene ごとの variant 定義` を分ける。

`#65` では shape 自体の描画は `lib/primitives.tsx` に寄せられている。次に効くのは、`Composition.tsx` に残っている `比較カードを3枚並べる責務` を config-driven に落とすこと。

## 今回の実装で再利用できる層

- `getSceneFrame`
  scene の可視範囲判定を共通化する最小 primitive。
- `getTrimStrokeWindow`
  draw -> hold -> erase の trim-path window を純関数で持てる。
- `RadialTrimBurst`
  AE の trim paths + repeater 系を Remotion 上で再利用する主力 primitive。
- `ExpandingOutline`
  scale + stroke shrink のような outline 系を独立コンポーネント化できている。
- `StaggeredSpokeChain`
  parented / staggered layer chain を 1 つの関数コンポーネントに閉じ込められている。

この分離により、shape variation を増やしても easing 比較ロジックまで巻き込まずに済む。

## 次に関数化すべき処理

### 1. Comparison card row

`Composition.tsx` では各 scene が

- progress を 3 回計算
- `ComparisonCard` を 3 回並べる
- easing 差分だけ props を差し替える

という同型パターンを繰り返している。

ここは `variants` 配列を受け取る `MotionComparisonRow` に落とせる。

保持したい責務:

- card label / note / accent color
- progress sampler
- shape renderer

### 2. Easing variant definition

`EffectOneScene`、`EffectTwoScene`、`EffectThreeScene` は JSX で直接 variant を書いているが、本質は data である。

例えば scene ごとに

- `label`
- `note`
- `accentColor`
- `drawEase`
- `eraseEase`
- `scaleProfile`
- `strokeProfile`
- `progressLabel`

を配列化すると、AE study を追加するときに `shape を差し替えるだけ` で済む。

### 3. Progress meter sampling

`sampleProgress` は `Composition.tsx` 内のローカル関数だが、これは comparison UI 全体で再利用できる。

- `sampleEasedProgress(localFrame, startFrame, durationFrames, easing)`
- `sampleProfileProgress(localFrame, startFrame, profile)`

の 2 系統に分けると、`canvas-easing` と `premium-motion-primitives` の両方を同じ UI で比較しやすい。

### 4. Stage chrome

`SceneChrome` と `BaseStage` も `65` 専用に閉じているが、AE study 系の composition を量産するなら shared 化できる。

特に

- dark grid background
- center guides
- title / note chrome
- comparison card layout

は `motion-study-tools` のような shared layer に寄せる価値がある。

## 実務上の判断

今すぐ効果が高い順番は次の通り。

1. `ComparisonCard x 3` の row abstraction
2. scene variant の config 化
3. progress sampler の shared utility 化
4. stage chrome の shared component 化

逆に、`RadialTrimBurst` と `ExpandingOutline` はすでに十分に関数化できているので、先に再分解しすぎない方がよい。

## 関連

- commit `20ae52c`: Add AE pop shape easing comparison study
- 実装: `apps/remotion-motion-lab/src/compositions/65-ae-tip-pop-shape-effects/`
