/**
 * @fileoverview Remotion 上で Film Lab の **解析グレード** と任意の **.cube LUT（2D パック）** をかける Three.js シーン。
 *
 * 主な仕様:
 * - 入力は **静止画**（既定 `film-lab-default.jpg`）または **動画**（`gradeSourceVideoRelPath` + `@remotion/media` の headless `Video`）。
 * - 動画は Canvas に縮小コピーして `CanvasTexture` に載せる（長辺 1920 上限でメモリを抑える）。
 * - **多パス**: ブラウザ `Viewport.ts` と同順（grade+LUT → bloom しきい値+ブラー×2 → halation+ブラー×2 → composite）。シェーダは `apps/web` の bloom/halation/blur/composite を流用。
 * - Pass1 のグレードは GLSL3・2D LUT＋トリリニア（`gradeOnlyMultipass.frag.ts`）。
 * - ソースは **object-fit: cover** 相当（コンポ 1080×1920）。
 *
 * 制限事項:
 * - ブラウザ本番の filmlab.frag（3D LUT）とは LUT テクスチャ形式が異なる。
 * - composite の split / A+B 比較 UI は未使用（全画面合成のみ）。
 * - スプリットトーン（shadowHue 等）は未配線。
 */
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Video } from "@remotion/media";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import {
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useRemotionEnvironment,
} from "remotion";
import {
  hslToRgb01,
  packCubeLutToFloatRgbaGrid,
  parseCube,
  type FilmLookGradeInputProps,
} from "film-lab-core";
import { FilmLabRemotionPipeline } from "../filmLabRemotionPipeline";

/** `Root.tsx` の Composition と揃える */
const COMPOSITION_WIDTH = 1080;
const COMPOSITION_HEIGHT = 1920;

/** 動画テクスチャの長辺上限（4K 直載せを避ける） */
const VIDEO_TEXTURE_MAX_SIDE = 1920;

/**
 * デコード後のソース解像度から、CanvasTexture 用のキャンバス寸法とシェーダへ渡す縦横比を求める。
 * 長辺を {@link VIDEO_TEXTURE_MAX_SIDE} に収めるよう **均等スケール**する（縦動画でも props ヒントと無関係に正しいアスペクトになる）。
 */
function computeVideoTextureLayout(sourceW: number, sourceH: number): {
  cw: number;
  ch: number;
  srcAspect: number;
} {
  const w = Math.max(1, Math.round(sourceW));
  const h = Math.max(1, Math.round(sourceH));
  const scale = Math.min(1, VIDEO_TEXTURE_MAX_SIDE / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  return { cw, ch, srcAspect: w / h };
}

/**
 * `onVideoFrame` で渡る画像ソースの実ピクセル幅・高さを取得する。
 * コンテナのメタデータ（props）とデコード後の縦横が違うと `drawImage` 一発伸縮で破綻するため必須。
 */
function readCanvasImageSourceSize(source: CanvasImageSource): {
  w: number;
  h: number;
} {
  if (source instanceof HTMLVideoElement) {
    return {
      w: Math.max(1, source.videoWidth),
      h: Math.max(1, source.videoHeight),
    };
  }
  if (source instanceof HTMLImageElement) {
    return {
      w: Math.max(1, source.naturalWidth),
      h: Math.max(1, source.naturalHeight),
    };
  }
  if (source instanceof HTMLCanvasElement || source instanceof OffscreenCanvas) {
    return { w: Math.max(1, source.width), h: Math.max(1, source.height) };
  }
  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    return { w: Math.max(1, source.width), h: Math.max(1, source.height) };
  }
  if (typeof VideoFrame !== "undefined" && source instanceof VideoFrame) {
    return {
      w: Math.max(1, source.displayWidth),
      h: Math.max(1, source.displayHeight),
    };
  }
  return { w: 1, h: 1 };
}

/**
 * 動画フレームを **歪ませず** `cw`×`ch` に収める（CSS object-fit: cover と同じクロップ）。
 */
function drawFrameCoverToCanvas(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  cw: number,
  ch: number,
): void {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, cw, ch);
  const { w: fw, h: fh } = readCanvasImageSourceSize(source);
  if (fw < 2 || fh < 2) {
    return;
  }
  const srcAspect = fw / fh;
  const dstAspect = cw / ch;
  let sx = 0;
  let sy = 0;
  let sw = fw;
  let sh = fh;
  if (srcAspect > dstAspect) {
    sw = Math.round(fh * dstAspect);
    sx = Math.floor((fw - sw) / 2);
    sy = 0;
    sh = fh;
  } else {
    sh = Math.round(fw / dstAspect);
    sy = Math.floor((fh - sh) / 2);
    sx = 0;
    sw = fw;
  }
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, cw, ch);
}

/**
 * テクスチャのピクセル幅・高さ（composite の原画解像度・パイプライン入力用）。
 */
