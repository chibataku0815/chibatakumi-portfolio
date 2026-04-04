/**
 * Safe zone definitions for multiple aspect ratios
 *
 * 9:16 vertical: top 150 / bottom 170 / sides 60 (from Sabrina experiment)
 * 16:9 horizontal: top 60 / bottom 60 / sides 80
 */

export const SAFE_ZONE = {
  vertical: {
    top: 150,
    bottom: 170,
    left: 60,
    right: 60,
  },
  horizontal: {
    top: 60,
    bottom: 60,
    left: 80,
    right: 80,
  },
} as const;
