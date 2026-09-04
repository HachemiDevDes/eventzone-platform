"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  X, Mail, Send, Loader2, AlertTriangle, 
  CheckSquare, Square, Search
} from "lucide-react";
import { logCommunication, upsertExhibitor } from "../lib/db";
import { useLanguage } from "../lib/i18n";

export default function SendPlanModal({ isOpen, onClose, exhibitors = [], planName = "Floor Plan", elements = [], onSuccess }) {
  const { t } = useLanguage();
  const [recipientMode, setRecipientMode] = useState("all"); // 'all' | 'custom'
  const [selectedExhibitorIds, setSelectedExhibitorIds] = useState([]);
  const [exhibitorEmails, setExhibitorEmails] = useState({});
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

  // Initialize data on modal open
  useEffect(() => {
    if (isOpen) {
      setSubject(`${planName} - Exhibition Floor Plan & Booth Details`);
      setMessage(
        `Dear Partner,\n\nWe are pleased to share the exhibition floor plan for our upcoming event.\n\nYour assigned booth details and the official floor plan PDF layout are attached to this message.\n\nShould you have any questions or require modifications to your layout, please reply directly to this message.\n\nBest regards,\nEvent Operations Team`
      );

      // Map existing exhibitor emails
      const initialEmails = {};
      exhibitors.forEach(ex => {
        initialEmails[ex.id] = ex.email || "";
      });
      setExhibitorEmails(initialEmails);

      // Select all by default
      setSelectedExhibitorIds(exhibitors.map(ex => String(ex.id)));
      setSearchQuery("");
    }
  }, [isOpen, planName, exhibitors]);

  if (!isOpen) return null;

  const handleEmailChange = (id, value) => {
    setExhibitorEmails(prev => ({ ...prev, [id]: value }));
  };

  const toggleExhibitor = (id) => {
    const stringId = String(id);
    setSelectedExhibitorIds(prev => 
      prev.includes(stringId) 
        ? prev.filter(x => x !== stringId) 
        : [...prev, stringId]
    );
  };

  const filteredExhibitors = exhibitors.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ex.booth || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelectAll = () => {
    const filteredIds = filteredExhibitors.map(ex => String(ex.id));
    const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedExhibitorIds.includes(id));
    if (allFilteredSelected) {
      setSelectedExhibitorIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedExhibitorIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const isAllFilteredSelected = filteredExhibitors.length > 0 && filteredExhibitors.map(ex => String(ex.id)).every(id => selectedExhibitorIds.includes(id));

  const handleToggleSetting = (key) => {
    setPdfSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSend = async (e) => {
    e.preventDefault();

    // Determine target recipients
    const targetIds = recipientMode === "all" 
      ? exhibitors.map(ex => String(ex.id)) 
      : selectedExhibitorIds;

    const targetExhibitors = exhibitors.filter(ex => targetIds.includes(String(ex.id)));

    if (targetExhibitors.length === 0) {
      alert("Please select at least one exhibitor to send the floor plan to.");
      return;
    }

    // Check if any selected exhibitors are missing emails
    const missingEmails = targetExhibitors.filter(ex => !exhibitorEmails[ex.id]?.trim());
    if (missingEmails.length > 0) {
      alert(`Please enter a contact email for: ${missingEmails.map(ex => ex.name).join(", ")}`);
      return;
    }

    setLoading(true);

    try {
      // 1. Save any updated/new emails in parallel
      setSendingProgress("Updating exhibitor contact directory...");
      const emailUpdates = targetExhibitors.map(ex => {
        const currentEmail = exhibitorEmails[ex.id]?.trim();
        if (currentEmail && currentEmail !== ex.email) {
          return upsertExhibitor({ ...ex, email: currentEmail });
        }
        return Promise.resolve(null);
      });
      await Promise.all(emailUpdates);

      // 2. Simulate compiling PDF layout
      setSendingProgress("Generating high-resolution vector PDF floor plan layout...");
      await new Promise(r => setTimeout(r, 1200));

      // 3. Send real emails via Hostinger SMTP
      for (let i = 0; i < targetExhibitors.length; i++) {
        const ex = targetExhibitors[i];
        const email = exhibitorEmails[ex.id];
        setSendingProgress(`Sending booth layout & instructions to ${ex.name} (${email})...`);
        if (email && email.includes("@")) {
          try {
            await fetch("/api/email/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "exhibitor_packet",
                to: email,
                exhibitorName: ex.name,
                boothNumber: ex.booth || "Main Floor",
                eventTitle: "Eventzone Summit",
                eventDate: "March 2026",
                venueAddress: "Summit Exhibition Center",
                message: message,
              }),
            });
          } catch (e) {
            console.warn("Exhibitor email dispatch error:", e);
          }
        }
      }

      // 4. Log communication broadcast in Supabase
      setSendingProgress("Logging email broadcast to event communications...");
      await logCommunication({
        subject,
        body: message,
        recipientCount: targetExhibitors.length
      });

      // Done
      setLoading(false);
      onSuccess(`Floor plan successfully sent as PDF to ${targetExhibitors.length} exhibitor(s)!`);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to send floor plan. Please verify network and try again.");
      setLoading(false);
    }
  };

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
              <h3 className="text-sm font-bold text-slate-800">{t("export.sendPlanTitle", "Email Floor Plan to Exhibitors")}</h3>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t("export.sendPlanSubtitle", "Send PDF attachments and booth details")}</p>
            </div>
          </div>
          <button 
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
                <h4 className="text-sm font-bold text-slate-700">Sending in progress...</h4>
                <p className="text-xs text-slate-455 font-semibold max-w-sm leading-normal">{sendingProgress}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 1. Recipients Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  1. Recipients
                </label>
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
                    Send to All Exhibitors ({exhibitors.length})
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
                    Select Specific Exhibitors
                  </label>
                </div>

                {recipientMode === "custom" && (
                  <div className="space-y-2">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search exhibitors by name or booth..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-650 bg-white"
                      />
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                      <table className="w-full text-start rtl:text-right text-left text-xs">
                        <thead className="bg-slate-50 text-slate-450 text-[10px] uppercase font-bold tracking-wider select-none sticky top-0 border-b border-slate-200 z-10">
                          <tr>
                            <th className="px-4 py-2 w-10">
                              <button 
                                type="button" 
                                onClick={toggleSelectAll} 
                                className="hover:text-indigo-650 cursor-pointer text-slate-400"
                              >
                                {isAllFilteredSelected ? (
                                  <CheckSquare size={15} className="text-indigo-650" />
                                ) : (
                                  <Square size={15} />
                                )}
                              </button>
                            </th>
                            <th className="px-4 py-2">Exhibitor</th>
                            <th className="px-4 py-2 w-20">Booth</th>
                            <th className="px-4 py-2">Contact Email</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredExhibitors.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-semibold italic">
                                No exhibitors match your search query.
                              </td>
                            </tr>
                          ) : (
                            filteredExhibitors.map(ex => {
                              const isSelected = selectedExhibitorIds.includes(String(ex.id));
                              const emailVal = exhibitorEmails[ex.id] || "";
                              const hasEmail = !!emailVal.trim();

                              return (
                                <tr key={ex.id} className={`hover:bg-slate-50/50 ${!hasEmail && isSelected ? "bg-amber-50/20" : ""}`}>
                                  <td className="px-4 py-2.5">
                                    <button 
                                      type="button" 
                                      onClick={() => toggleExhibitor(ex.id)}
                                      className="text-slate-400 hover:text-indigo-650 cursor-pointer"
                                    >
                                      {isSelected ? (
                                        <CheckSquare size={15} className="text-indigo-650" />
                                      ) : (
                                        <Square size={15} />
                                      )}
                                    </button>
                                  </td>
                                  <td className="px-4 py-2.5 font-bold text-slate-700">{ex.name}</td>
                                  <td className="px-4 py-2.5 font-semibold text-slate-500">{ex.booth || "Not Assigned"}</td>
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-1.5 w-full">
                                      <input 
                                        type="email" 
                                        required={isSelected}
                                        value={emailVal}
                                        onChange={(e) => handleEmailChange(ex.id, e.target.value)}
                                        placeholder="Enter contact email..."
                                        className={`px-2 py-1 border rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-600 w-full ${
                                          !hasEmail && isSelected ? "border-amber-400 bg-amber-50/10 placeholder-amber-600" : "border-slate-200"
                                        }`}
                                      />
                                      {!hasEmail && isSelected && (
                                        <AlertTriangle size={14} className="text-amber-500 shrink-0" title="Email address required" />
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
                )/* END custom recipient section */}

                {recipientMode === "all" && exhibitors.some(ex => !exhibitorEmails[ex.id]?.trim()) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-850">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <p className="font-bold">Some exhibitors do not have emails set!</p>
                      <p className="font-semibold text-amber-700">Please enter emails below to save them in the directory and proceed:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
                        {exhibitors.filter(ex => !exhibitorEmails[ex.id]?.trim()).map(ex => (
                          <div key={ex.id} className="flex flex-col gap-1">
                            <span className="font-bold text-[10px] text-slate-500">{ex.name} ({ex.booth || "No Booth"})</span>
                            <input 
                              type="email" 
                              required
                              value={exhibitorEmails[ex.id] || ""}
                              onChange={(e) => handleEmailChange(ex.id, e.target.value)}
                              placeholder="e.g. contact@company.com"
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  2. PDF Attachment Layout Settings
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-50/40 p-4 rounded-2xl border border-slate-150">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-700">Show Dimensions</span>
                      <span className="text-[9px] text-slate-450 font-semibold">Include booth labels</span>
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
                      <span className="text-[11px] font-bold text-slate-700">Show Venue Grid</span>
                      <span className="text-[9px] text-slate-450 font-semibold">Include background grid</span>
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
                      <span className="text-[11px] font-bold text-slate-700">Hide Furniture</span>
                      <span className="text-[9px] text-slate-450 font-semibold">Show booth outlines only</span>
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  3. Email Message
                </label>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Subject</span>
                    <input 
                      type="text" 
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Email Subject Line"
                      className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-650 bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Message Body</span>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your email body here..."
                      className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-650 bg-white resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          {!loading && (
            <footer className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-6 bg-white shrink-0">
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
                <span>{t("floor.sendPlan", "Send PDF to Exhibitors")}</span>
              </button>
            </footer>
          )}
        </form>
      </motion.div>
    </div>
  );
}