function readTexturePixelSize(tex: THREE.Texture): { w: number; h: number } {
  const img = tex.image as { width?: number; height?: number } | undefined;
  if (img && typeof img.width === "number" && typeof img.height === "number") {
    return {
      w: Math.max(1, img.width),
      h: Math.max(1, img.height),
    };
  }
  return { w: 1920, h: 1080 };
}

function createDummyLutTexture(): THREE.DataTexture {
  const d = new Float32Array(4);
  d[0] = 0;
  d[1] = 0;
  d[2] = 0;
  d[3] = 1;
  const t = new THREE.DataTexture(d, 1, 1, THREE.RGBAFormat, THREE.FloatType);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

function useCubeLutTexture(
  relPath: string | undefined,
  enabled: boolean,
): { texture: THREE.DataTexture; size: number } | null {
  const [packed, setPacked] = useState<{
    texture: THREE.DataTexture;
    size: number;
  } | null>(null);
  const disposedRef = useRef(false);
  const ownedTexRef = useRef<THREE.DataTexture | null>(null);

  useLayoutEffect(() => {
    disposedRef.current = false;
    const handle = delayRender("film-lab-cube-lut");

    const finish = () => {
      continueRender(handle);
    };

    if (ownedTexRef.current) {
      ownedTexRef.current.dispose();
      ownedTexRef.current = null;
    }
    setPacked(null);

    if (!relPath || !enabled) {
      finish();
      return () => {
        disposedRef.current = true;
        if (ownedTexRef.current) {
          ownedTexRef.current.dispose();
          ownedTexRef.current = null;
        }
      };
    }

    fetch(staticFile(relPath))
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `[GradeScene] fetch LUT failed: relPath=${relPath} status=${String(res.status)}`,
          );
        }
        return res.text();
      })
      .then((text) => {
        const cube = parseCube(text);
        const grid = packCubeLutToFloatRgbaGrid(cube);
        const created = new THREE.DataTexture(
          grid.data,
          grid.width,
          grid.height,
          THREE.RGBAFormat,
          THREE.FloatType,
        );
        created.minFilter = THREE.LinearFilter;
        created.magFilter = THREE.LinearFilter;
        created.wrapS = THREE.ClampToEdgeWrapping;
        created.wrapT = THREE.ClampToEdgeWrapping;
        created.colorSpace = THREE.NoColorSpace;
        created.needsUpdate = true;
        if (disposedRef.current) {
          created.dispose();
          finish();
          return;
        }
        ownedTexRef.current = created;
        setPacked({ texture: created, size: grid.size });
        finish();
      })
      .catch((err: unknown) => {
        console.error("[GradeScene] LUT load error:", err);
        setPacked(null);
        finish();
      });

    return () => {
      disposedRef.current = true;
      if (ownedTexRef.current) {
        ownedTexRef.current.dispose();
        ownedTexRef.current = null;
      }
    };
  }, [relPath, enabled]);

  return packed;
}

interface GradeBackdropProps {
  /** 親から渡す入力 props（grade / LUT 設定） */
  input: FilmLookGradeInputProps;
  /** ベースの色テクスチャ（画像または動画フレーム） */
  mapTexture: THREE.Texture;
  /** ソースの縦横比 width/height（cover 計算用・動画は元解像度ベース） */
  imageAspect: number;
}

/**
 * Viewport 相当の多パスを `FilmLabRemotionPipeline` で実行し、結果をフルスクリーンquadで表示する。
 */
function GradeBackdrop({
  input,
  mapTexture,
  imageAspect,
}: GradeBackdropProps) {
  const { gl } = useThree();
  const { grade, lutCubeRelPath, lutEnabled = true, lutIntensity = 1 } = input;
  const remotionFrame = useCurrentFrame();

  const wantLut = Boolean(lutCubeRelPath) && lutEnabled !== false;
  const lutData = useCubeLutTexture(lutCubeRelPath, wantLut);
  const dummyLut = useMemo(() => createDummyLutTexture(), []);

  const lutTextureEffective = lutData?.texture ?? dummyLut;
  const lutSizeUniform = lutData?.size ?? 2;
  const lutOn = wantLut && lutData !== null ? 1 : 0;
  const lutBlocking = wantLut && lutData === null;

  const halationColorVec3 = useMemo(() => {
    const { r, g, b } = hslToRgb01(grade.halationHue, 1, 0.5);
    return new THREE.Vector3(r, g, b);
  }, [grade.halationHue]);

  const pipeline = useMemo(
    () => new FilmLabRemotionPipeline(COMPOSITION_WIDTH, COMPOSITION_HEIGHT),
    [],
  );

  const displayMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        toneMapped: false,
      }),
    [],
  );

  useLayoutEffect(() => {
    return () => {
      pipeline.dispose();
      displayMaterial.dispose();
    };
  }, [pipeline, displayMaterial]);

  const compAspect = COMPOSITION_WIDTH / COMPOSITION_HEIGHT;

  useFrame(() => {
    if (lutBlocking) {
      return;
    }
    const { w, h } = readTexturePixelSize(mapTexture);
    pipeline.setInputTexture(mapTexture, w, h);
    pipeline.syncFromProps(
      grade,
      lutTextureEffective,
      lutOn,
      lutIntensity,
      lutSizeUniform,
      halationColorVec3,
      remotionFrame + 1.0,
    );
    pipeline.setCoverAspects(imageAspect, compAspect);
    pipeline.render(gl);
    const outTex = pipeline.getOutputTexture();
    displayMaterial.map = outTex;
    displayMaterial.needsUpdate = true;
  });

  return (
    <>
      <orthographicCamera
        makeDefault
        args={[-1, 1, 1, -1, 0.1, 10]}
        position={[0, 0, 1]}
      />
      {!lutBlocking ? (
        <mesh material={displayMaterial}>
          <planeGeometry args={[2, 2]} />
        </mesh>
      ) : null}
    </>
  );
}

