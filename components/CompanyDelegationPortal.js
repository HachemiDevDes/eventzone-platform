"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, Store, Ticket, Users, Check, Clock, AlertCircle, 
  Plus, Mail, Phone, User, QrCode, ArrowRight, Download, CheckCircle2,
  Calendar, MapPin, Sparkles, ExternalLink, ShieldCheck, Loader2
} from "lucide-react";
import QRCode from "qrcode";
import { fetchOrganizationByDelegationToken, assignCompanyDelegate } from "../lib/db";
import { formatBoothDisplay, getCorporateRoleLabel, getCorporateRoleBadgePass } from "../lib/constants";

export default function CompanyDelegationPortal({ event, initialOrg = null, token = "" }) {
  const [org, setOrg] = useState(initialOrg);
  const [loading, setLoading] = useState(!initialOrg);
  const [error, setError] = useState(null);
  
  // Delegate form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // QR preview state
  const [viewingPass, setViewingPass] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  // Fetch organization by token on mount if not provided
  useEffect(() => {
    if (initialOrg) {
      setOrg(initialOrg);
      setLoading(false);
      return;
    }

    if (!token) {
      setError("No delegation token provided. Please use the link sent in your company approval email.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadOrg() {
      try {
        setLoading(true);
        const resolved = await fetchOrganizationByDelegationToken(token, event?.id);
        if (isMounted) {
          if (resolved) {
            setOrg(resolved);
          } else {
            setError("Invalid or expired delegation access link. Please verify with the event organizer.");
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error loading company delegation:", err);
          setError("Failed to load company details. Please try refreshing or contact support.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOrg();
    return () => { isMounted = false; };
  }, [token, initialOrg, event?.id]);

  // Handle generating QR code for viewing pass
  const handleViewPass = async (delegate) => {
    setViewingPass(delegate);
    try {
      const code = delegate.badgeCode || delegate.id || `EZ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const url = await QRCode.toDataURL(code, { width: 300, margin: 1 });
      setQrDataUrl(url);
    } catch (e) {
      console.warn("QR generation error:", e);
    }
  };

  // Submit delegate pass assignment
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      alert("Please enter First Name, Last Name, and Email.");
      return;
    }

    setSubmitting(true);
    setSubmitSuccess(false);

    try {
      const result = await assignCompanyDelegate(org, formData, event?.id);
      if (result?.organization) {
        setOrg(result.organization);
      }
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: ""
      });
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to assign representative pass:", err);
      alert("Failed to assign pass: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Badges calculations
  const delegates = Array.isArray(org?.delegates) ? org.delegates : (Array.isArray(org?.fiscalDetails?.delegates) ? org.fiscalDetails.delegates : []);
  const badgesIncluded = org?.badgesIncluded || org?.fiscalDetails?.badgesIncluded || 2;
  const remainingPasses = Math.max(0, badgesIncluded - delegates.length);
  const progressPercent = Math.min(100, Math.round((delegates.length / Math.max(1, badgesIncluded)) * 100));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl max-w-md w-full text-center space-y-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <h2 className="text-lg font-black text-slate-900">Loading Delegation Portal...</h2>
          <p className="text-xs text-slate-500 font-medium">Validating your company security token.</p>
        </div>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-black text-slate-900">Portal Access Error</h2>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">{error}</p>
          <a
            href={`/${event?.slug || ""}`}
            className="inline-block mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all shadow-xs"
          >
            Go to Event Homepage
          </a>
        </div>
      </div>
    );
  }

  const boothInfo = org.selectedBooth || org.fiscalDetails?.selectedBooth;
  const boothDisplay = boothInfo ? formatBoothDisplay(boothInfo.boothNumber || boothInfo.label || (typeof boothInfo === 'string' ? boothInfo : '')) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/70 to-slate-50 text-slate-900 font-sans antialiased pb-20">
      {/* Top Banner Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {event?.eventLogo || event?.logo ? (
              <img src={event.eventLogo || event.logo} alt={event.title} className="w-9 h-9 rounded-xl object-contain bg-white border border-slate-200" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                EZ
              </div>
            )}
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 leading-tight truncate max-w-xs sm:max-w-md">{event?.title || "Corporate Portal"}</h1>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Representative Pass Delegation</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] font-bold text-slate-400">Powered by</span>
            <span className="text-xs font-black tracking-tight text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-lg">
              Eventzone
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        
        {/* Company Hero Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              {org.logo ? (
                <img src={org.logo} alt={org.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs bg-white shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-xs shrink-0">
                  {org.name ? org.name.charAt(0).toUpperCase() : 'C'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{org.name}</h2>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Check size={11} className="stroke-[3]" />
                    <span>Approved Partner</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {org.industry || "General Industry"} • {org.ticketType || getCorporateRoleLabel(org.companyRole)}
                </p>
              </div>
            </div>

            {/* Stand Allocation Badge */}
            {boothDisplay && (
              <div className="bg-indigo-50/70 border border-indigo-200/90 rounded-2xl p-3.5 px-4.5 flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Store size={18} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Assigned Stand</div>
                  <div className="text-base font-black text-indigo-950">Stand {boothDisplay}</div>
                  {boothInfo?.dimensions && (
                    <div className="text-[10px] font-semibold text-indigo-600/80">{boothInfo.dimensions}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Allotment & Progress Bar */}
          <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Ticket size={14} className="text-blue-600" />
                  <span>Representative Passes Allotment</span>
                </span>
                <span className="text-slate-900 font-black">
                  {delegates.length} of {badgesIncluded} Passes Assigned
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/60 p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    progressPercent === 100 ? "bg-emerald-500" : "bg-blue-600"
                  }`} 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {remainingPasses > 0 
                  ? `You have ${remainingPasses} badge pass${remainingPasses > 1 ? 'es' : ''} left to assign for your team representatives.` 
                  : "All included representative passes have been assigned for this event."}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5">
              <div className="text-center">
                <div className="text-3xl font-black text-blue-600 leading-none">{remainingPasses}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Remaining</div>
              </div>
              <div className="h-9 w-px bg-slate-200" />
              <div className="text-center">
                <div className="text-3xl font-black text-slate-900 leading-none">{badgesIncluded}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Allotted</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Assign Form & Assigned Team */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Form to assign passes */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5 sticky top-20">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Assign Representative Pass</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Add a team member to receive an exhibitor pass</p>
                </div>
              </div>

              {submitSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-800 flex items-center gap-3 animate-fade-in">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                  <p className="font-semibold">
                    Representative badge pass successfully issued and added to event roster!
                  </p>
                </div>
              )}

              {remainingPasses > 0 ? (
                <form onSubmit={handleAssignSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="John"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Last Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Doe"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Professional Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="john.doe@company.com"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+213 555 123 456"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Job Title / Role in Stand
                    </label>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                      placeholder="e.g. Sales Director, Technical Lead"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Issuing Representative Pass...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          <span>Issue Representative Pass</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-6 text-center space-y-3 border border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Pass Allotment Filled</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    You have assigned all {badgesIncluded} representative passes included in your package. Need additional passes? Contact the event organizer.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Assigned Representatives */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="text-lg font-black text-slate-900">Assigned Team Representatives</h3>
                <p className="text-xs text-slate-500 font-medium">Badges issued for {org.name}</p>
              </div>
              <span className="text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                {delegates.length} Registered
              </span>
            </div>

            {delegates.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200/90 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Users size={22} />
                </div>
                <h4 className="text-base font-bold text-slate-800">No representatives assigned yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  Use the form on the left to assign your company's representative badges for the exhibition stand.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {delegates.map((del, idx) => (
                  <div
                    key={del.id || idx}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 font-black text-sm flex items-center justify-center border border-blue-100 shrink-0">
                        {del.name ? del.name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2) : "D"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900">{del.name}</h4>
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {getCorporateRoleBadgePass(org.companyRole)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                          {del.jobTitle && <span>{del.jobTitle}</span>}
                          {del.jobTitle && del.email && <span>•</span>}
                          {del.email && <span>{del.email}</span>}
                        </div>
                        {del.phone && (
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">{del.phone}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => handleViewPass(del)}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <QrCode size={13} />
                        <span>View Pass</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Event Guidance / Access Note */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4.5 text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-blue-600" />
                <span>Exhibition Badges Information</span>
              </div>
              <p className="leading-relaxed font-medium">
                All registered delegates will have badges printed at the venue check-in desk or can show their digital QR code at security gates for express entry.
              </p>
            </div>
          </div>

        </div>

      </main>

      {/* QR Pass Modal */}
      {viewingPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center space-y-4 animate-scale-up relative">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {org.name}
              </span>
              <button
                onClick={() => setViewingPass(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                Close
              </button>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">{viewingPass.name}</h3>
              <p className="text-xs text-slate-500 font-medium">{viewingPass.jobTitle || 'Representative'}</p>
              <div className="text-[11px] font-bold text-slate-400 mt-0.5">
                {event?.title}
              </div>
            </div>

            {qrDataUrl && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 inline-block">
                <img src={qrDataUrl} alt="Pass QR" className="w-48 h-48 mx-auto" />
                <span className="text-[10px] font-mono font-bold text-slate-400 block mt-2">
                  {viewingPass.badgeCode || viewingPass.id}
                </span>
              </div>
            )}

            {boothDisplay && (
              <div className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 rounded-xl py-1.5">
                Stand: {boothDisplay}
              </div>
            )}

            <button
              onClick={() => setViewingPass(null)}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
