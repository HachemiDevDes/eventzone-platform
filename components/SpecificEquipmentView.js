"use client";

import React, { useState, useMemo } from "react";
import {
  Package, Plus, Search, Filter, Trash2, Edit3, CheckCircle2,
  AlertTriangle, AlertCircle, Info, Zap, Tv, Coffee, X,
  DollarSign, Layers, Building2, Store, SlidersHorizontal
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { useLanguage } from "../lib/i18n";
import {
  SPECIFIC_EQUIPMENT_PRESETS,
  getLocalizedEquipmentName,
  getLocalizedEquipmentSpecs
} from "../lib/constants";

export const SPECIFIC_EQUIPMENT_CATEGORIES = [
  "Furniture & Seating",
  "Electrical & Power",
  "Audiovisual & Screens",
  "Display & Signage",
  "Appliances & Comfort",
  "Other Equipment"
];

export const POPULAR_EQUIPMENT_PRESETS = SPECIFIC_EQUIPMENT_PRESETS;

export default function SpecificEquipmentView({
  specificEquipment = [],
  exhibitors = [],
  onSaveItem,
  onDeleteItem,
  canEdit = true,
  currency = "DA",
  isAddModalOpenExternal = false,
  onCloseAddModalExternal
}) {
  const { t, language, isRTL } = useLanguage();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState("all");
  const [presetCategoryFilter, setPresetCategoryFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  React.useEffect(() => {
    if (isAddModalOpenExternal) {
      setEditingItem(null);
      setFormData({
        name: "",
        category: "Furniture & Seating",
        unitPrice: 0,
        quantity: 10,
        status: "available",
        specs: "",
        powerRequirement: "",
        notes: ""
      });
      setIsModalOpen(true);
    }
  }, [isAddModalOpenExternal]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "Furniture & Seating",
    unitPrice: 0,
    quantity: 10,
    status: "available",
    specs: "",
    powerRequirement: "",
    notes: ""
  });

  // Calculate allocation metrics per equipment item from exhibitors
  const equipmentAllocations = useMemo(() => {
    const allocationsMap = {};

    (exhibitors || []).forEach(ex => {
      if (ex.isArchived || ex.status === "archived") return;
      const assigned = ex.specificEquipment || ex.specific_equipment || [];
      if (!Array.isArray(assigned)) return;

      assigned.forEach(item => {
        const eqId = item.equipmentId || item.id || item.name;
        if (!allocationsMap[eqId]) {
          allocationsMap[eqId] = {
            totalAllocated: 0,
            assignedExhibitors: []
          };
        }
        const qty = Number(item.quantity) || 1;
        allocationsMap[eqId].totalAllocated += qty;
        allocationsMap[eqId].assignedExhibitors.push({
          exhibitorId: ex.id,
          exhibitorName: ex.name,
          booth: ex.booth || ex.boothNumber || "",
          quantity: qty,
          status: item.status || "confirmed"
        });
      });
    });

    return allocationsMap;
  }, [exhibitors]);

  // Overall KPI metrics
  const stats = useMemo(() => {
    let totalStock = 0;
    let totalStockValue = 0;
    let totalAllocatedUnits = 0;
    let totalAllocatedValue = 0;

    (specificEquipment || []).forEach(item => {
      const stock = Number(item.quantity) || 0;
      const price = Number(item.unitPrice || item.price) || 0;
      totalStock += stock;
      totalStockValue += stock * price;

      const alloc = equipmentAllocations[item.id] || equipmentAllocations[item.name];
      const allocCount = alloc ? alloc.totalAllocated : 0;
      totalAllocatedUnits += allocCount;
      totalAllocatedValue += allocCount * price;
    });

    const remainingStock = Math.max(0, totalStock - totalAllocatedUnits);

    return {
      typesCount: specificEquipment.length,
      totalStock,
      totalStockValue,
      totalAllocatedUnits,
      totalAllocatedValue,
      remainingStock
    };
  }, [specificEquipment, equipmentAllocations]);

  // Category translation helper
  const getCategoryLabel = (cat) => {
    switch (cat) {
      case "Furniture & Seating": return t("logistics.catFurniture", "Furniture & Seating");
      case "Electrical & Power": return t("logistics.catElectrical", "Electrical & Power");
      case "Audiovisual & Screens": return t("logistics.catAudiovisual", "Audiovisual & Screens");
      case "Display & Signage": return t("logistics.catDisplaySignage", "Display & Signage");
      case "Appliances & Comfort": return t("logistics.catAppliances", "Appliances & Comfort");
      case "Other Equipment": return t("logistics.catOther", "Other Equipment");
      default: return cat;
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case "Furniture & Seating": return <Store size={15} className="text-blue-600" />;
      case "Electrical & Power": return <Zap size={15} className="text-amber-500" />;
      case "Audiovisual & Screens": return <Tv size={15} className="text-purple-600" />;
      case "Display & Signage": return <Layers size={15} className="text-emerald-600" />;
      case "Appliances & Comfort": return <Coffee size={15} className="text-rose-500" />;
      default: return <Package size={15} className="text-slate-500" />;
    }
  };

  // Filtered catalogue list
  const filteredEquipment = useMemo(() => {
    return (specificEquipment || []).filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const localizedName = getLocalizedEquipmentName(item, t, language).toLowerCase();
      const localizedSpecs = getLocalizedEquipmentSpecs(item, t, language).toLowerCase();
      const categoryLabel = getCategoryLabel(item.category).toLowerCase();

      const matchesSearch = !q || 
        (item.name || "").toLowerCase().includes(q) ||
        localizedName.includes(q) ||
        (item.category || "").toLowerCase().includes(q) ||
        categoryLabel.includes(q) ||
        (item.specs || "").toLowerCase().includes(q) ||
        localizedSpecs.includes(q) ||
        (item.notes || "").toLowerCase().includes(q);

      const matchesCat = selectedCategory === "all" || item.category === selectedCategory;

      const alloc = equipmentAllocations[item.id] || equipmentAllocations[item.name];
      const allocCount = alloc ? alloc.totalAllocated : 0;
      const stock = Number(item.quantity) || 0;
      const remaining = stock - allocCount;

      let matchesStock = true;
      if (selectedStockStatus === "available") {
        matchesStock = remaining > 0;
      } else if (selectedStockStatus === "low") {
        matchesStock = remaining > 0 && remaining <= Math.ceil(stock * 0.25);
      } else if (selectedStockStatus === "out") {
        matchesStock = remaining <= 0;
      }

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [specificEquipment, searchQuery, selectedCategory, selectedStockStatus, equipmentAllocations, t, language]);

  // Handle open add/edit modal
  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        id: item.id,
        presetKey: item.presetKey,
        name: item.name || "",
        category: item.category || "Furniture & Seating",
        unitPrice: item.unitPrice || item.price || 0,
        quantity: item.quantity || 1,
        status: item.status || "available",
        specs: item.specs || "",
        powerRequirement: item.powerRequirement || "",
        notes: item.notes || ""
      });
    } else {
      setEditingItem(null);
      setFormData({
        presetKey: null,
        name: "",
        category: "Furniture & Seating",
        unitPrice: 0,
        quantity: 10,
        status: "available",
        specs: "",
        powerRequirement: "",
        notes: ""
      });
    }
    setIsModalOpen(true);
  };

  // Handle load preset into form
  const handleLoadPreset = (preset) => {
    setEditingItem(null);
    setFormData({
      presetKey: preset.presetKey || preset.id,
      name: getLocalizedEquipmentName(preset, t, language),
      category: preset.category,
      unitPrice: preset.unitPrice,
      quantity: preset.quantity || 10,
      status: preset.status || "available",
      specs: getLocalizedEquipmentSpecs(preset, t, language),
      powerRequirement: preset.powerRequirement || "",
      notes: ""
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onCloseAddModalExternal) onCloseAddModalExternal();
  };

  // Handle submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const payload = {
      id: editingItem ? editingItem.id : undefined,
      presetKey: formData.presetKey || (editingItem && editingItem.presetKey) || undefined,
      name: formData.name.trim(),
      category: formData.category,
      unitPrice: parseFloat(formData.unitPrice) || 0,
      price: parseFloat(formData.unitPrice) || 0,
      quantity: parseInt(formData.quantity) || 1,
      status: formData.status || "available",
      specs: formData.specs.trim(),
      powerRequirement: formData.powerRequirement.trim(),
      notes: formData.notes.trim()
    };

    if (onSaveItem) {
      await onSaveItem(payload);
    }
    handleCloseModal();
  };

  // SearchableSelect options for categories
  const categoryOptions = useMemo(() => {
    return SPECIFIC_EQUIPMENT_CATEGORIES.map(cat => ({
      value: cat,
      label: getCategoryLabel(cat),
      icon: getCategoryIcon(cat)
    }));
  }, [t]);

  const stockStatusOptions = useMemo(() => [
    { value: "available", label: t("logistics.statusAvailable", "Available") },
    { value: "on_request", label: t("logistics.statusOnRequest", "On Request") },
    { value: "unavailable", label: t("logistics.statusOutOfStock", "Fully Allocated / Unavailable") }
  ], [t]);

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────
          1. TOP KPI METRICS
      ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            {t("logistics.totalEquipment", "Total Items")}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900"><bdi dir="ltr">{stats.typesCount}</bdi></span>
            <span className="text-xs text-slate-500 font-semibold">{t("common.types", "types")}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            {t("logistics.totalStock", "Total Stock Units")}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-600"><bdi dir="ltr">{stats.totalStock}</bdi></span>
            <span className="text-xs text-slate-500 font-semibold">{t("common.units", "units")}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            {t("logistics.allocatedCount", "Allocated to Stands")}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-600"><bdi dir="ltr">{stats.totalAllocatedUnits}</bdi></span>
            <span className="text-xs text-slate-500 font-semibold">
              {stats.totalStock > 0 ? `(${Math.round((stats.totalAllocatedUnits / stats.totalStock) * 100)}%)` : ""}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            {t("logistics.remainingStock", "Available Remaining")}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-black ${stats.remainingStock <= 5 ? "text-amber-600" : "text-emerald-600"}`}>
              <bdi dir="ltr">{stats.remainingStock}</bdi>
            </span>
            <span className="text-xs text-slate-500 font-semibold">{t("common.units", "units")}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            {t("logistics.totalAllocatedValue", "Allocated Value")}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 font-mono">
              <bdi dir="ltr">{stats.totalAllocatedValue.toLocaleString()}</bdi>
            </span>
            <span className="text-xs font-bold text-blue-600">{currency}</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          2. READY-MADE ORGANIZER PRESETS STRIP
      ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-100/80 rounded-3xl p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
              {t("logistics.presetSuggestions", "Quick Suggestions & Common Presets")}
            </h3>
            <p className="text-[11px] text-slate-600">
              {t("logistics.presetSuggestionsDesc", "Popular equipment elements frequently needed by exhibitors. Click any item to add/customize.")}
            </p>
          </div>

          {/* Preset Category Switcher */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {["all", "Furniture & Seating", "Electrical & Power", "Audiovisual & Screens", "Display & Signage", "Appliances & Comfort"].map(catKey => (
              <button
                key={catKey}
                type="button"
                onClick={() => setPresetCategoryFilter(catKey)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  presetCategoryFilter === catKey 
                    ? "bg-blue-600 text-white shadow-2xs" 
                    : "bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200/60"
                }`}
              >
                {catKey === "all" ? t("common.all", "All") : getCategoryLabel(catKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1">
          {SPECIFIC_EQUIPMENT_PRESETS
            .filter(p => presetCategoryFilter === "all" || p.category === presetCategoryFilter)
            .map((preset, idx) => (
              <button
                key={preset.id || idx}
                type="button"
                onClick={() => handleLoadPreset(preset)}
                disabled={!canEdit}
                className="group p-3 bg-white hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 rounded-2xl text-start transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="p-1 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-white">
                      {getCategoryIcon(preset.category)}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-blue-600">
                      {preset.unitPrice.toLocaleString()} {currency}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-700 line-clamp-1">
                    {getLocalizedEquipmentName(preset, t, language)}
                  </h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {getLocalizedEquipmentSpecs(preset, t, language)}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-blue-600 font-bold group-hover:underline">
                  <span>{t("logistics.usePreset", "Use Preset")}</span>
                  <Plus size={12} />
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          3. SEARCH, FILTERS & ACTION TOOLBAR
      ───────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("logistics.searchPlaceholder", "Search equipment, chairs, power, screens...")}
              className="w-full pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="w-48 hidden md:block">
            <SearchableSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={[
                { value: "all", label: t("logistics.filterAllCategories", "All Categories") },
                ...SPECIFIC_EQUIPMENT_CATEGORIES.map(c => ({ value: c, label: getCategoryLabel(c) }))
              ]}
              isClearable={false}
              showSearch={false}
              placeholder={t("logistics.filterAllCategories", "All Categories")}
            />
          </div>

          {/* Availability Filter */}
          <div className="w-40 hidden lg:block">
            <SearchableSelect
              value={selectedStockStatus}
              onChange={setSelectedStockStatus}
              options={[
                { value: "all", label: t("logistics.filterAllStock", "All Availability") },
                { value: "available", label: t("logistics.statusAvailable", "In Stock") },
                { value: "low", label: t("logistics.statusLowStock", "Low Stock") },
                { value: "out", label: t("logistics.statusOutOfStock", "Fully Allocated") }
              ]}
              isClearable={false}
              showSearch={false}
              placeholder={t("logistics.filterAllStock", "All Availability")}
            />
          </div>
        </div>

        {/* Add Equipment Button */}
        {canEdit && (
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus size={15} />
            <span>{t("logistics.addSpecificEquipment", "Add Specific Equipment")}</span>
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────
          4. EQUIPMENT CATALOGUE LIST / CARDS
      ───────────────────────────────────────────── */}
      {filteredEquipment.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-2xs space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Package size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {t("logistics.noSpecificEquipmentFound", "No specific equipment found")}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {t("logistics.noSpecificEquipmentSubtitle", "Add items or pick from common presets like chairs, tables, TV screens, or power connections.")}
          </p>
          {canEdit && (
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenModal()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                <span>{t("logistics.addSpecificEquipment", "Add Specific Equipment")}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map((item) => {
            const alloc = equipmentAllocations[item.id] || equipmentAllocations[item.name];
            const allocCount = alloc ? alloc.totalAllocated : 0;
            const stock = Number(item.quantity) || 0;
            const remaining = stock - allocCount;
            const allocPct = stock > 0 ? Math.min(100, Math.round((allocCount / stock) * 100)) : 0;
            const isOutOfStock = remaining <= 0;
            const isLowStock = remaining > 0 && remaining <= Math.ceil(stock * 0.25);

            return (
              <div 
                key={item.id}
                className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header: Category & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="p-1.5 rounded-lg bg-slate-100 border border-slate-200/60 shrink-0">
                        {getCategoryIcon(item.category)}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 truncate">
                        {getCategoryLabel(item.category)}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                      isOutOfStock
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : isLowStock
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                      {isOutOfStock 
                        ? t("logistics.statusOutOfStock", "Fully Allocated")
                        : isLowStock 
                        ? t("logistics.statusLowStock", "Low Stock")
                        : t("logistics.statusAvailable", "In Stock")}
                    </span>
                  </div>

                  {/* Title & Price */}
                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-snug">
                      {getLocalizedEquipmentName(item, t, language)}
                    </h4>
                    <div className="flex items-baseline gap-1 mt-1 text-blue-600">
                      <span className="text-base font-black font-mono">
                        {(Number(item.unitPrice || item.price) || 0).toLocaleString()}
                      </span>
                      <span className="text-xs font-extrabold">{currency}</span>
                      <span className="text-[10px] text-slate-400 font-normal">/ {t("common.unit", "unit")}</span>
                    </div>
                  </div>

                  {/* Stock & Allocation Bar */}
                  <div className="space-y-1.5 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-slate-500">{t("logistics.allocatedCount", "Allocated")}:</span>
                      <span className="text-slate-800 font-bold">
                        <bdi dir="ltr">{allocCount} / {stock}</bdi>
                      </span>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          allocPct >= 100 
                            ? "bg-rose-500" 
                            : allocPct >= 75 
                            ? "bg-amber-500" 
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${allocPct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">{t("logistics.remainingStock", "Available")}:</span>
                      <span className={`font-bold ${isOutOfStock ? "text-rose-600" : isLowStock ? "text-amber-600" : "text-emerald-700"}`}>
                        <bdi dir="ltr">{remaining}</bdi> {t("common.remaining", "left")}
                      </span>
                    </div>
                  </div>

                  {/* Specifications snippet */}
                  {item.specs && (
                    <p className="text-[11px] text-slate-600 bg-slate-50/50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                      <span className="font-semibold text-slate-700">{t("logistics.specs", "Specs")}: </span>
                      {getLocalizedEquipmentSpecs(item, t, language)}
                    </p>
                  )}

                  {/* Assigned Exhibitors List */}
                  {alloc && alloc.assignedExhibitors.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                        {t("logistics.assignedExhibitors", "Assigned Exhibitors")} ({alloc.assignedExhibitors.length})
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                        {alloc.assignedExhibitors.map((asg, aIdx) => (
                          <span
                            key={aIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50/80 border border-blue-100 text-[10px] font-bold text-blue-700"
                            title={`${asg.exhibitorName} • ${asg.quantity} unit(s)`}
                          >
                            <span className="truncate max-w-[120px]">{asg.exhibitorName}</span>
                            {asg.booth && <span className="text-blue-500 font-normal">({asg.booth})</span>}
                            <span className="px-1 rounded bg-blue-600 text-white text-[9px]"><bdi dir="ltr">{asg.quantity}</bdi></span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                {canEdit && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(item)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title={t("common.edit", "Edit")}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title={t("common.delete", "Delete")}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────
          5. ADD / EDIT MODAL
      ───────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {editingItem 
                    ? t("logistics.editSpecificEquipment", "Edit Specific Equipment") 
                    : t("logistics.addSpecificEquipment", "Add Specific Equipment")}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t("logistics.equipmentName", "Equipment Name")} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. 55'' 4K Screen with Rolling Stand"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Category (SearchableSelect as required by guidelines) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t("logistics.equipmentCategory", "Category")} *
                </label>
                <SearchableSelect
                  value={formData.category}
                  onChange={(val) => setFormData({ ...formData, category: val })}
                  options={categoryOptions}
                  isClearable={false}
                  placeholder={t("logistics.equipmentCategory", "Category")}
                />
              </div>

              {/* Price & Quantity Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t("logistics.unitPrice", "Unit Price")} ({currency}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t("logistics.totalStock", "Total Stock Units")} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Availability Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t("logistics.stockStatus", "Availability Status")}
                </label>
                <SearchableSelect
                  value={formData.status}
                  onChange={(val) => setFormData({ ...formData, status: val })}
                  options={stockStatusOptions}
                  isClearable={false}
                  showSearch={false}
                  placeholder={t("logistics.stockStatus", "Availability Status")}
                />
              </div>

              {/* Specs & Dimensions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t("logistics.specs", "Specifications / Dimensions / Power")}
                </label>
                <textarea
                  rows={2}
                  value={formData.specs}
                  onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                  placeholder="e.g. Dimensions: 180x80cm, includes 3m power cord and protective case"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-y"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {editingItem ? t("common.saveChanges", "Save Changes") : t("common.add", "Add Equipment")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          6. DELETE CONFIRMATION DIALOG
      ───────────────────────────────────────────── */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {t("common.delete", "Delete")} {itemToDelete.name}?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t("common.deleteConfirmation", "Are you sure you want to delete this equipment item from the event catalogue? Existing exhibitor records will retain historical notes.")}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onDeleteItem) {
                    await onDeleteItem(itemToDelete.id);
                  }
                  setItemToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                {t("common.confirmDelete", "Delete Permanently")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
