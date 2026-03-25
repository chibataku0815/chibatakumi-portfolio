/**
 * @fileoverview Codrops風 画像ディストーション・トランジション
 *
 * ## 全体アーキテクチャ
 * このファイルは Three.js + GSAP で「ホバーすると画像Aから画像Bへ
 * ノイズベースのディストーション付きで切り替わるカード」を実装している。
 *
 * ### 処理フロー
 * ```
 * 1. ノイズテクスチャ生成（CPU側で数学的に生成）
 * 2. Three.js シーン構築（カメラ・レンダラー・PlaneGeometry）
 * 3. ShaderMaterial に頂点/フラグメントシェーダーを割り当て
 * 4. Raycaster でマウスホバー検知
 * 5. GSAP で u_progress を 0→1 にトゥイーン
 * 6. フラグメントシェーダーが u_progress に応じてディストーション＋クロスフェード
 * ```
 *
 * ### 学習ポイント
 * - Three.js の最小構成（Scene, Camera, Renderer, Mesh）
 * - ShaderMaterial でカスタムシェーダーを使う方法
 * - Raycaster による 3D 空間でのマウスインタラクション
 * - GSAP と uniform の連携パターン
 * - Perlin-like ノイズの手動生成
 *
 * @see https://tympanus.net/codrops/ Codrops（インスピレーション元）
 */

import * as THREE from "three";
import gsap from "gsap";

/**
 * Vite の `?raw` サフィックスで、シェーダーファイルを文字列として直接インポート。
 * ビルド時にファイル内容がそのまま JavaScript の文字列変数になる。
 *
 * ### なぜ ?raw が必要か
 * 通常の import はモジュールとして解釈されるが、GLSL はJSモジュールではない。
 * `?raw` を付けることで Vite が「このファイルは生テキストとして扱え」と理解する。
 */
import vertexShader from "./shaders/distortion.vert?raw";
import fragmentShader from "./shaders/distortion.frag?raw";

// ---------------------------------------------------------------------------
// 定数定義
// ---------------------------------------------------------------------------

/**
 * 画像ペアの定義配列。
 * 各ペアは `a`（デフォルト表示）と `b`（ホバー時表示）の2枚で構成。
 *
 * ### パス解決
 * `./assets/...` は Vite の public ディレクトリまたは相対パスとして解決される。
 * ビルド時にハッシュ付きファイル名に変換される場合がある。
 */
const IMAGE_PAIRS = [
  { a: "./assets/pair1-a.jpg", b: "./assets/pair1-b.jpg" },
  { a: "./assets/pair2-a.jpg", b: "./assets/pair2-b.jpg" },
  { a: "./assets/pair3-a.jpg", b: "./assets/pair3-b.jpg" },
];

/**
 * 元画像の解像度（ピクセル）。
 * シェーダー内で object-fit: cover 相当の UV 計算に使用する。
 *
 * ### THREE.Vector2
 * 2次元ベクトルを表すクラス。x, y プロパティを持ち、
 * ベクトル演算メソッド（add, sub, multiply, length 等）も提供する。
 * ここでは単にx=幅、y=高さのペアとして使用。
 */
const IMAGE_RESOLUTION = new THREE.Vector2(1200, 840);

/**
 * カードのアスペクト比（横÷縦）。
 * 1200 / 840 = 1.4286... → 横長の比率。
 * これを使って CARD_HEIGHT から CARD_WIDTH を自動計算する。
 */
const CARD_ASPECT = IMAGE_RESOLUTION.x / IMAGE_RESOLUTION.y;

// ---------------------------------------------------------------------------
// レイアウト設定
// ---------------------------------------------------------------------------

/**
 * カード間のギャップ（Three.js ワールド単位）。
 *
 * ### ワールド単位とは
 * Three.js では「1単位 = 1メートル」といった物理的な基準はない。
 * PerspectiveCamera の fov と position.z によって
 * 画面上でのサイズが決まる。ここでは z=3, fov=45 なので
 * 画面の縦幅 ≈ 2 * tan(22.5°) * 3 ≈ 2.49 ワールド単位。
 */
const GAP = 0.15;

