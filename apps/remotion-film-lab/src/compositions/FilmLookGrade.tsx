import type { FC } from "react";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Suspense } from "react";
import type { FilmLookGradeInputProps } from "film-lab-core";
import { GradeScene } from "./GradeScene";

/**
 * Phase 2: film-lab-core の grade を Remotion で可視化（解析シェーダ）
 */
export const FilmLookGrade: FC<FilmLookGradeInputProps> = (props) => {
  return (
    <AbsoluteFill>
      <ThreeCanvas width={1080} height={1920}>
        <Suspense fallback={null}>
          <GradeScene grade={props.grade} />
        </Suspense>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
