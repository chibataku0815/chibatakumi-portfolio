/**
 * responsive-config --- viewport-aware scene parameters for product viewer
 *
 * Adapted from 02-atmos for product viewer use case:
 * - Tighter FOV (product photography style)
 * - Higher pixel ratio cap for product detail clarity
 * - No cloud-related parameters
 *
 * Uses shared/theme.ts breakpoints.
 */

import { breakpoints } from "../../../shared/theme";

export interface ResponsiveConfig {
  /** Camera field of view (degrees) */
  cameraFOV: number;
  /** Maximum device pixel ratio */
  pixelRatioCap: number;
}

export function getResponsiveConfig(): ResponsiveConfig {
  const isMobile = window.innerWidth < breakpoints.sm;
  return {
    // Product viewer uses tighter FOV for "telephoto" look
    cameraFOV: isMobile ? 40 : 35,
    // Higher DPR for product detail clarity
    pixelRatioCap: isMobile ? 2 : 2,
  };
}
