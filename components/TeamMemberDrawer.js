/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Phone,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  Pencil,
  Sparkles,
  LayoutDashboard,
  Calendar,
  Mic2,
  TrendingUp,
  Store,
  Ticket,
  UserCheck,
  Clock,
  Layers,
  Boxes,
  QrCode,
  ClipboardList,
  BarChart3,
  Search,
  Filter,
  Send,
  Loader2,
  Info,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import { EVENT_MODULES, ROLE_PRESETS, MODULE_CATEGORIES, getPermissionSummary } from '../lib/permissions';
import SearchableSelect from './SearchableSelect';
import CountryPhoneInput from './CountryPhoneInput';

// Map icon strings to Lucide components
const ICON_COMPONENTS = {
  LayoutDashboard,
  FileText: ClipboardList,
  Calendar,
  Mic2,
  TrendingUp,
  Building2,
  Sparkles,
  Store,
  Ticket,
  UserCheck,
  Clock,
  CheckCircle2,
  Layers,
  Boxes,
  QrCode,
  ClipboardList,
  Mail,
  BarChart3,
  ShieldCheck
};

const DEPARTMENT_SUGGESTIONS = [
  "Operations & Logistics",
  "Registration & Welcome Desk",
  "Stage & Program Management",
  "Sponsorship & Partnerships",
  "Marketing & Communications",
  "Security & Access Control",
  "VIP & Hospitality",
  "Technical & AV Production",
  "General Administration"
];

