# Remotion AE Basic Transition Pack (2026-04-08)

## 概要

After Effects チュートリアル由来の 5 つの basic transition を、`apps/remotion-motion-lab` に `#64` として移植した。

単なる見た目コピーではなく、AE 側の作り方を Remotion で再利用できる primitive に分解し、さらに easing 差し替え付きの単体レンダーまで通した。

## 実装した内容

- `AEBasicTransitionPack` を追加
- `AEBasicTransitionVariant` を追加
- 5 transition を `TransitionBand` ベースの shape 差分へ分離
- progress / easing / offset 計算を `transition-progress.ts` へ分離
- `linear / ae-like / quint-out / expo-out` の easing variant を追加
- `render:64` と `render:64:variants` を追加
- batch render script `scripts/render-ae-basic-transition-variants.sh` を追加

## 途中で見つかった重要な修正

radial wipe の見え方が崩れた原因は、scene 切替タイミングではなく **構成自体** だった。

最初は `Scene B` を下に置いた transition として組んでいたため、wipe 途中で下の plate が見えてしまった。  
正しくは AE 元ネタ通り、**トランジションそのものをオーバーレイとして見せ、最後は同形状 matte で透明に戻す**構成にする必要があった。

## 変更ファイル

- `apps/remotion-motion-lab/src/compositions/64-ae-basic-transition-pack/Composition.tsx`
- `apps/remotion-motion-lab/src/compositions/64-ae-basic-transition-pack/config.ts`
- `apps/remotion-motion-lab/src/compositions/64-ae-basic-transition-pack/lib/TransitionBand.tsx`
- `apps/remotion-motion-lab/src/compositions/64-ae-basic-transition-pack/lib/transition-progress.ts`
- `apps/remotion-motion-lab/src/Root.tsx`
- `apps/remotion-motion-lab/package.json`
- `apps/remotion-motion-lab/scripts/render-ae-basic-transition-variants.sh`

## 検証

- `bun x tsc --noEmit -p tsconfig.json`
- `bun run render:64`
- `bun run render:64:variants`

出力:

- `apps/remotion-motion-lab/out/64-ae-basic-transition-pack.mp4`
- `apps/remotion-motion-lab/out/64-ae-basic-transition-variants/` に 20 本

## コミット

- `bc160ea` `Add AE basic transition pack variants`

## 再利用メモ

- AE レシピの核は `25f wipe + 8f stagger + same-shape exit matte`
- transition の下に別 scene を置くより、overlay transition として閉じた方が破綻しにくい
- batch render 前提なら `transitionId` / `easingId` props 化が先
