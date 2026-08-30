"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

/**
 * SearchableSelect
 * A modern, accessible searchable select dropdown with instant filtering.
 * 
 * Props:
 * - value: current selected value (string | number)
 * - onChange: callback when value changes: (newValue) => void
 * - options: array of strings or objects [{ value, label, icon, badge, description }]
 * - placeholder: default placeholder text
 * - searchPlaceholder: placeholder inside the search input
 * - disabled: boolean
 * - required: boolean
 * - isClearable: boolean (default true)
 * - className: custom wrapper class
 * - buttonClassName: custom trigger button class
 * - error: boolean | string
 */
export default function SearchableSelect({
  value = "",
  onChange,
  options = [],
  placeholder = "-- Select an option --",
  searchPlaceholder = "Type to search...",
  disabled = false,
  required = false,
  isClearable = true,
  showSearch = true,
  className = "",
  buttonClassName = "",
  error = false,
  name = "",
  id = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options into standardized format [{ value, label, original }]
  const normalizedOptions = useMemo(() => {
    return (options || []).map((opt) => {
      if (typeof opt === "string" || typeof opt === "number") {
        return {
          value: String(opt),
          label: String(opt),
          original: opt,
        };
      }
      if (opt && typeof opt === "object") {
        return {
          value: String(opt.value !== undefined ? opt.value : opt.label || ""),
          label: String(opt.label !== undefined ? opt.label : opt.value || ""),
          icon: opt.icon,
          badge: opt.badge,
          description: opt.description,
          disabled: Boolean(opt.disabled),
          original: opt,
        };
      }
      return { value: "", label: "", original: opt };
    });
  }, [options]);

  // Current selected option object
  const selectedOption = useMemo(() => {
    const stringVal = String(value || "");
    if (!stringVal) return null;
    return normalizedOptions.find((opt) => opt.value === stringVal) || { value: stringVal, label: stringVal };
  }, [normalizedOptions, value]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const query = searchTerm.toLowerCase().trim();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(query) ||
      opt.value.toLowerCase().includes(query) ||
      (opt.description && opt.description.toLowerCase().includes(query))
    );
  }, [normalizedOptions, searchTerm]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(-1);
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    } else {
      setSearchTerm("");
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        const targetOpt = filteredOptions[highlightedIndex];
        if (!targetOpt.disabled) {
          handleSelect(targetOpt);
        }
      }
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[role='option']");
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (option) => {
    if (option && option.disabled) return;
    if (onChange) {
      onChange(option.value, option);
    }
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange("", null);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left font-sans select-none ${isOpen ? "z-50" : ""} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for HTML form validation if required */}
      {required && (
        <input
          type="text"
          name={name}
          id={id}
          value={value || ""}
          required={required}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs text-left ${
          disabled
            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            : error
            ? "border-rose-400 ring-2 ring-rose-100 text-slate-900"
            : isOpen
            ? "border-blue-600 ring-3 ring-blue-50 text-slate-900 shadow-sm"
            : "border-slate-300 hover:border-slate-400 text-slate-800"
        } ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate pr-1">
          {selectedOption?.icon && (
            <span className="shrink-0 text-slate-500">{selectedOption.icon}</span>
          )}
          <span className={`truncate ${selectedOption ? "font-bold text-slate-900" : "text-slate-400 font-normal"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isClearable && selectedOption && !disabled && (
            <span
              role="button"
              onClick={handleClear}
              className="p-0.5 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 transition-colors"
              title="Clear selection"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-150 ${isOpen ? "rotate-180 text-blue-600" : ""}`}
          />
        </div>
      </button>

      {/* Searchable Dropdown Popup */}
      {isOpen && (
        <div className="absolute z-[999] left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-scale-up min-w-[220px]">
          
          {/* Top Search Input */}
          {showSearch && normalizedOptions.length > 1 && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10">
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                  onClick={(e) => e.stopPropagation()}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div
            ref={listRef}
            role="listbox"
            className="max-h-56 overflow-y-auto p-1 space-y-0.5 overscroll-contain"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-slate-400 font-medium">
                No options found for &ldquo;<span className="text-slate-700 font-bold">{searchTerm}</span>&rdquo;
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(value) === opt.value;
                const isHighlighted = idx === highlightedIndex;
                const isDisabled = Boolean(opt.disabled);

                return (
                  <div
                    key={opt.value + "-" + idx}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled}
                    onClick={() => !isDisabled && handleSelect(opt)}
                    onMouseEnter={() => !isDisabled && setHighlightedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                      isDisabled
                        ? "opacity-50 cursor-not-allowed bg-slate-50/70 text-slate-400 select-none"
                        : isSelected
                        ? "bg-blue-50 text-blue-700 font-bold cursor-pointer"
                        : isHighlighted
                        ? "bg-slate-100 text-slate-900 font-semibold cursor-pointer"
                        : "text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      {opt.icon && <span className={`shrink-0 ${isDisabled ? "opacity-40" : ""}`}>{opt.icon}</span>}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{opt.label}</span>
                        {opt.description && (
                          <span className={`text-[10px] truncate ${isDisabled ? "text-slate-400 italic" : "text-slate-400 font-normal"}`}>
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check size={14} className="text-blue-600 shrink-0" strokeWidth={2.5} />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer count indicator if large list */}
          {normalizedOptions.length > 8 && (
            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-semibold flex justify-between items-center">
              <span>{filteredOptions.length} of {normalizedOptions.length} choices</span>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="text-blue-600 hover:underline font-bold"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