/**
 * カードの高さ（ワールド単位）。
 * 画面縦幅（≈2.49）に対して約48%を占める大きさ。
 */
const CARD_HEIGHT = 1.2;

/**
 * カードの幅（ワールド単位）。
 * CARD_HEIGHT * アスペクト比 = 1.2 * 1.4286 ≈ 1.714
 */
const CARD_WIDTH = CARD_HEIGHT * CARD_ASPECT;

/**
 * ディストーション（歪み）の強さ。
 * シェーダーに渡され、UV座標のズレ量を制御する。
 * 0.0 = 歪みなし、0.12 = 穏やかな歪み、0.5 = 激しい歪み。
 */
const DISTORTION_STRENGTH = 0.12;

/**
 * ホバーアニメーションの秒数。
 * GSAP の duration に渡される。
 * 1.2秒は「ゆったりだが間延びしない」バランスの良い値。
 */
const TWEEN_DURATION = 1.2;

// ---------------------------------------------------------------------------
// ノイズテクスチャ生成
// ---------------------------------------------------------------------------

/**
 * 手続き的にノイズベースのディスプレイスメントテクスチャを生成する。
 *
 * ### ディスプレイスメントテクスチャとは
 * 各ピクセルの明るさで「どのくらいズラすか」を定義するグレースケール画像。
 * フラグメントシェーダーでこのテクスチャを読み、UV座標をオフセットすることで
 * 画像に「歪み」効果を与える。
 *
 * ### アルゴリズム：マルチオクターブ Value Noise
 * 本来の Perlin Noise ではなく、sin/cos の組み合わせで
 * ノイズ風パターンを生成する簡易手法。
 *
 * 「オクターブ」とは音楽用語からの借用で、
 * 異なるスケール（周波数）のノイズを重ね合わせること。
 *
 * ```
 * オクターブ1: 低周波（大きな塊）  × 0.5    → 大まかな形状
 * オクターブ2: 中周波（中程度）    × 0.25   → ディテール追加
 * オクターブ3: 高周波（細かい粒）  × 0.125  → 微細な質感
 * ```
 *
 * 各オクターブで周波数を上げつつ振幅を半分にする（1/f ノイズ）ことで、
 * 自然界に近いフラクタル的なパターンが得られる。
 *
 * @param size - テクスチャの一辺のピクセル数（デフォルト: 512）。
 *               2の累乗が推奨（GPU のテクスチャ処理に最適化されるため）。
 * @returns THREE.DataTexture - CPU で生成したピクセルデータから作るテクスチャ。
 *          GPU にアップロードされた後はシェーダーから sampler2D として参照可能。
 */
