import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { RoundedBox } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { MathUtils } from "three";
import { COLORS } from "../../lib/colors";
import { filmtoneFadeIn } from "../../lib/transitions";
import { SAFE_ZONE } from "../../lib/safeZone";
import { FONTS, TYPE_SCALE } from "../../lib/typography";

/**
 * #8 Three.js game ranking の実装です。
 *
 * 概要:
 * - prompt の「tower + camera rise」を短く学ぶための 3D study です
 * - Filmtone に直結しないため、3D を長く見せるのではなく camera motion の骨格だけを取り出します
 *
 * 主な仕様:
 * - 20 本の tower を階段状に積み上げます
 * - camera は bottom rank から top rank へ上がり、各 rank で短く pause します
 *
 * 制限事項:
 * - ranking data は motion study 用の placeholder です
 * - title text は 2D overlay に置き、3D scene 内では tower の量感だけを見せます
 */

/**
 * 1 本分の rank data です。
 *
 * @property {number} rank 表示順位です。
 * @property {string} label overlay に出す名称です。
 * @property {number} copiesMillion 売上本数の placeholder 値です。
 */
interface RankedEntry {
  rank: number;
  label: string;
  copiesMillion: number;
}

/**
 * 20 本分の placeholder ranking です。
 *
 * 主な仕様:
 * - 正確なランキング再現ではなく、height の差を出すための連続データです
 */
const rankedEntries: readonly RankedEntry[] = [
  { rank: 20, label: "Rank 20", copiesMillion: 14.2 },
  { rank: 19, label: "Rank 19", copiesMillion: 15.0 },
  { rank: 18, label: "Rank 18", copiesMillion: 15.8 },
  { rank: 17, label: "Rank 17", copiesMillion: 16.7 },
  { rank: 16, label: "Rank 16", copiesMillion: 17.8 },
  { rank: 15, label: "Rank 15", copiesMillion: 19.1 },
  { rank: 14, label: "Rank 14", copiesMillion: 20.3 },
  { rank: 13, label: "Rank 13", copiesMillion: 22.4 },
  { rank: 12, label: "Rank 12", copiesMillion: 24.2 },
  { rank: 11, label: "Rank 11", copiesMillion: 26.5 },
  { rank: 10, label: "Rank 10", copiesMillion: 28.0 },
  { rank: 9, label: "Rank 09", copiesMillion: 30.7 },
  { rank: 8, label: "Rank 08", copiesMillion: 33.1 },
  { rank: 7, label: "Rank 07", copiesMillion: 35.4 },
  { rank: 6, label: "Rank 06", copiesMillion: 38.9 },
  { rank: 5, label: "Rank 05", copiesMillion: 42.5 },
  { rank: 4, label: "Rank 04", copiesMillion: 47.1 },
  { rank: 3, label: "Rank 03", copiesMillion: 52.3 },
  { rank: 2, label: "Rank 02", copiesMillion: 58.8 },
  { rank: 1, label: "Rank 01", copiesMillion: 68.0 },
] as const;

/**
 * frame から camera focus index を求めます。
 *
 * 概要:
 * - 1 rank ごとに「move -> short hold」を繰り返します
 * - full tour ではなく、短い上昇と pause のリズムだけを検証します
 *
 * @param {number} frame 現在フレームです。
 * @returns {number} 0-19 の連続 index です。
 */
function getCameraFocusIndex(frame: number): number {
  const introFrames = 18;
  const segmentFrames = 8;
  const moveFrames = 5;
  const localFrame = Math.max(0, frame - introFrames);
  const segmentIndex = Math.min(
    rankedEntries.length - 1,
    Math.floor(localFrame / segmentFrames),
  );
  const segmentFrame = localFrame % segmentFrames;
  const moveProgress = segmentFrame >= moveFrames ? 1 : segmentFrame / moveFrames;
  const easedProgress = Easing.inOut(Easing.cubic)(moveProgress);

  return Math.min(rankedEntries.length - 1, segmentIndex + easedProgress);
}

/**
 * tower に使う warm color を返します。
 *
 * @param {number} index 配列 index です。
 * @returns {string} tower material に使う色です。
 */
function getTowerColor(index: number): string {
  const lightness = 32 + index * 2.2;
  return `hsl(31 78% ${lightness}%)`;
}

/**
 * camera を動かす rig です。
 *
 * @returns {null} 描画物は持たず、camera だけ更新します。
 */
function CameraRig(): null {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  const focusIndex = getCameraFocusIndex(frame);
  const nearestIndex = Math.min(
    rankedEntries.length - 1,
    Math.max(0, Math.round(focusIndex)),
  );
  const focusY = nearestIndex * 2.8;
  const desiredX = 9.8;
  const desiredY = 3.2 + focusY;
  const desiredZ = 17.5;

  camera.position.x = MathUtils.lerp(camera.position.x, desiredX, 0.22);
  camera.position.y = MathUtils.lerp(camera.position.y, desiredY, 0.22);
  camera.position.z = MathUtils.lerp(camera.position.z, desiredZ, 0.22);
  camera.lookAt(0, focusY + 1.4, 0);

  return null;
}

/**
 * tower 群の描画です。
 *
 * @returns {React.ReactElement} 3D tower scene です。
 */
