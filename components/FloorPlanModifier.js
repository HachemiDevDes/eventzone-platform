"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { 
  Undo2, Redo2, Trash2, Copy, Grid, Layers, Download, Save, 
  Map, RotateCcw, Upload, FileJson, CheckCircle, ChevronDown, ChevronUp,
  Store, Crown, Star, Mic, ConciergeBell, LogIn, LogOut, Disc, 
  Armchair, Zap, AlertTriangle, Utensils, Square, Circle, Triangle,
  Printer, CircleDot, Monitor, Smartphone, Type, Image, Route,
  Search, Sparkles, Megaphone, HeartPulse, Heart, Tag, Plug, IdCard, Lock, Scan, Briefcase, Pencil, Users, Coffee,
  Plus, Minus, Pipette, Box, SeparatorHorizontal, ArrowLeft, ArrowUpRight, Shield, Fence, MapPin, Presentation, Tablet, Video, Wifi, Compass, GlassWater, LayoutTemplate,
  Eye, EyeOff, Maximize, ArrowRight, Mail, Globe, Folder, Clock, CheckCircle2, Keyboard, Share2, GripVertical, Clipboard
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";

// Dynamically import Konva Canvas component with SSR disabled
const FloorPlanCanvas = dynamic(() => import("./FloorPlanCanvas"), { ssr: false });
import ExportModal from "./ExportModal";
import SendPlanModal from "./SendPlanModal";
import SearchableSelect from "./SearchableSelect";
import { getLocalizedIndustry } from "../lib/constants";
import { supabase } from "../lib/supabase";
import { uploadMedia } from "../lib/storage";
import QRCode from "qrcode";
import { useLanguage } from "../lib/i18n";

const getSidesStatus = (openSides) => {
  if (!openSides) {
    return { top: true, right: true, bottom: true, left: true };
  }
  if (typeof openSides === "string") {
    switch (openSides) {
      case "front":
        return { top: true, right: true, bottom: false, left: true };
      case "front-left":
        return { top: true, right: true, bottom: false, left: false };
      case "front-right":
        return { top: true, right: false, bottom: false, left: true };
      case "front-left-right":
        return { top: true, right: false, bottom: false, left: false };
      case "all":
        return { top: false, right: false, bottom: false, left: false };
      case "none":
      default:
        return { top: true, right: true, bottom: true, left: true };
    }
  }
  return {
    top: !openSides.top,
    right: !openSides.right,
    bottom: !openSides.bottom,
    left: !openSides.left
  };
};

const getSidesOpenState = (openSides) => {
  if (!openSides) {
    return { top: false, right: false, bottom: false, left: false };
  }
  if (typeof openSides === "string") {
    switch (openSides) {
      case "front":
        return { top: false, right: false, bottom: true, left: false };
      case "front-left":
        return { top: false, right: false, bottom: true, left: true };
      case "front-right":
        return { top: false, right: true, bottom: true, left: false };
      case "front-left-right":
        return { top: false, right: true, bottom: true, left: true };
      case "all":
        return { top: true, right: true, bottom: true, left: true };
      case "none":
      default:
        return { top: false, right: false, bottom: false, left: false };
    }
  }
  return {
    top: !!openSides.top,
    right: !!openSides.right,
    bottom: !!openSides.bottom,
    left: !!openSides.left
  };
};

// Helper component for text/number inputs to prevent real-time clamping issues while typing
function PropertyInput({ value, onChange, type = "number", min, max, step, className, disabled = false }) {
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const handleBlur = () => {
    let parsed = type === "number" ? parseFloat(localVal) : localVal;
    if (type === "number") {
      if (isNaN(parsed)) parsed = value;
      if (min !== undefined && parsed < min) parsed = min;
      if (max !== undefined && parsed > max) parsed = max;
    }
    onChange(parsed);
    setLocalVal(parsed);
  };

  const handleChange = (e) => {
    setLocalVal(e.target.value);
  };

  return (
    <input
      type={type}
      min={min}
      max={max}
      step={step}
      value={localVal !== undefined && localVal !== null ? localVal : ""}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.target.blur();
        }
      }}
      className={className}
    />
  );
}

function FloorItem({ floor, isActive, isOnly, onSelect, onRename, onDelete }) {
  const { t, lang, isRTL } = useLanguage();

  const localizedFilterOptions = useMemo(() => [
    { value: "all", label: t("floor.filter_all", "Show All Locations"), icon: Globe, iconColor: "text-indigo-500" },
    { value: "draft", label: t("floor.filter_draft", "Draft Booths"), icon: Folder, iconColor: "text-amber-500" },
    { value: "available", label: t("floor.filter_available", "Available Booths"), icon: Circle, iconColor: "text-emerald-500" },
    { value: "reserved", label: t("floor.filter_reserved", "Reserved Booths"), icon: Clock, iconColor: "text-orange-500" },
    { value: "sold", label: t("floor.filter_sold", "Sold Booths"), icon: CheckCircle2, iconColor: "text-red-500" },
    { value: "checked_in", label: t("floor.filter_checked_in", "Checked In Booths"), icon: Shield, iconColor: "text-emerald-600" },
    { value: "empty", label: t("floor.filter_empty", "Empty Booths"), icon: Square, iconColor: "text-purple-400" },
    { value: "equipped", label: t("floor.filter_equipped", "Equipped Booths"), icon: Briefcase, iconColor: "text-rose-500" },
    { value: "tables", label: t("floor.filter_tables", "Banquet Seating Tables"), icon: Utensils, iconColor: "text-indigo-650" },
    { value: "logistics", label: t("floor.filter_logistics", "Logistics & Utilities"), icon: AlertTriangle, iconColor: "text-amber-600" },
  ], [t]);

  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(floor.name);

  useEffect(() => {
    setTempName(floor.name);
  }, [floor.name]);

  const handleCommit = () => {
    setIsEditing(false);
    const trimmed = tempName.trim();
    if (trimmed && trimmed !== floor.name) {
      onRename(trimmed);
    } else {
      setTempName(floor.name);
    }
  };

  return (
    <Reorder.Item
      value={floor}
      className={`group flex items-center gap-1.5 p-1 px-2 rounded-xl border text-[11px] font-semibold transition-all duration-150 select-none ${
        isActive
          ? "bg-indigo-50/70 border-indigo-150 text-indigo-700 shadow-sm"
          : "bg-white border-transparent text-slate-600 hover:bg-slate-50/50"
      }`}
    >
      {/* Drag handle */}
      <div className="cursor-grab active:cursor-grabbing text-slate-400 p-0.5 hover:text-slate-600 shrink-0">
        <GripVertical size={11} />
      </div>

      {/* Name / Input */}
      {isEditing ? (
        <input
          autoFocus
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCommit();
            if (e.key === "Escape") {
              setTempName(floor.name);
              setIsEditing(false);
            }
          }}
          className="flex-1 bg-white border border-indigo-300 rounded px-1 py-0.5 text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          onClick={onSelect}
          onDoubleClick={() => setIsEditing(true)}
          className="flex-1 truncate cursor-pointer py-0.5"
          title="Double-click to rename"
        >
          {floor.name === "Ground Floor" ? t("floor.groundFloor", "Ground Floor") : floor.name}
        </span>
      )}

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
            title="Rename Floor"
          >
            <Pencil size={10} />
          </button>
          {!isOnly && (
            <button
              onClick={onDelete}
              className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
              title="Delete Floor"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      )}
    </Reorder.Item>
  );
}

