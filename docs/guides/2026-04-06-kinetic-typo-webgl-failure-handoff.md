# Kinetic Typography × Remotion + WebGL Failure Handoff

> 作成: 2026-04-06 JST  
> 状態: **現行 `16-kinetic-typo-webgl` は不採用**  
> 用途: 別チャットで完全に再開するための handoff / failure analysis / restart spec

## 最重要結論

今回作った `16-kinetic-typo-webgl` は、ユーザー要求を満たしていない。

- `15-filmtone-countdown` の motion grammar を再現していない
- 参考事例レベルの quality に達していない
- WebGL にした価値が明確に出ていない
- `Phase 3` / `Phase 4` は真の postprocess / shader pipeline として成立していない

したがって、**今の `16` は正本扱いしないこと**。  
改善ベースではなく、実質的には **Phase 1 から作り直し** の認識が正しい。

## 元の依頼の意図

ユーザーが求めていたのは、単なる比較デモではない。

正しい問いはこれ:

- `15-filmtone-countdown` の確立済み motion grammar を保ったまま
- WebGL (Three.js / R3F / @remotion/three) で
- Canvas 2D の限界をどこまで超えられるか
- 各 Phase ごとに判断可能な形で検証する

特に重要だったのは:

1. `15` の対応シーンを読み、Canvas 2D 実装を理解する
2. それを R3F コンポーネントとして再実装する
3. `bun run render:16` でレンダーする
4. `15` と `16` を比較する
5. 「Canvas 2D で十分」か「WebGL の価値がある」かを判定する

つまり、**同じ motion grammar を保った上での上位互換検証** が本質だった。

## 実行環境

- workspace root: `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/.worktrees/kinetic-typo-webgl-16`
- 元 repo: `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio`
- isolation: `git worktree`
- worktree branch: `wt/kinetic-typo-webgl-16`
- app: `apps/remotion-motion-lab`
- runtime: `bun`
- render backend: `--gl=angle`

## 参照予定だったが見つからなかった文書

ユーザーから最初に読むよう指定された文書は、作業時点のファイルシステム検索では見つからなかった。

見つからなかったもの:

- `docs/guides/2026-04-06-kinetic-typography-remotion-webgl-handoff.md`
- `.claude/knowledge/patterns/canvas2d-motion-vocabulary.md`
- `docs/guides/2026-04-06-template-repro-iter10-handoff.md`

そのため、今回は本来の handoff 文書ではなく、**コードを一次情報として作業**した。  
この前提欠落は最初の時点でリスクだった。

## 実際にやったこと

### 1. worktree を作成

実行:

```bash
git worktree add -b "wt/kinetic-typo-webgl-16" ".worktrees/kinetic-typo-webgl-16"
```

意図:

- 元 `main` の dirty 状態を汚さない
- `15` を壊さずに `16` を隔離して実験する

### 2. `remotion-motion-lab` の依存を worktree 側へ入れた

実行:

```bash
cd "/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/.worktrees/kinetic-typo-webgl-16/apps/remotion-motion-lab"
bun install
```

結果:

- `apps/remotion-motion-lab/node_modules/` が worktree 側に生成された
- `apps/remotion-motion-lab/bun.lock` が更新された

### 3. `16-kinetic-typo-webgl` を新規追加

追加したファイル:

- `apps/remotion-motion-lab/src/compositions/16-kinetic-typo-webgl/config.ts`
- `apps/remotion-motion-lab/src/compositions/16-kinetic-typo-webgl/KineticTypoWebgl.tsx`
- `apps/remotion-motion-lab/src/compositions/16-kinetic-typo-webgl/WebglScenes.tsx`

変更したファイル:

- `apps/remotion-motion-lab/src/Root.tsx`
- `apps/remotion-motion-lab/package.json`
- `.claude/tasks/ACTIVE-PARALLEL-TASK.md`

### 4. `render:16` を追加

追加した script:

```json
"render:16": "remotion render src/index.ts KineticTypoWebgl out/16-kinetic-typo-webgl.mp4 --gl=angle"
```

### 5. 型チェックとレンダーを実行

実行:

```bash
bunx tsc --noEmit
bun run render:16
```

still も生成:

```bash
bunx remotion still src/index.ts KineticTypoWebgl out/16-phase1-comparison.png --frame=42 --gl=angle
bunx remotion still src/index.ts KineticTypoWebgl out/16-phase2-comparison.png --frame=117 --gl=angle
bunx remotion still src/index.ts KineticTypoWebgl out/16-phase3-comparison.png --frame=192 --gl=angle
bunx remotion still src/index.ts KineticTypoWebgl out/16-phase4-comparison.png --frame=267 --gl=angle
```

## 現在の `16` の構造

今の `16` は、左右比較用の 4-phase composition になっている。

### `config.ts`

- `15` の `palette`, `labels`, `finale` を import
- 4 phase を各 75 frame に再構成
- total 300 frames
- representative still frame を固定

これはすでに問題で、**`15` の timing を再現していない**。

### `KineticTypoWebgl.tsx`

