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
    </>
  );
};
