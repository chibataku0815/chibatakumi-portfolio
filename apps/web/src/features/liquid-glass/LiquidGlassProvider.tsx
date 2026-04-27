"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { usePathname } from "next/navigation";
import { useMotionStage } from "@/features/motion";
import {
  createLiquidGlassComposePass,
  type LiquidGlassFrameState,
  type LiquidGlassFrameSurface,
  type LiquidGlassFrontTarget,
} from "./compose-factory";
import { getLiquidGlassRouteAccent } from "./route-accent";
import type {
  LiquidGlassSurfaceKind,
  LiquidGlassSurfaceOptions,
  LiquidGlassSurfaceRegistry,
} from "./types";

const SURFACE_KIND_ID: Record<LiquidGlassSurfaceKind, number> = {
  nav: 0,
  panel: 1,
  rail: 2,
  control: 3,
};

const FALLBACK_ACCENT: readonly [number, number, number] = [
  0.91,
  0.66,
  0.35,
];

function parseHexColor(hex: string): [number, number, number] {
  const normalized = hex.trim().replace(/^#/, "");
  const value =
    normalized.length === 3
      ? normalized.split("").map((c) => `${c}${c}`).join("")
      : normalized.padEnd(6, "0").slice(0, 6);
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  if ([red, green, blue].some((c) => Number.isNaN(c))) {
    return [FALLBACK_ACCENT[0], FALLBACK_ACCENT[1], FALLBACK_ACCENT[2]];
  }
  return [red / 255, green / 255, blue / 255];
}

interface FrontCanvasRegistration {
  /**
   * Returns the front overlay canvas's current swap-chain view + dimensions
   * for the current frame. Called from inside the compose pass's render(),
   * which executes inside motion-dot's frame encoder. Returns null if the
   * canvas is not yet ready (e.g. WebGPU init in progress).
   */
  readonly getCurrentTarget: () => LiquidGlassFrontTarget | null;
}

interface LiquidGlassContextValue {
  readonly registerSurface: (
    element: HTMLElement,
    options: LiquidGlassSurfaceOptions,
  ) => () => void;
  readonly registerFrontCanvas: (
    registration: FrontCanvasRegistration,
  ) => () => void;
}

interface LiquidGlassProviderProps {
  readonly children: React.ReactNode;
}

interface LiquidGlassSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  readonly surfaceId: string;
  readonly radius?: number;
  readonly intensity?: number;
  readonly tint?: string;
  readonly brightness?: number;
  readonly kind?: LiquidGlassSurfaceOptions["kind"];
  readonly enabled?: boolean;
}

const LiquidGlassContext = createContext<LiquidGlassContextValue | null>(null);

