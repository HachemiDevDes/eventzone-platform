"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  Edit3,
  X,
  BedDouble,
  Users,
  Check,
  Star,
  Key,
  ShieldCheck,
  CalendarCheck,
  Sparkles
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { useLanguage } from "../lib/i18n";

export const HOTEL_STAR_OPTIONS = [
  { value: "5", label: "5 Stars ★★★★★" },
  { value: "4", label: "4 Stars ★★★★" },
  { value: "3", label: "3 Stars ★★★" },
  { value: "2", label: "2 Stars ★★" },
  { value: "boutique", label: "Boutique / Luxury" },
  { value: "aparthotel", label: "Apart-Hotel / Residence" }
];

export const COMMON_HOTEL_AMENITIES = [
  "Airport Shuttle",
  "Breakfast Included",
  "Free High-Speed Wi-Fi",
  "Business Center",
  "Fitness / Gym",
  "Spa & Wellness",
  "Swimming Pool",
  "Meeting Rooms",
  "24/7 Room Service",
  "Free Parking"
];

export const ROOM_TYPE_PRESETS = [
  { name: "Standard Room", defaultPrice: 15000, allotted: 10, desc: "Single/Double occupancy, complimentary Wi-Fi" },
  { name: "Deluxe King Room", defaultPrice: 22000, allotted: 10, desc: "King Bed, city view, buffet breakfast included" },
  { name: "Executive Suite", defaultPrice: 35000, allotted: 5, desc: "VIP Suite, lounge access & airport shuttle included" },
  { name: "Presidential / Royal Suite", defaultPrice: 65000, allotted: 2, desc: "Ultra-luxury suite for top keynote speakers & VIPs" }
];

