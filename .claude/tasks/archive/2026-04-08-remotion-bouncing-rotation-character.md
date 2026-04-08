# Remotion AE Bouncing Rotation Character (2026-04-08)

## 概要

After Effects チュートリアル由来の「回転しながらバウンドするキャラクター」を、`apps/remotion-motion-lab` に `#66` として移植した。

見た目の再現だけでなく、AE 側のキーフレーム列を Remotion で再利用できるよう、position / squash-stretch / face pass-through / board sag を stop 補間へ分解した。

## 実装した内容

- `AETipBouncingRotationCharacter` を追加
- `config.ts` に geometry / color / motion seed を分離
- `segmented-motion.ts` に AE 風 easing 付き stop 補間を実装
- `character-motion.ts` に body / face / board の motion resolve を実装
- `board-path.ts` に trampoline のたわみ path を実装
- `render:66` を追加

## 重要な知見

AE の bouncing ball 系は、Remotion で無理に物理式へ寄せるより **stop-driven motion** として扱う方が再現しやすい。

特に今回の 3D っぽい顔回転は、Z 回転を本当に作るのではなく、

- 前面 face を下方向へ抜けさせる
- 背面 face を上方向から戻す
- body 側の mask / overflow で見切る

という 2D レイヤー操作で十分成立した。

## 変更ファイル

- `apps/remotion-motion-lab/src/compositions/66-ae-tip-bouncing-rotation-character/Composition.tsx`
- `apps/remotion-motion-lab/src/compositions/66-ae-tip-bouncing-rotation-character/config.ts`
- `apps/remotion-motion-lab/src/compositions/66-ae-tip-bouncing-rotation-character/lib/board-path.ts`
- `apps/remotion-motion-lab/src/compositions/66-ae-tip-bouncing-rotation-character/lib/character-motion.ts`
- `apps/remotion-motion-lab/src/compositions/66-ae-tip-bouncing-rotation-character/lib/segmented-motion.ts`
- `apps/remotion-motion-lab/src/Root.tsx`
- `apps/remotion-motion-lab/package.json`

## 検証

- `bunx tsc --noEmit`
- `bunx remotion still ... --frame=0`
- `bunx remotion still ... --frame=15`
- `bunx remotion still ... --frame=29`
- `bun run render:66`

出力:

- `apps/remotion-motion-lab/out/66-ae-tip-bouncing-rotation-character.mp4`
- `apps/remotion-motion-lab/out/stills/66-ae-tip-bouncing-rotation-character/`

## コミット

- `a2c40d1` `feat(motion-lab): add bouncing rotation character study`

## 再利用メモ

- AE のキーフレームは `MotionStop[]` に写す
- drawing と timing を分離する
- 偽3D回転は front/back layer pass-through で組む
- 接地面の変形は path generator と減衰 stop を分ける
