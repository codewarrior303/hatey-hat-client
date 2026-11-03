"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  RotateCcw,
  Check,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateTimePickerProps {
  value?: string | Date | null;
  onChange?: (isoString: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Custom Theme-Reactive DateTimePicker
 * - Replaces native <input type="datetime-local">
 * - Beautiful monochrome liquid-glass styling adhering to Light/Dark tokens
 * - Strict future-only validation: blocks past dates and past times today
 * - 12-hour format with hours, 5-minute step minutes, and AM/PM toggle
 * - Keyboard accessible with ARIA attributes and focus management
 */
export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date and time",
  disabled = false,
  id,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse incoming value safely into a valid local Date or null
  const selectedDate = React.useMemo(() => {
    if (!value) return null;
    const d = typeof value === "string" ? new Date(value) : value;
    return Number.isNaN(d.getTime()) ? null : d;
  }, [value]);

  // Current calendar month view state
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
    if (selectedDate) return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Time states (12-hour format)
  const [selectedHour, setSelectedHour] = React.useState<number>(() => {
    if (selectedDate) {
      const h = selectedDate.getHours() % 12;
      return h === 0 ? 12 : h;
    }
    return 10; // Default 10 AM
  });

  const [selectedMinute, setSelectedMinute] = React.useState<number>(() => {
    if (selectedDate) {
      const m = selectedDate.getMinutes();
      return Math.round(m / 5) * 5 % 60;
    }
    return 0; // Default 00
  });

  const [selectedPeriod, setSelectedPeriod] = React.useState<"AM" | "PM">(() => {
    if (selectedDate) {
      return selectedDate.getHours() >= 12 ? "PM" : "AM";
    }
    return "AM";
  });

  // Sync internal state when external value changes
  React.useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      const h24 = selectedDate.getHours();
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      setSelectedHour(h12);
      setSelectedMinute(Math.round(selectedDate.getMinutes() / 5) * 5 % 60);
      setSelectedPeriod(h24 >= 12 ? "PM" : "AM");
    }
  }, [selectedDate]);

  // Helper event handler to commit a full date and time
  const handleCommitDateTime = React.useCallback(
    (targetDay: Date, h12: number, min: number, period: "AM" | "PM") => {
      let h24 = h12 % 12;
      if (period === "PM") h24 += 12;

      const finalDate = new Date(
        targetDay.getFullYear(),
        targetDay.getMonth(),
        targetDay.getDate(),
        h24,
        min,
        0,
        0
      );

      const nowTimestamp = new Date().getTime();
      if (finalDate.getTime() <= nowTimestamp) {
        const nextHour = new Date(nowTimestamp + 3600000);
        nextHour.setMinutes(0, 0, 0);
        onChange?.(nextHour.toISOString());
        return;
      }

      onChange?.(finalDate.toISOString());
    },
    [onChange]
  );

  // Month navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Check if previous month navigation should be disabled
  const isPrevMonthDisabled = React.useMemo(() => {
    const now = new Date();
    return (
      currentMonth.getFullYear() === now.getFullYear() &&
      currentMonth.getMonth() <= now.getMonth()
    );
  }, [currentMonth]);

  // Calendar Day Generation
  const calendarDays = React.useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const days: Array<{
      date: Date | null;
      dayNumber: number;
      isToday: boolean;
      isSelected: boolean;
      isPast: boolean;
    }> = [];

    // Empty lead slots
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ date: null, dayNumber: 0, isToday: false, isSelected: false, isPast: true });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const date = new Date(year, month, d);
      const isPast = date.getTime() < today.getTime();
      const isToday = date.getTime() === today.getTime();
      const isSelected = Boolean(
        selectedDate &&
          selectedDate.getFullYear() === year &&
          selectedDate.getMonth() === month &&
          selectedDate.getDate() === d
      );

      days.push({ date, dayNumber: d, isToday, isSelected, isPast });
    }

    return days;
  }, [currentMonth, selectedDate]);

  // Determine if chosen date is Today
  const isSelectedDateToday = React.useMemo(() => {
    if (!selectedDate) return false;
    const now = new Date();
    return (
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate()
    );
  }, [selectedDate]);

  // Check if an hour/minute combination is in the past for Today
  const isTimeInPast = React.useCallback(
    (h12: number, min: number, period: "AM" | "PM") => {
      if (!isSelectedDateToday) return false;
      let h24 = h12 % 12;
      if (period === "PM") h24 += 12;

      const now = new Date();
      if (h24 < now.getHours()) return true;
      if (h24 === now.getHours() && min <= now.getMinutes()) return true;
      return false;
    },
    [isSelectedDateToday]
  );

  // Handle day click
  const handleSelectDay = (dayDate: Date) => {
    // If today is selected, ensure time is in the future
    let h12 = selectedHour;
    let min = selectedMinute;
    let period = selectedPeriod;

    const now = new Date();
    const isToday =
      dayDate.getFullYear() === now.getFullYear() &&
      dayDate.getMonth() === now.getMonth() &&
      dayDate.getDate() === now.getDate();

    if (isToday) {
      let h24 = (h12 % 12) + (period === "PM" ? 12 : 0);
      if (h24 < now.getHours() || (h24 === now.getHours() && min <= now.getMinutes())) {
        // Nudge to next whole hour
        const nextHour = new Date(now.getTime() + 3600000);
        h24 = nextHour.getHours();
        min = 0;
        h12 = h24 % 12 === 0 ? 12 : h24 % 12;
        period = h24 >= 12 ? "PM" : "AM";
        setSelectedHour(h12);
        setSelectedMinute(min);
        setSelectedPeriod(period);
      }
    }

    handleCommitDateTime(dayDate, h12, min, period);
  };

  // Format trigger label (e.g. "Tue, 3 Nov 2026, 2:30 PM")
  const triggerLabel = React.useMemo(() => {
    if (!selectedDate) return null;
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, [selectedDate]);

  // Presets handler
  const handlePreset = (daysAhead: number, hour24: number, min: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysAhead);
    target.setHours(hour24, min, 0, 0);

    const h12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";

    setSelectedHour(h12);
    setSelectedMinute(min);
    setSelectedPeriod(period);
    setCurrentMonth(new Date(target.getFullYear(), target.getMonth(), 1));

    onChange?.(target.toISOString());
  };

  const handleClear = () => {
    onChange?.("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          data-invalid={ariaInvalid ? "true" : undefined}
          aria-describedby={ariaDescribedBy}
          className={cn(
            "w-full flex items-center justify-between px-3.5 h-11 rounded-xl glass bg-transparent",
            "border border-foreground/15 text-sm transition-all select-none text-left",
            "hover:bg-foreground/[0.03] active:scale-[0.99]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            ariaInvalid && "border-destructive focus-visible:ring-destructive",
            className
          )}
        >
          <div className="flex items-center gap-2.5 truncate">
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={cn("truncate font-normal", !triggerLabel && "text-muted-foreground")}>
              {triggerLabel || placeholder}
            </span>
          </div>

          <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[330px] sm:w-[350px] p-4 glass rounded-3xl border border-foreground/15 shadow-2xl backdrop-blur-2xl"
      >
        {/* Quick Presets Bar */}
        <div className="flex items-center gap-1.5 pb-3 border-b border-foreground/10 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0 flex items-center gap-1 mr-1">
            <Sparkles className="h-3 w-3" />
            Quick:
          </span>
          <button
            type="button"
            onClick={() => handlePreset(1, 10, 0)}
            className="text-xs px-2.5 py-1 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground shrink-0 transition-colors"
          >
            Tomorrow 10 AM
          </button>
          <button
            type="button"
            onClick={() => handlePreset(3, 15, 0)}
            className="text-xs px-2.5 py-1 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground shrink-0 transition-colors"
          >
            In 3 Days 3 PM
          </button>
          <button
            type="button"
            onClick={() => handlePreset(7, 9, 30)}
            className="text-xs px-2.5 py-1 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground shrink-0 transition-colors"
          >
            Next Week
          </button>
        </div>

        {/* Calendar Header */}
        <div className="flex items-center justify-between pt-3 pb-2 px-1">
          <h4 className="text-sm font-semibold tracking-tight text-foreground">
            {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h4>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isPrevMonthDisabled}
              onClick={prevMonth}
              aria-label="Previous month"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-20"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              aria-label="Next month"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center py-1">
          {WEEKDAY_NAMES.map((w) => (
            <span key={w} className="text-[11px] font-medium text-muted-foreground">
              {w}
            </span>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1 pt-1 pb-3 border-b border-foreground/10">
          {calendarDays.map((item, idx) => {
            if (!item.date) {
              return <div key={`empty-${idx}`} className="h-8 w-8 sm:h-9 sm:w-9" />;
            }

            return (
              <button
                key={item.date.toISOString()}
                type="button"
                disabled={item.isPast}
                onClick={() => handleSelectDay(item.date!)}
                className={cn(
                  "h-8 w-8 sm:h-9 sm:w-9 mx-auto rounded-xl text-xs font-medium transition-all flex items-center justify-center select-none",
                  item.isPast && "text-muted-foreground/30 cursor-not-allowed pointer-events-none",
                  !item.isPast && !item.isSelected && "text-foreground hover:bg-foreground/10 active:scale-95",
                  item.isToday && !item.isSelected && "ring-1 ring-foreground/40 font-semibold",
                  item.isSelected && "bg-foreground text-background font-semibold shadow-xs"
                )}
                aria-label={item.date.toLocaleDateString("en-US", { dateStyle: "full" })}
              >
                {item.dayNumber}
              </button>
            );
          })}
        </div>

        {/* Time Selector Section */}
        <div className="pt-3 pb-2 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Clock className="h-3.5 w-3.5" />
              Time
            </span>
            <span>{selectedPeriod === "PM" ? "Afternoon / Evening" : "Morning"}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Hour Selector */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground block text-center">
                Hour
              </label>
              <select
                aria-label="Select hour"
                value={selectedHour}
                onChange={(e) => {
                  const h = Number(e.target.value);
                  setSelectedHour(h);
                  if (selectedDate) handleCommitDateTime(selectedDate, h, selectedMinute, selectedPeriod);
                }}
                className="w-full h-9 rounded-xl glass bg-transparent border border-foreground/15 text-xs text-center font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
                  const past = isTimeInPast(h, selectedMinute, selectedPeriod);
                  return (
                    <option key={h} value={h} disabled={past} className="bg-background text-foreground">
                      {h}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Minute Selector (5-minute steps) */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground block text-center">
                Minute
              </label>
              <select
                aria-label="Select minute"
                value={selectedMinute}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  setSelectedMinute(m);
                  if (selectedDate) handleCommitDateTime(selectedDate, selectedHour, m, selectedPeriod);
                }}
                className="w-full h-9 rounded-xl glass bg-transparent border border-foreground/15 text-xs text-center font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => {
                  const past = isTimeInPast(selectedHour, m, selectedPeriod);
                  return (
                    <option key={m} value={m} disabled={past} className="bg-background text-foreground">
                      {String(m).padStart(2, "0")}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* AM / PM Segmented Control */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground block text-center">
                Period
              </label>
              <div className="flex h-9 rounded-xl glass border border-foreground/15 p-0.5 bg-foreground/5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPeriod("AM");
                    if (selectedDate) handleCommitDateTime(selectedDate, selectedHour, selectedMinute, "AM");
                  }}
                  disabled={isSelectedDateToday && isTimeInPast(selectedHour, selectedMinute, "AM")}
                  className={cn(
                    "flex-1 text-xs font-semibold rounded-lg transition-all disabled:opacity-20",
                    selectedPeriod === "AM"
                      ? "bg-foreground text-background shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPeriod("PM");
                    if (selectedDate) handleCommitDateTime(selectedDate, selectedHour, selectedMinute, "PM");
                  }}
                  className={cn(
                    "flex-1 text-xs font-semibold rounded-lg transition-all",
                    selectedPeriod === "PM"
                      ? "bg-foreground text-background shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  PM
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-foreground/10">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-destructive h-8 px-2.5 rounded-lg"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Clear
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-xs h-8 px-4 rounded-full font-medium"
          >
            <Check className="h-3 w-3 mr-1" />
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
