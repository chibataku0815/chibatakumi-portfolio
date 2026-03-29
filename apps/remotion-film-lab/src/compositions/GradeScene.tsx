/**
 * @fileoverview Remotion 上で Film Lab の **解析グレード** と任意の **3D LUT（.cube）** をかける Three.js シーン。
 *
 * 主な仕様:
 * - 入力は **静止画**（既定 `film-lab-default.jpg`）または **動画**（`gradeSourceVideoRelPath` + `@remotion/media` の headless `Video`）。
 * - 動画は Canvas に縮小コピーして `CanvasTexture` に載せる（長辺 1920 上限でメモリを抑える）。
 * - フラグメントは **GLSL ES 1.0**。LUT は 2D パック＋トリリニア。
 * - ソースは **object-fit: cover** 相当（コンポ 1080×1920）。
 *
 * 制限事項:
 * - ブラウザ Film Lab の 8-pass は再現しない。
 */
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Video } from "@remotion/media";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  continueRender,
  delayRender,
  staticFile,
  useRemotionEnvironment,
} from "remotion";
import {
  packCubeLutToFloatRgbaGrid,
  parseCube,
  type FilmLookGradeInputProps,
} from "film-lab-core";

/** `Root.tsx` の Composition と揃える */
const COMPOSITION_WIDTH = 1080;
const COMPOSITION_HEIGHT = 1920;

/** 動画テクスチャの長辺上限（4K 直載せを避ける） */
const VIDEO_TEXTURE_MAX_SIDE = 1920;

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

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;
uniform sampler2D map;
uniform float uImageAspect;
uniform float uCompAspect;
uniform float uExposure;
uniform float uContrast;
uniform float uSaturation;
uniform float uTemperature;
uniform sampler2D uLUT2D;
uniform float uLutEnabled;
uniform float uLutIntensity;
uniform float uLutSize;
varying vec2 vUv;

vec2 coverUv(vec2 uv, float imgAspect, float compAspect) {
  vec2 scale = vec2(1.0);
  if (imgAspect > compAspect) {
    scale.x = compAspect / imgAspect;
  } else {
    scale.y = imgAspect / compAspect;
  }
  return (uv - 0.5) / scale + 0.5;
}

vec3 lutTexel(float r, float g, float b) {
  float n = uLutSize;
  vec2 uv = (vec2(r + g * n, b) + 0.5) / vec2(n * n, n);
  return texture2D(uLUT2D, uv).rgb;
}

vec3 sampleLutTrilinear(vec3 c) {
  float n = uLutSize;
  c = clamp(c, 0.0, 1.0);
  vec3 scaled = c * (n - 1.0);
  vec3 c0 = floor(scaled);
  vec3 f = scaled - c0;
  vec3 c1 = min(c0 + 1.0, vec3(n - 1.0));
  vec3 s000 = lutTexel(c0.x, c0.y, c0.z);
  vec3 s100 = lutTexel(c1.x, c0.y, c0.z);
  vec3 s010 = lutTexel(c0.x, c1.y, c0.z);
  vec3 s110 = lutTexel(c1.x, c1.y, c0.z);
  vec3 s001 = lutTexel(c0.x, c0.y, c1.z);
  vec3 s101 = lutTexel(c1.x, c0.y, c1.z);
  vec3 s011 = lutTexel(c0.x, c1.y, c1.z);
  vec3 s111 = lutTexel(c1.x, c1.y, c1.z);
  vec3 x0 = mix(s000, s100, f.x);
  vec3 x1 = mix(s010, s110, f.x);
  vec3 x2 = mix(s001, s101, f.x);
  vec3 x3 = mix(s011, s111, f.x);
  vec3 y0 = mix(x0, x1, f.y);
  vec3 y1 = mix(x2, x3, f.y);
  return mix(y0, y1, f.z);
}

vec3 adjustTemperature(vec3 c, float t) {
  return c + vec3(t * 0.05, t * 0.02, -t * 0.04);
}

