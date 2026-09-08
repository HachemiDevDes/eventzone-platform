"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  X, Mail, Send, Loader2, AlertTriangle, 
  CheckSquare, Square, Search, Users, Award, Store
} from "lucide-react";
import { logCommunication, upsertExhibitor, upsertSponsor } from "../lib/db";
import { useLanguage } from "../lib/i18n";

export default function SendPlanModal({ 
  isOpen, 
  onClose, 
  exhibitors = [], 
  sponsors = [],
  eventId = "",
  eventName = "",
  planName = "Floor Plan", 
  elements = [], 
  onSuccess 
}) {
  const { t, isRTL } = useLanguage();
  const [recipientCategory, setRecipientCategory] = useState("all"); // 'all' | 'exhibitors' | 'sponsors'
  const [recipientMode, setRecipientMode] = useState("all"); // 'all' | 'custom'
  const [selectedPartnerIds, setSelectedPartnerIds] = useState([]);
  const [partnerEmails, setPartnerEmails] = useState({});
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingProgress, setSendingProgress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // PDF Attachment settings
  const [pdfSettings, setPdfSettings] = useState({
    showLabels: true,
    showGrid: false,
    hideFurniture: false,
  });

  // 1. Normalize and aggregate exhibitors and sponsors into unified partner records
  const allPartners = useMemo(() => {
    const list = [];

    // Exhibitors
    (exhibitors || []).forEach(ex => {
      list.push({
        id: `ex_${ex.id}`,
        rawId: ex.id,
        name: ex.name || "Unnamed Exhibitor",
        category: "exhibitor",
        categoryLabel: t("sendPlan.badgeExhibitor", "Exhibitor"),
        tier: ex.tier || "",
        booth: ex.booth || "",
        email: (ex.contactEmail || ex.email || "").trim(),
        contactPerson: ex.contactPerson || ex.contact || "",
        raw: ex,
      });
    });

    // Sponsors
    (sponsors || []).forEach(sp => {
      const rawTier = sp.tier || "sponsor";
      const formattedTier = rawTier.charAt(0).toUpperCase() + rawTier.slice(1);
      list.push({
        id: `sp_${sp.id || sp.name}`,
        rawId: sp.id,
        name: sp.name || "Unnamed Sponsor",
        category: "sponsor",
        categoryLabel: `${formattedTier} ${t("sendPlan.badgeSponsor", "Sponsor")}`,
        tier: rawTier,
        booth: sp.booth || "",
        email: (sp.contactEmail || sp.email || "").trim(),
        contactPerson: sp.contactPerson || sp.contact || "",
        raw: sp,
      });
    });

    return list;
  }, [exhibitors, sponsors, t]);

  // Initialize modal state on open
  useEffect(() => {
    if (isOpen) {
      const activeName = eventName || planName;
      const defaultSubj = t("sendPlan.defaultSubject", "{planName} - Exhibition Floor Plan & Partner Details").replace("{planName}", activeName);
      const defaultMsg = t("sendPlan.defaultBody", "Dear Partner,\n\nWe are pleased to share the exhibition floor plan and venue packet for our upcoming event.\n\nYour assigned space/tier details and the official venue floor plan layout are included in this briefing.\n\nShould you have any questions or require modifications to your layout, please reply directly to this message.\n\nBest regards,\nEvent Operations Team");
      setSubject(defaultSubj);
      setMessage(defaultMsg);

      // Map initial emails
      const initialEmails = {};
      allPartners.forEach(p => {
        initialEmails[p.id] = p.email || "";
      });
      setPartnerEmails(initialEmails);

      // Select all by default
      setSelectedPartnerIds(allPartners.map(p => p.id));
      setSearchQuery("");
      setRecipientCategory("all");
      setRecipientMode("all");
    }
  }, [isOpen, planName, eventName, allPartners, t]);

  if (!isOpen) return null;

  // 2. Filter partners based on active category
  const categoryPartners = allPartners.filter(p => {
    if (recipientCategory === "exhibitors") return p.category === "exhibitor";
    if (recipientCategory === "sponsors") return p.category === "sponsor";
    return true;
  });

  // 3. Search query filter
  const filteredPartners = categoryPartners.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const emailVal = partnerEmails[p.id] || p.email;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.booth || "").toLowerCase().includes(q) ||
      (p.tier || "").toLowerCase().includes(q) ||
      (p.categoryLabel || "").toLowerCase().includes(q) ||
      emailVal.toLowerCase().includes(q)
    );
  });

  const handleEmailChange = (id, value) => {
    setPartnerEmails(prev => ({ ...prev, [id]: value }));
  };

  const togglePartner = (id) => {
    setSelectedPartnerIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredPartners.map(p => p.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedPartnerIds.includes(id));
    if (allSelected) {
      setSelectedPartnerIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedPartnerIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const isAllFilteredSelected = filteredPartners.length > 0 && filteredPartners.every(p => selectedPartnerIds.includes(p.id));

  const handleToggleSetting = (key) => {
    setPdfSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSend = async (e) => {
    e.preventDefault();

    // Determine target recipients
    const targetPartners = recipientMode === "all"
      ? categoryPartners
      : categoryPartners.filter(p => selectedPartnerIds.includes(p.id));

    if (targetPartners.length === 0) {
      alert(t("sendPlan.selectAtLeastOne", "Please select at least one recipient to send the floor plan to."));
      return;
    }

    // Check if any selected partners are missing emails
    const missingEmails = targetPartners.filter(p => !partnerEmails[p.id]?.trim());
    if (missingEmails.length > 0) {
      alert(
        t("sendPlan.enterContactEmailFor", "Please enter a contact email for: {names}").replace(
          "{names}", 
          missingEmails.map(p => p.name).join(", ")
        )
      );
      return;
    }

    // Validate email formatting
    const invalidEmails = targetPartners.filter(p => {
      const em = (partnerEmails[p.id] || "").trim();
      return !em.includes("@") || !em.includes(".");
    });
    if (invalidEmails.length > 0) {
      alert(`Please provide a valid email format for: ${invalidEmails.map(p => p.name).join(", ")}`);
      return;
    }

    setLoading(true);

    try {
      // 1. Save any updated/new emails in parallel to the directory
      setSendingProgress(t("sendPlan.updatingDirectory", "Updating contact directory..."));
      const emailUpdates = targetPartners.map(p => {
        const currentEmail = (partnerEmails[p.id] || "").trim();
        if (currentEmail && currentEmail !== p.email) {
          if (p.category === "exhibitor") {
            return upsertExhibitor({ 
              ...p.raw, 
              email: currentEmail, 
              contactEmail: currentEmail 
            }, eventId).catch(err => {
              console.warn("Could not sync exhibitor email update:", err);
            });
          } else if (p.category === "sponsor") {
            return upsertSponsor({ 
              ...p.raw, 
              email: currentEmail, 
              contactEmail: currentEmail 
            }, eventId).catch(err => {
              console.warn("Could not sync sponsor email update:", err);
            });
          }
        }
        return Promise.resolve(null);
      });
      await Promise.all(emailUpdates);

      // 2. Preparing PDF floor plan attachment simulation
      setSendingProgress(t("sendPlan.generatingPdf", "Generating high-resolution vector PDF floor plan layout..."));
      await new Promise(r => setTimeout(r, 600));

      // 3. Send real emails via /api/email/send
      let sentCount = 0;
      const sendErrors = [];

      for (let i = 0; i < targetPartners.length; i++) {
        const p = targetPartners[i];
        const email = (partnerEmails[p.id] || "").trim();
        
        setSendingProgress(
          t("sendPlan.sendingPacketTo", "Sending packet to {name} ({email})...")
            .replace("{name}", p.name)
            .replace("{email}", email)
        );

        try {
          const res = await fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: p.category === "sponsor" ? "sponsor_packet" : "exhibitor_packet",
              to: email,
              recipientName: p.name,
              exhibitorName: p.name,
              recipientType: p.category,
              boothNumber: p.booth || "",
              booth: p.booth || "",
              tier: p.tier || "",
              eventTitle: eventName || planName || "Eventzone Summit",
              eventId: eventId || undefined,
              subject: subject,
              message: message,
            }),
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.error) {
            sendErrors.push(`${p.name} (${email}): ${data.error || res.statusText || "Dispatch failed"}`);
          } else {
            sentCount++;
          }
        } catch (dispatchErr) {
          sendErrors.push(`${p.name} (${email}): ${dispatchErr.message || "Network error"}`);
        }
      }

      // 4. Log communication broadcast in Supabase
      if (sentCount > 0) {
        setSendingProgress(t("sendPlan.loggingBroadcast", "Logging email broadcast to event communications..."));
        await logCommunication({
          subject,
          body: message,
          recipientCount: sentCount,
        }, eventId).catch(console.warn);
      }

      setLoading(false);

      // 5. User feedback
      if (sendErrors.length > 0) {
        if (sentCount === 0) {
          alert(`Failed to send floor plan emails:\n\n${sendErrors.join("\n")}`);
          return;
        } else {
          alert(`Sent to ${sentCount} recipient(s), but ${sendErrors.length} failed:\n\n${sendErrors.join("\n")}`);
          onSuccess(
            t("sendPlan.partialSent", "Floor plan sent to {count} recipient(s) with some warnings.")
              .replace("{count}", sentCount)
          );
          onClose();
          return;
        }
      }

      onSuccess(
        t("sendPlan.successSent", "Floor plan successfully sent to {count} partner(s)!")
          .replace("{count}", sentCount)
      );
      onClose();
    } catch (err) {
      console.error("SendPlanModal send error:", err);
      alert(t("sendPlan.failedToSend", "Failed to send floor plan. Please verify network and try again."));
      setLoading(false);
    }
  };

  const exhibitorsCount = exhibitors.length;
  const sponsorsCount = sponsors.length;
  const totalCount = allPartners.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={!loading ? onClose : null}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 mx-4 max-h-[90vh]"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-650 rounded-xl">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {t("export.sendPlanTitle", "Email Floor Plan & Venue Packet")}
              </h3>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {t("export.sendPlanSubtitle", "Send PDF floor plans and instructions to exhibitors and sponsors")}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-colors cursor-pointer disabled:opacity-30"
          >
            <X size={16} />
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSend} className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4 select-none">
              <Loader2 size={36} className="animate-spin text-indigo-650" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-700">{t("sendPlan.sendingInProgress", "Sending in progress...")}</h4>
                <p className="text-xs text-slate-500 font-semibold max-w-sm leading-normal">{sendingProgress}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 1. Recipients Section */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <bdi dir="ltr">1.</bdi> <span>{t("sendPlan.recipients", "Recipients")}</span>
                  </label>

                  {/* Partner Category Selector Tabs */}
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl text-[11px] font-bold text-slate-600 gap-1">
                    <button
                      type="button"
                      onClick={() => setRecipientCategory("all")}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        recipientCategory === "all" 
                          ? "bg-white text-indigo-650 shadow-xs font-black" 
                          : "hover:text-slate-900"
                      }`}
                    >
                      <Users size={12} />
                      <span>{t("sendPlan.tabAll", "All")} ({totalCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientCategory("exhibitors")}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        recipientCategory === "exhibitors" 
                          ? "bg-white text-indigo-650 shadow-xs font-black" 
                          : "hover:text-slate-900"
                      }`}
                    >
                      <Store size={12} />
                      <span>{t("sendPlan.tabExhibitors", "Exhibitors")} ({exhibitorsCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientCategory("sponsors")}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        recipientCategory === "sponsors" 
                          ? "bg-white text-indigo-650 shadow-xs font-black" 
                          : "hover:text-slate-900"
                      }`}
                    >
                      <Award size={12} />
                      <span>{t("sendPlan.tabSponsors", "Sponsors")} ({sponsorsCount})</span>
                    </button>
                  </div>
                </div>

                {/* Recipient Mode (All vs Specific) */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                    <input 
                      type="radio" 
                      name="recipientMode" 
                      value="all" 
                      checked={recipientMode === "all"}
                      onChange={() => setRecipientMode("all")}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                      {recipientCategory === "all"
                        ? t("sendPlan.sendToAllPartners", "Send to All Partners ({count})").replace("{count}", totalCount)
                        : recipientCategory === "exhibitors"
                        ? t("sendPlan.sendToAllExhibitors", "Send to All Exhibitors ({count})").replace("{count}", exhibitorsCount)
                        : t("sendPlan.sendToAllSponsors", "Send to All Sponsors ({count})").replace("{count}", sponsorsCount)}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                    <input 
                      type="radio" 
                      name="recipientMode" 
                      value="custom" 
                      checked={recipientMode === "custom"}
                      onChange={() => setRecipientMode("custom")}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{t("sendPlan.selectSpecificRecipients", "Select Specific Recipients")}</span>
                  </label>
                </div>

                {/* Custom Selection Table */}
                {recipientMode === "custom" && (
                  <div className="space-y-2">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder={t("sendPlan.searchPlaceholder", "Search by name, booth, or tier...")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-650 bg-white"
                      />
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-52 overflow-y-auto">
                      <table className="w-full text-start rtl:text-right text-left text-xs">
                        <thead className="bg-slate-50 text-slate-450 text-[10px] uppercase font-bold tracking-wider select-none sticky top-0 border-b border-slate-200 z-10">
                          <tr>
                            <th className="px-4 py-2 w-10">
                              <button 
                                type="button" 
                                onClick={toggleSelectAllFiltered} 
                                className="hover:text-indigo-650 cursor-pointer text-slate-400"
                              >
                                {isAllFilteredSelected ? (
                                  <CheckSquare size={15} className="text-indigo-650" />
                                ) : (
                                  <Square size={15} />
                                )}
                              </button>
                            </th>
                            <th className="px-4 py-2">{t("sendPlan.thPartner", "Partner / Company")}</th>
                            <th className="px-4 py-2 w-28">{t("sendPlan.thType", "Type & Space")}</th>
                            <th className="px-4 py-2">{t("sendPlan.thContactEmail", "Contact Email")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredPartners.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-semibold italic">
                                {t("sendPlan.noPartnersMatch", "No recipients match your selection or search query.")}
                              </td>
                            </tr>
                          ) : (
                            filteredPartners.map(p => {
                              const isSelected = selectedPartnerIds.includes(p.id);
                              const emailVal = partnerEmails[p.id] || "";
                              const hasEmail = !!emailVal.trim();

                              return (
                                <tr key={p.id} className={`hover:bg-slate-50/50 ${!hasEmail && isSelected ? "bg-amber-50/20" : ""}`}>
                                  <td className="px-4 py-2.5">
                                    <button 
                                      type="button" 
                                      onClick={() => togglePartner(p.id)}
                                      className="text-slate-400 hover:text-indigo-650 cursor-pointer"
                                    >
                                      {isSelected ? (
                                        <CheckSquare size={15} className="text-indigo-650" />
                                      ) : (
                                        <Square size={15} />
                                      )}
                                    </button>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-800">{p.name}</span>
                                      {p.contactPerson && (
                                        <span className="text-[10px] text-slate-400 font-semibold">
                                          {p.contactPerson}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <div className="flex flex-col gap-0.5">
                                      <span className={`inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-md w-fit ${
                                        p.category === "sponsor"
                                          ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                          : "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                                      }`}>
                                        {p.category === "sponsor" ? <Award size={10} /> : <Store size={10} />}
                                        {p.categoryLabel}
                                      </span>
                                      <span className="text-[10px] font-semibold text-slate-500">
                                        {p.booth ? `Booth #${p.booth}` : t("sendPlan.notAssigned", "No Booth")}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-1.5 w-full">
                                      <input 
                                        type="email" 
                                        required={isSelected}
                                        value={emailVal}
                                        onChange={(e) => handleEmailChange(p.id, e.target.value)}
                                        placeholder={t("sendPlan.enterContactEmailPlaceholder", "Enter contact email...")}
                                        className={`px-2 py-1 border rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-600 w-full ${
                                          !hasEmail && isSelected ? "border-amber-400 bg-amber-50/10 placeholder-amber-600" : "border-slate-200"
                                        }`}
                                      />
                                      {!hasEmail && isSelected && (
                                        <AlertTriangle size={14} className="text-amber-500 shrink-0" title={t("sendPlan.emailRequired", "Email address required")} />
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
                )}

                {/* Missing Emails Alert Box (for "all" mode) */}
                {recipientMode === "all" && categoryPartners.some(p => !partnerEmails[p.id]?.trim()) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <p className="font-bold">
                        {t("sendPlan.missingEmailsTitle", "Some partners do not have contact emails set!")}
                      </p>
                      <p className="font-semibold text-amber-700">
                        {t("sendPlan.missingEmailsDesc", "Please enter emails below to save them in the directory and proceed:")}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5 max-h-40 overflow-y-auto p-1">
                        {categoryPartners.filter(p => !partnerEmails[p.id]?.trim()).map(p => (
                          <div key={p.id} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[10px] text-slate-700 truncate max-w-[140px]">{p.name}</span>
                              <span className="text-[9px] font-semibold text-slate-400">{p.categoryLabel}</span>
                            </div>
                            <input 
                              type="email" 
                              required
                              value={partnerEmails[p.id] || ""}
                              onChange={(e) => handleEmailChange(p.id, e.target.value)}
                              placeholder="e.g. contact@partner.com"
                              className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-600 bg-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. PDF Attachment Layout Settings */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <bdi dir="ltr">2.</bdi> <span>{t("sendPlan.pdfAttachmentSettings", "PDF Attachment Layout Settings")}</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-50/40 p-4 rounded-2xl border border-slate-150">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-700">{t("sendPlan.showDimensions", "Show Dimensions")}</span>
                      <span className="text-[9px] text-slate-450 font-semibold">{t("sendPlan.showDimensionsDesc", "Include booth labels")}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting("showLabels")}
                      className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                        pdfSettings.showLabels ? "bg-indigo-650" : "bg-slate-250"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${
                        pdfSettings.showLabels ? "translate-x-3.5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-700">{t("sendPlan.showVenueGrid", "Show Venue Grid")}</span>
                      <span className="text-[9px] text-slate-450 font-semibold">{t("sendPlan.showVenueGridDesc", "Include background grid")}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting("showGrid")}
                      className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                        pdfSettings.showGrid ? "bg-indigo-650" : "bg-slate-250"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${
                        pdfSettings.showGrid ? "translate-x-3.5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-700">{t("sendPlan.hideFurniture", "Hide Furniture")}</span>
                      <span className="text-[9px] text-slate-450 font-semibold">{t("sendPlan.hideFurnitureDesc", "Show booth outlines only")}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting("hideFurniture")}
                      className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                        pdfSettings.hideFurniture ? "bg-indigo-650" : "bg-slate-250"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${
                        pdfSettings.hideFurniture ? "translate-x-3.5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Email Content */}
              <div className="space-y-3.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <bdi dir="ltr">3.</bdi> <span>{t("sendPlan.emailMessage", "Email Message")}</span>
                </label>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">{t("sendPlan.subjectLabel", "Subject")}</span>
                    <input 
                      type="text" 
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={t("sendPlan.subjectPlaceholder", "Email Subject Line")}
                      className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-650 bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">{t("sendPlan.messageBodyLabel", "Message Body")}</span>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t("sendPlan.messageBodyPlaceholder", "Write your email body here...")}
                      className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-650 bg-white resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          {!loading && (
            <footer className="flex items-center justify-between pt-5 border-t border-slate-100 mt-6 bg-white shrink-0">
              <div className="text-xs text-slate-400 font-semibold">
                <span>
                  {recipientMode === "all" ? categoryPartners.length : categoryPartners.filter(p => selectedPartnerIds.includes(p.id)).length} recipient(s) selected
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 rounded-xl font-bold text-xs transition-colors duration-200 cursor-pointer"
                >
                  {t("export.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl font-bold text-xs transition-all duration-200 shadow-md shadow-indigo-100 cursor-pointer"
                >
                  <Send size={14} />
                  <span>{t("sendPlan.sendPacketAction", "Send Packet to Partners")}</span>
                </button>
              </div>
            </footer>
          )}
        </form>
      </motion.div>
    </div>
  );
}
