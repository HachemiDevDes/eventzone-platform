"use client";

import React, { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import CustomTimePicker from "./CustomTimePicker";

const SCHEDULE_PRESETS = [
  "09:00 AM – 05:00 PM",
  "08:30 AM – 06:00 PM",
  "10:00 AM – 04:00 PM",
  "08:00 AM – 08:00 PM",
  "All Day (00:00 – 23:59)"
];

export default function CustomSchedulePicker({
  value = "",
  onChange,
  placeholder = "e.g. 09:00 AM – 05:00 PM",
  disabled = false,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Extract start and end time from value string
  const parseSchedule = (str) => {
    if (!str) return { start: "09:00 AM", end: "05:00 PM" };
    const parts = str.split("–").map(s => s.trim());
    if (parts.length === 2) {
      return { start: parts[0], end: parts[1] };
    }
    const dashParts = str.split("-").map(s => s.trim());
    if (dashParts.length === 2) {
      return { start: dashParts[0], end: dashParts[1] };
    }
    return { start: "09:00 AM", end: "05:00 PM" };
  };

  const parsed = parseSchedule(value);
  const [startTime, setStartTime] = useState(parsed.start);
  const [endTime, setEndTime] = useState(parsed.end);

  useEffect(() => {
    if (value) {
      const p = parseSchedule(value);
      setStartTime(p.start);
      setEndTime(p.end);
    }
  }, [value]);

  // Outside click to close
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

  const handleApplyTimes = (st, et) => {
    const s = st || startTime;
    const e = et || endTime;
    setStartTime(s);
    setEndTime(e);
    onChange && onChange(`${s} – ${e}`);
  };

  const handleSelectPreset = (preset) => {
    onChange && onChange(preset);
    const p = parseSchedule(preset);
    setStartTime(p.start);
    setEndTime(p.end);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger button */}
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
        <span className={value ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}>
          {value || placeholder}
        </span>
        <Clock size={14} className={isOpen ? "text-blue-600" : "text-slate-400"} />
      </button>

      {/* Floating Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-3xl shadow-xl p-4 w-80 animate-fade-in space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-extrabold text-slate-900">
              Daily Schedule Hours
            </span>
          </div>

          {/* Start and End Custom Time Pickers */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Opens At
              </span>
              <CustomTimePicker
                value={startTime}
                onChange={(t) => {
                  setStartTime(t);
                  handleApplyTimes(t, endTime);
                }}
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Closes At
              </span>
              <CustomTimePicker
                value={endTime}
                onChange={(t) => {
                  setEndTime(t);
                  handleApplyTimes(startTime, t);
                }}
              />
            </div>
          </div>

          {/* Quick Schedule Presets */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Popular Presets
            </span>
            <div className="space-y-1">
              {SCHEDULE_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-full py-1.5 px-3 rounded-xl text-start rtl:text-right text-left text-xs font-bold transition-colors cursor-pointer ${
                    value === preset
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Done button */}
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
