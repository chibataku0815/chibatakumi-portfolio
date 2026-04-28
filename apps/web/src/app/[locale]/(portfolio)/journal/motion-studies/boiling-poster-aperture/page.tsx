import { BoilingPosterApertureReferenceWork } from "@/features/motion/reference-works/boiling-poster-aperture/BoilingPosterApertureReferenceWork";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirst(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function readBooleanParam(
  value: string | string[] | undefined,
  fallback: boolean,
) {
  const nextValue = readFirst(value);

  if (!nextValue) {
    return fallback;
  }

  if (nextValue === "1" || nextValue === "true") {
    return true;
  }

  if (nextValue === "0" || nextValue === "false") {
    return false;
  }

  return fallback;
}

function readFrameParam(
  value: string | string[] | undefined,
): number | null {
  const nextValue = readFirst(value);

  if (!nextValue) {
    return null;
  }

  const parsed = Number(nextValue);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export default async function BoilingPosterAperturePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const captureMode = readBooleanParam(resolvedSearchParams.capture, false);
  const frameOverride = readFrameParam(resolvedSearchParams.frame);
  const autoPlay = readBooleanParam(
    resolvedSearchParams.play ?? resolvedSearchParams.autoplay,
    frameOverride === null,
  );

  return (
    <BoilingPosterApertureReferenceWork
      autoPlay={autoPlay}
      captureMode={captureMode}
      frameOverride={frameOverride}
    />
  );
}