export default function TeamMemberDrawer({
  isOpen,
  onClose,
  member = null,
  onSaveMember,
  activeEventId,
  eventTitle = "Eventzone Summit"
}) {
  const { t } = useLanguage();

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("Staff");
  const [selectedPreset, setSelectedPreset] = useState("Custom");
  const [permissions, setPermissions] = useState({});
  const [status, setStatus] = useState("Active");
  const [sendInviteEmail, setSendInviteEmail] = useState(true);
  const [inviteNote, setInviteNote] = useState("");

  // UI / Filtering State
  const [activeTab, setActiveTab] = useState("permissions"); // 'profile' | 'permissions' | 'invite'
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [moduleSearch, setModuleSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Sync state when member or isOpen changes
  useEffect(() => {
    if (isOpen) {
      if (member) {
        setName(member.name || "");
        setEmail(member.email || "");
        setPhone(member.phone || "");
        setDepartment(member.department || "");
        setRole(member.role || "Staff");
        setStatus(member.status || "Active");
        setPermissions(member.permissions || {});
        setInviteNote(member.notes || "");
        
        // Check if permissions match a known preset
        const matchedPreset = ROLE_PRESETS.find(p => {
          if (p.id === "Custom") return false;
          const pKeys = Object.keys(p.permissions);
          const currentKeys = Object.keys(member.permissions || {});
          if (pKeys.length !== currentKeys.length) return false;
          return pKeys.every(k => (member.permissions || {})[k] === p.permissions[k]);
        });
        setSelectedPreset(matchedPreset ? matchedPreset.id : "Custom");
      } else {
        // Reset for new member
        setName("");
        setEmail("");
        setPhone("");
        setDepartment("");
        setRole("Staff");
        setStatus("Active");
        // Default to Staff preset
        const defaultPreset = ROLE_PRESETS.find(p => p.id === "Registration") || ROLE_PRESETS[1];
        setPermissions({ ...defaultPreset.permissions });
        setSelectedPreset(defaultPreset.id);
        setRole(defaultPreset.roleName);
        setSendInviteEmail(true);
        setInviteNote("");
      }
      setErrorMessage("");
      setIsSubmitting(false);
    }
  }, [isOpen, member]);

  // Apply Role Preset
  const handleSelectPreset = (presetId) => {
    setSelectedPreset(presetId);
    const preset = ROLE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      if (presetId !== "Custom") {
        setPermissions({ ...preset.permissions });
        setRole(preset.roleName);
      }
    }
  };

  // Modify single module permission
  const handleSetModulePermission = (moduleId, level) => {
    setPermissions(prev => {
      const updated = { ...prev };
      if (level === "none") {
        delete updated[moduleId];
      } else {
        updated[moduleId] = level;
      }
      return updated;
    });
    setSelectedPreset("Custom");
  };

  // Batch actions
  const handleGrantAll = (level) => {
    if (level === "none") {
      setPermissions({});
      setSelectedPreset("Custom");
    } else if (level === "editor") {
      setPermissions(Object.fromEntries(EVENT_MODULES.map(m => [m.id, "editor"])));
      setSelectedPreset("Admin");
      setRole("Admin");
    } else if (level === "viewer") {
      setPermissions(Object.fromEntries(EVENT_MODULES.map(m => [m.id, "viewer"])));
      setSelectedPreset("Auditor");
      setRole("Observer");
    }
  };

  // Filtered modules
  const filteredModules = useMemo(() => {
    return EVENT_MODULES.filter(mod => {
      const matchesCategory = categoryFilter === "all" || mod.category === categoryFilter;
      const matchesSearch = !moduleSearch || 
        mod.name.toLowerCase().includes(moduleSearch.toLowerCase()) || 
        mod.description.toLowerCase().includes(moduleSearch.toLowerCase()) ||
        mod.category.toLowerCase().includes(moduleSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, moduleSearch]);

  const summary = useMemo(() => getPermissionSummary(permissions), [permissions]);

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter the team member's full name.");
      setActiveTab("profile");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      setActiveTab("profile");
      return;
    }

    try {
      setIsSubmitting(true);
      const memberPayload = {
        ...(member || {}),
        id: member?.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        department: department.trim(),
        role: role.trim() || "Staff",
        status: status,
        permissions: permissions,
        notes: inviteNote.trim(),
        sendInviteEmail: sendInviteEmail,
        isArchived: status === "Archived"
      };

      if (onSaveMember) {
        await onSaveMember(memberPayload);
      }
      onClose();
    } catch (err) {
      console.error("Save team member failed:", err);
      setErrorMessage(err.message || "Failed to save team member. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in select-none">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-3xl md:max-w-4xl lg:max-w-4xl xl:max-w-5xl bg-white shadow-2xl flex flex-col border-l border-slate-100 transform transition-transform ease-in-out duration-300">
          
          {/* Header */}
          <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {member ? `Edit ${member.name || 'Team Member'}` : "Invite New Team Member"}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {member ? "Manage roles and granular module permissions" : `Assign access permissions for ${eventTitle}`}
              </p>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </header>

          {/* Navigation Sub-Tabs */}
          <div className="px-6 border-b border-slate-100 bg-white flex items-center justify-between">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("permissions")}
                className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "permissions"
                    ? "border-blue-600 text-blue-600 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <ShieldCheck size={14} />
                <span>Module Permissions</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold">
                  {summary.totalAssigned}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "profile"
                    ? "border-blue-600 text-blue-600 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <User size={14} />
                <span>Profile & Contact</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("invite")}
                className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "invite"
                    ? "border-blue-600 text-blue-600 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Send size={14} />
                <span>Invite & Onboarding</span>
              </button>
            </div>

            {/* Quick Pill Indicator */}
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                {summary.editorCount} Editor
              </span>
              <span className="flex items-center gap-1 text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                {summary.viewerCount} Viewer
              </span>
            </div>
          </div>

          {/* Form / Content Area */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 font-semibold">
                <ShieldAlert size={16} className="text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: MODULE PERMISSIONS & ROLE PRESETS */}
            {activeTab === "permissions" && (
              <div className="flex flex-col gap-6">
                
                {/* 1. Quick Role Presets Grid */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={13} className="text-blue-600" />
                      <span>Role Preset Quick-Select</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Click to auto-configure module permissions</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ROLE_PRESETS.map((preset) => {
                      const isSelected = selectedPreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset.id)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isSelected 
                              ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 shadow-xs" 
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={`text-[11px] font-extrabold leading-snug ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                              {preset.title}
                            </span>
                            {isSelected && <CheckCircle2 size={13} className="text-blue-600 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed font-normal">
                            {preset.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Batch Actions & Filter Bar */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <span className="text-[11px] font-bold text-slate-500 shrink-0">Batch Set:</span>
                    <button
                      type="button"
                      onClick={() => handleGrantAll("editor")}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer"
                    >
                      All Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGrantAll("viewer")}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-sky-100/80 text-sky-800 hover:bg-sky-200 transition-colors cursor-pointer"
                    >
                      All Viewer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGrantAll("none")}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Search box inside matrix */}
                  <div className="relative w-full sm:w-56">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={moduleSearch}
                      onChange={(e) => setModuleSearch(e.target.value)}
                      placeholder="Search modules..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* 3. Category Filter Tabs (Wrap naturally without clipping) */}
                <div className="flex flex-wrap items-center gap-2">
                  {MODULE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryFilter(cat.id === "all" ? "all" : cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        (categoryFilter === "all" && cat.id === "all") || categoryFilter === cat.id
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* 4. Granular Module Permission Rows */}
                <div className="flex flex-col gap-2.5">
                  {filteredModules.map((mod) => {
                    const currentLevel = permissions[mod.id] || "none";
                    const IconComp = ICON_COMPONENTS[mod.icon] || LayoutDashboard;

                    return (
                      <div
                        key={mod.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          currentLevel === "editor"
                            ? "bg-emerald-50/30 border-emerald-200/80"
                            : currentLevel === "viewer"
                            ? "bg-sky-50/30 border-sky-200/80"
                            : "bg-white border-slate-200/90"
                        }`}
                      >
                        {/* Module Info */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            currentLevel === "editor" 
                              ? "bg-emerald-100 text-emerald-800" 
                              : currentLevel === "viewer"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            <IconComp size={16} />
                          </div>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-extrabold text-slate-800 truncate">
                                {mod.name}
                              </span>
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase tracking-wide">
                                {mod.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-normal leading-relaxed mt-0.5">
                              {mod.description}
                            </p>
                          </div>
                        </div>

                        {/* 3-Way Segmented Control */}
                        <div className="inline-flex p-1 bg-slate-100 rounded-xl shrink-0 self-end sm:self-auto border border-slate-200/60">
                          <button
                            type="button"
                            onClick={() => handleSetModulePermission(mod.id, "none")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              currentLevel === "none"
                                ? "bg-white text-slate-700 shadow-xs"
                                : "text-slate-400 hover:text-slate-600"
                            }`}
                          >
                            No Access
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetModulePermission(mod.id, "viewer")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              currentLevel === "viewer"
                                ? "bg-sky-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-sky-700"
                            }`}
                          >
                            <Eye size={11} />
                            <span>Viewer</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetModulePermission(mod.id, "editor")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              currentLevel === "editor"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-emerald-700"
                            }`}
                          >
                            <Pencil size={11} />
                            <span>Editor</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* TAB 2: PROFILE & CONTACT DETAILS */}
            {activeTab === "profile" && (
              <div className="flex flex-col gap-5">
                
                {/* Full Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sarah Connor"
                        className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="sarah@eventzone.io"
                        className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Phone & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Phone Number (Optional)
                    </label>
                    <CountryPhoneInput
                      value={phone}
                      onChange={setPhone}
                      placeholder="555 123 456"
                      defaultCountry="DZ"
                      className="w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Department / Operations Area
                    </label>
                    <SearchableSelect
                      value={department}
                      onChange={(val) => setDepartment(val)}
                      options={DEPARTMENT_SUGGESTIONS.map(d => ({ value: d, label: d }))}
                      placeholder="-- Select Department --"
                      searchPlaceholder="Search department..."
                    />
                  </div>
                </div>

                {/* Display Role & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Display Role / Job Title
                    </label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Stage Manager, Desk Supervisor"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Membership Status
                    </label>
                    <SearchableSelect
                      value={status}
                      onChange={(val) => setStatus(val)}
                      options={[
                        { value: "Active", label: "Active Member" },
                        { value: "Pending Invite", label: "Pending Invite / Email Sent" },
                        { value: "Archived", label: "Archived / Inactive" }
                      ]}
                      placeholder="-- Select Status --"
                      isClearable={false}
                    />
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: INVITATION & ONBOARDING */}
            {activeTab === "invite" && (
              <div className="flex flex-col gap-5">
                
                {/* Email Invite Checkbox */}
                <label className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={sendInviteEmail}
                    onChange={(e) => setSendInviteEmail(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">
                      Send Invitation Email with Platform Access Link
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal mt-0.5">
                      The team member will receive an automated invitation to collaborate on {eventTitle} with their assigned permissions.
                    </span>
                  </div>
                </label>

                {/* Custom Note */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Personalized Welcome Note & Instructions (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={inviteNote}
                    onChange={(e) => setInviteNote(e.target.value)}
                    placeholder="e.g. Welcome to the team! You have been assigned to coordinate registration and attendee check-in at Gate 2. Please review the attendee list before Monday."
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 resize-none"
                  />
                </div>

                {/* Permission Summary Card */}
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex flex-col gap-2">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Info size={14} className="text-blue-600" />
                    <span>Summary of Granted Permissions</span>
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center mt-1">
                    <div className="p-2 bg-white rounded-xl border border-blue-100/60">
                      <div className="text-base font-extrabold text-slate-800">{summary.totalAssigned}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Assigned Modules</div>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-emerald-100">
                      <div className="text-base font-extrabold text-emerald-600">{summary.editorCount}</div>
                      <div className="text-[10px] font-bold text-emerald-600 uppercase">Editor (Full Access)</div>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-sky-100">
                      <div className="text-base font-extrabold text-sky-600">{summary.viewerCount}</div>
                      <div className="text-[10px] font-bold text-sky-600 uppercase">Viewer (Read-Only)</div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Sticky Action Footer */}
            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-100 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving Permissions...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>{member ? "Save Member Permissions" : "Send Invite & Grant Access"}</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
