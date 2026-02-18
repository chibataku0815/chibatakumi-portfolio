"use client";

import { HeroShaderBackground } from "@/features/hero/components";

interface ErrorDisplayProps {
  title: string;
  message: string;
  errorDigest?: string;
  onReset: () => void;
  showDetails?: boolean;
  errorStack?: string;
}

export function ErrorDisplay({
  title,
  message,
  errorDigest,
  onReset,
  showDetails = false,
  errorStack,
}: ErrorDisplayProps) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6">
      {/* Background - dimmed shader */}
      <HeroShaderBackground />
      <div className="absolute inset-0 bg-black/40" /> {/* Dimming overlay */}

      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        <h1 className="text-[clamp(3rem,10vw,6rem)] font-bold leading-none text-[var(--text-base-30)]">
          Error
        </h1>

        <div className="flex flex-col gap-4">
          <p className="text-2xl font-medium text-[var(--text-base-70)]">
            {title}
          </p>
          <p className="max-w-md text-base text-[var(--text-base-50)]">
            {message}
          </p>

          {showDetails && errorDigest && (
            <details className="mt-4 max-w-2xl text-left">
              <summary className="cursor-pointer font-mono text-xs text-[var(--text-base-40)] hover:text-[var(--text-base-60)]">
                Error Details (Dev Only)
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-black/50 p-4 font-mono text-xs text-[var(--text-base-50)]">
                Digest: {errorDigest}
                {errorStack && `\n\n${errorStack}`}
              </pre>
            </details>
          )}
        </div>

        <button
          onClick={onReset}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--text-base-20)] px-8 py-4 text-sm font-medium uppercase tracking-[0.12em] text-[var(--text-base)] transition-all duration-300 hover:border-[var(--accent-amber1)]/60 hover:text-[var(--accent-amber1)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      </div>
    </main>
  );
}
