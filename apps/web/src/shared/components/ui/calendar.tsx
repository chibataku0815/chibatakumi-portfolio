"use client";

import { DayPicker, type DayPickerProps } from "react-day-picker";
import "react-day-picker/style.css";

export type CalendarProps = DayPickerProps;

export function Calendar({ className = "", ...props }: CalendarProps) {
  return (
    <DayPicker
      className={`photography-calendar ${className}`}
      {...props}
    />
  );
}
