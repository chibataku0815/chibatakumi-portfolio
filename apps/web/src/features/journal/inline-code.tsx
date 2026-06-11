import type { ReactNode } from "react";

export const MONO_STACK =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

/**
 * Renders `token` spans inside article prose as inline <code> chips.
 * The i18n strings use backtick pairs as the only inline markup; the
 * style gate (check-motion-study-style.mjs) enforces that pairs stay
 * balanced in prose and that summary/metaDescription carry none
 * (those render as plain text in listing cards and <meta> tags).
 */
export function renderInlineCode(text: string): ReactNode {
  if (!text.includes("`")) return text;
  const parts = text.split("`");
  return parts.map((part, i) => {
    // odd indices sit between a backtick pair; an unbalanced trailing
    // segment (gate-rejected, but be safe) falls back to plain text
    if (i % 2 === 1 && i !== parts.length - 1) {
      return (
        <code
          key={i}
          className="rounded-[4px] bg-[var(--bg-secondary)] px-[0.4em] py-[0.12em] text-[0.85em] text-[var(--text-base)]"
          style={{ fontFamily: MONO_STACK }}
        >
          {part}
        </code>
      );
    }
    return part;
  });
}