function GradeSceneImage(props: FilmLookGradeInputProps) {
  const mapTexture = useTexture(staticFile("film-lab-default.jpg"));
  mapTexture.colorSpace = THREE.SRGBColorSpace;

  const imageAspect =
    mapTexture.image && "width" in mapTexture.image
      ? (mapTexture.image as { width: number; height: number }).width /
        Math.max(1, (mapTexture.image as { width: number; height: number }).height)
      : 1;

  return (
    <GradeBackdrop input={props} mapTexture={mapTexture} imageAspect={imageAspect} />
  );
}

/**
 * 動画ソース: `@remotion/media` のフレームを 2D Canvas に描き、`CanvasTexture` でシェーダへ渡す。
 */
function GradeSceneVideo(props: FilmLookGradeInputProps) {
  const rel = props.gradeSourceVideoRelPath!;
  const vwHint = props.gradeSourceVideoWidth ?? 3840;
  const vhHint = props.gradeSourceVideoHeight ?? 2160;

  const hintLayout = useMemo(
    () => computeVideoTextureLayout(vwHint, vhHint),
    [vwHint, vhHint],
  );

  const [layout, setLayout] = useState(hintLayout);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const canvasStuffRef = useRef<{
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    texture: THREE.CanvasTexture;
  } | null>(null);
  if (canvasStuffRef.current === null) {
    const canvas = document.createElement("canvas");
    canvas.width = hintLayout.cw;
    canvas.height = hintLayout.ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error(
        "GradeSceneVideo: 2D context を取得できません（document.createElement('canvas')）",
      );
    }
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    canvasStuffRef.current = { canvas, ctx, texture };
  }
  const canvasStuff = canvasStuffRef.current;

  const { advance, invalidate } = useThree();
  const { isRendering } = useRemotionEnvironment();

  const onVideoFrame = useCallback(
    (frame: CanvasImageSource) => {
      const { w: fw, h: fh } = readCanvasImageSourceSize(frame);
      if (fw < 2 || fh < 2) {
        return;
      }
      const next = computeVideoTextureLayout(fw, fh);
      const stuff = canvasStuffRef.current!;
      if (stuff.canvas.width !== next.cw || stuff.canvas.height !== next.ch) {
        stuff.canvas.width = next.cw;
        stuff.canvas.height = next.ch;
        stuff.ctx.fillStyle = "#000000";
        stuff.ctx.fillRect(0, 0, next.cw, next.ch);
      }
      drawFrameCoverToCanvas(stuff.ctx, frame, next.cw, next.ch);
      stuff.texture.needsUpdate = true;

      const prev = layoutRef.current;
      if (
        prev.cw !== next.cw ||
        prev.ch !== next.ch ||
        prev.srcAspect !== next.srcAspect
      ) {
        setLayout(next);
      }

      if (isRendering) {
        advance(performance.now());
      } else {
        invalidate();
      }
    },
    [advance, invalidate, isRendering],
  );

  return (
    <>
      <Video
        src={staticFile(rel)}
        muted
        headless
        loop
        delayRenderTimeoutInMilliseconds={180000}
        onVideoFrame={onVideoFrame}
      />
      <GradeBackdrop
        input={props}
        mapTexture={canvasStuff.texture}
        imageAspect={layout.srcAspect}
      />
    </>
  );
}

/**
 * FilmLookGrade から渡される props で画像または動画＋グレード＋任意 LUT を描画する。
 */
export function GradeScene(props: FilmLookGradeInputProps) {
  if (props.gradeSourceVideoRelPath) {
    return <GradeSceneVideo {...props} />;
  }
  return <GradeSceneImage {...props} />;
}