export function LiquidGlassProvider({
  children,
}: LiquidGlassProviderProps): React.ReactElement {
  const motionStage = useMotionStage();
  const pathname = usePathname();
  const surfacesRef = useRef<LiquidGlassSurfaceRegistry>(new Map());
  const pointerRef = useRef({ x: 0, y: 0, active: 0 });
  const scrollRef = useRef({ y: 0, velocity: 0 });
  const reducedMotionRef = useRef(false);
  const routeAccentRef = useRef<readonly [number, number, number]>(FALLBACK_ACCENT);
  const frontCanvasRef = useRef<FrontCanvasRegistration | null>(null);

  useEffect(() => {
    routeAccentRef.current = parseHexColor(
      getLiquidGlassRouteAccent(pathname ?? "/"),
    );
  }, [pathname]);

  const registerSurface = useCallback(
    (element: HTMLElement, options: LiquidGlassSurfaceOptions) => {
      surfacesRef.current.set(options.id, { element, options });
      return () => {
        const current = surfacesRef.current.get(options.id);
        if (current?.element === element) {
          surfacesRef.current.delete(options.id);
        }
      };
    },
    [],
  );

  const registerFrontCanvas = useCallback(
    (registration: FrontCanvasRegistration) => {
      frontCanvasRef.current = registration;
      return () => {
        if (frontCanvasRef.current === registration) {
          frontCanvasRef.current = null;
        }
      };
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    pointerRef.current = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.1,
      active: 0,
    };
    scrollRef.current = { y: window.scrollY, velocity: 0 };

    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current = {
        x: event.clientX,
        y: event.clientY,
        active: 1,
      };
    };
    const onPointerLeave = () => {
      pointerRef.current = { ...pointerRef.current, active: 0 };
    };
    const onScroll = () => {
      const next = window.scrollY;
      const current = scrollRef.current;
      current.velocity = next - current.y;
      current.y = next;
    };
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    const onMqChange = () => {
      reducedMotionRef.current = mq.matches;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    mq.addEventListener("change", onMqChange);

    let rafHandle = window.requestAnimationFrame(function damp() {
      scrollRef.current.velocity *= 0.86;
      rafHandle = window.requestAnimationFrame(damp);
    });

    return () => {
      window.cancelAnimationFrame(rafHandle);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", onMqChange);
    };
  }, []);

  const buildFrameState = useCallback((): LiquidGlassFrameState => {
    const surfaces: LiquidGlassFrameSurface[] = [];
    for (const record of surfacesRef.current.values()) {
      const rect = record.element.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      const kind = record.options.kind ?? "rail";
      const explicitTint = record.options.tint
        ? parseHexColor(record.options.tint)
        : null;
      const baseTint = explicitTint ?? routeAccentRef.current;
      surfaces.push({
        rect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
        radius: record.options.radius ?? 24,
        intensity: record.options.intensity ?? 0.9,
        brightness: record.options.brightness ?? 0.7,
        kindId: SURFACE_KIND_ID[kind],
        tint: [
          baseTint[0],
          baseTint[1],
          baseTint[2],
          explicitTint ? 1 : 0,
        ],
      });
    }
    return {
      surfaces,
      pointer: { ...pointerRef.current },
      scrollVelocity: scrollRef.current.velocity,
      routeAccent: routeAccentRef.current,
      reducedMotion: reducedMotionRef.current,
    };
  }, []);

  // Install the compose pass once motion-dot is ready. The pass owns BOTH
  // the back render (motion-dot swap chain at z=-10) and the front render
  // (front overlay canvas at z=var(--z-nav-front-glass)) in a single encoder so
  // both paths share motion-dot's substrate texture and the same SDF/lensing
  // math. The front swap-chain view is supplied per-frame through the
  // registered front canvas callback.
  useEffect(() => {
    if (motionStage.kind !== "ready") return;
    const handle = motionStage.mount;
    const { device, format } = handle.gpu;

    let cachedFrame: LiquidGlassFrameState = {
      surfaces: [],
      pointer: { x: 0, y: 0, active: 0 },
      scrollVelocity: 0,
      routeAccent: FALLBACK_ACCENT,
      reducedMotion: false,
    };

    const { pass } = createLiquidGlassComposePass({
      device,
      format,
      getFrameState: () => cachedFrame,
      frontTarget: () => frontCanvasRef.current?.getCurrentTarget() ?? null,
    });

    const unsubscribeBeforeFrame = handle.onBeforeFrame(() => {
      cachedFrame = buildFrameState();
    });

    handle.setComposePass(pass);

    return () => {
      unsubscribeBeforeFrame();
      handle.setComposePass(null);
    };
  }, [buildFrameState, motionStage]);

  // Observe non-React DOM (e.g. motion-dot HUD/control surfaces injected
  // imperatively) carrying `data-liquid-glass-control`. This is distinct from
  // the React `LiquidGlassSurface` path (`data-liquid-glass-surface`) so the
  // two registration channels never double-register the same node.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cleanups = new Map<Element, () => void>();

    const attach = (el: Element) => {
      if (!(el instanceof HTMLElement)) return;
      if (cleanups.has(el)) return;
      const id = el.dataset.liquidGlassControl;
      if (!id) return;
      const radius = el.dataset.liquidGlassRadius
        ? Number.parseFloat(el.dataset.liquidGlassRadius)
        : undefined;
      const intensity = el.dataset.liquidGlassIntensity
        ? Number.parseFloat(el.dataset.liquidGlassIntensity)
        : undefined;
      const brightness = el.dataset.liquidGlassBrightness
        ? Number.parseFloat(el.dataset.liquidGlassBrightness)
        : undefined;
      const tint = el.dataset.liquidGlassTint;
      const cleanup = registerSurface(el, {
        id,
        radius,
        intensity,
        brightness,
        tint,
        kind: "control",
      });
      cleanups.set(el, cleanup);
    };

    const detach = (el: Element) => {
      const cleanup = cleanups.get(el);
      if (cleanup) {
        cleanup();
        cleanups.delete(el);
      }
    };

    document
      .querySelectorAll("[data-liquid-glass-control]")
      .forEach(attach);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.dataset.liquidGlassControl) attach(node);
            node
              .querySelectorAll("[data-liquid-glass-control]")
              .forEach(attach);
          }
        });
        record.removedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (cleanups.has(node)) detach(node);
            node
              .querySelectorAll("[data-liquid-glass-control]")
              .forEach(detach);
          }
        });
        if (record.type === "attributes" && record.target instanceof HTMLElement) {
          if (record.target.dataset.liquidGlassControl) {
            attach(record.target);
          } else if (cleanups.has(record.target)) {
            detach(record.target);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-liquid-glass-control"],
    });

    return () => {
      observer.disconnect();
      for (const cleanup of cleanups.values()) cleanup();
      cleanups.clear();
    };
  }, [registerSurface]);

  const contextValue = useMemo<LiquidGlassContextValue>(
    () => ({ registerSurface, registerFrontCanvas }),
    [registerFrontCanvas, registerSurface],
  );

  return (
    <LiquidGlassContext.Provider value={contextValue}>
      {children}
    </LiquidGlassContext.Provider>
  );
}

export function useLiquidGlassRegisterFrontCanvas(): (
  registration: FrontCanvasRegistration,
) => () => void {
  const context = useContext(LiquidGlassContext);
  if (!context) {
    throw new Error(
      "useLiquidGlassRegisterFrontCanvas must be used inside LiquidGlassProvider",
    );
  }
  return context.registerFrontCanvas;
}

export type { FrontCanvasRegistration };

export function LiquidGlassSurface({
  surfaceId,
  radius,
  intensity,
  tint,
  brightness,
  kind,
  enabled = true,
  children,
  className,
  style,
  ...props
}: LiquidGlassSurfaceProps): React.ReactElement {
  const context = useContext(LiquidGlassContext);
  const ref = useRef<HTMLDivElement | null>(null);
  const mergedStyle = useMemo<CSSProperties>(
    () => ({
      ...style,
      background: style?.background ?? "transparent",
    }),
    [style],
  );

  useEffect(() => {
    const element = ref.current;
    if (!context || !element || !enabled) return;
    return context.registerSurface(element, {
      id: surfaceId,
      radius,
      intensity,
      tint,
      brightness,
      kind,
    });
  }, [
    brightness,
    context,
    enabled,
    intensity,
    kind,
    radius,
    surfaceId,
    tint,
  ]);

  return (
    <div
      ref={ref}
      data-liquid-glass-surface={surfaceId}
      className={className}
      style={mergedStyle}
      {...props}
    >
      {children}
    </div>
  );
}