function createNoiseTexture(size = 512): THREE.DataTexture {
  /**
   * 1チャンネル（グレースケール）のピクセルデータ配列。
   * size × size ピクセル、各ピクセル 0-255 の 1バイト。
   *
   * ### なぜ Uint8Array か
   * - Float32Array も使えるが、ディスプレイスメント用途には 256段階で十分
   * - メモリ効率が良い（Float32 の 1/4）
   */
  const data = new Uint8Array(size * size);

  // 全ピクセルをイテレート
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      /**
       * ピクセル座標を 0.0 ~ 1.0 に正規化。
       * こうすることで、テクスチャサイズに依存しないパターンになる。
       */
      const nx = x / size;
      const ny = y / size;

      let v = 0;

      /**
       * ### オクターブ1: 大スケールの波
       * sin(nx*8.3 + ny*5.7) × cos(ny*7.1 - nx*3.2)
       *
       * sin と cos の積を取ることで、2次元的なうねりパターンが生まれる。
       * 係数（8.3, 5.7 等）は「無理数的な」値を選ぶことで
       * 繰り返しパターンが目立たないようにしている。
       *
       * 振幅 0.5 → 最も支配的なレイヤー。
       */
      v += Math.sin(nx * 8.3 + ny * 5.7) * Math.cos(ny * 7.1 - nx * 3.2) * 0.5;

      /**
       * ### オクターブ2: 中スケールの波
       * 周波数を約2倍（17.0, 23.0 等）に上げ、
       * 振幅を半分（0.25）に下げる。
       * → より細かいディテールが加わる。
       */
      v +=
        Math.sin(nx * 17.0 + ny * 23.0) *
        Math.cos(ny * 19.0 - nx * 11.0) *
        0.25;

      /**
       * ### オクターブ3: 小スケールの波
       * さらに周波数を上げ（43.0, 37.0 等）、振幅を半分（0.125）に。
       * → 微細なザラつきが加わり、よりオーガニックな質感になる。
       */
      v +=
        Math.sin(nx * 43.0 - ny * 37.0) *
        Math.cos(ny * 47.0 + nx * 31.0) *
        0.125;

      /**
       * ### 正規化: -1~1 の範囲を 0~1 に変換
       * sin × cos の積は理論上 -1 ~ 1 だが、3オクターブの合成で
       * 実際の範囲は -0.875 ~ 0.875 程度。
       * v * 0.5 + 0.5 で 0 ~ 1 にマッピングする。
       */
      v = v * 0.5 + 0.5;

      /**
       * 0~1 の float を 0~255 の整数に変換してバッファに格納。
       * Math.max/Math.min でクランプ（範囲外を切り捨て）してからスケーリング。
       */
      data[y * size + x] = Math.floor(
        Math.max(0, Math.min(1, v)) * 255
      );
    }
  }

  /**
   * ### THREE.DataTexture
   * CPU側で作ったピクセルデータからテクスチャを生成する。
   * 画像ファイルを読み込むのではなく、プログラムで生成する場合に使う。
   *
   * @param data - ピクセルデータ（Uint8Array）
   * @param size - 幅
   * @param size - 高さ
   * @param THREE.RedFormat - 1チャンネル（R）のみ使用。
   *        RGB や RGBA ではなく R だけなのは、グレースケール情報で十分だから。
   *        GPU 側では texture2D().r でアクセスする。
   */
  const tex = new THREE.DataTexture(data, size, size, THREE.RedFormat);

  /**
   * ### ラッピングモード: RepeatWrapping
   * UV座標が 0~1 の範囲を超えたときの挙動を設定。
   *
   * - ClampToEdgeWrapping（デフォルト）: 端のピクセルを引き延ばす
   * - RepeatWrapping: タイル状に繰り返す ← これを選択
   * - MirroredRepeatWrapping: 鏡像反転で繰り返す
   *
   * ディスプレイスメント時にUVが範囲外に出ても自然にループするよう
   * RepeatWrapping を指定している。
   *
   * wrapS = 横方向（S = U = X）, wrapT = 縦方向（T = V = Y）
   */
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;

  /**
   * needsUpdate = true を設定すると、次のレンダリング時に
   * GPU へテクスチャデータがアップロードされる。
   * DataTexture は初期状態では GPU に送られていないため、
   * 明示的に true にする必要がある。
   */
  tex.needsUpdate = true;

  return tex;
}

// ---------------------------------------------------------------------------
// レンダラー初期化
// ---------------------------------------------------------------------------

/**
 * HTMLCanvasElement の取得。
 * HTML側で <canvas id="canvas"></canvas> を定義しておく必要がある。
 *
 * `as HTMLCanvasElement` は TypeScript の型アサーション。
 * getElementById は HTMLElement | null を返すが、
 * ここでは確実に canvas 要素であることをコンパイラに伝える。
 */
const canvas = document.getElementById("canvas") as HTMLCanvasElement;

/**
 * ### THREE.WebGLRenderer
 * Three.js の描画エンジン。WebGL API を抽象化して、
 * シーン・カメラ・メッシュを画面にレンダリングする。
 *
 * @param canvas - 描画先の canvas 要素。省略すると自動生成される。
 * @param antialias - エッジのギザギザ（ジャギー）を滑らかにする。
 *                    パフォーマンスコストがあるが、品質が大幅に向上。
 * @param alpha - canvas の背景を透明にできるようにする。
 *               CSS で背景を設定したい場合に便利。
 */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

/**
 * レンダラーの描画サイズをウィンドウサイズに合わせる。
 * CSS上のサイズと WebGL の内部バッファサイズを一致させる。
 */
renderer.setSize(window.innerWidth, window.innerHeight);