function RankingTrack(): React.ReactElement {
  const frame = useCurrentFrame();
  const focusIndex = getCameraFocusIndex(frame);

  return (
    <>
      <color attach="background" args={[COLORS.bgDeep]} />
      <fog attach="fog" args={[COLORS.bgDeep, 16, 42]} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[8, 12, 14]} intensity={1.8} color={COLORS.warmWhite} />
      <pointLight position={[0, 26, 8]} intensity={1.3} color={COLORS.amber} />

      {rankedEntries.map((entry, index) => {
        const levelY = index * 2.8;
        const towerHeight = 1.2 + entry.copiesMillion * 0.11;
        const highlightStrength = Math.max(0, 1 - Math.abs(focusIndex - index) / 2.5);
        const scale = 1 + highlightStrength * 0.06;
        const towerColor = getTowerColor(index);

        return (
          <group key={entry.rank} position={[0, levelY, 0]}>
            <RoundedBox args={[6.4, 0.18, 2.4]} radius={0.08} smoothness={4} position={[0, -0.09, 0]}>
              <meshStandardMaterial
                color="#1a1715"
                metalness={0.22}
                roughness={0.82}
              />
            </RoundedBox>
            <RoundedBox
              args={[1.55, towerHeight, 1.55]}
              radius={0.14}
              smoothness={4}
              position={[0, towerHeight / 2, 0]}
              scale={[scale, scale, scale]}
            >
              <meshStandardMaterial
                color={towerColor}
                emissive={COLORS.amber}
                emissiveIntensity={0.12 + highlightStrength * 0.55}
                metalness={0.18}
                roughness={0.52}
              />
            </RoundedBox>
            <RoundedBox
              args={[1.92, 0.14, 1.92]}
              radius={0.08}
              smoothness={4}
              position={[0, towerHeight + 0.18, 0]}
            >
              <meshStandardMaterial
                color={COLORS.warmWhite}
                emissive={COLORS.cream}
                emissiveIntensity={0.06 + highlightStrength * 0.18}
                metalness={0.06}
                roughness={0.44}
              />
            </RoundedBox>
          </group>
        );
      })}
    </>
  );
}

/**
 * 現在フォーカス中の rank 情報を返します。
 *
 * @param {number} frame 現在フレームです。
 * @returns {RankedEntry} overlay で使う entry です。
 */
function getActiveEntry(frame: number): RankedEntry {
  const focusIndex = getCameraFocusIndex(frame);
  const nearestIndex = Math.min(
    rankedEntries.length - 1,
    Math.max(0, Math.round(focusIndex)),
  );
  return rankedEntries[nearestIndex];
}

/**
 * 2D overlay です。
 *
 * 概要:
 * - 3D の中に text を増やさず、今見ている rank だけを 2D で補助します
 *
 * @returns {React.ReactElement} overlay 部分です。
 */
function RankingOverlay(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const activeEntry = getActiveEntry(frame);
  const titleOpacity = filmtoneFadeIn(frame, 0, fps, 0.7);
  const panelOpacity = filmtoneFadeIn(frame, 14, fps, 0.7);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: SAFE_ZONE.horizontal.left,
          top: SAFE_ZONE.horizontal.top,
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
          three.js game ranking
        </div>
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: TYPE_SCALE.heading + 2,
            lineHeight: 1.04,
            fontWeight: 700,
            color: COLORS.warmWhite,
            marginTop: 14,
          }}
        >
          Camera rise study
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: SAFE_ZONE.horizontal.left,
          bottom: SAFE_ZONE.horizontal.bottom + 8,
          width: 340,
          padding: "20px 22px",
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(24, 19, 17, 0.78)",
          opacity: panelOpacity,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: COLORS.textSubtle,
          }}
        >
          active rank
        </div>
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 54,
            fontWeight: 700,
            color: COLORS.warmWhite,
            marginTop: 6,
          }}
        >
          #{activeEntry.rank}
        </div>
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 24,
            fontWeight: 600,
            color: COLORS.textPrimary,
            marginTop: 6,
          }}
        >
          {activeEntry.label}
        </div>
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 18,
            color: COLORS.textMuted,
            marginTop: 6,
          }}
        >
          {activeEntry.copiesMillion.toFixed(1)}M copies
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: SAFE_ZONE.horizontal.right,
          top: SAFE_ZONE.horizontal.top + 10,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {rankedEntries.map((entry) => {
          const active = entry.rank === activeEntry.rank;
          return (
            <div
              key={entry.rank}
              style={{
                width: active ? 52 : 32,
                height: 6,
                borderRadius: 999,
                backgroundColor: active ? COLORS.amber : "rgba(255,255,255,0.12)",
                transition: "width 120ms linear",
              }}
            />
          );
        })}
      </div>
    </>
  );
}

/**
 * Three ranking の本体です。
 *
 * @returns {React.ReactElement} Three.js ranking composition です。
 */
export function ThreeRanking(): React.ReactElement {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      <ThreeCanvas width={1920} height={1080}>
        <CameraRig />
        <RankingTrack />
      </ThreeCanvas>
      <RankingOverlay />
    </AbsoluteFill>
  );
}
