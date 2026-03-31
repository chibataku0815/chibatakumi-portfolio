# WebCodecs Export: Color Space Fix + PBO Readback Pattern

## 問題

WebCodecs (VideoDecoder → Canvas 2D drawImage → CanvasTexture) による動画エクスポートで、
HTMLVideoElement パスと比較して**出力が大幅に暗化**する。

## 根本原因

macOS ANGLE/Metal バックエンドでの **sRGB→linear 二重変換**。

```
VideoFrame → canvas.drawImage(videoFrame) → Canvas 2D (sRGB)
                                              ↓
                              macOS では既に linear 化された値が格納される
                                              ↓
                        Three.js CanvasTexture (colorSpace=SRGBColorSpace)
                                              ↓
                        GPU が SRGB8_ALPHA8 で再度 sRGB→linear デコード ← 二重適用
                                              ↓
                                          暗化した出力
```

HTMLVideoElement パスでは Chrome が video → GPU テクスチャを単一パスで処理するため問題なし。

## 修正

```typescript
// NG: 二重変換で暗化
texture.colorSpace = THREE.SRGBColorSpace;

// OK: Canvas 2D が既に linear 化しているため、追加デコードをスキップ
texture.colorSpace = THREE.LinearSRGBColorSpace;
```

## PBO Readback パターン

### fenceSync プローブ

macOS ANGLE/Metal では `gl.clientWaitSync()` が `WAIT_FAILED` を返す。
起動時にダミーの fenceSync でプローブし、3段階にフォールバックする:

```
Path A: PBO double-buffer + fenceSync (非同期 DMA overlap) — Linux/Windows
Path B: single PBO + gl.finish() (pinned memory memcpy)    — macOS ANGLE/Metal
Path C: sync readPixels (フォールバック)                     — PBO 非対応環境
```

### CPU Y-flip 排除

`flipRgbaVerticalInto()` (行単位コピー 0.3ms/frame) を ffmpeg フィルタチェーンに移動:

```diff
- "-vf", "scale=in_range=full:out_range=limited"
+ "-vf", "vflip,scale=in_range=full:out_range=limited"
```

ffmpeg の `vflip` は行ポインタ swap のみでゼロコピー。

## 実測結果

| 項目 | Before (HTMLVideoElement seek) | After (WebCodecs + PBO) |
|------|-------------------------------|------------------------|
| 919 frames | 53.0s | **17.8s (2.98x)** |
| readPixels | 4-5ms/frame (sync) | PBO + finish |
| Y-flip | 0.3ms/frame (CPU) | 0ms (ffmpeg) |
| JS heap | 24MB (3 buffers) | 8MB (1 buffer) |
| 色 | 正常 | 正常 (LinearSRGBColorSpace) |
| decoder | HTMLVideoElement seek | **HW (VideoToolbox) — waitOut=0ms** |
| ボトルネック | seek 27-46ms | render + readPixels (~19ms/frame) |

## 注意事項

- `LinearSRGBColorSpace` は WebCodecs CanvasTexture 専用。VideoTexture (HTMLVideoElement) は `SRGBColorSpace` のまま
- fenceSync プローブは export 開始時に 1 回だけ実行（オーバーヘッド <1ms）
- `powerPreference: "high-performance"` をレンダラに設定するとディスクリート GPU が優先される
- 次の最適化ターゲットは `prefer-software` → `prefer-hardware` デコーダ切り替え

## HW デコーダ切り替えパターン

### 3-step フォールバック戦略

```typescript
const HW_ACCELERATION_LEVELS = [
  "prefer-hardware",  // Step 1: GPU decode — 最速
  "prefer-software",  // Step 2: CPU decode — 安定
  undefined,          // Step 3: ブラウザデフォルト
] as const;

for (const accel of HW_ACCELERATION_LEVELS) {
  const config = {
    codec: "avc1.64001f",
    hardwareAcceleration: accel,
    // ...
  };
  const { supported } = await VideoDecoder.isConfigSupported(config);
  if (supported) {
    decoder.configure(config);
    break;
  }
}
```

config-time で `isConfigSupported()` プローブ → runtime でも decode エラー時に次レベルへフォールバック。

### 定数の調整

HW decoder は GPU メモリ上にフレームを保持するため、同時生存フレーム数の制限が SW と異なる:

```typescript
// SW decoder: メインメモリに余裕があるため多めに保持可能
const MAX_LIVE_VIDEO_FRAMES_SW = 16;

// HW decoder: GPU VRAM に制約。Electron + macOS では控えめに
const MAX_LIVE_VIDEO_FRAMES_HW = 8;  // 要ベンチマーク調整
```

`decoder.decodeQueueSize` を監視し、キューが詰まった場合はフレーム投入を一時停止（バックプレッシャー制御）。

### VideoFrame.colorSpace 診断ログ

HW/SW で colorSpace メタデータが異なる可能性があるため、切り替え時に診断ログを出力:

```typescript
function logFrameColorSpace(frame: VideoFrame, source: string) {
  const cs = frame.colorSpace;
  console.log(`[VideoFrame:${source}]`, {
    primaries: cs.primaries,     // "bt709" | "bt2020" | ...
    transfer: cs.transfer,       // "bt709" | "iec61966-2-1" (sRGB) | ...
    matrix: cs.matrix,           // "bt709" | "bt2020-ncl" | ...
    fullRange: cs.fullRange,     // true | false
  });
}
```

最初の 3 フレームで出力し、以降は抑制。異常値検出時は警告を出す。

### LinearSRGBColorSpace 修正の適用範囲

`texture.colorSpace = THREE.LinearSRGBColorSpace` は **HW/SW decoder に関わらず必要**。
Canvas 2D の `drawImage(videoFrame)` が macOS ANGLE/Metal で linear 化する挙動は
VideoDecoder の hardwareAcceleration 設定に依存しない（Canvas 2D レイヤーの問題）。

したがって:
- HW decoder → Canvas 2D drawImage → **LinearSRGBColorSpace** ✓
- SW decoder → Canvas 2D drawImage → **LinearSRGBColorSpace** ✓
- HTMLVideoElement → VideoTexture → **SRGBColorSpace** (従来通り)

## 関連

- life#48: WebCodecs re-enable + color space fix
- life#38: 元の暗化報告 (2248b6e で無効化)
- commit 593fd1a: 本修正