/**
 * ### ピクセル比（Device Pixel Ratio）
 * Retina ディスプレイでは1 CSS ピクセル = 2〜3 物理ピクセル。
 * setPixelRatio でこれに対応し、くっきり表示させる。
 *
 * Math.min(..., 2) で上限を2に制限するのは、
 * 3x 以上のディスプレイ（一部 Android）でパフォーマンスが
 * 大幅に低下するのを防ぐため。2x で十分な品質が得られる。
 */
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * クリアカラー（背景色）を濃いグレー（#0a0a0a）に設定。
 * 第2引数の 1 はアルファ値（不透明度）。
 * 0x0a0a0a = RGB(10, 10, 10) → ほぼ真っ黒だが完全な黒ではない。
 */
renderer.setClearColor(0x0a0a0a, 1);

// ---------------------------------------------------------------------------
// シーン・カメラ
// ---------------------------------------------------------------------------

/**
 * ### THREE.Scene
 * 3D空間のコンテナ。全てのオブジェクト（Mesh, Light, Camera等）を
 * scene.add() で追加する。レンダラーは scene 内のオブジェクトを
 * camera の視点から描画する。
 *
 * Scene → Mesh → Geometry + Material という階層構造。
 */
const scene = new THREE.Scene();

/**
 * ### THREE.PerspectiveCamera（透視投影カメラ）
 * 人間の目に近い遠近法で描画するカメラ。
 * 遠いものは小さく、近いものは大きく見える。
 *
 * もう一つの選択肢 OrthographicCamera（正射投影）は
 * 遠近感がなく、UI やフラットなデザインに使われる。
 * ここでは PerspectiveCamera を使って自然な奥行き感を出す。
 *
 * @param fov - Field of View（視野角）: 45度。
 *              値が小さい → 望遠レンズ的（狭い範囲を大きく）
 *              値が大きい → 広角レンズ的（広い範囲を小さく）
 *              45度は自然な見え方のバランス。
 *
 * @param aspect - アスペクト比: ウィンドウの幅÷高さ。
 *                 これが正しくないと描画が歪む。
 *
 * @param near - ニアクリップ面: 0.1。これより手前のオブジェクトは描画されない。
 *               0にすると深度バッファの精度問題が起きるため、小さな正の値を使う。
 *
 * @param far - ファークリップ面: 100。これより遠いオブジェクトは描画されない。
 *              必要以上に大きくすると深度精度が低下する。
 */
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

/**
 * カメラの Z 位置を 3 に設定。
 * Three.js のデフォルト座標系では Z+ が手前方向。
 * カメラを z=3 に置くと、原点（z=0）にあるオブジェクトから
 * 3ワールド単位離れた位置から見ることになる。
 *
 * fov=45, z=3 のとき、画面上に見えるワールド空間の高さは:
 * height = 2 * tan(fov/2) * z = 2 * tan(22.5°) * 3 ≈ 2.49
 */
camera.position.z = 3;

// ---------------------------------------------------------------------------
// テクスチャの準備
// ---------------------------------------------------------------------------

/**
 * ### THREE.TextureLoader
 * 画像ファイルを読み込んで THREE.Texture オブジェクトを生成する。
 * 内部的には Image オブジェクトで画像をロードし、
 * GPU にテクスチャとしてアップロードする。
 *
 * loader.load() は非同期だが、Three.js は「テクスチャが準備できるまで
 * 黒で表示し、ロード完了後に自動で更新する」という仕組みを持つ。
 */
const loader = new THREE.TextureLoader();

/** CPU 生成のノイズテクスチャ。全カードで共有する。 */
const displacementTexture = createNoiseTexture();

// ---------------------------------------------------------------------------
// Card インターフェース
// ---------------------------------------------------------------------------

/**
 * カード1枚分の管理オブジェクト。
 *
 * ### なぜインターフェースで管理するか
 * Three.js の Mesh だけでは、uniform やアニメーション状態を
 * 追跡できない。この構造体で「メッシュ + シェーダーパラメータ +
 * アニメーション状態」を一つにまとめている。
 */
interface Card {
  /** Three.js のメッシュオブジェクト。ジオメトリ + マテリアル = 画面上の物体。 */
  mesh: THREE.Mesh;

