"use client";

import { OrthographicCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type { Font } from "opentype.js";
import { useMemo } from "react";
import * as THREE from "three";
import { buildWordmarkLayers } from "@/features/hero/lib/wordmark-geometry";
import Background from "./Background";
import {
  type BackgroundType,
  type Palette,
  PRIMARY,
  SECONDARY,
} from "./candidates";

export type DisplayMode = "solid" | "wireframe" | "both";

export type SceneProps = {
  font: Font;
  fontSize: number;
  tracking: number;
  /** Stream A implements display mode branching. Phase 0 ignores this prop. */
  displayMode: DisplayMode;
  /** When false, the bounding-box debug frame is hidden. */
  frameVisible: boolean;
  /** Color palette applied to background, mesh fills, and wireframe lines. */
  palette: Palette;
  /**
   * Tier 2 Lever 5 — per-pair kerning overrides forwarded to buildWordmarkLayers.
   * Stream 1 implements the actual lookup inside the geometry layer.
   */
  kerningOverrides?: Record<string, number>;
  /**
   * Tier 2 Lever 8 — procedural background preset. Stream 2 implements the
   * actual shader inside Background.tsx.
   */
  backgroundType: BackgroundType;
};

function FrameBox({
  width,
  height,
  color,
  padX = 0.045,
  padY = 0.12,
}: {
  width: number;
  height: number;
  color: string;
  padX?: number;
  padY?: number;
}) {
  const geom = useMemo(() => {
    const w = width * (1 + padX * 2);
    const h = height * (1 + padY * 2);
    const hw = w / 2;
    const hh = h / 2;
    const points = [
      new THREE.Vector3(-hw, -hh, 0),
      new THREE.Vector3(hw, -hh, 0),
      new THREE.Vector3(hw, -hh, 0),
      new THREE.Vector3(hw, hh, 0),
      new THREE.Vector3(hw, hh, 0),
      new THREE.Vector3(-hw, hh, 0),
      new THREE.Vector3(-hw, hh, 0),
      new THREE.Vector3(-hw, -hh, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [width, height, padX, padY]);

  return (
    <lineSegments geometry={geom} position={[0, 0, 0]}>
      <lineBasicMaterial color={color} transparent opacity={0.06} />
    </lineSegments>
  );
}

function FittedOrthographicCamera({
  wordmarkWidth,
}: {
  wordmarkWidth: number;
}) {
  const size = useThree((s) => s.size);
  const zoom = wordmarkWidth > 0 ? (size.width * 0.8) / wordmarkWidth : 1;
  return (
    <OrthographicCamera
      makeDefault
      position={[0, 0, 100]}
      zoom={zoom}
      near={0.1}
      far={1000}
    />
  );
}

export default function Scene({
  font,
  fontSize,
  tracking,
  displayMode,
  frameVisible,
  palette,
  kerningOverrides,
  backgroundType,
}: SceneProps) {
  const showSolid = displayMode !== "wireframe";
  const showWireframe = displayMode !== "solid";

  const layers = useMemo(
    () =>
      buildWordmarkLayers({
        font,
        primary: PRIMARY,
        secondary: SECONDARY,
        fontSize,
        tracking,
        kerningOverrides,
      }),
    [font, fontSize, tracking, kerningOverrides],
  );

  const { primary, secondary, combinedBounds } = layers;

  return (
    <>
      <Background palette={palette} type={backgroundType} />
      <FittedOrthographicCamera wordmarkWidth={combinedBounds.width} />

      {frameVisible && (
        <FrameBox
          width={combinedBounds.width}
          height={combinedBounds.height}
          color="#f5f5f5"
        />
      )}

      {showSolid &&
        primary.shapeGeoms.map((g, i) => (
          <mesh key={`p-${i}`} geometry={g} position={[0, 0, 2]}>
            {/* DoubleSide MANDATORY — Y-flip inverts winding (see wordmark-geometry.ts) */}
            <meshBasicMaterial color={palette.primary} side={THREE.DoubleSide} />
          </mesh>
        ))}

      {showSolid &&
        secondary.shapeGeoms.map((g, i) => (
          <mesh key={`s-${i}`} geometry={g} position={[0, 0, 1]}>
            {/* DoubleSide MANDATORY — Y-flip inverts winding (see wordmark-geometry.ts) */}
            <meshBasicMaterial
              color={palette.secondary}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}

      {showWireframe &&
        [...primary.edgeGeoms, ...secondary.edgeGeoms].map((g, i) => (
          <lineSegments key={`e-${i}`} geometry={g} position={[0, 0, 3]}>
            <lineBasicMaterial color={palette.wireframe} transparent opacity={0.7} />
          </lineSegments>
        ))}
    </>
  );
}
