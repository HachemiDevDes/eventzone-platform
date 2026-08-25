/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, UserCheck, ShieldCheck, ShieldAlert, Plus, Search, Filter,
  Mail, Phone, Building2, Eye, Pencil, Trash2, Archive, RotateCcw,
  CheckCircle2, Clock, Sparkles, ChevronDown, Check, X, AlertCircle,
  Layers, ExternalLink, Play, LogOut, Copy, Send
} from "lucide-react";
import { useLanguage } from "../lib/i18n";
import { EVENT_MODULES, ROLE_PRESETS, getPermissionSummary } from "../lib/permissions";
import SearchableSelect from "./SearchableSelect";

export default function TeamView({
  state,
  onUpdateState,
  onOpenModal,
  onSwitchView,
  simulatedMemberId = null,
  onSimulateMember = () => {}
}) {
  const { t } = useLanguage();
  const { team = [], eventDetails = {} } = state;

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusTab, setStatusTab] = useState("all"); // 'all' | 'active' | 'pending' | 'archived'
  
  // Selected Member for Permission Matrix Modal
  const [matrixMember, setMatrixMember] = useState(null);
  const [copiedInviteId, setCopiedInviteId] = useState(null);

  // Status Handlers
  const handleArchive = (id) => {
    if (confirm("Archive this team member? Their access will be paused but records preserved.")) {
      const updated = team.map(t => t.id === id ? { ...t, status: 'Archived', isArchived: true } : t);
      onUpdateState("team", updated);
    }
  };

  const handleRestore = (id) => {
    const updated = team.map(t => t.id === id ? { ...t, status: 'Active', isArchived: false } : t);
    onUpdateState("team", updated);
  };

  const handleDelete = (id) => {
    if (confirm("Permanently remove this team member?")) {
      const updated = team.filter(t => t.id !== id);
      onUpdateState("team", updated);
    }
  };

  const handleCopyInvite = (member) => {
    const inviteLink = `${window.location.origin}/?eventId=${eventDetails?.id || state.activeEventId || 'default'}&inviteToken=${member.id}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedInviteId(member.id);
    setTimeout(() => setCopiedInviteId(null), 2500);
  };

  // KPIs
  const activeCount = team.filter(m => !m.isArchived && m.status !== 'Archived' && m.status !== 'Pending Invite').length;
  const pendingCount = team.filter(m => !m.isArchived && m.status === 'Pending Invite').length;
  const archivedCount = team.filter(m => m.isArchived || m.status === 'Archived').length;
  const adminCount = team.filter(m => !m.isArchived && (m.role?.toLowerCase().includes('admin') || m.role?.toLowerCase().includes('organizer'))).length;

  // Filter Options for SearchableSelect
  const roleOptions = useMemo(() => {
    const uniqueRoles = Array.from(new Set(team.map(m => m.role).filter(Boolean)));
    return [
      { value: "all", label: "All Roles" },
      ...uniqueRoles.map(r => ({ value: r, label: r }))
    ];
  }, [team]);

  const moduleOptions = useMemo(() => {
    return [
      { value: "all", label: "All Modules" },
      ...EVENT_MODULES.map(m => ({ value: m.id, label: `Access to ${m.name}` }))
    ];
  }, []);

  // Filtered Team List
  const filteredTeam = useMemo(() => {
    return team.filter(m => {
      const isArchived = m.isArchived || m.status === 'Archived';
      const isPending = m.status === 'Pending Invite';

      // Status Tab filter
      if (statusTab === 'active' && (isArchived || isPending)) return false;
      if (statusTab === 'pending' && (!isPending || isArchived)) return false;
      if (statusTab === 'archived' && !isArchived) return false;

      // Text Search
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesName = (m.name || '').toLowerCase().includes(query);
        const matchesEmail = (m.email || '').toLowerCase().includes(query);
        const matchesDept = (m.department || '').toLowerCase().includes(query);
        const matchesRole = (m.role || '').toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesDept && !matchesRole) return false;
      }

      // Role Filter
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;

      // Module Filter
      if (moduleFilter !== 'all') {
        const perm = (m.permissions || {})[moduleFilter];
        const isMemberAdmin = (m.role || '').toLowerCase() === 'admin';
        if (!isMemberAdmin && (!perm || perm === 'none')) return false;
      }

      return true;
    });
  }, [team, statusTab, searchTerm, roleFilter, moduleFilter]);

  // Color generator for avatar initials
  const getAvatarGradient = (name = "") => {
    const gradients = [
      "from-blue-600 to-indigo-600",
      "from-blue-500 to-cyan-600",
      "from-emerald-500 to-teal-600",
      "from-amber-500 to-orange-600",
      "from-rose-500 to-pink-600",
      "from-blue-500 to-cyan-600"
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return gradients[sum % gradients.length];
  };

  const getInitials = (name = "") => {
    if (!name) return "TM";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in select-none">
      
      {/* Simulation Banner */}
      {simulatedMemberId && (
        <div className="bg-amber-500 text-white px-5 py-3 rounded-2xl shadow-md flex items-center justify-between animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Play size={16} />
            </div>
            <div>
              <p className="text-xs font-extrabold tracking-wide uppercase">
                Role Simulation Active
              </p>
              <p className="text-xs opacity-95">
                You are previewing the platform as <strong>{team.find(m => m.id === simulatedMemberId)?.name || 'Simulated Member'}</strong> ({team.find(m => m.id === simulatedMemberId)?.role}).
              </p>
            </div>
          </div>

          <button
            onClick={() => onSimulateMember(null)}
            className="px-3.5 py-1.5 bg-white text-amber-900 hover:bg-amber-50 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <LogOut size={13} />
            <span>Exit Simulation</span>
          </button>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Event Team</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-black border border-blue-100">
              {team.length} Members
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Invite organizers and staff, assign modules, and customize granular viewer vs editor permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Role Simulator Selector */}
          {team.length > 0 && (
            <div className="hidden lg:flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 pl-2 flex items-center gap-1">
                <Play size={12} className="text-blue-600" />
                <span>Simulate View:</span>
              </span>
              <select
                value={simulatedMemberId || ""}
                onChange={(e) => onSimulateMember(e.target.value ? e.target.value : null)}
                className="bg-white border border-slate-200 rounded-xl text-xs font-bold py-1.5 px-3 text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer shadow-xs"
              >
                <option value="">Full Admin (Default)</option>
                {team.filter(m => !m.isArchived).map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role || 'Staff'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button 
            onClick={() => onOpenModal("team")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition-all hover:shadow-md hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer shadow-xs shadow-blue-100"
          >
            <Plus size={16} />
            <span>Add Member</span>
          </button>
        </div>
      </header>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Users size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-slate-800 leading-tight">{team.length}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Roster</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <UserCheck size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-emerald-700 leading-tight">{activeCount}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Active Staff</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-amber-700 leading-tight">{pendingCount}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Pending Invites</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-purple-700 leading-tight">{adminCount}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Co-Organizers</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto scrollbar-none">
          <button
            onClick={() => setStatusTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusTab === "all" ? "bg-white text-slate-900 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All ({team.length})
          </button>
          <button
            onClick={() => setStatusTab("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusTab === "active" ? "bg-white text-emerald-700 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusTab("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusTab === "pending" ? "bg-white text-amber-700 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusTab("archived")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusTab === "archived" ? "bg-white text-slate-700 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Archived ({archivedCount})
          </button>
        </div>

        {/* Dropdowns and Search */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search member, email..."
              className="w-full pl-8.5 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/50"
            />
          </div>

          {/* Role Filter using SearchableSelect */}
          <div className="w-full sm:w-44">
            <SearchableSelect
              value={roleFilter}
              onChange={(val) => setRoleFilter(val || "all")}
              options={roleOptions}
              placeholder="All Roles"
              searchPlaceholder="Filter role..."
              isClearable={false}
            />
          </div>

          {/* Module Filter using SearchableSelect */}
          <div className="w-full sm:w-48">
            <SearchableSelect
              value={moduleFilter}
              onChange={(val) => setModuleFilter(val || "all")}
              options={moduleOptions}
              placeholder="Filter by Module"
              searchPlaceholder="Filter module..."
              isClearable={false}
            />
          </div>
        </div>

      </div>

      {/* Team Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left text-xs font-semibold text-slate-700">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider select-none">
                <th className="py-4 px-6">Member & Department</th>
                <th className="py-4 px-6">Role / Title</th>
                <th className="py-4 px-6">Email & Contact</th>
                <th className="py-4 px-6">Assigned Modules & Permissions</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeam.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Users size={26} />
                      </div>
                      <p className="text-sm font-bold text-slate-800">No team members found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {searchTerm || roleFilter !== "all" || moduleFilter !== "all"
                          ? "Try adjusting your filters or search terms."
                          : "Invite your organizers, registration desk staff, and coordinators to start collaborating."}
                      </p>
                      <button
                        onClick={() => onOpenModal("team")}
                        className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        + Add Member
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTeam.map(member => {
                  const isArchived = member.status === 'Archived' || member.isArchived;
                  const isPending = member.status === 'Pending Invite';
                  const summary = getPermissionSummary(member.permissions || {});
                  const isMemberAdmin = (member.role || '').toLowerCase().includes('admin') || (member.role || '').toLowerCase().includes('organizer');

                  // Extract sample assigned module badges
                  const assignedModuleKeys = Object.entries(member.permissions || {})
                    .filter(([_, level]) => level === 'editor' || level === 'viewer');

                  return (
                    <tr 
                      key={member.id} 
                      className={`hover:bg-slate-50/60 transition-colors duration-150 ${
                        isArchived ? 'opacity-65 bg-slate-50/40' : ''
                      }`}
                    >
                      {/* Member & Department */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${getAvatarGradient(member.name)} text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0`}>
                            {getInitials(member.name)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-extrabold text-slate-900 text-xs truncate">
                              {member.name || "Unnamed Member"}
                            </span>
                            {member.department ? (
                              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                <Building2 size={10} />
                                <span className="truncate">{member.department}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-normal mt-0.5">General Staff</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role / Title */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                          isMemberAdmin
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {isMemberAdmin && <Sparkles size={11} className="text-purple-600" />}
                          <span>{member.role || "Staff"}</span>
                        </span>
                      </td>

                      {/* Email & Contact */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-slate-600 font-medium text-xs truncate flex items-center gap-1.5">
                            <Mail size={12} className="text-slate-400" />
                            <span>{member.email}</span>
                          </span>
                          {member.phone && (
                            <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1.5 mt-0.5">
                              <Phone size={10} />
                              <span>{member.phone}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Assigned Modules & Permissions */}
                      <td className="py-4 px-6">
                        {isMemberAdmin ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200 flex items-center gap-1">
                              <ShieldCheck size={11} />
                              <span>All 19 Modules (Editor)</span>
                            </span>
                          </div>
                        ) : assignedModuleKeys.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">No modules assigned</span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                            {assignedModuleKeys.slice(0, 3).map(([modId, level]) => {
                              const modDef = EVENT_MODULES.find(m => m.id === modId);
                              const modName = modDef?.name || modId;
                              const isEditor = level === 'editor';
                              return (
                                <span
                                  key={modId}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                    isEditor
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-sky-50 text-sky-700 border-sky-200"
                                  }`}
                                  title={`${modName} - ${isEditor ? 'Editor' : 'Viewer'}`}
                                >
                                  {isEditor ? <Pencil size={9} /> : <Eye size={9} />}
                                  <span className="max-w-[90px] truncate">{modName}</span>
                                </span>
                              );
                            })}

                            {assignedModuleKeys.length > 3 && (
                              <button
                                onClick={() => setMatrixMember(member)}
                                className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                +{assignedModuleKeys.length - 3} more
                              </button>
                            )}

                            <button
                              onClick={() => setMatrixMember(member)}
                              className="ml-1 text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                            >
                              Matrix
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${
                          isArchived 
                            ? 'bg-slate-200 text-slate-600' 
                            : isPending
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isArchived ? 'bg-slate-400' : isPending ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}></span>
                          <span>{isArchived ? 'ARCHIVED' : isPending ? 'INVITED' : 'ACTIVE'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isArchived && (
                            <>
                              <button 
                                onClick={() => onOpenModal("team", member)}
                                className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                title="Edit Member Permissions"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleCopyInvite(member)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                                title="Copy Magic Invite Link"
                              >
                                {copiedInviteId === member.id ? (
                                  <Check size={13} className="text-emerald-600" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>

                              <button
                                onClick={() => onSimulateMember(member.id)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                                title="Simulate / Test This Role"
                              >
                                <Play size={13} />
                              </button>
                            </>
                          )}

                          {isArchived ? (
                            <button 
                              onClick={() => handleRestore(member.id)}
                              className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Restore Member"
                            >
                              <RotateCcw size={11} />
                              <span>Restore</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleArchive(member.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Archive Member"
                            >
                              <Archive size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Breakdown Modal Matrix Popover */}
      {matrixMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full max-h-[85vh] flex flex-col gap-4 shadow-2xl border border-slate-100 animate-scale-up">
            
            <header className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(matrixMember.name)} text-white flex items-center justify-center font-bold text-sm shadow-xs`}>
                  {getInitials(matrixMember.name)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {matrixMember.name} • Permissions Matrix
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {matrixMember.role || "Staff"} • {matrixMember.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setMatrixMember(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </header>

            {/* Matrix Table */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
              {EVENT_MODULES.map(mod => {
                const isMemberAdmin = (matrixMember.role || '').toLowerCase().includes('admin');
                const level = isMemberAdmin ? 'editor' : (matrixMember.permissions || {})[mod.id] || 'none';
                return (
                  <div 
                    key={mod.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                      level === 'editor'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : level === 'viewer'
                        ? 'bg-sky-50/40 border-sky-200'
                        : 'bg-slate-50/40 border-slate-200/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-bold text-slate-800 truncate">{mod.name}</span>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase">{mod.category}</span>
                    </div>

                    <div>
                      {level === 'editor' ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                          <Pencil size={10} />
                          <span>Editor</span>
                        </span>
                      ) : level === 'viewer' ? (
                        <span className="px-2.5 py-1 rounded-lg bg-sky-600 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                          <Eye size={10} />
                          <span>Viewer</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-200 text-slate-500 text-[10px] font-bold">
                          No Access
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <footer className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const target = matrixMember;
                  setMatrixMember(null);
                  onOpenModal("team", target);
                }}
                className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Modify Permissions
              </button>

              <button
                onClick={() => setMatrixMember(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </footer>

          </div>
        </div>
      )}

    </div>
  );
}