  /**
   * シェーダーに渡す uniform 変数の辞書。
   * Record<string, THREE.IUniform> は { [key: string]: { value: any } } の型。
   *
   * ### uniform とは
   * シェーダーに CPU 側から渡す「全ピクセル共通」の値。
   * 各フレーム、各ピクセルで同じ値が参照される。
   * 対照的に attribute は「頂点ごとに異なる」値。
   */
  uniforms: Record<string, THREE.IUniform>;

  /**
   * 現在実行中の GSAP Tween への参照。
   * ホバーが変わったとき、前の Tween を kill() してから新しい Tween を開始する。
   * null はアニメーションが実行されていない状態。
   */
  tween: gsap.core.Tween | null;

  /** マウスがこのカードの上にあるかどうか。 */
  isHovered: boolean;
}

/** 生成した全カードを保持する配列。Raycaster のヒット判定にも使用。 */
const cards: Card[] = [];

// ---------------------------------------------------------------------------
// カードのレイアウト計算
// ---------------------------------------------------------------------------

/**
 * 全カードの合計幅を計算。
 * カード3枚 + ギャップ2つ分。
 *
 * ```
 * |<-- CARD_WIDTH -->|<GAP>|<-- CARD_WIDTH -->|<GAP>|<-- CARD_WIDTH -->|
 * |     totalWidth                                                    |
 * ```
 *
 * totalWidth = 3 * CARD_WIDTH + 2 * GAP
 */
const totalWidth =
  IMAGE_PAIRS.length * CARD_WIDTH + (IMAGE_PAIRS.length - 1) * GAP;

/**
 * 最初のカードの X 座標。
 * 全体を中央揃えするため、左端は -totalWidth/2 の位置。
 * そこにカード幅の半分を足すと、最初のカードの「中心」位置になる。
 *
 * ```
 * 原点(0)
 *   |
 *   |<--- totalWidth/2 --->|<--- totalWidth/2 --->|
 *   |                      |                      |
 * [-totalWidth/2]    [0 = 中央]           [+totalWidth/2]
 *
 * startX = -totalWidth/2 + CARD_WIDTH/2
 *        = 最初のカードの中心X座標
 * ```
 */
const startX = -totalWidth / 2 + CARD_WIDTH / 2;

// ---------------------------------------------------------------------------
// カードの生成
// ---------------------------------------------------------------------------

/**
 * 各画像ペアに対してカード（Mesh）を生成し、シーンに追加する。
 *
 * ### Three.js Mesh の構成
 * ```
 * Mesh = Geometry（形状） + Material（見た目）
 *
 * Geometry: PlaneGeometry → 四角い平面
 * Material: ShaderMaterial → カスタム GLSL シェーダー
 * ```
 */
