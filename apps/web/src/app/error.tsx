"use client";

import { useEffect } from "react";
import { ErrorDisplay } from "@/features/error-pages/components";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーログ（開発環境のみ）
    if (process.env.NODE_ENV === "development") {
      console.error("Error boundary caught:", error);
    }

    // Production: エラートラッキング（Sentry等）
    // trackError(error);
  }, [error]);

  return (
    <ErrorDisplay
      title="Something Went Wrong"
      message="The fire flickered, but we can reignite it."
      errorDigest={error.digest}
      onReset={reset}
      showDetails={process.env.NODE_ENV === "development"}
      errorStack={error.stack}
    />
  );
}
