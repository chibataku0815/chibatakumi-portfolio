"use client";

import { useState, useMemo, useCallback } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isBefore,
  startOfDay,
  format,
  getDay,
} from "date-fns";
import { ja, enUS } from "date-fns/locale";

interface CalendarProps {
  selected?: Date;
  onSelect: (date: Date) => void;
  locale: string;
  disableBefore?: Date;
}

export function Calendar({
  selected,
  onSelect,
  locale,
  disableBefore,
}: CalendarProps) {
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());
  const dateLocale = locale === "ja" ? ja : enUS;

  const weekDays = useMemo(() => {
    const base = new Date(2024, 0, 7); // Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return format(d, "EEEEE", { locale: dateLocale });
    });
  }, [dateLocale]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [viewDate]);

  const isDisabled = useCallback(
    (day: Date) => {
      if (!disableBefore) return false;
      return isBefore(startOfDay(day), startOfDay(disableBefore));
    },
    [disableBefore]
  );

  const handlePrev = () => setViewDate((v) => subMonths(v, 1));
  const handleNext = () => setViewDate((v) => addMonths(v, 1));

  const today = new Date();

  return (
    <div className="calendar-root w-[296px] select-none p-4">
      {/* Header — Month/Year + Nav */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          className="calendar-nav-btn flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-base-40)] transition-all hover:bg-[color-mix(in_oklch,var(--accent-amber1)_12%,transparent)] hover:text-[var(--text-base)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <span className="text-sm font-semibold tracking-tight text-[var(--text-base)]">
          {format(viewDate, locale === "ja" ? "yyyy年 M月" : "MMMM yyyy", {
            locale: dateLocale,
          })}
        </span>

        <button
          type="button"
          onClick={handleNext}
          className="calendar-nav-btn flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-base-40)] transition-all hover:bg-[color-mix(in_oklch,var(--accent-amber1)_12%,transparent)] hover:text-[var(--text-base)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7">
        {weekDays.map((wd, i) => (
          <div
            key={i}
            className="flex h-8 items-center justify-center font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--text-base-30)]"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px">
        {calendarDays.map((day) => {
          const inMonth = isSameMonth(day, viewDate);
          const isSelected = selected ? isSameDay(day, selected) : false;
          const isToday = isSameDay(day, today);
          const disabled = isDisabled(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!disabled) onSelect(day);
              }}
              className={`
                relative flex h-9 w-full items-center justify-center rounded-lg text-[13px] transition-all duration-150
                ${disabled
                  ? "cursor-default text-[var(--text-base-20)]"
                  : isSelected
                    ? "calendar-day-selected bg-[var(--accent-amber1)] font-semibold text-[var(--bg-dark)] shadow-[0_0_12px_color-mix(in_oklch,var(--accent-amber1)_50%,transparent)]"
                    : inMonth
                      ? "text-[var(--text-base-60)] hover:bg-[color-mix(in_oklch,var(--accent-amber1)_12%,transparent)] hover:text-[var(--text-base)]"
                      : "text-[var(--text-base-20)]"
                }
                ${isToday && !isSelected ? "calendar-day-today" : ""}
              `}
            >
              {format(day, "d")}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-[var(--accent-amber1)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
