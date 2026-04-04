import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { RoundedBox } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { MathUtils } from "three";
import { COLORS } from "../../lib/colors";
import { filmtoneFadeIn } from "../../lib/transitions";
import { SAFE_ZONE } from "../../lib/safeZone";
import { FONTS, TYPE_SCALE } from "../../lib/typography";

/**
 * #2 Travel route + 3D landmarks の実装です。
 *
 * 概要:
 * - no-API-key-first を守るため、map は static SVG で構成します
 * - 3D は最後の Paris scene で短く差し込み、3D World Tour にならないようにします
 *
 * 主な仕様:
 * - LA -> NY -> Paris の順で route を描きます
 * - map の pan / zoom は route head を追う最小構成です
 *
 * 制限事項:
 * - 実地図 SDK やタイル画像は使いません
 * - landmark は抽象化した 3D silhouette で、観光映像のような長尺演出はしません
 */

/**
 * map 上の都市ポイントです。
 *
 * @property {string} name 都市名です。
 * @property {number} x X 座標です。
 * @property {number} y Y 座標です。
 */
interface MapPoint {
  name: string;
  x: number;
  y: number;
}

/**
 * quadratic route の定義です。
 *
 * @property {MapPoint} start 始点です。
 * @property {MapPoint} end 終点です。
 * @property {MapPoint} control 曲率を決める control point です。
 * @property {number} startFrame route の開始フレームです。
 * @property {number} durationInFrames route を描くフレーム数です。
 */
interface RouteSegment {
  start: MapPoint;
  end: MapPoint;
  control: MapPoint;
  startFrame: number;
  durationInFrames: number;
}

const laPoint: MapPoint = { name: "Los Angeles", x: 354, y: 494 };
const nyPoint: MapPoint = { name: "New York", x: 632, y: 420 };
const parisPoint: MapPoint = { name: "Paris", x: 980, y: 334 };

const routeSegments: readonly RouteSegment[] = [
  {
    start: laPoint,
    end: nyPoint,
    control: { name: "North Arc", x: 504, y: 292 },
    startFrame: 54,
    durationInFrames: 78,
  },
  {
    start: nyPoint,
    end: parisPoint,
    control: { name: "Atlantic Arc", x: 810, y: 180 },
    startFrame: 136,
    durationInFrames: 64,
  },
] as const;

/**
 * quadratic curve 上の点を返します。
 *
 * @param {MapPoint} start 始点です。
 * @param {MapPoint} control control point です。
 * @param {MapPoint} end 終点です。
 * @param {number} t 0-1 の進行度です。
 * @returns {{ x: number; y: number }} curve 上の点です。
 */
function getCurvePoint(
  start: MapPoint,
  control: MapPoint,
  end: MapPoint,
  t: number,
): { x: number; y: number } {
  const oneMinusT = 1 - t;

  return {
    x:
      oneMinusT * oneMinusT * start.x +
      2 * oneMinusT * t * control.x +
      t * t * end.x,
    y:
      oneMinusT * oneMinusT * start.y +
      2 * oneMinusT * t * control.y +
      t * t * end.y,
  };
}

/**
 * route の SVG path です。
 *
 * @param {RouteSegment} segment route 定義です。
 * @returns {string} SVG path 文字列です。
 */
function buildRoutePath(segment: RouteSegment): string {
  return `M ${segment.start.x} ${segment.start.y} Q ${segment.control.x} ${segment.control.y} ${segment.end.x} ${segment.end.y}`;
}

/**
 * 現在フレームで map が注目すべき点を返します。
 *
 * @param {number} frame 現在フレームです。
 * @returns {{ x: number; y: number; scale: number }} focus 点と scale です。
 */
