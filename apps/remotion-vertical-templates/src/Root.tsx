/**
 * @fileoverview Remotion Studio に登録する Composition 一覧（縦型 1080×1920）。
 */
import type { FC } from "react";
import { Composition } from "remotion";
import { ProductDemoSabrina } from "./compositions/ProductDemoSabrina";
import { TestimonialSabrina } from "./compositions/TestimonialSabrina";

/** プロダクトデモ（Sabrina プロンプト P1）の尺（フレーム）25s×30fps */
export const PRODUCT_DEMO_FRAMES = 750;

/** レビュー動画（Sabrina プロンプト P2）の尺（フレーム）20s×30fps */
export const TESTIMONIAL_FRAMES = 600;

export const RemotionRoot: FC = () => {
  return (
    <>
      <Composition
        id="ProductDemoSabrina"
        component={ProductDemoSabrina}
        durationInFrames={PRODUCT_DEMO_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="TestimonialSabrina"
        component={TestimonialSabrina}
        durationInFrames={TESTIMONIAL_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
