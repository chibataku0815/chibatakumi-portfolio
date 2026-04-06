/**
 * Shape Transition — Configuration (#31)
 *
 * Corporate style: rounded-rectangle iris wipe with Stripe-inspired purple accent.
 * White background, Nunito Sans 600, expoOut easing, zero grain/vignette.
 */
export const config = {
  palette: {
    bg: '#ffffff',
    primary: '#1a1a2e',
    accent: '#635bff',
    secondary: '#6b7280',
  },
  sceneA: {
    color: '#635bff',
    label: 'Q3 RESULTS',
    subtitle: 'Revenue & Growth',
    textColor: '#ffffff',
  },
  sceneB: {
    color: '#1a1a2e',
    label: 'Q4 OUTLOOK',
    subtitle: 'Strategy & Targets',
    textColor: '#ffffff',
  },
  irisCornerRadius: 28,
  transitionStart: 15,
  transitionDuration: 18,
  sceneBStart: 34,
  totalFrames: 60,
} as const;