function getMapFocus(frame: number): { x: number; y: number; scale: number } {
  if (frame < routeSegments[0].startFrame) {
    return { x: laPoint.x, y: laPoint.y, scale: 1.42 };
  }

  if (frame < routeSegments[1].startFrame) {
    const progress = interpolate(
      frame,
      [routeSegments[0].startFrame, routeSegments[0].startFrame + routeSegments[0].durationInFrames],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
      },
    );
    const point = getCurvePoint(
      routeSegments[0].start,
      routeSegments[0].control,
      routeSegments[0].end,
      progress,
    );
    return { x: point.x, y: point.y, scale: interpolate(progress, [0, 1], [1.36, 1.16]) };
  }

  if (frame < 214) {
    const progress = interpolate(
      frame,
      [routeSegments[1].startFrame, routeSegments[1].startFrame + routeSegments[1].durationInFrames],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
      },
    );
    const point = getCurvePoint(
      routeSegments[1].start,
      routeSegments[1].control,
      routeSegments[1].end,
      progress,
    );
    return { x: point.x, y: point.y, scale: interpolate(progress, [0, 1], [1.12, 1.02]) };
  }

  return { x: parisPoint.x, y: parisPoint.y, scale: 1.04 };
}

/**
 * scene 全体の map card です。
 *
 * @returns {React.ReactElement} SVG map card です。
 */
