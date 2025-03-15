declare module '@studio-freight/react-lenis' {
  import type { ForwardRefExoticComponent, RefAttributes, ReactNode } from 'react';

  interface LenisProps {
    children: ReactNode;
    root?: boolean;
    options?: {
      duration?: number;
      easing?: (t: number) => number;
      smoothWheel?: boolean;
      smoothTouch?: boolean;
      touchMultiplier?: number;
    };
  }

  interface LenisRef {
    start: () => void;
    stop: () => void;
    destroy: () => void;
  }

  export const ReactLenis: ForwardRefExoticComponent<LenisProps & RefAttributes<LenisRef>>;
} 