- `Sequence` で `phase1` ～ `phase4` を順番に再生
- 各 phase は `PhaseComparison` を呼ぶだけ

### `WebglScenes.tsx`

やっていることの実態は以下:

- 左: `CanvasScene` + `drawFinale` / `drawS1`
- 右: `ThreeCanvas` による WebGL panel
- `Phase 1`: `TextPlaneStack` で 2D 文字 texture を重ねて奥行き風に見せる
- `Phase 2`: `InstancedMesh` 128 粒を出そうとした
- `Phase 3`: `EffectComposer` を試したが split panel 条件で安定せず、最終的に DOM overlay 的 fallback を混ぜた
- `Phase 4`: `shaderMaterial` を使ったが、最終結果は強すぎる stripe になった

つまり、**本来あるべき「15 の挙動を忠実に WebGL へ移植したもの」ではなく、比較プレート付きの試作品**になっている。

## 生成物

生成済みファイル:

- `apps/remotion-motion-lab/out/16-kinetic-typo-webgl.mp4`
- `apps/remotion-motion-lab/out/16-phase1-comparison.png`
- `apps/remotion-motion-lab/out/16-phase2-comparison.png`
- `apps/remotion-motion-lab/out/16-phase3-comparison.png`
- `apps/remotion-motion-lab/out/16-phase4-comparison.png`

注意:

- `out/` はローカル検証用
- `node_modules/` も worktree ローカル
- **このまま commit 対象にしない**

## 何がダメだったか

### 一番大きい失敗

ユーザーが求めたもの:

- `15` と同じ運動言語
- 参考事例に見劣りしない quality
- WebGL でしか得られない価値

実際に作ったもの:

- 左右比較しやすい簡易デモ
- motion grammar が別物
- quality が低い
- 本物の postprocess / shader ではなく fallback 混じり

つまり、**問題設定を勝手に縮小した**。

### Phase 1 の問題

観察:

- 右 panel に `SEE IT / FIRST` は出る
- 多少の depth layering は見える
- しかし `15` の圧、入り方、レイアウト、タイミングが一致していない

失敗理由:

- `drawFinale` の frame-level motion を忠実に写していない
- `15` ではなく「似た雰囲気」の movement に置き換えた
- `DOF` ではなく `depth layering` 程度に留まった

ユーザー要求とのズレ:

- 「同じ motion grammar」になっていない

### Phase 2 の問題

観察:

- 右 panel では中央の `1` と薄い縦バー程度しか見えない
- still 上では burst がほぼ成立していない

失敗理由:

- `InstancedMesh` の視認性設計が弱い
- `drawS1` の画面全域 scatter を立体空間へ置き換える設計が甘い
- burst の広がり、構図、色の分布、カメラ距離が不十分

ユーザー要求とのズレ:

- `drawS1` を particle system にした価値が見えない

### Phase 3 の問題

観察:

- Phase 1 より少し「加工感」がある
- ただし、圧倒的な quality lift には見えない

失敗理由:

- `EffectComposer` を split panel で安定表示できず、途中で DOM overlay fallback を混ぜた
- そのため「postprocess の本当の強み」を見せる検証になっていない

ユーザー要求とのズレ:

- 「既存シーンに後がけで品質向上」の本命検証になっていない

### Phase 4 の問題

観察:

- 右 panel が stripe に支配され、元 scene を壊してしまう
- glitch というより表示破綻に見える

失敗理由:

- shader plane が強すぎる
- base scene を保持したままアクセントとして壊す設計になっていない

ユーザー要求とのズレ:

- 「カラーシフト / distortion の質感」ではなく、単に読みづらい画になった

## ユーザー評価

ユーザーから明確に以下の否定評価が出ている。

- 「全然同じ動きになってない」
- 「参考事例にも満たないクオリティ」
- 「比較用試作作るにしてもクオリティが低すぎる」

これは妥当であり、反論の余地はない。

## 現時点の正しい判断

今の `16` に対する正しい扱い:

- **採用しない**
- **正本にしない**
- **quality のたたき台としても弱い**
- ただし以下だけは残る
  - worktree
  - composition registration
  - `render:16`
  - 生成物パス
  - failure analysis

## 次チャットでの正しい再開方針

次は **Phase 1 だけに戻る** のが正しい。

### 再開順序

1. `15-filmtone-countdown/CanvasScenes.tsx` の `drawFinale` を読む
2. `15-filmtone-countdown/config.ts` の `finale`, `palette`, `timing`, `starts` を読む
3. `drawFinale` の frame-by-frame motion を文章ではなく数式レベルで抽出する
4. WebGL 側は **同じ timing / same x movement / same scale curve** を先に再現する
5. その後に WebGL 差分を **1 つだけ**足す
   - 候補: `Z depth`
   - その次: `DOF`
6. そこで初めて still / movie を比較する

### 触ってよいファイル

- `apps/remotion-motion-lab/src/compositions/16-kinetic-typo-webgl/*`
- `apps/remotion-motion-lab/src/Root.tsx`
- `apps/remotion-motion-lab/package.json`

### できるだけ触らないファイル

