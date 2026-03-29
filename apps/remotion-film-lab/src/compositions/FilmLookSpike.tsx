import type { FC } from "react";
import { AbsoluteFill } from "remotion";
import type { FilmLookSpikeInputProps } from "film-lab-core";

/**
 * Phase 0 スパイク: props の文字列がそのままフレームに焼き込まれる
 */
export const FilmLookSpike: FC<FilmLookSpikeInputProps> = ({ title }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        color: "#fafafa",
        justifyContent: "center",
        alignItems: "center",
        fontSize: 42,
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
        padding: 48,
      }}
    >
      {title}
    </AbsoluteFill>
  );
};