void main() {
  vec2 uv = coverUv(vUv, uImageAspect, uCompAspect);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    vec4 tex = texture2D(map, uv);
    vec3 col = tex.rgb * pow(2.0, uExposure);
    col = (col - 0.5) * uContrast + 0.5;
    float l = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(l), col, uSaturation);
    col = adjustTemperature(col, uTemperature);
    if (uLutEnabled > 0.5) {
      vec3 lutRgb = sampleLutTrilinear(col);
      col = mix(col, lutRgb, uLutIntensity);
    }
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), tex.a);
  }
}
`;

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
 * 共有: シェーダー・LUT・フルスクリーンクアッド。
 */
function GradeBackdrop({
  input,
  mapTexture,
  imageAspect,
}: GradeBackdropProps) {
  const { grade, lutCubeRelPath, lutEnabled = true, lutIntensity = 1 } = input;

  const wantLut = Boolean(lutCubeRelPath) && lutEnabled !== false;
  const lutData = useCubeLutTexture(lutCubeRelPath, wantLut);

  const dummyLut = useMemo(() => createDummyLutTexture(), []);

  const compAspect = COMPOSITION_WIDTH / COMPOSITION_HEIGHT;

  const lutTextureEffective = lutData?.texture ?? dummyLut;
  const lutSizeUniform = lutData?.size ?? 2;
  const lutOn = wantLut && lutData !== null ? 1 : 0;

  const lutBlocking = wantLut && lutData === null;

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        map: { value: mapTexture },
        uImageAspect: { value: imageAspect },
        uCompAspect: { value: compAspect },
        uExposure: { value: 0 },
        uContrast: { value: 1 },
        uSaturation: { value: 1 },
        uTemperature: { value: 0 },
        uLUT2D: { value: dummyLut },
        uLutEnabled: { value: 0 },
        uLutIntensity: { value: 1 },
        uLutSize: { value: 2 },
      },
      vertexShader,
      fragmentShader,
    });
  }, [mapTexture, dummyLut, imageAspect, compAspect]);

  useFrame(() => {
    if (lutBlocking) {
      return;
    }
    material.uniforms.map.value = mapTexture;
    material.uniforms.uImageAspect.value = imageAspect;
    material.uniforms.uCompAspect.value = compAspect;
    material.uniforms.uExposure.value = grade.exposure;
    material.uniforms.uContrast.value = grade.contrast;
    material.uniforms.uSaturation.value = grade.saturation;
    material.uniforms.uTemperature.value = grade.temperature;
    material.uniforms.uLUT2D!.value = lutTextureEffective;
    material.uniforms.uLutEnabled!.value = lutOn;
    material.uniforms.uLutIntensity!.value = lutIntensity;
    material.uniforms.uLutSize!.value = lutSizeUniform;
  });

  return (
    <>
      <orthographicCamera
        makeDefault
        args={[-1, 1, 1, -1, 0.1, 10]}
        position={[0, 0, 1]}
      />
      {!lutBlocking ? (
        <mesh material={material}>
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
  const vw = props.gradeSourceVideoWidth ?? 3840;
  const vh = props.gradeSourceVideoHeight ?? 2160;

  const scale = Math.min(1, VIDEO_TEXTURE_MAX_SIDE / Math.max(vw, vh));
  const cw = Math.max(1, Math.round(vw * scale));
  const ch = Math.max(1, Math.round(vh * scale));
  /** テクスチャのピクセル縦横比（cover 描画後もキャンバス全体がこの比率） */
  const textureAspect = cw / Math.max(1, ch);

  const [canvasStuff] = useState(() => {
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error(
        "GradeSceneVideo: 2D context を取得できません（document.createElement('canvas')）",
      );
    }
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, cw, ch);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return { canvas, ctx, texture };
  });

  const { advance, invalidate } = useThree();
  const { isRendering } = useRemotionEnvironment();

  const onVideoFrame = useCallback(
    (frame: CanvasImageSource) => {
      drawFrameCoverToCanvas(canvasStuff.ctx, frame, cw, ch);
      canvasStuff.texture.needsUpdate = true;
      if (isRendering) {
        advance(performance.now());
      } else {
        invalidate();
      }
    },
    [canvasStuff.ctx, canvasStuff.texture, cw, ch, advance, invalidate, isRendering],
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
        imageAspect={textureAspect}
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
