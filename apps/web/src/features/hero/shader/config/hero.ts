/**
 * Hero Shader Configuration
 * 調整ポイントはこのファイルで一元管理
 */

export const heroShaderConfig = {
  // === 暗部・明度設定 ===
  // baseColorDarken: 平均暗部色の暗化係数 (0-1, 小さいほど暗い)
  baseColorDarken: 0.55,
  // edgeColorDarken: エッジブラー色の暗化係数
  edgeColorDarken: 0.6,
  // saturationRetain: 彩度維持率 (0-1)
  saturationRetain: 0.6,
  // minBrightness: 最低明度 (黒潰れ防止)
  minBrightness: 0.06,

  // === フェード・ブレンド設定 ===
  // edgeFade: 写真エッジのフェード幅 (0-1)
  edgeFade: 0.18,
  // blendToBaseDistance: 背景がbaseColorに完全移行する距離
  blendToBaseDistance: 0.32,
  // edgeInset: エッジサンプリング時の内側オフセット
  edgeInset: 0.08,
  // blurRadius: エッジブラーの半径
  blurRadius: 0.05,

  // === FBM設定 ===
  // fbmScale: FBMのUVスケール
  fbmScale: 1.5,
  // fbmIntensity: FBMの色への影響度
  fbmIntensity: 0.15,
  // fbmOctaves: FBMのオクターブ数
  fbmOctaves: 4,
  // fbmInitialAmplitude: 初期振幅
  fbmInitialAmplitude: 0.5,
  // fbmAmplitudeDecay: 振幅減衰率
  fbmAmplitudeDecay: 0.55,
  // fbmInitialFrequency: 初期周波数
  fbmInitialFrequency: 1.5,

  // === ノイズ・粒度設定 ===
  // grainMin: ノイズ振幅の最小値
  grainMin: 0.018,
  // grainMax: ノイズ振幅の最大値
  grainMax: 0.045,
  // grainVarianceScale: 分散→振幅の変換係数
  grainVarianceScale: 12.0,
  // coarseScale: 粗いノイズのスケール係数
  coarseScale: 0.8,
  // coarseAmplitude: 粗いノイズの振幅比率
  coarseAmplitude: 0.8,
  // fineScale: 細かいノイズのスケール係数
  fineScale: 4.0,
  // fineAmplitude: 細かいノイズの振幅比率
  fineAmplitude: 0.45,

  // === サンプリング設定 ===
  // sampleGridStart: 平均色サンプリング開始位置
  sampleGridStart: 0.15,
  // sampleGridEnd: 平均色サンプリング終了位置
  sampleGridEnd: 0.85,
  // sampleGridStep: サンプリング間隔
  sampleGridStep: 0.14,
  // darkWeightFactor: 暗部重み付け係数
  darkWeightFactor: 0.6,

  // === フォールバック ===
  // fallbackColor: WebGL非対応時の背景色
  fallbackColor: "#0a0a0a",
} as const;

export type HeroShaderConfig = typeof heroShaderConfig;
