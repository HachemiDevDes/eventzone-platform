/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo } from "react";
import {
  Users, Smartphone, Shield, ShieldAlert, ShieldCheck, CheckCircle2,
  Calendar, Clock, DollarSign, Search, Filter, RefreshCw, Plus,
  Check, X, Copy, Trash2, Edit3, ChevronRight, User, Mail, Phone,
  Sparkles, ExternalLink, Sliders, AlertCircle, ArrowUpRight,
  CreditCard, Tag, TrendingUp, Award, Layers, Zap
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { COUNTRY_CITIES_MAP } from "../lib/formPresets";
import {
  updateUserProfileSubscription,
  updateUserProfileRoleAndAdmin,
  createPromoCodeAdmin,
  togglePromoCodeStatusAdmin,
  deletePromoCodeAdmin,
} from "../lib/db";

const ALGERIA_WILAYAS = COUNTRY_CITIES_MAP["Algeria"] || [];

const ROLE_OPTIONS = [
  { value: "All", label: "All User Roles" },
  { value: "attendee", label: "Attendees" },
  { value: "organizer", label: "Organizers" },
  { value: "speaker", label: "Speakers" },
  { value: "super_admin", label: "Super Admins" },
];

const SUB_STATUS_OPTIONS = [
  { value: "All", label: "All Subscription Statuses" },
  { value: "active", label: "🟢 Active Subscription" },
  { value: "trial", label: "🟡 In 15-Day Free Trial" },
  { value: "expired", label: "🔴 Expired / Free Tier" },
];

const SUBSCRIPTION_TIERS = [
  { value: "Pro", label: "Pro Plan" },
  { value: "VIP", label: "VIP Plan" },
  { value: "Enterprise", label: "Enterprise Plan" },
];

export default function AppOperationsSection({
  appUsers = [],
  promoCodes = [],
  payments = [],
  onRefresh,
  showToast,
  currentUser,
}) {
  const [activeSubTab, setActiveSubTab] = useState("users"); // 'users', 'subscriptions', 'payments', 'promos'
  const [isProcessing, setIsProcessing] = useState(false);

  // Search & Filter state for Users
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  const [userSubFilter, setUserSubFilter] = useState("All");
  const [userWilayaFilter, setUserWilayaFilter] = useState("All");

  // Selected user for Slide-out Drawer
  const [selectedUserForDrawer, setSelectedUserForDrawer] = useState(null);

  // Subscription modal state
  const [subModalUser, setSubModalUser] = useState(null);
  const [subModalDaysToAdd, setSubModalDaysToAdd] = useState("30");
  const [subModalTier, setSubModalTier] = useState("Pro");
  const [subModalCustomDate, setSubModalCustomDate] = useState("");

  // Promo Code modal state
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDiscount, setNewPromoDiscount] = useState("20");

  // Payment search & filters
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("All");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("All");

  // Copy feedback state
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─────────────────────────────────────────────
  //  METRICS COMPUTATION
  // ─────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalUsers = appUsers.length;
    let activeSubs = 0;
    let trialUsers = 0;
    let expiredUsers = 0;
    let adminCount = 0;

    appUsers.forEach((u) => {
      if (u.subscriptionStatus === "active") activeSubs++;
      else if (u.subscriptionStatus === "trial") trialUsers++;
      else expiredUsers++;

      if (u.is_admin) adminCount++;
    });

    const activeCodes = promoCodes.filter((c) => c.is_active).length;
    const totalPromoRedemptions = promoCodes.reduce((sum, c) => sum + (c.times_used || 0), 0);

    return {
      totalUsers,
      activeSubs,
      trialUsers,
      expiredUsers,
      adminCount,
      activeCodes,
      totalPromoRedemptions,
      conversionRate: totalUsers > 0 ? Math.round((activeSubs / totalUsers) * 100) : 0,
    };
  }, [appUsers, promoCodes]);

  // ─────────────────────────────────────────────
  //  FILTERED USERS
  // ─────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    return appUsers.filter((user) => {
      if (userRoleFilter !== "All" && (user.role || "attendee") !== userRoleFilter) {
        return false;
      }
      if (userSubFilter !== "All" && user.subscriptionStatus !== userSubFilter) {
        return false;
      }
      if (userWilayaFilter !== "All" && user.location !== userWilayaFilter) {
        return false;
      }

      if (userSearch.trim()) {
        const q = userSearch.toLowerCase().trim();
        const name = (user.full_name || "").toLowerCase();
        const email = (user.email || "").toLowerCase();
        const phone = (user.phone || "").toLowerCase();
        const company = (user.company_name || user.company || "").toLowerCase();
        const title = (user.job_title || "").toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          company.includes(q) ||
          title.includes(q)
        );
      }
      return true;
    });
  }, [appUsers, userSearch, userRoleFilter, userSubFilter, userWilayaFilter]);

  // ─────────────────────────────────────────────
  //  FILTERED PAYMENTS
  // ─────────────────────────────────────────────
  const filteredPayments = useMemo(() => {
    return (payments || []).filter((p) => {
      const status = (p.status || "").toLowerCase();
      const method = (p.payment_method || "").toLowerCase();

      if (paymentStatusFilter !== "All" && status !== paymentStatusFilter.toLowerCase()) {
        return false;
      }
      if (paymentMethodFilter !== "All" && !method.includes(paymentMethodFilter.toLowerCase())) {
        return false;
      }

      if (paymentSearch.trim()) {
        const q = paymentSearch.toLowerCase().trim();
        const name = (p.customer_name || "").toLowerCase();
        const email = (p.customer_email || "").toLowerCase();
        const phone = (p.customer_phone || "").toLowerCase();
        const chkId = (p.chargily_checkout_id || "").toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q) || chkId.includes(q);
      }
      return true;
    });
  }, [payments, paymentSearch, paymentStatusFilter, paymentMethodFilter]);

  // ─────────────────────────────────────────────
  //  SUBSCRIPTION ACTIONS
  // ─────────────────────────────────────────────
  const handleOpenSubModal = (user) => {
    setSubModalUser(user);
    setSubModalDaysToAdd("30");
    setSubModalTier("Pro");
    setSubModalCustomDate("");
  };

  const handleSaveSubscription = async (isRevoking = false) => {
    if (!subModalUser) return;
    setIsProcessing(true);

    try {
      let res;
      if (isRevoking) {
        if (!confirm(`Are you sure you want to revoke ${subModalUser.full_name}'s subscription?`)) {
          setIsProcessing(false);
          return;
        }
        res = await updateUserProfileSubscription(subModalUser.id, {
          customEndDate: new Date(Date.now() - 1000).toISOString(),
          tier: subModalTier,
        });
      } else if (subModalCustomDate) {
        res = await updateUserProfileSubscription(subModalUser.id, {
          customEndDate: subModalCustomDate,
          tier: subModalTier,
        });
      } else {
        const days = parseInt(subModalDaysToAdd, 10) || 30;
        res = await updateUserProfileSubscription(subModalUser.id, {
          daysToAdd: days,
          tier: subModalTier,
        });
      }

      if (res.success) {
        showToast?.(`Subscription updated for ${subModalUser.full_name}`);
        setSubModalUser(null);
        onRefresh?.();
      } else {
        showToast?.(res.error || "Failed to update subscription", "error");
      }
    } catch (err) {
      showToast?.(err.message || "Failed to update subscription", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ─────────────────────────────────────────────
  //  TOGGLE ADMIN ACCESS
  // ─────────────────────────────────────────────
  const handleToggleAdmin = async (user) => {
    const targetStatus = !user.is_admin;
    const confirmMsg = targetStatus
      ? `Promote ${user.full_name} (${user.email}) to App Administrator?`
      : `Revoke Administrator privileges from ${user.full_name}?`;

    if (!confirm(confirmMsg)) return;
    setIsProcessing(true);

    try {
      const res = await updateUserProfileRoleAndAdmin(user.id, { isAdmin: targetStatus });
      if (res.success) {
        showToast?.(`${user.full_name} is now ${targetStatus ? "an Administrator" : "a standard user"}`);
        onRefresh?.();
      } else {
        showToast?.(res.error || "Failed to update admin role", "error");
      }
    } catch (err) {
      showToast?.(err.message || "Error changing admin status", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ─────────────────────────────────────────────
  //  PROMO CODE HANDLERS
  // ─────────────────────────────────────────────
  const handleCreatePromoCode = async (e) => {
    e.preventDefault();
    if (!newPromoCode.trim()) return;

    setIsProcessing(true);
    try {
      const res = await createPromoCodeAdmin({
        code: newPromoCode,
        discountPercentage: newPromoDiscount,
      });

      if (res.success) {
        showToast?.(`Promo code ${newPromoCode.toUpperCase()} created successfully`);
        setNewPromoCode("");
        setNewPromoDiscount("20");
        setShowPromoModal(false);
        onRefresh?.();
      } else {
        showToast?.(res.error || "Failed to create promo code", "error");
      }
    } catch (err) {
      showToast?.(err.message || "Error creating promo code", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePromoStatus = async (promo) => {
    try {
      const res = await togglePromoCodeStatusAdmin(promo.id, promo.is_active);
      if (res.success) {
        showToast?.(`Code ${promo.code} is now ${!promo.is_active ? "Active" : "Inactive"}`);
        onRefresh?.();
      } else {
        showToast?.(res.error || "Failed to update code", "error");
      }
    } catch (err) {
      showToast?.(err.message || "Error updating code", "error");
    }
  };

  const handleDeletePromo = async (promo) => {
    if (!confirm(`Delete promo code ${promo.code}? This cannot be undone.`)) return;
    try {
      const res = await deletePromoCodeAdmin(promo.id);
      if (res.success) {
        showToast?.(`Promo code ${promo.code} deleted`);
        onRefresh?.();
      } else {
        showToast?.(res.error || "Failed to delete code", "error");
      }
    } catch (err) {
      showToast?.(err.message || "Error deleting code", "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────
          SECTION HEADER
      ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              Mobile App Operations &amp; Subscriptions
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Live Sync
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive attendee management, 15-day free trials, paid subscription grants, and mobile promo codes.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Live DB</span>
          </button>
          <button
            onClick={() => setShowPromoModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Promo Code</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          TOP TELEMETRY CARDS
      ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Registered App Users</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{metrics.totalUsers}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-500" />
            <span>{metrics.adminCount} administrators</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Subscriptions</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{metrics.activeSubs}</div>
          <div className="text-[10px] text-emerald-700 mt-1 font-bold">
            {metrics.conversionRate}% active paid conversion
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">15-Day Free Trials</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{metrics.trialUsers}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Currently within trial window</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expired / Free Tier</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-700 mt-2">{metrics.expiredUsers}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Requires renewal / upgrade</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Promo Codes</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">{metrics.activeCodes} Active</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">
            {metrics.totalPromoRedemptions} total redemptions
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          SUB-NAVIGATION TABS
      ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab("users")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "users"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>App Users &amp; Attendees</span>
          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
            activeSubTab === "users" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
          }`}>
            {appUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("subscriptions")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "subscriptions"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Subscriptions &amp; Trials</span>
          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
            activeSubTab === "subscriptions" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
          }`}>
            {metrics.activeSubs + metrics.trialUsers}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("payments")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "payments"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payments &amp; Transactions</span>
          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
            activeSubTab === "payments" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
          }`}>
            {payments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("promos")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "promos"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Mobile Promo Codes</span>
          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
            activeSubTab === "promos" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
          }`}>
            {promoCodes.length}
          </span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════
          TAB 1: APP USERS & ATTENDEES
      ═════════════════════════════════════════════ */}
      {activeSubTab === "users" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search attendees by name, email, company, job title, phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
              />
              {userSearch && (
                <button
                  onClick={() => setUserSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              {/* Role filter */}
              <div className="w-36">
                <SearchableSelect
                  value={userRoleFilter}
                  onChange={setUserRoleFilter}
                  options={ROLE_OPTIONS}
                  isClearable={false}
                  showSearch={false}
                  buttonClassName="bg-slate-50! border-slate-200! text-slate-800! text-xs! font-bold! rounded-xl! py-2!"
                />
              </div>

              {/* Subscription filter */}
              <div className="w-44">
                <SearchableSelect
                  value={userSubFilter}
                  onChange={setUserSubFilter}
                  options={SUB_STATUS_OPTIONS}
                  isClearable={false}
                  showSearch={false}
                  buttonClassName="bg-slate-50! border-slate-200! text-slate-800! text-xs! font-bold! rounded-xl! py-2!"
                />
              </div>

              {/* Wilaya Filter */}
              <div className="w-40">
                <SearchableSelect
                  value={userWilayaFilter}
                  onChange={setUserWilayaFilter}
                  options={[{ value: "All", label: "All Wilayas" }, ...ALGERIA_WILAYAS.map((w) => ({ value: w, label: w }))]}
                  isClearable={false}
                  searchPlaceholder="Filter Wilaya..."
                  buttonClassName="bg-slate-50! border-slate-200! text-slate-800! text-xs! font-bold! rounded-xl! py-2!"
                />
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">User / Attendee</th>
                    <th className="py-3 px-4">Role &amp; Privileges</th>
                    <th className="py-3 px-4">Company &amp; Title</th>
                    <th className="py-3 px-4">Subscription Status</th>
                    <th className="py-3 px-4">Joined</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No registered app users found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSubActive = user.subscriptionStatus === "active";
                      const isSubTrial = user.subscriptionStatus === "trial";

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* User Avatar + Name + Email */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {user.avatar_url ? (
                                <img
                                  src={user.avatar_url}
                                  alt={user.full_name || "Avatar"}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center text-xs">
                                  {(user.full_name || user.email || "U").slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{user.full_name || "Unnamed Attendee"}</span>
                                  {user.is_admin && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 text-[9px] font-black uppercase">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                  <span>{user.email}</span>
                                  <button
                                    onClick={() => handleCopy(user.email, user.id + "-email")}
                                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                  >
                                    {copiedId === user.id + "-email" ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                                {user.phone && (
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {user.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Role & Privileges */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                                user.role === "super_admin"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : user.role === "organizer"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : user.role === "speaker"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}>
                                {user.role || "attendee"}
                              </span>
                              {user.onboarding_completed ? (
                                <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Profile Completed
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400">Onboarding pending</div>
                              )}
                            </div>
                          </td>

                          {/* Company & Job Title */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">
                              {user.company_name || user.company || "—"}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {user.job_title || "—"}
                            </div>
                            {user.location && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                📍 {user.location}
                              </div>
                            )}
                          </td>

                          {/* Subscription Status */}
                          <td className="py-3.5 px-4">
                            {isSubActive ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Active ({user.daysRemaining}d left)
                                </span>
                                {user.subscription_end_date && (
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    Until {new Date(user.subscription_end_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ) : isSubTrial ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Sparkles className="w-3 h-3 text-amber-500" />
                                  Trial ({user.daysRemaining}d left)
                                </span>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  15-day free access
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  Expired / Free
                                </span>
                                {user.subscription_end_date && (
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    Expired {new Date(user.subscription_end_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Joined Date */}
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Manage Subscription Button */}
                              <button
                                onClick={() => handleOpenSubModal(user)}
                                title="Manage Subscription & Access"
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Zap className="w-3 h-3" />
                                <span>Extend</span>
                              </button>

                              {/* Toggle Admin */}
                              <button
                                onClick={() => handleToggleAdmin(user)}
                                title={user.is_admin ? "Revoke Admin Access" : "Promote to Admin"}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  user.is_admin
                                    ? "bg-purple-100 hover:bg-purple-200 text-purple-700"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                }`}
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </button>

                              {/* View Profile Drawer */}
                              <button
                                onClick={() => setSelectedUserForDrawer(user)}
                                title="View Complete Attendee Profile"
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                              >
                                <User className="w-3.5 h-3.5" />
                              </button>
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
        </div>
      )}

      {/* ═════════════════════════════════════════════
          TAB 2: SUBSCRIPTIONS & TRIALS
      ═════════════════════════════════════════════ */}
      {activeSubTab === "subscriptions" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Subscriptions &amp; Free Trial Tracker</h3>
            <p className="text-xs text-slate-500">
              Users with active subscriptions enjoy full mobile networking, attendee search, business card exchange, and real-time CRM syncing.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Plan Tier</th>
                    <th className="py-3 px-4">Access Status</th>
                    <th className="py-3 px-4">Days Remaining</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appUsers.map((user) => {
                    const isSubActive = user.subscriptionStatus === "active";
                    const isSubTrial = user.subscriptionStatus === "trial";

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{user.full_name || "Unnamed"}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800">
                            {isSubActive ? "Pro Plan" : isSubTrial ? "15-Day Free Trial" : "Free Tier"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {isSubActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          ) : isSubTrial ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Free Trial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Expired
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold">
                          {user.daysRemaining > 0 ? (
                            <span className={user.daysRemaining > 7 ? "text-emerald-600" : "text-amber-600"}>
                              {user.daysRemaining} days
                            </span>
                          ) : (
                            <span className="text-rose-500">0 days</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                          {user.effectiveEndDate ? new Date(user.effectiveEndDate).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenSubModal(user)}
                            className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Grant / Modify
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════
          TAB 3: PAYMENTS & TRANSACTIONS
      ═════════════════════════════════════════════ */}
      {activeSubTab === "payments" && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions by customer name, email, phone, or Chargily checkout ID..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
              />
              {paymentSearch && (
                <button
                  onClick={() => setPaymentSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="w-36">
                <SearchableSelect
                  value={paymentStatusFilter}
                  onChange={setPaymentStatusFilter}
                  options={[
                    { value: "All", label: "All Statuses" },
                    { value: "paid", label: "Paid" },
                    { value: "pending", label: "Pending" },
                    { value: "failed", label: "Failed" },
                  ]}
                  isClearable={false}
                  showSearch={false}
                  buttonClassName="bg-slate-50! border-slate-200! text-slate-800! text-xs! font-bold! rounded-xl! py-2!"
                />
              </div>

              <div className="w-36">
                <SearchableSelect
                  value={paymentMethodFilter}
                  onChange={setPaymentMethodFilter}
                  options={[
                    { value: "All", label: "All Rails" },
                    { value: "edahabia", label: "EDAHABIA" },
                    { value: "cib", label: "CIB Card" },
                  ]}
                  isClearable={false}
                  showSearch={false}
                  buttonClassName="bg-slate-50! border-slate-200! text-slate-800! text-xs! font-bold! rounded-xl! py-2!"
                />
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Transaction / Checkout ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Amount (DZD)</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => {
                      const st = (p.status || "").toLowerCase();
                      const isPaid = st === "paid";
                      const isPending = st === "pending";

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{p.chargily_checkout_id?.slice(0, 16)}...</span>
                              <button
                                onClick={() => handleCopy(p.chargily_checkout_id, p.id)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {copiedId === p.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {p.ticket_tier ? `Ticket: ${p.ticket_tier}` : "Subscription / Service"}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{p.customer_name || "Anonymous"}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{p.customer_email || "—"}</div>
                            {p.customer_phone && (
                              <div className="text-[10px] text-slate-400 font-mono">{p.customer_phone}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                            {Number(p.amount || 0).toLocaleString()} DZD
                          </td>
                          <td className="py-3.5 px-4 uppercase font-bold text-[11px]">
                            {p.payment_method ? (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {p.payment_method}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Unspecified</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                              isPaid
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : isPending
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                              {isPaid && <Check className="w-3 h-3" />}
                              <span>{p.status || "Pending"}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                            {p.created_at ? new Date(p.created_at).toLocaleString() : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════
          TAB 4: PROMO CODES
      ═════════════════════════════════════════════ */}
      {activeSubTab === "promos" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Mobile App Discount Codes</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage promo codes entered by attendees inside the mobile app to get subscription discounts.
              </p>
            </div>
            <button
              onClick={() => setShowPromoModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Promo Code</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Code Name</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Redemptions</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {promoCodes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No promo codes found. Click &quot;Create Promo Code&quot; to add your first code.
                      </td>
                    </tr>
                  ) : (
                    promoCodes.map((promo) => (
                      <tr key={promo.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                          <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                            {promo.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-emerald-600 text-xs">
                            {promo.discount_percentage}% OFF
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          {promo.times_used || 0} times
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleTogglePromoStatus(promo)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                              promo.is_active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${promo.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                            {promo.is_active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                          {promo.created_at ? new Date(promo.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeletePromo(promo)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Promo Code"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL: GRANT / EXTEND SUBSCRIPTION
      ───────────────────────────────────────────── */}
      {subModalUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Grant / Extend Subscription</h3>
                  <p className="text-xs text-slate-500">{subModalUser.full_name}</p>
                </div>
              </div>
              <button
                onClick={() => setSubModalUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Plan Tier</label>
                <SearchableSelect
                  value={subModalTier}
                  onChange={setSubModalTier}
                  options={SUBSCRIPTION_TIERS}
                  isClearable={false}
                  showSearch={false}
                  buttonClassName="bg-slate-50! border-slate-200! text-slate-900! text-xs! font-bold! rounded-xl!"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2">Quick Add Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "+7 Days", value: "7" },
                    { label: "+15 Days", value: "15" },
                    { label: "+30 Days (1mo)", value: "30" },
                    { label: "+90 Days (3mo)", value: "90" },
                    { label: "+180 Days (6mo)", value: "180" },
                    { label: "+365 Days (1yr)", value: "365" },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        setSubModalDaysToAdd(preset.value);
                        setSubModalCustomDate("");
                      }}
                      className={`py-2 px-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                        subModalDaysToAdd === preset.value && !subModalCustomDate
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Or Specific Expiration Date</label>
                <input
                  type="date"
                  value={subModalCustomDate}
                  onChange={(e) => {
                    setSubModalCustomDate(e.target.value);
                    setSubModalDaysToAdd("");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleSaveSubscription(true)}
                disabled={isProcessing}
                className="px-3 py-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Revoke Access
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSubModalUser(null)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSubscription(false)}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Confirm Access</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL: CREATE PROMO CODE
      ───────────────────────────────────────────── */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePromoCode}
            className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Create Mobile Promo Code</h3>
                  <p className="text-xs text-slate-500">Provide discounted mobile app subscriptions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPromoModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Promo Code String</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP2026, SUMMER50"
                  value={newPromoCode}
                  onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Discount Percentage (1 - 100%)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={newPromoDiscount}
                    onChange={(e) => setNewPromoDiscount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white pr-10"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPromoModal(false)}
                className="px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Create Code</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          DRAWER: COMPLETE ATTENDEE PROFILE
      ───────────────────────────────────────────── */}
      {selectedUserForDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedUserForDrawer.avatar_url ? (
                  <img
                    src={selectedUserForDrawer.avatar_url}
                    alt={selectedUserForDrawer.full_name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-2xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center text-sm">
                    {(selectedUserForDrawer.full_name || "U").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>{selectedUserForDrawer.full_name}</span>
                    {selectedUserForDrawer.is_admin && (
                      <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 text-[9px] font-black uppercase">
                        Admin
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedUserForDrawer.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForDrawer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Professional details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Professional Details</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Company / Organization</span>
                    <span className="font-bold text-slate-900">
                      {selectedUserForDrawer.company_name || selectedUserForDrawer.company || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Job Title</span>
                    <span className="font-bold text-slate-900">{selectedUserForDrawer.job_title || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                    <span className="font-mono text-slate-700">{selectedUserForDrawer.phone || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Location / Wilaya</span>
                    <span className="font-medium text-slate-700">{selectedUserForDrawer.location || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selectedUserForDrawer.bio && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs">About / Bio</h4>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedUserForDrawer.bio}</p>
                </div>
              )}

              {/* What I'm looking for */}
              {selectedUserForDrawer.what_im_looking_for && (
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                  <h4 className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>What I&apos;m Looking For</span>
                  </h4>
                  <p className="text-blue-900 leading-relaxed">{selectedUserForDrawer.what_im_looking_for}</p>
                </div>
              )}

              {/* Industries */}
              {Array.isArray(selectedUserForDrawer.industries) && selectedUserForDrawer.industries.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs">Industries &amp; Verticals</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUserForDrawer.industries.map((ind, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] font-semibold">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests */}
              {Array.isArray(selectedUserForDrawer.interests) && selectedUserForDrawer.interests.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs">Interests &amp; Topics</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUserForDrawer.interests.map((it, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                        {it}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {selectedUserForDrawer.social_links && typeof selectedUserForDrawer.social_links === "object" && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs">Social &amp; Web Links</h4>
                  <div className="space-y-1.5">
                    {Object.entries(selectedUserForDrawer.social_links).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-600 capitalize">{k}:</span>
                        <a href={String(v)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-mono">
                          <span>{String(v).slice(0, 32)}...</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedUserForDrawer(null);
                  handleOpenSubModal(selectedUserForDrawer);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Extend Subscription</span>
              </button>
              <button
                onClick={() => setSelectedUserForDrawer(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
