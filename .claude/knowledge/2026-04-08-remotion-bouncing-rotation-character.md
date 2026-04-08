# Remotion AE Bouncing Rotation Character — Stop-Driven Motion Pattern

## 結論

AE の「回転しながらバウンドするキャラクター」は、Remotion では 1 本の巨大な式にせず、**`frame/value/easing` の stop 列を部位ごとに分けて補間する**形にすると再利用しやすい。

今回の `#66` では、

- body の落下位置
- squash / stretch
- face の前面消失と背面出現
- trampoline board のたわみ

をすべて同じ stop 補間で扱えた。  
AE のキーフレーム思考をそのまま Remotion に移植するなら、この分解が一番破綻しにくい。

## 今回の実装で再利用できる粒度

- `sampleMotionStops`
  - AE 的な `Easy Ease` を含む stop 補間の共通 primitive
- `getCharacterMotion`
  - body / face / board をまとめて返す shot-specific motion resolver
- `getBoardPath`
  - 線の中央だけ沈める elastic path helper

このうち本当に汎用化しやすいのは `sampleMotionStops` 系で、`getCharacterMotion` はまだ `#66` 専用の意味論が多い。

## 追加で関数化できる処理

次に切り出すなら以下。

- `createBounceStops(...)`
  - `startY / landingY / contactFrame / loopFrames` から body 落下 stop を返す
- `createSquashStretchStops(...)`
  - `anticipation / contact / recovery` の値だけ渡して `scaleXStops / scaleYStops` を返す
- `createFacePassThroughStops(...)`
  - 前面 face が下に抜け、背面 face が上から戻る偽3D回転を共通化する
- `createElasticBoardStops(...)`
  - 接地後の減衰振動を `maxSag / settleFrames / damping` から生成する
- `getImpactShadow(...)`
  - 接地率から shadow scale / opacity を返す

これをやると、別キャラクターでも「AE 的な bouncing ball 派生」を preset 差し替えだけで流用できる。

## Remotion 側で守るべき構造

- `Composition.tsx` は描画に寄せる
- timing 計算は `lib/` に閉じ込める
- config は geometry / color / motion seed に限定する
- 調整対象は stop 配列に集める

この構造にすると、見た目調整が「JSX をいじる作業」ではなく「AE のキーフレームを写経して stop を詰める作業」に変わる。

## 今回の適用範囲

- `apps/remotion-motion-lab/src/compositions/66-ae-tip-bouncing-rotation-character/`
- `segmented-motion.ts` で補間
- `character-motion.ts` でショット固有の motion resolve
- `board-path.ts` で trampoline のたわみ形状を生成

## 検証

- `bunx tsc --noEmit`
- `bunx remotion still src/index.ts 66 AETipBouncingRotationCharacter out/stills/66-ae-tip-bouncing-rotation-character/frame-000.png --frame=0 --gl=angle`
- `bunx remotion still src/index.ts 66 AETipBouncingRotationCharacter out/stills/66-ae-tip-bouncing-rotation-character/frame-015.png --frame=15 --gl=angle`
- `bun run render:66`

## 関連

- commit `a2c40d1`: `feat(motion-lab): add bouncing rotation character study`
- 実装: `apps/remotion-motion-lab/src/compositions/66-ae-tip-bouncing-rotation-character/`
