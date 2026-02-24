"use client";

import * as React from "react";
import { DayPicker, useDayPicker } from "react-day-picker";
import { format } from "date-fns";

import { cn } from "@/lib/utils";

function CustomMonthCaption() {
  const { goToMonth, previousMonth, nextMonth, months } = useDayPicker();
  const displayMonth = months[0]?.date || new Date();

  return (
    <div className="flex items-center justify-between h-9 mb-2">
      <button
        type="button"
        disabled={!previousMonth}
        onClick={() => previousMonth && goToMonth(previousMonth)}
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="text-sm font-medium text-white">
        {format(displayMonth, "MMMM yyyy")}
      </span>
      <button
        type="button"
        disabled={!nextMonth}
        onClick={() => nextMonth && goToMonth(nextMonth)}
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

function Calendar({
  className,
  classNames,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      className={cn("p-3", className)}
      hideNavigation
      components={{
        MonthCaption: CustomMonthCaption,
      }}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-2",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-white/40 w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-1",
        day: "h-9 w-9 text-center text-sm relative flex items-center justify-center rounded-lg transition-all",
        day_button:
          "h-9 w-9 flex items-center justify-center rounded-lg text-white/80 hover:bg-purple-500/20 hover:text-white transition-all cursor-pointer",
        selected:
          "!bg-purple-500/30 !text-purple-200 font-semibold border border-purple-500/50",
        today: "bg-white/10 text-white font-semibold",
        outside: "text-white/20",
        disabled: "text-white/20 cursor-not-allowed",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
