import { Composition } from "remotion";
import { BarLineChart } from "./compositions/09-bar-line-chart/BarLineChart";
import { CtaOverlay } from "./compositions/06-cta-overlay/CtaOverlay";
import { ApplePromo } from "./compositions/10-apple-promo/ApplePromo";
import { FlubberMorph } from "./compositions/11-flubber-morph/FlubberMorph";
import { LaunchVideo } from "./compositions/04-launch-video/LaunchVideo";
import { CinematicIntro } from "./compositions/07-cinematic-intro/CinematicIntro";
import { NewsHeadline } from "./compositions/01-news-headline/NewsHeadline";
import { MusicCdPromo } from "./compositions/12-music-cd-promo/MusicCdPromo";
import { ProductDemo } from "./compositions/03-product-demo/ProductDemo";
import { RocketTimeline } from "./compositions/05-rocket-timeline/RocketTimeline";
import { ThreeRanking } from "./compositions/08-three-ranking/ThreeRanking";
import {
  CleanShotReferencePlayback,
  cleanshotReferenceDurationInFrames,
} from "./compositions/cleanshot-remotion-hybrid/CleanShotReferencePlayback";
import {
  cleanshotReferenceHeightPx,
  cleanshotReferenceWidthPx,
} from "./compositions/cleanshot-remotion-hybrid/cleanshotReferenceTimeline";
import { ThreeRankingFromCapture } from "./compositions/08-three-ranking/ThreeRankingFromCapture";
import { TravelRoute } from "./compositions/02-travel-route/TravelRoute";
import {
  LaunchIntegrationPrototype,
  launchIntegrationPrototypeDurationInFrames,
} from "./compositions/13-launch-integration-prototype/LaunchIntegrationPrototype";
import {
  LaunchIntegrationAudioPreview,
} from "./compositions/13-launch-integration-prototype/LaunchIntegrationAudioPreview";
import { TemplateReproTest } from "./compositions/14-template-repro-test/TemplateReproTest";
import { FilmtoneCountdown } from "./compositions/15-filmtone-countdown/FilmtoneCountdown";
import { totalFrames as filmtoneFrames } from "./compositions/15-filmtone-countdown/config";
import { SlamIn } from "./compositions/16-slam-in/Composition";
import { config as slamInConfig } from "./compositions/16-slam-in/config";
import { AccentBurst } from "./compositions/17-accent-burst/Composition";
import { config as accentBurstConfig } from "./compositions/17-accent-burst/config";
import { KineticTypography } from "./compositions/18-kinetic-typography/Composition";
import { config as kineticTypographyConfig } from "./compositions/18-kinetic-typography/config";
import { ScalePulse } from "./compositions/19-scale-pulse/Composition";
import { config as scalePulseConfig } from "./compositions/19-scale-pulse/config";
import { TypeAsTexture } from "./compositions/20-type-as-texture/Composition";
import { config as typeAsTextureConfig } from "./compositions/20-type-as-texture/config";
import { CroppedTypography } from "./compositions/21-cropped-typography/Composition";
import { config as croppedTypographyConfig } from "./compositions/21-cropped-typography/config";
import { Stagger } from "./compositions/22-stagger/Composition";
import { config as staggerConfig } from "./compositions/22-stagger/config";
import { EasingShowcase } from "./compositions/23-easing-showcase/Composition";
import { config as easingShowcaseConfig } from "./compositions/23-easing-showcase/config";
import { MotionTechniqueReel, totalFrames as reelFrames } from "./compositions/24-motion-technique-reel/Composition";
import { Typewriter } from "./compositions/25-typewriter/Composition";
import { config as typewriterConfig } from "./compositions/25-typewriter/config";
import { TextScramble } from "./compositions/26-text-scramble/Composition";
import { config as textScrambleConfig } from "./compositions/26-text-scramble/config";
import { WaveText } from "./compositions/27-wave-text/Composition";
import { config as waveTextConfig } from "./compositions/27-wave-text/config";
import { BounceText } from "./compositions/28-bounce-text/Composition";
import { config as bounceTextConfig } from "./compositions/28-bounce-text/config";
import { BlurMaskReveal } from "./compositions/29-blur-mask-reveal/Composition";
import { config as blurMaskRevealConfig } from "./compositions/29-blur-mask-reveal/config";
import { WhipPanTransition } from "./compositions/30-whip-pan-transition/Composition";
import { config as whipPanConfig } from "./compositions/30-whip-pan-transition/config";
import { ShapeTransition } from "./compositions/31-shape-transition/Composition";
import { config as shapeTransitionConfig } from "./compositions/31-shape-transition/config";
import { CrossDissolve } from "./compositions/32-cross-dissolve/Composition";
import { config as crossDissolveConfig } from "./compositions/32-cross-dissolve/config";
import { ZoomTransition } from "./compositions/33-zoom-transition/Composition";
import { config as zoomTransitionConfig } from "./compositions/33-zoom-transition/config";
import { GlitchTransition } from "./compositions/34-glitch-transition/Composition";
import { config as glitchTransitionConfig } from "./compositions/34-glitch-transition/config";
import { PushInPullOut } from "./compositions/35-push-in-pull-out/Composition";
import { config as pushInPullOutConfig } from "./compositions/35-push-in-pull-out/config";
import { ParallaxDrift } from "./compositions/36-parallax-drift/Composition";
import { config as parallaxDriftConfig } from "./compositions/36-parallax-drift/config";
import { HandheldShake } from "./compositions/37-handheld-shake/Composition";
import { config as handheldShakeConfig } from "./compositions/37-handheld-shake/config";
import { IsshinReelIntro } from "./compositions/38-isshin-reel-intro/Composition";
import { config as isshinReelIntroConfig } from "./compositions/38-isshin-reel-intro/config";
import { IsshinReelPackage } from "./compositions/39-isshin-reel-package/Composition";
import { config as isshinReelPackageConfig } from "./compositions/39-isshin-reel-package/config";
import { IsshinReelCredits } from "./compositions/40-isshin-reel-credits/Composition";
import { config as isshinReelCreditsConfig } from "./compositions/40-isshin-reel-credits/config";
import { RecraftSvgMotion } from "./compositions/41-recraft-svg-motion/Composition";
import { config as recraftSvgMotionConfig } from "./compositions/41-recraft-svg-motion/config";
import { MooographGeometric } from "./compositions/42-mooograph-geometric/Composition";
import { MooographOverlay } from "./compositions/42-mooograph-geometric/MooographOverlay";
import { config as mooographGeometricConfig } from "./compositions/42-mooograph-geometric/config";
import { MooographGroupA } from "./compositions/42a-mooograph-group-a/Composition";
import { config as groupAConfig } from "./compositions/42a-mooograph-group-a/config";
import { MooographGroupB } from "./compositions/42b-mooograph-group-b/Composition";
import { config as groupBConfig } from "./compositions/42b-mooograph-group-b/config";
import { MooographGroupC } from "./compositions/42c-mooograph-group-c/Composition";
import { config as groupCConfig } from "./compositions/42c-mooograph-group-c/config";
import { ObjectQualityBoard } from "./compositions/43-object-quality-board/Composition";
import { config as objectQualityBoardConfig } from "./compositions/43-object-quality-board/config";
import { CalibrationDebug } from "./compositions/calibration-debug/Composition";
import { CalibrationOverlay } from "./compositions/calibration-debug/CalibrationOverlay";
import { IsshinReelPackageOverlay } from "./compositions/39-isshin-reel-package/Overlay";
import { config as isshinOverlayConfig } from "./compositions/39-isshin-reel-package/config";
import { AETipEchoDitherTrail } from "./compositions/44-ae-tip-echo-dither-trail/Composition";
import { config as aeTipEchoDitherTrailConfig } from "./compositions/44-ae-tip-echo-dither-trail/config";
import { AETipTrimPathsRadialBurst } from "./compositions/45-ae-tip-trim-paths-radial-burst/Composition";
import { config as aeTipTrimPathsRadialBurstConfig } from "./compositions/45-ae-tip-trim-paths-radial-burst/config";
import { AETipOverlayGradientBackground } from "./compositions/46-ae-tip-overlay-gradient-background/Composition";
import { config as aeTipOverlayGradientBackgroundConfig } from "./compositions/46-ae-tip-overlay-gradient-background/config";
import { AETipExpandingRingReveal } from "./compositions/47-ae-tip-expanding-ring-reveal/Composition";
import { config as aeTipExpandingRingRevealConfig } from "./compositions/47-ae-tip-expanding-ring-reveal/config";
import { OverlayRingTitleGradientLed } from "./compositions/53-overlay-ring-title-gradient-led/Composition";
import { config as overlayRingTitleGradientLedConfig } from "./compositions/53-overlay-ring-title-gradient-led/config";
import { AETipEchoTextTrain } from "./compositions/56-ae-tip-echo-text-train/Composition";
import { config as aeTipEchoTextTrainConfig } from "./compositions/56-ae-tip-echo-text-train/config";
import {
  AEBasicTransitionPack,
  AEBasicTransitionVariant,
} from "./compositions/64-ae-basic-transition-pack/Composition";
import {
  config as aeBasicTransitionPackConfig,
  defaultVariantProps as aeBasicTransitionVariantDefaultProps,
} from "./compositions/64-ae-basic-transition-pack/config";
import { AETipBouncingRotationCharacter } from "./compositions/66-ae-tip-bouncing-rotation-character/Composition";
import { config as aeTipBouncingRotationCharacterConfig } from "./compositions/66-ae-tip-bouncing-rotation-character/config";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Phase 1: #9 Bar + Line chart — sequential animation, glow, spring basics */}
      <Composition
        id="BarLineChart"
        component={BarLineChart}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Phase 1: #6 CTA overlay — ProRes alpha, slide-in, spring bounce */}
      <Composition
        id="CtaOverlay"
        component={CtaOverlay}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Phase 1: #10 Apple-style promo — fade-in typography, 30s pacing */}
      <Composition
        id="ApplePromo"
        component={ApplePromo}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Phase 2: #11 Flubber morph — shape morphing, ghost trails, breathing idle */}
      <Composition
        id="FlubberMorph"
        component={FlubberMorph}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Phase 2: #4 Launch video — 8 scenes, particles, spring stagger, typing */}
      <Composition
        id="LaunchVideo"
        component={LaunchVideo}
        durationInFrames={1110}
        fps={30}
        width={1080}
        height={700}
      />

      {/* Phase 3: #7 Cinematic intro — logo pop, particles, scanner line */}
      <Composition
        id="CinematicIntro"
        component={CinematicIntro}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Phase 3: #1 News headline — blur reveal, rough highlight, 3 cut studies */}
      <Composition
        id="NewsHeadline"
        component={NewsHeadline}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Phase 3: #12 Music CD promo — audio-reactive, count-up, 5 scenes */}
      <Composition
        id="MusicCdPromo"
        component={MusicCdPromo}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Phase 4: #3 Product demo — real UI based structure, founder-demo pacing */}
      <Composition
        id="ProductDemo"
        component={ProductDemo}
        durationInFrames={480}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Phase 4: #5 Rocket timeline — parabolic trajectory, fading trail, chronology */}
      <Composition
        id="RocketTimeline"
        component={RocketTimeline}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Phase 4: #8 Three ranking — short 3D tower rise, camera pause study */}
      <Composition
        id="ThreeRanking"
        component={ThreeRanking}
        durationInFrames={210}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* CleanShot 参照 mp4 の再生のみ（ThreeRanking とは無関係） */}
      <Composition
        id="CleanShotReferencePlayback"
        component={CleanShotReferencePlayback}
        durationInFrames={cleanshotReferenceDurationInFrames}
        fps={50}
        width={cleanshotReferenceWidthPx}
        height={cleanshotReferenceHeightPx}
      />

      {/* #8 コード正本と同一タイミング（30×210）。キャプチャ全尺への引き伸ばしは行わない */}
      <Composition
        id="ThreeRankingFromCapture"
        component={ThreeRankingFromCapture}
        durationInFrames={210}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Phase 4: #2 Travel route — static map route + brief 3D landmark accent */}
      <Composition
        id="TravelRoute"
        component={TravelRoute}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Phase 5: launch integration — proof-first master prototype */}
      <Composition
        id="LaunchIntegrationPrototype"
        component={LaunchIntegrationPrototype}
        durationInFrames={launchIntegrationPrototypeDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Phase 5: AI audio preview — selected cues + HUD for soundtrack candidate review */}
      <Composition
        id="LaunchIntegrationAudioPreview"
        component={LaunchIntegrationAudioPreview}
        durationInFrames={launchIntegrationPrototypeDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          showHud: true,
        }}
      />
      {/* #14 Template reproduction test — Gemini analysis → Remotion pipeline validation */}
      <Composition
        id="TemplateReproTest"
        component={TemplateReproTest}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* #15 Filmtone countdown — 5→1 + finale, config-driven text/color */}
      <Composition
        id="FilmtoneCountdown"
        component={FilmtoneCountdown}
        durationInFrames={filmtoneFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* #16 Slam In — scale slam with motion blur smear + ghost trail exit */}
      <Composition
        id="SlamIn"
        component={SlamIn}
        durationInFrames={slamInConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #17 Accent Burst — center monogram + golden-angle radial element explosion */}
      <Composition
        id="AccentBurst"
        component={AccentBurst}
        durationInFrames={accentBurstConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #18 Kinetic Typography — scattered chars assemble into word with stagger */}
      <Composition
        id="KineticTypography"
        component={KineticTypography}
        durationInFrames={kineticTypographyConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #19 Scale Pulse — entire canvas pulses min->peak->settle with grid */}
      <Composition
        id="ScalePulse"
        component={ScalePulse}
        durationInFrames={scalePulseConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #20 Type as Texture — massive text rows scrolling in opposite directions */}
      <Composition
        id="TypeAsTexture"
        component={TypeAsTexture}
        durationInFrames={typeAsTextureConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #21 Cropped Typography — oversized "GRAIN" with canvas-boundary clipping */}
      <Composition
        id="CroppedTypography"
        component={CroppedTypography}
        durationInFrames={croppedTypographyConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #22 Stagger — non-uniform directional entry with backOut easing */}
      <Composition
        id="Stagger"
        component={Stagger}
        durationInFrames={staggerConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #23 Easing Showcase — quintOut / expOut / backOut visual comparison */}
      <Composition
        id="EasingShowcase"
        component={EasingShowcase}
        durationInFrames={easingShowcaseConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #24 Motion Technique Reel — all 8 techniques in dramaturgical sequence */}
      <Composition
        id="MotionTechniqueReel"
        component={MotionTechniqueReel}
        durationInFrames={reelFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* ================================================================== */}
      {/* Phase 2: Motion Knowledge Expansion (#25-#37)                      */}
      {/* ================================================================== */}

      {/* #25 Typewriter — sequential character reveal with blinking cursor */}
      <Composition
        id="Typewriter"
        component={Typewriter}
        durationInFrames={typewriterConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #26 Text Scramble — random chars cycling then locking left-to-right */}
      <Composition
        id="TextScramble"
        component={TextScramble}
        durationInFrames={textScrambleConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #27 Wave Text — per-character sine wave vertical oscillation */}
      <Composition
        id="WaveText"
        component={WaveText}
        durationInFrames={waveTextConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #28 Bounce Text — per-character drop with bounceOut physics */}
      <Composition
        id="BounceText"
        component={BounceText}
        durationInFrames={bounceTextConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #29 Blur Mask Reveal — blur reduction + directional wipe reveal */}
      <Composition
        id="BlurMaskReveal"
        component={BlurMaskReveal}
        durationInFrames={blurMaskRevealConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #30 Whip Pan — high-speed horizontal pan with motion blur smear */}
      <Composition
        id="WhipPanTransition"
        component={WhipPanTransition}
        durationInFrames={whipPanConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #31 Shape Transition — circle iris wipe revealing Scene B */}
      <Composition
        id="ShapeTransition"
        component={ShapeTransition}
        durationInFrames={shapeTransitionConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #32 Cross Dissolve — classic opacity crossfade */}
      <Composition
        id="CrossDissolve"
        component={CrossDissolve}
        durationInFrames={crossDissolveConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #33 Zoom Transition — rapid scale + blur scene switch */}
      <Composition
        id="ZoomTransition"
        component={ZoomTransition}
        durationInFrames={zoomTransitionConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #34 Glitch Transition — RGB split + displacement + temporal posterize */}
      <Composition
        id="GlitchTransition"
        component={GlitchTransition}
        durationInFrames={glitchTransitionConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #35 Push-in / Pull-out — 2D camera scale for dolly simulation */}
      <Composition
        id="PushInPullOut"
        component={PushInPullOut}
        durationInFrames={pushInPullOutConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #36 Parallax Drift — multi-layer depth-based horizontal drift */}
      <Composition
        id="ParallaxDrift"
        component={ParallaxDrift}
        durationInFrames={parallaxDriftConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* #37 Handheld Shake — organic summed-sine camera vibration */}
      <Composition
        id="HandheldShake"
        component={HandheldShake}
        durationInFrames={handheldShakeConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* ================================================================== */}
      {/* Phase 3: Target Mograph Recreation (#38+)                         */}
      {/* ================================================================== */}

      {/* #38 Isshin Reel Intro — bar→card expansion, multi-texture block grid (0-15s) */}
      <Composition
        id="IsshinReelIntro"
        component={IsshinReelIntro}
        durationInFrames={isshinReelIntroConfig.totalFrames}
        fps={50}
        width={1920}
        height={1080}
      />

      {/* #39 Isshin Reel Package — warning label, package design, title card (15-25.5s) */}
      <Composition
        id="IsshinReelPackage"
        component={IsshinReelPackage}
        durationInFrames={isshinReelPackageConfig.totalFrames}
        fps={50}
        width={1920}
        height={1080}
      />

      {/* #40 Isshin Reel Credits — year counter, credit panel, dispersal outro (25.5-33.4s) */}
      <Composition
        id="IsshinReelCredits"
        component={IsshinReelCredits}
        durationInFrames={isshinReelCreditsConfig.totalFrames}
        fps={50}
        width={1920}
        height={1080}
      />
      {/* ================================================================== */}
      {/* Recraft API SVG Integration Tests (#41)                           */}
      {/* ================================================================== */}

      {/* #41 Recraft SVG Motion — Recraft API SVG x Remotion animation test */}
      <Composition
        id="RecraftSvgMotion"
        component={RecraftSvgMotion}
        durationInFrames={recraftSvgMotionConfig.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* ================================================================== */}
      {/* MOOOGRAPH Recreation (#42)                                        */}
      {/* ================================================================== */}

      {/* #42 MOOOGRAPH Geometric — halftone blobs + geometric shapes + Recraft assets */}
      <Composition
        id="MooographGeometric"
        component={MooographGeometric}
        durationInFrames={mooographGeometricConfig.totalFrames}
        fps={mooographGeometricConfig.fps}
        width={1920}
        height={1080}
      />

      {/* #42 MOOOGRAPH Overlay — reference video + reproduction canvas for comparison */}
      <Composition
        id="MooographOverlay"
        component={MooographOverlay}
        durationInFrames={mooographGeometricConfig.totalFrames}
        fps={mooographGeometricConfig.fps}
        width={1920}
        height={1080}
        defaultProps={{ showRef: true }}
      />

      {/* #42a MOOOGRAPH Group A — isolated left cluster (5a star, 5b rect, 5c arch, 5d triangle) */}
      <Composition
        id="MooographGroupA"
        component={MooographGroupA}
        durationInFrames={groupAConfig.totalFrames}
        fps={groupAConfig.fps}
        width={1920}
        height={1080}
        defaultProps={{ showRef: true }}
      />

      <Composition
        id="MooographGroupB"
        component={MooographGroupB}
        durationInFrames={groupBConfig.totalFrames}
        fps={groupBConfig.fps}
        width={1920}
        height={1080}
        defaultProps={{ showRef: true }}
      />

      <Composition
        id="MooographGroupC"
        component={MooographGroupC}
        durationInFrames={groupCConfig.totalFrames}
        fps={groupCConfig.fps}
        width={1920}
        height={1080}
        defaultProps={{ showRef: true }}
      />

      {/* #43 Object Quality Board — Group A objects in cycle or single review mode */}
      <Composition
        id="ObjectQualityBoard"
        component={ObjectQualityBoard}
        durationInFrames={objectQualityBoardConfig.totalFrames}
        fps={objectQualityBoardConfig.fps}
        width={objectQualityBoardConfig.width}
        height={objectQualityBoardConfig.height}
        defaultProps={{ mode: "cycle" }}
      />

      {/* #44 AE Tip — Echo trail + ordered dither comparison for knowledge-axis primitive extraction */}
      <Composition
        id="AETipEchoDitherTrail"
        component={AETipEchoDitherTrail}
        durationInFrames={aeTipEchoDitherTrailConfig.totalFrames}
        fps={aeTipEchoDitherTrailConfig.fps}
        width={aeTipEchoDitherTrailConfig.width}
        height={aeTipEchoDitherTrailConfig.height}
      />

      {/* #45 AE Tip — Trim Paths draw/erase timing study + radial repeater burst */}
      <Composition
        id="AETipTrimPathsRadialBurst"
        component={AETipTrimPathsRadialBurst}
        durationInFrames={aeTipTrimPathsRadialBurstConfig.totalFrames}
        fps={aeTipTrimPathsRadialBurstConfig.fps}
        width={aeTipTrimPathsRadialBurstConfig.width}
        height={aeTipTrimPathsRadialBurstConfig.height}
      />

      {/* #46 AE Tip — overlay gradient stack with rotating wipe angles + soft distortion */}
      <Composition
        id="AETipOverlayGradientBackground"
        component={AETipOverlayGradientBackground}
        durationInFrames={aeTipOverlayGradientBackgroundConfig.totalFrames}
        fps={aeTipOverlayGradientBackgroundConfig.fps}
        width={aeTipOverlayGradientBackgroundConfig.width}
        height={aeTipOverlayGradientBackgroundConfig.height}
      />

      {/* #47 AE Tip — expanding ring reveal driven by diameter growth + stroke collapse */}
      <Composition
        id="AETipExpandingRingReveal"
        component={AETipExpandingRingReveal}
        durationInFrames={aeTipExpandingRingRevealConfig.totalFrames}
        fps={aeTipExpandingRingRevealConfig.fps}
        width={aeTipExpandingRingRevealConfig.width}
        height={aeTipExpandingRingRevealConfig.height}
      />

      {/* #53 shortest production example variant — #46 overlay gradient motion is promoted as the visible shot context */}
      <Composition
        id="OverlayRingTitleGradientLed"
        component={OverlayRingTitleGradientLed}
        durationInFrames={overlayRingTitleGradientLedConfig.durationFrames}
        fps={overlayRingTitleGradientLedConfig.fps}
        width={overlayRingTitleGradientLedConfig.width}
        height={overlayRingTitleGradientLedConfig.height}
      />

      {/* #56 AE Tip — 2.5D text train with composite-in-front echo and neo-brutalist editorial poster styling */}
      <Composition
        id="AETipEchoTextTrain"
        component={AETipEchoTextTrain}
        durationInFrames={aeTipEchoTextTrainConfig.totalFrames}
        fps={aeTipEchoTextTrainConfig.fps}
        width={aeTipEchoTextTrainConfig.width}
        height={aeTipEchoTextTrainConfig.height}
      />

      {/* #64 AE basic transition pack — 5 foundational wipe recipes reconstructed from AE into reusable Remotion primitives */}
      <Composition
        id={aeBasicTransitionPackConfig.id}
        component={AEBasicTransitionPack}
        durationInFrames={aeBasicTransitionPackConfig.totalFrames}
        fps={aeBasicTransitionPackConfig.fps}
        width={aeBasicTransitionPackConfig.width}
        height={aeBasicTransitionPackConfig.height}
      />

      <Composition
        id={aeBasicTransitionPackConfig.variantId}
        component={AEBasicTransitionVariant}
        durationInFrames={aeBasicTransitionPackConfig.segmentFrames}
        fps={aeBasicTransitionPackConfig.fps}
        width={aeBasicTransitionPackConfig.width}
        height={aeBasicTransitionPackConfig.height}
        defaultProps={aeBasicTransitionVariantDefaultProps}
      />

      {/* #66 AE tip — vanishing-ball bounce plus head pass-through sells 3D-like rotation using only flat shapes */}
      <Composition
        id={aeTipBouncingRotationCharacterConfig.id}
        component={AETipBouncingRotationCharacter}
        durationInFrames={aeTipBouncingRotationCharacterConfig.totalFrames}
        fps={aeTipBouncingRotationCharacterConfig.fps}
        width={aeTipBouncingRotationCharacterConfig.width}
        height={aeTipBouncingRotationCharacterConfig.height}
      />

      {/* ================================================================== */}
      {/* Debug / Calibration                                                */}
      {/* ================================================================== */}

      {/* Calibration markers at known coordinates for pipeline verification */}
      <Composition
        id="CalibrationDebug"
        component={CalibrationDebug}
        durationInFrames={50}
        fps={50}
        width={1920}
        height={1080}
      />

      {/* Calibration markers overlaid on reference video */}
      <Composition
        id="CalibrationOverlay"
        component={CalibrationOverlay}
        durationInFrames={isshinOverlayConfig.totalFrames}
        fps={50}
        width={1920}
        height={1080}
      />

      {/* #39 Package — reference video + reproduction canvas overlay */}
      <Composition
        id="IsshinReelPackageOverlay"
        component={IsshinReelPackageOverlay}
        durationInFrames={isshinOverlayConfig.totalFrames}
        fps={50}
        width={1920}
        height={1080}
      />
    </>
  );
};