IMAGE_PAIRS.forEach((pair, i) => {
  /**
   * TextureLoader.load() で画像をロード。
   * 戻り値は THREE.Texture オブジェクト（まだロード中の場合もある）。
   *
   * ### 非同期ロードの仕組み
   * load() を呼んだ時点では画像データはまだ無い。
   * 内部的に Image.onload で完了を待ち、完了したら自動で GPU に転送する。
   * その間はデフォルトの「白1x1ピクセル」テクスチャが使われる。
   */
  const tex1 = loader.load(pair.a);
  const tex2 = loader.load(pair.b);

  /**
   * ### テクスチャフィルタリングの設定
   *
   * minFilter: テクスチャが画面上で縮小表示されるときのフィルタリング方式。
   * magFilter: テクスチャが画面上で拡大表示されるときのフィルタリング方式。
   *
   * - NearestFilter: 最近傍補間（ドット絵風、ジャギーが出る）
   * - LinearFilter: 線形補間（滑らか）← 今回選択
   * - LinearMipMapLinearFilter: ミップマップ + 線形補間（デフォルト）
   *
   * generateMipmaps = false にする理由:
   * ミップマップは縮小版のテクスチャを事前生成する仕組みで、
   * 遠くのオブジェクトを高速・高品質に表示するために使う。
   * しかし今回はカードが常にほぼ同じ距離にあるため不要。
   * メモリ節約のためオフにする。
   */
  [tex1, tex2].forEach((t) => {
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
  });

  /**
   * ### Uniform 変数の定義
   * フラグメントシェーダーに渡すパラメータ群。
   * Three.js では { value: 値 } の形式で定義する。
   *
   * | uniform 名 | 型 | 用途 |
   * |---|---|---|
   * | u_texture1 | sampler2D | 画像A（デフォルト表示） |
   * | u_texture2 | sampler2D | 画像B（ホバー時表示） |
   * | u_displacement | sampler2D | ノイズテクスチャ（歪み用） |
   * | u_progress | float | 0.0〜1.0 のトランジション進行度 |
   * | u_resolution | vec2 | カードのワールドサイズ |
   * | u_imageResolution | vec2 | 元画像の解像度 |
   * | u_distortionStrength | float | 歪みの強さ |
   *
   * ### u_progress が核心
   * GSAP がこの値を 0→1（ホバーイン）/ 1→0（ホバーアウト）に
   * アニメーションすることで、シェーダーが中間フレームを自動生成する。
   */
  const uniforms = {
    u_texture1: { value: tex1 },
    u_texture2: { value: tex2 },
    u_displacement: { value: displacementTexture },
    u_progress: { value: 0.0 },
    u_resolution: { value: new THREE.Vector2(CARD_WIDTH, CARD_HEIGHT) },
    u_imageResolution: { value: IMAGE_RESOLUTION.clone() },
    u_distortionStrength: { value: DISTORTION_STRENGTH },
  };

  /**
   * ### THREE.PlaneGeometry
   * 四角い平面のジオメトリ（形状データ）を生成する。
   *
   * @param CARD_WIDTH - 横幅
   * @param CARD_HEIGHT - 縦幅
   * @param 1 - X方向の分割数。1 = 最小（四角形2つの三角形で構成）。
   *            分割を増やすと頂点シェーダーで変形できるが、今回は不要。
   * @param 1 - Y方向の分割数。
   *
   * ### なぜ PlaneGeometry か
   * カード型 UI は本質的に「テクスチャを貼った平面」。
   * BoxGeometry（立方体）や SphereGeometry（球）ではなく、
   * 最もシンプルな PlaneGeometry を使う。
   */
  const geometry = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT, 1, 1);

  /**
   * ### THREE.ShaderMaterial
   * Three.js 組み込みのマテリアル（MeshBasicMaterial 等）ではなく、
   * 自分で書いた GLSL シェーダーを使うためのマテリアル。
   *
   * @param vertexShader - 頂点シェーダーのGLSLコード（文字列）
   * @param fragmentShader - フラグメントシェーダーのGLSLコード（文字列）
   * @param uniforms - CPU → GPU に渡すパラメータ
   * @param transparent - true にすると alpha < 1.0 のピクセルが透過する
   *
   * ### シェーダーの2段階処理
   * ```
   * 頂点シェーダー: 各頂点の位置を決める（どこに描画するか）
   *     ↓
   * ラスタライザ: 三角形内部のピクセルを補間（GPU が自動処理）
   *     ↓
   * フラグメントシェーダー: 各ピクセルの色を決める（何色にするか）
   * ```
   */
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
  });

  /**
   * ### THREE.Mesh
   * Geometry + Material = 画面上に描画されるオブジェクト。
   * scene.add(mesh) でシーンに追加すると、レンダリング対象になる。
   */
  const mesh = new THREE.Mesh(geometry, material);

  /**
   * カードの X 座標を計算して配置。
   *
   * i=0: startX + 0 * (CARD_WIDTH + GAP) = startX
   * i=1: startX + 1 * (CARD_WIDTH + GAP) = startX + CARD_WIDTH + GAP
   * i=2: startX + 2 * (CARD_WIDTH + GAP) = startX + 2*(CARD_WIDTH + GAP)
   *
   * → 等間隔に並ぶ。
   */
  mesh.position.x = startX + i * (CARD_WIDTH + GAP);

  scene.add(mesh);
  cards.push({ mesh, uniforms, tween: null, isHovered: false });
});

// ---------------------------------------------------------------------------
// Raycaster によるホバー検知
// ---------------------------------------------------------------------------

