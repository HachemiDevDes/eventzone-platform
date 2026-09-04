"use client";

import React, { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";

const PRESETS = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
  "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"
];

const HOURS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

export default function CustomTimePicker({
  value = "",
  onChange,
  placeholder = "Select time",
  disabled = false,
  align = "auto",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [popupAlign, setPopupAlign] = useState(align === "right" ? "right" : "left");
  const containerRef = useRef(null);

  // Parse value into hour, minute, period (AM/PM)
  const parseTime = (tStr) => {
    if (!tStr) return { hour: "09", minute: "00", period: "AM" };

    if (tStr.includes("AM") || tStr.includes("PM")) {
      const parts = tStr.trim().split(" ");
      const timeParts = (parts[0] || "").split(":");
      return {
        hour: String(timeParts[0] || "09").padStart(2, "0"),
        minute: String(timeParts[1] || "00").padStart(2, "0"),
        period: (parts[1] || "AM").toUpperCase()
      };
    } else if (tStr.includes(":")) {
      const parts = tStr.split(":");
      let h = parseInt(parts[0], 10) || 0;
      const m = String(parts[1] || "00").padStart(2, "0");
      const period = h >= 12 ? "PM" : "AM";
      if (h === 0) h = 12;
      else if (h > 12) h -= 12;
      return {
        hour: String(h).padStart(2, "0"),
        minute: m,
        period
      };
    }
    return { hour: "09", minute: "00", period: "AM" };
  };

  const parsed = parseTime(value);
  const [selectedHour, setSelectedHour] = useState(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(parsed.period);

  useEffect(() => {
    if (value) {
      const p = parseTime(value);
      setSelectedHour(p.hour);
      setSelectedMinute(p.minute);
      setSelectedPeriod(p.period);
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

  const emitTime = (h, m, p) => {
    let formatted24 = "";
    let hourNum = parseInt(h, 10);
    if (p === "PM" && hourNum < 12) hourNum += 12;
    if (p === "AM" && hourNum === 12) hourNum = 0;
    formatted24 = `${String(hourNum).padStart(2, "0")}:${m}`;

    const formatted12 = `${h}:${m} ${p}`;
    
    if (value && value.length === 5 && value.includes(":") && !value.includes(" ")) {
      onChange && onChange(formatted24);
    } else {
      onChange && onChange(formatted12);
    }
  };

  const handleHourClick = (h) => {
    setSelectedHour(h);
    emitTime(h, selectedMinute, selectedPeriod);
  };

  const handleMinuteClick = (m) => {
    setSelectedMinute(m);
    emitTime(selectedHour, m, selectedPeriod);
  };

  const handlePeriodClick = (p) => {
    setSelectedPeriod(p);
    emitTime(selectedHour, selectedMinute, p);
  };

  const handlePresetClick = (preset) => {
    const p = parseTime(preset);
    setSelectedHour(p.hour);
    setSelectedMinute(p.minute);
    setSelectedPeriod(p.period);
    emitTime(p.hour, p.minute, p.period);
    setIsOpen(false);
  };

  const displayString = value ? (value.includes("AM") || value.includes("PM") ? value : `${selectedHour}:${selectedMinute} ${selectedPeriod}`) : "";

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border rounded-xl text-xs font-semibold text-start rtl:text-right text-left flex items-center justify-between transition-all cursor-pointer ${
          isOpen 
            ? "border-blue-600 bg-white ring-4 ring-blue-50 shadow-xs" 
            : "border-slate-200 hover:border-slate-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className={displayString ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}>
          {displayString || placeholder}
        </span>
        <Clock size={14} className={isOpen ? "text-blue-600" : "text-slate-400"} />
      </button>

      {/* Floating Popup Time Picker */}
      {isOpen && (
        <div className={`absolute top-full ${popupAlign === "right" ? "right-0" : "left-0"} mt-2 z-50 bg-white border border-slate-200 rounded-3xl shadow-xl p-4 w-[270px] max-w-[calc(100vw-32px)] animate-fade-in space-y-3`}>
          {/* Top header & AM/PM Toggle */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-extrabold text-slate-900">
              {selectedHour}:{selectedMinute} {selectedPeriod}
            </span>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => handlePeriodClick("AM")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === "AM"
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handlePeriodClick("PM")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === "PM"
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Hour & Minute Selectors Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Hours */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Hour
              </span>
              <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto pr-1">
                {HOURS.map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHourClick(h)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedHour === h
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Minute
              </span>
              <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto pr-1">
                {MINUTES.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMinuteClick(m)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedMinute === m
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Select
            </span>
            <div className="grid grid-cols-3 gap-1">
              {["09:00 AM", "12:00 PM", "05:00 PM"].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className="py-1 px-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg text-[10px] font-bold transition-colors cursor-pointer text-center"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