function MapCard(): React.ReactElement {
  const frame = useCurrentFrame();
  const focus = getMapFocus(frame);
  const routeOpacity = filmtoneFadeIn(frame, 30, 30, 0.8);
  const mapTranslateX = interpolate(focus.x, [0, 1280], [380, -540]);
  const mapTranslateY = interpolate(focus.y, [0, 720], [230, -190]);

  return (
    <div
      style={{
        position: "relative",
        width: 1240,
        height: 720,
        borderRadius: 28,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          "radial-gradient(circle at 50% 0%, rgba(217, 119, 6, 0.12) 0%, rgba(12, 10, 9, 0) 34%), #171412",
        boxShadow: "0 28px 80px rgba(0, 0, 0, 0.32)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${mapTranslateX}px, ${mapTranslateY}px) scale(${focus.scale})`,
          transformOrigin: "50% 50%",
        }}
      >
        <svg width="1280" height="720" style={{ position: "absolute", inset: 0 }}>
          <rect x="0" y="0" width="1280" height="720" fill="transparent" />
          <path
            d="M120 204 C172 158 252 140 318 148 C356 154 380 174 406 202 C430 228 456 240 498 242 C530 244 560 232 588 220 C616 208 648 206 676 222 C700 236 712 260 700 286 C690 306 664 318 638 326 C606 336 580 356 566 384 C552 410 522 430 482 436 C432 444 380 432 332 414 C286 396 236 390 196 372 C144 348 112 304 110 256 C108 234 110 220 120 204 Z"
            fill="rgba(255,255,255,0.08)"
          />
          <path
            d="M792 208 C824 190 866 186 900 194 C926 200 944 216 954 236 C966 258 990 270 1022 272 C1048 274 1072 266 1094 256 C1122 242 1156 238 1182 250 C1212 264 1224 292 1216 320 C1208 346 1186 366 1158 378 C1126 392 1096 400 1068 412 C1038 426 1006 440 966 438 C926 436 888 422 856 396 C826 372 804 340 796 304 C790 276 790 228 792 208 Z"
            fill="rgba(255,255,255,0.08)"
          />
          <path
            d="M904 452 C930 438 962 434 990 444 C1012 452 1028 468 1036 490 C1048 520 1026 552 992 562 C962 570 928 556 910 530 C892 504 888 468 904 452 Z"
            fill="rgba(255,255,255,0.06)"
          />

          {routeSegments.map((segment) => {
            const activeFrame = frame - segment.startFrame;
            const progress = interpolate(activeFrame, [0, segment.durationInFrames], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.inOut(Easing.cubic),
            });
            const head = getCurvePoint(segment.start, segment.control, segment.end, progress);
            const path = buildRoutePath(segment);
            const trailOffsets = [0, 0.12, 0.24, 0.36];

            return (
              <g key={segment.start.name}>
                <path
                  d={path}
                  fill="none"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth={2}
                />
                <path
                  d={path}
                  fill="none"
                  stroke={COLORS.amber}
                  strokeWidth={3.2}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={`${progress} 1`}
                  opacity={routeOpacity}
                />
                {trailOffsets.map((offset, index) => {
                  const trailT = Math.max(0, progress - offset);
                  const point = getCurvePoint(
                    segment.start,
                    segment.control,
                    segment.end,
                    trailT,
                  );
                  const opacity = Math.max(0, routeOpacity - index * 0.18);
                  return (
                    <circle
                      key={`${segment.start.name}-${offset}`}
                      cx={point.x}
                      cy={point.y}
                      r={10 - index * 1.5}
                      fill={index === 0 ? COLORS.cream : COLORS.amber}
                      opacity={opacity}
                    />
                  );
                })}
                <circle
                  cx={head.x}
                  cy={head.y}
                  r={6}
                  fill={COLORS.warmWhite}
                  opacity={routeOpacity}
                />
              </g>
            );
          })}

          {[laPoint, nyPoint, parisPoint].map((point) => {
            const pointActive =
              point.name === "Los Angeles"
                ? frame < routeSegments[0].startFrame
                : point.name === "New York"
                  ? frame >= routeSegments[0].startFrame + 38
                  : frame >= routeSegments[1].startFrame + 26;
            const pulse = pointActive ? 1 + Math.sin(frame / 10) * 0.1 : 1;
            return (
              <g key={point.name}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={16 * pulse}
                  fill={COLORS.amber}
                  opacity={pointActive ? 0.14 : 0}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={7}
                  fill={COLORS.warmWhite}
                />
                <text
                  x={point.x}
                  y={point.y - 18}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.70)"
                  fontFamily={FONTS.inter}
                  fontSize="15"
                  fontWeight="600"
                >
                  {point.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div
        style={{
          position: "absolute",
          left: 24,
          top: 22,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: COLORS.amber,
          }}
        >
          map route study
        </div>
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 30,
            fontWeight: 700,
            color: COLORS.warmWhite,
          }}
        >
          LA to NY to Paris
        </div>
      </div>
    </div>
  );
}

/**
 * 3D の Eiffel accent 用 camera rig です。
 *
 * @returns {null} camera 更新のみを行います。
 */
function EiffelCameraRig(): null {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  const orbit = Math.sin(frame / 28) * 0.45;
  const rise = interpolate(frame, [0, 60], [0.4, 1.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  camera.position.x = MathUtils.lerp(camera.position.x, orbit * 3.2, 0.14);
  camera.position.y = MathUtils.lerp(camera.position.y, 5.6 + rise, 0.14);
  camera.position.z = MathUtils.lerp(camera.position.z, 10.4, 0.14);
  camera.lookAt(0, 3.8, 0);

  return null;
}

/**
 * Eiffel tower を抽象化した silhouette です。
 *
 * @returns {React.ReactElement} 短い landmark accent です。
 */
function EiffelAccent(): React.ReactElement {
  const frame = useCurrentFrame();
  const rotateY = Math.sin(frame / 22) * 0.12;

  return (
    <>
      <color attach="background" args={["#15110f"]} />
      <ambientLight intensity={1.25} />
      <directionalLight position={[5, 10, 8]} intensity={1.7} color={COLORS.warmWhite} />
      <pointLight position={[0, 5, 3]} intensity={1.3} color={COLORS.amber} />

      <group rotation={[0, rotateY, 0]}>
        <RoundedBox args={[5.8, 0.18, 5.8]} radius={0.08} smoothness={4} position={[0, -0.09, 0]}>
          <meshStandardMaterial color="#1d1815" roughness={0.84} metalness={0.16} />
        </RoundedBox>

        <mesh position={[-1.5, 1.5, 0]} rotation={[0, 0, 0.24]}>
          <boxGeometry args={[0.26, 5.2, 0.26]} />
          <meshStandardMaterial color={COLORS.amber} emissive={COLORS.amber} emissiveIntensity={0.22} />
        </mesh>
        <mesh position={[1.5, 1.5, 0]} rotation={[0, 0, -0.24]}>
          <boxGeometry args={[0.26, 5.2, 0.26]} />
          <meshStandardMaterial color={COLORS.amber} emissive={COLORS.amber} emissiveIntensity={0.22} />
        </mesh>

        <mesh position={[-0.9, 4.0, 0]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.2, 3.0, 0.2]} />
          <meshStandardMaterial color={COLORS.cream} emissive={COLORS.cream} emissiveIntensity={0.16} />
        </mesh>
        <mesh position={[0.9, 4.0, 0]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[0.2, 3.0, 0.2]} />
          <meshStandardMaterial color={COLORS.cream} emissive={COLORS.cream} emissiveIntensity={0.16} />
        </mesh>

        <mesh position={[0, 6.4, 0]}>
          <boxGeometry args={[1.3, 0.24, 0.24]} />
          <meshStandardMaterial color={COLORS.cream} emissive={COLORS.cream} emissiveIntensity={0.18} />
        </mesh>
        <mesh position={[0, 7.7, 0]}>
          <boxGeometry args={[0.26, 2.2, 0.26]} />
          <meshStandardMaterial color={COLORS.warmWhite} emissive={COLORS.cream} emissiveIntensity={0.12} />
        </mesh>
      </group>
    </>
  );
}

/**
 * Paris 側の detail card です。
 *
 * @returns {React.ReactElement} map + 3D hybrid の右側カードです。
 */
function LandmarkPanel(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = filmtoneFadeIn(frame, 196, fps, 0.7);

  return (
    <div
      style={{
        width: 540,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        opacity,
      }}
    >
      <div
        style={{
          padding: "20px 22px",
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(24, 19, 17, 0.78)",
        }}
      >
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: COLORS.amber,
          }}
        >
          landmark accent
        </div>
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 34,
            lineHeight: 1.1,
            fontWeight: 700,
            color: COLORS.warmWhite,
            marginTop: 10,
          }}
        >
          Paris endpoint
        </div>
        <div
          style={{
            fontFamily: FONTS.mixed,
            fontSize: 17,
            lineHeight: 1.55,
            color: COLORS.textMuted,
            marginTop: 12,
          }}
        >
          map は route を追うためだけに使い、
          <br />
          3D は最後の landmark accent だけに留める。
        </div>
      </div>

      <div
        style={{
          width: 540,
          height: 420,
          overflow: "hidden",
          borderRadius: 26,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.24)",
          backgroundColor: "#15110f",
        }}
      >
        <ThreeCanvas width={540} height={420}>
          <EiffelCameraRig />
          <EiffelAccent />
        </ThreeCanvas>
      </div>
    </div>
  );
}