export default function HotelsView({
  hotels = [],
  travel = [],
  onSaveHotel,
  onDeleteHotel,
  canEdit = true,
  currency = "DA",
  isAddModalOpenExternal = false,
  onCloseAddModalExternal
}) {
  const { t, language, isRTL } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Local optimistic state
  const [localHotels, setLocalHotels] = useState(hotels || []);

  useEffect(() => {
    setLocalHotels(hotels || []);
  }, [hotels]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [starFilter, setStarFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [hotelToDelete, setHotelToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    stars: "5",
    location: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    website: "",
    amenities: ["Airport Shuttle", "Breakfast Included", "Free High-Speed Wi-Fi"],
    notes: "",
    roomTypes: [
      { id: "rt-1", name: "Standard Room", price: 16000, allottedRooms: 10, desc: "Breakfast included" },
      { id: "rt-2", name: "Executive Suite", price: 28000, allottedRooms: 5, desc: "VIP lounge access" }
    ]
  });

  // Map VIP guest bookings per hotel
  const hotelBookings = useMemo(() => {
    const map = {};
    (travel || []).forEach(trv => {
      const hName = (trv.hotelName || "").toLowerCase().trim();
      const hId = trv.hotelId;
      if (!hName && !hId) return;

      localHotels.forEach(h => {
        const matchName = (h.name || "").toLowerCase().trim() === hName;
        const matchId = h.id === hId;
        if (matchName || matchId) {
          if (!map[h.id]) map[h.id] = [];
          map[h.id].push(trv);
        }
      });
    });
    return map;
  }, [localHotels, travel]);

  // Handle external modal trigger from LogisticsView header
  useEffect(() => {
    if (isAddModalOpenExternal) {
      handleOpenCreateModal();
      if (onCloseAddModalExternal) onCloseAddModalExternal();
    }
  }, [isAddModalOpenExternal]);

  const handleOpenCreateModal = () => {
    setEditingHotel(null);
    setFormData({
      name: "",
      stars: "5",
      location: "",
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      website: "",
      amenities: ["Airport Shuttle", "Breakfast Included", "Free High-Speed Wi-Fi"],
      notes: "",
      roomTypes: [
        { id: `rt-${Date.now()}-1`, name: "Standard Room", price: 16000, allottedRooms: 10, desc: "Breakfast included" },
        { id: `rt-${Date.now()}-2`, name: "Executive Suite", price: 28000, allottedRooms: 5, desc: "VIP lounge access" }
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (hotel) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name || "",
      stars: hotel.stars ? String(hotel.stars) : "5",
      location: hotel.location || "",
      contactPerson: hotel.contactPerson || "",
      contactPhone: hotel.contactPhone || "",
      contactEmail: hotel.contactEmail || "",
      website: hotel.website || "",
      amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
      notes: hotel.notes || "",
      roomTypes: Array.isArray(hotel.roomTypes) && hotel.roomTypes.length > 0
        ? hotel.roomTypes.map(rt => ({
            id: rt.id || `rt-${Math.random().toString(36).substr(2, 9)}`,
            name: rt.name || "",
            price: Number(rt.price) || 0,
            allottedRooms: Number(rt.allottedRooms) || 0,
            desc: rt.desc || rt.description || ""
          }))
        : [{ id: `rt-${Date.now()}`, name: "Standard Room", price: 15000, allottedRooms: 10, desc: "" }]
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHotel(null);
  };

  const handleToggleAmenity = (amenity) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter(a => a !== amenity)
          : [...prev.amenities, amenity]
      };
    });
  };

  const handleAddRoomType = (preset = null) => {
    const newRt = preset ? {
      id: `rt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: preset.name,
      price: preset.defaultPrice,
      allottedRooms: preset.allotted,
      desc: preset.desc
    } : {
      id: `rt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: "",
      price: 0,
      allottedRooms: 5,
      desc: ""
    };

    setFormData(prev => ({
      ...prev,
      roomTypes: [...prev.roomTypes, newRt]
    }));
  };

  const handleUpdateRoomType = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.roomTypes];
      updated[index] = {
        ...updated[index],
        [field]: field === "price" || field === "allottedRooms" ? Number(value) || 0 : value
      };
      return { ...prev, roomTypes: updated };
    });
  };

  const handleRemoveRoomType = (index) => {
    setFormData(prev => ({
      ...prev,
      roomTypes: prev.roomTypes.filter((_, i) => i !== index)
    }));
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const payload = {
      ...(editingHotel || {}),
      name: formData.name.trim(),
      stars: formData.stars,
      location: formData.location.trim(),
      contactPerson: formData.contactPerson.trim(),
      contactPhone: formData.contactPhone.trim(),
      contactEmail: formData.contactEmail.trim(),
      website: formData.website.trim(),
      amenities: formData.amenities,
      notes: formData.notes.trim(),
      roomTypes: formData.roomTypes.filter(rt => rt.name && rt.name.trim()),
      updatedAt: new Date().toISOString()
    };

    if (!payload.id) {
      payload.id = `hotel-${Date.now()}`;
      payload.createdAt = new Date().toISOString();
    }

    // Optimistic UI update
    setLocalHotels(prev => {
      const exists = prev.some(h => h.id === payload.id);
      return exists ? prev.map(h => h.id === payload.id ? payload : h) : [payload, ...prev];
    });

    handleCloseModal();

    if (onSaveHotel) {
      await onSaveHotel(payload);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!hotelToDelete) return;
    const id = hotelToDelete.id;

    // Optimistic remove
    setLocalHotels(prev => prev.filter(h => h.id !== id));
    setHotelToDelete(null);

    if (onDeleteHotel) {
      await onDeleteHotel(id);
    }
  };

  // Filtered Hotels
  const filteredHotels = useMemo(() => {
    return localHotels.filter(hotel => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        (hotel.name || "").toLowerCase().includes(q) ||
        (hotel.location || "").toLowerCase().includes(q) ||
        (hotel.contactPerson || "").toLowerCase().includes(q) ||
        (hotel.roomTypes || []).some(rt => (rt.name || "").toLowerCase().includes(q));

      const matchStar = starFilter === "all" ||
        String(hotel.stars) === starFilter;

      return matchSearch && matchStar;
    });
  }, [localHotels, searchQuery, starFilter]);

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────
          1. SEARCH, FILTERS & ACTION TOOLBAR
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
              placeholder={t("logistics.searchHotelsPlaceholder", "Search hotels by name, address, stars, or room types...")}
              className="w-full pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Star Filter */}
          <div className="w-44 hidden md:block">
            <SearchableSelect
              value={starFilter}
              onChange={(val) => setStarFilter(val)}
              options={[
                { value: "all", label: t("common.allCategories", "All Stars & Categories") },
                ...HOTEL_STAR_OPTIONS
              ]}
              showSearch={false}
              isClearable={false}
            />
          </div>
        </div>

        {/* Primary Action Button */}
        {canEdit && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} />
            <span>{t("logistics.addHotel", "Add Partner Hotel")}</span>
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────
          2. PARTNER HOTELS GRID
      ───────────────────────────────────────────── */}
      {filteredHotels.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {t("logistics.noHotelsFound", "No partner hotels found")}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            {t("logistics.noHotelsSubtitle", "Add collaborator hotels to organize accommodations, block room quotas, and assign VIP guests seamlessly.")}
          </p>
          {canEdit && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>{t("logistics.addHotel", "Add Partner Hotel")}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredHotels.map((hotel) => {
            const bookings = hotelBookings[hotel.id] || [];
            const roomTypes = Array.isArray(hotel.roomTypes) ? hotel.roomTypes : [];
            const totalAllotted = roomTypes.reduce((acc, r) => acc + (Number(r.allottedRooms) || 0), 0);

            return (
              <div
                key={hotel.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Title, Stars, and Actions */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-black text-slate-900 truncate">{hotel.name}</h4>
                        {/* Stars badge */}
                        {hotel.stars && (
                          <div className="flex items-center text-amber-500 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                            {hotel.stars === "boutique" || hotel.stars === "aparthotel" ? (
                              <span className="capitalize">{hotel.stars}</span>
                            ) : (
                              <span>{"★".repeat(Number(hotel.stars) || 0)}</span>
                            )}
                          </div>
                        )}
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {t("logistics.hotelPartner", "Partner Hotel")}
                        </span>
                      </div>

                      {/* Location */}
                      {hotel.location && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                          <MapPin size={13} className="text-rose-500 shrink-0" />
                          <span className="truncate">{hotel.location}</span>
                          {hotel.website && (
                            <a
                              href={hotel.website.startsWith("http") ? hotel.website : `https://${hotel.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 ml-1 inline-flex items-center gap-0.5"
                            >
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Edit & Delete buttons */}
                    {canEdit && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditModal(hotel)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title={t("logistics.editHotel", "Edit Hotel")}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setHotelToDelete(hotel)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={t("logistics.deleteHotel", "Delete Hotel")}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Contact Person & Phone */}
                  <div className="py-3 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    {hotel.contactPerson && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-bold">{t("logistics.contactPerson", "Contact:")}</span>
                        <span className="font-semibold text-slate-800 truncate">{hotel.contactPerson}</span>
                      </div>
                    )}
                    {hotel.contactPhone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-emerald-600" />
                        <a href={`tel:${hotel.contactPhone}`} className="text-blue-600 hover:underline font-bold">
                          <bdi dir="ltr">{hotel.contactPhone}</bdi>
                        </a>
                      </div>
                    )}
                    {hotel.contactEmail && (
                      <div className="flex items-center gap-1.5 sm:col-span-2">
                        <Mail size={12} className="text-indigo-600" />
                        <a href={`mailto:${hotel.contactEmail}`} className="text-slate-700 hover:underline font-medium truncate">
                          {hotel.contactEmail}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Amenities Tags */}
                  {Array.isArray(hotel.amenities) && hotel.amenities.length > 0 && (
                    <div className="py-3 border-b border-slate-100 flex items-center gap-1.5 flex-wrap">
                      {hotel.amenities.map(am => (
                        <span
                          key={am}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 flex items-center gap-1"
                        >
                          <Check size={11} className="text-emerald-600" />
                          <span>{am}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Accommodation Types & Pricing */}
                  <div className="pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <BedDouble size={13} className="text-blue-600" />
                        {t("logistics.roomTypesSection", "Accommodation Types & Pricing")}
                      </span>
                      {totalAllotted > 0 && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <bdi dir="ltr">{totalAllotted}</bdi> {t("logistics.roomsAvailable", "rooms allotted")}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {roomTypes.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No room types specified yet.</p>
                      ) : (
                        roomTypes.map((rt, i) => (
                          <div
                            key={rt.id || i}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                          >
                            <div className="min-w-0 pr-2 rtl:pl-2 rtl:pr-0">
                              <span className="font-bold text-slate-800 block truncate">{rt.name}</span>
                              {rt.desc && <span className="text-[10px] text-slate-500 block truncate">{rt.desc}</span>}
                            </div>
                            <div className="text-right rtl:text-left shrink-0">
                              <span className="font-black text-slate-900 font-mono">
                                <bdi dir="ltr">{Number(rt.price || 0).toLocaleString()}</bdi> <span className="text-[10px] font-bold text-blue-600">{currency}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 block font-medium">
                                /{t("logistics.night", "night")} {rt.allottedRooms ? `• ${rt.allottedRooms} allotted` : ""}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: VIP Guest Allocations */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Users size={12} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">
                      <strong className="text-purple-700 font-bold"><bdi dir="ltr">{bookings.length}</bdi></strong> {t("logistics.vipsLodged", "VIP guests lodged")}
                    </span>
                  </div>

                  {bookings.length > 0 && (
                    <div className="flex -space-x-1.5 rtl:space-x-reverse">
                      {bookings.slice(0, 4).map((b, idx) => (
                        <div
                          key={b.id || idx}
                          title={`${b.personName || "VIP Guest"} - ${b.role || ""}`}
                          className="w-6 h-6 rounded-full bg-purple-600 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-white shadow-2xs uppercase"
                        >
                          {(b.personName || "V").charAt(0)}
                        </div>
                      ))}
                      {bookings.length > 4 && (
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 font-bold text-[9px] flex items-center justify-center border-2 border-white shadow-2xs">
                          +{bookings.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────
          3. ADD / EDIT HOTEL MODAL (PORTALLED TO BODY)
      ───────────────────────────────────────────── */}
      {mounted && isModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          dir={isRTL ? "rtl" : "ltr"}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingHotel ? t("logistics.editHotel", "Edit Partner Hotel") : t("logistics.addHotel", "Add Partner Hotel")}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {t("logistics.hotelsSubtitle", "Manage collaborator hotels, room quotas, and accommodation pricing.")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Hotel Name & Stars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-700">
                    {t("logistics.hotelName", "Hotel Name")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Grand Hyatt Regency / Sofitel Algiers"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    {t("logistics.hotelStars", "Star Rating")}
                  </label>
                  <SearchableSelect
                    value={formData.stars}
                    onChange={(val) => setFormData({ ...formData, stars: val })}
                    options={HOTEL_STAR_OPTIONS}
                    showSearch={false}
                    isClearable={false}
                  />
                </div>
              </div>

              {/* Location & Address */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  {t("logistics.hotelLocation", "Location & Address")}
                </label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. 172 Boulevard Zighout Youcef, Algiers"
                    className="w-full pl-8 pr-3 rtl:pr-8 rtl:pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              {/* Contact Person, Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">{t("logistics.contactPerson", "Contact Person")}</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Amine Boudiaf - Sales Mgr"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">{t("logistics.contactPhone", "Phone Number")}</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="e.g. +213 21 00 00 00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">{t("logistics.contactEmail", "Email Address")}</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="reservations@hotel.dz"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              {/* Amenities Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">{t("logistics.amenities", "Amenities & Features")}</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_HOTEL_AMENITIES.map(amenity => {
                    const isSelected = formData.amenities.includes(amenity);
                    return (
                      <button
                        type="button"
                        key={amenity}
                        onClick={() => handleToggleAmenity(amenity)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                          isSelected
                            ? "bg-blue-50 border-blue-200 text-blue-700 shadow-2xs"
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected && <Check size={11} className="text-blue-600" />}
                        <span>{amenity}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ─────────────────────────────────────────────
                  ACCOMMODATION TYPES REPEATER
              ───────────────────────────────────────────── */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <BedDouble size={14} className="text-blue-600" />
                      {t("logistics.roomTypesSection", "Accommodation Types & Pricing")}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {t("logistics.roomTypesDesc", "Specify available room categories, nightly rates in event currency, and allotted room counts.")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddRoomType()}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>{t("logistics.addRoomType", "Add Room Type")}</span>
                  </button>
                </div>

                {/* Quick Presets Bar */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={10} className="text-amber-500" /> Presets:
                  </span>
                  {ROOM_TYPE_PRESETS.map(preset => (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() => handleAddRoomType(preset)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[10px] font-semibold transition-colors cursor-pointer"
                    >
                      + {preset.name} ({preset.defaultPrice.toLocaleString()} {currency})
                    </button>
                  ))}
                </div>

                {/* Dynamic Room List */}
                <div className="space-y-2.5">
                  {formData.roomTypes.map((rt, index) => (
                    <div
                      key={rt.id || index}
                      className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-4 space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{t("logistics.roomTypeName", "Room / Suite Name")}</label>
                        <input
                          type="text"
                          required
                          value={rt.name}
                          onChange={(e) => handleUpdateRoomType(index, "name", e.target.value)}
                          placeholder="e.g. Deluxe King"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-3 space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{t("logistics.roomPrice", "Price/Night")} ({currency})</label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={rt.price}
                          onChange={(e) => handleUpdateRoomType(index, "price", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{t("logistics.allottedRooms", "Allotted")}</label>
                        <input
                          type="number"
                          min="0"
                          value={rt.allottedRooms}
                          onChange={(e) => handleUpdateRoomType(index, "allottedRooms", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{t("logistics.roomDescription", "Features")}</label>
                        <input
                          type="text"
                          value={rt.desc}
                          onChange={(e) => handleUpdateRoomType(index, "desc", e.target.value)}
                          placeholder="e.g. City view"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-1 flex items-center justify-end pt-3 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveRoomType(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove room type"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes / Contract Details */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-700">{t("logistics.notesCollaboration", "Collaboration & Contract Notes")}</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Corporate discount code: eventzone2026. Free late checkout negotiated for VIPs."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              {/* Form Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs hover:shadow transition-all cursor-pointer"
                >
                  {editingHotel ? t("common.saveChanges", "Save Changes") : t("logistics.addHotel", "Add Partner Hotel")}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────
          4. DELETE CONFIRMATION DIALOG (PORTALLED)
      ───────────────────────────────────────────── */}
      {mounted && hotelToDelete && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          dir={isRTL ? "rtl" : "ltr"}
          onClick={() => setHotelToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                {t("logistics.deleteHotel", "Delete Partner Hotel")}?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong className="text-slate-800">{hotelToDelete.name}</strong> from your collaborator hotels list?
              </p>
              {hotelBookings[hotelToDelete.id] && hotelBookings[hotelToDelete.id].length > 0 && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium">
                  ⚠️ <strong>{hotelBookings[hotelToDelete.id].length} VIP guests</strong> are currently assigned to this hotel in VIP Travel & Lodging!
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setHotelToDelete(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {t("common.delete", "Delete")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
