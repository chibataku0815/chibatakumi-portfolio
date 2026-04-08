import { useEffect, useMemo, useState } from "react";
import {
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
} from "remotion";

export type SvgMarkupSource =
  | { type: "markup"; markup: string }
  | { type: "static-file"; src: string };

const getHandleLabel = (source: SvgMarkupSource, debugName?: string) => {
  const suffix =
    debugName ??
    (source.type === "static-file" ? source.src : "inline-svg-markup");
  return `Loading SVG markup: ${suffix}`;
};

export const useSvgMarkup = (
  source: SvgMarkupSource,
  debugName?: string,
): string | null => {
  const [markup, setMarkup] = useState<string | null>(
    source.type === "markup" ? source.markup : null,
  );
  const [error, setError] = useState<Error | null>(null);
  const handle = useMemo(
    () => delayRender(getHandleLabel(source, debugName)),
    [source, debugName],
  );

  useEffect(() => {
    let cancelled = false;

    if (source.type === "markup") {
      setMarkup(source.markup);
      continueRender(handle);
      return;
    }

    const url = staticFile(source.src);
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch SVG: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then((text) => {
        if (cancelled) {
          return;
        }
        setMarkup(text);
        continueRender(handle);
      })
      .catch((caught) => {
        if (cancelled) {
          return;
        }
        const nextError =
          caught instanceof Error ? caught : new Error(String(caught));
        setError(nextError);
        cancelRender(nextError);
      });

    return () => {
      cancelled = true;
    };
  }, [source, handle]);

  useEffect(() => {
    if (error) {
      console.error(error);
    }
  }, [error]);

  return markup;
};