/**
 * ### THREE.Raycaster
 * 3D 空間で「レイ（光線）」を飛ばし、交差するオブジェクトを検出する。
 * マウス位置 → カメラ → 3D空間のレイに変換し、
 * どのメッシュにヒットしたかを判定する。
 *
 * ### なぜ DOM イベント（click, hover）ではダメか
 * Three.js のオブジェクトは DOM 要素ではないため、
 * CSS の :hover やイベントリスナーが使えない。
 * 代わりに Raycaster で 3D 空間でのヒット判定を行う。
 *
 * ### パフォーマンス
 * Raycaster はメッシュの BoundingBox → 三角形 の順にテストするため、
 * 少数のメッシュなら十分高速。数千のオブジェクトがある場合は
 * Octree 等の空間分割が必要になる。
 */
const raycaster = new THREE.Raycaster();

/**
 * マウス座標を NDC（Normalized Device Coordinates）で保持する。
 *
 * ### NDC とは
 * 画面の座標を -1 ~ +1 の範囲に正規化したもの。
 * - x: -1（左端）〜 +1（右端）
 * - y: -1（下端）〜 +1（上端）
 *
 * Three.js の Raycaster.setFromCamera() がこの座標系を期待する。
 */
const mouse = new THREE.Vector2();

/** 現在ホバー中のカードのインデックス。-1 はどこにもホバーしていない状態。 */
let currentHoveredIndex = -1;

/**
 * マウス移動時のハンドラー。
 * マウス座標の変換 → レイキャスト → ホバー状態管理 → GSAP アニメーション起動
 * を一連で処理する。
 *
 * ### 処理フロー
 * ```
 * 1. ブラウザのマウス座標（px）→ NDC（-1~1）に変換
 * 2. Raycaster でレイを飛ばす
 * 3. カードとの交差判定
 * 4. ホバー状態が変わったら:
 *    - 前のカード: u_progress → 0.0 にトゥイーン（元に戻す）
 *    - 新しいカード: u_progress → 1.0 にトゥイーン（遷移開始）
 * ```
 *
 * @param e - MouseEvent オブジェクト。clientX/clientY でマウス位置を取得。
 */
function onMouseMove(e: MouseEvent) {
  /**
   * ### マウス座標の NDC 変換
   *
   * ブラウザのマウス座標:
   *   - e.clientX: 0（左端）〜 window.innerWidth（右端）
   *   - e.clientY: 0（上端）〜 window.innerHeight（下端）
   *
   * NDC に変換する式:
   *   x = (clientX / width) * 2 - 1    → -1 ~ +1
   *   y = -(clientY / height) * 2 + 1  → +1 ~ -1（Y軸反転！）
   *
   * Y軸が反転するのは、ブラウザは上が0・Three.jsは上が+1 のため。
   */
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  /**
   * Raycaster にカメラとマウス位置を渡してレイを設定。
   * カメラの位置・向き・FOV から、マウスが指す方向のレイが計算される。
   */
  raycaster.setFromCamera(mouse, camera);

  /**
   * intersectObjects でレイと交差するオブジェクトを取得。
   * 結果は距離順にソートされた配列。
   * intersects[0] が最も手前（カメラに近い）のヒット。
   */
  const intersects = raycaster.intersectObjects(cards.map((c) => c.mesh));

  /** ヒットしたカードのインデックスを特定する。 */
  let hoveredIndex = -1;
  if (intersects.length > 0) {
    hoveredIndex = cards.findIndex((c) => c.mesh === intersects[0].object);
  }

  /**
   * ホバー対象が変わった場合のみ処理する。
   * 同じカード上でマウスを動かしているだけなら何もしない。
   * これにより不要なアニメーション再起動を防ぐ。
   */
  if (hoveredIndex !== currentHoveredIndex) {
    /**
     * ### 前のカードのホバー解除処理
     * u_progress を 0.0 に戻すトゥイーンを開始。
     *
     * tween?.kill() で実行中のアニメーションを即座に中断。
     * これがないと、ホバーイン途中で離れた場合に
     * 2つのトゥイーンが競合してしまう。
     *
     * ### GSAP の gsap.to() パターン
     * gsap.to(対象オブジェクト, { プロパティ: 目標値, ... })
     * → 対象オブジェクトのプロパティを現在値から目標値へ補間する。
     *
     * ここでは card.uniforms.u_progress（= { value: 数値 }）の
     * value プロパティを 0.0 にアニメーションする。
     * シェーダーは毎フレーム u_progress.value を読むため、
     * GSAP が値を変えるだけで画面に反映される。
     */
    if (currentHoveredIndex >= 0) {
      const card = cards[currentHoveredIndex];
      card.isHovered = false;
      card.tween?.kill();
      card.tween = gsap.to(card.uniforms.u_progress, {
        value: 0.0,
        duration: TWEEN_DURATION,
        /**
         * ### イージング: power2.inOut
         * アニメーションの加速・減速カーブ。
         * - "linear": 一定速度
         * - "power2.inOut": 開始と終了が緩やか、中間が速い（二次曲線）
         *
         * これにより「ぬるっと始まり、ぬるっと終わる」自然な動きになる。
         */
        ease: "power2.inOut",
      });
    }

    /**
     * ### 新しいカードのホバー開始処理
     * u_progress を 1.0 にトゥイーン → シェーダーが画像Bに遷移。
     */
    if (hoveredIndex >= 0) {
      const card = cards[hoveredIndex];
      card.isHovered = true;
      card.tween?.kill();
      card.tween = gsap.to(card.uniforms.u_progress, {
        value: 1.0,
        duration: TWEEN_DURATION,
        ease: "power2.inOut",
      });
      canvas.style.cursor = "pointer";
    } else {
      canvas.style.cursor = "default";
    }

    currentHoveredIndex = hoveredIndex;
  }
}

