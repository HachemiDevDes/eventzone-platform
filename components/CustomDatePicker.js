"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  minDate,
  maxDate,
  disabled = false,
  align = "auto",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [popupAlign, setPopupAlign] = useState(align === "right" ? "right" : "left");
  const containerRef = useRef(null);

  // Parse initial or active date
  const parseDate = (dStr) => {
    if (!dStr) return null;
    const parts = dStr.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
    const dt = new Date(dStr);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const selectedDate = parseDate(value);
  const initialViewDate = selectedDate || new Date();

  const [viewYear, setViewYear] = useState(initialViewDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialViewDate.getMonth());

  // Update view when value changes externally
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [value]);

  // Adjust popup alignment on open
  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (align === "right") {
        setPopupAlign("right");
      } else if (align === "left") {
        setPopupAlign("left");
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const parent = containerRef.current.closest('aside, main, form, [class*="overflow"]') || document.body;
        const parentRect = parent ? parent.getBoundingClientRect() : { right: window.innerWidth, left: 0 };
        
        const popupWidth = 270;
        const fitsLeft = (rect.left + popupWidth) <= Math.min(parentRect.right, window.innerWidth);
        const fitsRight = (rect.right - popupWidth) >= Math.max(parentRect.left, 0);

        if (!fitsLeft && fitsRight) {
          setPopupAlign("right");
        } else {
          setPopupAlign("left");
        }
      }
    }
  }, [isOpen, align]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Month navigation
  const prevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Format date helper to YYYY-MM-DD
  const formatToISO = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Format date display for user: e.g. "Nov 5, 2026"
  const formatDisplay = (dStr) => {
    const dt = parseDate(dStr);
    if (!dt) return "";
    return dt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // Generate 42 calendar grid cells (6 weeks)
  const getDaysGrid = () => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    // Previous month filler days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const dateObj = new Date(viewYear, viewMonth - 1, d);
      days.push({
        dateObj,
        dayNum: d,
        isCurrentMonth: false,
        isoStr: formatToISO(dateObj)
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(viewYear, viewMonth, d);
      days.push({
        dateObj,
        dayNum: d,
        isCurrentMonth: true,
        isoStr: formatToISO(dateObj)
      });
    }

    // Next month filler days (to make 35 or 42 cells)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(viewYear, viewMonth + 1, d);
      days.push({
        dateObj,
        dayNum: d,
        isCurrentMonth: false,
        isoStr: formatToISO(dateObj)
      });
    }

    return days;
  };

  const handleSelectDay = (dayItem, e) => {
    e.stopPropagation();
    if (disabled) return;

    if (minDate && dayItem.isoStr < minDate) return;
    if (maxDate && dayItem.isoStr > maxDate) return;

    onChange && onChange(dayItem.isoStr);
    setIsOpen(false);
  };

  const handleSelectToday = (e) => {
    e.stopPropagation();
    const today = new Date();
    const iso = formatToISO(today);
    onChange && onChange(iso);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange && onChange("");
    setIsOpen(false);
  };

  const todayISO = formatToISO(new Date());
  const grid = getDaysGrid();

  return (
    <div ref={containerRef} className={`relative select-none ${isOpen ? "z-50" : ""} ${className}`}>
      {/* Input Trigger Field */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
          isOpen 
            ? "border-blue-600 bg-white ring-4 ring-blue-50 shadow-xs" 
            : "border-slate-200 hover:border-slate-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className={value ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <Calendar size={14} className={isOpen ? "text-blue-600" : "text-slate-400"} />
      </button>

      {/* Floating Popup Calendar */}
      {isOpen && (
        <div className={`absolute top-full ${popupAlign === "right" ? "right-0" : "left-0"} mt-2 z-[999] bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 w-[270px] max-w-[calc(100vw-32px)] animate-fade-in`}>
          {/* Calendar Header: Month & Year + Nav */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-slate-900">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                title="Previous Month"
              >
                &larr;
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                title="Next Month"
              >
                &rarr;
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_NAMES.map((d) => (
              <span key={d} className="text-[10px] font-extrabold text-slate-400 py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {grid.map((item, idx) => {
              const isSelected = value === item.isoStr;
              const isToday = todayISO === item.isoStr;
              const isPastMin = minDate && item.isoStr < minDate;
              const isPastMax = maxDate && item.isoStr > maxDate;
              const isDisabledDay = isPastMin || isPastMax;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isDisabledDay}
                  onClick={(e) => handleSelectDay(item, e)}
                  className={`h-8 w-8 mx-auto rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs"
                      : isToday
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : item.isCurrentMonth
                          ? "text-slate-800 hover:bg-slate-100 hover:text-slate-900"
                          : "text-slate-300 hover:bg-slate-50"
                  } ${isDisabledDay ? "opacity-25 cursor-not-allowed pointer-events-none" : ""}`}
                >
                  {item.dayNum}
                </button>
              );
            })}
          </div>

          {/* Quick Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-3 text-xs">
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-500 hover:text-rose-600 font-bold transition-colors cursor-pointer"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleSelectToday}
              className="text-blue-600 hover:text-blue-700 font-bold transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
