"use client";

import opentype, { type Font } from "opentype.js";
import { useEffect, useState } from "react";

export type FontStatus = "loading" | "loaded" | "error";

export type UseFontResult = {
  font: Font | null;
  status: FontStatus;
  error: Error | null;
};

type State = UseFontResult & { url: string };

const fontCache = new Map<string, Promise<Font>>();

function loadFontCached(url: string): Promise<Font> {
  let p = fontCache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
        return r.arrayBuffer();
      })
      .then((buf) => opentype.parse(buf));
    fontCache.set(url, p);
  }
  return p;
}

const initial = (url: string): State => ({
  font: null,
  status: "loading",
  error: null,
  url,
});

export function useFont(url: string): UseFontResult {
  const [state, setState] = useState<State>(() => initial(url));

  // React 19 idiom: derive state from prop change during render. Resetting to
  // "loading" the moment the URL prop changes avoids a flash of stale state
  // and keeps the async resolution inside useEffect from being a synchronous
  // setState-in-effect (which the react-hooks/set-state-in-effect rule flags).
  if (state.url !== url) {
    setState(initial(url));
  }

  useEffect(() => {
    let cancelled = false;
    loadFontCached(url).then(
      (f) => {
        if (cancelled) return;
        setState((s) =>
          s.url === url ? { font: f, status: "loaded", error: null, url } : s,
        );
      },
      (err: unknown) => {
        if (cancelled) return;
        const e = err instanceof Error ? err : new Error(String(err));
        // Drop the failed promise from cache so dropping the missing file in
        // public/fonts/ + reselecting will re-fetch instead of replaying the error.
        fontCache.delete(url);
        console.error("[useFont] load failed:", e.message);
        setState((s) =>
          s.url === url ? { font: null, status: "error", error: e, url } : s,
        );
      },
    );
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { font: state.font, status: state.status, error: state.error };
}
