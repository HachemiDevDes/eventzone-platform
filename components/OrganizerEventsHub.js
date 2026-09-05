/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { 
  Building2, Plus, Search, Calendar, MapPin, 
  Users, BarChart3, ArrowRight, ExternalLink, 
  Archive, RotateCcw, Globe, Sparkles, LayoutDashboard, Layers, Filter, CheckCircle2, Home, ChevronDown, Check
} from "lucide-react";
import { useLanguage } from "../lib/i18n";
import UniversalTopBar from "./UniversalTopBar";
import { EventsHubSkeleton } from "./SkeletonLoaders";

export default function OrganizerEventsHub({ 
  events = [], 
  registrations = [],
  isLoading = false,
  onSelectEvent, 
  onCreateEventClick, 
  onDeleteEvent,
  onArchiveEvent,
  onUnarchiveEvent,
  onSwitchToVisitor,
  onGoToHome,
  onOpenProfile,
  onOpenAuth,
  onSignOut,
  user
}) {
  const { t, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "published" | "draft" | "archived"

  if (isLoading) {
    return <EventsHubSkeleton />;
  }

  const filteredEvents = events.filter(ev => {
    const matchesSearch = (ev.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ev.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ev.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" ? ev.status !== "archived" : (ev.status || "published") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAttendees = events.reduce((acc, ev) => acc + (ev.attendeeCount || 0), 0);
  const totalPublished = events.filter(e => (e.status || "published") === "published").length;
  const totalArchived = events.filter(e => e.status === "archived").length;
  const totalDrafts = events.filter(e => (e.status || "published") === "draft").length;
  const totalRevenue = events.length === 0 ? 0 : events.reduce((acc, ev) => acc + (ev.revenue || ((ev.attendeeCount || 0) * 150)), 0);
  const totalFloorPlans = events.length === 0 ? 0 : events.reduce((acc, ev) => acc + (ev.floorPlansCount || (ev.hasFloorPlan ? 1 : 1)), 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top SaaS Header */}
      <UniversalTopBar
        currentUser={user}
        registrations={registrations}
        onGoToHome={onGoToHome}
        onOpenAuth={onOpenAuth}
        onOpenProfile={onOpenProfile}
        onOpenPassesModal={onSwitchToVisitor}
        onOpenCreationWizard={onCreateEventClick}
        onOpenEventsHub={() => {}}
        onSignOut={onSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-8">
        {/* Welcome & Top Metric Cards */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {t("eventsHub.title", "Organizer Event Center")}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {t("eventsHub.subtitle", "Manage your hosted conferences, custom floor plans, agendas, and door check-ins.")}
              </p>
            </div>

            <button
              onClick={onCreateEventClick}
              className="self-start sm:self-auto px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              {t("eventsHub.hostNewEvent", "Host New Event")}
            </button>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("eventsHub.totalHosted", "Total Hosted Events")}</span>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-2xl font-black text-slate-900">{events.length}</h3>
                  {user?.maxEvents !== null && user?.maxEvents !== undefined && (
                    <span className="text-xs font-mono font-bold text-slate-400">/ {user.maxEvents}</span>
                  )}
                  {user?.maxEvents !== null && user?.maxEvents !== undefined && events.length >= user.maxEvents && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                      LIMIT REACHED
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-blue-600 mt-0.5 inline-block">{totalPublished} {t("eventsHub.published", "Published")}</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Building2 size={20} />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("eventsHub.totalRegistered", "Total Registered")}</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{totalAttendees}</h3>
                <span className="text-[11px] font-semibold text-emerald-600 mt-0.5 inline-block">{t("eventsHub.acrossAllSummits", "Across all summits")}</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Users size={20} />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("eventsHub.estRevenue", "Est. Revenue")}</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{totalRevenue.toLocaleString()} <span className="text-sm font-bold text-slate-400">DZD</span></h3>
                <span className="text-[11px] font-semibold text-slate-500 mt-0.5 inline-block">
                  {events.length === 0 ? t("eventsHub.noActiveSales", "No active sales") : t("eventsHub.vipAndStandard", "VIP & Standard")}
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                <BarChart3 size={20} />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("eventsHub.activeFloorPlans", "Active Floor Plans")}</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{totalFloorPlans}</h3>
                <span className="text-[11px] font-semibold text-blue-600 mt-0.5 inline-block">
                  {events.length === 0 ? t("eventsHub.noFloorPlans", "No floor plans") : t("eventsHub.with2dEditor", "With 2D editor")}
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Layers size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("eventsHub.searchPlaceholder", "Search events by title, location or category...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-xs"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-stretch sm:self-auto flex-wrap gap-1">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "all" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("eventsHub.allStatuses", "All Statuses")} ({events.length - totalArchived})
            </button>
            <button
              onClick={() => setStatusFilter("published")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "published" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("eventsHub.published", "Published")} ({totalPublished})
            </button>
            <button
              onClick={() => setStatusFilter("draft")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "draft" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("eventsHub.drafts", "Drafts")} ({totalDrafts})
            </button>
            <button
              onClick={() => setStatusFilter("archived")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "archived" ? "bg-slate-700 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("eventsHub.archived", "Archived")} ({totalArchived})
            </button>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
              <Building2 size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {statusFilter === "archived" ? t("eventsHub.archived", "No archived events") : t("eventsHub.noEventsTitle", "No events found")}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              {searchQuery ? t("home.adjustSearchFilters", "Try refining your search query or filter") : t("eventsHub.noEventsDesc", "Create your first conference or summit to start managing schedules, floor plans, and tickets.")}
            </p>
            {statusFilter !== "archived" && (
              <button
                onClick={onCreateEventClick}
                className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                {t("eventsHub.hostNewEvent", "Create Event Now")}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => {
              const isArchived = ev.status === "archived";
              return (
                <div 
                  key={ev.id}
                  className={`bg-white border ${isArchived ? "border-slate-300 bg-slate-50/50 opacity-80 hover:opacity-100" : "border-slate-200 hover:border-blue-300"} rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group`}
                >
                  {/* Cover Image */}
                  <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                    <img 
                      src={ev.banner || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80"} 
                      alt={ev.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-white/90 backdrop-blur-md text-blue-700 shadow-xs border border-white/50 uppercase tracking-wider">
                        {ev.type === "In-Person" ? t("eventsHub.inPerson", "In-Person") : ev.type === "Virtual" ? t("eventsHub.virtual", "Virtual") : t("eventsHub.hybrid", "Hybrid")}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-xs ${
                        isArchived
                          ? "bg-slate-600 text-white"
                          : (ev.status || "published") === "published" 
                            ? "bg-emerald-500 text-white" 
                            : "bg-amber-500 text-white"
                      }`}>
                        {isArchived ? t("table.archived", "Archived").toUpperCase() : (ev.status || "published") === "published" ? t("eventsHub.published", "Published").toUpperCase() : t("eventsHub.draft", "Draft").toUpperCase()}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block drop-shadow-sm">
                        {ev.category || t("common.general", "General")}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <h3 
                        onClick={() => onSelectEvent(ev.id)}
                        className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 cursor-pointer"
                      >
                        {ev.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium leading-relaxed">
                        {ev.tagline || ev.description || "The premier global industry gathering."}
                      </p>
                    </div>

                    {/* Date & Location */}
                    <div className="space-y-1.5 text-xs text-slate-600 font-medium pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-blue-500 shrink-0" />
                        <span>{ev.startDate || "2026-10-12"} {ev.endDate ? `— ${ev.endDate}` : ""}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-blue-500 shrink-0" />
                        <span className="truncate">{ev.location || "Algiers & Online"}</span>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        {isArchived ? (
                          <button
                            onClick={() => {
                              if (onUnarchiveEvent) onUnarchiveEvent(ev.id);
                              else if (onArchiveEvent) onArchiveEvent(ev.id, 'published');
                            }}
                            className="h-8 px-2.5 text-emerald-600 hover:text-emerald-700 rounded-xl hover:bg-emerald-50 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 border border-emerald-200"
                            title="Restore Event"
                          >
                            <RotateCcw size={13} />
                            <span>{t("common.restore", "Restore")}</span>
                          </button>
                        ) : (
                          (onArchiveEvent || onDeleteEvent) && ev.id !== "c251ee33-cf10-4b11-a87f-70925f7cac2c" && (
                            <button
                              onClick={() => {
                                if (onArchiveEvent) onArchiveEvent(ev.id);
                                else if (onDeleteEvent) onDeleteEvent(ev.id);
                              }}
                              className="h-8 px-2.5 text-slate-400 hover:text-amber-600 rounded-xl hover:bg-amber-50 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                              title="Archive Event"
                            >
                              <Archive size={13} />
                              <span>{t("common.archive", "Archive")}</span>
                            </button>
                          )
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`/${ev.slug || ev.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 w-8 flex items-center justify-center bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-xl transition-all cursor-pointer border border-slate-200/60"
                          title={t("eventsHub.publicPage", "View Public Landing Page")}
                        >
                          <ExternalLink size={13} />
                        </a>

                        <button
                          onClick={() => onSelectEvent(ev.id)}
                          className="h-8 px-3.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-blue-200/80 hover:border-blue-600 shadow-xs"
                        >
                          {t("eventsHub.openEvent", "Open Dashboard")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