const CustomGoogleColorPicker = ({ value, onChange, onBlur, disabled }) => {
  const GOOGLE_PALETTE = [
    "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff",
    "#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff",
    "#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc",
    "#dd7e6b", "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#a4c2f4", "#9fc5e8", "#b4a7d6", "#d5a6bd",
    "#cc4125", "#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6d9ee8", "#6fa8dc", "#8e7cc3", "#c27ba0",
    "#a61c00", "#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3c78d8", "#3d85c6", "#674ea7", "#a64d79",
    "#85200c", "#990000", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#1155cc", "#0b5394", "#351c75", "#741b47",
    "#5b0f00", "#660000", "#783f04", "#7f6000", "#274e13", "#0c343d", "#1c4587", "#073763", "#20124d", "#4c1130"
  ];

  const [customColors, setCustomColors] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("eventzone-custom-colors");
      if (stored) {
        try {
          setCustomColors(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const addCustomColor = (color) => {
    if (!color) return;
    const hex = color.toLowerCase();
    const inPreset = GOOGLE_PALETTE.some(c => c.toLowerCase() === hex);
    if (inPreset) return;

    setCustomColors(prev => {
      const filtered = prev.filter(c => c.toLowerCase() !== hex);
      const updated = [color, ...filtered].slice(0, 8); // Keep last 8 custom colors
      localStorage.setItem("eventzone-custom-colors", JSON.stringify(updated));
      return updated;
    });
  };

  const removeCustomColor = (color) => {
    if (!color) return;
    const hex = color.toLowerCase();
    setCustomColors(prev => {
      const updated = prev.filter(c => c.toLowerCase() !== hex);
      localStorage.setItem("eventzone-custom-colors", JSON.stringify(updated));
      return updated;
    });
  };

  const triggerEyeDropper = async () => {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        onChange(result.sRGBHex);
        if (onBlur) onBlur(result.sRGBHex);
        addCustomColor(result.sRGBHex);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const safeValue = value || "#000000";

  return (
    <div className="p-3.5 bg-white border-t border-slate-150 flex flex-col gap-2.5 animate-fade-in shadow-inner">
      <div className="grid grid-cols-10 gap-1">
        {GOOGLE_PALETTE.map((hex, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange(hex);
              if (onBlur) onBlur(hex);
            }}
            className={`w-[18px] h-[18px] rounded-full border transition-all hover:scale-125 cursor-pointer disabled:opacity-40 shadow-sm ${
              safeValue.toLowerCase() === hex.toLowerCase() 
                ? "border-slate-800 scale-110 ring-1 ring-slate-400" 
                : "border-slate-200/70"
            }`}
            style={{ backgroundColor: hex }}
            title={hex}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-100 pt-2">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Custom</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="relative w-7 h-7 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center cursor-pointer hover:scale-105 transition-all shadow-sm" title="Custom color picker">
            <Plus size={15} className="text-slate-650" />
            <input 
              type="color"
              disabled={disabled}
              value={safeValue}
              onChange={(e) => {
                const val = e.target.value;
                onChange(val);
              }}
              onBlur={(e) => {
                const val = e.target.value;
                if (onBlur) onBlur(val);
                addCustomColor(val);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>

          {typeof window !== "undefined" && "EyeDropper" in window && (
            <button
              type="button"
              disabled={disabled}
              onClick={triggerEyeDropper}
              className="w-7 h-7 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center cursor-pointer hover:scale-105 transition-all shadow-sm"
              title="Use Eyedropper tool"
            >
              <Pipette size={13} className="text-slate-650" />
            </button>
          )}

          {/* Render Saved Custom Colors */}
          {customColors.map((color, idx) => (
            <div key={idx} className="relative group">
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChange(color);
                  if (onBlur) onBlur(color);
                }}
                className={`w-7 h-7 rounded-full border transition-all hover:scale-110 cursor-pointer disabled:opacity-40 shadow-sm ${
                  safeValue.toLowerCase() === color.toLowerCase()
                    ? "border-slate-800 scale-105 ring-1 ring-slate-400"
                    : "border-slate-200"
                }`}
                style={{ backgroundColor: color }}
                title={`${color} (Hover top-right to delete)`}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCustomColor(color);
                }}
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm cursor-pointer z-10 scale-90"
                title="Remove color"
              >
                <span className="text-[9px] font-bold leading-none select-none">×</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const filterOptions = [
  { value: "all", label: "Show All Locations", icon: Globe, iconColor: "text-indigo-500" },
  { value: "draft", label: "Draft Booths", icon: Folder, iconColor: "text-amber-500" },
  { value: "available", label: "Available Booths", icon: Circle, iconColor: "text-emerald-500" },
  { value: "reserved", label: "Reserved Booths", icon: Clock, iconColor: "text-orange-500" },
  { value: "sold", label: "Sold Booths", icon: CheckCircle2, iconColor: "text-red-500" },
  { value: "checked_in", label: "Checked In Booths", icon: Shield, iconColor: "text-emerald-600" },
  { value: "empty", label: "Empty Booths", icon: Square, iconColor: "text-purple-400" },
  { value: "equipped", label: "Equipped Booths", icon: Briefcase, iconColor: "text-rose-500" },
  { value: "tables", label: "Banquet Seating Tables", icon: Utensils, iconColor: "text-indigo-650" },
  { value: "logistics", label: "Logistics & Utilities", icon: AlertTriangle, iconColor: "text-amber-600" },
];

function CustomFilterDropdown({ value, onChange, options, btnClassName = "px-3.5 py-2.5 rounded-2xl text-xs" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];
  const SelectedIcon = selectedOption.icon;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-100/50 hover:bg-slate-100 border border-slate-200/50 focus:border-indigo-400 focus:bg-white font-bold text-slate-700 outline-none shadow-sm transition-all cursor-pointer flex items-center justify-between ${btnClassName}`}
      >
        <span className="flex items-center gap-2">
          {SelectedIcon && <SelectedIcon size={14} className={selectedOption.iconColor} />}
          <span>{selectedOption.label}</span>
        </span>
        <ChevronDown size={12} className={`transition-transform duration-150 text-slate-500 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-[99] py-1.5 max-h-60 overflow-y-auto">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-start rtl:text-right text-left px-3.5 py-2 hover:bg-slate-50 transition-colors text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                  isSelected ? "bg-indigo-50/50 text-indigo-650 font-bold" : "text-slate-700"
                }`}
              >
                {Icon && <Icon size={14} className={opt.iconColor} />}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


function getLocalizedElementLabel(label, type, t) {
  if (!label) return t ? t("floor.unnamedLocation", "Unnamed Location") : "Unnamed Location";
  if (!t) return label;
  if (label.startsWith("Empty Booth ")) {
    return `${t("floor.item_booth_empty", "Empty Booth")} ${label.slice(12)}`;
  }
  if (label.startsWith("Semi-Equipped Booth ")) {
    return `${t("floor.item_booth_semi", "Semi-Equipped Booth")} ${label.slice(20)}`;
  }
  if (label.startsWith("Equipped Booth ")) {
    return `${t("floor.item_booth_equipped", "Equipped Booth")} ${label.slice(15)}`;
  }
  if (label.startsWith("Booth ")) {
    return `${t("table.booth", "Booth")} ${label.slice(6)}`;
  }
  return label;
}

function getLocalizedTag(tag, t) {
  if (!tag) return "";
  if (!t) return tag;
  const lower = String(tag).trim().toLowerCase();
  if (lower === "available") return t("floor.status_available", "AVAILABLE").toUpperCase();
  if (lower === "reserved") return t("floor.status_reserved", "RESERVED").toUpperCase();
  if (lower === "sold") return t("floor.status_sold", "SOLD").toUpperCase();
  if (lower === "sold out") return t("floor.status_sold_out", "SOLD OUT").toUpperCase();
  return tag;
}

export default function FloorPlanModifier({ 
  exhibitors, 
  attendees = [],
  initialLayout = [], 
  onSaveLayout,
  onSaveBlueprintState,
  onBack,
  planName = "Floor Plan",
  onRename = () => {},
  initialBlueprintState = null,
  fontFamily = "Inter",
  onSaveFontFamily,
  onUploadFile,
  floorPlanId,
  saveStatus = "saved",
  initialPreviewMode = false,
  initialFloors = [],
  onSaveFloors
}) {
  const { t, lang, isRTL } = useLanguage();
  const initialFloorBlueprint = (initialFloors && initialFloors.length > 0 && initialFloors[0]?.blueprint)
    ? initialFloors[0].blueprint
    : (initialBlueprintState || {});

  const [floors, setFloors] = useState(() => {
    if (initialFloors && initialFloors.length > 0) {
      return initialFloors;
    }
    return [{
      id: "default-floor-id",
      name: planName || "Ground Floor",
      elements: initialLayout || [],
      blueprint: initialFloorBlueprint || {
        url: '', name: 'Venue Blueprint', opacity: 0.8,
        x: 0, y: 0, width: 800, height: 600, rotation: 0, isLocked: false,
      }
    }];
  });

  const [activeFloorId, setActiveFloorId] = useState(() => {
    if (initialFloors && initialFloors.length > 0) {
      return initialFloors[0].id;
    }
    return "default-floor-id";
  });

  const bp = initialFloorBlueprint || {};
  const [elements, setElements] = useState(() => {
    if (initialFloors && initialFloors.length > 0) {
      return initialFloors[0].elements || [];
    }
    return initialLayout;
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedSeatId, setSelectedSeatId] = useState(null);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [showDimensions, setShowDimensions] = useState(true);
  const [seatSearchQuery, setSeatSearchQuery] = useState("");
  const [assignSearchQuery, setAssignSearchQuery] = useState("");
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [arrayColumns, setArrayColumns] = useState(1);
  const [arrayRows, setArrayRows] = useState(1);
  const [arrayColumnGap, setArrayColumnGap] = useState(2.0);
  const [arrayRowGap, setArrayRowGap] = useState(2.0);
  const [showArrayModal, setShowArrayModal] = useState(false);
  const [toolMode, setToolMode] = useState(initialPreviewMode ? "preview" : "select");

  const [isPreviewMode, setIsPreviewMode] = useState(initialPreviewMode || false);
  const [previewSearchQuery, setPreviewSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [previewFilter, setPreviewFilter] = useState("all");
  const [isTablesSectionExpanded, setIsTablesSectionExpanded] = useState(false);
  const [previewDeviceMode, setPreviewDeviceMode] = useState("desktop"); // desktop | mobile
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [isMobileDirectoryOpen, setIsMobileDirectoryOpen] = useState(false);
  const [isShareTooltipVisible, setIsShareTooltipVisible] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(previewSearchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [previewSearchQuery]);

  useEffect(() => {
    if (isMobileDirectoryOpen && previewDeviceMode === "mobile") {
      setPreviewFilter("all");
      setPreviewSearchQuery("");
    }
  }, [isMobileDirectoryOpen, previewDeviceMode]);


  const exhibitorMap = React.useMemo(() => {
    const map = new window.Map();
    if (exhibitors) {
      exhibitors.forEach(ex => map.set(String(ex.id), ex));
    }
    return map;
  }, [exhibitors]);

  const attendeeMap = React.useMemo(() => {
    const map = new window.Map();
    if (attendees) {
      attendees.forEach(att => map.set(String(att.id), att));
    }
    return map;
  }, [attendees]);

  const filteredDirectoryElements = React.useMemo(() => {
    const q = debouncedSearchQuery.trim().toLowerCase();

    return elements.filter(el => {
      if (el.type === "text" || el.type === "image") return false;

      // Filter by type or status
      if (previewFilter && previewFilter !== "all") {
        const matchesFilter = (() => {
          if (previewFilter === "draft") return el.status === "draft" && el.type.startsWith("booth");
          if (previewFilter === "available") return (el.status === "available" || el.status === "draft") && el.type.startsWith("booth");
          if (previewFilter === "sold") return (el.status === "sold" || el.status === "confirmed") && el.type.startsWith("booth");
          if (previewFilter === "reserved") return (el.status === "reserved" || el.status === "pending-payment" || el.status === "hold" || el.status === "negotiation") && el.type.startsWith("booth");
          if (previewFilter === "confirmed") return (el.status === "confirmed" || el.status === "sold") && el.type.startsWith("booth");
          if (previewFilter === "checked_in") return (el.status === "checked_in" || el.status === "checked-in") && el.type.startsWith("booth");
          if (previewFilter === "empty") return el.type === "booth-empty";
          if (previewFilter === "equipped") return el.type === "booth-equipped" || el.type === "booth-semi";
          if (previewFilter === "tables") return el.type === "table" || el.type === "table-chairs" || el.type === "stage-podium";
          if (previewFilter === "logistics") return el.type.startsWith("utility") || el.type.startsWith("access") || el.type === "entrance" || el.type === "exit" || el.type === "desk";
          return true;
        })();
        if (!matchesFilter) return false;
      }

      if (!q) return el.type.startsWith("booth") || el.type === "stage" || el.type === "table-chairs" || el.type === "stage-podium" || el.type.startsWith("net") || el.type.startsWith("utility") || el.type.startsWith("access") || el.type === "entrance" || el.type === "exit" || el.type === "desk";

      if (el.label && el.label.toLowerCase().includes(q)) return true;
      if (el.type && el.type.toLowerCase().includes(q)) return true;
      if (el.status && el.status.toLowerCase().includes(q)) return true;
      if (el.exhibitorId) {
        const ex = exhibitorMap.get(String(el.exhibitorId));
        if (ex && ex.name.toLowerCase().includes(q)) return true;
      }
      if ((el.type === "table-chairs" || el.type === "stage-podium") && el.assignments) {
        const hasMatchingAttendee = Object.values(el.assignments).some(attId => {
          const att = attendeeMap.get(String(attId));
          return att && att.name.toLowerCase().includes(q);
        });
        if (hasMatchingAttendee) return true;
      }
      return false;
    });
  }, [elements, exhibitorMap, attendeeMap, debouncedSearchQuery, previewFilter]);

  // Precompute selected element details for mobile details drawer
  const mobileDetailsData = React.useMemo(() => {
    if (!isPreviewMode || previewDeviceMode !== "mobile" || selectedIds.length !== 1) return null;
    const el = elements.find(item => item.id === selectedIds[0]);
    if (!el) return null;

    let exhibitor = null;
    if (el.exhibitorId) {
      exhibitor = exhibitorMap.get(String(el.exhibitorId));
    }

    let title = "";
    let subtitle = "";
    let description = "";
    let tags = [];
    let logoText = "FP";
    let logoGradient = "from-indigo-500 to-purple-500";
    let attendee = null;

    let effectiveSeatId = selectedSeatId;
    if (!effectiveSeatId && el.type === "furniture-chair") {
      effectiveSeatId = "self";
    }

    if (effectiveSeatId) {
      let occupantId = null;
      let seatLabel = "";
      if (el.type === "furniture-chair") {
        occupantId = el.assigned_participant_id || el.attendeeId;
        seatLabel = el.label || "Single Chair";
      } else if (effectiveSeatId.startsWith("chair_")) {
        const idx = parseInt(effectiveSeatId.split("_")[1]);
        occupantId = el.assignments ? el.assignments[idx] : null;
        seatLabel = `Chair ${idx + 1}`;
      } else if (el.children) {
        const seat = el.children.find(c => c.id === effectiveSeatId);
        occupantId = seat?.assigned_participant_id || seat?.attendeeId;
        seatLabel = seat ? seat.label : effectiveSeatId;
      }

      if (occupantId) {
        attendee = attendeeMap.get(String(occupantId));
      }

      if (attendee) {
        title = seatLabel;
        subtitle = `Reserved for ${attendee.name}`;
        logoText = "👤";
        logoGradient = "from-emerald-500 to-teal-600";
        description = `This seat is reserved for ${attendee.name} (${attendee.company || "VIP Guest"}).`;
        tags = ["Reserved", attendee.ticketType || attendee.ticket_type || "VIP Access Pass"].filter(Boolean);
      } else {
        title = seatLabel;
        subtitle = "Available Seat";
        logoText = "🟢";
        logoGradient = "from-slate-400 to-slate-500";
        description = "This seat is currently unassigned and available.";
        tags = ["Available"];
      }
    } else if (exhibitor) {
      title = el.label || `Booth ${exhibitor.booth || el.id}`;
      subtitle = exhibitor.name;
      logoText = exhibitor.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
      
      if (el.status === "sold") {
        logoGradient = "from-emerald-500 to-teal-600";
        tags.push("Diamond Partner");
      } else {
        logoGradient = "from-indigo-500 to-blue-600";
        tags.push("Exhibitor");
      }
      tags.push("Tech");

      if (exhibitor.name.includes("Hydrogen")) {
        description = "Pioneering sustainable green hydrogen infrastructure solutions, hydrogen transport logistics, and electrolysis technology for global energy grids.";
        tags.push("Energy");
        tags.push("CleanTech");
      } else if (exhibitor.name.includes("Snam")) {
        description = "Leading European energy infrastructure operator, focusing on pipeline transport networks, natural gas storage facilities, and clean fuel alternatives.";
        tags.push("Infrastructure");
        tags.push("Sponsor");
      } else {
        description = "B2B exhibitor showcasing cutting-edge solutions, professional services, and technological innovations designed for the industrial energy sector.";
        tags.push("SaaS");
      }
    } else {
      if (el.type === "stage" || el.type === "stage-panel" || el.type === "stage-podium") {
        title = el.label || (el.type === "stage-podium" ? "Speaker Podium" : "Main Presentation Stage");
        subtitle = "Keynotes & Panels";
        logoText = "🎙️";
        logoGradient = "from-purple-600 to-pink-600";
        description = "Main auditorium staging hosting the ministerial opening keynotes, trans-Mediterranean pipeline legal frameworks, and green energy financing panels.";
        tags = ["Main Stage", "Presentations", "Audio-Visual", "VIP Speakers"];
      } else if (el.type === "utility-catering" || el.type === "utility-dining") {
        title = el.label || "Catering Hall";
        subtitle = "Food & Refreshments";
        logoText = "🍽️";
        logoGradient = "from-amber-500 to-orange-600";
        description = "Central hospitality dining hall serving organic lunch options, tea and coffee breaks, and providing seating space for informal delegate networking.";
        tags = ["Catering", "Dining Area", "Coffee Station", "Hospitality"];
      } else if (el.type === "net-vip" || el.type === "net-speakers") {
        title = el.label || "VIP Lounge";
        subtitle = "Exclusive Delegate Access";
        logoText = "👑";
        logoGradient = "from-rose-500 to-amber-500";
        description = "Exclusive networking lounge dedicated to speakers, sponsors, and VIP delegates, offering private meeting corners, quiet workspaces, and catering.";
        tags = ["VIP Access", "Lounge", "Networking", "Private"];
      } else if (el.type === "utility-wc") {
        title = "Restrooms / Facilities";
        subtitle = "Sanitation & Care";
        logoText = "🚻";
        logoGradient = "from-slate-400 to-slate-600";
        description = "Public sanitation facilities, gender-neutral restrooms, and accessible diaper-changing units maintained by the venue operations team.";
        tags = ["Facilities", "Accessible", "Restrooms"];
      } else if (el.type === "table-chairs") {
        title = el.label || "Seating Table";
        subtitle = "Banquet Networking Table";
        logoText = "👥";
        logoGradient = "from-cyan-500 to-blue-600";
        description = "Assigned seating table for banquet networking events, sponsor dinners, and group business discussions.";
        tags = ["Seating", "Networking", "Group Discussion"];
      } else {
        title = el.label || el.type.replace("utility-", "").replace("furniture-", "").replace("structural-", "").replace("access-", "").replace("stage-", "").replace("tech-", "").replace("net-", "").replace("-", " ").toUpperCase();
        subtitle = "Venue Facility";
        logoText = "📍";
        logoGradient = "from-slate-500 to-slate-700";
        description = `Interactive ${el.type.replace("-", " ")} element located within the exhibition floor plan zone.`;
        tags = ["Map Detail", "Venue"];
      }
    }

    if (effectiveSeatId) {
      tags = attendee ? ["RESERVED"] : ["AVAILABLE"];
    } else {
      tags = el.status ? [el.status.replace("-", " ").toUpperCase()] : [];
    }

    return {
      el,
      exhibitor,
      title,
      subtitle,
      description,
      tags,
      logoText,
      logoGradient,
      attendee,
      effectiveSeatId
    };
  }, [isPreviewMode, previewDeviceMode, selectedIds, selectedSeatId, elements, exhibitorMap, attendeeMap]);


  // Blueprint state
  const [blueprintUrl, setBlueprintUrl] = useState(bp.url ?? "");
  const [blueprintName, setBlueprintName] = useState(bp.name ?? "Venue Blueprint");
  const [blueprintOpacity, setBlueprintOpacity] = useState(bp.opacity ?? 0.8);
  const [blueprintX, setBlueprintX] = useState(bp.x ?? 0);
  const [blueprintY, setBlueprintY] = useState(bp.y ?? 0);
  const [blueprintWidth, setBlueprintWidth] = useState(bp.width ?? 800);
  const [blueprintHeight, setBlueprintHeight] = useState(bp.height ?? 600);
  const [blueprintRotation, setBlueprintRotation] = useState(bp.rotation ?? 0);
  const [blueprintIsLocked, setBlueprintIsLocked] = useState(bp.isLocked ?? false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(planName);

  useEffect(() => {
    setTempName(planName);
  }, [planName]);

  // Sync initialPreviewMode prop to internal preview state when URL changes
  useEffect(() => {
    setIsPreviewMode(initialPreviewMode);
    if (initialPreviewMode) {
      setToolMode("preview");
      setSelectedIds([]);
      setPreviewSearchQuery("");
      setPreviewFilter("all");
    } else {
      setToolMode("select");
    }
  }, [initialPreviewMode]);

  // Handle responsive device mode preview detection on mount / resize
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        const width = window.innerWidth;
        setWindowWidth(width);
        if (width < 1025) {
          setPreviewDeviceMode("mobile");
        }
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  useEffect(() => {
    if (!seatSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const handler = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("participants")
          .select("id, name, company, ticket_type, status")
          .ilike("name", `%${seatSearchQuery}%`)
          .limit(10);
        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error("Error searching participants:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [seatSearchQuery]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [activeColorPicker, setActiveColorPicker] = useState(null); // 'fill' | 'stroke' | 'text' | null
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSendPlanModalOpen, setIsSendPlanModalOpen] = useState(false);
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState(null);

  const [expandedSections, setExpandedSections] = useState({
    identity: true,
    geometry: true,
    appearance: true,
    booth: true,
    layout: false,
    tableChairs: true,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Sidebar categories & search state
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState({
    booths: true,
    structural: true,
    logistics: true,
    stages: true,
    tech: true,
    networking: true,
    furniture: true,
    facilities: true,
    shapes: true,
    annotations: true,
    outdoor: false,
    food: false,
  });

  const toggleCategory = (catId) => {
    setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const fileInputRef = useRef(null);
  const pictureInputRef = useRef(null);
  const canvasRef = useRef(null);
  const toolbarRef = useRef(null);
  const clipboardRef = useRef([]);  // stores copied element snapshots

  // Canvas logical dimensions (white rect in FloorPlanCanvas)
  const [canvasWidth, setCanvasWidth] = useState(bp.canvasWidth ?? 2400);
  const [canvasHeight, setCanvasHeight] = useState(bp.canvasHeight ?? 1500);

  // Floor-plan-level font
  const GOOGLE_FONTS = [
    { label: "Plus Jakarta Sans", value: "Plus Jakarta Sans" },
    { label: "Inter",          value: "Inter" },
    { label: "Roboto",         value: "Roboto" },
    { label: "Open Sans",      value: "Open Sans" },
    { label: "Lato",           value: "Lato" },
    { label: "Montserrat",     value: "Montserrat" },
    { label: "Poppins",        value: "Poppins" },
    { label: "Raleway",        value: "Raleway" },
    { label: "Nunito",         value: "Nunito" },
    { label: "Playfair Display", value: "Playfair Display" },
    { label: "Space Grotesk",  value: "Space Grotesk" },
  ];
  const [floorPlanFont, setFloorPlanFont] = useState(fontFamily || "Inter");

  useEffect(() => {
    if (fontFamily) {
      setFloorPlanFont(fontFamily);
    }
  }, [fontFamily]);

  // Inject Google Fonts link tag whenever font changes
  useEffect(() => {
    const id = "gf-floor-plan";
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    const encoded = encodeURIComponent(floorPlanFont + ":wght@400;600;700");
    link.href = `https://fonts.googleapis.com/css2?family=${encoded}&display=swap`;
  }, [floorPlanFont]);

  // Toolbar dropdown open states
  const [fontDropOpen, setFontDropOpen] = useState(false);
  const [gridDropOpen, setGridDropOpen] = useState(false);
  const [jsonDropOpen, setJsonDropOpen] = useState(false);
  const [exportDropOpen, setExportDropOpen] = useState(false);

  // Close all dropdowns when clicking outside the toolbar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setGridDropOpen(false);
        setJsonDropOpen(false);
        setExportDropOpen(false);
        setFontDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // History Undo/Redo tracking state structure containing BOTH elements and background blueprint parameters!
  const getLayoutState = () => ({
    elements: JSON.parse(JSON.stringify(elements)),
    blueprint: {
      url: blueprintUrl,
      name: blueprintName,
      opacity: blueprintOpacity,
      x: blueprintX,
      y: blueprintY,
      width: blueprintWidth,
      height: blueprintHeight,
      rotation: blueprintRotation,
      isLocked: blueprintIsLocked,
      canvasWidth,
      canvasHeight
    }
  });

  const [history, setHistory] = useState([getLayoutState()]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Helper to sync local editor states into the floors array and save
  const syncAndSaveFloors = (currentElements = elements, currentBlueprintOverride = null, targetFloors = floors) => {
    const nextBlueprint = currentBlueprintOverride ? {
      url: currentBlueprintOverride.url !== undefined ? currentBlueprintOverride.url : blueprintUrl,
      name: currentBlueprintOverride.name !== undefined ? currentBlueprintOverride.name : blueprintName,
      opacity: currentBlueprintOverride.opacity !== undefined ? currentBlueprintOverride.opacity : blueprintOpacity,
      x: currentBlueprintOverride.x !== undefined ? currentBlueprintOverride.x : blueprintX,
      y: currentBlueprintOverride.y !== undefined ? currentBlueprintOverride.y : blueprintY,
      width: currentBlueprintOverride.width !== undefined ? currentBlueprintOverride.width : blueprintWidth,
      height: currentBlueprintOverride.height !== undefined ? currentBlueprintOverride.height : blueprintHeight,
      rotation: currentBlueprintOverride.rotation !== undefined ? currentBlueprintOverride.rotation : blueprintRotation,
      isLocked: currentBlueprintOverride.isLocked !== undefined ? currentBlueprintOverride.isLocked : blueprintIsLocked,
      canvasWidth: currentBlueprintOverride.canvasWidth !== undefined ? currentBlueprintOverride.canvasWidth : canvasWidth,
      canvasHeight: currentBlueprintOverride.canvasHeight !== undefined ? currentBlueprintOverride.canvasHeight : canvasHeight
    } : {
      url: blueprintUrl,
      name: blueprintName,
      opacity: blueprintOpacity,
      x: blueprintX,
      y: blueprintY,
      width: blueprintWidth,
      height: blueprintHeight,
      rotation: blueprintRotation,
      isLocked: blueprintIsLocked,
      canvasWidth,
      canvasHeight
    };

    const updatedFloors = targetFloors.map(f => {
      if (f.id === activeFloorId) {
        return {
          ...f,
          elements: currentElements,
          blueprint: nextBlueprint
        };
      }
      return f;
    });

    setFloors(updatedFloors);
    if (onSaveFloors) {
      onSaveFloors(updatedFloors);
    } else {
      onSaveLayout(currentElements);
      if (onSaveBlueprintState) {
        onSaveBlueprintState(nextBlueprint);
      }
    }
  };

  // Apply history state to local fields on undo/redo index updates
  const applyHistoryState = (state) => {
    if (!state) return;
    setElements(state.elements);
    setBlueprintUrl(state.blueprint.url);
    setBlueprintName(state.blueprint.name);
    setBlueprintOpacity(state.blueprint.opacity);
    setBlueprintX(state.blueprint.x);
    setBlueprintY(state.blueprint.y);
    setBlueprintWidth(state.blueprint.width);
    setBlueprintHeight(state.blueprint.height);
    setBlueprintRotation(state.blueprint.rotation);
    setBlueprintIsLocked(state.blueprint.isLocked);
    if (state.blueprint.canvasWidth) setCanvasWidth(state.blueprint.canvasWidth);
    if (state.blueprint.canvasHeight) setCanvasHeight(state.blueprint.canvasHeight);

    // Save in real time on undo/redo actions
    syncAndSaveFloors(state.elements, state.blueprint);
  };

  // Push new layout/blueprint modification state to history stack
  const commitHistoryState = (newElements, newBlueprintOverride = null) => {
    const nextBlueprint = newBlueprintOverride ? {
      url: newBlueprintOverride.url !== undefined ? newBlueprintOverride.url : blueprintUrl,
      name: newBlueprintOverride.name !== undefined ? newBlueprintOverride.name : blueprintName,
      opacity: newBlueprintOverride.opacity !== undefined ? newBlueprintOverride.opacity : blueprintOpacity,
      x: newBlueprintOverride.x !== undefined ? newBlueprintOverride.x : blueprintX,
      y: newBlueprintOverride.y !== undefined ? newBlueprintOverride.y : blueprintY,
      width: newBlueprintOverride.width !== undefined ? newBlueprintOverride.width : blueprintWidth,
      height: newBlueprintOverride.height !== undefined ? newBlueprintOverride.height : blueprintHeight,
      rotation: newBlueprintOverride.rotation !== undefined ? newBlueprintOverride.rotation : blueprintRotation,
      isLocked: newBlueprintOverride.isLocked !== undefined ? newBlueprintOverride.isLocked : blueprintIsLocked,
      canvasWidth: newBlueprintOverride.canvasWidth !== undefined ? newBlueprintOverride.canvasWidth : canvasWidth,
      canvasHeight: newBlueprintOverride.canvasHeight !== undefined ? newBlueprintOverride.canvasHeight : canvasHeight
    } : {
      url: blueprintUrl,
      name: blueprintName,
      opacity: blueprintOpacity,
      x: blueprintX,
      y: blueprintY,
      width: blueprintWidth,
      height: blueprintHeight,
      rotation: blueprintRotation,
      isLocked: blueprintIsLocked,
      canvasWidth,
      canvasHeight
    };

    const nextState = {
      elements: JSON.parse(JSON.stringify(newElements)),
      blueprint: { ...nextBlueprint }
    };

    const updatedHistory = history.slice(0, historyIndex + 1);
    setHistory([...updatedHistory, nextState]);
    setHistoryIndex(updatedHistory.length);
    setElements(newElements);
    
    // Also sync the local state values if we received an override
    if (newBlueprintOverride) {
      if (newBlueprintOverride.url !== undefined) setBlueprintUrl(newBlueprintOverride.url);
      if (newBlueprintOverride.name !== undefined) setBlueprintName(newBlueprintOverride.name);
      if (newBlueprintOverride.opacity !== undefined) setBlueprintOpacity(newBlueprintOverride.opacity);
      if (newBlueprintOverride.x !== undefined) setBlueprintX(newBlueprintOverride.x);
      if (newBlueprintOverride.y !== undefined) setBlueprintY(newBlueprintOverride.y);
      if (newBlueprintOverride.width !== undefined) setBlueprintWidth(newBlueprintOverride.width);
      if (newBlueprintOverride.height !== undefined) setBlueprintHeight(newBlueprintOverride.height);
      if (newBlueprintOverride.rotation !== undefined) setBlueprintRotation(newBlueprintOverride.rotation);
      if (newBlueprintOverride.isLocked !== undefined) setBlueprintIsLocked(newBlueprintOverride.isLocked);
      if (newBlueprintOverride.canvasWidth !== undefined) setCanvasWidth(newBlueprintOverride.canvasWidth);
      if (newBlueprintOverride.canvasHeight !== undefined) setCanvasHeight(newBlueprintOverride.canvasHeight);
    }

    // Save changes in real-time
    syncAndSaveFloors(newElements, nextBlueprint);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      applyHistoryState(history[prevIndex]);
      setSelectedIds([]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      applyHistoryState(history[nextIndex]);
      setSelectedIds([]);
    }
  };

  const copySelectedElements = () => {
    const copied = elements.filter(el => selectedIds.includes(el.id) && el.id !== "blueprint");
    if (copied.length > 0) {
      clipboardRef.current = copied.map(el => ({ ...el }));
      setToastMessage(`Copied ${copied.length} element(s)`);
    }
  };

  const pasteElements = () => {
    if (!clipboardRef.current || clipboardRef.current.length === 0) return;
    const OFFSET = 20;
    const incrementLabel = (lbl) => {
      if (!lbl) return "";
      const hasNumberAtEnd = /\d+$/.test(lbl);
      if (hasNumberAtEnd) {
        return lbl.replace(/(\d+)$/, (match) => {
          const num = parseInt(match, 10) + 1;
          return num.toString().padStart(match.length, '0');
        });
      }
      return lbl;
    };
    const pasted = clipboardRef.current.map(el => ({
      ...el,
      id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      x: el.x + OFFSET,
      y: el.y + OFFSET,
      isLocked: false,
      label: incrementLabel(el.label)
    }));
    clipboardRef.current = clipboardRef.current.map(el => ({ 
      ...el, 
      x: el.x + OFFSET, 
      y: el.y + OFFSET,
      label: incrementLabel(el.label)
    }));
    const updated = [...elements, ...pasted];
    commitHistoryState(updated);
    setSelectedIds(pasted.map(p => p.id));
    setToastMessage(`Pasted ${pasted.length} element(s)`);
  };

  const switchFloor = (targetFloorId) => {
    if (targetFloorId === activeFloorId) return;

    // 1. Gather current active floor state
    const currentActiveFloorState = {
      id: activeFloorId,
      name: floors.find(f => f.id === activeFloorId)?.name || "Unnamed Floor",
      elements: elements,
      blueprint: {
        url: blueprintUrl,
        name: blueprintName,
        opacity: blueprintOpacity,
        x: blueprintX,
        y: blueprintY,
        width: blueprintWidth,
        height: blueprintHeight,
        rotation: blueprintRotation,
        isLocked: blueprintIsLocked,
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight
      }
    };

    // 2. Update floors array with current state of active floor
    const updatedFloors = floors.map(f => f.id === activeFloorId ? currentActiveFloorState : f);
    setFloors(updatedFloors);

    // 3. Get target floor
    const targetFloor = updatedFloors.find(f => f.id === targetFloorId);
    if (!targetFloor) return;

    // 4. Update active floor ID
    setActiveFloorId(targetFloorId);

    // 5. Load target floor states into editor states
    setElements(targetFloor.elements || []);
    const bp = targetFloor.blueprint || {};
    setBlueprintUrl(bp.url || "");
    setBlueprintName(bp.name || "Venue Blueprint");
    setBlueprintOpacity(bp.opacity ?? 0.8);
    setBlueprintX(bp.x ?? 0);
    setBlueprintY(bp.y ?? 0);
    setBlueprintWidth(bp.width ?? 800);
    setBlueprintHeight(bp.height ?? 600);
    setBlueprintRotation(bp.rotation ?? 0);
    setBlueprintIsLocked(bp.isLocked ?? false);
    setCanvasWidth(bp.canvasWidth ?? 2400);
    setCanvasHeight(bp.canvasHeight ?? 1500);

    // 6. Reset history stack for the new floor
    const newFloorState = {
      elements: targetFloor.elements || [],
      blueprint: { ...bp }
    };
    setHistory([newFloorState]);
    setHistoryIndex(0);

    // 7. Clear selection
    setSelectedIds([]);
  };

  const handleAddFloor = () => {
    // Save current floor first to make sure we don't lose changes
    const currentActiveFloorState = {
      id: activeFloorId,
      name: floors.find(f => f.id === activeFloorId)?.name || "Unnamed Floor",
      elements: elements,
      blueprint: {
        url: blueprintUrl,
        name: blueprintName,
        opacity: blueprintOpacity,
        x: blueprintX,
        y: blueprintY,
        width: blueprintWidth,
        height: blueprintHeight,
        rotation: blueprintRotation,
        isLocked: blueprintIsLocked,
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight
      }
    };

    const newFloorId = "floor-" + Date.now();
    const newFloorName = `Floor ${floors.length + 1}`;
    const newFloor = {
      id: newFloorId,
      name: newFloorName,
      elements: [],
      blueprint: {
        url: "",
        name: "Venue Blueprint",
        opacity: 0.8,
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        rotation: 0,
        isLocked: false,
        canvasWidth: 2400,
        canvasHeight: 1500
      }
    };

    const updatedFloors = floors.map(f => f.id === activeFloorId ? currentActiveFloorState : f);
    const newFloorsList = [...updatedFloors, newFloor];

    setFloors(newFloorsList);
    setActiveFloorId(newFloorId);

    // Clear/reset state for the new floor
    setElements([]);
    setBlueprintUrl("");
    setBlueprintName("Venue Blueprint");
    setBlueprintOpacity(0.8);
    setBlueprintX(0);
    setBlueprintY(0);
    setBlueprintWidth(800);
    setBlueprintHeight(600);
    setBlueprintRotation(0);
    setBlueprintIsLocked(false);
    setCanvasWidth(2400);
    setCanvasHeight(1500);

    setHistory([{
      elements: [],
      blueprint: {
        url: "", name: "Venue Blueprint", opacity: 0.8,
        x: 0, y: 0, width: 800, height: 600, rotation: 0, isLocked: false,
        canvasWidth: 2400, canvasHeight: 1500
      }
    }]);
    setHistoryIndex(0);
    setSelectedIds([]);

    // Save back to DB
    if (onSaveFloors) {
      onSaveFloors(newFloorsList);
    }
  };

  const handleDeleteFloor = (floorId, e) => {
    if (e) e.stopPropagation();
    if (floors.length <= 1) {
      alert("Cannot delete the only floor.");
      return;
    }

    const floorToDeleteIndex = floors.findIndex(f => f.id === floorId);
    const newFloorsList = floors.filter(f => f.id !== floorId);

    // If the deleted floor was active, we must switch to another floor
    if (activeFloorId === floorId) {
      const newActiveIndex = floorToDeleteIndex === 0 ? 0 : floorToDeleteIndex - 1;
      const targetFloor = newFloorsList[newActiveIndex];

      setFloors(newFloorsList);
      setActiveFloorId(targetFloor.id);

      // Load target floor states
      setElements(targetFloor.elements || []);
      const bp = targetFloor.blueprint || {};
      setBlueprintUrl(bp.url || "");
      setBlueprintName(bp.name || "Venue Blueprint");
      setBlueprintOpacity(bp.opacity ?? 0.8);
      setBlueprintX(bp.x ?? 0);
      setBlueprintY(bp.y ?? 0);
      setBlueprintWidth(bp.width ?? 800);
      setBlueprintHeight(bp.height ?? 600);
      setBlueprintRotation(bp.rotation ?? 0);
      setBlueprintIsLocked(bp.isLocked ?? false);
      setCanvasWidth(bp.canvasWidth ?? 2400);
      setCanvasHeight(bp.canvasHeight ?? 1500);

      setHistory([{
        elements: targetFloor.elements || [],
        blueprint: { ...bp }
      }]);
      setHistoryIndex(0);
      setSelectedIds([]);
    } else {
      // Just update the floors list
      setFloors(newFloorsList);
    }

    // Save back to DB
    if (onSaveFloors) {
      onSaveFloors(newFloorsList);
    }
  };

  const handleRenameFloor = (floorId, newName) => {
    const updatedFloors = floors.map(f => {
      if (f.id === floorId) {
        return { ...f, name: newName };
      }
      return f;
    });
    setFloors(updatedFloors);

    // If the renamed floor is the active floor, we also want to update the DB
    if (onSaveFloors) {
      const currentActiveFloorState = {
        id: activeFloorId,
        name: activeFloorId === floorId ? newName : (floors.find(f => f.id === activeFloorId)?.name || "Unnamed Floor"),
        elements: elements,
        blueprint: {
          url: blueprintUrl,
          name: blueprintName,
          opacity: blueprintOpacity,
          x: blueprintX,
          y: blueprintY,
          width: blueprintWidth,
          height: blueprintHeight,
          rotation: blueprintRotation,
          isLocked: blueprintIsLocked,
          canvasWidth: canvasWidth,
          canvasHeight: canvasHeight
        }
      };
      const syncedFloors = updatedFloors.map(f => f.id === activeFloorId ? currentActiveFloorState : f);
      onSaveFloors(syncedFloors);
    }
  };

  const handleReorderFloors = (newFloorsList) => {
    const currentActiveFloorState = {
      id: activeFloorId,
      name: newFloorsList.find(f => f.id === activeFloorId)?.name || "Unnamed Floor",
      elements: elements,
      blueprint: {
        url: blueprintUrl,
        name: blueprintName,
        opacity: blueprintOpacity,
        x: blueprintX,
        y: blueprintY,
        width: blueprintWidth,
        height: blueprintHeight,
        rotation: blueprintRotation,
        isLocked: blueprintIsLocked,
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight
      }
    };
    const syncedFloors = newFloorsList.map(f => f.id === activeFloorId ? currentActiveFloorState : f);
    setFloors(syncedFloors);

    if (onSaveFloors) {
      onSaveFloors(syncedFloors);
    }
  };

  // Wrapper for updating elements list state
  const updateElementsAndHistory = (newElements) => {
    commitHistoryState(newElements);
  };

  // Handle direct manual blueprint updates from canvas actions
  const handleUpdateBlueprint = (props) => {
    if (blueprintIsLocked) return;
    const nextBlueprint = {
      url: blueprintUrl,
      name: blueprintName,
      opacity: blueprintOpacity,
      x: props.x !== undefined ? props.x : blueprintX,
      y: props.y !== undefined ? props.y : blueprintY,
      width: props.width !== undefined ? props.width : blueprintWidth,
      height: props.height !== undefined ? props.height : blueprintHeight,
      rotation: props.rotation !== undefined ? props.rotation : blueprintRotation,
      isLocked: blueprintIsLocked
    };
    commitHistoryState(elements, nextBlueprint);
  };

  // Background blueprint image uploader
  const handleBlueprintUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert(`Blueprint file is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
      return;
    }

    try {
      const publicUrl = onUploadFile 
        ? await onUploadFile(file, 'floor-plans')
        : await uploadMedia(file, 'floor-plans');

      if (!publicUrl) return;

      const img = new window.Image();
      img.src = publicUrl;
      img.onload = () => {
        const nextBlueprint = {
          url: publicUrl,
          name: file.name || "Venue Blueprint",
          width: img.width,
          height: img.height,
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 0.8,
          isLocked: false
        };
        commitHistoryState(elements, nextBlueprint);
      };
    } catch (err) {
      console.error("Failed to upload blueprint image:", err);
      alert("Failed to upload blueprint image to Supabase Storage");
    }
  };

  const handleBlueprintDelete = () => {
    if (confirm("Are you sure you want to remove the venue blueprint background?")) {
      const nextBlueprint = {
        url: "",
        name: "Venue Blueprint",
        opacity: 0.8,
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        rotation: 0,
        isLocked: false
      };
      commitHistoryState(elements, nextBlueprint);
      localStorage.removeItem("floorplan_blueprint_url");
    }
  };

  // Drag-and-drop Sidebar dragstart
  const handleDragStart = (e, itemType) => {
    e.dataTransfer.setData("text/plain", itemType);
    e.dataTransfer.setData("dragType", itemType);
  };

  // Selected element retrieval
  const isBlueprintSelected = selectedIds.includes("blueprint");
  const selectedElements = !isBlueprintSelected
    ? elements.filter(el => selectedIds.includes(el.id))
    : [];

  const selectedElement = selectedElements.length === 1
    ? selectedElements[0]
    : selectedElements.length > 1
      ? (() => {
          const first = selectedElements[0];
          const virtual = {
            id: "multi",
            type: selectedElements.every(el => el.type.startsWith("booth") && first.type.startsWith("booth")) 
              ? "booth-multiple"
              : selectedElements.every(el => el.type === first.type) ? first.type : "multiple",
            isLocked: selectedElements.every(el => el.isLocked === first.isLocked) ? first.isLocked : false,
            label: selectedElements.every(el => el.label === first.label) ? first.label : "",
            fontSize: selectedElements.every(el => el.fontSize === first.fontSize) ? first.fontSize : undefined,
            fontStyle: selectedElements.every(el => el.fontStyle === first.fontStyle) ? first.fontStyle : undefined,
            fontFamily: selectedElements.every(el => el.fontFamily === first.fontFamily) ? first.fontFamily : undefined,
            align: selectedElements.every(el => el.align === first.align) ? first.align : undefined,
            status: selectedElements.every(el => el.status === first.status) ? first.status : undefined,
            exhibitorId: selectedElements.every(el => el.exhibitorId === first.exhibitorId) ? first.exhibitorId : undefined,
            width: selectedElements.every(el => el.width === first.width) ? first.width : undefined,
            height: selectedElements.every(el => el.height === first.height) ? first.height : undefined,
            rotation: selectedElements.every(el => el.rotation === first.rotation) ? first.rotation : undefined,
            fillColor: selectedElements.every(el => el.fillColor === first.fillColor) ? first.fillColor : undefined,
            color: selectedElements.every(el => el.color === first.color) ? first.color : undefined,
            strokeColor: selectedElements.every(el => el.strokeColor === first.strokeColor) ? first.strokeColor : undefined,
            textColor: selectedElements.every(el => el.textColor === first.textColor) ? first.textColor : undefined,
            openSides: selectedElements.every(el => JSON.stringify(el.openSides) === JSON.stringify(first.openSides)) ? first.openSides : undefined,
            chairsCount: selectedElements.every(el => el.chairsCount === first.chairsCount) ? first.chairsCount : undefined,
          };
          return virtual;
        })()
      : null;

  const isLayoutElement = (el) => {
    if (!el || !el.type) return false;
    return (
      el.type === "zone-overlay" ||
      el.type === "corridor" ||
      el.type.endsWith("-zone") ||
      el.type === "scheduled-meeting-room" ||
      el.type === "broadcast-studio" ||
      el.type === "safety-exit-route" ||
      el.type === "safety-accessibility-path"
    );
  };

  // Get all elements overlapping with the selected one
  const getOverlappingElements = (target) => {
    if (!target) return [];
    if (isLayoutElement(target)) return [];
    return elements.filter(el => {
      if (el.id === target.id) return false;
      if (isLayoutElement(el)) return false;
      const targetMinX = target.x;
      const targetMaxX = target.x + target.width;
      const targetMinY = target.y;
      const targetMaxY = target.y + target.height;

      const elMinX = el.x;
      const elMaxX = el.x + el.width;
      const elMinY = el.y;
      const elMaxY = el.y + el.height;

      const overlapX = Math.max(0, Math.min(targetMaxX, elMaxX) - Math.max(targetMinX, elMinX));
      const overlapY = Math.max(0, Math.min(targetMaxY, elMaxY) - Math.max(targetMinY, elMinY));

      return (overlapX * overlapY) > 0;
    });
  };

  const overlappingElements = selectedElement ? getOverlappingElements(selectedElement) : [];

  const handleSelectId = (id, isShift = false) => {
    setSelectedSeatId(null);
    setSelectedParentId(null);
    setAssignSearchQuery("");
    setIsAssignDropdownOpen(false);
    if (!id) {
      setSelectedIds([]);
      return;
    }
    
    if (Array.isArray(id)) {
      setSelectedIds(prev => {
        if (isShift) {
          const next = [...prev];
          id.forEach(item => {
            if (!next.includes(item)) {
              next.push(item);
            }
          });
          return next;
        } else {
          return id;
        }
      });
      return;
    }

    setSelectedIds(prev => {
      if (isShift) {
        if (prev.includes(id)) {
          return prev.filter(item => item !== id);
        } else {
          return [...prev, id];
        }
      } else {
        return [id];
      }
    });
  };

  const handleSelectSeat = (parentId, seatId) => {
    setSelectedParentId(parentId);
    setSelectedSeatId(seatId);
    setSelectedIds([parentId]);
    setAssignSearchQuery("");
    setIsAssignDropdownOpen(false);
  };

  // Helper to regenerate child elements for layout/seating types when dimensions/properties change
  const regenerateSeatingChildren = (el, property, value) => {
    const nextEl = { ...el, [property]: value };
    const oldChildren = el.children || [];
    let newChildren = null;
    
    // 1. Auditorium Block
    if (el.type === "auditorium-block") {
      if (["rows", "seatsPerRow", "rowSpacing", "seatSpacing", "curved", "arcRadius", "seatWidth", "seatDepth"].includes(property)) {
        newChildren = localGenerateAuditoriumSeats(
          el.id,
          nextEl.rows ?? 10,
          nextEl.seatsPerRow ?? 15,
          nextEl.rowSpacing ?? 1.0,
          nextEl.seatSpacing ?? 0.6,
          !!nextEl.curved,
          nextEl.arcRadius ?? 20,
          nextEl.seatWidth ?? 0.5,
          nextEl.seatDepth ?? 0.5
        );
      }
    }
    
    // 2. Theater in the Round
    else if (el.type === "theater-in-the-round") {
      if (["rings", "stageRadius", "ringSpacing", "seatSpacing", "seatWidth", "seatDepth", "seatsPerRing"].includes(property)) {
        newChildren = localGenerateTheaterSeats(
          el.id,
          nextEl.rings ?? 3,
          nextEl.stageRadius ?? 5.0,
          nextEl.ringSpacing ?? 1.5,
          nextEl.seatSpacing ?? 0.8,
          nextEl.seatWidth ?? 0.5,
          nextEl.seatDepth ?? 0.5,
          nextEl.seatsPerRing
        );
      }
    }
    
    // 3. Classroom Rows
    else if (el.type === "classroom-rows") {
      if (["rows", "tablesPerRow", "tableWidth", "tableDepth", "chairsPerTable", "rowSpacing", "tableSpacing", "facingDirection"].includes(property)) {
        newChildren = localGenerateClassroomSeats(
          el.id,
          nextEl.rows ?? 3,
          nextEl.tablesPerRow ?? 4,
          nextEl.tableWidth ?? 1.8,
          nextEl.tableDepth ?? 0.6,
          nextEl.chairsPerTable ?? 2,
          nextEl.rowSpacing ?? 2.0,
          nextEl.tableSpacing ?? 1.0,
          nextEl.facingDirection ?? "north"
        );
      }
    }
    
    // 4. Reserved Seat Block
    else if (el.type === "reserved-seat-block") {
      if (["seatCount", "label", "seatSpacing", "seatWidth", "seatDepth", "rows", "rowSpacing"].includes(property)) {
        newChildren = localGenerateReservedSeats(
          el.id,
          nextEl.seatCount ?? 2,
          nextEl.label ?? "Seats",
          nextEl.seatSpacing ?? 0.8,
          nextEl.seatWidth ?? 0.5,
          nextEl.seatDepth ?? 0.5,
          nextEl.rows ?? 3,
          nextEl.rowSpacing ?? 1.5
        );
      }
    }

    if (newChildren) {
      const preservedChildren = newChildren.map(newSeat => {
        const matchingOldSeat = oldChildren.find(oldSeat => oldSeat.id === newSeat.id);
        if (matchingOldSeat) {
          return {
            ...newSeat,
            assigned_participant_id: matchingOldSeat.assigned_participant_id,
            attendeeId: matchingOldSeat.attendeeId,
            seat_status: matchingOldSeat.seat_status,
            qrDataUrl: matchingOldSeat.qrDataUrl
          };
        }
        return newSeat;
      });

      // Automatically adjust parent dimensions based on the new child seats layout
      if (el.type === "reserved-seat-block") {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        newChildren.forEach(c => {
          const hw = (c.width || 10) / 2;
          const hh = (c.height || 10) / 2;
          if (c.x - hw < minX) minX = c.x - hw;
          if (c.x + hw > maxX) maxX = c.x + hw;
          if (c.y - hh < minY) minY = c.y - hh;
          if (c.y + hh > maxY) maxY = c.y + hh;
        });
        const boundsWidth = maxX - minX;
        const boundsHeight = maxY - minY;
        if (boundsWidth > 0 && boundsHeight > 0) {
          nextEl.width = Math.round(boundsWidth);
          nextEl.height = Math.round(boundsHeight + 25);
        }
      } else if (el.type === "auditorium-block") {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        newChildren.forEach(c => {
          const hw = (c.width || 10) / 2;
          const hh = (c.height || 10) / 2;
          if (c.x - hw < minX) minX = c.x - hw;
          if (c.x + hw > maxX) maxX = c.x + hw;
          if (c.y - hh < minY) minY = c.y - hh;
          if (c.y + hh > maxY) maxY = c.y + hh;
        });
        const boundsWidth = maxX - minX;
        const boundsHeight = maxY - minY;
        if (boundsWidth > 0 && boundsHeight > 0) {
          nextEl.width = Math.round(boundsWidth);
          nextEl.height = Math.round(boundsHeight + 25);
        }
      } else if (el.type === "classroom-rows") {
        const tableWidth_px = (nextEl.tableWidth || 1.8) * 20;
        const tableDepth_px = (nextEl.tableDepth || 0.6) * 20;
        const rowSpacing_px = (nextEl.rowSpacing || 2.0) * 20;
        const tableSpacing_px = (nextEl.tableSpacing || 1.0) * 20;
        const facingDirection = nextEl.facingDirection || "north";
        
        let boundsW, boundsH;
        if (facingDirection === "north" || facingDirection === "south") {
          boundsW = (nextEl.tablesPerRow || 4) * tableWidth_px + ((nextEl.tablesPerRow || 4) - 1) * tableSpacing_px;
          boundsH = (nextEl.rows || 3) * tableDepth_px + ((nextEl.rows || 3) - 1) * rowSpacing_px + 20;
        } else {
          boundsW = (nextEl.rows || 3) * tableDepth_px + ((nextEl.rows || 3) - 1) * rowSpacing_px + 20;
          boundsH = (nextEl.tablesPerRow || 4) * tableWidth_px + ((nextEl.tablesPerRow || 4) - 1) * tableSpacing_px;
        }
        nextEl.width = Math.round(boundsW);
        nextEl.height = Math.round(boundsH);
      } else if (el.type === "theater-in-the-round") {
        let maxR = 0;
        newChildren.forEach(c => {
          const dist = Math.hypot(c.x, c.y);
          if (dist > maxR) maxR = dist;
        });
        const boundsSize = Math.round(maxR * 2 + 20);
        nextEl.width = boundsSize;
        nextEl.height = boundsSize;
      }

      return { ...nextEl, children: preservedChildren };
    }
    
    // 5. LED/AV Screen presets
    if (el.type === "screen" && property === "aspectRatio" && value !== "Custom") {
      let ratio = 16 / 9;
      if (value === "4:3") ratio = 4 / 3;
      else if (value === "21:9") ratio = 21 / 9;
      return { ...nextEl, height: Math.round(el.width / ratio) };
    }
    
    // 6. Image resize ratio lock
    if (el.type === "image" && (property === "width" || property === "height")) {
      const ratio = el.width / el.height;
      if (property === "width") {
        return { ...nextEl, height: Math.round(value / ratio) };
      } else {
        return { ...nextEl, width: Math.round(value * ratio) };
      }
    }
    
    // 7. Screen resize ratio lock
    if (el.type === "screen" && el.aspectRatio && el.aspectRatio !== "Custom" && (property === "width" || property === "height")) {
      let ratio = 16 / 9;
      if (el.aspectRatio === "4:3") ratio = 4 / 3;
      else if (el.aspectRatio === "21:9") ratio = 21 / 9;
      if (property === "width") {
        return { ...nextEl, height: Math.round(value / ratio) };
      } else {
        return { ...nextEl, width: Math.round(value * ratio) };
      }
    }
    
    if (property === "fillColor") {
      return { ...nextEl, fillColor: value, color: value };
    }
    
    return nextEl;
  };

  // Property edit handlers
  const handlePropertyChange = (property, value) => {
    if (selectedIds.length === 0) return;
    const updated = elements.map(el => {
      if (selectedIds.includes(el.id)) {
        if (el.isLocked && property !== "isLocked") return el;
        return regenerateSeatingChildren(el, property, value);
      }
      return el;
    });
    updateElementsAndHistory(updated);
  };
  
  const handlePropertyChangeActive = (property, value) => {
    if (selectedIds.length === 0) return;
    setElements(prev => prev.map(el => {
      if (selectedIds.includes(el.id)) {
        if (el.isLocked && property !== "isLocked") return el;
        return regenerateSeatingChildren(el, property, value);
      }
      return el;
    }));
  };

  // Duplicate selected element(s)
  const handleDuplicate = () => {
    if (selectedIds.length === 0) return;
    const duplicated = [];
    selectedIds.forEach(id => {
      const el = elements.find(item => item.id === id);
      if (el && !el.isLocked) {
        const hasNumberAtEnd = el.label && /\d+$/.test(el.label);
        let newLabel = "";
        if (el.label) {
          if (hasNumberAtEnd) {
            newLabel = el.label.replace(/(\d+)$/, (match) => {
              const num = parseInt(match, 10) + 1;
              return num.toString().padStart(match.length, '0');
            });
          } else {
            newLabel = `${el.label} (Copy)`;
          }
        }
        duplicated.push({
          ...el,
          id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          x: el.x + 20,
          y: el.y + 20,
          label: newLabel,
          assignments: el.assignments ? { ...el.assignments } : {}
        });
      }
    });
    if (duplicated.length > 0) {
      commitHistoryState([...elements, ...duplicated]);
      setSelectedIds(duplicated.map(d => d.id));
    }
  };

  // Delete selected element(s)
  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    const updated = elements.filter(el => !selectedIds.includes(el.id) || el.isLocked);
    commitHistoryState(updated);
    
    // Filter remaining selection to only locked elements that were not deleted
    const remainingSelected = selectedIds.filter(id => {
      const el = elements.find(item => item.id === id);
      return el && el.isLocked;
    });
    setSelectedIds(remainingSelected);
  };

  const handleAssignSeat = (participant) => {
    const isSingleChair = selectedElement?.type === "furniture-chair";
    const targetParentId = selectedParentId || (isSingleChair ? selectedElement?.id : null);
    if (!targetParentId) return;
    if (!selectedSeatId && !isSingleChair) return;
    
    const updated = elements.map(el => {
      if (el.id === targetParentId) {
        if (el.isLocked) return el;
        
        if (isSingleChair) {
          const assigned_participant_id = participant ? participant.id : null;
          let seat_status = "unassigned";
          if (participant) {
            const isCheckedIn = participant.status === "checked_in" || participant.status === "checked-in" || participant.status === "present";
            seat_status = isCheckedIn ? "checked_in" : "assigned";
          }
          return {
            ...el,
            assigned_participant_id,
            attendeeId: assigned_participant_id,
            seat_status
          };
        } else if (selectedSeatId.startsWith("chair_")) {
          // Legacy banquet table assignment
          const idx = parseInt(selectedSeatId.split("_")[1]);
          const newAssignments = { ...(el.assignments || {}) };
          if (participant) {
            newAssignments[idx] = participant.id;
          } else {
            delete newAssignments[idx];
          }
          return { ...el, assignments: newAssignments };
        } else {
          // Custom seats using children array
          const updatedChildren = (el.children || []).map(seat => {
            if (seat.id === selectedSeatId) {
              const assigned_participant_id = participant ? participant.id : null;
              let seat_status = "unassigned";
              if (participant) {
                const isCheckedIn = participant.status === "checked_in" || participant.status === "checked-in" || participant.status === "present";
                seat_status = isCheckedIn ? "checked_in" : "assigned";
              }
              return {
                ...seat,
                assigned_participant_id,
                attendeeId: assigned_participant_id,
                seat_status
              };
            }
            return seat;
          });
          return { ...el, children: updatedChildren };
        }
      }
      return el;
    });
    
    updateElementsAndHistory(updated);
  };

  const handleGenerateArray = () => {
    if (selectedIds.length === 0) return;
    const newCopies = [];
    const timestamp = Date.now();
    
    const colGapPx = arrayColumnGap * 20;
    const rowGapPx = arrayRowGap * 20;
    
    selectedIds.forEach((id) => {
      const el = elements.find(item => item.id === id);
      if (!el || el.isLocked) return;
      
      const colOffset = el.width + colGapPx;
      const rowOffset = el.height + rowGapPx;
      
      for (let r = 0; r < arrayRows; r++) {
        for (let c = 0; c < arrayColumns; c++) {
          if (r === 0 && c === 0) continue;
          
          const newX = el.x + c * colOffset;
          const newY = el.y + r * rowOffset;
          
          const hasNumberAtEnd = el.label && /\d+$/.test(el.label);
          let newLabel = el.label || "";
          if (el.label) {
            if (hasNumberAtEnd) {
              newLabel = el.label.replace(/(\d+)$/, (match) => {
                const num = parseInt(match, 10) + (r * arrayColumns + c);
                return num.toString().padStart(match.length, '0');
              });
            } else {
              newLabel = `${el.label} (R${r+1}C${c+1})`;
            }
          }
          
          let newChildren = null;
          const newId = `element-${timestamp}-${Math.random().toString(36).substr(2, 5)}`;
          let newWidth = el.width;
          let newHeight = el.height;
          
          if (el.children) {
            if (el.type === "auditorium-block") {
              newChildren = localGenerateAuditoriumSeats(newId, el.rows ?? 10, el.seatsPerRow ?? 15, el.rowSpacing ?? 1.0, el.seatSpacing ?? 0.6, !!el.curved, el.arcRadius ?? 20, el.seatWidth ?? 0.5, el.seatDepth ?? 0.5);
              let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
              newChildren.forEach(c => {
                const hw = (c.width || 10) / 2;
                const hh = (c.height || 10) / 2;
                if (c.x - hw < minX) minX = c.x - hw;
                if (c.x + hw > maxX) maxX = c.x + hw;
                if (c.y - hh < minY) minY = c.y - hh;
                if (c.y + hh > maxY) maxY = c.y + hh;
              });
              const boundsWidth = maxX - minX;
              const boundsHeight = maxY - minY;
              if (boundsWidth > 0 && boundsHeight > 0) {
                newWidth = Math.round(boundsWidth);
                newHeight = Math.round(boundsHeight + 25);
              }
            } else if (el.type === "theater-in-the-round") {
              newChildren = localGenerateTheaterSeats(newId, el.rings ?? 3, el.stageRadius ?? 5.0, el.ringSpacing ?? 1.5, el.seatSpacing ?? 0.8, el.seatWidth ?? 0.5, el.seatDepth ?? 0.5, el.seatsPerRing);
              let maxR = 0;
              newChildren.forEach(c => {
                const dist = Math.hypot(c.x, c.y);
                if (dist > maxR) maxR = dist;
              });
              const boundsSize = Math.round(maxR * 2 + 20);
              newWidth = boundsSize;
              newHeight = boundsSize;
            } else if (el.type === "classroom-rows") {
              newChildren = localGenerateClassroomSeats(newId, el.rows ?? 3, el.tablesPerRow ?? 4, el.tableWidth ?? 1.8, el.tableDepth ?? 0.6, el.chairsPerTable ?? 2, el.rowSpacing ?? 2.0, el.tableSpacing ?? 1.0, el.facingDirection ?? "north");
              const tableWidth_px = (el.tableWidth || 1.8) * 20;
              const tableDepth_px = (el.tableDepth || 0.6) * 20;
              const rowSpacing_px = (el.rowSpacing || 2.0) * 20;
              const tableSpacing_px = (el.tableSpacing || 1.0) * 20;
              const facingDirection = el.facingDirection || "north";
              let boundsW, boundsH;
              if (facingDirection === "north" || facingDirection === "south") {
                boundsW = (el.tablesPerRow || 4) * tableWidth_px + ((el.tablesPerRow || 4) - 1) * tableSpacing_px;
                boundsH = (el.rows || 3) * tableDepth_px + ((el.rows || 3) - 1) * rowSpacing_px + 20;
              } else {
                boundsW = (el.rows || 3) * tableDepth_px + ((el.rows || 3) - 1) * rowSpacing_px + 20;
                boundsH = (el.tablesPerRow || 4) * tableWidth_px + ((el.tablesPerRow || 4) - 1) * tableSpacing_px;
              }
              newWidth = Math.round(boundsW);
              newHeight = Math.round(boundsH);
            } else if (el.type === "reserved-seat-block") {
              newChildren = localGenerateReservedSeats(newId, el.seatCount ?? 2, el.label ?? "Seats", el.seatSpacing ?? 0.8, el.seatWidth ?? 0.5, el.seatDepth ?? 0.5, el.rows ?? 3, el.rowSpacing ?? 1.5);
              let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
              newChildren.forEach(c => {
                const hw = (c.width || 10) / 2;
                const hh = (c.height || 10) / 2;
                if (c.x - hw < minX) minX = c.x - hw;
                if (c.x + hw > maxX) maxX = c.x + hw;
                if (c.y - hh < minY) minY = c.y - hh;
                if (c.y + hh > maxY) maxY = c.y + hh;
              });
              const boundsWidth = maxX - minX;
              const boundsHeight = maxY - minY;
              if (boundsWidth > 0 && boundsHeight > 0) {
                newWidth = Math.round(boundsWidth);
                newHeight = Math.round(boundsHeight + 25);
              }
            }
          }

          newCopies.push({
            ...el,
            id: newId,
            x: snapToGrid ? Math.round(newX / gridSize) * gridSize : Math.round(newX),
            y: snapToGrid ? Math.round(newY / gridSize) * gridSize : Math.round(newY),
            width: newWidth,
            height: newHeight,
            label: newLabel,
            assignments: el.assignments ? { ...el.assignments } : {},
            children: newChildren
          });
        }
      }
    });
    
    if (newCopies.length > 0) {
      commitHistoryState([...elements, ...newCopies]);
      setSelectedIds(newCopies.map(item => item.id));
    }
    
    setShowArrayModal(false);
  };
  // Local Seating Generator helpers for Array duplication tool
  const localGenerateAuditoriumSeats = (auditoriumId, rows, seatsPerRow, rowSpacing, seatSpacing, curved, arcRadius, seatWidth, seatDepth) => {
    const seats = [];
    rows = isNaN(Number(rows)) ? 1 : Math.max(1, Number(rows));
    seatsPerRow = isNaN(Number(seatsPerRow)) ? 1 : Math.max(1, Number(seatsPerRow));
    rowSpacing = isNaN(Number(rowSpacing)) ? 1.0 : Number(rowSpacing);
    seatSpacing = isNaN(Number(seatSpacing)) ? 0.6 : Number(seatSpacing);
    arcRadius = isNaN(Number(arcRadius)) ? 20 : Number(arcRadius);
    seatWidth = isNaN(Number(seatWidth)) ? 0.5 : Number(seatWidth);
    seatDepth = isNaN(Number(seatDepth)) ? 0.5 : Number(seatDepth);

    const rowSpacing_px = rowSpacing * 20;
    const seatSpacing_px = seatSpacing * 20;
    const seatWidth_px = seatWidth * 20;
    const seatDepth_px = seatDepth * 20;
    const arcRadius_px = arcRadius * 20;

    const step_px = Math.max(2, seatWidth_px + seatSpacing_px);

    for (let r = 0; r < rows; r++) {
      if (curved) {
        const R_r = arcRadius_px + r * rowSpacing_px;
        const safe_R_r = Math.abs(R_r) < 1 ? (R_r >= 0 ? 1 : -1) : R_r;
        const span = safe_R_r > 0 ? (seatsPerRow - 1) * step_px / safe_R_r : 0;
        for (let c = 0; c < seatsPerRow; c++) {
          const theta = seatsPerRow > 1 ? -span / 2 + c * (step_px / safe_R_r) : 0;
          const x = R_r * Math.sin(theta);
          const y = -arcRadius_px + R_r * Math.cos(theta);
          const rot = -theta * 180 / Math.PI;
          seats.push({
            id: `${auditoriumId}_seat_${r+1}_${c+1}`,
            type: "seat",
            label: `Row ${r+1} Seat ${c+1}`,
            x: x,
            y: y,
            width: seatWidth_px,
            height: seatDepth_px,
            rotation: rot,
            assigned_participant_id: null,
            seat_status: "unassigned"
          });
        }
      } else {
        for (let c = 0; c < seatsPerRow; c++) {
          const x = c * step_px;
          const y = r * rowSpacing_px;
          seats.push({
            id: `${auditoriumId}_seat_${r+1}_${c+1}`,
            type: "seat",
            label: `Row ${r+1} Seat ${c+1}`,
            x: x,
            y: y,
            width: seatWidth_px,
            height: seatDepth_px,
            rotation: 0,
            assigned_participant_id: null,
            seat_status: "unassigned"
          });
        }
      }
    }
    return seats;
  };

  const localGenerateTheaterSeats = (theaterId, rings, stageRadius, ringSpacing = 1.5, seatSpacing = 0.8, seatWidth = 0.5, seatDepth = 0.5, seatsPerRing = 0) => {
    const seats = [];
    rings = isNaN(Number(rings)) ? 1 : Math.max(1, Number(rings));
    stageRadius = isNaN(Number(stageRadius)) ? 5.0 : Number(stageRadius);
    ringSpacing = isNaN(Number(ringSpacing)) ? 1.5 : Number(ringSpacing);
    seatSpacing = isNaN(Number(seatSpacing)) ? 0.8 : Number(seatSpacing);
    seatWidth = isNaN(Number(seatWidth)) ? 0.5 : Number(seatWidth);
    seatDepth = isNaN(Number(seatDepth)) ? 0.5 : Number(seatDepth);
    seatsPerRing = isNaN(Number(seatsPerRing)) ? 0 : Number(seatsPerRing);

    const stageRadius_px = stageRadius * 20;
    const ringSpacing_px = ringSpacing * 20;
    const seatSpacing_px = seatSpacing * 20;
    const seatWidth_px = seatWidth * 20;
    const seatDepth_px = seatDepth * 20;

    const step_px = Math.max(2, seatWidth_px + seatSpacing_px);

    for (let r = 1; r <= rings; r++) {
      const R_r = stageRadius_px + r * ringSpacing_px;
      const circumference = 2 * Math.PI * R_r;
      const sCount = (seatsPerRing !== undefined && seatsPerRing > 0)
        ? seatsPerRing
        : Math.max(4, Math.floor(circumference / step_px));
      for (let s = 0; s < sCount; s++) {
        const angle = (s * 2 * Math.PI) / sCount;
        const x = R_r * Math.cos(angle);
        const y = R_r * Math.sin(angle);
        const rot = (angle * 180 / Math.PI) + 90;
        seats.push({
          id: `${theaterId}_seat_${r}_${s+1}`,
          type: "seat",
          label: `Ring ${r} Seat ${s+1}`,
          x: x,
          y: y,
          width: seatWidth_px,
          height: seatDepth_px,
          rotation: rot,
          assigned_participant_id: null,
          seat_status: "unassigned"
        });
      }
    }
    return seats;
  };

  const localGenerateClassroomSeats = (classroomId, rows, tablesPerRow, tableWidth, tableDepth, chairsPerTable, rowSpacing = 2.0, tableSpacing = 1.0, facingDirection = "north") => {
    const seats = [];
    rows = isNaN(Number(rows)) ? 1 : Math.max(1, Number(rows));
    tablesPerRow = isNaN(Number(tablesPerRow)) ? 1 : Math.max(1, Number(tablesPerRow));
    tableWidth = isNaN(Number(tableWidth)) ? 1.8 : Number(tableWidth);
    tableDepth = isNaN(Number(tableDepth)) ? 0.6 : Number(tableDepth);
    chairsPerTable = isNaN(Number(chairsPerTable)) ? 2 : Number(chairsPerTable);
    rowSpacing = isNaN(Number(rowSpacing)) ? 2.0 : Number(rowSpacing);
    tableSpacing = isNaN(Number(tableSpacing)) ? 1.0 : Number(tableSpacing);

    const tableWidth_px = tableWidth * 20;
    const tableDepth_px = tableDepth * 20;
    const rowSpacing_px = rowSpacing * 20;
    const tableSpacing_px = tableSpacing * 20;
    
    const chairWidth_px = 10;
    const chairDepth_px = 10;

    for (let r = 0; r < rows; r++) {
      for (let t = 0; t < tablesPerRow; t++) {
        let tx, ty;
        let chairRot = 0;
        
        if (facingDirection === "north") {
          tx = t * (tableWidth_px + tableSpacing_px);
          ty = r * (tableDepth_px + rowSpacing_px);
          chairRot = 0;
        } else if (facingDirection === "south") {
          tx = t * (tableWidth_px + tableSpacing_px);
          ty = r * (tableDepth_px + rowSpacing_px);
          chairRot = 180;
        } else if (facingDirection === "east") {
          tx = r * (tableDepth_px + rowSpacing_px);
          ty = t * (tableWidth_px + tableSpacing_px);
          chairRot = 90;
        } else {
          tx = r * (tableDepth_px + rowSpacing_px);
          ty = t * (tableWidth_px + tableSpacing_px);
          chairRot = 270;
        }

        for (let c = 0; c < chairsPerTable; c++) {
          let chairX, chairY;
          if (facingDirection === "north") {
            chairX = tx + (tableWidth_px - chairsPerTable * 16) / 2 + c * 16 + 3;
            chairY = ty + tableDepth_px + 8;
          } else if (facingDirection === "south") {
            chairX = tx + (tableWidth_px - chairsPerTable * 16) / 2 + c * 16 + 3;
            chairY = ty - 8;
          } else if (facingDirection === "east") {
            chairX = tx - 8;
            chairY = ty + (tableWidth_px - chairsPerTable * 16) / 2 + c * 16 + 3;
          } else {
            chairX = tx + tableDepth_px + 8;
            chairY = ty + (tableWidth_px - chairsPerTable * 16) / 2 + c * 16 + 3;
          }

          seats.push({
            id: `${classroomId}_seat_${r+1}_${t+1}_${c+1}`,
            type: "seat",
            label: `Row ${r+1} Table ${t+1} Chair ${c+1}`,
            x: chairX,
            y: chairY,
            width: chairWidth_px,
            height: chairDepth_px,
            rotation: chairRot,
            assigned_participant_id: null,
            seat_status: "unassigned"
          });
        }
      }
    }
    return seats;
  };

  const localGenerateReservedSeats = (reservedId, seatCount, label, seatSpacing = 0.8, seatWidth = 0.5, seatDepth = 0.5, rows = 1, rowSpacing = 1.5) => {
    const seats = [];
    seatCount = isNaN(Number(seatCount)) ? 1 : Math.max(1, Number(seatCount));
    rows = isNaN(Number(rows)) ? 1 : Math.max(1, Number(rows));
    seatSpacing = isNaN(Number(seatSpacing)) ? 0.8 : Number(seatSpacing);
    seatWidth = isNaN(Number(seatWidth)) ? 0.5 : Number(seatWidth);
    seatDepth = isNaN(Number(seatDepth)) ? 0.5 : Number(seatDepth);
    rowSpacing = isNaN(Number(rowSpacing)) ? 1.5 : Number(rowSpacing);

    const seatSpacing_px = seatSpacing * 20;
    const seatWidth_px = seatWidth * 20;
    const seatDepth_px = seatDepth * 20;
    const rowSpacing_px = rowSpacing * 20;
    const rowSpacingStep_px = rowSpacing_px + seatDepth_px;

    const labelClean = String(label || "Seats");
    const seatLabelPrefix = (labelClean.toLowerCase() === "seats" || labelClean.toLowerCase() === "seat") ? "" : labelClean;

    for (let r = 0; r < rows; r++) {
      for (let s = 0; s < seatCount; s++) {
        const x = s * (seatWidth_px + seatSpacing_px);
        const y = 20 + r * rowSpacingStep_px;
        const seatLabel = rows > 1 
          ? (seatLabelPrefix ? `${seatLabelPrefix} Row ${r+1} Seat ${s+1}` : `Row ${r+1} Seat ${s+1}`) 
          : (seatLabelPrefix ? `${seatLabelPrefix} Seat ${s+1}` : `Seat ${s+1}`);
        seats.push({
          id: `${reservedId}_seat_${r+1}_${s+1}`,
          type: "seat",
          label: seatLabel,
          x: x,
          y: y,
          width: seatWidth_px,
          height: seatDepth_px,
          rotation: 0,
          assigned_participant_id: null,
          seat_status: "unassigned"
        });
      }
    }
    return seats;
  };

  // Align selected element(s) to canvas or to each other
  const handleAlign = (direction) => {
    if (selectedIds.length === 0) return;

    const targets = elements.filter(el => selectedIds.includes(el.id) && !el.isLocked);
    if (targets.length === 0) return;

    if (selectedIds.length === 1) {
      // Single element: align to the white canvas rectangle (0,0) → (CANVAS_W, CANVAS_H)
      const el = targets[0];
      let newX = el.x;
      let newY = el.y;
      if (direction === "left")     newX = 0;
      if (direction === "center-h") newX = (canvasWidth - el.width) / 2;
      if (direction === "right")    newX = canvasWidth - el.width;
      if (direction === "top")      newY = 0;
      if (direction === "center-v") newY = (canvasHeight - el.height) / 2;
      if (direction === "bottom")   newY = canvasHeight - el.height;
      commitHistoryState(elements.map(e => e.id === el.id ? { ...e, x: Math.round(newX), y: Math.round(newY) } : e));
    } else {
      // Multi-select: align relative to the bounding box of the selection
      const minX    = Math.min(...targets.map(e => e.x));
      const minY    = Math.min(...targets.map(e => e.y));
      const maxX    = Math.max(...targets.map(e => e.x + e.width));
      const maxY    = Math.max(...targets.map(e => e.y + e.height));
      const centerX = minX + (maxX - minX) / 2;
      const centerY = minY + (maxY - minY) / 2;

      const updated = elements.map(el => {
        if (!selectedIds.includes(el.id) || el.isLocked) return el;
        let newX = el.x;
        let newY = el.y;
        if (direction === "left")     newX = minX;
        if (direction === "center-h") newX = centerX - el.width / 2;
        if (direction === "right")    newX = maxX - el.width;
        if (direction === "top")      newY = minY;
        if (direction === "center-v") newY = centerY - el.height / 2;
        if (direction === "bottom")   newY = maxY - el.height;
        return { ...el, x: Math.round(newX), y: Math.round(newY) };
      });
      commitHistoryState(updated);
    }
  };

  // Change element layering order (z-index)
  const handleLayerOrder = (action) => {
    if (selectedIds.length !== 1) return;
    const activeId = selectedIds[0];
    const index = elements.findIndex(el => el.id === activeId);
    if (index === -1) return;

    let updated = [...elements];
    const item = updated.splice(index, 1)[0];

    if (action === "front") {
      updated.push(item);
    } else if (action === "back") {
      updated.unshift(item);
    } else if (action === "forward") {
      if (index < elements.length - 1) {
        updated.splice(index + 1, 0, item);
      } else {
        updated.push(item);
      }
    } else if (action === "backward") {
      if (index > 0) {
        updated.splice(index - 1, 0, item);
      } else {
        updated.unshift(item);
      }
    }
    commitHistoryState(updated);
  };

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isPreviewMode) return;
      // Ignore if typing in an input, textarea or contenteditable element
      const activeEl = document.activeElement;
      if (
        activeEl && 
        (activeEl.tagName === "INPUT" || 
         activeEl.tagName === "TEXTAREA" || 
         activeEl.isContentEditable)
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl + Z (Undo)
      if (isCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }

      // Ctrl + Y or Ctrl + Shift + Z (Redo)
      if (isCtrl && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        handleRedo();
      }

      // Delete or Backspace (Delete selected elements)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0 && !selectedIds.includes("blueprint")) {
          e.preventDefault();
          handleDelete();
        }
      }

      // Ctrl + C (Copy selected elements)
      if (isCtrl && e.key.toLowerCase() === 'c') {
        if (selectedIds.length > 0 && !selectedIds.includes("blueprint")) {
          e.preventDefault();
          const copied = elements.filter(el => selectedIds.includes(el.id));
          clipboardRef.current = copied.map(el => ({ ...el }));
        }
      }

      // Ctrl + V (Paste copied elements with offset)
      if (isCtrl && e.key.toLowerCase() === 'v') {
        if (clipboardRef.current.length > 0) {
          e.preventDefault();
          const OFFSET = 20;
          const incrementLabel = (lbl) => {
            if (!lbl) return "";
            const hasNumberAtEnd = /\d+$/.test(lbl);
            if (hasNumberAtEnd) {
              return lbl.replace(/(\d+)$/, (match) => {
                const num = parseInt(match, 10) + 1;
                return num.toString().padStart(match.length, '0');
              });
            }
            return lbl;
          };
          const pasted = clipboardRef.current.map(el => ({
            ...el,
            id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            x: el.x + OFFSET,
            y: el.y + OFFSET,
            isLocked: false,
            label: incrementLabel(el.label)
          }));
          clipboardRef.current = clipboardRef.current.map(el => ({ 
            ...el, 
            x: el.x + OFFSET, 
            y: el.y + OFFSET,
            label: incrementLabel(el.label)
          }));
          const updated = [...elements, ...pasted];
          commitHistoryState(updated);
          setSelectedIds(pasted.map(p => p.id));
        }
      }

      // Arrow keys (Move selected elements / blueprint)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedIds.length > 0) {
          e.preventDefault();
          const baseStep = snapToGrid ? gridSize : 1;
          const step = e.shiftKey ? baseStep * 5 : baseStep;
          let dx = 0;
          let dy = 0;

          if (e.key === 'ArrowUp') dy = -step;
          if (e.key === 'ArrowDown') dy = step;
          if (e.key === 'ArrowLeft') dx = -step;
          if (e.key === 'ArrowRight') dx = step;

          if (selectedIds.includes("blueprint")) {
            if (!blueprintIsLocked) {
              const newX = blueprintX + dx;
              const newY = blueprintY + dy;
              commitHistoryState(elements, { x: newX, y: newY });
            }
          } else {
            const updated = elements.map(el => {
              if (selectedIds.includes(el.id) && !el.isLocked) {
                return {
                  ...el,
                  x: el.x + dx,
                  y: el.y + dy
                };
              }
              return el;
            });
            commitHistoryState(updated);
          }
        }
      }

      // V (Selection Tool)
      if (!isCtrl && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setToolMode("select");
      }

      // M (Move/Pan Tool)
      if (!isCtrl && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setToolMode("pan");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyIndex, history, selectedIds, elements, toolMode, blueprintUrl, blueprintName, blueprintOpacity, blueprintX, blueprintY, blueprintWidth, blueprintHeight, blueprintRotation, blueprintIsLocked]);

  // Upload picture handler
  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert(`Picture file is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
      return;
    }

    try {
      const publicUrl = onUploadFile 
        ? await onUploadFile(file, 'floor-plans')
        : await uploadMedia(file, 'floor-plans');

      if (!publicUrl) return;

      const img = new window.Image();
      img.src = publicUrl;
      img.onload = () => {
        let w = img.width || 150;
        let h = img.height || 150;
        const maxDim = 150;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        let targetX = 100;
        let targetY = 100;

        try {
          if (canvasRef.current) {
            const stage = canvasRef.current.getStage();
            if (stage) {
              const stageW = stage.width() || window.innerWidth;
              const stageH = stage.height() || window.innerHeight;
              const stageX = stage.x() || 0;
              const stageY = stage.y() || 0;
              const scale = stage.scaleX() || 1;

              const centerX = (stageW / 2 - stageX) / scale;
              const centerY = (stageH / 2 - stageY) / scale;

              targetX = Math.round(centerX - w / 2);
              targetY = Math.round(centerY - h / 2);
            }
          }
        } catch (e) {
          console.error("Failed to calculate stage center viewport for picture:", e);
        }

        const newElement = {
          id: `element-${Date.now()}`,
          type: "image",
          x: targetX,
          y: targetY,
          width: w,
          height: h,
          rotation: 0,
          label: file.name.split(".")[0] || "Picture",
          src: publicUrl,
          isLocked: false
        };

        const updated = [...elements, newElement];
        commitHistoryState(updated);
        setSelectedIds([newElement.id]);
      };
    } catch (err) {
      console.error("Failed to upload custom picture:", err);
      alert("Failed to upload custom picture to Supabase Storage");
    }
  };

  // Clear Canvas
  const handleResetLayout = () => {
    if (confirm("Reset the entire floor plan? This will clear all placed assets and blueprint.")) {
      const nextBlueprint = {
        url: "",
        name: "Venue Blueprint",
        opacity: 0.8,
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        rotation: 0,
        isLocked: false
      };
      commitHistoryState([], nextBlueprint);
      setSelectedIds([]);
    }
  };

  // Export Layout state as JSON File
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(elements));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "floorplan-layout.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          commitHistoryState(imported);
          setSelectedIds([]);
        } else {
          alert("Invalid file format. Make sure it is a valid floor plan JSON array export.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleExportPNG = (filters = {}, settings = {}) => {
    // Set export filters to trigger re-render
    setExportFilters(filters);

    setTimeout(() => {
      const stage = canvasRef.current?.getStage();
      if (stage) {
        // Temporarily hide transformer UI outlines
        const transformer = stage.findOne("Transformer");
        const transformerVisible = transformer ? transformer.visible() : false;
        if (transformer) transformer.visible(false);

        const outlines = stage.find(".selection-outline");
        outlines.forEach(o => o.visible(false));

        const viewOnly = !!settings.exportCurrentViewOnly;
        const oldScale = stage.scale();
        const oldPos = stage.position();

        if (!viewOnly) {
          // Reset transforms to export logical size at 1:1 scale
          stage.scale({ x: 1, y: 1 });
          stage.position({ x: 0, y: 0 });
          stage.draw();
        }

        // Optimize export size dynamically to balance quality and speed
        const widthToExport = viewOnly ? stage.width() : canvasWidth;
        const heightToExport = viewOnly ? stage.height() : canvasHeight;
        const maxDimension = Math.max(widthToExport, heightToExport);
        let calculatedPixelRatio = viewOnly ? 2.5 : 1.5;
        const scaleFactorLimit = viewOnly ? 2.5 : 1.5;
        const pxLimit = viewOnly ? 6000 : 3500;
        if (maxDimension * scaleFactorLimit > pxLimit) {
          calculatedPixelRatio = pxLimit / maxDimension;
        }
        calculatedPixelRatio = Math.max(0.05, Math.min(scaleFactorLimit, calculatedPixelRatio));

        const dataUrl = stage.toDataURL({
          x: 0,
          y: 0,
          width: widthToExport,
          height: heightToExport,
          mimeType: "image/jpeg",
          quality: 0.85,
          pixelRatio: calculatedPixelRatio
        });

        if (!viewOnly) {
          // Restore stage transforms
          stage.scale(oldScale);
          stage.position(oldPos);
          if (transformer) transformer.visible(transformerVisible);
          outlines.forEach(o => o.visible(true));
          stage.draw();
        } else {
          if (transformer) transformer.visible(transformerVisible);
          outlines.forEach(o => o.visible(true));
          stage.draw();
        }

        // Reset export filters state
        setExportFilters(null);

        // Fit layout image centered inside an A4 canvas
        const img = new window.Image();
        img.src = dataUrl;
        img.onload = () => {
          const isPortrait = settings.orientation === "portrait";
          const width = isPortrait ? 2480 : 3508;
          const height = isPortrait ? 3508 : 2480;

          const a4Canvas = document.createElement("canvas");
          a4Canvas.width = width;
          a4Canvas.height = height;
          const ctx = a4Canvas.getContext("2d");

          // White background page
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, a4Canvas.width, a4Canvas.height);

          // Calculate aspect ratios for drawing centering
          const ratio = Math.min(a4Canvas.width / img.width, a4Canvas.height / img.height) * 0.94; // 6% page margins
          const newW = img.width * ratio;
          const newH = img.height * ratio;
          const targetX = (a4Canvas.width - newW) / 2;
          const targetY = (a4Canvas.height - newH) / 2;

          ctx.drawImage(img, targetX, targetY, newW, newH);

          const downloadAnchor = document.createElement("a");
          downloadAnchor.setAttribute("href", a4Canvas.toDataURL("image/png"));
          downloadAnchor.setAttribute("download", `${planName.replace(/\s+/g, "_")}_A4_${isPortrait ? "Portrait" : "Landscape"}.png`);
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();
        };
      } else {
        setExportFilters(null);
      }
    }, 150);
  };

  const handleExportPDF = (filters = {}, settings = {}) => {
    // Set export filters to trigger re-render
    setExportFilters(filters);

    setTimeout(() => {
      const stage = canvasRef.current?.getStage();
      if (stage) {
        // Temporarily hide transformer UI outlines
        const transformer = stage.findOne("Transformer");
        const transformerVisible = transformer ? transformer.visible() : false;
        if (transformer) transformer.visible(false);

        const outlines = stage.find(".selection-outline");
        outlines.forEach(o => o.visible(false));

        const viewOnly = !!settings.exportCurrentViewOnly;
        const oldScale = stage.scale();
        const oldPos = stage.position();

        if (!viewOnly) {
          // Reset transforms to export logical size at 1:1 scale
          stage.scale({ x: 1, y: 1 });
          stage.position({ x: 0, y: 0 });
          stage.draw();
        }

        // Optimize export size dynamically to balance quality and speed and prevent crash on large sizes
        const widthToExport = viewOnly ? stage.width() : canvasWidth;
        const heightToExport = viewOnly ? stage.height() : canvasHeight;
        const maxDimension = Math.max(widthToExport, heightToExport);
        let calculatedPixelRatio = 2.5;
        if (maxDimension * 2.5 > 6000) {
          calculatedPixelRatio = 6000 / maxDimension;
        }
        calculatedPixelRatio = Math.max(0.05, Math.min(2.5, calculatedPixelRatio));

        const dataUrl = stage.toDataURL({
          x: 0,
          y: 0,
          width: widthToExport,
          height: heightToExport,
          mimeType: "image/jpeg",
          quality: 0.95,
          pixelRatio: calculatedPixelRatio
        });

        if (!viewOnly) {
          // Restore stage transforms
          stage.scale(oldScale);
          stage.position(oldPos);
          if (transformer) transformer.visible(transformerVisible);
          outlines.forEach(o => o.visible(true));
          stage.draw();
        } else {
          if (transformer) transformer.visible(transformerVisible);
          outlines.forEach(o => o.visible(true));
          stage.draw();
        }

        // Reset export filters state
        setExportFilters(null);

        // Prepare searchable text overlay HTML
        const scaleVal = viewOnly ? oldScale.x : 1;
        const posXVal = viewOnly ? oldPos.x : 0;
        const posYVal = viewOnly ? oldPos.y : 0;

        const escapeHtml = (str) => {
          if (!str) return "";
          return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        };

        const filteredElements = elements.filter(el => {
          if (!filters) return true;
          if (filters.availableOnly && el.type.startsWith("booth") && el.status !== "available") return false;
          if (filters.hideFurniture && (el.type.startsWith("furniture") || el.type === "table" || el.type === "table-chairs" || el.type.startsWith("furniture-") || el.type === "auditorium-block" || el.type === "theater-in-the-round" || el.type === "classroom-rows" || el.type === "reserved-seat-block")) return false;
          if (filters.safetyLayerOnly) {
            const isStructuralOrSafety = el.type.startsWith("structural-") || 
                                         ["entrance", "exit", "access-assembly", "safety-extinguisher", "safety-exit-route", "safety-accessibility-path", "safety-cctv"].includes(el.type);
            if (!isStructuralOrSafety) return false;
          }
          return true;
        });

        const showLabels = filters ? filters.showLabels !== false : true;

        const textOverlayHtml = showLabels ? filteredElements.map(el => {
          let labelText = el.label || "";
          if (el.type === "theater-in-the-round") labelText = "STAGE";
          if (!labelText && !el.type.startsWith("booth")) return "";

          const viewportX = el.x * scaleVal + posXVal;
          const viewportY = el.y * scaleVal + posYVal;
          const viewportW = el.width * scaleVal;
          const viewportH = el.height * scaleVal;

          const pctX = (viewportX / widthToExport) * 100;
          const pctY = (viewportY / heightToExport) * 100;
          const pctW = (viewportW / widthToExport) * 100;
          const pctH = (viewportH / heightToExport) * 100;
          const rotation = el.rotation || 0;

          if (el.type.startsWith("booth")) {
            const surfaceMeters = (el.width / 20) * (el.height / 20);
            let companyText = "";
            if (el.exhibitorId && exhibitors) {
              const matchedExhibitor = exhibitors.find(ex => ex.id === el.exhibitorId || String(ex.id) === String(el.exhibitorId));
              if (matchedExhibitor) {
                companyText = matchedExhibitor.name;
              }
            }

            const labelFontSize = (el.fontSize || 16) * scaleVal;
            const subFontSize = (surfaceMeters <= 9 ? 10 : 12) * scaleVal;
            const statusFontSize = (surfaceMeters <= 9 ? 8 : Math.max(7.5, Math.min(16, Math.round(Math.min(el.width, el.height) * 0.09)))) * scaleVal;

            return `
              <div style="
                position: absolute;
                left: ${pctX}%;
                top: ${pctY}%;
                width: ${pctW}%;
                height: ${pctH}%;
                transform: rotate(${rotation}deg);
                transform-origin: 0 0;
                pointer-events: none;
                box-sizing: border-box;
              ">
                <div style="
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  height: 100%;
                  width: 100%;
                  text-align: center;
                  box-sizing: border-box;
                  padding: calc(4px * var(--font-scale, 1));
                ">
                  <div class="searchable-text" style="font-size: calc(${labelFontSize}px * var(--font-scale, 1)); font-weight: bold; position: relative; white-space: pre-wrap; overflow: hidden; text-overflow: ellipsis;">
                    ${escapeHtml(labelText)}
                  </div>
                  ${companyText ? `
                    <div class="searchable-text" style="font-size: calc(${subFontSize}px * var(--font-scale, 1)); position: relative; white-space: pre-wrap; overflow: hidden; text-overflow: ellipsis;">
                      ${escapeHtml(companyText)}
                    </div>
                  ` : ""}
                  <div class="searchable-text" style="font-size: calc(${subFontSize}px * var(--font-scale, 1)); position: relative; white-space: pre-wrap; overflow: hidden; text-overflow: ellipsis;">
                    ${surfaceMeters.toFixed(2)} m²
                  </div>
                  <div class="searchable-text" style="font-size: calc(${statusFontSize}px * var(--font-scale, 1)); font-weight: bold; position: relative; white-space: pre-wrap; overflow: hidden; text-overflow: ellipsis;">
                    ${el.status ? el.status.toUpperCase() : ""}
                  </div>
                </div>
              </div>
            `;
          }

          const fontSize = (el.fontSize || (el.type === "text" ? 16 : 12)) * scaleVal;
          const fontWeight = (el.type === "text" ? (el.fontStyle?.includes("bold") ? "bold" : "normal") : "bold");
          const fontStyle = (el.type === "text" && el.fontStyle?.includes("italic")) ? "italic" : "normal";
          const align = el.align || "center";
          const justify = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";

          return `
            <div style="
              position: absolute;
              left: ${pctX}%;
              top: ${pctY}%;
              width: ${pctW}%;
              height: ${pctH}%;
              transform: rotate(${rotation}deg);
              transform-origin: 0 0;
              pointer-events: none;
              box-sizing: border-box;
            ">
              <div class="searchable-text" style="
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                font-size: calc(${fontSize}px * var(--font-scale, 1));
                font-family: ${el.fontFamily || "Inter, sans-serif"};
                font-weight: ${fontWeight};
                font-style: ${fontStyle};
                text-align: ${align};
                display: flex;
                align-items: center;
                justify-content: ${justify};
                position: relative;
                white-space: pre-wrap;
                overflow: hidden;
                text-overflow: ellipsis;
              ">${escapeHtml(labelText)}</div>
            </div>
          `;
        }).join("") : "";

        // Open print window
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          const isPortrait = settings.orientation === "portrait";
          const paperSizeVal = settings.paperSize === "letter" ? "letter" : settings.paperSize === "a3" ? "A3" : "A4";

          printWindow.document.write(`
            <html>
              <head>
                <title>${escapeHtml(planName)}</title>
                <style>
                  * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                  }
                  html, body {
                    width: 100%;
                    height: 100%;
                    background: white;
                    overflow: hidden;
                  }
                  .page-wrapper {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8mm; /* standard print safety margin */
                  }
                  img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    display: block;
                  }
                  .text-overlay {
                    position: absolute;
                    pointer-events: none;
                  }
                  .searchable-text, .searchable-text * {
                    color: rgba(0, 0, 0, 0) !important;
                    -webkit-text-fill-color: transparent !important;
                    background: transparent !important;
                    user-select: text !important;
                    -webkit-user-select: text !important;
                  }
                  @page {
                    size: ${paperSizeVal} ${settings.orientation || "landscape"};
                    margin: 0;
                  }
                  @media print {
                    html, body {
                      width: 100%;
                      height: 100%;
                      background: white;
                    }
                    .page-wrapper {
                      padding: 0; /* Let browser print margins take over if any */
                    }
                  }
                </style>
              </head>
              <body>
                <div class="page-wrapper">
                  <img src="${dataUrl}" />
                  <div class="text-overlay">
                    ${textOverlayHtml}
                  </div>
                </div>
                <script>
                  const adjustOverlay = () => {
                    const img = document.querySelector('img');
                    const overlay = document.querySelector('.text-overlay');
                    
                    const imgWidth = img.clientWidth;
                    const imgHeight = img.clientHeight;
                    
                    const intrinsicWidth = img.naturalWidth;
                    const intrinsicHeight = img.naturalHeight;
                    
                    if (!intrinsicWidth || !intrinsicHeight) return;
                    
                    const imgRatio = intrinsicWidth / intrinsicHeight;
                    const containerRatio = imgWidth / imgHeight;
                    
                    let displayW, displayH;
                    let displayX = 0, displayY = 0;
                    
                    if (containerRatio > imgRatio) {
                      displayH = imgHeight;
                      displayW = imgHeight * imgRatio;
                      displayX = (imgWidth - displayW) / 2;
                    } else {
                      displayW = imgWidth;
                      displayH = imgWidth / imgRatio;
                      displayY = (imgHeight - displayH) / 2;
                    }
                    
                    overlay.style.width = displayW + 'px';
                    overlay.style.height = displayH + 'px';
                    overlay.style.left = (img.offsetLeft + displayX) + 'px';
                    overlay.style.top = (img.offsetTop + displayY) + 'px';
                    
                    const scale = displayW / ${widthToExport};
                    overlay.style.setProperty('--font-scale', scale);
                  };

                  window.onload = () => {
                    adjustOverlay();
                    window.addEventListener('resize', adjustOverlay);
                    setTimeout(() => {
                      window.print();
                      setTimeout(() => { window.close(); }, 500);
                    }, 400);
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        } else {
          alert("Pop-up window blocked. Please enable pop-ups to print/export PDF.");
        }
      } else {
        setExportFilters(null);
      }
    }, 150);
  };

  const handleExportPlan = ({ format, filters, settings }) => {
    if (format === "png") {
      handleExportPNG(filters, settings);
    } else {
      handleExportPDF(filters, settings);
    }
  };

  const getCurrentBlueprintState = () => ({
    url: blueprintUrl,
    name: blueprintName,
    opacity: blueprintOpacity,
    x: blueprintX,
    y: blueprintY,
    width: blueprintWidth,
    height: blueprintHeight,
    rotation: blueprintRotation,
    isLocked: blueprintIsLocked,
    canvasWidth,
    canvasHeight
  });

  const handleShareClick = () => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/?view=floor-plan&planId=${floorPlanId}&preview=true`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setIsShareTooltipVisible(true);
        setTimeout(() => {
          setIsShareTooltipVisible(false);
        }, 2000);
      }).catch(err => {
        console.error("Failed to copy link:", err);
      });
    }
  };

  const handleBackClick = () => {
    syncAndSaveFloors(elements, getCurrentBlueprintState());
    if (onBack) onBack();
  };

  const categories = [
    {
      id: "booths",
      title: "Exhibition Booths",
      layout: "grid",
      items: [
        { type: "booth-empty", label: "Empty Booth", desc: "Shell only • 4 x 4m", dimensions: "4 x 4m", icon: Store, iconBg: "bg-slate-100", iconColor: "text-slate-650" },
        { type: "booth-semi", label: "Semi-Equipped Booth", desc: "Counter & stool • 4 x 4m", dimensions: "4 x 4m", icon: Store, iconBg: "bg-emerald-50 border border-emerald-150", iconColor: "text-emerald-600" },
        { type: "booth-equipped", label: "Equipped Booth", desc: "Fully furnished • 5 x 5m", dimensions: "5 x 5m", icon: Crown, iconBg: "bg-violet-50 border border-violet-150", iconColor: "text-violet-650" }
      ]
    },
    {
      id: "shapes",
      title: "Basic Shapes",
      layout: "grid",
      items: [
        { type: "square", label: "Square", desc: "Square layout", dimensions: "4 x 4m", icon: Square, iconColor: "text-slate-500" },
        { type: "circle", label: "Circle", desc: "Circle layout", dimensions: "4 x 4m", icon: Circle, iconColor: "text-slate-500" },
        { type: "triangle", label: "Triangle", desc: "Triangle layout", dimensions: "4 x 4m", icon: Triangle, iconColor: "text-slate-500" },
        { type: "star", label: "Star", desc: "Star layout", dimensions: "4 x 4m", icon: Star, iconColor: "text-slate-500" },
        { type: "heart", label: "Heart", desc: "Heart layout", dimensions: "4 x 4m", icon: Heart, iconColor: "text-slate-500" },
        { type: "arrow", label: "Arrow", desc: "Arrow route layout", dimensions: "5 x 3m", icon: ArrowRight, iconColor: "text-slate-500" }
      ]
    },
    {
      id: "annotations",
      title: "Labels & Annotation",
      layout: "grid",
      items: [
        { type: "text", label: "Text Annotation", desc: "Editable label card", dimensions: "9 x 2.5m", icon: Type, iconBg: "bg-amber-50 border border-amber-150", iconColor: "text-amber-600" },
        { type: "image-upload", label: "Upload Logo / Image", desc: "Place local picture asset", dimensions: "Dynamic", icon: Image, iconBg: "bg-sky-50 border border-sky-150", iconColor: "text-sky-600" }
      ]
    },
    {
      id: "structural",
      title: "Structural & Venue",
      layout: "grid",
      items: [
        { type: "structural-pillar", label: "Pillar / Column", desc: "Concrete structural pillar", dimensions: "1.5 x 1.5m", icon: Box, iconColor: "text-slate-600" },
        { type: "structural-partition", label: "Wall Partition", desc: "Temporary divider wall", dimensions: "4 x 0.5m", icon: SeparatorHorizontal, iconColor: "text-slate-500" },
        { type: "structural-stairs", label: "Stairs", desc: "Standard steps stairs", dimensions: "4 x 6m", icon: ArrowUpRight, iconColor: "text-slate-500" },
        { type: "structural-escalator", label: "Escalator", desc: "Moving escalator transit", dimensions: "4 x 6m", icon: ArrowUpRight, iconColor: "text-slate-500" }
      ]
    },
    {
      id: "logistics",
      title: "Access & Logistics",
      layout: "grid",
      items: [
        { type: "entrance", label: "Entrance", desc: "Entrance gate", dimensions: "4 x 2m", icon: LogIn, iconColor: "text-emerald-600" },
        { type: "exit", label: "Exit Gate", desc: "Exit way", dimensions: "4 x 2m", icon: LogOut, iconColor: "text-rose-650" },
        { type: "desk", label: "Registration Desk", desc: "Reception counter", dimensions: "6 x 3m", icon: ConciergeBell, iconColor: "text-slate-650" },
        { type: "access-badging", label: "Badging Kiosk", desc: "Self-Service badging", dimensions: "3 x 3m", icon: IdCard, iconColor: "text-sky-500" },
        { type: "access-turnstile", label: "Turnstile Control", desc: "Access control checkpoint", dimensions: "4 x 2m", icon: Lock, iconColor: "text-slate-600" },
        { type: "access-scan", label: "Scan Checkpoint", desc: "Scan pass gate", dimensions: "3 x 3m", icon: Scan, iconColor: "text-emerald-500" },
        { type: "access-security", label: "Security Scanner / X-Ray", desc: "Bag and scanner gate", dimensions: "2.5 x 2.5m", icon: Shield, iconColor: "text-rose-600" },
        { type: "access-barriers", label: "Queue Barriers (Stanchions)", desc: "Crowd control line", dimensions: "6 x 0.5m", icon: Fence, iconColor: "text-slate-500" },
        { type: "access-assembly", label: "Emergency Assembly Point", desc: "Safe gathering area", dimensions: "4 x 4m", icon: MapPin, iconColor: "text-red-500" },
        { type: "corridor", label: "Corridor Path", desc: "Walkway segment", dimensions: "12 x 2m", icon: Route, iconBg: "bg-slate-50 border border-slate-200", iconColor: "text-slate-650" }
      ]
    },
    {
      id: "stages",
      title: "Stages & Screen AV",
      layout: "grid",
      items: [
        { type: "stage-podium", label: "Speaker Podium", desc: "Podium table and chairs for speakers", dimensions: "6 x 4m", icon: Mic, iconBg: "bg-violet-50 border border-violet-150", iconColor: "text-violet-600" },
        { type: "screen", label: "LED / AV Screen", desc: "Wall projection display", dimensions: "8 x 1m", icon: Monitor, iconBg: "bg-violet-50 border border-violet-150", iconColor: "text-violet-600" },
        { type: "stage-panel", label: "Speakers Panel Table", desc: "Q&A panel seating desk", dimensions: "6 x 2m", icon: Presentation, iconColor: "text-indigo-600" },
        { type: "auditorium-block", label: "Auditorium Block", desc: "Auditorium seating group layout", dimensions: "15 x 12m", icon: Armchair, iconColor: "text-violet-650" },
        { type: "theater-in-the-round", label: "Theater-in-the-Round", desc: "Circular stage with surrounding seat rings", dimensions: "20 x 20m", icon: CircleDot, iconColor: "text-indigo-650" },
        { type: "runway-t", label: "T-shaped Runway", desc: "Double runway extension", dimensions: "10 x 12m", icon: Presentation, iconColor: "text-indigo-600" },
        { type: "broadcast-studio", label: "Broadcast Studio Zone", desc: "Camera position markers layout", dimensions: "12 x 10m", icon: Video, iconColor: "text-fuchsia-600" },
        { type: "lighting-rig", label: "Lighting Rig", desc: "Truss bar with drop markers", dimensions: "10 x 0.5m", icon: Zap, iconColor: "text-amber-500" }
      ]
    },
    {
      id: "tech",
      title: "Tech, AV & Signage",
      layout: "grid",
      items: [
        { type: "tech-totem", label: "Digital Totem / Directory", desc: "Interactive display screen", dimensions: "1.5 x 1m", icon: Tablet, iconColor: "text-sky-500" },
        { type: "tech-banner", label: "Roll-up Banner / Display Board", desc: "Vertical signage banner", dimensions: "2 x 0.5m", icon: LayoutTemplate, iconColor: "text-slate-650" },
        { type: "tech-camera", label: "Camera / Broadcast Setup", desc: "Video broadcast tripod", dimensions: "2.5 x 2.5m", icon: Video, iconColor: "text-indigo-500" },
        { type: "tech-wifi", label: "WiFi Access Point", desc: "Wireless hotspot station", dimensions: "1 x 1m", icon: Wifi, iconColor: "text-emerald-500" }
      ]
    },
    {
      id: "networking",
      title: "B2B & Networking",
      layout: "grid",
      items: [
        { type: "net-pod", label: "B2B Meeting Pod", desc: "Mini meeting booth", dimensions: "6 x 6m", icon: Briefcase, iconColor: "text-purple-600" },
        { type: "net-vip", label: "VIP Lounge", desc: "Premium networking room", dimensions: "10 x 7.5m", icon: Sparkles, iconColor: "text-amber-500" },
        { type: "net-press", label: "Press / Media Zone", desc: "Interviews & cameras", dimensions: "8 x 5m", icon: Megaphone, iconColor: "text-indigo-500" },
        { type: "net-speakers", label: "Speakers Lounge / Green Room", desc: "Private VIP prep lounge", dimensions: "8 x 6m", icon: Armchair, iconColor: "text-violet-555" },
        { type: "scheduled-meeting-room", label: "Scheduled Meeting Room", desc: "Meeting space with schedule", dimensions: "8 x 6m", icon: Briefcase, iconColor: "text-emerald-600" },
        { type: "net-zone", label: "Networking Zone", desc: "Open lounge area", dimensions: "12 x 10m", icon: Users, iconColor: "text-indigo-500" },
        { type: "pitch-zone", label: "Pitch Zone", desc: "Startup pitch pod cluster", dimensions: "14 x 10m", icon: Layers, iconColor: "text-violet-600" },
        { type: "zone-overlay", label: "Zone Color Fill", desc: "Organizers color-coded zone area", dimensions: "24 x 16m", icon: Map, iconColor: "text-slate-500" }
      ]
    },
    {
      id: "furniture",
      title: "Furniture & Seating",
      layout: "grid",
      items: [
        { type: "table", label: "Round Table", desc: "Plain circular table", dimensions: "4.5 x 4.5m", icon: Disc, iconColor: "text-slate-500" },
        { type: "table-chairs", label: "Table & Chairs", desc: "Banquet dining set", dimensions: "6 x 6m", icon: CircleDot, iconColor: "text-indigo-500" },
        { type: "furniture-sofa", label: "Lounge Sofa", desc: "Comfortable lounge couch", dimensions: "7 x 3m", icon: Armchair, iconColor: "text-emerald-500" },
        { type: "furniture-cocktail", label: "Cocktail Table", desc: "Tall cocktail stand", dimensions: "3 x 3m", icon: Circle, iconColor: "text-slate-400" },
        { type: "furniture-chair", label: "Single Chair", desc: "Individual seating chair", dimensions: "2 x 2m", icon: Armchair, iconColor: "text-indigo-500" },
        { type: "classroom-rows", label: "Classroom Rows", desc: "Tables with facing chairs", dimensions: "10 x 8m", icon: LayoutTemplate, iconColor: "text-emerald-500" },
        { type: "reserved-seat-block", label: "Seats", desc: "Customizable rows of seats", dimensions: "8 x 2m", icon: Star, iconColor: "text-amber-500" }
      ]
    },
    {
      id: "facilities",
      title: "Facilities & Compliance",
      layout: "grid",
      items: [
        { type: "utility-catering", label: "Catering Bar", desc: "Food & refreshments table", dimensions: "6 x 4m", icon: Utensils, iconColor: "text-green-600" },
        { type: "utility-wc", label: "Restrooms", desc: "Public restroom facilities", dimensions: "3 x 3m", icon: Users, iconColor: "text-sky-650" },
        { type: "utility-coffee", label: "Coffee Lounge", desc: "Coffee & lounge area", dimensions: "8 x 6m", icon: Coffee, iconColor: "text-amber-700" },
        { type: "utility-help", label: "Info Center", desc: "Event information desk", dimensions: "3 x 3m", icon: AlertTriangle, iconColor: "text-amber-600" },
        { type: "utility-firstaid", label: "First Aid Tent", desc: "Medical support station", dimensions: "5 x 4m", icon: HeartPulse, iconColor: "text-rose-500" },
        { type: "utility-cloak", label: "Cloakroom", desc: "Coats & bags check-in", dimensions: "6 x 4m", icon: Tag, iconColor: "text-stone-500" },
        { type: "utility-power", label: "Power Supply", desc: "Electrical source station", dimensions: "2 x 2m", icon: Plug, iconColor: "text-amber-500" },
        { type: "utility-prayer", label: "Prayer Room", desc: "Quiet prayer space", dimensions: "6 x 5m", icon: Compass, iconColor: "text-slate-650" },
        { type: "utility-water", label: "Water Dispenser / Station", desc: "Drinking water refill station", dimensions: "1.5 x 1.5m", icon: GlassWater, iconColor: "text-sky-500" },
        { type: "utility-trash", label: "Trash / Recycling Bins", desc: "Waste disposal units", dimensions: "2 x 1m", icon: Trash2, iconColor: "text-slate-500" },
        { type: "utility-dining", label: "Dining Area", desc: "Seated dining section", dimensions: "10 x 8m", icon: Utensils, iconColor: "text-green-650" },
        { type: "safety-extinguisher", label: "Fire Extinguisher", desc: "Emergency extinguisher marker", dimensions: "1 x 1m", icon: Shield, iconColor: "text-red-600" },
        { type: "safety-exit-route", label: "Emergency Exit Route", desc: "Dashed exit route arrow line", dimensions: "12 x 2m", icon: Route, iconColor: "text-green-600" },
        { type: "safety-accessibility-path", label: "Accessibility Path", desc: "Dashed handicap path line", dimensions: "12 x 2m", icon: Compass, iconColor: "text-blue-600" },
        { type: "safety-cctv", label: "CCTV Camera", desc: "Security coverage wedge", dimensions: "3 x 3m", icon: Video, iconColor: "text-slate-600" }
      ]
    },
    {
      id: "outdoor",
      title: "Outdoor & Perimeter",
      layout: "grid",
      items: [
        { type: "parking-zone", label: "Parking Zone", desc: "Grid of parking bays", dimensions: "20 x 15m", icon: Grid, iconColor: "text-slate-600" },
        { type: "shuttle-bay", label: "Shuttle / Transport Bay", desc: "Transit shuttle platform", dimensions: "12 x 6m", icon: Route, iconColor: "text-sky-650" },
        { type: "tent-marquee", label: "Outdoor Tent / Marquee", desc: "Pavilion marquee tent", dimensions: "16 x 10m", icon: Triangle, iconColor: "text-amber-600" },
        { type: "landscape-zone", label: "Green / Landscaping Zone", desc: "Green turf decoration area", dimensions: "12 x 10m", icon: Sparkles, iconColor: "text-green-600" },
        { type: "perimeter-barrier", label: "Perimeter Barrier", desc: "Barricade boundary line", dimensions: "15 x 0.5m", icon: Fence, iconColor: "text-slate-500" }
      ]
    },
    {
      id: "food",
      title: "Food & Hospitality",
      layout: "grid",
      items: [
        { type: "food-truck", label: "Food Truck Bay", desc: "Food truck stall bay", dimensions: "8 x 5m", icon: Utensils, iconColor: "text-amber-600" },
        { type: "drinks-bar", label: "Bar / Drinks Station", desc: "Beverages service counter", dimensions: "6 x 4m", icon: GlassWater, iconColor: "text-sky-600" },
        { type: "buffet-line", label: "Buffet Line", desc: "Buffet service row table", dimensions: "10 x 3m", icon: SeparatorHorizontal, iconColor: "text-emerald-600" },
        { type: "snack-kiosk", label: "Snack Kiosk", desc: "Small snack kiosk counter", dimensions: "3 x 3m", icon: Store, iconColor: "text-stone-600" }
      ]
    }
  ];

  const filteredCategories = categories.map(cat => {
    const filteredItems = cat.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      ...cat,
      items: filteredItems
    };
  }).filter(cat => cat.items.length > 0);

  const getElementIconComponent = (type) => {
    const iconMap = {
      "booth-empty": Store,
      "booth-semi": Store,
      "booth-equipped": Crown,
      "structural-pillar": Box,
      "structural-partition": SeparatorHorizontal,
      "structural-stairs": ArrowUpRight,
      "structural-escalator": ArrowUpRight,
      "entrance": LogIn,
      "exit": LogOut,
      "desk": ConciergeBell,
      "access-badging": IdCard,
      "access-turnstile": Lock,
      "access-scan": Scan,
      "access-security": Shield,
      "access-barriers": Fence,
      "access-assembly": MapPin,
      "corridor": Route,
      "stage": Mic,
      "screen": Monitor,
      "stage-panel": Presentation,
      "stage-podium": Mic,
      "auditorium-block": Armchair,
      "theater-in-the-round": CircleDot,
      "runway-t": Presentation,
      "broadcast-studio": Video,
      "lighting-rig": Zap,
      "tech-totem": Tablet,
      "tech-banner": LayoutTemplate,
      "tech-camera": Video,
      "tech-wifi": Wifi,
      "net-pod": Briefcase,
      "net-vip": Sparkles,
      "net-press": Megaphone,
      "net-speakers": Armchair,
      "scheduled-meeting-room": Briefcase,
      "net-zone": Users,
      "pitch-zone": Layers,
      "zone-overlay": Map,
      "table": Disc,
      "table-chairs": CircleDot,
      "furniture-sofa": Armchair,
      "furniture-cocktail": Circle,
      "furniture-chair": Armchair,
      "classroom-rows": LayoutTemplate,
      "reserved-seat-block": Star,
      "utility-catering": Utensils,
      "utility-wc": Users,
      "utility-coffee": Coffee,
      "utility-help": AlertTriangle,
      "utility-firstaid": HeartPulse,
      "utility-cloak": Tag,
      "utility-power": Plug,
      "utility-prayer": Compass,
      "utility-water": GlassWater,
      "utility-trash": Trash2,
      "utility-dining": Utensils,
      "safety-extinguisher": Shield,
      "safety-exit-route": Route,
      "safety-accessibility-path": Compass,
      "safety-cctv": Video,
      "parking-zone": Grid,
      "shuttle-bay": Route,
      "tent-marquee": Triangle,
      "landscape-zone": Sparkles,
      "perimeter-barrier": Fence,
      "food-truck": Utensils,
      "drinks-bar": GlassWater,
      "buffet-line": SeparatorHorizontal,
      "snack-kiosk": Store,
      "square": Square,
      "circle": Circle,
      "triangle": Triangle,
      "star": Star,
      "heart": Heart,
      "arrow": ArrowRight,
    };
    return iconMap[type] || MapPin;
  };

  const renderDirectoryList = (isMobile = false) => {
    const allMatched = filteredDirectoryElements;

    const normalMatched = allMatched.filter(el => el.type !== "table-chairs" && el.type !== "stage-podium");
    const tableChairsMatched = allMatched.filter(el => el.type === "table-chairs" || el.type === "stage-podium");

    if (allMatched.length === 0) {
      return (
        <div className="text-center text-slate-400 py-8 text-xs font-semibold">
          {t("floor.noLocationsMatched", "No locations matched your search.")}
        </div>
      );
    }

    const showTablesExpanded = previewSearchQuery ? true : isTablesSectionExpanded;

    const handleItemClick = (el) => {
      handleSelectId(el.id, false);
      if (isMobile) {
        setIsMobileDirectoryOpen(false);
      }
      if (canvasRef.current && canvasRef.current.zoomToElement) {
        canvasRef.current.zoomToElement(el.id);
      }
    };

    return (
      <div className="flex flex-col gap-2 pb-4">
        {/* Render normal matching items first */}
        {normalMatched.map(el => {
          let subtitle = "";
          let isExhibitor = false;
          if (el.exhibitorId) {
            const ex = exhibitorMap.get(String(el.exhibitorId));
            if (ex) {
              subtitle = ex.name;
              isExhibitor = true;
            }
          }
          if (!subtitle) {
            subtitle = t("floor.item_" + el.type.replace(/-/g, "_"), el.type.replace("utility-", "").replace("furniture-", "").replace("structural-", "").replace("access-", "").replace("stage-", "").replace("tech-", "").replace("net-", "").replace("-", " ").toUpperCase());
          }

          const isSelected = selectedIds.includes(el.id);

          return (
            <button
              key={el.id}
              onClick={() => handleItemClick(el)}
              className={`w-full text-start rtl:text-right text-left px-3.5 py-3 border rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-indigo-650 border-indigo-650 text-white shadow-md shadow-indigo-100"
                  : "bg-white/65 hover:bg-white border-slate-200/50 text-slate-800 hover:border-slate-300 shadow-sm"
              }`}
            >
              <div className="flex flex-col gap-0.5 max-w-[80%]">
                <span className="text-xs font-bold truncate">{getLocalizedElementLabel(el.label, el.type, t)}</span>
                <span className={`text-[10px] font-medium truncate ${isSelected ? "text-indigo-200" : "text-slate-450"}`}>
                  {subtitle}
                </span>
              </div>
              <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                isSelected 
                  ? "bg-white/20 text-white" 
                  : isExhibitor 
                    ? "bg-indigo-50 text-indigo-600" 
                    : "bg-slate-100 text-slate-500"
              }`}>
                {el.type.startsWith("booth") ? t("table.booth", "Booth") : t("floor.venue", "Venue")}
              </span>
            </button>
          );
        })}

        {/* Render Banquet Tables folder/group */}
        {tableChairsMatched.length > 0 && (
          <div className="flex flex-col border border-slate-200/50 rounded-2xl overflow-hidden bg-white/40 shadow-sm hover:border-slate-300/80 hover:bg-white transition-all duration-200">
            <button
              onClick={() => setIsTablesSectionExpanded(prev => !prev)}
              className="w-full text-start rtl:text-right text-left px-3.5 py-3.5 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Users size={15} className="text-indigo-650" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-extrabold text-slate-800">{t("floor.seatingTablesAndPodiums", "Seating Tables & Podiums")}</span>
                  <span className="text-[10px] font-semibold text-slate-450">
                    <bdi dir="ltr">{tableChairsMatched.length}</bdi> {t("floor.seatingLocations", "Seating Locations")}
                  </span>
                </div>
              </div>
              {showTablesExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
            </button>

            {showTablesExpanded && (
              <div className="p-3 bg-slate-50/50 border-t border-slate-100/50 flex flex-col gap-2 max-h-[360px] overflow-y-auto">
                {tableChairsMatched.map(el => {
                  const isSelected = selectedIds.includes(el.id);
                  let defaultSeats = el.type === "stage-podium" ? 2 : 6;
                  let subtitle = el.type === "stage-podium"
                    ? `${el.chairsCount || defaultSeats} Speaker Seats`
                    : `${el.chairsCount || defaultSeats} Seats`;
                  const occupiedCount = el.assignments ? Object.keys(el.assignments).length : 0;
                  if (occupiedCount > 0) {
                    subtitle = el.type === "stage-podium"
                      ? `${occupiedCount} / ${el.chairsCount || defaultSeats} Speakers Assigned`
                      : `${occupiedCount} / ${el.chairsCount || defaultSeats} Seats Assigned`;
                  }

                  return (
                    <div key={el.id} className="flex flex-col">
                      <button
                        onClick={() => handleItemClick(el)}
                        className={`w-full text-start rtl:text-right text-left px-3 py-2.5 border rounded-xl flex items-center justify-between transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md rounded-b-none"
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <div className="flex flex-col gap-0.5 max-w-[80%]">
                          <span className="text-xs font-bold truncate">{el.label || "Banquet Table"}</span>
                          <span className={`text-[10px] font-semibold truncate ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                            {subtitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${
                            isSelected ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600"
                          }`}>
                            {occupiedCount} Seated
                          </span>
                          {isSelected ? <ChevronUp size={11} className={isSelected ? "text-white" : "text-slate-400"} /> : <ChevronDown size={11} className="text-slate-400" />}
                        </div>
                      </button>

                      {isSelected && (
                        <div className="bg-slate-50 border-x border-b border-indigo-600/35 p-3.5 rounded-b-xl flex flex-col gap-2 shadow-inner">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                            Seat Assignments
                          </span>
                          <div className="flex flex-col gap-1.5">
                            {Array.from({ length: el.chairsCount || 6 }).map((_, idx) => {
                              const assignedId = el.assignments ? el.assignments[idx] : null;
                              const attendee = assignedId ? attendeeMap.get(String(assignedId)) : null;
                              return (
                                <div 
                                  key={idx} 
                                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                                    attendee 
                                      ? "bg-white text-slate-700 border-slate-200 shadow-sm" 
                                      : "bg-slate-100/50 text-slate-400 border-slate-250/50 border-dashed"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-extrabold transition-colors ${
                                      attendee ? "bg-emerald-50 text-emerald-600" : "bg-slate-200/70 text-slate-500"
                                    }`}>
                                      {idx + 1}
                                    </div>
                                    <span className="truncate">
                                      {attendee ? attendee.name : "Unassigned Chair"}
                                    </span>
                                  </div>
                                  {attendee && (
                                    <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[45%]">
                                      {attendee.company || attendee.email || ""}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const isDesktopViewport = windowWidth >= 1280;

  const renderMobileHeader = () => {
    return (
      <>
        {/* Top row */}
        <div className="flex items-center justify-between w-full gap-3 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            {onBack && !initialPreviewMode && (
              <button
                onClick={handleBackClick}
                className="text-slate-400 hover:text-indigo-650 transition-colors duration-150 cursor-pointer p-1.5 flex items-center justify-center shrink-0"
                title="Back to Floor Plans gallery"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="flex flex-col min-w-0">
              <h2 className="text-[14px] font-extrabold text-slate-850 truncate leading-tight">
                {planName}
              </h2>
              <div className="flex items-center gap-1.5 mt-1 select-none">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-[8px] font-extrabold uppercase tracking-widest text-emerald-600">Live Map View</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isPreviewMode && (
              <button
                onClick={() => setIsMobileDirectoryOpen(true)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition-all cursor-pointer border border-slate-200/20 shadow-sm"
                title="Open Search Directory"
              >
                <Search size={15} />
              </button>
            )}
            {!initialPreviewMode && isPreviewMode && (
              <button 
                onClick={() => {
                  setIsPreviewMode(false);
                  setToolMode("select");
                  setPreviewSearchQuery("");
                  setPreviewFilter("all");
                  setSelectedIds([]);
                }}
                className="px-3 py-2 bg-slate-900 text-white rounded-xl font-bold text-[10px] flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                title="Back to Editor"
              >
                <EyeOff size={12} />
                <span>Exit</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom switcher row */}
        {floors.length > 1 && (
          <div className="w-full select-none pt-0.5">
            {floors.length <= 4 ? (
              <div className="bg-slate-100/90 p-0.5 rounded-xl flex w-full relative border border-slate-200/30">
                {floors.map(floor => (
                  <button
                    key={floor.id}
                    onClick={() => switchFloor(floor.id)}
                    className={`flex-1 py-1.5 rounded-[9px] text-[11px] font-bold text-center transition-all duration-200 cursor-pointer ${
                      activeFloorId === floor.id
                        ? "bg-white text-slate-800 shadow-sm font-extrabold"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {floor.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 overflow-x-auto w-full scrollbar-none py-0.5">
                {floors.map(floor => (
                  <button
                    key={floor.id}
                    onClick={() => switchFloor(floor.id)}
                    className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      activeFloorId === floor.id
                        ? "bg-indigo-650 text-white shadow-md shadow-indigo-650/10 scale-105 font-extrabold"
                        : "bg-slate-100/80 border border-slate-200/20 text-slate-600 hover:bg-slate-200/50"
                    }`}
                  >
                    {floor.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col flex-1 bg-slate-50 select-none h-screen w-full border-none rounded-none shadow-none overflow-hidden min-h-0">
      <header className={`border-b border-slate-200 flex shrink-0 transition-all ${
        isPreviewMode && previewDeviceMode === "mobile" && !isDesktopViewport
          ? "fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md flex-col justify-center px-5 pt-5 pb-3 h-auto gap-3 items-stretch shadow-sm"
          : initialPreviewMode 
            ? "sticky top-0 z-50 bg-white flex-col justify-center px-6 pt-6 pb-4 h-auto gap-2 items-start" 
            : "sticky top-0 z-50 h-16 bg-white items-center justify-between px-8"
      }`}>
        {isPreviewMode && previewDeviceMode === "mobile" && !isDesktopViewport ? (
          renderMobileHeader()
        ) : (
          <>
            <div className="flex items-center gap-3">
              {onBack && !initialPreviewMode && (
                <button
                  onClick={handleBackClick}
                  className="text-slate-400 hover:text-indigo-650 transition-colors duration-150 cursor-pointer p-1.5 flex items-center justify-center"
                  title="Back to Floor Plans gallery"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <div className="flex flex-col">
                {isEditingName ? (
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={() => {
                      setIsEditingName(false);
                      if (tempName.trim() && tempName.trim() !== planName) {
                        onRename(tempName.trim());
                      } else {
                        setTempName(planName);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      } else if (e.key === "Escape") {
                        setTempName(planName);
                        setIsEditingName(false);
                      }
                    }}
                    autoFocus
                    className="px-2 py-0.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-650 focus:ring-1 focus:ring-indigo-650 bg-white"
                  />
                ) : (
                  <div className="flex items-center gap-2.5">
                    <h2 
                      onDoubleClick={!initialPreviewMode ? () => setIsEditingName(true) : undefined}
                      className={`text-md font-bold text-slate-800 leading-tight ${!initialPreviewMode ? "cursor-pointer hover:text-indigo-650" : ""} transition-colors select-text`}
                      title={!initialPreviewMode ? "Double-click to rename" : undefined}
                    >
                      {planName}
                    </h2>
                    {saveStatus && !initialPreviewMode && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                        saveStatus === "saving" 
                          ? "bg-amber-50 text-amber-600 border border-amber-100" 
                          : saveStatus === "saved" 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-rose-50 text-rose-600 border border-rose-100"
                      }`}>
                        {saveStatus === "saving" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        )}
                        {saveStatus === "saved" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                        {saveStatus === "error" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        )}
                        {saveStatus === "saving" ? t("floor.saving", "Saving...") : saveStatus === "saved" ? t("floor.savedSuccess", "Saved") : "Save Error"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* If initialPreviewMode is true, render the floors switcher right here under the name! */}
            {initialPreviewMode && floors.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto w-full select-none scrollbar-none py-0.5">
                {floors.map(floor => (
                  <button
                    key={floor.id}
                    onClick={() => switchFloor(floor.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                      activeFloorId === floor.id
                        ? "bg-indigo-650 text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {floor.name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2" ref={toolbarRef}>
              {/* Search bar next to Font button */}
              {!initialPreviewMode && (
                <div className="relative w-44">
                  <input
                    type="text"
                    placeholder={t("common.search", "Search map...")}
                    value={previewSearchQuery}
                    onChange={(e) => setPreviewSearchQuery(e.target.value)}
                    className="w-full pl-7.5 pr-7 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-400 rounded-xl font-semibold text-xs text-slate-700 outline-none transition-all"
                  />
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  {previewSearchQuery && (
                    <button
                      onClick={() => setPreviewSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-sm"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

              {!initialPreviewMode && (
                <div className="w-px h-6 bg-slate-200 mx-2"></div>
              )}

              {/* History Controls */}
              {!initialPreviewMode && (
                <>
                  <button 
                    onClick={handleUndo} 
                    disabled={historyIndex === 0}
                    className="p-2 bg-slate-50 border border-slate-200 hover:border-indigo-150 hover:text-indigo-650 rounded-xl text-slate-655 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
                    title="Undo"
                  >
                    <Undo2 size={16} />
                  </button>
                  <button 
                    onClick={handleRedo} 
                    disabled={historyIndex === history.length - 1}
                    className="p-2 bg-slate-50 border border-slate-200 hover:border-indigo-150 hover:text-indigo-650 rounded-xl text-slate-655 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
                    title="Redo"
                  >
                    <Redo2 size={16} />
                  </button>
                </>
              )}
              
              {selectedIds.length > 0 && !initialPreviewMode && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowArrayModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-150 hover:text-indigo-650 rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer shadow-sm"
                    title="Create a grid array of copies of this element"
                  >
                    <Layers size={15} />
                    <span>Array / Duplicate</span>
                  </button>
                  <div className="w-px h-6 bg-slate-200 mx-2"></div>
                </>
              )}

              {/* Device Preview Toggle in Header (Visible only when in Preview Mode) */}
              {isPreviewMode && !initialPreviewMode && (
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 shadow-inner">
                  <button
                    onClick={() => {
                      setPreviewDeviceMode("desktop");
                      setIsMobileDirectoryOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                      previewDeviceMode === "desktop"
                        ? "bg-white text-slate-850 shadow-sm font-extrabold"
                        : "text-slate-500 hover:text-slate-850"
                    }`}
                  >
                    <Monitor size={13} />
                    <span>{t("floor.webDesktop", "Web / Desktop")}</span>
                  </button>
                  <button
                    onClick={() => setPreviewDeviceMode("mobile")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                      previewDeviceMode === "mobile"
                        ? "bg-white text-slate-850 shadow-sm font-extrabold"
                        : "text-slate-500 hover:text-slate-850"
                    }`}
                  >
                    <Smartphone size={13} />
                    <span>{t("floor.mobileApp", "Mobile App")}</span>
                  </button>
                </div>
              )}

              {/* Share Button */}
              {!initialPreviewMode && (
                <div className="relative">
                  <button
                    onClick={handleShareClick}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 hover:border-indigo-150 hover:text-indigo-650 rounded-xl font-semibold text-xs text-slate-655 transition-all duration-200 cursor-pointer"
                    title="Copy shareable preview link"
                  >
                    <Share2 size={15} />
                    <span>Share</span>
                  </button>
                  {isShareTooltipVisible && (
                    <div className="absolute top-full right-0 mt-1.5 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap animate-fade-in font-sans">
                      {t("floor.linkCopied", "Link Copied!")}
                    </div>
                  )}
                </div>
              )}

              {/* Preview Map & Save & Reset */}
              {!initialPreviewMode && (
                <button 
                  onClick={() => {
                    setIsPreviewMode(prev => {
                      const next = !prev;
                      if (next) {
                        setToolMode("preview");
                        setSelectedIds([]);
                        setPreviewSearchQuery("");
                      } else {
                        setToolMode("select");
                        setPreviewSearchQuery("");
                        setPreviewFilter("all");
                      }
                      return next;
                    });
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${
                    isPreviewMode 
                      ? "bg-indigo-650 border-indigo-650 text-white shadow-sm hover:bg-indigo-700" 
                      : "bg-white border-slate-200 hover:border-indigo-150 hover:text-indigo-650 text-slate-655"
                  }`}
                  title="Preview Map Experience"
                >
                  {isPreviewMode ? <EyeOff size={15} /> : <Eye size={15} />}
                  <span>{t("floor.preview", "Preview Map")}</span>
                </button>
              )}
            </div>
          </>
        )}
      </header>

      {/* Horizontal Floor Switcher Bar (Preview Mode Only) */}
      {isPreviewMode && !initialPreviewMode && previewDeviceMode !== "mobile" && (
        <div className="bg-white border-b border-slate-200 px-8 py-2.5 flex items-center gap-3 overflow-x-auto shrink-0 select-none scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">{t("floor.floors", "Floors")}</span>
          <div className="flex items-center gap-1.5">
            {floors.map(floor => (
              <button
                key={floor.id}
                onClick={() => switchFloor(floor.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  activeFloorId === floor.id
                    ? "bg-indigo-650 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {floor.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main split work area */}
      <div 
        className={`flex flex-1 w-full min-h-0 h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] overflow-hidden ${
          isPreviewMode && previewDeviceMode === "mobile" && !isDesktopViewport
            ? (floors.length > 1 ? "pt-[110px]" : "pt-[68px]")
            : ""
        }`}
      >
        {/* Left sidebar: Drag-and-Drop library */}
        <AnimatePresence initial={false}>
          {!isPreviewMode && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 170 }}
              className="border-r border-slate-200 bg-white px-4 pb-6 flex flex-col gap-6 overflow-y-auto shrink-0 select-none relative overflow-hidden h-full max-h-full min-h-0"
            >
              <div className="min-w-[308px] flex flex-col gap-6 pt-6">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-slate-800">{t("floor.toolbox", "1. Drag Elements to Venue")}</h3>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{t("floor.toolboxDesc", "Drag assets directly onto the blueprint canvas")}</p>
                </div>

                {/* Sticky Search Bar */}
                <div className="sticky top-0 bg-white pt-3 pb-3 z-10 border-b border-slate-100 flex flex-col gap-3 -mt-3 -mx-4 px-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t("floor.searchElements", "Search elements...")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-xl font-medium text-xs text-slate-800 transition-all duration-150 outline-none"
                    />
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-650 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {filteredCategories.map(cat => {
                    return (
                      <div key={cat.id} className="flex flex-col border border-slate-100 rounded-2xl overflow-hidden bg-white/50">
                        {/* Category Header (Collapsible Header) */}
                        <button
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className="w-full px-4 py-3 bg-slate-50/50 flex items-center justify-between border-b border-slate-150 text-start rtl:text-right text-left cursor-pointer hover:bg-slate-100/50 transition-colors outline-none"
                        >
                          <span className="text-[10px] font-bold text-slate-650 uppercase tracking-wider">{t("floor.cat_" + cat.id, cat.title)}</span>
                          <ChevronDown 
                            size={14} 
                            className={`text-slate-400 transition-transform duration-200 ${
                              openCategories[cat.id] ? "rotate-180" : ""
                            }`} 
                          />
                        </button>

                        {/* Category Content */}
                        {openCategories[cat.id] && (
                          <div className="p-3.5 bg-white">
                            {cat.layout === "grid" && (
                              <div className="grid grid-cols-2 gap-2.5">
                                {cat.items.map(item => {
                                  if (item.type === "image-upload") {
                                    return (
                                      <div 
                                        key={item.type}
                                        onClick={() => pictureInputRef.current.click()}
                                        className="bg-slate-50 border border-slate-200 hover:border-indigo-250 rounded-xl p-3 flex flex-col items-center text-center cursor-pointer transition-all duration-200 hover:shadow-sm hover:bg-slate-50/50 relative group"
                                        title={item.desc}
                                      >
                                        <item.icon className={`w-5 h-5 ${item.iconColor || "text-slate-650"} mb-1`} />
                                        <span className="text-[11px] font-bold text-slate-700 leading-tight truncate w-full">{t("floor.item_" + item.type.replace(/-/g, "_"), item.label)}</span>
                                        <input 
                                          ref={pictureInputRef} 
                                          type="file" 
                                          accept="image/*" 
                                          onChange={handlePictureUpload} 
                                          className="hidden" 
                                        />
                                      </div>
                                    );
                                  }
                                  return (
                                    <div 
                                      key={item.type}
                                      draggable={true} 
                                      onDragStart={(e) => handleDragStart(e, item.type)}
                                      onClick={() => canvasRef.current?.addElement(item.type)}
                                      className="bg-slate-50 border border-slate-200 hover:border-indigo-250 rounded-xl p-3 flex flex-col items-center text-center cursor-grab transition-all duration-200 active:cursor-grabbing hover:shadow-sm hover:bg-slate-50/50 relative group"
                                    >
                                      <item.icon className={`w-5 h-5 ${item.iconColor || "text-slate-650"} mb-1`} />
                                      <span className="text-[11px] font-bold text-slate-700 leading-tight truncate w-full">{t("floor.item_" + item.type.replace(/-/g, "_"), item.label)}</span>
                                      {/* Custom delay hover tooltip showing dimension/metadata */}
                                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 pointer-events-none transition-all duration-200 delay-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible z-40 bg-slate-900/95 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                                        {item.desc} ({item.dimensions})
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Center: HTML5 Canvas Area */}
        <main className={`flex-1 h-full min-h-0 flex items-center justify-center overflow-hidden relative ${
          initialPreviewMode ? "p-0" : "p-0 md:p-6"
        }`}>

          {/* Unified Canvas Viewport Wrapper */}
          <div 
            className={`transition-all duration-300 relative overflow-hidden flex flex-col pointer-events-auto shrink-0 ${
              isPreviewMode && previewDeviceMode === "mobile"
                ? "w-full h-full xl:w-[375px] xl:h-[720px] xl:rounded-[50px] xl:border-[12px] xl:border-slate-900 shadow-none xl:shadow-2xl bg-slate-50 xl:ring-1 xl:ring-slate-950/10 animate-fade-in"
                : "w-full h-full min-h-0 flex-1"
            }`}
          >
            {/* Dynamic Status Bar (iPhone style) - Rendered only in Mobile preview mode */}
            {isPreviewMode && previewDeviceMode === "mobile" && (
              <div className="hidden xl:flex h-11 bg-slate-950 text-white items-center justify-between px-6 select-none text-[11px] font-bold z-50 shrink-0 relative">
                <span>9:41</span>
                {/* Speaker pill notch */}
                <div className="w-28 h-4.5 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-0 rounded-t-none"></div>
                <div className="flex items-center gap-1.5">
                  <Wifi size={11} />
                  <span className="text-[9px]">LTE</span>
                  <div className="w-5 h-2.5 border border-white/80 rounded-[3px] p-0.5 flex items-center">
                    <div className="h-full w-full bg-white rounded-[1px]"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Render Mobile Header inside the simulated phone frame on desktop */}
            {isPreviewMode && previewDeviceMode === "mobile" && isDesktopViewport && (
              <div className="hidden xl:flex bg-white/85 backdrop-blur-md flex-col justify-center px-5 pt-4 pb-3 h-auto gap-3 items-stretch shadow-sm border-b border-slate-200/50 shrink-0 z-40">
                {renderMobileHeader()}
              </div>
            )}

            {/* Canvas viewport container */}
            <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col w-full h-full">
              {/* Floating Floor Switcher Panel (Edit Mode Only) */}
              {!isPreviewMode && (
                <div className="absolute z-30 transition-all duration-300 pointer-events-auto left-4 top-4">
                  <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg rounded-2xl p-2.5 flex flex-col gap-2 w-48">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 px-1 shrink-0">
                      <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wider">{t("floor.floors", "Floors")}</span>
                      <button
                        onClick={handleAddFloor}
                        className="p-1 hover:bg-slate-100 rounded-md text-indigo-650 transition-colors cursor-pointer"
                        title="Add Floor"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Edit mode reorderable drag list */}
                    <Reorder.Group
                      axis="y"
                      values={floors}
                      onReorder={handleReorderFloors}
                      className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-0.5"
                    >
                      {floors.map(floor => (
                        <FloorItem
                          key={floor.id}
                          floor={floor}
                          isActive={activeFloorId === floor.id}
                          isOnly={floors.length <= 1}
                          onSelect={() => switchFloor(floor.id)}
                          onRename={(newName) => handleRenameFloor(floor.id, newName)}
                          onDelete={(e) => handleDeleteFloor(floor.id, e)}
                        />
                      ))}
                    </Reorder.Group>
                  </div>
                </div>
              )}

              <FloorPlanCanvas
                ref={canvasRef}
                elements={elements}
                onUpdateLayout={commitHistoryState}
                selectedIds={selectedIds}
                onSelectId={handleSelectId}
                blueprintUrl={blueprintUrl}
                blueprintOpacity={blueprintOpacity}
                blueprintX={blueprintX}
                blueprintY={blueprintY}
                blueprintWidth={blueprintWidth}
                blueprintHeight={blueprintHeight}
                blueprintRotation={blueprintRotation}
                blueprintIsLocked={blueprintIsLocked}
                snapToGrid={snapToGrid}
                showGrid={isPreviewMode && previewDeviceMode === "mobile" ? false : showGrid}
                gridSize={gridSize}
                previewDeviceMode={previewDeviceMode}
                toolMode={toolMode}
                onToolModeChange={setToolMode}
                floorPlanFont={floorPlanFont}
                exhibitors={exhibitors}
                attendees={attendees}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                exportFilters={exportFilters}
                previewSearchQuery={debouncedSearchQuery}
                previewFilter={previewFilter}
                selectedSeatId={selectedSeatId}
                onSelectSeat={handleSelectSeat}
                showDimensions={showDimensions}
                isPreviewMode={isPreviewMode}
              />

              {/* Floating Zoom Controls for Mobile Preview */}
              {isPreviewMode && previewDeviceMode === "mobile" && (
                <div className={`z-40 flex flex-col items-center bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl rounded-2xl p-1 gap-1 pointer-events-auto transition-all duration-300 ${
                  isDesktopViewport ? "absolute bottom-6 right-4" : "fixed bottom-6 right-4"
                }`}>
                  <button
                    onClick={() => canvasRef.current?.zoomIn()}
                    className="w-9 h-9 rounded-xl text-slate-700 hover:text-indigo-650 hover:bg-slate-100 flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
                    title="Zoom In"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                  <div className="w-6 h-[1px] bg-slate-200/60 my-0.5" />
                  <button
                    onClick={() => canvasRef.current?.zoomOut()}
                    className="w-9 h-9 rounded-xl text-slate-700 hover:text-indigo-650 hover:bg-slate-100 flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
                    title="Zoom Out"
                  >
                    <Minus size={16} strokeWidth={2.5} />
                  </button>
                  <div className="w-6 h-[1px] bg-slate-200/60 my-0.5" />
                  <button
                    onClick={() => canvasRef.current?.zoomToFit()}
                    className="w-9 h-9 rounded-xl text-slate-700 hover:text-indigo-650 hover:bg-slate-100 flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
                    title="Zoom to Fit"
                  >
                    <Maximize size={15} strokeWidth={2.5} />
                  </button>
                </div>
              )}

              {/* Mobile Directory Bottom Sheet */}
              <AnimatePresence>
                {isPreviewMode && previewDeviceMode === "mobile" && isMobileDirectoryOpen && (
                  <motion.div
                    key="mobile-directory-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMobileDirectoryOpen(false)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] z-[45] pointer-events-auto cursor-pointer"
                  />
                )}
                {isPreviewMode && previewDeviceMode === "mobile" && isMobileDirectoryOpen && (
                  <motion.div
                    key="mobile-directory-sheet"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 220 }}
                    className="absolute inset-x-0 bottom-0 bg-white rounded-t-[30px] shadow-2xl border-t border-slate-200/80 z-50 flex flex-col max-h-[85%] pb-[calc(env(safe-area-inset-bottom,16px)+12px)] pointer-events-auto"
                  >
                    {/* Drag Handle & Close area */}
                    <div className="flex flex-col items-center py-3.5 cursor-pointer shrink-0" onClick={() => setIsMobileDirectoryOpen(false)}>
                      <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
                    </div>
                    
                    <div className="px-5 pb-3.5 flex justify-between items-center shrink-0">
                      <div className="flex flex-col">
                        <h3 className="text-xs font-bold text-slate-800">Attendee Directory</h3>
                        <p className="text-[9px] font-semibold text-slate-400">Browse booths and locations</p>
                      </div>
                      <button 
                        onClick={() => setIsMobileDirectoryOpen(false)}
                        className="w-6 h-6 bg-slate-100/80 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center font-bold text-[10px]"
                      >
                        ×
                      </button>
                    </div>

                    {/* View Filter Dropdown removed for mobile preview directory */}

                    {/* Matched Elements List */}
                    <div className="flex-1 overflow-y-auto px-5 pr-4 pb-12 flex flex-col gap-2">
                      {renderDirectoryList(true)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile Details Bottom Sheet */}
              <AnimatePresence>
                {mobileDetailsData && (
                  <motion.div
                    key="mobile-details-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    exit={{ opacity: 0 }}
                    onClick={() => handleSelectId([], false)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] z-[45] pointer-events-auto cursor-pointer"
                  />
                )}
                {mobileDetailsData && (
                  <motion.div
                    key={`mobile-details-drawer-${mobileDetailsData.el.id}`}
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 220 }}
                    className="absolute inset-x-0 bottom-0 bg-white rounded-t-[30px] shadow-2xl border-t border-slate-200/80 z-50 flex flex-col max-h-[85%] pb-[calc(env(safe-area-inset-bottom,16px)+12px)] pointer-events-auto"
                  >
                    {/* Drag Handle */}
                    <div className="flex flex-col items-center py-3 cursor-pointer shrink-0" onClick={() => handleSelectId([], false)}>
                      <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
                    </div>

                    {/* Top area */}
                    <div className="px-5 pb-4 flex justify-between items-start shrink-0">
                      <div className="flex gap-3 items-center">
                        {mobileDetailsData.effectiveSeatId ? (
                          mobileDetailsData.attendee && mobileDetailsData.attendee.image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={mobileDetailsData.attendee.image} className="w-12 h-12 rounded-xl object-cover shadow border border-slate-100 bg-white shrink-0" alt={mobileDetailsData.attendee.name} />
                          ) : (
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${mobileDetailsData.logoGradient} flex items-center justify-center text-white shadow shrink-0`}>
                              <Armchair size={22} className="text-white" />
                            </div>
                          )
                        ) : mobileDetailsData.exhibitor && mobileDetailsData.exhibitor.logo ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={mobileDetailsData.exhibitor.logo} className="w-12 h-12 rounded-xl object-cover shadow border border-slate-100 bg-white" alt={mobileDetailsData.exhibitor.name} />
                        ) : (() => {
                          const IconComp = getElementIconComponent(mobileDetailsData.el.type);
                          return (
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${mobileDetailsData.logoGradient} flex items-center justify-center text-white shadow shrink-0`}>
                              <IconComp size={22} className="text-white" />
                            </div>
                          );
                        })()}
                        <div className="flex flex-col gap-0.5 max-w-[190px]">
                          <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">{getLocalizedElementLabel(mobileDetailsData.title, mobileDetailsData.el?.type, t)}</h4>
                          <span className="text-[10px] font-semibold text-indigo-650 truncate">{mobileDetailsData.subtitle}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleSelectId([], false)}
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center font-bold text-[10px]"
                      >
                        ×
                      </button>
                    </div>

                    {/* Tag list */}
                    <div className="px-5 pb-3 flex flex-wrap gap-1 shrink-0">
                      {mobileDetailsData.tags.map((tag, i) => (
                        <span 
                          key={i} 
                          className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                            tag === "available" || tag === "AVAILABLE" ? "bg-green-50 text-green-700 border border-green-100" :
                            tag === "sold" || tag === "SOLD" || tag === "SOLD OUT" ? "bg-red-50 text-red-700 border border-red-100" :
                            tag === "reserved" || tag === "RESERVED" ? "bg-orange-50 text-orange-700 border border-orange-100" :
                            tag.includes("VIP") || tag.includes("Diamond") ? "bg-rose-50 text-rose-700 border border-rose-100" :
                            "bg-indigo-50/50 text-indigo-600 border border-indigo-100/20"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="h-px bg-slate-100 mx-5 mb-3"></div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto px-5 pb-12 flex flex-col gap-3">
                      {mobileDetailsData.attendee && (
                        <div className="mt-1 flex flex-col gap-2 bg-emerald-50/20 border border-emerald-100/30 p-3 rounded-xl">
                          <span className="text-[8px] font-bold text-emerald-800 uppercase tracking-wider">{t("floor.reservationDetails", "Reservation Details")}</span>
                          <div className="flex flex-col gap-1 text-[10px]">
                            <div className="flex justify-between">
                              <span className="font-semibold text-slate-500">Name</span>
                              <span className="font-bold text-slate-800">{mobileDetailsData.attendee.name}</span>
                            </div>
                            {mobileDetailsData.attendee.email && (
                              <div className="flex justify-between">
                                <span className="font-semibold text-slate-500">Email</span>
                                <span className="font-bold text-slate-800">{mobileDetailsData.attendee.email}</span>
                              </div>
                            )}
                            {mobileDetailsData.attendee.company && (
                              <div className="flex justify-between">
                                <span className="font-semibold text-slate-500">Company</span>
                                <span className="font-bold text-slate-800">{mobileDetailsData.attendee.company}</span>
                              </div>
                            )}
                            {(mobileDetailsData.attendee.ticketType || mobileDetailsData.attendee.ticket_type) && (
                              <div className="flex justify-between">
                                <span className="font-semibold text-slate-500">{t("table.ticketTier", "Ticket Type")}</span>
                                <span className="font-bold text-indigo-650">{mobileDetailsData.attendee.ticketType || mobileDetailsData.attendee.ticket_type}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {!selectedSeatId && (mobileDetailsData.el.type === "table-chairs" || mobileDetailsData.el.type === "stage-podium") && (
                        <div className="flex flex-col gap-1.5 mt-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            {mobileDetailsData.el.type === "stage-podium" ? "Speaker Podium Assignments" : "Table Assignments"}
                          </span>
                          <div className="flex flex-col gap-1">
                            {Array.from({ length: mobileDetailsData.el.chairsCount || (mobileDetailsData.el.type === "stage-podium" ? 2 : 6) }).map((_, idx) => {
                              const assignedAttendeeId = mobileDetailsData.el.assignments ? mobileDetailsData.el.assignments[idx] : null;
                              const attendee = assignedAttendeeId ? attendeeMap.get(String(assignedAttendeeId)) : null;

                              return (
                                <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 border border-slate-100 bg-slate-50/55 rounded-lg">
                                  <span className="text-[9px] font-bold text-slate-500">
                                    {mobileDetailsData.el.type === "stage-podium" ? `Speaker Seat ${idx + 1}` : `Seat ${idx + 1}`}
                                  </span>
                                  {attendee ? (
                                    <div className="flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      <span className="text-[10px] font-bold text-slate-700 truncate max-w-[100px]">{attendee.name}</span>
                                      <span className="text-[8px] font-semibold text-slate-400 truncate max-w-[60px]">({attendee.company || "Speaker"})</span>
                                    </div>
                                  ) : (
                                    <span className="text-[9px] font-semibold text-slate-400 italic">Unassigned</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {mobileDetailsData.exhibitor && (
                        <div className="mt-1 flex flex-col gap-1.5 bg-indigo-50/20 border border-indigo-100/30 p-3 rounded-xl">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Exhibitor Contact</span>
                          <div className="flex justify-between items-center text-[10px]">
                            <div className="flex items-center gap-2 min-w-0">
                              {(mobileDetailsData.exhibitor.contactPhoto || mobileDetailsData.exhibitor.photo || mobileDetailsData.exhibitor.avatar) ? (
                                <img
                                  src={mobileDetailsData.exhibitor.contactPhoto || mobileDetailsData.exhibitor.photo || mobileDetailsData.exhibitor.avatar}
                                  alt=""
                                  className="w-5 h-5 rounded-full object-cover border border-indigo-200 shrink-0"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : null}
                              <span className="font-bold text-slate-700 truncate">{mobileDetailsData.exhibitor.contact || t("drawer.representative", "Representative")}</span>
                            </div>
                            <span className="text-[9px] font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-md shrink-0">Representative</span>
                          </div>
                        </div>
                      )}

                      {/* Center on Map Button */}
                      <button
                        onClick={() => {
                          if (canvasRef.current && canvasRef.current.zoomToElement) {
                            canvasRef.current.zoomToElement(mobileDetailsData.el.id);
                          }
                        }}
                        className="w-full bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all duration-200 mt-2 shrink-0 cursor-pointer"
                      >
                        <Compass size={14} />
                        <span>Center on Map</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile Bottom Home Indicator Bar */}
              {isPreviewMode && previewDeviceMode === "mobile" && (
                <div className="hidden xl:block absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-900/40 rounded-full z-50"></div>
              )}
            </div>
          </div>

          {/* Floating Attendee Sidebar (Left Overlay) */}
          <AnimatePresence>
            {isPreviewMode && previewDeviceMode === "desktop" && (
              <motion.div
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ type: "spring", damping: 22, stiffness: 140 }}
                className="absolute top-6 left-6 bottom-6 w-80 bg-white/85 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl p-6 flex flex-col gap-5 z-40 pointer-events-auto"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-650 bg-indigo-50 px-2.5 py-1 rounded-md w-fit">Interactive Map</span>
                  <h3 className="text-md font-bold text-slate-800 mt-1">Attendee Directory</h3>
                  <p className="text-[10px] font-semibold text-slate-400">Search companies, booths, or locations</p>
                </div>

                {/* Glassmorphic Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t("floor.searchDirectoryPlaceholder", "Search by company, booth, category...")}
                    value={previewSearchQuery}
                    onChange={(e) => setPreviewSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-100/50 hover:bg-slate-100 focus:bg-white border border-slate-200/50 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-2xl font-semibold text-xs text-slate-850 transition-all duration-150 outline-none shadow-sm"
                  />
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  {previewSearchQuery && (
                    <button
                      onClick={() => setPreviewSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-755 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* View Filter Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{t("floor.filterView", "Filter View")}</label>
                  <CustomFilterDropdown
                    value={previewFilter}
                    onChange={setPreviewFilter}
                    options={localizedFilterOptions}
                    btnClassName="px-3 py-2 rounded-2xl text-xs"
                  />
                </div>

                {/* Matched Elements List */}
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
                  {renderDirectoryList(false)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Back to Editor Button (Top Right Overlay) */}
          <AnimatePresence>
            {isPreviewMode && !initialPreviewMode && (
              <motion.button
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ type: "spring", damping: 18, stiffness: 120 }}
                onClick={() => {
                  setIsPreviewMode(false);
                  setToolMode("select");
                  setPreviewSearchQuery("");
                  setPreviewFilter("all");
                  setSelectedIds([]);
                }}
                className="absolute top-6 right-6 bg-slate-900/90 text-white hover:bg-slate-800 backdrop-blur-md px-5 py-3 rounded-full font-bold text-xs flex items-center gap-2 shadow-2xl transition-all duration-200 border border-slate-700 z-40 cursor-pointer pointer-events-auto hover:scale-105"
              >
                <EyeOff size={14} />
                <span>Back to Editor</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Floating Slide-in Detail Drawer (Right Overlay) */}
          <AnimatePresence>
            {isPreviewMode && previewDeviceMode === "desktop" && selectedIds.length === 1 && (() => {
              const el = elements.find(item => item.id === selectedIds[0]);
              if (!el) return null;

              let exhibitor = el.exhibitorId ? exhibitorMap.get(String(el.exhibitorId)) : null;

              let title = el.label || el.type.replace("-", " ").toUpperCase();
              let subtitle = exhibitor ? "Exhibitor Booth" : "Venue Facility";
              let description = "This is an interactive feature on the event floor plan. Click to locate or learn more.";
              let tags = [];
              let logoText = "FP";
              let logoGradient = "from-indigo-500 to-purple-500";
              let attendee = null;

              let effectiveSeatId = selectedSeatId;
              if (!effectiveSeatId && el.type === "furniture-chair") {
                effectiveSeatId = "self";
              }

              if (effectiveSeatId) {
                let occupantId = null;
                let seatLabel = "";
                if (el.type === "furniture-chair") {
                  occupantId = el.assigned_participant_id || el.attendeeId;
                  seatLabel = el.label || "Single Chair";
                } else if (effectiveSeatId.startsWith("chair_")) {
                  const idx = parseInt(effectiveSeatId.split("_")[1]);
                  occupantId = el.assignments ? el.assignments[idx] : null;
                  seatLabel = `Chair ${idx + 1}`;
                } else if (el.children) {
                  const seat = el.children.find(c => c.id === effectiveSeatId);
                  occupantId = seat?.assigned_participant_id || seat?.attendeeId;
                  seatLabel = seat ? seat.label : effectiveSeatId;
                }

                if (occupantId) {
                  attendee = attendeeMap.get(String(occupantId));
                }

                if (attendee) {
                  title = seatLabel;
                  subtitle = `Reserved for ${attendee.name}`;
                  logoText = "👤";
                  logoGradient = "from-emerald-500 to-teal-600";
                  description = `This seat is reserved for ${attendee.name} (${attendee.company || "VIP Guest"}).`;
                  tags = ["Reserved", attendee.ticketType || attendee.ticket_type || "VIP Access Pass"].filter(Boolean);
                } else {
                  title = seatLabel;
                  subtitle = "Available Seat";
                  logoText = "🟢";
                  logoGradient = "from-slate-400 to-slate-500";
                  description = "This seat is currently unassigned and available.";
                  tags = ["Available"];
                }
              } else if (exhibitor) {
                title = el.label || `Booth ${exhibitor.booth || el.id}`;
                subtitle = exhibitor.name;
                logoText = exhibitor.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                
                if (el.status === "sold") {
                  logoGradient = "from-emerald-500 to-teal-600";
                  tags.push("Diamond Partner");
                } else {
                  logoGradient = "from-indigo-500 to-blue-600";
                  tags.push("Exhibitor");
                }
                tags.push("Tech");

                if (exhibitor.name.includes("Hydrogen")) {
                  description = "Pioneering sustainable green hydrogen infrastructure solutions, hydrogen transport logistics, and electrolysis technology for global energy grids.";
                  tags.push("Energy");
                  tags.push("CleanTech");
                } else if (exhibitor.name.includes("Snam")) {
                  description = "Leading European energy infrastructure operator, focusing on pipeline transport networks, natural gas storage facilities, and clean fuel alternatives.";
                  tags.push("Infrastructure");
                  tags.push("Sponsor");
                } else {
                  description = "B2B exhibitor showcasing cutting-edge solutions, professional services, and technological innovations designed for the industrial energy sector.";
                  tags.push("SaaS");
                }
              } else {
                if (el.type === "stage" || el.type === "stage-panel" || el.type === "stage-podium") {
                  title = el.label || (el.type === "stage-podium" ? "Speaker Podium" : "Main Presentation Stage");
                  subtitle = "Keynotes & Panels";
                  logoText = "🎙️";
                  logoGradient = "from-purple-600 to-pink-600";
                  if (el.type === "stage-podium") {
                    description = "Speaker podium with table and chairs for VIP speakers and panelists.";
                    tags = ["Speaker Podium", "VIP Speakers", "Panelists"];
                  } else {
                    description = "Main auditorium staging hosting the ministerial opening keynotes, trans-Mediterranean pipeline legal frameworks, and green energy financing panels.";
                    tags = ["Main Stage", "Presentations", "Audio-Visual", "VIP Speakers"];
                  }
                } else if (el.type === "utility-catering" || el.type === "utility-dining") {
                  title = el.label || "Catering Hall";
                  subtitle = "Food & Refreshments";
                  logoText = "🍽️";
                  logoGradient = "from-amber-500 to-orange-600";
                  description = "Central hospitality dining hall serving organic lunch options, tea and coffee breaks, and providing seating space for informal delegate networking.";
                  tags = ["Catering", "Dining Area", "Coffee Station", "Hospitality"];
                } else if (el.type === "net-vip" || el.type === "net-speakers") {
                  title = el.label || "VIP Lounge";
                  subtitle = "Exclusive Delegate Access";
                  logoText = "👑";
                  logoGradient = "from-rose-500 to-amber-500";
                  description = "Exclusive networking lounge dedicated to speakers, sponsors, and VIP delegates, offering private meeting corners, quiet workspaces, and catering.";
                  tags = ["VIP Access", "Lounge", "Networking", "Private"];
                } else if (el.type === "utility-wc") {
                  title = "Restrooms / Facilities";
                  subtitle = "Sanitation & Care";
                  logoText = "🚻";
                  logoGradient = "from-slate-400 to-slate-600";
                  description = "Public sanitation facilities, gender-neutral restrooms, and accessible diaper-changing units maintained by the venue operations team.";
                  tags = ["Facilities", "Accessible", "Restrooms"];
                } else if (el.type === "table-chairs") {
                  title = el.label || "Seating Table";
                  subtitle = "Banquet Networking Table";
                  logoText = "👥";
                  logoGradient = "from-cyan-500 to-blue-600";
                  description = "Assigned seating table for banquet networking events, sponsor dinners, and group business discussions.";
                  tags = ["Seating", "Networking", "Group Discussion"];
                } else {
                  title = el.label || el.type.replace("utility-", "").replace("furniture-", "").replace("structural-", "").replace("access-", "").replace("stage-", "").replace("tech-", "").replace("net-", "").replace("-", " ").toUpperCase();
                  subtitle = "Venue Facility";
                  logoText = "📍";
                  logoGradient = "from-slate-500 to-slate-700";
                  description = `Interactive ${el.type.replace("-", " ")} element located within the exhibition floor plan zone.`;
                  tags = ["Map Detail", "Venue"];
                }
              }

              if (effectiveSeatId) {
                tags = attendee ? ["RESERVED"] : ["AVAILABLE"];
              } else {
                tags = el.status ? [el.status.replace("-", " ").toUpperCase()] : [];
              }

              return (
                <motion.div
                  key={el.id}
                  initial={{ x: 400, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 400, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute top-6 right-6 bottom-6 w-96 bg-white/80 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl p-6 flex flex-col gap-6 z-40 animate-fade-in pointer-events-auto"
                >
                  <button
                    onClick={() => handleSelectId([], false)}
                    className="absolute top-4 right-4 w-7 h-7 bg-slate-100/50 hover:bg-slate-200 border border-slate-200/50 rounded-full flex items-center justify-center text-slate-500 cursor-pointer font-bold transition-all text-xs"
                    title="Close Details"
                  >
                    ×
                  </button>

                  <div className="flex gap-4 items-center">
                    {effectiveSeatId ? (
                      attendee && attendee.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={attendee.image} className="w-16 h-16 rounded-2xl object-cover shadow-md border border-slate-100 bg-white shrink-0" alt={attendee.name} />
                      ) : (
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${logoGradient} flex items-center justify-center text-white shadow-md shrink-0`}>
                          <Armchair size={28} className="text-white" />
                        </div>
                      )
                    ) : exhibitor && exhibitor.logo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={exhibitor.logo} className="w-16 h-16 rounded-2xl object-cover shadow-md border border-slate-100 bg-white" alt={exhibitor.name} />
                    ) : (() => {
                      const IconComp = getElementIconComponent(el.type);
                      return (
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${logoGradient} flex items-center justify-center text-white shadow-md shrink-0`}>
                          <IconComp size={28} className="text-white" />
                        </div>
                      );
                    })()}
                    <div className="flex flex-col gap-0.5 max-w-[70%]">
                      <h4 className="text-sm font-bold text-slate-800 truncate leading-snug">{getLocalizedElementLabel(title, el.type, t)}</h4>
                      <span className="text-xs font-semibold text-indigo-650 truncate">{subtitle}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag, i) => (
                      <span 
                        key={i} 
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          tag === "available" || tag === "AVAILABLE" ? "bg-green-50 text-green-700 border border-green-105" :
                          tag === "sold" || tag === "SOLD" || tag === "SOLD OUT" ? "bg-red-50 text-red-700 border border-red-105" :
                          tag === "reserved" || tag === "RESERVED" ? "bg-orange-50 text-orange-700 border border-orange-105" :
                          tag.includes("VIP") || tag.includes("Diamond") ? "bg-rose-50 text-rose-700 border border-rose-105" :
                          "bg-indigo-50/50 text-indigo-600 border border-indigo-100/30"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>



                  {attendee && (
                    <div className="mt-1 flex flex-col gap-2 bg-emerald-50/20 border border-emerald-100/40 p-4 rounded-2xl">
                      <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">{t("floor.reservationDetails", "Reservation Details")}</span>
                      <div className="flex flex-col gap-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-500">Name</span>
                          <span className="font-bold text-slate-800">{attendee.name}</span>
                        </div>
                        {attendee.email && (
                          <div className="flex justify-between">
                            <span className="font-semibold text-slate-500">Email</span>
                            <span className="font-bold text-slate-800">{attendee.email}</span>
                          </div>
                        )}
                        {attendee.company && (
                          <div className="flex justify-between">
                            <span className="font-semibold text-slate-500">Company</span>
                            <span className="font-bold text-slate-800">{attendee.company}</span>
                          </div>
                        )}
                        {(attendee.ticketType || attendee.ticket_type) && (
                          <div className="flex justify-between">
                            <span className="font-semibold text-slate-500">Ticket Type</span>
                            <span className="font-bold text-indigo-650">{attendee.ticketType || attendee.ticket_type}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!selectedSeatId && (el.type === "table-chairs" || el.type === "stage-podium") && (
                    <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto">
                      <div className="h-px bg-slate-200/50 my-1"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {el.type === "stage-podium" ? "Speaker Podium Assignments" : "Table Assignments"}
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {Array.from({ length: el.chairsCount || (el.type === "stage-podium" ? 2 : 6) }).map((_, idx) => {
                          const assignedAttendeeId = el.assignments ? el.assignments[idx] : null;
                          const attendee = assignedAttendeeId ? attendeeMap.get(String(assignedAttendeeId)) : null;

                          return (
                            <div key={idx} className="flex items-center justify-between py-2 px-3 border border-slate-150/40 bg-white/40 rounded-xl">
                              <span className="text-[10px] font-bold text-slate-500">
                                {el.type === "stage-podium" ? `Speaker Seat ${idx + 1}` : `Seat ${idx + 1}`}
                              </span>
                              {attendee ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span className="text-xs font-bold text-slate-700">{attendee.name}</span>
                                  <span className="text-[9px] font-semibold text-slate-400">({attendee.company || "Speaker"})</span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-semibold text-slate-450 italic">Unassigned</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {exhibitor && (
                    <div className="mt-auto flex flex-col gap-2 bg-indigo-50/30 border border-indigo-100/40 p-4 rounded-2xl">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("floor.exhibitorContact", "Exhibitor Contact")}</span>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          {(exhibitor.contactPhoto || exhibitor.photo || exhibitor.avatar) ? (
                            <img
                              src={exhibitor.contactPhoto || exhibitor.photo || exhibitor.avatar}
                              alt=""
                              className="w-5 h-5 rounded-full object-cover border border-indigo-200 shrink-0"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : null}
                          <span className="font-bold text-slate-700 truncate">{exhibitor.contact || "Representative"}</span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 px-2.5 py-0.5 rounded-full shrink-0">{t("drawer.representative", "Representative")}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </main>

        {/* Right sidebar: Contextual properties panel */}
        <AnimatePresence initial={false}>
          {!isPreviewMode && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 170 }}
              className="border-l border-slate-200 bg-white p-6 flex flex-col gap-6 overflow-y-auto shrink-0 select-none overflow-hidden h-full max-h-full min-h-0"
            >
              <div className="min-w-[292px] flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-slate-800">{t("floor.propertiesSettings", "2. Properties Settings")}</h3>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{t("floor.propertiesDesc", "Configure selected element or background")}</p>
                </div>

                {selectedElement ? (
                  <div className="flex flex-col gap-5">
                    {/* Header row with Type title and Lock icon button */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-150 gap-4">
                      <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                        {selectedElement.type === "multiple" || selectedElement.type === "booth-multiple"
                          ? `MULTIPLE (${selectedIds.length} elements)`
                          : selectedElement.type.replace("-", " ").toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePropertyChange("isLocked", !selectedElement.isLocked)}
                        className={`p-2 border rounded-lg transition-all duration-200 cursor-pointer shrink-0 ${
                          selectedElement.isLocked 
                            ? "bg-amber-50 border-amber-250 text-amber-600 hover:bg-amber-100" 
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-indigo-650"
                        }`}
                        title={selectedElement.isLocked ? "Unlock Elements" : "Lock Elements"}
                      >
                        <span className="text-sm leading-none">{selectedElement.isLocked ? "🔒" : "🔓"}</span>
                      </button>
                    </div>

                    {/* Seat Assignment Panel (Shows if a seat is clicked OR a single chair is selected) */}
                    {(selectedSeatId || selectedElement?.type === "furniture-chair") && (
                      <div className="border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-3.5 bg-white shadow-sm animate-fade-in relative z-30">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Users size={14} className="text-slate-400" />
                            Seat Assignment: {(() => {
                              if (selectedElement?.type === "furniture-chair") {
                                return selectedElement.label || "Single Chair";
                              }
                              if (selectedSeatId.startsWith("chair_")) {
                                const idx = parseInt(selectedSeatId.split("_")[1]);
                                return selectedElement.type === "stage-podium" ? `Speaker Seat ${idx + 1}` : `Chair ${idx + 1}`;
                              } else {
                                const seat = selectedElement?.children?.find(c => c.id === selectedSeatId);
                                return seat ? seat.label : selectedSeatId;
                              }
                            })()}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedSeatId(null)}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-650 cursor-pointer"
                          >
                            Close
                          </button>
                        </div>

                        {/* Current Assignment */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Current Occupant</span>
                          {(() => {
                            let occupant = null;
                            if (selectedElement?.type === "furniture-chair") {
                              const assignedId = selectedElement.assigned_participant_id || selectedElement.attendeeId;
                              if (assignedId) {
                                occupant = attendeeMap.get(String(assignedId));
                              }
                            } else if (selectedSeatId && selectedSeatId.startsWith("chair_")) {
                              const idx = parseInt(selectedSeatId.split("_")[1]);
                              const assignedId = selectedElement.assignments ? selectedElement.assignments[idx] : null;
                              if (assignedId) {
                                occupant = attendeeMap.get(String(assignedId));
                              }
                            } else if (selectedSeatId && selectedElement?.children) {
                              const seat = selectedElement.children.find(c => c.id === selectedSeatId);
                              const assignedId = seat?.assigned_participant_id || seat?.attendeeId;
                              if (assignedId) {
                                occupant = attendeeMap.get(String(assignedId));
                              }
                            }

                            if (occupant) {
                              return (
                                <div className="flex items-center justify-between bg-white border border-slate-150 p-2.5 rounded-xl animate-fade-in">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-850">{occupant.name}</span>
                                    {occupant.company && (
                                      <span className="text-[10px] font-semibold text-slate-400">{occupant.company}</span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleAssignSeat(null);
                                    }}
                                    className="text-[10px] font-bold text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 transition-all cursor-pointer"
                                  >
                                    Clear
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <span className="text-xs font-bold text-slate-500 italic">Unassigned</span>
                            );
                          })()}
                        </div>

                        {/* Attendee Select Dropdown */}
                        <div className="flex flex-col gap-1.5 relative">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assign Attendee</label>
                          
                          <button
                            type="button"
                            onClick={() => setIsAssignDropdownOpen(!isAssignDropdownOpen)}
                            className="flex items-center justify-between w-full px-3 py-2 border border-slate-200 focus:outline-none rounded-xl text-xs font-semibold bg-white shadow-inner cursor-pointer hover:border-slate-350 transition-colors text-start rtl:text-right text-left"
                          >
                            <span className="text-slate-500 truncate">Select attendee...</span>
                            <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1" />
                          </button>

                          {isAssignDropdownOpen && (
                            <>
                              <div 
                                className="fixed inset-0 z-40 bg-transparent" 
                                onClick={() => {
                                  setIsAssignDropdownOpen(false);
                                  setAssignSearchQuery("");
                                }} 
                              />
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 flex flex-col p-1.5 animate-fade-in max-h-60 overflow-hidden">
                                {/* Search bar inside the dropdown */}
                                <div className="p-1 border-b border-slate-100 shrink-0">
                                  <input 
                                    type="text"
                                    placeholder="Type to search..."
                                    value={assignSearchQuery}
                                    onChange={(e) => setAssignSearchQuery(e.target.value)}
                                    className="px-2.5 py-1.5 border border-slate-200 focus:border-slate-350 focus:outline-none rounded-lg text-xs font-semibold bg-slate-50 w-full"
                                    autoFocus
                                  />
                                </div>
                                
                                {/* List of filtered options */}
                                <div className="overflow-y-auto flex-1 flex flex-col p-1 gap-0.5 mt-1">
                                  {(() => {
                                    const localAssignedIds = new Set();
                                    if (selectedElement) {
                                      if (selectedElement.assignments) {
                                        Object.values(selectedElement.assignments).forEach(id => {
                                          if (id) localAssignedIds.add(String(id));
                                        });
                                      }
                                      if (selectedElement.children) {
                                        selectedElement.children.forEach(c => {
                                          const id = c.assigned_participant_id || c.attendeeId;
                                          if (id) localAssignedIds.add(String(id));
                                        });
                                      }
                                      if (selectedElement.type === "furniture-chair") {
                                        const id = selectedElement.assigned_participant_id || selectedElement.attendeeId;
                                        if (id) localAssignedIds.add(String(id));
                                      }
                                    }

                                    let unassignedAttendees = attendees.filter(p => !localAssignedIds.has(String(p.id)));

                                    if (assignSearchQuery.trim()) {
                                      const q = assignSearchQuery.toLowerCase();
                                      unassignedAttendees = unassignedAttendees.filter(p => 
                                        (p.name && p.name.toLowerCase().includes(q)) ||
                                        (p.company && p.company.toLowerCase().includes(q)) ||
                                        (p.ticket_type && p.ticket_type.toLowerCase().includes(q))
                                      );
                                    }

                                    if (unassignedAttendees.length === 0) {
                                      return (
                                        <div className="px-3 py-2 text-xs font-semibold text-slate-400 italic text-center">
                                          No matching attendees found
                                        </div>
                                      );
                                    }

                                    // Sort speakers to the top
                                    unassignedAttendees.sort((a, b) => {
                                      const aIsSpeaker = (a.ticket_type || a.ticketType || "").toLowerCase().includes("speaker");
                                      const bIsSpeaker = (b.ticket_type || b.ticketType || "").toLowerCase().includes("speaker");
                                      if (aIsSpeaker && !bIsSpeaker) return -1;
                                      if (!aIsSpeaker && bIsSpeaker) return 1;
                                      return (a.name || "").localeCompare(b.name || "");
                                    });

                                    return unassignedAttendees.map(p => {
                                      const isSpeaker = (p.ticket_type || p.ticketType || "").toLowerCase().includes("speaker");
                                      return (
                                        <button
                                          key={p.id}
                                          type="button"
                                          onClick={() => {
                                            handleAssignSeat(p);
                                            setIsAssignDropdownOpen(false);
                                            setAssignSearchQuery("");
                                          }}
                                          className="w-full text-start rtl:text-right text-left px-3 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors flex flex-col gap-0.5 cursor-pointer"
                                        >
                                          <span className="font-bold flex items-center gap-1">
                                            {isSpeaker && <span className="text-amber-500 font-extrabold">★</span>}
                                            {p.name}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-normal truncate">
                                            {p.company ? `${p.company} • ` : ""}{p.ticket_type || "General"}
                                          </span>
                                        </button>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

              {/* Accordion Layout */}
              <div className="flex flex-col gap-4">
                {/* 1. General & Text Configuration */}
                <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleSection("identity")}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                      <Type size={14} className="text-slate-400" />
                      General & Labels
                    </span>
                    <span className="text-slate-400">
                      {expandedSections.identity ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </button>
                  {expandedSections.identity && (
                    <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                      {/* Element Name Input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Element Name</label>
                        <input 
                          type="text" 
                          value={selectedIds.length > 1 ? "" : (selectedElement.label || "")}
                          disabled={selectedElement.isLocked || selectedIds.length > 1}
                          onChange={(e) => handlePropertyChange("label", e.target.value)}
                          placeholder={selectedIds.length > 1 ? "Multiple values selected" : "Element Label..."}
                          className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold bg-white disabled:opacity-50 w-full"
                        />
                      </div>

                      {/* Element Text Size */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Text / Label Size</label>
                          <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full">
                            {selectedElement.fontSize ? `${selectedElement.fontSize} px` : "Mixed"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="8"
                            max="48"
                            step="1"
                            disabled={selectedElement.isLocked}
                            value={selectedElement.fontSize || 16}
                            onChange={(e) => handlePropertyChangeActive("fontSize", parseInt(e.target.value))}
                            onMouseUp={(e) => handlePropertyChange("fontSize", parseInt(e.target.value))}
                            onTouchEnd={(e) => handlePropertyChange("fontSize", parseInt(e.target.value))}
                            className="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                          />
                        </div>
                      </div>

                      {/* Text-specific Annotation controls */}
                      {(selectedElement.type === "text" || (selectedElements.length > 1 && selectedElements.every(el => el.type === "text"))) && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Text Content</label>
                            <textarea 
                              value={selectedIds.length > 1 ? "" : (selectedElement.label || "")}
                              disabled={selectedElement.isLocked || selectedIds.length > 1}
                              onChange={(e) => handlePropertyChange("label", e.target.value)}
                              placeholder={selectedIds.length > 1 ? "Multiple values selected" : "Text Content..."}
                              rows={3}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-650 text-xs font-semibold resize-none leading-relaxed disabled:opacity-50"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Size (px)</label>
                              <PropertyInput 
                                type="number" 
                                min={4} 
                                value={selectedElement.fontSize || ""}
                                placeholder={selectedElement.fontSize ? "" : "Mixed"}
                                onChange={(val) => handlePropertyChange("fontSize", val)}
                                className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold disabled:opacity-50"
                                disabled={selectedElement.isLocked}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Style</label>
                              <select 
                                value={selectedElement.fontStyle || ""}
                                onChange={(e) => handlePropertyChange("fontStyle", e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold bg-white disabled:opacity-50"
                                disabled={selectedElement.isLocked}
                              >
                                {!selectedElement.fontStyle && <option value="">Mixed</option>}
                                <option value="normal">Regular</option>
                                <option value="bold">Bold</option>
                                <option value="italic">Italic</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Text Alignment</label>
                            <select 
                              value={selectedElement.align || ""}
                              onChange={(e) => handlePropertyChange("align", e.target.value)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold bg-white disabled:opacity-50"
                              disabled={selectedElement.isLocked}
                            >
                              {!selectedElement.align && <option value="">Mixed</option>}
                              <option value="left">Left Align</option>
                              <option value="center">Center Align</option>
                              <option value="right">Right Align</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Booth Configuration (Conditional) */}
                {selectedElement.type.startsWith("booth") && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("booth")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Store size={14} className="text-slate-400" />
                        Booth Settings
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.booth ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.booth && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                         <div className="flex flex-col gap-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booth Type</label>
                           <select
                             value={selectedElement.type.startsWith("booth-multiple") ? "" : selectedElement.type}
                             disabled={selectedElement.isLocked}
                             onChange={(e) => {
                               const newType = e.target.value;
                               const updated = elements.map(el => {
                                 if (selectedIds.includes(el.id)) {
                                   if (el.isLocked) return el;
                                   let newLabel = el.label;
                                   if (newType === "booth-empty") {
                                     newLabel = newLabel.replace(/^(Semi-Equipped |Equipped )?Booth/, "Empty Booth");
                                   } else if (newType === "booth-semi") {
                                     newLabel = newLabel.replace(/^(Empty |Equipped )?Booth/, "Semi-Equipped Booth");
                                   } else if (newType === "booth-equipped") {
                                     newLabel = newLabel.replace(/^(Empty |Semi-Equipped )?Booth/, "Equipped Booth");
                                   }
                                   return { ...el, type: newType, label: newLabel };
                                 }
                                 return el;
                               });
                               updateElementsAndHistory(updated);
                             }}
                             className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold bg-white w-full disabled:opacity-50"
                           >
                             {!selectedElement.type.startsWith("booth-") && <option value="">Mixed</option>}
                             <option value="booth-empty">Empty Booth</option>
                             <option value="booth-semi">Semi-Equipped Booth</option>
                             <option value="booth-equipped">Equipped Booth</option>
                           </select>
                         </div>

                         <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const status = selectedElement.status || "draft";
                                let bg = "bg-slate-100 text-slate-650 border border-slate-200";
                                let label = "Draft";
                                if (status === "reserved") {
                                  bg = "bg-amber-50 text-amber-700 border border-amber-250";
                                  label = "Reserved";
                                } else if (status === "confirmed" || status === "sold") {
                                  bg = "bg-red-50 text-red-700 border border-red-250";
                                  label = "Sold";
                                } else if (status === "checked_in" || status === "checked-in") {
                                  bg = "bg-emerald-50 text-emerald-700 border border-emerald-250";
                                  label = "Checked In";
                                } else if (status === "available") {
                                  bg = "bg-emerald-50 text-emerald-700 border border-emerald-250";
                                  label = "Available";
                                }
                                return (
                                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${bg} shrink-0`}>
                                    {label}
                                  </span>
                                );
                              })()}
                              <select
                                value={selectedElement.status === "confirmed" ? "sold" : (selectedElement.status || "draft")}
                                disabled={selectedElement.isLocked}
                                onChange={(e) => handlePropertyChange("status", e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-xs font-bold bg-white disabled:opacity-50"
                              >
                                <option value="draft">Draft</option>
                                <option value="available">Available</option>
                                <option value="reserved">Reserved</option>
                                <option value="sold">Sold</option>
                                <option value="checked_in">Checked In</option>
                              </select>
                            </div>
                          </div>

                         <div className="flex flex-col gap-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exhibitor Link</label>
                           <SearchableSelect
                             value={selectedIds.length > 1 ? "" : (selectedElement.exhibitorId ? String(selectedElement.exhibitorId) : "")}
                             disabled={selectedElement.isLocked || selectedIds.length > 1}
                             onChange={(val) => handlePropertyChange("exhibitorId", val || null)}
                             placeholder={selectedIds.length > 1 ? "Multiple values selected" : "-- None --"}
                             searchPlaceholder="Search exhibitor..."
                             options={exhibitors.map(ex => ({
                               value: String(ex.id),
                               label: ex.name || "Unnamed Exhibitor",
                               description: ex.booth ? `${t("table.booth", "Booth")}: ${ex.booth}` : (ex.industry ? `${t("table.industry", "Industry")}: ${getLocalizedIndustry(ex.industry, t)}` : undefined)
                             }))}
                             isClearable={true}
                             className="w-full"
                             buttonClassName="!py-2 !px-3 !rounded-xl !text-xs !font-semibold border-slate-200"
                           />
                         </div>

                        <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wall Configurator</label>
                            <span className="text-[9px] font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full shrink-0">Toggle walls below</span>
                          </div>
                          
                          <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-150 justify-center">
                            {/* Visual Booth Mini-Map */}
                            <div className="w-20 h-20 relative bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-inner shrink-0">
                              <div className="text-[9px] font-bold text-slate-400 tracking-wider select-none uppercase">Booth</div>
                              
                              <button
                                type="button"
                                disabled={selectedElement.isLocked}
                                onClick={() => {
                                  const current = getSidesOpenState(selectedElement.openSides);
                                  handlePropertyChange("openSides", { ...current, top: !current.top });
                                }}
                                className="absolute -top-1.5 left-2 right-2 h-3 flex items-center justify-center group cursor-pointer focus:outline-none"
                                title="Toggle Top Wall"
                              >
                                <div className={`w-full h-1 rounded transition-all ${
                                  !getSidesOpenState(selectedElement.openSides).top 
                                    ? "bg-slate-800 group-hover:bg-slate-700" 
                                    : "border-t-2 border-dashed border-slate-350 group-hover:border-slate-450"
                                }`} />
                              </button>

                              <button
                                type="button"
                                disabled={selectedElement.isLocked}
                                onClick={() => {
                                  const current = getSidesOpenState(selectedElement.openSides);
                                  handlePropertyChange("openSides", { ...current, right: !current.right });
                                }}
                                className="absolute top-2 bottom-2 -right-1.5 w-3 flex items-center justify-center group cursor-pointer focus:outline-none"
                                title="Toggle Right Wall"
                              >
                                <div className={`w-1 h-full rounded transition-all ${
                                  !getSidesOpenState(selectedElement.openSides).right 
                                    ? "bg-slate-800 group-hover:bg-slate-700" 
                                    : "border-r-2 border-dashed border-slate-350 group-hover:border-slate-450"
                                }`} />
                              </button>

                              <button
                                type="button"
                                disabled={selectedElement.isLocked}
                                onClick={() => {
                                  const current = getSidesOpenState(selectedElement.openSides);
                                  handlePropertyChange("openSides", { ...current, bottom: !current.bottom });
                                }}
                                className="absolute -bottom-1.5 left-2 right-2 h-3 flex items-center justify-center group cursor-pointer focus:outline-none"
                                title="Toggle Bottom Wall"
                              >
                                <div className={`w-full h-1 rounded transition-all ${
                                  !getSidesOpenState(selectedElement.openSides).bottom 
                                    ? "bg-slate-800 group-hover:bg-slate-700" 
                                    : "border-t-2 border-dashed border-slate-350 group-hover:border-slate-450"
                                }`} />
                              </button>

                              <button
                                type="button"
                                disabled={selectedElement.isLocked}
                                onClick={() => {
                                  const current = getSidesOpenState(selectedElement.openSides);
                                  handlePropertyChange("openSides", { ...current, left: !current.left });
                                }}
                                className="absolute top-2 bottom-2 -left-1.5 w-3 flex items-center justify-center group cursor-pointer focus:outline-none"
                                title="Toggle Left Wall"
                              >
                                <div className={`w-1 h-full rounded transition-all ${
                                  !getSidesOpenState(selectedElement.openSides).left 
                                    ? "bg-slate-800 group-hover:bg-slate-700" 
                                    : "border-r-2 border-dashed border-slate-350 group-hover:border-slate-450"
                                }`} />
                              </button>
                            </div>

                            {/* Legend / Status Text */}
                            <div className="flex flex-col gap-0.5 leading-normal shrink-0">
                              <span className="text-[9px] font-bold text-slate-700">Walls Legend:</span>
                              <div className="flex items-center gap-1 text-[8px] font-semibold text-slate-500">
                                <span className="w-2 h-1 bg-slate-800 rounded"></span>
                                <span>Solid = Wall</span>
                              </div>
                              <div className="flex items-center gap-1 text-[8px] font-semibold text-slate-500">
                                <span className="w-2 border-t border-dashed border-slate-450"></span>
                                <span>Dashed = Open</span>
                              </div>
                              <div className="text-[8px] font-bold text-indigo-650 mt-1 uppercase tracking-wide">
                                {(() => {
                                  const current = getSidesOpenState(selectedElement.openSides);
                                  const opens = [];
                                  if (current.top) opens.push("Top");
                                  if (current.right) opens.push("Right");
                                  if (current.bottom) opens.push("Bottom");
                                  if (current.left) opens.push("Left");
                                  return opens.length === 0 ? "Fully Enclosed" : `Open: ${opens.join(", ")}`;
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Table & Seating Settings (Conditional) */}
                {(selectedElement.type === "table-chairs" || selectedElement.type === "stage-podium") && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("tableChairs")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Users size={14} className="text-indigo-500" />
                        {selectedElement.type === "stage-podium" ? "Podium & Speakers" : "Table & Seating"}
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.tableChairs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.tableChairs && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        {/* Chairs Count Slider */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              {selectedElement.type === "stage-podium" ? "Speaker Count" : "Chairs Amount"}
                            </label>
                            <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full">
                              {selectedElement.chairsCount !== undefined
                                ? `${selectedElement.chairsCount} ${selectedElement.type === "stage-podium" ? "speakers" : "chairs"}`
                                : (selectedElement.type === "stage-podium" ? "2 speakers" : "6 chairs")}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="1"
                              max={selectedElement.type === "stage-podium" ? 8 : 12}
                              step="1"
                              disabled={selectedElement.isLocked}
                              value={selectedElement.chairsCount !== undefined ? selectedElement.chairsCount : (selectedElement.type === "stage-podium" ? 2 : 6)}
                              onChange={(e) => handlePropertyChangeActive("chairsCount", parseInt(e.target.value))}
                              onMouseUp={(e) => handlePropertyChange("chairsCount", parseInt(e.target.value))}
                              onTouchEnd={(e) => handlePropertyChange("chairsCount", parseInt(e.target.value))}
                              className="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                            />
                          </div>
                        </div>
 
                        {/* Attendee Seat Assignment list */}
                        {selectedIds.length > 1 ? (
                          <div className="text-[11px] text-indigo-700 bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl text-center font-medium leading-relaxed">
                            Speaker/seating assignments can only be configured for individual elements.
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {selectedElement.type === "stage-podium" ? "Speaker Assignments" : "Seat Assignments"}
                              </label>
                              <span className="text-[9px] font-bold text-slate-400 tracking-wider">
                                {selectedElement.type === "stage-podium" ? "Select speaker per seat" : "Select attendee per chair"}
                              </span>
                            </div>
                            <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                              {(() => {
                                const localAssignedIds = new Set();
                                if (selectedElement && selectedElement.assignments) {
                                  Object.values(selectedElement.assignments).forEach(id => {
                                    if (id) localAssignedIds.add(String(id));
                                  });
                                }
 
                                const sortedAttendees = [...attendees].sort((a, b) => {
                                  const aIsSpeaker = (a.ticket_type || a.ticketType || "").toLowerCase().includes("speaker");
                                  const bIsSpeaker = (b.ticket_type || b.ticketType || "").toLowerCase().includes("speaker");
                                  if (aIsSpeaker && !bIsSpeaker) return -1;
                                  if (!aIsSpeaker && bIsSpeaker) return 1;
                                  return (a.name || "").localeCompare(b.name || "");
                                });
 
                                return Array.from({ length: selectedElement.chairsCount !== undefined ? selectedElement.chairsCount : (selectedElement.type === "stage-podium" ? 2 : 6) }).map((_, idx) => {
                                  const currentAssignment = selectedElement.assignments ? selectedElement.assignments[idx] : "";
                                  return (
                                    <div key={idx} className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-slate-500 w-14 shrink-0">
                                        {selectedElement.type === "stage-podium" ? `Speaker ${idx + 1}:` : `Chair ${idx + 1}:`}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <SearchableSelect
                                          value={currentAssignment ? String(currentAssignment) : ""}
                                          disabled={selectedElement.isLocked}
                                          onChange={(val) => {
                                            const newAssignments = { ...(selectedElement.assignments || {}) };
                                            if (val) {
                                              newAssignments[idx] = val;
                                            } else {
                                              delete newAssignments[idx];
                                            }
                                            handlePropertyChange("assignments", newAssignments);
                                          }}
                                          placeholder="-- Unassigned --"
                                          searchPlaceholder="Search attendee or speaker..."
                                          options={sortedAttendees
                                            .filter(att => !(localAssignedIds.has(String(att.id)) && String(att.id) !== String(currentAssignment)))
                                            .map(att => {
                                              const isSpeaker = (att.ticket_type || att.ticketType || "").toLowerCase().includes("speaker");
                                              return {
                                                value: String(att.id),
                                                label: `${isSpeaker ? "★ " : ""}${att.name}`,
                                                description: att.company || (isSpeaker ? "Speaker" : (att.ticketType || att.ticket_type)),
                                                badge: isSpeaker ? "Speaker" : undefined
                                              };
                                            })
                                          }
                                          isClearable={true}
                                          className="w-full"
                                          buttonClassName="!py-1.5 !px-2.5 !rounded-xl !text-xs !font-semibold border-slate-200"
                                        />
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {/* Shape / Polygon Settings for Triangle (Conditional) */}
                {selectedElement.type === "triangle" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("tableChairs")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Triangle size={14} className="text-indigo-500" />
                        Shape Configuration
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.tableChairs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.tableChairs && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        {/* Sides Slider */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Number of Sides</label>
                            <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full">
                              {selectedElement.sides !== undefined ? `${selectedElement.sides} sides` : "3 (Triangle)"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="3"
                              max="10"
                              step="1"
                              disabled={selectedElement.isLocked}
                              value={selectedElement.sides !== undefined ? selectedElement.sides : 3}
                              onChange={(e) => handlePropertyChangeActive("sides", parseInt(e.target.value))}
                              onMouseUp={(e) => handlePropertyChange("sides", parseInt(e.target.value))}
                              onTouchEnd={(e) => handlePropertyChange("sides", parseInt(e.target.value))}
                              className="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Configuration for Arrow Route */}
                {selectedElement.type === "arrow" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("arrowSettings")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <ArrowRight size={14} className="text-indigo-500" />
                        Arrow Route Settings
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.arrowSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.arrowSettings && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                          Create custom routes by adding points. Drag point handles directly on the canvas to orient the arrow segments.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const nextPoints = [...(selectedElement.points || [10, 30, 90, 30])];
                              const len = nextPoints.length;
                              const lastX = nextPoints[len - 2];
                              const lastY = nextPoints[len - 1];
                              // Add a point offset to the right by default
                              nextPoints.push(lastX + 40, lastY);
                              
                              const updated = elements.map(el => {
                                if (el.id === selectedElement.id) {
                                  return { 
                                    ...el, 
                                    points: nextPoints,
                                    width: Math.max(el.width, lastX + 60),
                                    height: Math.max(el.height, lastY + 45)
                                  };
                                }
                                return el;
                              });
                              commitHistoryState(updated);
                            }}
                            disabled={selectedElement.isLocked}
                            className="py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 rounded-xl text-indigo-750 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-150 disabled:opacity-50"
                          >
                            <Plus size={14} />
                            Add Point
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextPoints = [...(selectedElement.points || [10, 30, 90, 30])];
                              if (nextPoints.length > 4) {
                                nextPoints.splice(nextPoints.length - 2, 2);
                                const updated = elements.map(el => {
                                  if (el.id === selectedElement.id) {
                                    return { ...el, points: nextPoints };
                                  }
                                  return el;
                                });
                                commitHistoryState(updated);
                              }
                            }}
                            disabled={selectedElement.isLocked || (selectedElement.points || []).length <= 4}
                            className="py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-150 rounded-xl text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-150 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            Remove Point
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = elements.map(el => {
                              if (el.id === selectedElement.id) {
                                return { ...el, points: [10, 30, 90, 30], width: 100, height: 60 };
                              }
                              return el;
                            });
                            commitHistoryState(updated);
                          }}
                          disabled={selectedElement.isLocked}
                          className="w-full py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-650 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-150"
                        >
                          <RotateCcw size={13} />
                          Reset Arrow
                        </button>

                        {/* Arrow Thickness / Stroke Width Slider */}
                        <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100 mt-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Line Thickness</label>
                            <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full">
                              {selectedElement.strokeWidth || 3} px
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="1"
                              max="15"
                              step="1"
                              disabled={selectedElement.isLocked}
                              value={selectedElement.strokeWidth || 3}
                              onChange={(e) => handlePropertyChangeActive("strokeWidth", parseInt(e.target.value))}
                              onMouseUp={(e) => handlePropertyChange("strokeWidth", parseInt(e.target.value))}
                              onTouchEnd={(e) => handlePropertyChange("strokeWidth", parseInt(e.target.value))}
                              className="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Configuration for Auditorium Block */}
                {selectedElement.type === "auditorium-block" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("customSettings")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Users size={14} className="text-indigo-500" />
                        Auditorium Seating
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.customSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.customSettings && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rows</label>
                            <PropertyInput
                              type="number"
                              min={2}
                              max={50}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.rows ?? 10}
                              onChange={(val) => handlePropertyChange("rows", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seats Per Row</label>
                            <PropertyInput
                              type="number"
                              min={2}
                              max={40}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.seatsPerRow ?? 15}
                              onChange={(val) => handlePropertyChange("seatsPerRow", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Row Spacing (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.1"
                              min={0.5}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.rowSpacing ?? 1.0}
                              onChange={(val) => handlePropertyChange("rowSpacing", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seat Spacing (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.1"
                              min={0.3}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.seatSpacing ?? 0.6}
                              onChange={(val) => handlePropertyChange("seatSpacing", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seat Width (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.05"
                              min={0.2}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.seatWidth ?? 0.5}
                              onChange={(val) => handlePropertyChange("seatWidth", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seat Height (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.05"
                              min={0.2}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.seatDepth ?? 0.5}
                              onChange={(val) => handlePropertyChange("seatDepth", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60 mt-1">
                          <span className="text-xs font-bold text-slate-700">Curved Layout</span>
                          <input
                            type="checkbox"
                            checked={!!selectedElement.curved}
                            disabled={selectedElement.isLocked}
                            onChange={(e) => handlePropertyChange("curved", e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>

                        {selectedElement.curved && (
                          <div className="flex flex-col gap-1.5 animate-fade-in">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Arc Radius (m)</label>
                            <PropertyInput
                              type="number"
                              min={5}
                              max={200}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.arcRadius ?? 20}
                              onChange={(val) => handlePropertyChange("arcRadius", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Configuration for Theater in the Round */}
                {selectedElement.type === "theater-in-the-round" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("customSettings")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Users size={14} className="text-indigo-500" />
                        Theater Settings
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.customSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.customSettings && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Concentric Rings</label>
                            <PropertyInput
                              type="number"
                              min={1}
                              max={20}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.rings ?? 3}
                              onChange={(val) => handlePropertyChange("rings", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stage Radius (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.5"
                              min={1}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.stageRadius ?? 5.0}
                              onChange={(val) => handlePropertyChange("stageRadius", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seats per Ring (0: auto)</label>
                            <PropertyInput
                              type="number"
                              min={0}
                              max={100}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.seatsPerRing ?? 0}
                              onChange={(val) => handlePropertyChange("seatsPerRing", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seat Spacing (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.1"
                              min={0.4}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.seatSpacing ?? 0.8}
                              onChange={(val) => handlePropertyChange("seatSpacing", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ring Spacing (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.1"
                              min={0.8}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.ringSpacing ?? 1.5}
                              onChange={(val) => handlePropertyChange("ringSpacing", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seat Width (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.05"
                              min={0.2}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.seatWidth ?? 0.5}
                              onChange={(val) => handlePropertyChange("seatWidth", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seat Height (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.05"
                              min={0.2}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.seatDepth ?? 0.5}
                              onChange={(val) => handlePropertyChange("seatDepth", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Configuration for Classroom Rows */}
                {selectedElement.type === "classroom-rows" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("customSettings")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Users size={14} className="text-indigo-500" />
                        Classroom Settings
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.customSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.customSettings && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rows</label>
                            <PropertyInput
                              type="number"
                              min={1}
                              max={20}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.rows ?? 3}
                              onChange={(val) => handlePropertyChange("rows", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tables Per Row</label>
                            <PropertyInput
                              type="number"
                              min={1}
                              max={20}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.tablesPerRow ?? 4}
                              onChange={(val) => handlePropertyChange("tablesPerRow", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Table Width (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.1"
                              min={1.0}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.tableWidth ?? 1.8}
                              onChange={(val) => handlePropertyChange("tableWidth", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Table Depth (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.1"
                              min={0.4}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.tableDepth ?? 0.6}
                              onChange={(val) => handlePropertyChange("tableDepth", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chairs Per Table</label>
                            <PropertyInput
                              type="number"
                              min={1}
                              max={6}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.chairsPerTable ?? 2}
                              onChange={(val) => handlePropertyChange("chairsPerTable", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facing Direction</label>
                            <select
                              value={selectedElement.facingDirection ?? "north"}
                              disabled={selectedElement.isLocked}
                              onChange={(e) => handlePropertyChange("facingDirection", e.target.value)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white focus:outline-none"
                            >
                              <option value="north">North (Facing Stage)</option>
                              <option value="south">South</option>
                              <option value="east">East</option>
                              <option value="west">West</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Row Spacing (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.1"
                              min={1.0}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.rowSpacing ?? 2.0}
                              onChange={(val) => handlePropertyChange("rowSpacing", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Table Spacing (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.1"
                              min={0.2}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.tableSpacing ?? 1.0}
                              onChange={(val) => handlePropertyChange("tableSpacing", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Configuration for Reserved Seat Block */}
                {selectedElement.type === "reserved-seat-block" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("customSettings")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Users size={14} className="text-indigo-500" />
                        Seats Settings
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.customSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.customSettings && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seats Label</label>
                          <input
                            type="text"
                            disabled={selectedElement.isLocked}
                            value={selectedElement.label ?? "Seats"}
                            onChange={(e) => handlePropertyChange("label", e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Columns</label>
                            <PropertyInput
                              type="number"
                              min={1}
                              max={50}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.seatCount ?? 2}
                              onChange={(val) => handlePropertyChange("seatCount", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-855 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rows</label>
                            <PropertyInput
                              type="number"
                              min={1}
                              max={20}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.rows ?? 3}
                              onChange={(val) => handlePropertyChange("rows", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-855 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seat Width (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.05"
                              min={0.2}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.seatWidth ?? 0.5}
                              onChange={(val) => handlePropertyChange("seatWidth", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-855 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seat Height (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.05"
                              min={0.2}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.seatDepth ?? 0.5}
                              onChange={(val) => handlePropertyChange("seatDepth", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-855 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Row Spacing (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.1"
                              min={0.5}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.rowSpacing ?? 1.5}
                              onChange={(val) => handlePropertyChange("rowSpacing", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-855 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Column Spacing (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.1"
                              min={0.2}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.seatSpacing ?? 0.8}
                              onChange={(val) => handlePropertyChange("seatSpacing", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-855 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        </div>


                      </div>
                    )}
                  </div>
                )}

                {/* Custom Configuration for T-Shaped Runway */}
                {selectedElement.type === "runway-t" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("customSettings")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Zap size={14} className="text-indigo-500" />
                        Runway Configuration
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.customSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.customSettings && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stage Width (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.5"
                              min={1}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.stageWidth ?? 8}
                              onChange={(val) => handlePropertyChange("stageWidth", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stage Depth (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.5"
                              min={1}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.stageDepth ?? 4}
                              onChange={(val) => handlePropertyChange("stageDepth", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Runway Length (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.5"
                              min={1}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.runwayLength ?? 6}
                              onChange={(val) => handlePropertyChange("runwayLength", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Runway Width (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.5"
                              min={0.5}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.runwayWidth ?? 2}
                              onChange={(val) => handlePropertyChange("runwayWidth", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Configuration for Broadcast Studio */}
                {selectedElement.type === "broadcast-studio" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("customSettings")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Zap size={14} className="text-indigo-500" />
                        Studio Settings
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.customSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.customSettings && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Camera Count</label>
                          <PropertyInput
                            type="number"
                            min={1}
                            max={10}
                            disabled={selectedElement.isLocked}
                            value={selectedElement.cameraCount ?? 3}
                            onChange={(val) => handlePropertyChange("cameraCount", val)}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Configuration for Lighting Rig */}
                {selectedElement.type === "lighting-rig" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("customSettings")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Zap size={14} className="text-indigo-500" />
                        Lighting Truss Settings
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.customSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.customSettings && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Truss Length (m)</label>
                            <PropertyInput
                              type="number"
                              step="0.5"
                              min={1}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.trussLength ?? 10}
                              onChange={(val) => handlePropertyChange("trussLength", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drop Markers Count</label>
                            <PropertyInput
                              type="number"
                              min={1}
                              max={50}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.dropCount ?? 5}
                              onChange={(val) => handlePropertyChange("dropCount", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Configuration for Parking Zone */}
                {selectedElement.type === "parking-zone" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("customSettings")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Square size={14} className="text-indigo-500" />
                        Parking Zone Settings
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.customSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.customSettings && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bay Count</label>
                            <PropertyInput
                              type="number"
                              min={1}
                              max={100}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.bayCount ?? 10}
                              onChange={(val) => handlePropertyChange("bayCount", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reserved Bays</label>
                            <PropertyInput
                              type="number"
                              min={0}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.reservedCount ?? 2}
                              onChange={(val) => handlePropertyChange("reservedCount", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Configuration for Food Truck Bay */}
                {selectedElement.type === "food-truck" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("customSettings")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Utensils size={14} className="text-indigo-500" />
                        Food Truck Info
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.customSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.customSettings && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendor Name</label>
                          <input
                            type="text"
                            disabled={selectedElement.isLocked}
                            value={selectedElement.vendorName ?? ""}
                            onChange={(e) => handlePropertyChange("vendorName", e.target.value)}
                            placeholder="e.g. Gourmet Tacos"
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuisine / Tag</label>
                          <input
                            type="text"
                            disabled={selectedElement.isLocked}
                            value={selectedElement.cuisine ?? ""}
                            onChange={(e) => handlePropertyChange("cuisine", e.target.value)}
                            placeholder="e.g. Mexican Street Food"
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Configuration for Drinks Station */}
                {selectedElement.type === "drinks-bar" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("customSettings")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Utensils size={14} className="text-indigo-500" />
                        Bar Settings
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.customSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.customSettings && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bar Type</label>
                          <select
                            value={selectedElement.subType ?? "Full Bar"}
                            disabled={selectedElement.isLocked}
                            onChange={(e) => handlePropertyChange("subType", e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white focus:outline-none"
                          >
                            <option value="Full Bar">Full Bar</option>
                            <option value="Mocktail">Mocktail Bar</option>
                            <option value="Juice">Juice Station</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Configuration for Buffet Line */}
                {selectedElement.type === "buffet-line" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("customSettings")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Utensils size={14} className="text-indigo-500" />
                        Buffet Configuration
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.customSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.customSettings && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Length (m)</label>
                          <PropertyInput
                            type="number"
                            step="0.5"
                            min={1}
                            disabled={selectedElement.isLocked}
                            value={selectedElement.length ?? 5}
                            onChange={(val) => handlePropertyChange("length", val)}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60 mt-1">
                          <span className="text-xs font-bold text-slate-700 font-semibold">Curved Shape</span>
                          <input
                            type="checkbox"
                            checked={!!selectedElement.curved}
                            disabled={selectedElement.isLocked}
                            onChange={(e) => handlePropertyChange("curved", e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Configuration for CCTV Camera */}
                {selectedElement.type === "cctv-camera" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("customSettings")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Zap size={14} className="text-indigo-500" />
                        CCTV Camera Settings
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.customSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.customSettings && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-semibold">Coverage Angle (°)</label>
                          <PropertyInput
                            type="number"
                            min={10}
                            max={360}
                            disabled={selectedElement.isLocked}
                            value={selectedElement.coverageAngle ?? 90}
                            onChange={(val) => handlePropertyChange("coverageAngle", val)}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-semibold">Range (m)</label>
                          <PropertyInput
                            type="number"
                            min={1}
                            max={50}
                            disabled={selectedElement.isLocked}
                            value={selectedElement.range ?? 10}
                            onChange={(val) => handlePropertyChange("range", val)}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Configuration for LED / AV Screen */}
                {selectedElement.type === "screen" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("customSettings")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Zap size={14} className="text-indigo-500" />
                        AV Configuration
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.customSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.customSettings && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aspect Ratio Preset</label>
                          <select
                            value={selectedElement.aspectRatio ?? "Custom"}
                            disabled={selectedElement.isLocked}
                            onChange={(e) => handlePropertyChange("aspectRatio", e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white focus:outline-none"
                          >
                            <option value="Custom">Custom (Free Resize)</option>
                            <option value="16:9">16:9 widescreenPreset</option>
                            <option value="4:3">4:3 standardPreset</option>
                            <option value="21:9">21:9 ultra-widePreset</option>
                          </select>
                        </div>
                        
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1 select-text">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Resolution Indicator</span>
                          <span className="text-xs font-bold text-slate-700">
                            {(() => {
                              const ratio = selectedElement.aspectRatio ?? "Custom";
                              if (ratio === "16:9") return "1920×1080 (HD) equivalent";
                              if (ratio === "4:3") return "1024×768 (SD) equivalent";
                              if (ratio === "21:9") return "2560×1080 (UW) equivalent";
                              return "Custom size / free aspect ratio";
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Configuration for Scheduled Meeting Room */}
                {selectedElement.type === "meeting-room" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("customSettings")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Users size={14} className="text-indigo-500" />
                        Meeting Room Settings
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.customSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.customSettings && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Room Name</label>
                          <input
                            type="text"
                            disabled={selectedElement.isLocked}
                            value={selectedElement.roomName ?? ""}
                            onChange={(e) => handlePropertyChange("roomName", e.target.value)}
                            placeholder="e.g. Boardroom A"
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Capacity (Pax)</label>
                          <PropertyInput
                            type="number"
                            min={1}
                            disabled={selectedElement.isLocked}
                            value={selectedElement.capacity ?? 10}
                            onChange={(val) => handlePropertyChange("capacity", val)}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                          />
                        </div>

                        <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Linked Schedule</span>
                            <button
                              type="button"
                              disabled={selectedElement.isLocked}
                              onClick={() => {
                                const currentSlots = selectedElement.timeSlots ? [...selectedElement.timeSlots] : [];
                                const newSlot = {
                                  id: `slot-${Date.now()}`,
                                  start: "09:00",
                                  end: "10:00",
                                  title: "New Meeting",
                                  attendees: []
                                };
                                handlePropertyChange("timeSlots", [...currentSlots, newSlot]);
                              }}
                              className="text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 cursor-pointer"
                            >
                              + Add Slot
                            </button>
                          </div>
                          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
                            {(!selectedElement.timeSlots || selectedElement.timeSlots.length === 0) ? (
                              <div className="text-[10px] text-slate-450 italic text-center py-2">No meetings scheduled.</div>
                            ) : (
                              selectedElement.timeSlots.map((slot, index) => (
                                <div key={slot.id || index} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2 relative group/slot">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const filtered = selectedElement.timeSlots.filter((_, idx) => idx !== index);
                                      handlePropertyChange("timeSlots", filtered);
                                    }}
                                    className="absolute top-2 right-2 text-rose-500 hover:bg-rose-55 hover:text-rose-650 p-1 rounded-lg text-xs leading-none opacity-0 group-hover/slot:opacity-100 transition-opacity duration-200 cursor-pointer"
                                    title="Delete slot"
                                  >
                                    ✕
                                  </button>
                                  <div className="flex gap-1.5 items-center">
                                    <input
                                      type="text"
                                      disabled={selectedElement.isLocked}
                                      value={slot.title || ""}
                                      onChange={(e) => {
                                        const updated = [...selectedElement.timeSlots];
                                        updated[index] = { ...updated[index], title: e.target.value };
                                        handlePropertyChange("timeSlots", updated);
                                      }}
                                      placeholder="Meeting Title..."
                                      className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[8px] font-bold text-slate-400 uppercase">Start</span>
                                      <input
                                        type="time"
                                        disabled={selectedElement.isLocked}
                                        value={slot.start || "09:00"}
                                        onChange={(e) => {
                                          const updated = [...selectedElement.timeSlots];
                                          updated[index] = { ...updated[index], start: e.target.value };
                                          handlePropertyChange("timeSlots", updated);
                                        }}
                                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                                      />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[8px] font-bold text-slate-400 uppercase">End</span>
                                      <input
                                        type="time"
                                        disabled={selectedElement.isLocked}
                                        value={slot.end || "10:00"}
                                        onChange={(e) => {
                                          const updated = [...selectedElement.timeSlots];
                                          updated[index] = { ...updated[index], end: e.target.value };
                                          handlePropertyChange("timeSlots", updated);
                                        }}
                                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Configuration for Networking Zone */}
                {selectedElement.type === "net-zone" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("customSettings")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Users size={14} className="text-indigo-500" />
                        Networking Settings
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.customSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.customSettings && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-semibold">Capacity (Pax)</label>
                          <PropertyInput
                            type="number"
                            min={1}
                            disabled={selectedElement.isLocked}
                            value={selectedElement.capacity ?? 20}
                            onChange={(val) => handlePropertyChange("capacity", val)}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Furniture Style</label>
                          <select
                            value={selectedElement.furnitureStyle ?? "cocktail"}
                            disabled={selectedElement.isLocked}
                            onChange={(e) => handlePropertyChange("furnitureStyle", e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-855 text-xs font-semibold bg-white focus:outline-none"
                          >
                            <option value="cocktail">Cocktail (high tables)</option>
                            <option value="lounge">Lounge (sofas & chairs)</option>
                            <option value="open">Open (standing space)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Configuration for Pitch Zone */}
                {selectedElement.type === "pitch-zone" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("customSettings")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Store size={14} className="text-indigo-500" />
                        Pitch Zone Settings
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.customSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.customSettings && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-semibold">Pod Count</label>
                            <PropertyInput
                              type="number"
                              min={1}
                              max={30}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.podCount ?? 4}
                              onChange={(val) => handlePropertyChange("podCount", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-semibold">Pods Per Row</label>
                            <PropertyInput
                              type="number"
                              min={1}
                              max={10}
                              disabled={selectedElement.isLocked}
                              value={selectedElement.podsPerRow ?? 2}
                              onChange={(val) => handlePropertyChange("podsPerRow", val)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold bg-white w-full"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pod Label Prefix</label>
                          <input
                            type="text"
                            disabled={selectedElement.isLocked}
                            value={selectedElement.podLabel ?? "Pod A"}
                            onChange={(e) => handlePropertyChange("podLabel", e.target.value)}
                            placeholder="e.g. Pod A"
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white focus:outline-none"
                          />
                        </div>

                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pod Exhibitor Link</span>
                          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
                            {Array.from({ length: selectedElement.podCount ?? 4 }).map((_, idx) => {
                              const podKey = `pod_${idx}`;
                              const currentEx = selectedElement.podAssignments ? selectedElement.podAssignments[podKey] : "";
                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="text-[10px] font-semibold text-slate-500 w-16 shrink-0">
                                    {(selectedElement.podLabel ?? "Pod A") + (idx + 1)}:
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <SearchableSelect
                                      value={currentEx ? String(currentEx) : ""}
                                      disabled={selectedElement.isLocked}
                                      onChange={(val) => {
                                        const updatedAssignments = { ...(selectedElement.podAssignments || {}) };
                                        if (val) {
                                          updatedAssignments[podKey] = val;
                                        } else {
                                          delete updatedAssignments[podKey];
                                        }
                                        handlePropertyChange("podAssignments", updatedAssignments);
                                      }}
                                      placeholder="-- Unassigned --"
                                      searchPlaceholder="Search exhibitor..."
                                      options={exhibitors.map(ex => ({
                                        value: String(ex.id),
                                        label: ex.name || "Unnamed Exhibitor",
                                        description: ex.booth ? `${t("table.booth", "Booth")}: ${ex.booth}` : (ex.industry ? `${t("table.industry", "Industry")}: ${getLocalizedIndustry(ex.industry, t)}` : undefined)
                                      }))}
                                      isClearable={true}
                                      className="w-full"
                                      buttonClassName="!py-1.5 !px-2.5 !rounded-xl !text-xs !font-semibold border-slate-200"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Configuration for Zone Overlay */}
                {selectedElement.type === "zone-overlay" && (
                  <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSection("customSettings")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                        <Square size={14} className="text-indigo-500" />
                        Zone Overlay Settings
                      </span>
                      <span className="text-slate-400">
                        {expandedSections.customSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {expandedSections.customSettings && (
                      <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-semibold">Zone Title / Label</label>
                          <input
                            type="text"
                            disabled={selectedElement.isLocked}
                            value={selectedElement.label ?? "Zone Area"}
                            onChange={(e) => handlePropertyChange("label", e.target.value)}
                            placeholder="e.g. Hall A, Catering"
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold bg-white focus:outline-none"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fill Opacity</label>
                            <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full">
                              {Math.round((selectedElement.opacity ?? 0.2) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.05"
                            max="0.9"
                            step="0.05"
                            disabled={selectedElement.isLocked}
                            value={selectedElement.opacity ?? 0.2}
                            onChange={(e) => handlePropertyChangeActive("opacity", parseFloat(e.target.value))}
                            onMouseUp={(e) => handlePropertyChange("opacity", parseFloat(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Border Style</label>
                          <select
                            value={selectedElement.borderStyle ?? "dashed"}
                            disabled={selectedElement.isLocked}
                            onChange={(e) => handlePropertyChange("borderStyle", e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-855 text-xs font-semibold bg-white focus:outline-none"
                          >
                            <option value="dashed">Dashed Border</option>
                            <option value="solid">Solid Border</option>
                            <option value="none">No Border</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Geometry & Position */}
                <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleSection("geometry")}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                      <Square size={14} className="text-slate-400" />
                      Geometry & Layout
                    </span>
                    <span className="text-slate-400">
                      {expandedSections.geometry ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </button>
                  {expandedSections.geometry && (
                    <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                      {/* Dimensions in Meters */}
                      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-150">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Width (m)</label>
                          <PropertyInput 
                            type="number" 
                            step="0.1"
                            min={0.5}
                            disabled={selectedElement.isLocked}
                            value={selectedElement.width ? parseFloat((selectedElement.width / 20).toFixed(2)) : ""}
                            placeholder={selectedElement.width ? "" : "Mixed"}
                            onChange={(val) => handlePropertyChange("width", Math.round(val * 20))}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold bg-white disabled:opacity-50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Height (m)</label>
                          <PropertyInput 
                            type="number" 
                            step="0.1"
                            min={0.5}
                            disabled={selectedElement.isLocked}
                            value={selectedElement.height ? parseFloat((selectedElement.height / 20).toFixed(2)) : ""}
                            placeholder={selectedElement.height ? "" : "Mixed"}
                            onChange={(val) => handlePropertyChange("height", Math.round(val * 20))}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold bg-white disabled:opacity-50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 col-span-2 border-t border-slate-200/50 pt-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Surface Area</label>
                          <div className="px-3 py-2 border border-slate-200 rounded-xl text-slate-650 text-xs font-bold bg-slate-100/70 select-text">
                            {selectedElement.width && selectedElement.height 
                             ? `${((selectedElement.width / 20) * (selectedElement.height / 20)).toFixed(2)} m²` 
                             : "Mixed"}
                          </div>
                        </div>
                      </div>

                      {/* Corner Radius for Square Shape */}
                      {selectedElement.type === "square" && (
                        <div className="flex flex-col gap-1.5 p-3 bg-slate-50/50 rounded-2xl border border-slate-150">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-semibold">Corner Radius (m)</label>
                            <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full font-semibold">
                              {((selectedElement.cornerRadius || 0) / 20).toFixed(1)}m
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="40"
                            step="1"
                            disabled={selectedElement.isLocked}
                            value={selectedElement.cornerRadius || 0}
                            onChange={(e) => handlePropertyChangeActive("cornerRadius", parseInt(e.target.value))}
                            onMouseUp={(e) => handlePropertyChange("cornerRadius", parseInt(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                          />
                        </div>
                      )}

                      {/* Position Coordinates in Meters */}
                      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-150">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">X Position (m)</label>
                          <PropertyInput 
                            type="number" 
                            step="0.5"
                            disabled={selectedElement.isLocked || selectedIds.length > 1}
                            value={selectedIds.length > 1 ? "" : parseFloat((selectedElement.x / 20).toFixed(2))}
                            placeholder={selectedIds.length > 1 ? "Multiple values" : ""}
                            onChange={(val) => handlePropertyChange("x", Math.round(val * 20))}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold bg-white disabled:opacity-50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Y Position (m)</label>
                          <PropertyInput 
                            type="number" 
                            step="0.5"
                            disabled={selectedElement.isLocked || selectedIds.length > 1}
                            value={selectedIds.length > 1 ? "" : parseFloat((selectedElement.y / 20).toFixed(2))}
                            placeholder={selectedIds.length > 1 ? "Multiple values" : ""}
                            onChange={(val) => handlePropertyChange("y", Math.round(val * 20))}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold bg-white disabled:opacity-50"
                          />
                        </div>
                      </div>

                      {/* Rotation control */}
                      <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-150">
                        <div className="flex flex-col gap-1.5 col-span-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rotation (°)</label>
                          <PropertyInput 
                            type="number" 
                            disabled={selectedElement.isLocked}
                            value={selectedElement.rotation !== undefined ? selectedElement.rotation : ""}
                            placeholder={selectedElement.rotation !== undefined ? "" : "Mixed"}
                            onChange={(val) => handlePropertyChange("rotation", val)}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold bg-white disabled:opacity-50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 col-span-1 justify-end">
                          <button
                            onClick={() => handlePropertyChange("rotation", ((selectedElement.rotation || 0) + 90) % 360)}
                            disabled={selectedElement.isLocked}
                            className="py-2 bg-white border border-slate-200 hover:border-indigo-150 hover:text-indigo-650 rounded-xl text-slate-650 font-bold text-xs flex items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
                            title="Rotate 90 degrees"
                          >
                            +90°
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Appearance & Colors */}
                <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleSection("appearance")}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                      <Sparkles size={14} className="text-slate-400" />
                      Appearance & Colors
                    </span>
                    <span className="text-slate-400">
                      {expandedSections.appearance ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </button>
                  {expandedSections.appearance && (
                    <div className="p-4 flex flex-col gap-3.5 bg-white animate-fade-in">
                      {/* FILL COLOR ROW */}
                      <div className="flex flex-col border border-slate-150 rounded-xl bg-slate-50/30 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setActiveColorPicker(activeColorPicker === "fill" ? null : "fill")}
                          className="w-full flex items-center justify-between px-3 py-2 bg-white text-xs font-semibold text-slate-755 hover:bg-slate-50 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border border-slate-250 inline-block shadow-sm" style={{ backgroundColor: selectedElement.fillColor || selectedElement.color || "#6366f1" }} />
                            Fill Color
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {selectedElement.fillColor || selectedElement.color || "#6366f1"}
                          </span>
                        </button>
                        {activeColorPicker === "fill" && (
                          <CustomGoogleColorPicker
                            value={selectedElement.fillColor || selectedElement.color || "#6366f1"}
                            onChange={(val) => handlePropertyChangeActive("fillColor", val)}
                            onBlur={(val) => handlePropertyChange("fillColor", val)}
                            disabled={selectedElement.isLocked}
                          />
                        )}
                      </div>

                      {/* STROKE COLOR ROW */}
                      <div className="flex flex-col border border-slate-150 rounded-xl bg-slate-50/30 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setActiveColorPicker(activeColorPicker === "stroke" ? null : "stroke")}
                          className="w-full flex items-center justify-between px-3 py-2 bg-white text-xs font-semibold text-slate-755 hover:bg-slate-50 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border border-slate-250 inline-block shadow-sm" style={{ backgroundColor: selectedElement.strokeColor || "#64748b" }} />
                            Stroke Color
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {selectedElement.strokeColor || "#64748b"}
                          </span>
                        </button>
                        {activeColorPicker === "stroke" && (
                          <CustomGoogleColorPicker
                            value={selectedElement.strokeColor || "#64748b"}
                            onChange={(val) => handlePropertyChangeActive("strokeColor", val)}
                            onBlur={(val) => handlePropertyChange("strokeColor", val)}
                            disabled={selectedElement.isLocked}
                          />
                        )}
                      </div>

                      {/* TEXT COLOR ROW */}
                      {(() => {
                        const defaultTextColor = selectedElement.type === "corridor" ? "#94a3b8" : "#1e293b";
                        const currentTextColor = selectedElement.textColor || defaultTextColor;
                        return (
                          <div className="flex flex-col border border-slate-150 rounded-xl bg-slate-50/30 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setActiveColorPicker(activeColorPicker === "text" ? null : "text")}
                              className="w-full flex items-center justify-between px-3 py-2 bg-white text-xs font-semibold text-slate-755 hover:bg-slate-50 transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full border border-slate-250 inline-block shadow-sm" style={{ backgroundColor: currentTextColor }} />
                                Text / Label Color
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 uppercase">
                                {currentTextColor}
                              </span>
                            </button>
                            {activeColorPicker === "text" && (
                              <CustomGoogleColorPicker
                                value={currentTextColor}
                                onChange={(val) => handlePropertyChangeActive("textColor", val)}
                                onBlur={(val) => handlePropertyChange("textColor", val)}
                                disabled={selectedElement.isLocked}
                              />
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* 5. Layout & Order */}
                <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleSection("layout")}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-650">
                      <Layers size={14} className="text-slate-400" />
                      Arrange & Order
                    </span>
                    <span className="text-slate-400">
                      {expandedSections.layout ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </button>
                  {expandedSections.layout && (
                    <div className="p-4 flex flex-col gap-4 bg-white animate-fade-in">
                      {/* Align Element */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Align to Canvas</label>
                        <div className="grid grid-cols-6 gap-1">
                          {[
                            { dir: "left",     title: "Align Left",          svg: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><line x1="3" y1="3" x2="3" y2="17"/><rect x="5" y="6" width="8" height="8" rx="1"/></svg>) },
                            { dir: "center-h", title: "Center Horizontally", svg: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><line x1="10" y1="3" x2="10" y2="17"/><rect x="4" y="6" width="12" height="8" rx="1"/></svg>) },
                            { dir: "right",    title: "Align Right",         svg: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><line x1="17" y1="3" x2="17" y2="17"/><rect x="7" y="6" width="8" height="8" rx="1"/></svg>) },
                            { dir: "top",      title: "Align Top",           svg: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><line x1="3" y1="3" x2="17" y2="3"/><rect x="6" y="5" width="8" height="8" rx="1"/></svg>) },
                            { dir: "center-v", title: "Center Vertically",   svg: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><line x1="3" y1="10" x2="17" y2="10"/><rect x="6" y="4" width="8" height="12" rx="1"/></svg>) },
                            { dir: "bottom",   title: "Align Bottom",        svg: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><line x1="3" y1="17" x2="17" y2="17"/><rect x="6" y="7" width="8" height="8" rx="1"/></svg>) },
                          ].map(({ dir, title, svg }) => (
                            <button
                              key={dir}
                              onClick={() => handleAlign(dir)}
                              disabled={selectedElement?.isLocked}
                              title={title}
                              className="flex items-center justify-center py-2 border border-slate-200 bg-white rounded-xl text-slate-550 hover:border-indigo-300 hover:text-indigo-650 hover:bg-indigo-50 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 cursor-pointer"
                            >
                              {svg}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Layering Controls */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Layering Order</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          <button
                            onClick={() => handleLayerOrder("front")}
                            disabled={selectedElement?.isLocked}
                            title="Bring to Front"
                            className="flex flex-col items-center justify-center py-2.5 border border-slate-200 bg-white rounded-xl text-slate-650 hover:border-indigo-300 hover:text-indigo-650 hover:bg-indigo-50 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 cursor-pointer font-bold text-[10px] leading-tight"
                          >
                            <span className="text-sm">⏫</span>
                            <span>Front</span>
                          </button>
                          <button
                            onClick={() => handleLayerOrder("forward")}
                            disabled={selectedElement?.isLocked}
                            title="Move Forward"
                            className="flex flex-col items-center justify-center py-2.5 border border-slate-200 bg-white rounded-xl text-slate-650 hover:border-indigo-300 hover:text-indigo-650 hover:bg-indigo-50 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 cursor-pointer font-bold text-[10px] leading-tight"
                          >
                            <span className="text-sm">🔼</span>
                            <span>Up</span>
                          </button>
                          <button
                            onClick={() => handleLayerOrder("backward")}
                            disabled={selectedElement?.isLocked}
                            title="Move Backward"
                            className="flex flex-col items-center justify-center py-2.5 border border-slate-200 bg-white rounded-xl text-slate-650 hover:border-indigo-300 hover:text-indigo-650 hover:bg-indigo-50 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 cursor-pointer font-bold text-[10px] leading-tight"
                          >
                            <span className="text-sm">🔽</span>
                            <span>Down</span>
                          </button>
                          <button
                            onClick={() => handleLayerOrder("back")}
                            disabled={selectedElement?.isLocked}
                            title="Send to Back"
                            className="flex flex-col items-center justify-center py-2.5 border border-slate-200 bg-white rounded-xl text-slate-650 hover:border-indigo-300 hover:text-indigo-650 hover:bg-indigo-50 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 cursor-pointer font-bold text-[10px] leading-tight"
                          >
                            <span className="text-sm">⏬</span>
                            <span>Back</span>
                          </button>
                        </div>
                      </div>

                      {/* Overlapping Elements Hint */}
                      {overlappingElements.length > 0 && (
                        <div className="flex flex-col gap-2 p-3 bg-amber-50/40 border border-amber-200/50 rounded-2xl mt-1">
                          <div className="flex items-center gap-1.5 text-amber-700 font-extrabold text-[10px] uppercase tracking-wider">
                            <span>🥞 Layer Overlaps ({overlappingElements.length})</span>
                          </div>
                          <p className="text-[9px] text-slate-500 leading-normal font-semibold">
                            Other elements overlap with this selection. Click to select them:
                          </p>
                          <div className="flex flex-col gap-1 mt-1">
                            {overlappingElements.map(other => {
                              const isUnder = elements.indexOf(other) < elements.indexOf(selectedElement);
                              return (
                                <button
                                  key={other.id}
                                  onClick={() => handleSelectId(other.id, false)}
                                  className="w-full flex items-center justify-between px-2.5 py-2 border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 rounded-xl text-slate-700 text-[10px] font-bold transition-all duration-150 cursor-pointer shadow-sm"
                                >
                                  <span className="truncate max-w-[140px]">{other.label || other.type.replace("-", " ").toUpperCase()}</span>
                                  <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0">
                                    {isUnder ? "⬇️ Under" : "⬆️ Over"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Operations (Duplicate, Delete) */}
              <div className="flex flex-col gap-2.5 pt-5 border-t border-slate-150 mt-1">
                <button
                  onClick={handleDuplicate}
                  disabled={selectedElement.isLocked}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-slate-255 hover:bg-slate-50 text-slate-700 py-3 px-4 rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Copy size={14} className="text-slate-450" />
                  Duplicate Element
                </button>
                <button
                  onClick={handleDelete}
                  disabled={selectedElement.isLocked}
                  className="w-full flex items-center justify-center gap-2 bg-rose-50 border border-rose-100 hover:bg-rose-500 hover:border-rose-500 text-rose-550 hover:text-white py-3 px-4 rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Trash2 size={14} />
                  Remove Element
                </button>
              </div>
            </div>
          ) : selectedIds.length > 1 ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-150 text-[11px] font-semibold text-slate-500 leading-relaxed">
                <span><strong>Selection:</strong> Multiple Elements</span>
                <span><strong>Count:</strong> {selectedIds.length} items</span>
              </div>

              {/* Alignment Controls (multi-select: relative to bounding box) */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Align Selection</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { dir: "left",     title: "Align Left",          svg: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="3" y1="3" x2="3" y2="17"/><rect x="5" y="6" width="8" height="8" rx="1"/></svg>) },
                    { dir: "center-h", title: "Center Horizontally", svg: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="10" y1="3" x2="10" y2="17"/><rect x="4" y="6" width="12" height="8" rx="1"/></svg>) },
                    { dir: "right",    title: "Align Right",         svg: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="17" y1="3" x2="17" y2="17"/><rect x="7" y="6" width="8" height="8" rx="1"/></svg>) },
                    { dir: "top",      title: "Align Top",           svg: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="3" y1="3" x2="17" y2="3"/><rect x="6" y="5" width="8" height="8" rx="1"/></svg>) },
                    { dir: "center-v", title: "Center Vertically",   svg: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="3" y1="10" x2="17" y2="10"/><rect x="6" y="4" width="8" height="12" rx="1"/></svg>) },
                    { dir: "bottom",   title: "Align Bottom",        svg: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="3" y1="17" x2="17" y2="17"/><rect x="6" y="7" width="8" height="8" rx="1"/></svg>) },
                  ].map(({ dir, title, svg }) => (
                    <button
                      key={dir}
                      onClick={() => handleAlign(dir)}
                      title={title}
                      className="flex flex-col items-center justify-center gap-1 py-2 border border-slate-200 rounded-xl text-slate-500 hover:border-indigo-300 hover:text-indigo-650 hover:bg-indigo-50 transition-all duration-150 cursor-pointer"
                    >
                      {svg}
                      <span className="text-[8px] font-bold uppercase tracking-wider leading-none">{title.split(" ").pop()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bulk Position Lock */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bulk Position Lock</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const updated = elements.map(el => {
                        if (selectedIds.includes(el.id)) {
                          return { ...el, isLocked: true };
                        }
                        return el;
                      });
                      commitHistoryState(updated);
                    }}
                    className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm"
                  >
                    🔒 Lock All
                  </button>
                  <button
                    onClick={() => {
                      const updated = elements.map(el => {
                        if (selectedIds.includes(el.id)) {
                          return { ...el, isLocked: false };
                        }
                        return el;
                      });
                      commitHistoryState(updated);
                    }}
                    className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm"
                  >
                    🔓 Unlock All
                  </button>
                </div>
              </div>

              {/* Bulk Color presets */}
              <div className="flex flex-col gap-3">
                {/* Bulk Fill Color */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bulk Fill Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { name: "Indigo", hex: "#6366f1" },
                      { name: "Purple", hex: "#a855f7" },
                      { name: "Violet", hex: "#8b5cf6" },
                      { name: "Pink", hex: "#ec4899" },
                      { name: "Rose", hex: "#f43f5e" },
                      { name: "Red", hex: "#ef4444" },
                      { name: "Orange", hex: "#f97316" },
                      { name: "Amber", hex: "#f59e0b" },
                      { name: "Yellow", hex: "#eab308" },
                      { name: "Lime", hex: "#84cc16" },
                      { name: "Green", hex: "#22c55e" },
                      { name: "Emerald", hex: "#10b981" },
                      { name: "Teal", hex: "#14b8a6" },
                      { name: "Sky", hex: "#0ea5e9" },
                      { name: "Blue", hex: "#3b82f6" },
                      { name: "Slate", hex: "#64748b" }
                    ].map(color => (
                      <button
                        key={color.hex}
                        onClick={() => {
                          const updated = elements.map(el => {
                            if (selectedIds.includes(el.id)) {
                              return { ...el, fillColor: color.hex, color: color.hex };
                            }
                            return el;
                          });
                          commitHistoryState(updated);
                        }}
                        className="w-full h-8 border border-slate-200 rounded-xl hover:scale-105 cursor-pointer transition-all duration-200"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Bulk Stroke Color */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bulk Stroke Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { name: "Indigo", hex: "#6366f1" },
                      { name: "Purple", hex: "#a855f7" },
                      { name: "Violet", hex: "#8b5cf6" },
                      { name: "Pink", hex: "#ec4899" },
                      { name: "Rose", hex: "#f43f5e" },
                      { name: "Red", hex: "#ef4444" },
                      { name: "Orange", hex: "#f97316" },
                      { name: "Amber", hex: "#f59e0b" },
                      { name: "Yellow", hex: "#eab308" },
                      { name: "Lime", hex: "#84cc16" },
                      { name: "Green", hex: "#22c55e" },
                      { name: "Emerald", hex: "#10b981" },
                      { name: "Teal", hex: "#14b8a6" },
                      { name: "Sky", hex: "#0ea5e9" },
                      { name: "Blue", hex: "#3b82f6" },
                      { name: "Slate", hex: "#64748b" }
                    ].map(color => (
                      <button
                        key={color.hex}
                        onClick={() => {
                          const updated = elements.map(el => {
                            if (selectedIds.includes(el.id)) {
                              return { ...el, strokeColor: color.hex };
                            }
                            return el;
                          });
                          commitHistoryState(updated);
                        }}
                        className="w-full h-8 border border-slate-200 rounded-xl hover:scale-105 cursor-pointer transition-all duration-200"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Bulk Operations */}
              <div className="flex flex-col gap-2.5 pt-5 border-t border-slate-150 mt-1">
                <button
                  onClick={handleDuplicate}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 px-4 rounded-xl font-semibold text-xs cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Copy size={14} className="text-slate-400" />
                  Duplicate Selected
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 bg-rose-50 border border-rose-100 hover:bg-rose-500 hover:border-rose-500 text-rose-550 hover:text-white py-3 px-4 rounded-xl font-semibold text-xs cursor-pointer shadow-sm transition-all duration-200"
                >
                  <Trash2 size={14} />
                  Remove Selected
                </button>
              </div>
            </div>
          ) : blueprintUrl && isBlueprintSelected ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-150 text-[11px] font-semibold text-slate-500 leading-relaxed">
                <span><strong>Type:</strong> Blueprint Background</span>
                <span className="truncate" title={blueprintName}><strong>File:</strong> {blueprintName}</span>
              </div>

              {/* Blueprint Name input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blueprint Name</label>
                <input 
                  type="text" 
                  value={blueprintName || ""}
                  onChange={(e) => setBlueprintName(e.target.value)}
                  onBlur={() => commitHistoryState(elements, getCurrentBlueprintState())}
                  className="px-3 py-2.5 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 text-xs font-semibold"
                />
              </div>

              {/* Blueprint Lock toggle */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blueprint Lock</label>
                <button
                  type="button"
                  onClick={() => {
                    const nextLocked = !blueprintIsLocked;
                    setBlueprintIsLocked(nextLocked);
                    commitHistoryState(elements, { ...getCurrentBlueprintState(), isLocked: nextLocked });
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 border rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${
                    blueprintIsLocked 
                      ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" 
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-650"
                  }`}
                >
                  <span>{blueprintIsLocked ? "🔒 Locked (Click to Unlock)" : "🔓 Unlocked (Click to Lock)"}</span>
                </button>
              </div>

              {/* Blueprint Opacity input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>{t("floor.opacity", "Opacity")}</span>
                  <span>{Math.round(blueprintOpacity * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.05" 
                  max="1.0" 
                  step="0.05"
                  value={blueprintOpacity}
                  onChange={(e) => setBlueprintOpacity(parseFloat(e.target.value))}
                  onMouseUp={() => commitHistoryState(elements, getCurrentBlueprintState())}
                  onTouchEnd={() => commitHistoryState(elements, getCurrentBlueprintState())}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-150">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">X Offset (px)</label>
                  <PropertyInput 
                    type="number" 
                    disabled={blueprintIsLocked}
                    value={blueprintX}
                    onChange={(val) => {
                      setBlueprintX(val);
                      commitHistoryState(elements, { ...getCurrentBlueprintState(), x: val });
                    }}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Y Offset (px)</label>
                  <PropertyInput 
                    type="number" 
                    disabled={blueprintIsLocked}
                    value={blueprintY}
                    onChange={(val) => {
                      setBlueprintY(val);
                      commitHistoryState(elements, { ...getCurrentBlueprintState(), y: val });
                    }}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("floor.widthPx", "Width (px)")}</label>
                  <PropertyInput 
                    type="number" 
                    min={50}
                    disabled={blueprintIsLocked}
                    value={blueprintWidth}
                    onChange={(val) => {
                      setBlueprintWidth(val);
                      if (blueprintWidth && blueprintHeight) {
                        const ratio = blueprintWidth / blueprintHeight;
                        const nextHeight = Math.round(val / ratio);
                        setBlueprintHeight(nextHeight);
                        commitHistoryState(elements, { ...getCurrentBlueprintState(), width: val, height: nextHeight });
                      } else {
                        commitHistoryState(elements, { ...getCurrentBlueprintState(), width: val });
                      }
                    }}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("floor.heightPx", "Height (px)")}</label>
                  <PropertyInput 
                    type="number" 
                    min={50}
                    disabled={blueprintIsLocked}
                    value={blueprintHeight}
                    onChange={(val) => {
                      setBlueprintHeight(val);
                      if (blueprintWidth && blueprintHeight) {
                        const ratio = blueprintWidth / blueprintHeight;
                        const nextWidth = Math.round(val * ratio);
                        setBlueprintWidth(nextWidth);
                        commitHistoryState(elements, { ...getCurrentBlueprintState(), height: val, width: nextWidth });
                      } else {
                        commitHistoryState(elements, { ...getCurrentBlueprintState(), height: val });
                      }
                    }}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold bg-indigo-50/20 border-indigo-100/50 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Dimensions in Meters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("floor.widthMeters", "Width (meters)")}</label>
                  <PropertyInput 
                    type="number" 
                    step="0.5"
                    min={2.5}
                    disabled={blueprintIsLocked}
                    value={parseFloat((blueprintWidth / 20).toFixed(2))}
                    onChange={(val) => {
                      const newWidth = Math.round(val * 20);
                      setBlueprintWidth(newWidth);
                      if (blueprintWidth && blueprintHeight) {
                        const ratio = blueprintWidth / blueprintHeight;
                        const nextHeight = Math.round(newWidth / ratio);
                        setBlueprintHeight(nextHeight);
                        commitHistoryState(elements, { ...getCurrentBlueprintState(), width: newWidth, height: nextHeight });
                      } else {
                        commitHistoryState(elements, { ...getCurrentBlueprintState(), width: newWidth });
                      }
                    }}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold bg-indigo-50/20 border-indigo-100/50 disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("floor.heightMeters", "Height (meters)")}</label>
                  <PropertyInput 
                    type="number" 
                    step="0.5"
                    min={2.5}
                    disabled={blueprintIsLocked}
                    value={parseFloat((blueprintHeight / 20).toFixed(2))}
                    onChange={(val) => {
                      const newHeight = Math.round(val * 20);
                      setBlueprintHeight(newHeight);
                      if (blueprintWidth && blueprintHeight) {
                        const ratio = blueprintWidth / blueprintHeight;
                        const nextWidth = Math.round(newHeight * ratio);
                        setBlueprintWidth(nextWidth);
                        commitHistoryState(elements, { ...getCurrentBlueprintState(), height: newHeight, width: nextWidth });
                      } else {
                        commitHistoryState(elements, { ...getCurrentBlueprintState(), height: newHeight });
                      }
                    }}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold bg-indigo-50/20 border-indigo-100/50 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Rotation */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rotation (°)</label>
                  <PropertyInput 
                    type="number" 
                    disabled={blueprintIsLocked}
                    value={blueprintRotation}
                    onChange={(val) => {
                      setBlueprintRotation(val);
                      commitHistoryState(elements, { ...getCurrentBlueprintState(), rotation: val });
                    }}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5 col-span-1 justify-end">
                  <button
                    onClick={() => {
                      const nextRot = (blueprintRotation + 90) % 360;
                      setBlueprintRotation(nextRot);
                      commitHistoryState(elements, { ...getCurrentBlueprintState(), rotation: nextRot });
                    }}
                    disabled={blueprintIsLocked}
                    className="py-2 bg-slate-50 border border-slate-200 hover:border-indigo-150 hover:text-indigo-650 rounded-xl text-slate-650 font-bold text-xs flex items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
                    title="Rotate 90 degrees"
                  >
                    +90°
                  </button>
                </div>
              </div>

              {/* Delete Operations */}
              <div className="flex flex-col gap-2.5 pt-5 border-t border-slate-150 mt-1">
                <button
                  onClick={handleBlueprintDelete}
                  disabled={blueprintIsLocked}
                  className="w-full flex items-center justify-center gap-2 bg-rose-50 border border-rose-100 hover:bg-rose-500 hover:border-rose-500 text-rose-550 hover:text-white py-3 px-4 rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Trash2 size={14} />
                  Delete Blueprint
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* 1. Utilities & Actions */}
              <div className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("floor.utilitiesActions", "Utilities & Actions")}</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-white border border-slate-200 hover:border-indigo-150 hover:text-indigo-650 rounded-xl font-bold text-[10px] transition-all duration-200 cursor-pointer shadow-sm"
                  >
                    <Download size={13} />
                    <span>Export</span>
                  </button>
                  <button
                    onClick={() => setIsSendPlanModalOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-white border border-slate-200 hover:border-indigo-150 hover:text-indigo-650 rounded-xl font-bold text-[10px] transition-all duration-200 cursor-pointer shadow-sm"
                  >
                    <Mail size={13} />
                    <span>{t("floor.sendPdf", "Send PDF")}</span>
                  </button>
                </div>
              </div>

              {/* 2. Global Typography */}
              <div className="flex flex-col gap-1.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("floor.globalTypography", "Global Typography")}</span>
                <div className="relative">
                  <SearchableSelect
                    value={floorPlanFont}
                    onChange={(newFont) => {
                      if (!newFont) return;
                      setFloorPlanFont(newFont);
                      const updated = elements.map(el => ({ ...el, fontFamily: newFont }));
                      updateElementsAndHistory(updated);
                      if (onSaveFontFamily) {
                        onSaveFontFamily(newFont);
                      }
                    }}
                    options={GOOGLE_FONTS.map(f => ({
                      value: f.value,
                      label: f.label
                    }))}
                    isClearable={false}
                    searchPlaceholder={t("floor.searchFonts", "Search Google Fonts...")}
                    className="w-full"
                    buttonClassName="!py-2.5 !px-3.5 !rounded-xl !text-xs !font-semibold border-slate-200"
                  />
                </div>
              </div>

              {/* 3. Grid & Snapping Options */}
              <div className="flex flex-col gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("floor.gridSnapping", "Grid & Snapping")}</span>
                
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 border rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer ${
                      snapToGrid 
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2"><Grid size={14} />{t("floor.gridSnap", "Grid Snap")}</span>
                    <span className={`w-2 h-2 rounded-full ${snapToGrid ? "bg-indigo-500" : "bg-slate-300"}`} />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowGrid(!showGrid)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 border rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer ${
                      showGrid 
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2"><Layers size={14} />{t("floor.showGridLines", "Show Grid Lines")}</span>
                    <span className={`w-2 h-2 rounded-full ${showGrid ? "bg-indigo-500" : "bg-slate-300"}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDimensions(!showDimensions)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 border rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer ${
                      showDimensions 
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2"><Maximize size={14} />{t("floor.showDimensions", "Show Dimensions")}</span>
                    <span className={`w-2 h-2 rounded-full ${showDimensions ? "bg-indigo-500" : "bg-slate-300"}`} />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 border-t border-slate-200/60 pt-3">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("floor.snapGridSizeMeters", "Snap Grid Size (meters)")}</label>
                  <PropertyInput 
                    type="number" 
                    min={1}
                    step={1}
                    value={parseFloat((gridSize / 20).toFixed(2))}
                    onChange={(val) => setGridSize(Math.max(20, Math.round(val * 20)))}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold bg-white"
                  />
                </div>
              </div>

              {/* 4. Canvas Dimensions Settings */}
              <div className="flex flex-col gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("floor.canvasSize", "Canvas Size")}</span>
                
                {/* Dimensions in Meters */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("floor.widthMeters", "Width (meters)")}</label>
                    <PropertyInput 
                      type="number" 
                      step="1"
                      min={10}
                      value={parseFloat((canvasWidth / 20).toFixed(1))}
                      onChange={(val) => {
                        const newWidth = Math.round(val * 20);
                        setCanvasWidth(newWidth);
                        commitHistoryState(elements, { ...getCurrentBlueprintState(), canvasWidth: newWidth });
                      }}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("floor.heightMeters", "Height (meters)")}</label>
                    <PropertyInput 
                      type="number" 
                      step="1"
                      min={10}
                      value={parseFloat((canvasHeight / 20).toFixed(1))}
                      onChange={(val) => {
                        const newHeight = Math.round(val * 20);
                        setCanvasHeight(newHeight);
                        commitHistoryState(elements, { ...getCurrentBlueprintState(), canvasHeight: newHeight });
                      }}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold bg-white"
                    />
                  </div>
                </div>

                {/* Dimensions in Pixels */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("floor.widthPx", "Width (px)")}</label>
                    <PropertyInput 
                      type="number" 
                      step="100"
                      min={200}
                      value={canvasWidth}
                      onChange={(val) => {
                        setCanvasWidth(val);
                        commitHistoryState(elements, { ...getCurrentBlueprintState(), canvasWidth: val });
                      }}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("floor.heightPx", "Height (px)")}</label>
                    <PropertyInput 
                      type="number" 
                      step="100"
                      min={200}
                      value={canvasHeight}
                      onChange={(val) => {
                        setCanvasHeight(val);
                        commitHistoryState(elements, { ...getCurrentBlueprintState(), canvasHeight: val });
                      }}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-xs font-semibold bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Venue Blueprint Background */}
              {blueprintUrl ? (
                <div className="flex flex-col gap-3.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("floor.blueprintBackground", "Blueprint Background")}</span>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 bg-white border border-slate-150 p-2.5 rounded-xl">
                    <span className="truncate max-w-[150px]" title={blueprintName}>{blueprintName}</span>
                    <button
                      type="button"
                      onClick={() => handleSelectId("blueprint")}
                      className="text-[10px] font-bold text-indigo-650 hover:text-indigo-855 cursor-pointer font-sans"
                    >
                      Select / Move
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const nextLocked = !blueprintIsLocked;
                        setBlueprintIsLocked(nextLocked);
                        commitHistoryState(elements, { ...getCurrentBlueprintState(), isLocked: nextLocked });
                      }}
                      className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xl font-bold text-[10px] transition-all duration-200 cursor-pointer ${
                        blueprintIsLocked 
                          ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" 
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-650"
                      }`}
                    >
                      <span>{blueprintIsLocked ? t("floor.locked", "🔒 Locked") : t("floor.unlocked", "🔓 Unlocked")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleBlueprintDelete}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-50 border border-rose-100 hover:bg-rose-500 hover:border-rose-500 text-rose-550 hover:text-white rounded-xl font-bold text-[10px] transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      <Trash2 size={11} />
                      <span>Delete</span>
                    </button>
                  </div>
                  {/* Opacity slider directly available */}
                  <div className="flex flex-col gap-1.5 border-t border-slate-150 pt-3">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Opacity</span>
                      <span>{Math.round(blueprintOpacity * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.05" 
                      max="1.0" 
                      step="0.05"
                      value={blueprintOpacity}
                      onChange={(e) => setBlueprintOpacity(parseFloat(e.target.value))}
                      onMouseUp={() => commitHistoryState(elements, getCurrentBlueprintState())}
                      onTouchEnd={() => commitHistoryState(elements, getCurrentBlueprintState())}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("floor.blueprintBackground", "Blueprint Background")}</span>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="w-full flex flex-col items-center justify-center gap-2.5 py-6 px-4 bg-white border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 rounded-2xl cursor-pointer transition-all duration-200"
                  >
                    <Upload size={20} className="text-slate-400" />
                    <div className="flex flex-col gap-0.5 items-center">
                      <span className="text-xs font-bold text-slate-700">{t("floor.uploadBlueprint", "Upload Blueprint Background")}</span>
                      <span className="text-[9px] font-semibold text-slate-400">{t("floor.uploadBlueprintDesc", "Scale drawing as backdrop (PNG, JPG up to 10MB)")}</span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBlueprintUpload}
                      className="hidden"
                    />
                  </button>
                </div>
              )}

              {/* 6. Shortcuts Guide */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setIsShortcutModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 hover:border-indigo-150 hover:text-indigo-650 rounded-xl font-bold text-xs text-slate-655 transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <Keyboard size={15} />
                  <span>{t("floor.viewShortcuts", "View Keyboard Shortcuts")}</span>
                </button>
              </div>

              {/* Selection help info */}
              <div className="flex flex-col items-center justify-center text-center text-slate-450 py-5 px-4 border border-dashed border-slate-200 rounded-3xl gap-2.5 bg-slate-50/40">
                <Layers size={20} className="opacity-30" />
                <p className="text-[10px] text-slate-400 leading-normal font-semibold">{t("floor.canvasHelp", "Click on any placed booth, stage, custom shape, or facility inside the canvas workspace to modify details.")}</p>
              </div>
            </div>
          )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {showArrayModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 w-[360px] flex flex-col gap-5 max-w-full animate-scale-up">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-slate-800 font-extrabold">Array / Duplicate</h3>
              <p className="text-xs text-slate-500 font-semibold leading-normal">
                Generate a grid of copies of the selected element.
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Columns</label>
                  <input
                    type="number"
                    min={1}
                    value={arrayColumns}
                    onChange={(e) => setArrayColumns(Math.max(1, parseInt(e.target.value) || 1))}
                    className="px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl text-xs font-semibold bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rows</label>
                  <input
                    type="number"
                    min={1}
                    value={arrayRows}
                    onChange={(e) => setArrayRows(Math.max(1, parseInt(e.target.value) || 1))}
                    className="px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl text-xs font-semibold bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Column Gap (m)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    value={arrayColumnGap}
                    onChange={(e) => setArrayColumnGap(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl text-xs font-semibold bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Row Gap (m)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    value={arrayRowGap}
                    onChange={(e) => setArrayRowGap(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl text-xs font-semibold bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowArrayModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateArray}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer animate-pulse-subtle"
              >
                Generate Array
              </button>
            </div>
          </div>
        </div>
      )}

      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        onExport={handleExportPlan} 
        elements={elements}
        exhibitors={exhibitors}
        attendees={attendees}
      />

      <SendPlanModal
        isOpen={isSendPlanModalOpen}
        onClose={() => setIsSendPlanModalOpen(false)}
        exhibitors={exhibitors}
        planName={planName}
        elements={elements}
        onSuccess={(msg) => setToastMessage(msg)}
      />

      {/* Keyboard Shortcuts Modal */}
      {isShortcutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9998] animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100/50 text-indigo-650 rounded-xl">
                  <Keyboard size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Keyboard Shortcuts Guide</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Speed up your floor plan layout design</p>
                </div>
              </div>
              <button 
                onClick={() => setIsShortcutModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all"
              >
                <ChevronUp size={16} className="rotate-90" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex flex-col gap-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all">
                  <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Canvas & History</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-600 font-medium">Undo last action</span>
                    <kbd className="px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm font-mono text-[10px]">Ctrl + Z</kbd>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-600 font-medium">Redo action</span>
                    <kbd className="px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm font-mono text-[10px]">Ctrl + Y</kbd>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all">
                  <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Edit Elements</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-600 font-medium">Copy selection</span>
                    <kbd className="px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm font-mono text-[10px]">Ctrl + C</kbd>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-600 font-medium">Paste elements</span>
                    <kbd className="px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm font-mono text-[10px]">Ctrl + V</kbd>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-600 font-medium">Delete selected</span>
                    <kbd className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-sm font-mono text-[10px]">Del / Backspace</kbd>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all">
                <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Precision Nudging</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Nudge selected (1px)</span>
                  <kbd className="px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm font-mono text-[10px]">↑ ↓ ← →</kbd>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-slate-600 font-medium">Big nudge (5px)</span>
                  <kbd className="px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm font-mono text-[10px]">Shift + Arrow</kbd>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all">
                <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Editor Modes</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Switch to Select tool</span>
                  <kbd className="px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm font-mono text-[10px]">V</kbd>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-slate-600 font-medium">Switch to Pan / Move Canvas</span>
                  <kbd className="px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm font-mono text-[10px]">M</kbd>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsShortcutModalOpen(false)}
                className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Real-Time Save Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 280 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white border border-slate-800 backdrop-blur-md rounded-2xl shadow-2xl px-5 py-3.5 flex items-center gap-3 text-xs font-semibold max-w-sm pointer-events-auto z-[9999]"
          >
            <CheckCircle size={16} className="text-emerald-400 shrink-0" />
            <span className="leading-snug">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