- `apps/remotion-motion-lab/src/compositions/15-filmtone-countdown/*`

理由:

- `15` は参照専用で残すのが前提
- 次の担当は `16` を作り直すべきで、`15` を改造すべきではない

## 再開時の受け入れ条件

次チャットでは最低でもこれを満たさない限り、`Phase 1 完了` と判断しないこと。

1. `16` の WebGL finale が、`15` の `drawFinale` と同じ timing で入る
2. line1 / line2 の位置変化が `15` と一致する
3. scale curve の印象が `15` と一致する
4. 見た瞬間に `15` の上位版だと分かる
5. 「比較用試作ですら弱い」と言われない minimum quality を超える
6. 追加した WebGL 要素が 1 つに絞られており、何が増えたか明確

## 禁止

- `15` と違う timing に再構成してごまかさない
- `左右比較しやすさ` を理由に motion grammar を変えない
- `postprocess っぽい見た目` の DOM overlay で本質を置き換えない
- `同じ動きになっていない` 状態で次 phase へ進まない
- 参考事例未満の quality のまま「検証完了」扱いしない

## 参考として残るファイル

- `apps/remotion-motion-lab/src/compositions/15-filmtone-countdown/CanvasScenes.tsx`
- `apps/remotion-motion-lab/src/compositions/15-filmtone-countdown/config.ts`
- `apps/remotion-motion-lab/src/compositions/08-three-ranking/ThreeRanking.tsx`
- `apps/remotion-motion-lab/src/compositions/02-travel-route/TravelRoute.tsx`
- `docs/guides/2026-04-01-filmtone-web-visual-parity-phase2-handoff.md`

## 実行コマンド

作業ルート:

```bash
cd "/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/.worktrees/kinetic-typo-webgl-16/apps/remotion-motion-lab"
```

型チェック:

```bash
bunx tsc --noEmit
```

動画レンダー:

```bash
bun run render:16
```

still 生成:

```bash
bunx remotion still src/index.ts KineticTypoWebgl out/16-phase1-comparison.png --frame=42 --gl=angle
bunx remotion still src/index.ts KineticTypoWebgl out/16-phase2-comparison.png --frame=117 --gl=angle
bunx remotion still src/index.ts KineticTypoWebgl out/16-phase3-comparison.png --frame=192 --gl=angle
bunx remotion still src/index.ts KineticTypoWebgl out/16-phase4-comparison.png --frame=267 --gl=angle
```

## 別チャット向け最終メモ

次の担当は、「今の `16` を直す人」ではなく、**Phase 1 を正しく作り直す人** として入るべき。

今の `16` から流用してよいものは:

- composition registration
- `render:16`
- worktree
- failure notes

今の `16` から流用しない方がよいもの:

- phase timing 再構成
- overlay fallback での quality 演出
- current shader glitch 見た目
- current particle burst 見た目

---

## 次チャット用・最高精度引き継ぎプロンプト

以下をそのまま新しいチャットに貼ること。

```text
worktree: /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/.worktrees/kinetic-typo-webgl-16

最初に必ず読んでください:
- docs/guides/2026-04-06-kinetic-typo-webgl-failure-handoff.md

今回の目的は、失敗した `16-kinetic-typo-webgl` を「改善」することではありません。
Phase 1 を最初から正しく作り直してください。

重要:
- 現在の `16` は不採用です。正本扱いしないでください。
- `15-filmtone-countdown` は参照専用で残し、変更しないでください。
- まず `drawFinale` を frame-level に読み解き、`15` と同じ motion grammar を WebGL 側で再現してください。
- その後に WebGL の追加価値を 1 つだけ足してください。最初の候補は `Z depth`、次が `DOF` です。
- 「比較用試作だから多少違ってよい」という判断は禁止です。
- 参考未満の quality のまま次 phase に進まないでください。

具体タスク:
1. `apps/remotion-motion-lab/src/compositions/15-filmtone-countdown/CanvasScenes.tsx` の `drawFinale` を読み、x移動、scale、timing、easing を抽出
2. `apps/remotion-motion-lab/src/compositions/15-filmtone-countdown/config.ts` の値と整合することを確認
3. `apps/remotion-motion-lab/src/compositions/16-kinetic-typo-webgl/` の Phase 1 を作り直す
4. `bunx tsc --noEmit` を通す
5. `bun run render:16` を実行
6. `bunx remotion still src/index.ts KineticTypoWebgl out/16-phase1-comparison.png --frame=42 --gl=angle` を実行
7. 左右比較で「同じ motion grammar か」「WebGL の価値が見えるか」を厳密に自己評価

受け入れ条件:
- `15` と同じ入り方に見える
- `SEE IT` / `FIRST` の相対位置と圧が維持されている
- WebGL 側だけに奥行きの気持ちよさが増えている
- 現在の失敗版より明確に上で、参考未満に見えない

禁止:
- `15` と違う timing に変える
- DOM overlay で postprocess の代用をする
- 低品質のまま Phase 2 に進む

必要なら、まずは Phase 1 だけで 1 render / 1 still に絞ってください。
```
