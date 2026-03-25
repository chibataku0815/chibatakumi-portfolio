/**
 * @module distortion
 *
 * ディストーション・ホバーエフェクト用の GLSL シェーダー。
 * Displacement map による歪みと2枚のテクスチャのクロスフェードを実現する。
 *
 * Inspired by [Codrops WebGL Distortion Hover Effects](https://tympanus.net/codrops/)
 *
 * ## `/* glsl *​/` テンプレートリテラルパターン
 *
 * シェーダーコードを TypeScript ファイル内に文字列として埋め込む手法。
 * `/* glsl *​/` コメントは「タグ付きコメント」で、以下の目的で使用する:
 *
 * 1. **エディタのシンタックスハイライト** — VSCode 拡張「Comment Tagged Templates」が
 *    このコメントを検出し、テンプレートリテラル内の GLSL コードをハイライトする
 * 2. **コードの意図の明示** — この文字列が GLSL であることを開発者に伝える
 *
 * ### なぜ .glsl ファイルではなく文字列埋め込みなのか
 *
 * | アプローチ | メリット | デメリット |
 * |-----------|---------|-----------|
 * | `.glsl` + Vite `?raw` | ファイル分離、補完が効く | Next.js では `?raw` が使えない |
 * | `.glsl` + webpack raw-loader | ファイル分離 | webpack 設定が必要、Next.js 設定の複雑化 |
 * | **テンプレートリテラル埋め込み** | **設定不要、Next.js 互換** | ファイルが長くなる |
 * | glslify (npm) | import 文で分割可能 | 追加依存、バンドラ設定が必要 |
 *
 * Next.js（特に App Router）では `.glsl` ファイルの raw import にカスタム webpack 設定が必要で、
 * Turbopack との互換性も不透明。テンプレートリテラル方式が最もシンプルで確実。
 *
 * Vite プロジェクトなら `import vertexShader from './shader.vert?raw'` が使える。
 *
 * ## シェーダーの仕組み
 *
 * ### Vertex Shader（頂点シェーダー）
 * - 各頂点の UV 座標を Fragment Shader に受け渡す（varying vUv）
 * - 頂点位置は標準的な MVP 変換（projectionMatrix * modelViewMatrix * position）
 * - R3F の `<planeGeometry>` が持つ `uv`, `position` attribute を Three.js が自動で供給
 *
 * ### Fragment Shader（フラグメントシェーダー）
 * 1. **Object-fit: cover** — CSS の object-fit: cover と同じロジックを UV 空間で実装
 * 2. **Displacement** — ノイズテクスチャの R 値で UV をずらし、歪みを生成
 * 3. **Bell curve 強度** — `sin(progress * PI)` で 0→50%→100% の遷移中、
 *    50% 地点で歪みが最大になるベルカーブを生成
 * 4. **Crossfade** — smoothstep で2枚のテクスチャを滑らかに混合
 */

/**
 * Vertex Shader — 頂点位置とUV座標の処理。
 *
 * R3F / Three.js が自動的に以下の変数を供給する:
 * - `projectionMatrix` (uniform mat4) — カメラの投影行列
 * - `modelViewMatrix` (uniform mat4) — モデル変換 + ビュー変換の合成行列
 * - `position` (attribute vec3) — 頂点のローカル座標
 * - `uv` (attribute vec2) — テクスチャ座標（PlaneGeometry が自動生成）
 *
 * `varying` で宣言した `vUv` は、ラスタライズ時に頂点間で線形補間され、
 * Fragment Shader の各ピクセルに渡される。
 */
export const distortionVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Fragment Shader — ピクセルごとの色計算。
 *
 * ## Uniform 一覧
 * | 名前 | 型 | 説明 |
 * |------|-----|------|
 * | u_texture1 | sampler2D | ホバー前の画像テクスチャ |
 * | u_texture2 | sampler2D | ホバー後の画像テクスチャ |
 * | u_displacement | sampler2D | ノイズテクスチャ（displacement map） |
 * | u_progress | float | アニメーション進行度（0.0 ~ 1.0、GSAP が駆動） |
 * | u_resolution | vec2 | カード（メッシュ）のサイズ |
 * | u_imageResolution | vec2 | 元画像の解像度 |
 * | u_distortionStrength | float | 歪みの最大強度 |
 *
 * ## 処理フロー
 * ```
 * UV座標 → object-fit:cover 補正 → displacement offset 計算
 *   → テクスチャA（正方向offset）とテクスチャB（逆方向offset）をサンプリング
 *   → smoothstep で crossfade → gl_FragColor に出力
 * ```
 */
export const distortionFragment = /* glsl */ `
  varying vec2 vUv;

  uniform sampler2D u_texture1;
  uniform sampler2D u_texture2;
  uniform sampler2D u_displacement;
  uniform float u_progress;
  uniform vec2 u_resolution;
  uniform vec2 u_imageResolution;
  uniform float u_distortionStrength;

  #define PI 3.14159265359

  void main() {
    vec2 uv = vUv;

    // --- Object-fit: cover ---
    // CSS の object-fit: cover と同じ原理: アスペクト比が異なる場合に
    // 短辺を 1.0 にスケールし、長辺ははみ出す部分をクリップする
    float screenAspect = u_resolution.x / u_resolution.y;
    float imageAspect = u_imageResolution.x / u_imageResolution.y;
    vec2 scale = screenAspect > imageAspect
      ? vec2(1.0, imageAspect / screenAspect)
      : vec2(screenAspect / imageAspect, 1.0);
    vec2 coverUv = (uv - 0.5) * scale + 0.5;

    // --- Displacement ---
    // ノイズテクスチャの R チャンネルから displacement 値を取得（0.0 ~ 1.0）
    float disp = texture2D(u_displacement, coverUv).r;

    // sin(progress * PI) はベルカーブを描く:
    //   progress=0.0 → 0.0（歪みなし）
    //   progress=0.5 → 1.0（歪み最大）
    //   progress=1.0 → 0.0（歪みなし）
    // これにより遷移の中間点で最も歪み、始点と終点では歪みがゼロになる
    float strength = sin(u_progress * PI) * u_distortionStrength;

    // 2つのテクスチャを逆方向にずらすことで、有機的な切り替え感を演出
    // Y方向は X の半分（0.5倍）にすることで、斜め方向の自然な揺れになる
    vec2 offsetA = vec2(disp * strength, disp * strength * 0.5);
    vec2 offsetB = vec2(-disp * strength, -disp * strength * 0.5);

    vec4 colorA = texture2D(u_texture1, coverUv + offsetA);
    vec4 colorB = texture2D(u_texture2, coverUv + offsetB);

    // --- Crossfade with slight easing ---
    // smoothstep はエルミート補間で、線形 mix よりも滑らかな遷移になる
    // smoothstep(0, 1, x) ≒ 3x² - 2x³（S字カーブ）
    float mixFactor = smoothstep(0.0, 1.0, u_progress);
    gl_FragColor = mix(colorA, colorB, mixFactor);
  }
`;
