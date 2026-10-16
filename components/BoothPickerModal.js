"use client";

import React, { useState, useMemo } from "react";
import { Store, Check, X, Search, Layers, Info, CheckCircle2, AlertCircle } from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { useLanguage } from "../lib/i18n";

export default function BoothPickerModal({
  isOpen,
  onClose,
  onSelectBooth,
  floorPlans = [],
  targetFloorPlanId = "",
  selectedBooth = null
}) {
  const { t } = useLanguage();
  const [activePlanId, setActivePlanId] = useState(targetFloorPlanId || (floorPlans[0]?.id || ""));
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "available" | "occupied"
  const [tempSelectedBooth, setTempSelectedBooth] = useState(selectedBooth);

  // Sync active floor plan when targetFloorPlanId changes
  React.useEffect(() => {
    if (targetFloorPlanId) {
      setActivePlanId(targetFloorPlanId);
    } else if (!activePlanId && floorPlans.length > 0) {
      setActivePlanId(floorPlans[0].id);
    }
  }, [targetFloorPlanId, floorPlans]);

  // Sync selected booth
  React.useEffect(() => {
    setTempSelectedBooth(selectedBooth);
  }, [selectedBooth, isOpen]);

  // Resolve current active floor plan
  const currentPlan = useMemo(() => {
    if (!floorPlans || floorPlans.length === 0) return null;
    return floorPlans.find(fp => fp.id === activePlanId) || floorPlans[0];
  }, [floorPlans, activePlanId]);

  // Extract all booth elements from the current floor plan
  const allBooths = useMemo(() => {
    if (!currentPlan) return [];
    const elements = Array.isArray(currentPlan.elements) ? currentPlan.elements : [];
    
    // Also inspect floors if elements are stored per floor
    let boothList = [];
    if (elements.length > 0) {
      boothList = elements.filter(el => el.type && (el.type.startsWith("booth") || el.type === "exhibitor-space"));
    } else if (Array.isArray(currentPlan.floors)) {
      currentPlan.floors.forEach(floor => {
        if (Array.isArray(floor.elements)) {
          const fb = floor.elements.filter(el => el.type && (el.type.startsWith("booth") || el.type === "exhibitor-space"));
          boothList.push(...fb);
        }
      });
    }

    return boothList.map((b, idx) => {
      const boothNum = b.boothNumber || b.label || b.name || `Stand ${idx + 1}`;
      const status = (b.status || "available").toLowerCase();
      const isAvailable = status === "available" || status === "draft";
      const isReserved = status === "reserved" || status === "pending" || status === "hold";
      const isSold = status === "sold" || status === "confirmed";

      let dimensionsStr = "";
      if (typeof b.dimensions === "string" && b.dimensions.trim()) {
        dimensionsStr = b.dimensions;
      } else if (b.width && b.height) {
        dimensionsStr = `${Math.round(b.width / 10)}x${Math.round(b.height / 10)}m`;
      } else {
        dimensionsStr = "Standard Stand";
      }

      return {
        id: b.id || `booth-${idx}`,
        boothNumber: boothNum,
        label: b.label || boothNum,
        dimensions: dimensionsStr,
        status: status,
        isAvailable,
        isReserved,
        isSold,
        category: b.category || b.tier || b.boothType || "Standard Booth",
        price: b.price || b.cost || null,
        floorPlanId: currentPlan.id,
        floorPlanName: currentPlan.name || "Main Exhibition Hall"
      };
    });
  }, [currentPlan]);

  // Filter booths by search query and availability
  const filteredBooths = useMemo(() => {
    return allBooths.filter(booth => {
      // Status filter
      if (statusFilter === "available" && !booth.isAvailable) return false;
      if (statusFilter === "occupied" && booth.isAvailable) return false;

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNum = booth.boothNumber.toLowerCase().includes(q);
        const matchesCat = booth.category.toLowerCase().includes(q);
        const matchesDim = booth.dimensions.toLowerCase().includes(q);
        if (!matchesNum && !matchesCat && !matchesDim) return false;
      }

      return true;
    });
  }, [allBooths, statusFilter, searchQuery]);

  const handleConfirm = () => {
    if (tempSelectedBooth) {
      onSelectBooth(tempSelectedBooth);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-50/80 via-white to-blue-50/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Store size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {t("boothPicker.title", "Select Exhibition Booth / Stand")}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {t("boothPicker.subtitle", "Pick an available booth from the venue floor plan for your company exhibition space.")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Floor Plan Selector (if multiple exist) */}
          {floorPlans.length > 1 && !targetFloorPlanId && (
            <div className="w-full sm:w-64 shrink-0">
              <SearchableSelect
                options={floorPlans.map(fp => ({
                  value: fp.id,
                  label: fp.name || fp.title || "Floor Plan"
                }))}
                value={activePlanId}
                onChange={(val) => setActivePlanId(val)}
                placeholder={t("boothPicker.selectFloorPlan", "Select Floor Plan")}
                isClearable={false}
              />
            </div>
          )}

          {/* Search Bar */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("boothPicker.searchPlaceholder", "Search booth number, size, tier...")}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-800 outline-none transition-all shadow-2xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Availability Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "all" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t("boothPicker.all", "All")} ({allBooths.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("available")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "available" ? "bg-emerald-600 text-white shadow-xs" : "text-emerald-700 hover:text-emerald-800"
              }`}
            >
              {t("boothPicker.available", "Available")} ({allBooths.filter(b => b.isAvailable).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("occupied")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "occupied" ? "bg-slate-200 text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("boothPicker.occupied", "Occupied")} ({allBooths.filter(b => !b.isAvailable).length})
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 text-[11px] font-bold text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>{t("boothPicker.legendAvailable", "Available")}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>{t("boothPicker.legendReserved", "Reserved")}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>{t("boothPicker.legendSold", "Sold / Occupied")}</span>
            </span>
          </div>

          {currentPlan && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Layers size={13} />
              <span>{currentPlan.name || "Venue Floor Plan"}</span>
            </div>
          )}
        </div>

        {/* Booth Grid Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
          {filteredBooths.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                <Store size={28} />
              </div>
              <h4 className="text-sm font-black text-slate-800">
                {allBooths.length === 0 
                  ? t("boothPicker.noBoothsInPlan", "No booths defined on this floor plan yet.")
                  : t("boothPicker.noMatchingBooths", "No stands match your search filter.")
                }
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {allBooths.length === 0 
                  ? t("boothPicker.organizerWillAssign", "The organizer has not populated stands on this floor plan. You may submit without a stand or contact the organizer.")
                  : t("boothPicker.tryDifferentFilter", "Try adjusting your search terms or availability filter.")
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {filteredBooths.map(booth => {
                const isSelected = tempSelectedBooth && (
                  tempSelectedBooth.id === booth.id || 
                  tempSelectedBooth.boothNumber === booth.boothNumber ||
                  tempSelectedBooth === booth.boothNumber
                );

                let badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                let statusLabel = t("boothPicker.available", "Available");
                if (booth.isReserved) {
                  badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                  statusLabel = t("boothPicker.reserved", "Reserved");
                } else if (booth.isSold) {
                  badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
                  statusLabel = t("boothPicker.sold", "Sold");
                }

                return (
                  <button
                    type="button"
                    key={booth.id}
                    disabled={!booth.isAvailable}
                    onClick={() => {
                      if (booth.isAvailable) {
                        setTempSelectedBooth(booth);
                      }
                    }}
                    className={`relative p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 text-start ${
                      isSelected 
                        ? "bg-blue-50/80 border-blue-600 shadow-md shadow-blue-500/15 ring-2 ring-blue-600/30 -translate-y-0.5" 
                        : booth.isAvailable
                          ? "bg-white border-slate-200/90 hover:border-blue-400 hover:shadow-xs cursor-pointer"
                          : "bg-slate-100/70 border-slate-200/50 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    {/* Selected Checkmark Badge */}
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <Check size={14} className="stroke-[3]" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-black text-slate-900 tracking-tight">
                          {booth.boothNumber}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500">
                        {booth.dimensions}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                        {booth.category}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${badgeColor}`}>
                        {statusLabel}
                      </span>
                      {booth.price && (
                        <span className="text-[11px] font-extrabold text-slate-700">
                          {booth.price}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Selected Booth preview & Action */}
        <div className="p-4 px-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {tempSelectedBooth ? (
              <div className="flex items-center gap-2.5 text-xs text-slate-800">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>
                  <strong className="font-extrabold text-slate-900">
                    Stand #{tempSelectedBooth.boothNumber || tempSelectedBooth.label || tempSelectedBooth}
                  </strong>{" "}
                  {tempSelectedBooth.dimensions && (
                    <span className="text-slate-500">({tempSelectedBooth.dimensions})</span>
                  )}
                  {" "}selected
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Info size={16} />
                <span>{t("boothPicker.selectOnePrompt", "Click on any available stand card to select it.")}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="button"
              disabled={!tempSelectedBooth}
              onClick={handleConfirm}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md ${
                tempSelectedBooth
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              <Check size={15} />
              <span>{t("boothPicker.confirmSelection", "Confirm Stand")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
