"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { ja, enUS } from "date-fns/locale";
import { Calendar } from "./calendar";

interface DatePickerProps {
  name: string;
  locale: string;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  name,
  locale,
  placeholder = "Select a date",
  className = "",
}: DatePickerProps) {
  const [date, setDate] = useState<Date | undefined>();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const dateLocale = locale === "ja" ? ja : enUS;

  // Close on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleClickOutside, handleKeyDown]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center rounded-[1rem] border px-4 py-3 text-left transition-all duration-200 focus:outline-none ${
          open
            ? "border-[var(--accent-amber1)] shadow-[0_0_0_1px_var(--accent-amber1),0_0_16px_color-mix(in_oklch,var(--accent-amber1)_20%,transparent)]"
            : "border-[var(--text-base-20)] hover:border-[var(--text-base-30)]"
        } bg-[color-mix(in_srgb,var(--slate-2)_48%,transparent)]`}
      >
        <span
          className={
            date
              ? "text-[var(--text-base)]"
              : "text-[var(--text-base-30)]"
          }
        >
          {date
            ? format(date, locale === "ja" ? "yyyy年 M月 d日" : "PPP", {
                locale: dateLocale,
              })
            : placeholder}
        </span>

        <svg
          className={`ml-auto h-4 w-4 transition-all duration-200 ${
            open ? "text-[var(--accent-amber1)]" : "text-[var(--text-base-40)]"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
        </svg>
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div className="calendar-dropdown absolute left-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-[1.2rem] border border-[var(--text-base-20)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--slate-2)_95%,transparent),color-mix(in_srgb,var(--slate-1)_90%,transparent))] shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)]">
          {/* Amber heat accent line */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-amber1)] to-transparent opacity-50" />

          <Calendar
            selected={date}
            onSelect={(d) => {
              setDate(d);
              setOpen(false);
            }}
            locale={locale}
            disableBefore={new Date()}
          />

          {/* Footer hint */}
          {date && (
            <div className="border-t border-[var(--text-base-20)] px-4 py-2.5">
              <button
                type="button"
                onClick={() => {
                  setDate(undefined);
                  setOpen(false);
                }}
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-base-30)] transition-colors hover:text-[var(--accent-amber1)]"
              >
                {locale === "ja" ? "クリア" : "Clear"}
              </button>
            </div>
          )}
        </div>
      )}

      <input
        type="hidden"
        name={name}
        value={date ? date.toISOString().split("T")[0] : ""}
      />
    </div>
  );
}
