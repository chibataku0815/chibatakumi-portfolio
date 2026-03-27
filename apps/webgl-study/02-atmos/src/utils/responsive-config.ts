/**
 * responsive-config — viewport-aware scene parameters
 *
 * Uses shared/theme.ts breakpoints to switch between mobile and
 * desktop configurations for camera FOV, cloud density, and pixel ratio.
 */

import { breakpoints } from "../../../shared/theme";

export interface ResponsiveConfig {
  cameraFOV: number;
  cloudMaxInstances: number;
  cloudClusterCount: number;
  pixelRatioCap: number;
}

export function getResponsiveConfig(): ResponsiveConfig {
  const isMobile = window.innerWidth < breakpoints.sm;
  return {
    cameraFOV: isMobile ? 75 : 60,
    cloudMaxInstances: isMobile ? 40 : 75,
    cloudClusterCount: isMobile ? 8 : 12,
    pixelRatioCap: isMobile ? 1.5 : 2,
  };
}
