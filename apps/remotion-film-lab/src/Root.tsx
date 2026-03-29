import type { FC } from "react";
import { Composition } from "remotion";
import {
  filmLookGradeDefaultProps,
  filmLookSpikeDefaultProps,
} from "film-lab-core";
import { FilmLookSpike } from "./compositions/FilmLookSpike";
import { FilmLookGrade } from "./compositions/FilmLookGrade";

export const RemotionRoot: FC = () => {
  return (
    <>
      <Composition
        id="FilmLookSpike"
        component={FilmLookSpike}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={filmLookSpikeDefaultProps}
      />
      <Composition
        id="FilmLookGrade"
        component={FilmLookGrade}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={filmLookGradeDefaultProps}
      />
    </>
  );
};
