/**
 * @fileoverview ディストーション付きクロスフェード フラグメントシェーダー
 *
 * ## フラグメントシェーダーとは
 * GPU上で「各ピクセルの色」を決定するプログラム。
 * 頂点シェーダーが頂点の位置を決めた後、GPU のラスタライザが
 * 三角形内部のピクセルを列挙し、1ピクセルずつこのシェーダーを実行する。
 *
 * ## このシェーダーの処理フロー
 * ```
 * 1. UV座標を object-fit: cover 方式で補正
 * 2. ノイズテクスチャからディスプレイスメント値を取得
 * 3. u_progress に応じた bell curve で歪み強度を計算
 * 4. 画像A / 画像B の UV をそれぞれ逆方向にオフセット
 * 5. smoothstep でクロスフェード
 * ```
 *
 * ## GLSL の基本型
 * | 型 | 説明 | 例 |
 * |---|---|---|
 * | float | 単精度浮動小数点数 | 1.0, 0.5 |
 * | vec2 | 2次元ベクトル | vec2(1.0, 2.0) |
 * | vec4 | 4次元ベクトル（RGBA等） | vec4(1.0, 0.0, 0.0, 1.0) |
 * | sampler2D | 2Dテクスチャへの参照 | texture2D(sampler, uv) |
 */

// ---------------------------------------------------------------------------
// varying 変数
// ---------------------------------------------------------------------------

/**
 * varying vec2 vUv
 *
 * 頂点シェーダーから受け取る UV 座標。
 *
 * ### varying の仕組み
 * 頂点シェーダーで各頂点に設定した値が、ラスタライザによって
 * 三角形内部のピクセルごとに「線形補間」される。
 *
 * 例: 三角形の3頂点が vUv = (0,0), (1,0), (0,1) なら、
 * 三角形の中心付近のピクセルでは vUv ≈ (0.33, 0.33) になる。
 *
 * ### UV座標とは
 * テクスチャ上の位置を表す 2D 座標。
 * - U（= x）: 0.0（左端）〜 1.0（右端）
 * - V（= y）: 0.0（下端）〜 1.0（上端）
 * PlaneGeometry のデフォルト UV は四隅が (0,0), (1,0), (0,1), (1,1)。
 */
varying vec2 vUv;

// ---------------------------------------------------------------------------
// uniform 変数（CPU側から渡される全ピクセル共通の値）
// ---------------------------------------------------------------------------

/**
 * uniform sampler2D u_texture1
 *
 * 画像A（デフォルト表示）のテクスチャ。
 *
 * ### sampler2D とは
 * GPU のテクスチャユニットにバインドされた 2D テクスチャへの参照。
 * texture2D(u_texture1, uv) でその座標のピクセル色（vec4）を取得する。
 * CPU 側（JS）からは THREE.Texture オブジェクトとして渡す。
 */
uniform sampler2D u_texture1;

/** 画像B（ホバー時表示）のテクスチャ。 */
uniform sampler2D u_texture2;

/**
 * uniform sampler2D u_displacement
 *
 * ディスプレイスメント（変位）テクスチャ。
 * グレースケールのノイズパターンで、各ピクセルの明るさ（0.0〜1.0）が
 * 「そのピクセルのUVをどのくらいズラすか」を決定する。
 *
 * 白い部分 → 大きくズレる、黒い部分 → ほぼズレない。
 * これにより一様ではない「有機的な」歪みが生まれる。
 */
uniform sampler2D u_displacement;

/**
 * uniform float u_progress
 *
 * トランジションの進行度。0.0（画像A）〜 1.0（画像B）。
 * JavaScript 側で GSAP がこの値を毎フレーム更新する。
 *
 * ### CPU → GPU データフロー
 * ```
 * GSAP → uniform.u_progress.value（JS オブジェクト）
 *     → Three.js が gl.uniform1f() で GPU に転送
 *     → シェーダーが u_progress として読む
 * ```
 */
uniform float u_progress;

/**
 * uniform vec2 u_resolution
 *
 * カード（PlaneGeometry）のワールドサイズ。
 * x = CARD_WIDTH, y = CARD_HEIGHT。
 * object-fit: cover のアスペクト比計算に使用。
 */
uniform vec2 u_resolution;

/**
 * uniform vec2 u_imageResolution
 *
 * 元画像のピクセル解像度。x = 1200, y = 840。
 * 画像のアスペクト比を知るために使用。
 */
uniform vec2 u_imageResolution;

