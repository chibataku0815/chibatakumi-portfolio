# Remotion AE Basic Transition Pack — Overlay Transition Pattern

## 結論

AE の basic transition を Remotion へ移植するときは、`Scene A -> Scene B` の切替として実装しない。  
**色レイヤーのトランジション自体を主役にし、最後は同形状の alpha-inverted exit matte で透明へ戻す**構成にする。

`Scene B` を下に置くと、wipe 途中で意図しないリークが出やすい。今回も radial wipe の不具合は timing ではなく **構成の誤り** が原因だった。

## AE 由来で残すべきレシピ

- 基本 wipe の進行時間は `25f`
- 色レイヤーの段差は `8f` offset
- easing は `Easy Ease` ベースで、速度感は `80%` 前後に寄せる
- exit は「最後のレイヤーを複製して matte に使う」発想を維持する
- diagonal / radial / trim-path / circle-scale は、shape は違っても timing grammar は揃える

## Remotion 実装パターン

- progress 計算は `lib/transition-progress.ts` に閉じ込める
- shape ごとの描画差分は `lib/TransitionBand.tsx` に分離する
- composition 本体は「preview plate + transition overlay + chrome」に寄せる
- variant export を前提に、`transitionId` と `easingId` を props 化する

この分離にすると、

- AE ライクな timing 調整
- easing 差し替え
- 単体 transition の量産レンダー

を `Composition.tsx` を太らせずに回せる。

## 今回の適用範囲

- `linear wipe (-90)`
- `linear wipe (-45)`
- `radial wipe / counter-clockwise`
- `trim paths / center-open`
- `circle scale wipe`

さらに `linear / ae-like / quint-out / expo-out` の 4 easing を掛け合わせ、単体 render を量産できるようにした。

## 検証パターン

- 型確認: `bun x tsc --noEmit -p tsconfig.json`
- pack render: `bun run render:64`
- variant batch render: `bun run render:64:variants`

出力先:

- `apps/remotion-motion-lab/out/64-ae-basic-transition-pack.mp4`
- `apps/remotion-motion-lab/out/64-ae-basic-transition-variants/`

## 関連

- commit `bc160ea`: Add AE basic transition pack variants
- 実装: `apps/remotion-motion-lab/src/compositions/64-ae-basic-transition-pack/`