/**
 * Travel route の本体です。
 *
 * @returns {React.ReactElement} Travel route composition です。
 */
export function TravelRoute(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOpacity = filmtoneFadeIn(frame, 0, fps, 0.8);
  const subtitleOpacity = filmtoneFadeIn(frame, 8, fps, 0.8);

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 85% 0%, rgba(217, 119, 6, 0.12) 0%, rgba(12, 10, 9, 0) 32%), #0c0a09",
        padding: `${SAFE_ZONE.horizontal.top}px ${SAFE_ZONE.horizontal.left}px`,
        gap: 28,
      }}
    >
      <div
        style={{
          marginBottom: 24,
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 14,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: COLORS.amber,
          }}
        >
          travel route + 3d landmark
        </div>
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: TYPE_SCALE.heading + 2,
            fontWeight: 700,
            lineHeight: 1.04,
            color: COLORS.warmWhite,
            marginTop: 14,
          }}
        >
          Map first, then one accent.
        </div>
        <div
          style={{
            fontFamily: FONTS.mixed,
            fontSize: TYPE_SCALE.body - 6,
            lineHeight: 1.5,
            color: COLORS.textMuted,
            marginTop: 14,
            maxWidth: 700,
            opacity: subtitleOpacity,
          }}
        >
          LA から NY、そして Paris へ。camera は route を追い、
          最後に landmark を短く置いて締める。
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 28,
        }}
      >
        <MapCard />
        <LandmarkPanel />
      </div>
    </AbsoluteFill>
  );
}