/**
 * uniform float u_distortionStrength
 *
 * ディストーション（歪み）の最大強度。
 * 値が大きいほどUVオフセットが大きくなり、歪みが強くなる。
 * 0.12 は控えめで上品な歪み。
 */
uniform float u_distortionStrength;

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------

/**
 * 円周率。GLSL には組み込みの PI 定数がないため、
 * #define マクロで定義する。
 * sin(progress * PI) の bell curve 計算に使用。
 */
#define PI 3.14159265359

// ---------------------------------------------------------------------------
// メイン処理
// ---------------------------------------------------------------------------

void main() {
  /**
   * varying から受け取った UV 座標をローカル変数にコピー。
   * この後の処理で UV を加工するが、元の vUv は変更しない。
   */
  vec2 uv = vUv;

  // =========================================================================
  // object-fit: cover の実装
  // =========================================================================

  /**
   * ### object-fit: cover をシェーダーで実現する
   *
   * CSS の object-fit: cover は「アスペクト比を維持しつつ、
   * コンテナ全体を覆うようにリサイズし、はみ出し部分をクリップ」する。
   *
   * シェーダーでこれを実現するには、UV座標をスケーリングして
   * 画像の一部だけを表示する。
   *
   * ### アルゴリズム
   * ```
   * カードが画像より横長の場合（screenAspect > imageAspect）:
   *   → 横はそのまま、縦を縮小してはみ出させる
   *   → scale = (1.0, imageAspect / screenAspect)
   *   → Y方向のUV範囲が狭くなる = 上下がクリップされる
   *
   * カードが画像より縦長の場合:
   *   → 縦はそのまま、横を縮小してはみ出させる
   *   → scale = (screenAspect / imageAspect, 1.0)
   *   → X方向のUV範囲が狭くなる = 左右がクリップされる
   * ```
   *
   * ### 具体例
   * カード: 1.714 x 1.2（アスペクト比 1.428）
   * 画像: 1200 x 840（アスペクト比 1.428）
   * → アスペクト比が同じなので scale = (1.0, 1.0)、変換なし。
   *
   * もし画像が 1200 x 1200（正方形）だったら:
   * screenAspect(1.428) > imageAspect(1.0) なので
   * scale = (1.0, 1.0/1.428) = (1.0, 0.7)
   * → UV の Y 範囲が 0.15〜0.85 に狭まり、上下がクリップ。
   */
  float screenAspect = u_resolution.x / u_resolution.y;
  float imageAspect = u_imageResolution.x / u_imageResolution.y;

  /**
   * 三項演算子で cover スケールを計算。
   *
   * screenAspect > imageAspect の場合:
   *   横はフルに使う（1.0）、縦を imageAspect/screenAspect に縮小。
   * それ以外:
   *   縦はフルに使う（1.0）、横を screenAspect/imageAspect に縮小。
   */
  vec2 scale = screenAspect > imageAspect
    ? vec2(1.0, imageAspect / screenAspect)
    : vec2(screenAspect / imageAspect, 1.0);

  /**
   * UV 座標に cover スケールを適用。
   *
   * (uv - 0.5) * scale + 0.5 の意味:
   * 1. uv - 0.5: UV の原点を中心（0.5, 0.5）に移動
   * 2. * scale: 中心を基準にスケーリング
   * 3. + 0.5: 原点を元に戻す
   *
   * 「中心を基準にスケール」するので、画像の中央が常に見える。
   * (0,0) 基準でスケールすると左上に偏ってしまう。
   */
  vec2 coverUv = (uv - 0.5) * scale + 0.5;

  // =========================================================================
  // ディスプレイスメント（変位）の計算
  // =========================================================================

  /**
   * ノイズテクスチャから変位値を取得。
   *
   * texture2D(テクスチャ, UV) → vec4（RGBA）
   * .r で赤チャンネルだけを取得（グレースケールなので R だけで十分）。
   *
   * disp の値は 0.0（黒）〜 1.0（白）。
   * ノイズパターンにより、位置ごとに異なる値になる。
   *
   * coverUv を使ってサンプリングするので、
   * 画像のUVと同じ座標系でノイズを読む = 歪みが画像に「貼り付く」。
   */
  float disp = texture2D(u_displacement, coverUv).r;

  /**
   * ### Bell Curve（釣鐘曲線）トリック: sin(progress * PI)
   *
   * u_progress が 0→1 に変化するとき、sin(progress * PI) は:
   *
   * ```
   *   progress:  0.0  0.25  0.5  0.75  1.0
   *   sin(p*PI): 0.0  0.71  1.0  0.71  0.0
   *
   *            1.0 |     ___
   *                |   /     \
   *                |  /       \
   *            0.5 | /         \
   *                |/           \
   *            0.0 +---+---+---+---→ progress
   *                0  0.25 0.5 0.75 1.0
   * ```
   *
   * ### なぜこれが重要か
   * - progress=0（画像A）と progress=1（画像B）では歪みがゼロ
   * - progress=0.5（遷移の中間）で歪みが最大
   * → 「開始時と終了時はクリーンな画像、遷移中だけ歪む」
   *   という自然なエフェクトになる。
   *
   * もし sin を使わず progress をそのまま使うと、
   * 画像Bが完全に表示された状態でも歪みが残ってしまう。
   *
   * strength = bell curve の現在値 × 歪みの最大強度
   */
  float strength = sin(u_progress * PI) * u_distortionStrength;

  /**
   * ### UV オフセットの計算
   *
   * 画像A と 画像B で「逆方向に」オフセットする。
   * これにより、2つの画像が反対方向にスライドするような効果になる。
   *
   * offsetA = (disp * strength, disp * strength * 0.5)
   * offsetB = (-disp * strength, -disp * strength * 0.5)
   *
   * ### なぜ Y 方向は 0.5 倍か
   * X 方向の歪みを主にして、Y方向を控えめにすることで
   * 「横にぬるっと動く」印象を作る。両方同じだと等方的（均一）になり、
   * 方向性のない歪みになってしまう。
   *
   * ### disp × strength の意味
   * - disp（ノイズ値）: 場所ごとに異なる → 不均一な歪み
   * - strength（bell curve）: 時間で変化 → アニメーション
   * → ノイズパターンに沿って時間変化する歪みが実現する。
   */
  vec2 offsetA = vec2(disp * strength, disp * strength * 0.5);
  vec2 offsetB = vec2(-disp * strength, -disp * strength * 0.5);

  /**
   * オフセットを適用して各テクスチャをサンプリング。
   *
   * coverUv + offsetA: 画像AのUVは正方向にズレる
   * coverUv + offsetB: 画像BのUVは負方向にズレる
   *
   * → 遷移中間点では、2つの画像が互いに逆方向に歪んでいる状態になる。
   */
  vec4 colorA = texture2D(u_texture1, coverUv + offsetA);
  vec4 colorB = texture2D(u_texture2, coverUv + offsetB);

  // =========================================================================
  // クロスフェード
  // =========================================================================

  /**
   * ### smoothstep によるクロスフェード
   *
   * smoothstep(edge0, edge1, x) は GLSL の組み込み関数で、
   * Hermite 補間（3次のS字カーブ）を返す。
   *
   * ```
   * smoothstep(0.0, 1.0, x) の挙動:
   *   x < 0.0  → 0.0
   *   x > 1.0  → 1.0
   *   0.0〜1.0 → S字カーブ（t*t*(3-2*t)）
   *
   *   1.0 |          ___---
   *       |       /
   *       |     /
   *   0.5 |   /
   *       | /
   *   0.0 +---___          → x
   *       0.0       0.5       1.0
   * ```
   *
   * ### smoothstep vs 線形補間
   * 線形補間（u_progress そのまま）だと、
   * 遷移の開始と終了が「パキッ」と切り替わる印象になる。
   * smoothstep はS字カーブなので、開始と終了が「ぬるっと」なる。
   *
   * ### GSAP の ease との関係
   * GSAP 側も "power2.inOut" でイージングしているので、
   * 実質的にイージングが二重にかかっている。
   * これにより非常に滑らかなトランジションになる。
   */
  float mixFactor = smoothstep(0.0, 1.0, u_progress);

  /**
   * ### mix() によるブレンド
   *
   * mix(a, b, t) = a * (1.0 - t) + b * t
   *
   * mixFactor = 0.0 → colorA のみ（画像A 100%）
   * mixFactor = 0.5 → colorA と colorB を半々に混合
   * mixFactor = 1.0 → colorB のみ（画像B 100%）
   *
   * ### gl_FragColor
   * フラグメントシェーダーの最終出力。
   * このピクセルの色（vec4 = RGBA）を決定する。
   *
   * 注意: 最新の GLSL（ES 3.0+）では gl_FragColor の代わりに
   * out 変数を使うが、WebGL 1.0 / GLSL ES 1.0 では gl_FragColor を使う。
   */
  gl_FragColor = mix(colorA, colorB, mixFactor);
}
