// apps/web motion feature — public boundary.
//
// Server components may import `MotionStageContext` types and the consumer
// hook; only the Provider / banner are client-only.

export { MotionStageProvider } from "./MotionStageProvider";
export { MotionUnsupportedBanner } from "./MotionUnsupported";
export {
  MotionStageContext,
  useMotionStage,
  type MotionStageStatus,
} from "./MotionStageContext";