/** mousemove イベントでフレームごとにホバーチェック。 */
canvas.addEventListener("mousemove", onMouseMove);

/**
 * ### mouseleave ハンドラー
 * マウスが canvas 領域から完全に離れたときのフォールバック。
 * mousemove だけだと、高速にマウスを動かした場合に
 * 「離れた」イベントを取りこぼすことがある。
 * mouseleave で確実にリセットする。
 */
canvas.addEventListener("mouseleave", () => {
  if (currentHoveredIndex >= 0) {
    const card = cards[currentHoveredIndex];
    card.isHovered = false;
    card.tween?.kill();
    card.tween = gsap.to(card.uniforms.u_progress, {
      value: 0.0,
      duration: TWEEN_DURATION,
      ease: "power2.inOut",
    });
  }
  currentHoveredIndex = -1;
  canvas.style.cursor = "default";
});

// ---------------------------------------------------------------------------
// リサイズ対応
// ---------------------------------------------------------------------------

/**
 * ウィンドウリサイズ時にレンダラーとカメラを更新。
 *
 * ### なぜ必要か
 * ウィンドウサイズが変わると:
 * 1. canvas の描画バッファサイズが古いまま → setSize で更新
 * 2. カメラのアスペクト比が古いまま → aspect を再設定
 * 3. 投影行列が古いまま → updateProjectionMatrix で再計算
 *
 * updateProjectionMatrix() を呼ばないと、
 * aspect を変更しても実際の描画に反映されない。
 */
window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});

// ---------------------------------------------------------------------------
// レンダーループ
// ---------------------------------------------------------------------------

/**
 * ### requestAnimationFrame ループ
 * ブラウザの画面更新タイミング（通常 60fps）に合わせて
 * 毎フレーム描画を行う無限ループ。
 *
 * ### なぜ setInterval ではなく requestAnimationFrame か
 * 1. ディスプレイのリフレッシュレートに同期する（ティアリング防止）
 * 2. タブが非表示のとき自動的に停止する（CPU/GPU 節約）
 * 3. ブラウザが最適なタイミングを選ぶ（バッテリー効率）
 *
 * ### 処理フロー（毎フレーム）
 * ```
 * 1. requestAnimationFrame が animate() を呼ぶ
 * 2. renderer.render() でシーン全体を再描画
 *    - 頂点シェーダーが各頂点の位置を計算
 *    - フラグメントシェーダーが各ピクセルの色を計算
 *    - u_progress は GSAP が裏で更新しているため、
 *      毎フレーム異なる値が参照され、アニメーションが進行する
 * 3. 次のフレームで再び animate() が呼ばれる
 * ```
 */
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
