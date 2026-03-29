import type { FC } from "react";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Suspense } from "react";
import type { FilmLookGradeInputProps } from "film-lab-core";
import { GradeScene } from "./GradeScene";

/**
 * Phase 2+: film-lab-core の grade と任意 LUT（.cube）を Remotion で可視化する。
 */
export const FilmLookGrade: FC<FilmLookGradeInputProps> = (props) => {
  return (
    <AbsoluteFill>
      <ThreeCanvas width={1080} height={1920}>
        <Suspense fallback={null}>
          <GradeScene {...props} />
        </Suspense>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
