"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  Users, Ticket, Building2, 
  Award, Briefcase, Mic, Search, Trash2, Check, X,
  Calendar, Upload, Plus, BarChart4, Pencil, Mail, FileText,
  Printer, QrCode, Layers, Archive, RotateCcw,
  Eye, Phone, Clock, CheckCircle2, XCircle, Sparkles, Filter, Info, ShieldCheck, ArrowUpRight,
  Maximize2, User, Download, Camera, Loader2, MoreVertical, MoreHorizontal,
  Store, Globe, ExternalLink, DollarSign, LayoutGrid, List, Copy, Smartphone
} from "lucide-react";
import QRCode from "qrcode";
import { useLanguage } from "../lib/i18n";
import { logCommunication, fetchCommunications } from "../lib/db";
import { motion, AnimatePresence } from "framer-motion";
import A4BadgeSheet, { printA4BadgeDocument, printBulkA4BadgeDocuments } from "./A4BadgeSheet";
import SearchableSelect from "./SearchableSelect";
import AttendeeEmailDrawer from "./AttendeeEmailDrawer";
import TablePagination from "./TablePagination";
import OpportunitiesView from "./OpportunitiesView";
import InfluencersView from "./InfluencersView";
import LogisticsView from "./LogisticsView";
import TeamView from "./TeamView";
import DocumentsView from "./DocumentsView";
import AnalyticsView from "./AnalyticsView";
import DevelopersView from "./DevelopersView";
import CommunicationsView from "./CommunicationsView";
import {
  TableViewSkeleton,
  LogisticsSkeleton,
  DocumentsSkeleton,
  AnalyticsSkeleton,
  DevelopersSkeleton
} from "./SkeletonLoaders";

export default function GenericTableView({ 
  viewName, 
  state = {}, 
  onUpdateState, 
  onOpenModal,
  onUploadFile,
  onSwitchView
}) {
  const { t, lang, isRTL } = useLanguage();

  if (state?.isLoading) {
    if (viewName === "analytics") return <AnalyticsSkeleton />;
    if (viewName === "logistics") return <LogisticsSkeleton />;
    if (viewName === "documents") return <DocumentsSkeleton />;
    return <TableViewSkeleton />;
  }

  switch (viewName) {
    case "event-details":
      return <EventDetailsView state={state} onUpdateState={onUpdateState} onUploadFile={onUploadFile} />;
    case "opportunities":
      return <OpportunitiesView state={state} onUpdateState={onUpdateState} onOpenModal={onOpenModal} onSwitchView={onSwitchView} />;
    case "influencers":
      return <InfluencersView state={state} onUpdateState={onUpdateState} onOpenModal={onOpenModal} onSwitchView={onSwitchView} onUploadFile={onUploadFile} />;
    case "documents":
      return (
        <DocumentsView
          documents={state.documents || []}
          onSaveDocument={state.onSaveDocument}
          onDeleteDocument={state.onDeleteDocument}
          onTogglePin={state.onTogglePinDocument}
          onUploadFile={onUploadFile}
          activeEventId={state.activeEventId || state.eventDetails?.id}
          eventDetails={state.eventDetails || {}}
          onRefreshData={state.onRefreshDocuments}
        />
      );
    case "logistics":

      return (
        <LogisticsView
          logisticsData={state.logisticsData || {}}
          onSaveLogisticsItem={state.onSaveLogisticsItem}
          onDeleteLogisticsItem={state.onDeleteLogisticsItem}
          onSaveFullLogistics={state.onSaveFullLogistics}
          speakers={state.speakers || []}
          team={state.team || []}
          floorPlans={state.floorPlans || []}
          eventDetails={state.eventDetails || {}}
          onSwitchView={onSwitchView}
          onRefreshData={state.onRefreshLogistics}
        />
      );
    case "attendees":
      return <AttendeesView state={state} onUpdateState={onUpdateState} onOpenModal={onOpenModal} />;
    case "pending":
      return <PendingView state={state} onUpdateState={onUpdateState} />;
    case "organizations":
      return <OrganizationsView state={state} onUpdateState={onUpdateState} onOpenModal={onOpenModal} />;
    case "sponsors":
      return <SponsorsView state={state} onUpdateState={onUpdateState} onOpenModal={onOpenModal} />;
    case "exhibitors":
      return <ExhibitorsView state={state} onUpdateState={onUpdateState} onOpenModal={onOpenModal} />;
    case "speakers":
      return <SpeakersDirectoryView state={state} onUpdateState={onUpdateState} onUploadFile={onUploadFile} />;
    case "tickets":
      return <TicketsView state={state} onUpdateState={onUpdateState} onOpenModal={onOpenModal} onSwitchView={onSwitchView} />;
    case "check-in":
      return <CheckInView state={state} onUpdateState={onUpdateState} />;
    case "my-team":
      return (
        <TeamView 
          state={state} 
          onUpdateState={onUpdateState} 
          onOpenModal={onOpenModal} 
          onSwitchView={onSwitchView}
          simulatedMemberId={state.simulatedMemberId}
          onSimulateMember={state.onSimulateMember}
        />
      );
    case "analytics":
      return <AnalyticsView state={state} onSwitchView={onSwitchView} onOpenModal={onOpenModal} />;
    case "communications":
      return <CommunicationsView state={state} onUpdateState={onUpdateState} />;
    case "developers":
      return <DevelopersView state={state} onSwitchView={onSwitchView} onOpenModal={onOpenModal} />;
    default:
      return <TableViewSkeleton />;
  }
}

// Helper to strictly extract Company and Function / Job Title from ticket form inputs
function extractTicketFormCredentials(attendee) {
  if (!attendee) return { company: "", jobTitle: "" };
  const answers = attendee.answers || attendee.customAnswers || attendee.formAnswers || {};
  let formCompany = attendee.company || "";
  let formJob = attendee.jobTitle || attendee.job_title || attendee.function || attendee.profession || "";

  if (typeof answers === "object") {
    for (const [k, v] of Object.entries(answers)) {
      if (!v || typeof v !== "string") continue;
      const key = k.toLowerCase();
      if (!formCompany && (key.includes("company") || key.includes("organization") || key.includes("societe") || key.includes("entreprise") || key.includes("org"))) {
        formCompany = String(v).trim();
      }
      if (!formJob && (key.includes("job") || key.includes("title") || key.includes("function") || key.includes("profession") || key.includes("poste") || key.includes("role") || key.includes("fonction"))) {
        formJob = String(v).trim();
      }
    }
  }

  return {
    company: formCompany,
    jobTitle: formJob
  };
}

// 1. EVENT DETAILS VIEW
function EventDetailsView({ state, onUpdateState, onUploadFile }) {
  const { eventDetails } = state;
  const [title, setTitle] = useState(eventDetails.title);
  const [location, setLocation] = useState(eventDetails.location);
  const [type, setType] = useState(eventDetails.type || "Hybrid");
  const [startDate, setStartDate] = useState(eventDetails.startDate);
  const [endDate, setEndDate] = useState(eventDetails.endDate);
  const [description, setDescription] = useState(eventDetails.description);
  const [banner, setBanner] = useState(eventDetails.banner || "");

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const publicUrl = onUploadFile 
        ? await onUploadFile(file, 'floor-plans')
        : await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });

      if (publicUrl) {
        setBanner(publicUrl);
      }
    } catch (err) {
      console.error("Failed to upload banner:", err);
      alert("Failed to upload banner image to Supabase Storage");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateState("eventDetails", {
      title, location, type, startDate, endDate, description, banner
    });
    alert("Event details saved successfully!");
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-8 w-full shadow-sm">
      <div 
        className="w-full h-56 rounded-2xl bg-gradient-to-br from-indigo-600 to-rose-500 bg-cover bg-center relative overflow-hidden mb-8 shadow-sm flex items-end p-8"
        style={banner ? { backgroundImage: `url(${banner})` } : {}}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-950/20 to-transparent"></div>
        <div className="relative text-white z-10">
          <h3 className="text-2xl font-bold tracking-tight text-white">{title || "Event Title"}</h3>
          <p className="text-xs font-semibold text-slate-200 mt-1 opacity-90">📍 {location} | 📅 {startDate} - {endDate}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event Title</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            required
            className="px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 text-sm font-semibold"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location / Venue</label>
            <input 
              type="text" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
              className="px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 text-sm font-semibold"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event Type</label>
            <SearchableSelect 
              value={type} 
              onChange={(val) => setType(val)}
              options={[
                { value: "Hybrid", label: "Hybrid" },
                { value: "In-person", label: "In-Person Only" },
                { value: "Virtual", label: "Virtual / Online Only" }
              ]}
              placeholder="Select event type..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 text-sm font-semibold"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 text-sm font-semibold"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">About Event</label>
          <textarea 
            rows={4} 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 text-sm font-semibold resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event Cover Banner</label>
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 hover:bg-slate-100/55 transition-all text-center flex flex-col items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-indigo-650 bg-white border border-slate-200 hover:border-indigo-150 py-2.5 px-4 rounded-xl cursor-pointer shadow-sm hover:shadow">
              <Upload size={14} />
              Upload Custom Banner
              <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
            </label>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Recommended size: 1200 x 400 pixels</span>
          </div>
        </div>

        <button 
          type="submit" 
          className="bg-indigo-650 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl mt-4 max-w-[200px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-sm"
        >
          Save Event Details
        </button>
      </form>
    </div>
  );
}

// Helper to resolve an attendee's or applicant's effective ticket tier name
export function getResolvedTicketName(item, tickets = []) {
  if (!item) return "Standard Admission";
  // If only 1 ticket tier exists for this event, all attendees belong to it
  if (tickets && tickets.length === 1) {
    return tickets[0].name || tickets[0].tier || "Standard Admission";
  }
  const itemType = (item.ticketType || item.ticket_type || "").trim().toLowerCase();
  if (item.ticketId) {
    const byId = (tickets || []).find(t => t.id === item.ticketId);
    if (byId) return byId.name || byId.tier;
  }
  const directMatch = (tickets || []).find(t => (t.name || t.tier || "").trim().toLowerCase() === itemType);
  if (directMatch) return directMatch.name || directMatch.tier;
  
  // Fuzzy word matching
  const itemWords = itemType.split(/\s+/).filter(w => w.length > 2);
  for (const t of (tickets || [])) {
    const tName = (t.name || t.tier || "").trim().toLowerCase();
    const tWords = tName.split(/\s+/).filter(w => w.length > 2);
    const shared = tWords.filter(w => itemWords.includes(w));
    if (shared.length >= Math.min(2, tWords.length) && shared.length > 0) {
      return t.name || t.tier;
    }
  }

  return item.ticketType || item.ticket_type || ((tickets && tickets[0]) ? (tickets[0].name || tickets[0].tier) : "Standard Admission");
}

// Helper to extract image URL from answers or object properties
export function extractImageFromAnswers(answers = {}) {
  if (!answers || typeof answers !== "object") return "";
  for (const [k, v] of Object.entries(answers)) {
    if (typeof v === "string" && v.trim()) {
      const val = v.trim();
      if (val.startsWith("data:image/") || val.startsWith("http://") || val.startsWith("https://") || val.startsWith("blob:") || val.includes("/storage/v1/object/")) {
        return val;
      }
      const kLower = k.toLowerCase();
      if (kLower.includes("picture") || kLower.includes("photo") || kLower.includes("avatar") || kLower.includes("image")) {
        return val;
      }
    }
  }
  return "";
}

// Extract the best uploaded display photo for attendee / applicant
export function getAttendeeDisplayImage(item) {
  if (!item) return "";
  if (item.image && typeof item.image === "string" && item.image.trim() && !item.image.includes("ui-avatars.com")) return item.image.trim();
  if (item.avatar && typeof item.avatar === "string" && item.avatar.trim() && !item.avatar.includes("ui-avatars.com")) return item.avatar.trim();
  if (item.photo && typeof item.photo === "string" && item.photo.trim()) return item.photo.trim();
  if (item.badgePicture && typeof item.badgePicture === "string" && item.badgePicture.trim()) return item.badgePicture.trim();
  
  const answers = item.answers || item.customAnswers || item.formAnswers || {};
  const extracted = extractImageFromAnswers(answers);
  if (extracted) return extracted;

  if (item.image && typeof item.image === "string" && item.image.trim()) return item.image.trim();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Attendee')}&background=random`;
}

// Fullscreen Photo Lightbox Inspector Modal
function ImageLightboxModal({ preview, onClose }) {
  if (!preview) return null;

  const imageUrl = preview.url || preview.src || preview.image || "";
  const title = preview.name || preview.title || "Attendee Picture";
  const subtitle = preview.subtitle || preview.email || (preview.ticket ? `Ticket: ${preview.ticket}` : "");
  const ticketTag = preview.ticket || (preview.subtitle && preview.subtitle.startsWith("Ticket:") ? preview.subtitle.replace("Ticket:", "").trim() : "Attendee Pass Photo");

  return (
    <div 
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-slate-200/80 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Clean title without top icon) */}
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900 truncate">{title}</h4>
            {subtitle && (
              <p className="text-xs text-slate-500 truncate">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Photo Body */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-900/5 min-h-[300px]">
          <div className="relative max-w-sm w-full rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white flex items-center justify-center min-h-[220px]">
            {imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img 
                src={imageUrl} 
                alt={title} 
                className="w-full max-h-[58vh] object-contain block"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              style={{ display: imageUrl ? 'none' : 'flex' }}
              className="w-full h-48 bg-slate-100 text-slate-500 font-bold text-xs items-center justify-center flex-col gap-2 p-4 text-center"
            >
              <span>No image provided</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-100 bg-white flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
            {ticketTag}
          </span>
          <div className="flex items-center gap-2">
            {imageUrl && (
              <a 
                href={imageUrl} 
                download={`${title || 'attendee'}-photo`} 
                target="_blank" 
                rel="noreferrer"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={13} />
                <span>Download</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dynamic Column Generator from Active Form Fields + Historical Deleted Form Fields
function getDynamicFormColumns(selectedTicketType, tickets = [], forms = [], dataset = []) {
  let relevantForms = [];
  const activeForms = (forms || []).filter(f => f.status !== "archived" && !f.isArchived);

  if (selectedTicketType && selectedTicketType !== "all") {
    const matchedTicket = (tickets || []).find(t => (t.name === selectedTicketType || t.tier === selectedTicketType || t.id === selectedTicketType));
    if (matchedTicket?.formId || matchedTicket?.form_id) {
      const form = activeForms.find(f => f.id === (matchedTicket.formId || matchedTicket.form_id));
      if (form) relevantForms.push(form);
    }
    if (relevantForms.length === 0) {
      const defaultForm = activeForms.find(f => f.type === "ticket_registration" || f.category === "Registration" || f.category === "tickets");
      if (defaultForm) relevantForms.push(defaultForm);
    }
  } else {
    relevantForms = activeForms.filter(f => f.category === "Registration" || f.category === "tickets" || f.type === "ticket_registration" || !f.category || (tickets || []).some(t => t.formId === f.id || t.form_id === f.id));
  }

  const dynamicColumns = [];
  const seenKeys = new Set();

  const isExcludedKey = (k, label = "") => {
    const idNorm = (k || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const labelNorm = (label || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    // Exclude core fixed columns: Name, Email, Ticket Tier, Status, Dates, Notes, Codes
    if (
      idNorm === "id" || idNorm === "fcorename" || idNorm === "name" || idNorm === "fullname" || idNorm === "firstname" || idNorm === "lastname" ||
      labelNorm === "fullname" || labelNorm === "name" || labelNorm === "firstname" || labelNorm === "lastname" || labelNorm === "applicantname" || labelNorm === "attendeename"
    ) return true;

    if (
      idNorm === "fcoreemail" || idNorm === "email" || idNorm === "emailaddress" ||
      labelNorm === "email" || labelNorm === "emailaddress"
    ) return true;

    if (
      idNorm.includes("badgepicture") || idNorm.includes("badgephoto") || idNorm.includes("profilepicture") || idNorm.includes("userphoto") ||
      labelNorm.includes("badgepicture") || labelNorm.includes("badgephoto") || labelNorm.includes("profilepicture")
    ) return true;

    if (
      idNorm === "tickettype" || idNorm === "ticket_type" || idNorm === "tickettier" || idNorm === "ticket_tier" || idNorm === "ticket" ||
      labelNorm === "tickettype" || labelNorm === "tickettier"
    ) return true;

    if (
      idNorm === "status" || idNorm === "statusparticipation" || idNorm === "registereddate" || idNorm === "registeredat" || idNorm === "date" ||
      idNorm === "isspeaker" || idNorm === "isarchived" || idNorm === "note" || idNorm === "badgecode" || idNorm === "answers" || idNorm === "customanswers" || idNorm === "formanswers"
    ) return true;

    return false;
  };

  // 1. Extract active form fields
  if (relevantForms.length > 0) {
    relevantForms.forEach(form => {
      (form.fields || []).forEach(field => {
        if (!field || !field.id || field.type === "section") return;

        // Skip picture/photo/avatar/file upload types (displayed as photo avatar in column 1 + zoom modal)
        const fieldType = (field.type || "").toLowerCase();
        if (["picture", "photo", "image", "avatar", "file", "file_upload"].includes(fieldType)) return;

        if (isExcludedKey(field.id, field.label)) return;

        const idNorm = (field.id || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const labelNorm = (field.label || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const dedupeKey = idNorm.startsWith("fcore") ? idNorm.replace("fcore", "") : (idNorm.startsWith("f") && idNorm.length > 2 ? idNorm.slice(1) : idNorm);

        if (!seenKeys.has(dedupeKey) && !seenKeys.has(idNorm) && !seenKeys.has(labelNorm)) {
          seenKeys.add(dedupeKey);
          seenKeys.add(idNorm);
          seenKeys.add(labelNorm);
          const cleanLabel = field.label || field.id.replace(/^f_core_|^f_/, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
          dynamicColumns.push({
            id: field.id,
            baseLabel: cleanLabel,
            label: cleanLabel,
            type: field.type || "text",
            options: field.options || [],
            isDeleted: false
          });
        }
      });
    });
  }

  // 2. Discover historical fields that were deleted from the form, but still have data in past registrations
  dataset.forEach(row => {
    const ans = row.answers || row.customAnswers || row.formAnswers || {};
    Object.entries(ans).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      if (typeof v === "string" && (v.startsWith("data:image/") || v.startsWith("blob:"))) return;
      if (isExcludedKey(k)) return;

      const idNorm = (k || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const dedupeKey = idNorm.startsWith("fcore") ? idNorm.replace("fcore", "") : (idNorm.startsWith("f") && idNorm.length > 2 ? idNorm.slice(1) : idNorm);

      if (!seenKeys.has(dedupeKey) && !seenKeys.has(idNorm)) {
        seenKeys.add(dedupeKey);
        seenKeys.add(idNorm);
        const baseName = k.replace(/^f_core_|^f_/, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        dynamicColumns.push({
          id: k,
          baseLabel: baseName,
          label: `${baseName} (deleted)`,
          type: "text",
          isDeleted: true
        });
      }
    });
  });

  return dynamicColumns;
}

function renderDynamicCellData(row, col) {
  const ans = row.answers || row.customAnswers || row.formAnswers || {};
  let val = ans[col.id];

  if (val === undefined || val === null || val === "") {
    val = ans[col.label];
  }
  
  if (val === undefined || val === null || val === "") {
    if (col.baseLabel) val = ans[col.baseLabel];
  }

  if (val === undefined || val === null || val === "") {
    const cleanKey = col.id.replace(/^f_core_|^f_/, "");
    if (ans[cleanKey] !== undefined && ans[cleanKey] !== null && ans[cleanKey] !== "") {
      val = ans[cleanKey];
    } else if (ans[`f_${cleanKey}`] !== undefined && ans[`f_${cleanKey}`] !== null && ans[`f_${cleanKey}`] !== "") {
      val = ans[`f_${cleanKey}`];
    }
  }

  // Scan all keys in ans for normalized match with column ID or column label
  if (val === undefined || val === null || val === "") {
    const colIdNorm = (col.id || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const colLabelNorm = (col.label || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const [k, v] of Object.entries(ans)) {
      if (v === undefined || v === null || v === "") continue;
      const kNorm = k.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (kNorm === colIdNorm || kNorm === colLabelNorm) {
        val = v;
        break;
      }
    }
  }

  if (val === undefined || val === null || val === "") {
    const norm = (col.id || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const labelNorm = (col.label || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    
    if (norm.includes("phone") || labelNorm.includes("phone")) {
      val = ans.phone || ans.f_core_phone || ans.phoneNumber || row.phone;
    } else if (norm.includes("company") || labelNorm.includes("company") || labelNorm.includes("organization") || labelNorm.includes("societe")) {
      // Find company in ans first
      let foundComp = ans.company || ans.f_company || ans.organization || ans.f_organization;
      if (!foundComp) {
        for (const [k, v] of Object.entries(ans)) {
          if (!v || typeof v !== "string") continue;
          const kLower = k.toLowerCase();
          if (kLower.includes("company") || kLower.includes("societe") || kLower.includes("entreprise") || kLower.includes("organization")) {
            foundComp = String(v).trim();
            break;
          }
        }
      }
      val = foundComp || row.company;
    } else if (norm.includes("job") || labelNorm.includes("job") || labelNorm.includes("title") || labelNorm.includes("function") || labelNorm.includes("role") || labelNorm.includes("poste") || labelNorm.includes("profession")) {
      // Find job title/function in ans first
      let foundJob = ans.jobTitle || ans.job_title || ans.f_job_title || ans.function || ans.role || ans.profession || ans.jobFunction;
      if (!foundJob) {
        for (const [k, v] of Object.entries(ans)) {
          if (!v || typeof v !== "string") continue;
          const kLower = k.toLowerCase();
          if (kLower.includes("job") || kLower.includes("title") || kLower.includes("function") || kLower.includes("role") || kLower.includes("profession") || kLower.includes("poste") || kLower.includes("fonction")) {
            foundJob = String(v).trim();
            break;
          }
        }
      }
      val = foundJob || row.jobTitle || row.job_title;
    } else {
      val = row[col.id];
    }
  }

  if (val === undefined || val === null || val === "") {
    return <span className="text-slate-300 font-normal">—</span>;
  }

  // Never render raw image/data URL string in cell
  if (typeof val === "string" && (val.startsWith("data:image/") || val.startsWith("blob:") || val.includes("/storage/v1/object/"))) {
    return <span className="text-slate-300 font-normal">—</span>;
  }

  if (Array.isArray(val)) {
    return (
      <div className="flex flex-wrap gap-1 max-w-[180px]">
        {val.map((item, idx) => (
          <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-semibold">
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  if (typeof val === "boolean") {
    return val ? (
      <span className="text-emerald-600 font-bold flex items-center gap-1"><Check size={12} /> Yes</span>
    ) : (
      <span className="text-slate-400 font-medium">No</span>
    );
  }

  const str = String(val);
  return (
    <span className="text-slate-700 font-medium truncate max-w-[160px] block" title={str}>
      {str}
    </span>
  );
}

// Full Submission & Intake Form Inspector Modal
function SubmissionDetailsModal({ item, type = "attendee", forms = [], tickets = [], onClose, onApprove, onDecline }) {
  if (!item) return null;

  const [previewPhoto, setPreviewPhoto] = useState(false);
  const ticketName = getResolvedTicketName(item, tickets);
  const matchedTicket = (tickets || []).find(t => t.name === ticketName || t.tier === ticketName || t.id === ticketName);
  const matchedForm = matchedTicket?.formId 
    ? (forms || []).find(f => f.id === (matchedTicket.formId || matchedTicket.form_id))
    : null;

  const answers = item.answers || item.customAnswers || item.formAnswers || {};
  const answerEntries = Object.entries(answers);
  const displayImg = getAttendeeDisplayImage(item);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-150 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650 font-black text-lg">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {type === "pending" ? "Pending Registration Intake" : "Attendee Registration Details"}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Full registration questionnaire responses and contact details
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Identity & Ticket Summary Card */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-slate-50 to-emerald-50/30 border border-indigo-100/80 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(true)}
                  className="relative group/modalavatar cursor-zoom-in shrink-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  title="Click to view full photo"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={displayImg} 
                    className="w-14 h-14 rounded-2xl object-cover border border-indigo-200 shadow-inner group-hover/modalavatar:ring-2 group-hover/modalavatar:ring-indigo-500 transition-all" 
                    alt="" 
                  />
                  <div className="absolute inset-0 bg-slate-900/35 rounded-2xl opacity-0 group-hover/modalavatar:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <Maximize2 size={16} className="drop-shadow" />
                  </div>
                </button>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 leading-snug">{item.name || "Guest Attendee"}</h4>
                  <span className="text-xs font-semibold text-slate-500">{item.email}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-indigo-650 text-white font-extrabold text-xs shadow-sm">
                  {ticketName}
                </span>
                {type === "pending" ? (
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold flex items-center gap-1">
                    <Clock size={12} /> Pending Review
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Registered
                  </span>
                )}
              </div>
            </div>

            {/* Core Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-indigo-100/60 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Company / Org</span>
                <span className="font-bold text-slate-800">{item.company || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Job Title</span>
                <span className="font-bold text-slate-800">{item.jobTitle || item.job_title || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone</span>
                <span className="font-bold text-slate-800">{item.phone || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Submitted Date</span>
                <span className="font-bold text-slate-800">{item.date || item.registeredDate || "—"}</span>
              </div>
              {item.note && (
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Application Note</span>
                  <span className="font-medium text-slate-700 italic">{item.note}</span>
                </div>
              )}
            </div>
          </div>

          {/* Questionnaire & Dynamic Form Answers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-indigo-600" />
                Ticket Form Questionnaire Responses
              </h5>
              {matchedForm && (
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  Form: {matchedForm.title}
                </span>
              )}
            </div>

            {answerEntries.length === 0 ? (
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 text-center text-xs text-slate-400 font-medium">
                No custom ticket form questions were attached or answered for this registration.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {answerEntries.map(([key, val]) => {
                  // Resolve friendly label from matched form if available
                  const fieldDef = matchedForm?.fields?.find(f => f.id === key);
                  const label = fieldDef?.label || key.replace(/^f_/, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

                  let displayValue = String(val);
                  if (Array.isArray(val)) {
                    displayValue = val.join(", ");
                  } else if (typeof val === "boolean") {
                    displayValue = val ? "Yes" : "No";
                  }

                  return (
                    <div key={key} className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        {label}
                      </span>
                      <span className="text-xs font-bold text-slate-900 leading-snug">
                        {displayValue || "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-150 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>

          {type === "pending" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDecline && onDecline(item.id)}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 text-rose-700 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Decline Application
              </button>
              <button
                onClick={() => onApprove && onApprove(item)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center gap-1.5"
              >
                <Check size={14} className="stroke-[3]" />
                Approve & Issue Pass
              </button>
            </div>
          )}
        </div>
      </div>

      {previewPhoto && (
        <ImageLightboxModal
          preview={{
            url: displayImg,
            name: item.name || 'Attendee',
            email: item.email || '',
            ticket: ticketName
          }}
          onClose={() => setPreviewPhoto(false)}
        />
      )}
    </div>
  );
}

// 2. ALL ATTENDEES VIEW (Dynamic Form Columns + Ticket-Type Switcher)
function AttendeesView({ state, onUpdateState, onOpenModal }) {
  const { attendees = [], tickets = [], forms = [] } = state;
  const [search, setSearch] = useState("");
  const [selectedTicketType, setSelectedTicketType] = useState("all");
  const [selectedSubmissionModal, setSelectedSubmissionModal] = useState(null);
  const [previewImageModal, setPreviewImageModal] = useState(null);
  const [selectedBadgeAttendee, setSelectedBadgeAttendee] = useState(null);
  const [emailAttendees, setEmailAttendees] = useState(null);
  const [activeActionsMenu, setActiveActionsMenu] = useState(null);

  const handleOpenActionsMenu = (e, attendee, attendeeKey) => {
    e.stopPropagation();
    if (activeActionsMenu?.key === attendeeKey) {
      setActiveActionsMenu(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < 240;

    setActiveActionsMenu({
      key: attendeeKey,
      attendee,
      top: openUpwards ? undefined : rect.bottom + 6,
      bottom: openUpwards ? (window.innerHeight - rect.top + 6) : undefined,
      right: Math.max(12, window.innerWidth - rect.right),
      openUpwards
    });
  };

  // Close actions menu on scroll, window resize, click outside or Escape key
  useEffect(() => {
    if (!activeActionsMenu) return;
    const handleClose = (e) => {
      if (e?.target && e.target.closest && e.target.closest('.portaled-actions-menu')) {
        return;
      }
      setActiveActionsMenu(null);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setActiveActionsMenu(null);
    };

    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    document.addEventListener('click', handleClose);
    document.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
      document.removeEventListener('click', handleClose);
      document.removeEventListener('keydown', handleKey);
    };
  }, [activeActionsMenu]);

  // Helper to match an attendee to a ticket tier (handles exact match, ID match, or name aliases)
  const isAttendeeInTicketTier = (item, targetTicketName) => {
    if (!targetTicketName || targetTicketName === "all") return true;
    
    // If only 1 ticket tier configured for this event, all attendees belong to it
    if ((tickets || []).length === 1) {
      const singleTicketName = tickets[0].name || tickets[0].tier;
      if (singleTicketName && singleTicketName.trim().toLowerCase() === targetTicketName.trim().toLowerCase()) {
        return true;
      }
    }

    const resolved = getResolvedTicketName(item, tickets);
    if (resolved && resolved.trim().toLowerCase() === targetTicketName.trim().toLowerCase()) {
      return true;
    }

    const itemType = (item.ticketType || item.ticket_type || "").trim().toLowerCase();
    const target = targetTicketName.trim().toLowerCase();
    return itemType === target;
  };

  // Available Ticket Types + Archived for Unified Switcher Pills (Authoritative from tickets)
  const ticketTypes = useMemo(() => {
    const list = [{ id: "all", label: "All Tickets" }];
    const seen = new Set();
    
    // Official tickets configured for the event are the primary source of truth
    (tickets || []).forEach(t => {
      const name = t.name || t.tier;
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push({ id: name, label: name });
      }
    });

    // If tickets list is empty, derive from attendees
    if ((tickets || []).length === 0) {
      (attendees || []).forEach(a => {
        const tType = a.ticketType || a.ticket_type;
        if (tType && !seen.has(tType.toLowerCase())) {
          seen.add(tType.toLowerCase());
          list.push({ id: tType, label: tType });
        }
      });
    }

    // Add Archived tab to top switcher pills
    list.push({ id: "archived", label: "Archived" });

    return list;
  }, [tickets, attendees]);

  const activeAttendees = useMemo(() => attendees.filter(a => a.status !== 'archived' && !a.isArchived), [attendees]);
  const archivedAttendees = useMemo(() => attendees.filter(a => a.status === 'archived' || a.isArchived), [attendees]);

  // Filtered Attendees by Ticket Type / Archived and Search
  const filtered = useMemo(() => {
    const seen = new Set();
    return attendees.filter(a => {
      if (a.id) {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
      }

      const isArchived = a.status === 'archived' || a.isArchived;
      if (selectedTicketType === "archived") {
        if (!isArchived) return false;
      } else {
        if (isArchived) return false;
        if (selectedTicketType !== "all" && !isAttendeeInTicketTier(a, selectedTicketType)) return false;
      }

      const searchLower = search.toLowerCase();
      const nameMatch = (a.name || "").toLowerCase().includes(searchLower);
      const emailMatch = (a.email || "").toLowerCase().includes(searchLower);
      const compMatch = (a.company || "").toLowerCase().includes(searchLower);
      const phoneMatch = (a.phone || a.answers?.phone || a.answers?.f_core_phone || a.answers?.phoneNumber || a.customAnswers?.phone || a.customAnswers?.f_core_phone || a.customAnswers?.phoneNumber || "").toLowerCase().includes(searchLower);
      
      // Also search through answer values
      const ansValues = Object.values(a.answers || a.customAnswers || {}).join(" ").toLowerCase();
      const ansMatch = ansValues.includes(searchLower);

      return nameMatch || emailMatch || compMatch || phoneMatch || ansMatch;
    });
  }, [attendees, selectedTicketType, search, tickets]);

  // Dynamic Form Columns for the selected ticket type & dataset
  const dynamicCols = useMemo(() => {
    return getDynamicFormColumns(selectedTicketType, tickets, forms, filtered);
  }, [selectedTicketType, tickets, forms, filtered]);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page and clear selection on ticket filter tab switch or search
  useEffect(() => {
    setSelectedIds(new Set());
    setCurrentPage(1);
  }, [selectedTicketType, search]);

  // Paginated dataset
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleToggleSelectAll = () => {
    const pageKeys = paginated.map((a, idx) => a.id || `att-${(currentPage - 1) * pageSize + idx}`);
    const isAllPageSelected = pageKeys.length > 0 && pageKeys.every(k => selectedIds.has(k));
    const next = new Set(selectedIds);
    if (isAllPageSelected) {
      pageKeys.forEach(k => next.delete(k));
    } else {
      pageKeys.forEach(k => next.add(k));
    }
    setSelectedIds(next);
  };

  const handleToggleSelectRow = (key) => {
    const next = new Set(selectedIds);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedIds(next);
  };

  const selectedAttendees = useMemo(() => {
    return filtered.filter((a, idx) => selectedIds.has(a.id || `att-${idx}`));
  }, [filtered, selectedIds]);

  const handleArchive = (id) => {
    if (confirm("Archive this attendee? Their registration record is preserved in archives.")) {
      onUpdateState("attendees", attendees.map(a => a.id === id ? { ...a, status: 'archived', isArchived: true } : a));
    }
  };

  const handleRestore = (id) => {
    onUpdateState("attendees", attendees.map(a => (a.id === id || (a.email && a.email === id)) ? { ...a, status: 'registered', isArchived: false } : a));
  };

  const handleDeleteAttendee = (id) => {
    if (confirm("Permanently delete this archived attendee? This action cannot be undone.")) {
      onUpdateState("attendees", attendees.filter(a => a.id !== id && (!a.email || a.email !== id)));
    }
  };

  // Toggle Check-in status directly from Attendees list
  const handleToggleCheckin = async (id) => {
    const target = attendees.find(a => a.id === id);
    if (!target) return;
    const isCurrentlyChecked = Boolean(target.status === "checked-in" || target.status === "checked_in" || target.checkedIn || target.checked_in);
    const nextState = !isCurrentlyChecked;
    const checkinTime = nextState ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

    const updated = attendees.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: nextState ? "checked_in" : "registered",
          checkedIn: nextState,
          checked_in: nextState,
          checkedInAt: nextState ? new Date().toISOString() : null,
          checkinTime
        };
      }
      return a;
    });
    onUpdateState("attendees", updated);

    try {
      await toggleAttendeeCheckin({
        eventId: state.activeEventId,
        attendeeId: id,
        checkedIn: nextState,
        checkedInBy: "Organizer Console"
      });
    } catch (e) {
      console.warn("handleToggleCheckin DB error:", e);
    }
  };

  const handleBulkCheckin = async (checkin = true) => {
    const selectedKeys = new Set(selectedIds);
    const now = checkin ? new Date().toISOString() : null;
    const checkinTime = checkin ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

    const updated = attendees.map((a, idx) => {
      const key = a.id || `att-${idx}`;
      if (selectedKeys.has(key)) {
        return {
          ...a,
          status: checkin ? "checked_in" : "registered",
          checkedIn: checkin,
          checked_in: checkin,
          checkedInAt: now,
          checkinTime
        };
      }
      return a;
    });
    onUpdateState("attendees", updated);

    for (const key of Array.from(selectedKeys)) {
      try {
        await toggleAttendeeCheckin({
          eventId: state.activeEventId,
          attendeeId: key,
          checkedIn: checkin,
          checkedInBy: "Organizer Console"
        });
      } catch (e) {}
    }

    setSelectedIds(new Set());
  };

  const handleBulkPrintBadges = async () => {
    if (!selectedAttendees.length) return;
    const badgeList = selectedAttendees.map(a => {
      const resolvedTier = getResolvedTicketName(a, tickets);
      const matchedTicket = tickets.find(t => (t.name || t.tier || "").trim().toLowerCase() === (resolvedTier || "").trim().toLowerCase()) || {};
      const eventDetails = state.eventDetails || {};
      const templateUrl = matchedTicket.badgeUrl || eventDetails.badgeUrl || "";
      const badgeSettings = matchedTicket.badgeSettings || eventDetails.badgeSettings || {};
      const attendeePhoto = getAttendeeDisplayImage(a);
      const attendeeName = a.name || "Attendee";
      const attendeeEmail = a.email || "";
      const { company: attendeeCompany, jobTitle: attendeeJobTitle } = extractTicketFormCredentials(a);
      const badgeCode = a.badgeCode || a.badge_code || `EZ-${String(a.id || '').slice(-4).toUpperCase() || 'PASS'}`;
      const eventTitle = eventDetails.title || "Conference Event";
      const eventId = eventDetails.id || state.activeEventId || "";

      return {
        templateUrl,
        attendeeId: a.id || badgeCode,
        attendeeName,
        attendeeEmail,
        attendeePhoto,
        attendeeCompany,
        attendeeJobTitle,
        ticketType: resolvedTier,
        badgeCode,
        eventId,
        eventTitle,
        showFoldGuide: badgeSettings.showFoldGuide !== false,
        showPhoto: badgeSettings.showPhoto !== false,
        showQr: badgeSettings.showQr !== false,
        cardTheme: badgeSettings.cardTheme || "white",
      };
    });

    await printBulkA4BadgeDocuments(badgeList);
  };

  const handleBulkArchive = () => {
    if (confirm(`Archive ${selectedIds.size} selected attendee(s)? Their registration records will be preserved in archives.`)) {
      const selectedKeys = new Set(selectedIds);
      const updated = attendees.map((a, idx) => {
        const key = a.id || `att-${idx}`;
        if (selectedKeys.has(key)) {
          return { ...a, status: 'archived', isArchived: true };
        }
        return a;
      });
      onUpdateState("attendees", updated);
      setSelectedIds(new Set());
    }
  };

  const handleBulkRestore = () => {
    const selectedKeys = new Set(selectedIds);
    const updated = attendees.map((a, idx) => {
      const key = a.id || `att-${idx}`;
      if (selectedKeys.has(key)) {
        return { ...a, status: 'registered', isArchived: false };
      }
      return a;
    });
    onUpdateState("attendees", updated);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    if (confirm(`Permanently delete ${selectedIds.size} selected attendee(s)? This action cannot be undone.`)) {
      const selectedKeys = new Set(selectedIds);
      const updated = attendees.filter((a, idx) => {
        const key = a.id || `att-${idx}`;
        return !selectedKeys.has(key);
      });
      onUpdateState("attendees", updated);
      setSelectedIds(new Set());
    }
  };

  // Direct 1-Click Print Badge Handler (Directly opens system print dialog with zero extra steps)
  const handleDirectPrintAttendeeBadge = (attendee) => {
    const resolvedTier = getResolvedTicketName(attendee, tickets);
    const matchedTicket = tickets.find(t => (t.name || t.tier || "").trim().toLowerCase() === (resolvedTier || "").trim().toLowerCase()) || {};
    const eventDetails = state.eventDetails || {};
    const templateUrl = matchedTicket.badgeUrl || eventDetails.badgeUrl || "";
    const badgeSettings = matchedTicket.badgeSettings || eventDetails.badgeSettings || {};
    const attendeePhoto = getAttendeeDisplayImage(attendee);
    const attendeeName = attendee.name || "Attendee";
    const attendeeEmail = attendee.email || "";
    const { company: attendeeCompany, jobTitle: attendeeJobTitle } = extractTicketFormCredentials(attendee);
    const badgeCode = attendee.badgeCode || attendee.badge_code || `EZ-${String(attendee.id || '').slice(-4).toUpperCase() || 'PASS'}`;
    const eventTitle = eventDetails.title || "Conference Event";
    const eventId = eventDetails.id || state.activeEventId || "";

    printA4BadgeDocument({
      templateUrl,
      attendeeId: attendee.id || badgeCode,
      attendeeName,
      attendeeEmail,
      attendeePhoto,
      attendeeCompany,
      attendeeJobTitle,
      ticketType: resolvedTier || "General Pass",
      badgeCode,
      eventId,
      eventTitle,
      showFoldGuide: badgeSettings.showFoldGuide !== false,
      showPhoto: badgeSettings.showPhoto !== false,
      showQr: badgeSettings.showQr !== false,
      cardTheme: badgeSettings.cardTheme || "transparent"
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 select-none">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">All Attendees</h2>
          <p className="text-sm text-slate-500">Manage list of registered participants, dynamic form data, and ticket tiers.</p>
        </div>
        <button 
          onClick={() => onOpenModal("attendee")}
          className="bg-indigo-650 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add Attendee</span>
        </button>
      </header>

      {/* Clean Minimalist Ticket-Type & Archived Switcher Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/70 w-fit max-w-full overflow-x-auto select-none shadow-inner">
        {ticketTypes.map(tt => {
          let count = 0;
          if (tt.id === "all") {
            count = activeAttendees.length;
          } else if (tt.id === "archived") {
            count = archivedAttendees.length;
          } else {
            count = activeAttendees.filter(a => isAttendeeInTicketTier(a, tt.id)).length;
          }
          const isSelected = selectedTicketType === tt.id;

          return (
            <button
              key={tt.id}
              onClick={() => setSelectedTicketType(tt.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "bg-white text-slate-900 shadow-sm font-bold border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/60 border border-transparent"
              }`}
            >
              <span>{tt.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold transition-colors ${
                isSelected ? "bg-slate-100 text-slate-700" : "text-slate-400 bg-transparent"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar (Search) */}
        <div className="p-5 border-b border-slate-150 bg-slate-50 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search attendees by name, email, company, or answer..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {/* Dynamic Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left text-xs font-medium text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">
                <th className="py-4 pl-5 pr-2 w-10 sticky left-0 bg-slate-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={paginated.length > 0 && paginated.every((a, idx) => selectedIds.has(a.id || `att-${(currentPage - 1) * pageSize + idx}`))}
                      ref={(el) => {
                        if (el) {
                          const isAllChecked = paginated.length > 0 && paginated.every((a, idx) => selectedIds.has(a.id || `att-${(currentPage - 1) * pageSize + idx}`));
                          const hasSomeChecked = paginated.some((a, idx) => selectedIds.has(a.id || `att-${(currentPage - 1) * pageSize + idx}`));
                          el.indeterminate = hasSomeChecked && !isAllChecked;
                        }
                      }}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-colors"
                      title="Select / Deselect all on this page"
                    />
                  </div>
                </th>
                <th className="py-4 px-4 sticky left-10 bg-slate-50 z-10 min-w-[220px] sm:min-w-[260px] whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Attendee</th>
                <th className="py-4 px-6 whitespace-nowrap">Email</th>
                {selectedTicketType === "all" && <th className="py-4 px-6 whitespace-nowrap">Ticket Tier</th>}
                {/* Dynamic Form Columns */}
                {dynamicCols.map(col => (
                  <th key={col.id} className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={col.isDeleted ? "text-slate-400 font-semibold" : "text-indigo-900/80 font-bold"}>
                        {col.baseLabel || col.label}
                      </span>
                      {col.isDeleted && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold lowercase tracking-normal">
                          (deleted)
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="py-4 px-6 whitespace-nowrap">Status</th>
                <th className="py-4 px-6 whitespace-nowrap">Registered</th>
                <th className="py-4 px-6 text-center w-20 whitespace-nowrap sticky right-0 bg-slate-50 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6 + (selectedTicketType === "all" || selectedTicketType === "archived" ? 1 : 0) + dynamicCols.length} className="text-center text-slate-450 py-14">
                    {selectedTicketType === "archived" 
                      ? "No archived attendees found." 
                      : selectedTicketType !== "all" 
                        ? `No attendees registered for ${selectedTicketType}.` 
                        : "No attendees registered yet."}
                  </td>
                </tr>
              ) : (
                paginated.map((a, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx;
                  const isArchived = a.status === 'archived' || a.isArchived;
                  const isCheckedIn = Boolean(a.status === 'checked-in' || a.status === 'checked_in' || a.checkedIn || a.checked_in);
                  const displayImg = getAttendeeDisplayImage(a);
                  const attendeeKey = a.id || `att-${globalIdx}`;
                  const isMenuActive = activeActionsMenu === attendeeKey;
                  const isSelected = selectedIds.has(attendeeKey);

                  return (
                    <tr 
                      key={a.id ? `${a.id}-${globalIdx}` : `attendee-${globalIdx}`} 
                      className={`group hover:bg-slate-50 transition-colors duration-150 ${isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50/70' : isArchived ? 'bg-slate-50/60 text-slate-600' : ''} ${isMenuActive ? 'relative z-40' : 'relative z-0'}`}
                    >
                      <td className="py-4 pl-5 pr-2 w-10 sticky left-0 bg-white group-hover:bg-slate-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(attendeeKey)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-colors"
                          />
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold flex items-center gap-3 sticky left-10 bg-white group-hover:bg-slate-50 z-10 min-w-[220px] sm:min-w-[260px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImageModal({
                              url: displayImg,
                              src: displayImg,
                              name: a.name || "Attendee",
                              title: a.name || "Attendee",
                              email: a.email || "",
                              ticket: getResolvedTicketName(a, tickets) || a.ticketType || "Standard Pass",
                              subtitle: `Ticket: ${getResolvedTicketName(a, tickets) || a.ticketType || "Standard Pass"}`
                            });
                          }}
                          className="relative group/avatar cursor-zoom-in shrink-0"
                          title="Click to view full size photo"
                        >
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shadow-2xs group-hover/avatar:ring-2 group-hover/avatar:ring-indigo-500 transition-all">
                            {displayImg ? (
                              <img 
                                src={displayImg} 
                                alt={a.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              style={{ display: displayImg ? 'none' : 'flex' }}
                              className="w-full h-full bg-slate-100 text-slate-600 font-bold text-xs items-center justify-center"
                            >
                              {(a.name || "Attendee").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                          </div>
                        </button>
                        <div>
                          <div className="text-slate-850 font-bold leading-tight">{a.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {a.phone || a.answers?.phone || a.answers?.f_core_phone || a.answers?.phoneNumber || a.customAnswers?.phone || a.customAnswers?.f_core_phone || a.customAnswers?.phoneNumber || "—"}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-500 whitespace-nowrap">{a.email}</td>
                      {selectedTicketType === "all" && (
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px]">
                            {getResolvedTicketName(a, tickets)}
                          </span>
                        </td>
                      )}
                      {/* Dynamic Columns Cell Render */}
                      {dynamicCols.map(col => (
                        <td key={col.id} className="py-4 px-6 whitespace-nowrap">
                          {renderDynamicCellData(a, col)}
                        </td>
                      ))}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isArchived 
                            ? 'bg-slate-100 text-slate-500 border border-slate-200' 
                            : isCheckedIn 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}>
                          {isArchived ? 'ARCHIVED' : (isCheckedIn ? 'Checked In' : 'Registered')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-medium whitespace-nowrap">{a.registeredDate || "—"}</td>
                      <td className="py-4 px-6 text-center whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10">
                        <div className="relative inline-flex items-center justify-center">
                          {/* 3 Points Action Trigger Button */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenActionsMenu(e, a, attendeeKey)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                              isMenuActive
                                ? "bg-blue-50 text-blue-600 border border-blue-200 shadow-xs"
                                : "text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200"
                            }`}
                            title="Actions"
                          >
                            <MoreVertical size={16} />
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

        {/* Table Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName={selectedTicketType === "archived" ? "archived attendees" : "attendees"}
        />
      </div>

      {/* Full Submission Modal */}
      {selectedSubmissionModal && (
        <SubmissionDetailsModal
          item={selectedSubmissionModal}
          type="attendee"
          forms={forms}
          tickets={tickets}
          onClose={() => setSelectedSubmissionModal(null)}
        />
      )}

      {/* Full Resolution Photo Lightbox Inspector */}
      {previewImageModal && (
        <ImageLightboxModal
          preview={previewImageModal}
          onClose={() => setPreviewImageModal(null)}
        />
      )}

      {/* Attendee Badge Preview & Print Modal */}
      {selectedBadgeAttendee && (() => {
        const attendee = selectedBadgeAttendee;
        const resolvedTier = getResolvedTicketName(attendee, tickets);
        const matchedTicket = tickets.find(t => (t.name || t.tier || "").trim().toLowerCase() === (resolvedTier || "").trim().toLowerCase()) || {};
        const eventDetails = state.eventDetails || {};
        const templateUrl = matchedTicket.badgeUrl || eventDetails.badgeUrl || "";
        const badgeSettings = matchedTicket.badgeSettings || eventDetails.badgeSettings || {};
        const attendeePhoto = getAttendeeDisplayImage(attendee);
        const attendeeName = attendee.name || "Attendee";
        const attendeeEmail = attendee.email || "";
        const { company: attendeeCompany, jobTitle: attendeeJobTitle } = extractTicketFormCredentials(attendee);
        const badgeCode = attendee.badgeCode || attendee.badge_code || `EZ-${String(attendee.id || '').slice(-4).toUpperCase() || 'PASS'}`;
        const eventTitle = eventDetails.title || "Conference Event";
        const eventId = eventDetails.id || state.activeEventId || "";

        const handlePrint = () => {
          printA4BadgeDocument({
            templateUrl,
            attendeeId: attendee.id || badgeCode,
            attendeeName,
            attendeeEmail,
            attendeePhoto,
            attendeeCompany,
            attendeeJobTitle,
            ticketType: resolvedTier || "General Pass",
            badgeCode,
            eventId,
            eventTitle,
            showFoldGuide: badgeSettings.showFoldGuide !== false,
            showPhoto: badgeSettings.showPhoto !== false,
            showQr: badgeSettings.showQr !== false,
            cardTheme: badgeSettings.cardTheme || "white"
          });
        };

        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in overflow-y-auto font-sans">
            <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-7 text-center space-y-4 animate-scale-up relative my-8 text-slate-900">
              <button
                onClick={() => setSelectedBadgeAttendee(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer font-bold"
              >
                <X size={18} />
              </button>

              <div className="flex items-center justify-center gap-2">
                <Printer size={20} className="text-blue-600" />
                <h3 className="text-lg font-black text-slate-900">Print Attendee Badge</h3>
              </div>

              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Official A4 4-Fold Badge Sheet with unique check-in QR code for <strong className="text-slate-800">{attendeeName}</strong> ({resolvedTier}).
              </p>

              {/* A4 4-Fold Preview */}
              <div className="w-full max-w-[340px] sm:max-w-[370px] mx-auto shadow-xl rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                <A4BadgeSheet
                  templateUrl={templateUrl}
                  attendeeId={attendee.id || badgeCode}
                  attendeeName={attendeeName}
                  attendeeEmail={attendeeEmail}
                  attendeePhoto={attendeePhoto}
                  attendeeCompany={attendeeCompany}
                  attendeeJobTitle={attendeeJobTitle}
                  ticketType={resolvedTier}
                  badgeCode={badgeCode}
                  eventId={eventId}
                  eventTitle={eventTitle}
                  showFoldGuide={badgeSettings.showFoldGuide !== false}
                  showPhoto={badgeSettings.showPhoto !== false}
                  showQr={badgeSettings.showQr !== false}
                  cardTheme={badgeSettings.cardTheme || "white"}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedBadgeAttendee(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Printer size={15} />
                  <span>Print Badge (A4)</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Floating Bulk Action Bar (Light Mode) */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md text-slate-800 px-3.5 py-2 rounded-2xl shadow-2xl shadow-slate-900/15 border border-slate-200/90 flex items-center gap-2.5 text-xs font-semibold select-none max-w-[95vw] overflow-x-auto"
          >
            {/* Selection Counter & Clear */}
            <div className="flex items-center gap-2 pr-3 border-r border-slate-200 shrink-0">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shadow-xs">
                {selectedIds.size}
              </span>
              <span className="text-slate-850 font-bold whitespace-nowrap">
                {selectedIds.size} selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="ml-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer p-0.5"
                title="Deselect all"
              >
                <X size={14} />
              </button>
            </div>

            {/* Actions: Active Attendees */}
            {selectedTicketType !== "archived" ? (
              <div className="flex items-center gap-1.5 shrink-0">
                {/* 1. Bulk Check-In */}
                <button
                  type="button"
                  onClick={() => handleBulkCheckin(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs font-semibold"
                  title="Mark selected as checked-in"
                >
                  <CheckCircle2 size={14} />
                  <span>Check In</span>
                </button>

                {/* 2. Bulk Undo Check-In */}
                <button
                  type="button"
                  onClick={() => handleBulkCheckin(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200/80 font-semibold"
                  title="Undo check-in for selected attendees"
                >
                  <RotateCcw size={14} className="text-slate-500" />
                  <span>Undo Check-In</span>
                </button>

                {/* 3. Bulk Print Badges */}
                <button
                  type="button"
                  onClick={handleBulkPrintBadges}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200/80 font-semibold"
                  title="Print A4 badges for selected attendees"
                >
                  <Printer size={14} className="text-slate-500" />
                  <span>Print Badges</span>
                </button>

                {/* 4. Bulk Send Email */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedAttendees.length > 0) {
                      setEmailAttendees(selectedAttendees);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200/80 font-semibold"
                  title="Send email to selected"
                >
                  <Mail size={14} className="text-slate-500" />
                  <span>Send Email</span>
                </button>

                {/* 5. Bulk Archive */}
                <button
                  type="button"
                  onClick={handleBulkArchive}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer border border-rose-200 font-semibold"
                  title="Archive selected attendees"
                >
                  <Archive size={14} className="text-rose-500" />
                  <span>Archive</span>
                </button>
              </div>
            ) : (
              /* Actions: Archived Attendees */
              <div className="flex items-center gap-1.5 shrink-0">
                {/* 1. Bulk Restore */}
                <button
                  type="button"
                  onClick={handleBulkRestore}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200/80 font-semibold"
                  title="Restore selected attendees"
                >
                  <RotateCcw size={14} className="text-slate-500" />
                  <span>Restore</span>
                </button>

                {/* 2. Bulk Delete */}
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-2xs font-semibold"
                  title="Permanently delete selected attendees"
                >
                  <Trash2 size={14} />
                  <span>Delete Permanently</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-in Attendee Email Drawer */}
      {emailAttendees && (
        <AttendeeEmailDrawer
          isOpen={Boolean(emailAttendees)}
          onClose={() => setEmailAttendees(null)}
          attendees={emailAttendees}
          attendee={emailAttendees[0]}
          eventDetails={state.eventDetails || {}}
          tickets={tickets}
          forms={forms}
          activeEventId={state.activeEventId}
        />
      )}

      {/* Floating Action Menu Popover (Portaled to document.body so it NEVER gets clipped by table overflow or container boundaries) */}
      {activeActionsMenu && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          <motion.div
            key={activeActionsMenu.key}
            initial={{ opacity: 0, scale: 0.9, y: activeActionsMenu.openUpwards ? 8 : -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: activeActionsMenu.openUpwards ? 6 : -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: activeActionsMenu.top,
              bottom: activeActionsMenu.bottom,
              right: activeActionsMenu.right,
              zIndex: 99999
            }}
            className="portaled-actions-menu w-48 bg-white border border-slate-200/90 rounded-2xl shadow-2xl shadow-slate-900/20 p-1.5 flex flex-col gap-0.5 text-left select-none animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const a = activeActionsMenu.attendee;
              const isArchived = a.status === 'archived' || a.isArchived;
              const isCheckedIn = a.status === 'checked-in';

              return !isArchived ? (
                <>
                  {/* 1. Toggle Check-In */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveActionsMenu(null);
                      handleToggleCheckin(a.id);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2
                        size={15}
                        className={isCheckedIn ? "text-slate-600 fill-slate-100" : "text-slate-400 group-hover:text-slate-600 transition-colors"}
                      />
                      <span>{isCheckedIn ? "Undo Check-In" : "Check In"}</span>
                    </div>
                    {isCheckedIn && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </button>

                  {/* 2. Print badge */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveActionsMenu(null);
                      handleDirectPrintAttendeeBadge(a);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                  >
                    <Printer size={15} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                    <span>Print badge</span>
                  </button>

                  {/* 3. Send Email */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveActionsMenu(null);
                      setEmailAttendees([a]);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                  >
                    <Mail size={15} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                    <span>Send Email</span>
                  </button>

                  {/* 4. Edit */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveActionsMenu(null);
                      onOpenModal("attendee", a);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                  >
                    <Pencil size={15} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                    <span>Edit</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  {/* 5. Archive */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveActionsMenu(null);
                      handleArchive(a.id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left group"
                  >
                    <Archive size={15} className="text-rose-500 group-hover:scale-105 transition-transform" />
                    <span>Archive</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Restore */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveActionsMenu(null);
                      handleRestore(a.id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                  >
                    <RotateCcw size={15} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                    <span>Restore</span>
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveActionsMenu(null);
                      onOpenModal("attendee", a);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                  >
                    <Pencil size={15} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                    <span>Edit</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  {/* Delete Permanently */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveActionsMenu(null);
                      handleDeleteAttendee(a.id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left group"
                  >
                    <Trash2 size={15} className="text-rose-500 group-hover:scale-105 transition-transform" />
                    <span>Delete</span>
                  </button>
                </>
              );
            })()}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// 3. PENDING REGISTRATIONS VIEW (Dynamic Form Columns + Ticket-Type Switcher)
function PendingView({ state, onUpdateState }) {
  const { pending = [], attendees = [], tickets = [], forms = [] } = state;
  const [search, setSearch] = useState("");
  const [selectedTicketType, setSelectedTicketType] = useState("all");
  const [selectedSubmissionModal, setSelectedSubmissionModal] = useState(null);
  const [previewImageModal, setPreviewImageModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Helper to match a pending applicant to a ticket tier (handles exact match, ID match, or name aliases)
  const isPendingInTicketTier = (item, targetTicketName) => {
    if (!targetTicketName || targetTicketName === "all") return true;
    
    // If only 1 ticket tier configured for this event, all applicants belong to it
    if ((tickets || []).length === 1) {
      const singleTicketName = tickets[0].name || tickets[0].tier;
      if (singleTicketName && singleTicketName.trim().toLowerCase() === targetTicketName.trim().toLowerCase()) {
        return true;
      }
    }

    const resolved = getResolvedTicketName(item, tickets);
    if (resolved && resolved.trim().toLowerCase() === targetTicketName.trim().toLowerCase()) {
      return true;
    }

    const itemType = (item.ticketType || item.ticket_type || "").trim().toLowerCase();
    const target = targetTicketName.trim().toLowerCase();
    return itemType === target;
  };

  // Ticket Types Switcher for Pending Queue (Authoritative from tickets)
  const ticketTypes = useMemo(() => {
    const list = [{ id: "all", label: "All Tickets" }];
    const seen = new Set();
    
    // Official tickets configured for the event
    (tickets || []).forEach(t => {
      const name = t.name || t.tier;
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push({ id: name, label: name });
      }
    });

    if ((tickets || []).length === 0) {
      (pending || []).forEach(p => {
        const tType = p.ticketType || p.ticket_type;
        if (tType && !seen.has(tType.toLowerCase())) {
          seen.add(tType.toLowerCase());
          list.push({ id: tType, label: tType });
        }
      });
    }

    return list;
  }, [tickets, pending]);

  const handleDecline = (id) => {
    if (confirm("Decline this registration request?")) {
      onUpdateState("pending", pending.filter(p => p.id !== id));
      if (selectedSubmissionModal?.id === id) {
        setSelectedSubmissionModal(null);
      }
    }
  };

  const handleApprove = (p) => {
    const nameParts = (p.name || 'Guest Attendee').trim().split(' ');
    const userImg = getAttendeeDisplayImage(p);
    const answersData = p.answers || p.customAnswers || p.formAnswers || {};
    
    let formJob = '';
    let formComp = '';
    if (typeof answersData === 'object') {
      for (const [k, v] of Object.entries(answersData)) {
        if (!v || typeof v !== 'string') continue;
        const key = k.toLowerCase();
        if (!formJob && (key.includes('job') || key.includes('title') || key.includes('function') || key.includes('profession') || key.includes('poste') || key.includes('role') || key.includes('fonction'))) {
          formJob = String(v).trim();
        }
        if (!formComp && (key.includes('company') || key.includes('societe') || key.includes('entreprise') || key.includes('org'))) {
          formComp = String(v).trim();
        }
      }
    }

    const newAttendee = {
      id: p.id || Date.now(),
      name: p.name || 'Guest Attendee',
      first_name: nameParts[0] || 'Guest',
      last_name: nameParts.slice(1).join(' ') || 'Attendee',
      email: p.email || '',
      ticketType: p.ticketType || p.ticket_type || "Standard Admission",
      ticket_type: p.ticketType || p.ticket_type || "Standard Admission",
      company: formComp || p.company || answersData.company || answersData.f_company || '',
      jobTitle: formJob || p.jobTitle || p.job_title || answersData.jobTitle || answersData.job_title || answersData.f_job_title || '',
      job_title: formJob || p.jobTitle || p.job_title || answersData.jobTitle || answersData.job_title || answersData.f_job_title || '',
      phone: p.phone || answersData.phone || answersData.f_core_phone || answersData.phoneNumber || '',
      status: "registered",
      status_participation: "registered",
      registeredDate: new Date().toISOString().split("T")[0],
      registered_at: new Date().toISOString(),
      image: userImg,
      avatar: userImg,
      answers: answersData,
      customAnswers: answersData,
      formAnswers: answersData
    };

    onUpdateState("attendees", [...attendees, newAttendee]);
    onUpdateState("pending", pending.filter(x => x.id !== p.id));
    if (selectedSubmissionModal?.id === p.id) {
      setSelectedSubmissionModal(null);
    }

    // Automatically dispatch official approval email with badge PDF & fast-track QR code
    if (p.email && typeof p.email === "string" && p.email.includes("@")) {
      const eventDetails = state?.eventDetails || {};
      const targetDate = eventDetails.startDate 
        ? `${eventDetails.startDate}${eventDetails.endDate ? ` - ${eventDetails.endDate}` : ''}`
        : newAttendee.registeredDate || "";

      fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "approval_confirmation",
          to: p.email,
          attendeeName: newAttendee.name || "Attendee",
          ticketTier: newAttendee.ticketType || "Standard Admission",
          eventTitle: eventDetails.title || "Eventzone Summit",
          eventDate: targetDate,
          eventLocation: eventDetails.location || "Event Venue",
          company: newAttendee.company || "",
          jobTitle: newAttendee.jobTitle || "",
          badgeCode: newAttendee.badgeCode || (p.badgeCode || `EZ-${String(newAttendee.id || '').slice(-4).toUpperCase()}`),
          passId: newAttendee.id,
          requiresApproval: false,
          isApproval: true,
          organizerName: eventDetails.organizerName || state?.currentUser?.fullName || "Eventzone Platform",
        }),
      }).catch(err => console.warn("Could not dispatch attendee approval email:", err));
    }
  };

  // Filtered Pending Items by Ticket Type and Search
  const filtered = useMemo(() => {
    const seen = new Set();
    return pending.filter(p => {
      if (p.id) {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
      }

      if (selectedTicketType !== "all" && !isPendingInTicketTier(p, selectedTicketType)) return false;

      const searchLower = search.toLowerCase();
      const nameMatch = (p.name || "").toLowerCase().includes(searchLower);
      const emailMatch = (p.email || "").toLowerCase().includes(searchLower);
      const compMatch = (p.company || "").toLowerCase().includes(searchLower);
      const noteMatch = (p.note || "").toLowerCase().includes(searchLower);

      // Search through form answers
      const ansValues = Object.values(p.answers || p.customAnswers || {}).join(" ").toLowerCase();
      const ansMatch = ansValues.includes(searchLower);

      return nameMatch || emailMatch || compMatch || noteMatch || ansMatch;
    });
  }, [pending, selectedTicketType, search, tickets]);

  // Reset page on filter or search
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTicketType, search]);

  // Paginated dataset
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Dynamic Form Columns
  const dynamicCols = useMemo(() => {
    return getDynamicFormColumns(selectedTicketType, tickets, forms, filtered);
  }, [selectedTicketType, tickets, forms, filtered]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 select-none">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900">Pending Approvals</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs">
              {pending.length} Awaiting Review
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Review registrations, intake questionnaires, and validate passes awaiting organizer approval.</p>
        </div>
      </header>

      {/* Clean Minimalist Ticket-Type Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/70 w-fit max-w-full overflow-x-auto select-none shadow-inner">
        {ticketTypes.map(tt => {
          const count = tt.id === "all" 
            ? pending.length 
            : pending.filter(p => isPendingInTicketTier(p, tt.id)).length;
          const isSelected = selectedTicketType === tt.id;

          return (
            <button
              key={tt.id}
              onClick={() => setSelectedTicketType(tt.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "bg-white text-slate-900 shadow-sm font-bold border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/60 border border-transparent"
              }`}
            >
              <span>{tt.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold transition-colors ${
                isSelected ? "bg-slate-100 text-slate-700" : "text-slate-400 bg-transparent"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar Search */}
        <div className="p-5 border-b border-slate-150 bg-slate-50 flex items-center justify-between gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search pending applicants by name, email, note, or answer..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>
        </div>

        {/* Dynamic Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left text-xs font-semibold text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">
                <th className="py-4 px-6 sticky left-0 bg-slate-50 z-10 min-w-[240px] sm:min-w-[280px] whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Applicant</th>
                <th className="py-4 px-6 whitespace-nowrap">Email</th>
                {selectedTicketType === "all" && <th className="py-4 px-6 whitespace-nowrap">Applied Tier</th>}
                {/* Dynamic Form Columns */}
                {dynamicCols.map(col => (
                  <th key={col.id} className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={col.isDeleted ? "text-slate-400 font-semibold" : "text-indigo-900/80 font-bold"}>
                        {col.baseLabel || col.label}
                      </span>
                      {col.isDeleted && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold lowercase tracking-normal">
                          (deleted)
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="py-4 px-6 whitespace-nowrap">Request Note</th>
                <th className="py-4 px-6 whitespace-nowrap">Submitted</th>
                <th className="py-4 px-6 text-center w-48 whitespace-nowrap sticky right-0 bg-slate-50 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5 + (selectedTicketType === "all" ? 1 : 0) + dynamicCols.length} className="text-center text-slate-400 py-16 font-medium">
                    {selectedTicketType !== "all" 
                      ? `No pending registration requests for ${selectedTicketType}.` 
                      : "No pending registration requests in the review queue."}
                  </td>
                </tr>
              ) : (
                paginated.map((p, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx;
                  const displayImg = getAttendeeDisplayImage(p);
                  return (
                    <tr key={p.id ? `${p.id}-${globalIdx}` : `pending-${globalIdx}`} className="group hover:bg-slate-50 transition-all duration-150">
                      <td className="py-4 px-6 font-bold text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50 z-10 min-w-[240px] sm:min-w-[280px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImageModal({
                                url: displayImg,
                                name: p.name || 'Applicant',
                                email: p.email || '',
                                ticket: getResolvedTicketName(p, tickets)
                              });
                            }}
                            className="relative group/avatar cursor-zoom-in shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                            title="Click to view full photo"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={displayImg} 
                              className="w-9 h-9 rounded-full object-cover shadow-inner border border-slate-200 group-hover/avatar:ring-2 group-hover/avatar:ring-amber-500 transition-all" 
                              alt="" 
                            />
                            <div className="absolute inset-0 bg-slate-900/35 rounded-full opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <Maximize2 size={12} className="drop-shadow" />
                            </div>
                          </button>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-extrabold text-slate-900 leading-tight whitespace-nowrap">{p.name || "Guest Applicant"}</span>
                            {p.company && <span className="text-[10px] text-slate-400 font-medium truncate">{p.company}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-medium">{p.email}</td>
                      {selectedTicketType === "all" && (
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-extrabold uppercase tracking-tight">
                            {getResolvedTicketName(p, tickets)}
                          </span>
                        </td>
                      )}
                      {/* Dynamic Form Columns Cell Render */}
                      {dynamicCols.map(col => (
                        <td key={col.id} className="py-4 px-6 whitespace-nowrap">
                          {renderDynamicCellData(p, col)}
                        </td>
                      ))}
                      <td className="py-4 px-6 text-slate-500 italic font-medium leading-relaxed max-w-xs truncate">
                        {p.note || "Standard application"}
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-medium whitespace-nowrap">{p.date || "—"}</td>
                      <td className="py-4 px-6 whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedSubmissionModal(p)}
                            className="p-1.5 hover:text-indigo-600 text-slate-400 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition-all cursor-pointer"
                            title="View Full Questionnaire & Answers"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            onClick={() => handleApprove(p)}
                            className="bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 text-emerald-700 hover:text-white py-1.5 px-3 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer shadow-sm hover:shadow flex items-center gap-1"
                          >
                            <Check size={12} className="stroke-[3]" />
                            <span>Approve</span>
                          </button>
                          <button 
                            onClick={() => handleDecline(p.id)}
                            className="bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 text-rose-700 hover:text-white py-1.5 px-2.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer shadow-sm"
                          >
                            Decline
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

        {/* Table Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="pending registrations"
        />
      </div>

      {/* Full Submission Modal */}
      {selectedSubmissionModal && (
        <SubmissionDetailsModal
          item={selectedSubmissionModal}
          type="pending"
          forms={forms}
          tickets={tickets}
          onClose={() => setSelectedSubmissionModal(null)}
          onApprove={handleApprove}
          onDecline={handleDecline}
        />
      )}

      {/* Full Resolution Photo Lightbox Inspector */}
      {previewImageModal && (
        <ImageLightboxModal
          preview={previewImageModal}
          onClose={() => setPreviewImageModal(null)}
        />
      )}
    </div>
  );
}

// 4. PARTNER ORGANIZATIONS VIEW
function OrganizationsView({ state, onUpdateState, onOpenModal }) {
  const { organizations = [], sponsors = [], exhibitors = [] } = state;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [statusTab, setStatusTab] = useState("all"); // "all" | "active" | "sponsors" | "exhibitors" | "archived"
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  const handleArchive = (id) => {
    if (confirm("Archive this organization? (Preserved in archives)")) {
      onUpdateState("organizations", organizations.map(o => o.id === id ? { ...o, isArchived: true, status: 'archived' } : o));
    }
  };

  const handleRestore = (id) => {
    onUpdateState("organizations", organizations.map(o => o.id === id ? { ...o, isArchived: false, status: 'active' } : o));
  };

  const handleDeletePermanent = (id) => {
    if (confirm("Permanently delete this organization? This action cannot be undone.")) {
      onUpdateState("organizations", organizations.filter(o => o.id !== id));
    }
  };

  // Helper to check linked sponsor/exhibitor roles
  const getOrgRoles = (org) => {
    const isSponsor = sponsors.find(s => !s.isArchived && s.status !== 'archived' && (s.orgId === org.id || s.org_id === org.id || (s.name && org.name && s.name.toLowerCase() === org.name.toLowerCase())));
    const isExhibitor = exhibitors.find(e => !e.isArchived && e.status !== 'archived' && (e.orgId === org.id || e.org_id === org.id || (e.name && org.name && e.name.toLowerCase() === org.name.toLowerCase())));
    return { isSponsor, isExhibitor };
  };

  // KPI Counts
  const activeCount = organizations.filter(o => !o.isArchived && o.status !== 'archived').length;
  const archivedCount = organizations.filter(o => o.isArchived || o.status === 'archived').length;
  const activeSponsorsCount = sponsors.filter(s => !s.isArchived && s.status !== 'archived').length;
  const activeExhibitorsCount = exhibitors.filter(e => !e.isArchived && e.status !== 'archived').length;

  // Extract unique industries for SearchableSelect
  const industryOptions = useMemo(() => {
    const set = new Set();
    organizations.forEach(o => {
      if (o.industry) set.add(o.industry);
    });
    return [
      { value: "all", label: "All Industries" },
      ...Array.from(set).map(ind => ({ value: ind, label: ind }))
    ];
  }, [organizations]);

  // Filter organizations
  const filteredOrganizations = useMemo(() => {
    return organizations.filter(o => {
      const isArchived = o.isArchived || o.status === 'archived';
      const { isSponsor, isExhibitor } = getOrgRoles(o);

      // Sub-tab filter
      if (statusTab === "active" && isArchived) return false;
      if (statusTab === "sponsors" && (!isSponsor || isArchived)) return false;
      if (statusTab === "exhibitors" && (!isExhibitor || isArchived)) return false;
      if (statusTab === "archived" && !isArchived) return false;

      // Industry filter
      if (selectedIndustry !== "all" && o.industry !== selectedIndustry) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = o.name?.toLowerCase().includes(q);
        const matchesIndustry = o.industry?.toLowerCase().includes(q);
        const matchesContact = o.contact?.toLowerCase().includes(q);
        const matchesEmail = o.email?.toLowerCase().includes(q);
        if (!matchesName && !matchesIndustry && !matchesContact && !matchesEmail) return false;
      }

      return true;
    });
  }, [organizations, searchQuery, selectedIndustry, statusTab, sponsors, exhibitors]);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in select-none">
      
      {/* 1. Header (Clean title without icon + Blue action button) */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Partner Organizations</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-black border border-blue-100">
              {organizations.length} Companies
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Manage partner corporations, institutions, sponsors, and exhibitors connected to your event.
          </p>
        </div>

        <button 
          onClick={() => onOpenModal("org")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition-all hover:shadow-md hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer shadow-xs shadow-blue-100 shrink-0"
        >
          <Plus size={16} />
          <span>Add Organization</span>
        </button>
      </header>

      {/* 2. KPI Executive Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-slate-800 leading-tight">{organizations.length}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Companies</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Award size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-amber-700 leading-tight">{activeSponsorsCount}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Active Sponsors</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Store size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-blue-700 leading-tight">{activeExhibitorsCount}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Active Exhibitors</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-purple-700 leading-tight">{Math.max(1, industryOptions.length - 1)}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Sectors Represented</div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar with Status Tabs & View Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Status Tabs (All, Active, Sponsors, Exhibitors, Archived) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto scrollbar-none">
          <button
            onClick={() => setStatusTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusTab === "all" ? "bg-white text-slate-900 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All ({organizations.length})
          </button>
          <button
            onClick={() => setStatusTab("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusTab === "active" ? "bg-white text-blue-700 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusTab("sponsors")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusTab === "sponsors" ? "bg-white text-amber-700 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sponsors ({activeSponsorsCount})
          </button>
          <button
            onClick={() => setStatusTab("exhibitors")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusTab === "exhibitors" ? "bg-white text-blue-700 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Exhibitors ({activeExhibitorsCount})
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

        {/* Search, Industry Filter & Grid/Table Switcher */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, sector..."
              className="w-full pl-8.5 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Industry Filter using SearchableSelect */}
          <div className="w-full sm:w-48">
            <SearchableSelect
              value={selectedIndustry}
              onChange={(val) => setSelectedIndustry(val || "all")}
              options={industryOptions}
              placeholder="All Industries"
              searchPlaceholder="Filter industry..."
              isClearable={false}
            />
          </div>

          {/* Grid vs Table View Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "grid" ? "bg-white text-blue-600 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline text-[11px]">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "table" ? "bg-white text-blue-600 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Table View"
            >
              <List size={14} />
              <span className="hidden sm:inline text-[11px]">Table</span>
            </button>
          </div>

        </div>

      </div>

      {/* 4. CONTENT: Grid View OR Table View */}
      {filteredOrganizations.length === 0 ? (
        <div className="bg-white rounded-3xl p-14 text-center border border-dashed border-slate-200 shadow-xs space-y-3 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No organizations found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Try adjusting search keywords, clearing industry filters, or register your first partner organization.
          </p>
          <button
            onClick={() => onOpenModal("org")}
            className="mt-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Add Organization
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* ────────── GRID VIEW ────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrganizations.map(o => {
            const isArchived = o.isArchived || o.status === 'archived';
            const { isSponsor, isExhibitor } = getOrgRoles(o);

            return (
              <div 
                key={o.id} 
                className={`bg-white border ${isArchived ? 'border-slate-200 bg-slate-50/50 opacity-75' : 'border-slate-200/90'} rounded-3xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between relative group`}
              >
                <div>
                  {/* Top Row: Logo & Actions */}
                  <div className="flex justify-between items-start mb-3.5">
                    {o.logo ? (
                      <img 
                        src={o.logo} 
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shadow-xs bg-white" 
                        alt={o.name} 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-black text-xl flex items-center justify-center select-none border border-blue-100">
                        {o.name ? o.name.charAt(0).toUpperCase() : 'O'}
                      </div>
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      {!isArchived && (
                        <button 
                          onClick={() => onOpenModal("org", o)}
                          className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="Edit Organization"
                        >
                          Edit
                        </button>
                      )}

                      {isArchived ? (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleRestore(o.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Restore"
                          >
                            <RotateCcw size={13} />
                          </button>
                          <button 
                            onClick={() => handleDeletePermanent(o.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Permanently Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleArchive(o.id)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="Archive Organization"
                        >
                          <Archive size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Name & Role Badges */}
                  <div className="flex flex-col gap-1.5 mb-3">
                    <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center justify-between">
                      <span className="truncate">{o.name}</span>
                      {isArchived && (
                        <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
                          Archived
                        </span>
                      )}
                    </h3>

                    {/* Sector & Event Role Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                        {o.industry || "General Business"}
                      </span>

                      {isSponsor && (
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          {isSponsor.tier ? `${isSponsor.tier.toUpperCase()} SPONSOR` : 'SPONSOR'}
                        </span>
                      )}

                      {isExhibitor && (
                        <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                          {isExhibitor.booth || isExhibitor.boothNumber || 'BOOTH'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact Info & Details */}
                  <div className="border-t border-slate-100 pt-3 flex flex-col gap-1.5 text-xs text-slate-600 font-medium">
                    {o.contact && (
                      <span className="flex items-center gap-2 truncate">
                        <Users size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{o.contact} {o.jobTitle ? `(${o.jobTitle})` : ''}</span>
                      </span>
                    )}

                    {o.email && (
                      <span className="flex items-center gap-2 truncate">
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        <a href={`mailto:${o.email}`} className="truncate hover:text-blue-600">{o.email}</a>
                      </span>
                    )}

                    {o.phone && (
                      <span className="flex items-center gap-2 truncate">
                        <Phone size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{o.phone}</span>
                      </span>
                    )}

                    {o.website && (
                      <span className="flex items-center gap-2 truncate mt-0.5">
                        <Globe size={12} className="text-slate-400 shrink-0" />
                        <a href={o.website.startsWith('http') ? o.website : `https://${o.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold truncate flex items-center gap-1">
                          <span>{o.website.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink size={10} />
                        </a>
                      </span>
                    )}
                  </div>
                </div>

                {/* 1-Click Conversion Actions (Clean buttons WITHOUT icons) */}
                {!isArchived && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    {!isSponsor && (
                      <button
                        onClick={() => onOpenModal("sponsor", {
                          orgId: o.id,
                          name: o.name,
                          logo: o.logo,
                          image: o.logo,
                          industry: o.industry,
                          website: o.website,
                          contact: o.contact
                        })}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all text-center cursor-pointer"
                        title="Make this company an official sponsor"
                      >
                        Make Sponsor
                      </button>
                    )}

                    {!isExhibitor && (
                      <button
                        onClick={() => onOpenModal("exhibitor", {
                          orgId: o.id,
                          name: o.name,
                          logo: o.logo,
                          industry: o.industry,
                          email: o.email,
                          phone: o.phone,
                          contact: o.contact
                        })}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all text-center cursor-pointer"
                        title="Assign an exhibition booth for this company"
                      >
                        Make Exhibitor
                      </button>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        /* ────────── TABLE VIEW ────────── */
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-left text-xs font-semibold text-slate-700">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider select-none">
                  <th className="py-4 px-6">Company & Sector</th>
                  <th className="py-4 px-6">Primary Contact</th>
                  <th className="py-4 px-6">Event Roles</th>
                  <th className="py-4 px-6">Website / Link</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrganizations.map(o => {
                  const isArchived = o.isArchived || o.status === 'archived';
                  const { isSponsor, isExhibitor } = getOrgRoles(o);

                  return (
                    <tr 
                      key={o.id}
                      className={`hover:bg-slate-50/60 transition-colors ${isArchived ? 'opacity-65 bg-slate-50/30' : ''}`}
                    >
                      {/* Company & Sector */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {o.logo ? (
                            <img src={o.logo} className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0 bg-white" alt={o.name} />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-black text-sm flex items-center justify-center shrink-0 border border-blue-100">
                              {o.name ? o.name.charAt(0).toUpperCase() : 'O'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-sm truncate">{o.name}</h4>
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                              {o.industry || "General"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Primary Contact */}
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 truncate">{o.contact || "—"}</div>
                          {o.email && (
                            <a href={`mailto:${o.email}`} className="text-slate-500 hover:text-blue-600 block truncate text-[11px]">
                              {o.email}
                            </a>
                          )}
                          {o.phone && (
                            <span className="text-slate-400 block text-[11px] font-medium">{o.phone}</span>
                          )}
                        </div>
                      </td>

                      {/* Event Roles */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isSponsor && (
                            <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                              {isSponsor.tier ? `${isSponsor.tier.toUpperCase()} SPONSOR` : 'SPONSOR'}
                            </span>
                          )}
                          {isExhibitor && (
                            <span className="text-[10px] font-extrabold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl">
                              {isExhibitor.booth || isExhibitor.boothNumber || 'BOOTH ALLOCATED'}
                            </span>
                          )}
                          {!isSponsor && !isExhibitor && (
                            <span className="text-[11px] text-slate-400 font-medium">Partner</span>
                          )}
                        </div>
                      </td>

                      {/* Website */}
                      <td className="py-4 px-6">
                        {o.website ? (
                          <a 
                            href={o.website.startsWith('http') ? o.website : `https://${o.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline font-bold text-xs inline-flex items-center gap-1 max-w-[150px] truncate"
                          >
                            <span>{o.website.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {isArchived ? (
                          <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            Archived
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isArchived && !isSponsor && (
                            <button
                              onClick={() => onOpenModal("sponsor", {
                                orgId: o.id,
                                name: o.name,
                                logo: o.logo,
                                image: o.logo,
                                industry: o.industry,
                                website: o.website,
                                contact: o.contact
                              })}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold transition-all cursor-pointer"
                              title="Make Sponsor"
                            >
                              Make Sponsor
                            </button>
                          )}

                          {!isArchived && !isExhibitor && (
                            <button
                              onClick={() => onOpenModal("exhibitor", {
                                orgId: o.id,
                                name: o.name,
                                logo: o.logo,
                                industry: o.industry,
                                email: o.email,
                                phone: o.phone,
                                contact: o.contact
                              })}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition-all cursor-pointer"
                              title="Make Exhibitor"
                            >
                              Make Exhibitor
                            </button>
                          )}

                          {!isArchived && (
                            <button
                              onClick={() => onOpenModal("org", o)}
                              className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Edit"
                            >
                              Edit
                            </button>
                          )}

                          {isArchived ? (
                            <button
                              onClick={() => handleRestore(o.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Restore"
                            >
                              <RotateCcw size={13} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleArchive(o.id)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Archive"
                            >
                              <Archive size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

// 5. EVENT SPONSORS VIEW
function SponsorsView({ state, onUpdateState, onOpenModal }) {
  const { sponsors = [], organizations = [] } = state;
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  const handleArchive = (id) => {
    if (confirm("Archive this sponsor? (Preserved in archives)")) {
      onUpdateState("sponsors", sponsors.map(s => s.id === id ? { ...s, isArchived: true, status: 'archived' } : s));
    }
  };

  const handleRestore = (id) => {
    onUpdateState("sponsors", sponsors.map(s => s.id === id ? { ...s, isArchived: false, status: 'active' } : s));
  };

  const handleDeletePermanent = (id) => {
    if (confirm("Permanently delete this sponsor? This action cannot be undone.")) {
      onUpdateState("sponsors", sponsors.filter(s => s.id !== id));
    }
  };

  const TIERS_CONFIG = [
    { key: "diamond", name: "Diamond Tier", color: "text-sky-600 border-sky-100 bg-sky-50/40" },
    { key: "gold", name: "Gold Tier", color: "text-amber-600 border-amber-100 bg-amber-50/40" },
    { key: "silver", name: "Silver Tier", color: "text-slate-600 border-slate-200 bg-slate-50/50" },
    { key: "bronze", name: "Bronze Tier", color: "text-amber-800 border-orange-100 bg-orange-50/30" },
    { key: "title", name: "Title / Presenting", color: "text-purple-700 border-purple-100 bg-purple-50/40" },
    { key: "partner", name: "Strategic Partners", color: "text-blue-700 border-blue-100 bg-blue-50/40" },
    { key: "custom", name: "Custom Packages", color: "text-indigo-700 border-indigo-100 bg-indigo-50/40" }
  ];

  const filteredSponsors = useMemo(() => {
    return sponsors.filter(s => {
      if (tierFilter !== "all" && (s.tier || 'silver').toLowerCase() !== tierFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name?.toLowerCase().includes(q);
        const matchesIndustry = s.industry?.toLowerCase().includes(q);
        if (!matchesName && !matchesIndustry) return false;
      }
      return true;
    });
  }, [sponsors, tierFilter, searchQuery]);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in select-none">
      
      {/* Header (Clean title without icon + Blue action button) */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Event Sponsors</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-black border border-blue-100">
              {sponsors.length} Sponsors
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Sponsors categorized by tier level. Prominently featured on your public landing page.
          </p>
        </div>

        <button 
          onClick={() => onOpenModal("sponsor")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition-all hover:shadow-md hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer shadow-xs shadow-blue-100 shrink-0"
        >
          <Plus size={16} />
          <span>Add Sponsor</span>
        </button>
      </header>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sponsor by name..."
            className="w-full pl-8.5 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="w-full sm:w-48">
            <SearchableSelect
              value={tierFilter}
              onChange={(val) => setTierFilter(val || "all")}
              options={[
                { value: "all", label: "All Tiers" },
                { value: "diamond", label: "Diamond" },
                { value: "gold", label: "Gold" },
                { value: "silver", label: "Silver" },
                { value: "bronze", label: "Bronze" },
                { value: "title", label: "Title" },
                { value: "partner", label: "Strategic" },
                { value: "custom", label: "Custom" }
              ]}
              isClearable={false}
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "grid" ? "bg-white text-blue-600 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline text-[11px]">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "table" ? "bg-white text-blue-600 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Table View"
            >
              <List size={14} />
              <span className="hidden sm:inline text-[11px]">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid or Table */}
      {filteredSponsors.length === 0 ? (
        <div className="bg-white rounded-3xl p-14 text-center border border-dashed border-slate-200 shadow-xs space-y-3 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No sponsors found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Add official corporate sponsors or link partner organizations to sponsor packages.
          </p>
          <button
            onClick={() => onOpenModal("sponsor")}
            className="mt-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Add Sponsor
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="flex flex-col gap-5">
          {TIERS_CONFIG.map(tier => {
            const list = filteredSponsors.filter(s => (s.tier || 'silver').toLowerCase() === tier.key.toLowerCase());
            if (tierFilter !== "all" && tierFilter.toLowerCase() !== tier.key.toLowerCase()) return null;
            if (list.length === 0 && tierFilter !== "all") return null;

            return (
              <div key={tier.key} className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col gap-5">
                <div className="flex justify-between items-center pb-3.5 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>{tier.name}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {list.length}
                    </span>
                  </h3>
                </div>

                {list.length === 0 ? (
                  <p className="text-slate-400 text-xs italic py-2">No sponsors registered in this tier.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {list.map(s => {
                      const isArchived = s.isArchived || s.status === 'archived';
                      const matchedOrg = organizations.find(o => o.id === s.orgId || o.id === s.org_id);

                      return (
                        <div 
                          key={s.id} 
                          className={`bg-slate-50 border ${isArchived ? 'border-slate-300 opacity-70' : 'border-slate-200'} rounded-2xl p-4 flex flex-col items-center text-center gap-2.5 relative group hover:bg-white hover:border-blue-200 hover:shadow-xs transition-all duration-200`}
                        >
                          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            {!isArchived && (
                              <button 
                                onClick={() => onOpenModal("sponsor", s)}
                                className="text-blue-600 hover:bg-blue-50 p-1 rounded-md text-[10px] font-bold cursor-pointer"
                                title="Edit Sponsor"
                              >
                                Edit
                              </button>
                            )}
                            {isArchived ? (
                              <button 
                                onClick={() => handleRestore(s.id)}
                                className="text-emerald-600 hover:bg-emerald-50 p-1 rounded-md cursor-pointer"
                                title="Restore"
                              >
                                <RotateCcw size={12} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleArchive(s.id)}
                                className="text-slate-400 hover:text-amber-600 hover:bg-amber-50 p-1 rounded-md cursor-pointer"
                                title="Archive Sponsor"
                              >
                                <Archive size={12} />
                              </button>
                            )}
                          </div>

                          <img 
                            src={s.image || s.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`} 
                            className="w-14 h-14 rounded-2xl object-cover shadow-xs bg-white border border-slate-100 p-0.5" 
                            alt={s.name} 
                          />

                          <div className="w-full flex flex-col items-center gap-0.5">
                            <h4 className="text-xs font-black text-slate-900 truncate w-full">{s.name}</h4>
                            {matchedOrg && (
                              <span className="text-[9px] font-bold text-slate-400 truncate flex items-center gap-1">
                                <Building2 size={10} />
                                <span>{matchedOrg.name}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
                            {s.amount && (
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                {Number(s.amount).toLocaleString()} {s.currency || 'DZD'}
                              </span>
                            )}
                            {s.booth && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                {s.booth}
                              </span>
                            )}
                          </div>

                          {s.website && s.website !== "#" && (
                            <a 
                              href={s.website.startsWith('http') ? s.website : `https://${s.website}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[10px] text-blue-600 hover:underline font-bold mt-1 flex items-center gap-1"
                            >
                              <span>Website</span>
                              <ExternalLink size={9} />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-left text-xs font-semibold text-slate-700">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider select-none">
                  <th className="py-4 px-6">Sponsor</th>
                  <th className="py-4 px-6">Tier Level</th>
                  <th className="py-4 px-6">Linked Organization</th>
                  <th className="py-4 px-6">Contribution</th>
                  <th className="py-4 px-6">Booth</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSponsors.map(s => {
                  const matchedOrg = organizations.find(o => o.id === s.orgId || o.id === s.org_id);
                  const isArchived = s.isArchived || s.status === 'archived';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img 
                            src={s.image || s.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`} 
                            className="w-10 h-10 rounded-xl object-cover border border-slate-100 bg-white" 
                            alt={s.name} 
                          />
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm">{s.name}</h4>
                            {s.website && (
                              <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-[11px] font-bold">
                                {s.website.replace(/^https?:\/\//, '')}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                          {s.tier || 'Silver'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-slate-600 font-bold">{matchedOrg ? matchedOrg.name : '—'}</span>
                      </td>
                      <td className="py-4 px-6">
                        {s.amount ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg text-xs">
                            {Number(s.amount).toLocaleString()} {s.currency || 'DZD'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-4 px-6">
                        {s.booth ? (
                          <span className="font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg text-xs">
                            {s.booth}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenModal("sponsor", s)}
                            className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => isArchived ? handleRestore(s.id) : handleArchive(s.id)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg cursor-pointer"
                          >
                            {isArchived ? <RotateCcw size={13} /> : <Archive size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

// 6. EVENT EXHIBITORS VIEW
function ExhibitorsView({ state, onUpdateState, onOpenModal }) {
  const { exhibitors = [], organizations = [] } = state;
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  const handleDelete = (id) => {
    if (confirm("Remove this exhibitor?")) {
      onUpdateState("exhibitors", exhibitors.filter(e => e.id !== id));
    }
  };

  const filteredExhibitors = useMemo(() => {
    return exhibitors.filter(e => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = e.name?.toLowerCase().includes(q);
        const matchesBooth = (e.booth || e.boothNumber)?.toLowerCase().includes(q);
        const matchesContact = (e.contact || e.contactPerson)?.toLowerCase().includes(q);
        const matchesEmail = (e.email || e.contactEmail)?.toLowerCase().includes(q);
        if (!matchesName && !matchesBooth && !matchesContact && !matchesEmail) return false;
      }
      return true;
    });
  }, [exhibitors, searchQuery]);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in select-none">
      
      {/* Header (Clean title without icon + Blue action button) */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Event Exhibitors</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-black border border-blue-100">
              {exhibitors.length} Exhibitors
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Manage exhibition booths, floor plan allocation, and representative credentials.
          </p>
        </div>

        <button 
          onClick={() => onOpenModal("exhibitor")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition-all hover:shadow-md hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer shadow-xs shadow-blue-100 shrink-0"
        >
          <Plus size={16} />
          <span>Add Exhibitor</span>
        </button>
      </header>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exhibitor, booth #, staff..."
            className="w-full pl-8.5 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-slate-500">
            Total: <strong className="text-slate-800">{filteredExhibitors.length}</strong> booths
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "grid" ? "bg-white text-blue-600 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline text-[11px]">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "table" ? "bg-white text-blue-600 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Table View"
            >
              <List size={14} />
              <span className="hidden sm:inline text-[11px]">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid or Table */}
      {filteredExhibitors.length === 0 ? (
        <div className="bg-white rounded-3xl p-14 text-center border border-dashed border-slate-200 shadow-xs space-y-3 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Store size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No exhibitors registered yet</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Assign booth spaces to registered organizations or add a standalone exhibitor.
          </p>
          <button
            onClick={() => onOpenModal("exhibitor")}
            className="mt-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Add Exhibitor
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExhibitors.map(e => {
            const matchedOrg = organizations.find(o => o.id === e.orgId || o.id === e.org_id);
            const boothDisplay = e.booth || e.boothNumber || "Unassigned";

            return (
              <div 
                key={e.id} 
                className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex justify-between items-start mb-3.5">
                    {e.logo || e.logo_url ? (
                      <img 
                        src={e.logo || e.logo_url} 
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shadow-xs bg-white" 
                        alt={e.name} 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-black text-xl flex items-center justify-center select-none border border-blue-100">
                        {e.name ? e.name.charAt(0).toUpperCase() : 'E'}
                      </div>
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button 
                        onClick={() => onOpenModal("exhibitor", e)}
                        className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        title="Edit Exhibitor"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(e.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        title="Remove Exhibitor"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 mb-3">
                    <h3 className="text-base font-black text-slate-900 tracking-tight truncate">
                      {e.name}
                    </h3>
                    {matchedOrg && (
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Building2 size={10} />
                        <span>{matchedOrg.name}</span>
                      </span>
                    )}
                  </div>

                  <div className="mb-3.5">
                    <span className="text-xs font-black text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl inline-flex items-center gap-1.5">
                      <span>{boothDisplay}</span>
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex flex-col gap-1.5 text-xs text-slate-600 font-medium">
                    {(e.contact || e.contactPerson) && (
                      <span className="flex items-center gap-2 truncate">
                        <Users size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{e.contact || e.contactPerson}</span>
                      </span>
                    )}
                    {(e.email || e.contactEmail) && (
                      <span className="flex items-center gap-2 truncate">
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        <a href={`mailto:${e.email || e.contactEmail}`} className="truncate hover:text-blue-600">{e.email || e.contactEmail}</a>
                      </span>
                    )}
                    {(e.phone || e.contactPhone) && (
                      <span className="flex items-center gap-2 truncate">
                        <Phone size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{e.phone || e.contactPhone}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Ticket size={12} className="text-blue-500" />
                    <span>{e.staffCount || e.badgeCount || 2} Staff Passes</span>
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold">{e.boothType || "Standard"}</span>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-left text-xs font-semibold text-slate-700">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider select-none">
                  <th className="py-4 px-6">Exhibitor</th>
                  <th className="py-4 px-6">Booth Allocation</th>
                  <th className="py-4 px-6">Staff Contact</th>
                  <th className="py-4 px-6">Passes Quota</th>
                  <th className="py-4 px-6">Linked Organization</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExhibitors.map(e => {
                  const matchedOrg = organizations.find(o => o.id === e.orgId || o.id === e.org_id);

                  return (
                    <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {e.logo || e.logo_url ? (
                            <img src={e.logo || e.logo_url} className="w-10 h-10 rounded-xl object-cover border border-slate-100 bg-white" alt={e.name} />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-black text-sm flex items-center justify-center border border-blue-100">
                              {e.name ? e.name.charAt(0).toUpperCase() : 'E'}
                            </div>
                          )}
                          <h4 className="font-extrabold text-slate-900 text-sm">{e.name}</h4>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-black text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl text-xs">
                          {e.booth || e.boothNumber || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900">{e.contact || e.contactPerson || '—'}</div>
                          {(e.email || e.contactEmail) && (
                            <a href={`mailto:${e.email || e.contactEmail}`} className="text-slate-500 hover:text-blue-600 block text-[11px]">
                              {e.email || e.contactEmail}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-700">{e.staffCount || e.badgeCount || 2} Passes</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-slate-600 font-bold">{matchedOrg ? matchedOrg.name : '—'}</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenModal("exhibitor", e)}
                            className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

// 7. SPEAKERS DIRECTORY VIEW
function SpeakersDirectoryView({ state, onUpdateState, onUploadFile }) {
  const { sessions, attendees = [] } = state;
  const [selectedAttendeeId, setSelectedAttendeeId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [speakerMode, setSpeakerMode] = useState("attendee"); // "attendee" | "custom"
  const [customName, setCustomName] = useState("");
  const [customRole, setCustomRole] = useState("speaker");
  const [speakerImg, setSpeakerImg] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Extract unique speakers/moderators dynamically from sessions + attendees marked as speaker
  const directory = [];
  const seenNames = new Set();

  sessions.forEach(session => {
    (session.speakers || []).forEach(s => {
      if (!seenNames.has(s.name)) {
        seenNames.add(s.name);
        directory.push({ name: s.name, image: s.image, role: "speaker", sessionsCount: 1 });
      } else {
        const match = directory.find(x => x.name === s.name);
        if (match) {
          match.sessionsCount++;
          if (!match.image && s.image) match.image = s.image;
        }
      }
    });

    (session.moderators || []).forEach(m => {
      if (!seenNames.has(m.name)) {
        seenNames.add(m.name);
        directory.push({ name: m.name, image: m.image, role: "moderator", sessionsCount: 1 });
      } else {
        const match = directory.find(x => x.name === m.name);
        if (match) {
          match.sessionsCount++;
          if (!match.image && m.image) match.image = m.image;
        }
      }
    });
  });

  // Include attendees marked as speakers
  attendees.forEach(a => {
    if (a.isSpeaker && !seenNames.has(a.name)) {
      seenNames.add(a.name);
      directory.push({ name: a.name, image: a.image, role: "speaker", sessionsCount: 0 });
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      let publicUrl = null;
      if (onUploadFile) {
        publicUrl = await onUploadFile(file, 'floor-plans');
      }
      if (!publicUrl) {
        publicUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
      }
      if (publicUrl) setSpeakerImg(publicUrl);
    } catch (err) {
      console.warn("Storage upload notice, using local fallback:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) setSpeakerImg(reader.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleCardPhotoReplace = async (personName, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let publicUrl = null;
      if (onUploadFile) {
        publicUrl = await onUploadFile(file, 'floor-plans');
      }
      if (!publicUrl) {
        publicUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
      }

      if (publicUrl) {
        // 1. Update all sessions containing this speaker/moderator
        const updatedSessions = sessions.map(s => {
          let mod = false;
          const newSpeakers = (s.speakers || []).map(sp => {
            if (sp.name === personName) {
              mod = true;
              return { ...sp, image: publicUrl };
            }
            return sp;
          });
          const newModerators = (s.moderators || []).map(m => {
            if (m.name === personName) {
              mod = true;
              return { ...m, image: publicUrl };
            }
            return m;
          });
          return mod ? { ...s, speakers: newSpeakers, moderators: newModerators } : s;
        });
        onUpdateState("sessions", updatedSessions);

        // 2. Update attendee if exists
        const updatedAttendees = attendees.map(a => a.name === personName ? { ...a, image: publicUrl } : a);
        onUpdateState("attendees", updatedAttendees);
      }
    } catch (err) {
      console.error("Card photo replace error:", err);
    } finally {
      e.target.value = "";
    }
  };

  const handleAddSpeakerSubmit = (e) => {
    e.preventDefault();

    let targetName = "";
    let targetImage = speakerImg;

    if (speakerMode === "attendee") {
      if (!selectedAttendeeId) {
        alert("Please select an attendee.");
        return;
      }
      const attendee = attendees.find(a => String(a.id) === selectedAttendeeId);
      if (!attendee) return;
      targetName = attendee.name;
      targetImage = targetImage || attendee.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(attendee.name)}&background=2563eb&color=fff`;
    } else {
      if (!customName.trim()) {
        alert("Please enter a speaker name.");
        return;
      }
      targetName = customName.trim();
      targetImage = targetImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetName)}&background=2563eb&color=fff`;
    }

    // 1. If a session is chosen, assign to it
    if (selectedSessionId) {
      const session = sessions.find(s => String(s.id) === selectedSessionId);
      if (session) {
        const isMod = customRole === "moderator";
        const targetListKey = isMod ? "moderators" : "speakers";
        const currentList = [...(session[targetListKey] || [])];

        if (!currentList.find(p => p.name.toLowerCase() === targetName.toLowerCase())) {
          currentList.push({
            id: Date.now(),
            name: targetName,
            image: targetImage
          });

          const updatedSessions = sessions.map(s => String(s.id) === selectedSessionId ? { ...s, [targetListKey]: currentList } : s);
          onUpdateState("sessions", updatedSessions);

          if (speakerMode === "attendee") {
            const updatedAttendees = attendees.map(a => String(a.id) === selectedAttendeeId ? { ...a, isSpeaker: true, image: targetImage || a.image } : a);
            onUpdateState("attendees", updatedAttendees);
          }

          alert(`Successfully added ${targetName} as ${isMod ? 'a moderator' : 'a speaker'} to "${session.title}"!`);
          resetForm();
        } else {
          alert(`${targetName} is already added in this session.`);
        }
      }
    } else {
      // 2. Global directory
      if (speakerMode === "attendee") {
        const updatedAttendees = attendees.map(a => String(a.id) === selectedAttendeeId ? { ...a, isSpeaker: true, image: targetImage || a.image } : a);
        onUpdateState("attendees", updatedAttendees);
      } else {
        // Create an entry in attendees or first session
        const newAttendee = {
          id: `spk-${Date.now()}`,
          name: targetName,
          email: `${targetName.toLowerCase().replace(/\s+/g, '.')}@speaker.event`,
          ticketType: "Speaker",
          isSpeaker: true,
          image: targetImage,
          status: "Confirmed"
        };
        onUpdateState("attendees", [newAttendee, ...attendees]);
      }
      alert(`Successfully added ${targetName} to the Speakers Directory!`);
      resetForm();
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setSelectedAttendeeId("");
    setSelectedSessionId("");
    setCustomName("");
    setSpeakerImg("");
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <header className="flex justify-between items-center select-none">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Speakers & Moderators</h2>
          <p className="text-sm text-slate-500">List of all experts speaking or moderating sessions. Gathered dynamically from your timeline.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-650 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all hover:shadow duration-200 cursor-pointer"
        >
          Add Speaker
        </button>
      </header>

      {showAddForm && (
        <div className="bg-white border border-indigo-150 p-6 rounded-3xl shadow-sm mb-6 flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Add Expert to Speakers Directory</h3>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setSpeakerMode("attendee")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  speakerMode === "attendee" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                From Attendees
              </button>
              <button
                type="button"
                onClick={() => setSpeakerMode("custom")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  speakerMode === "custom" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                New Speaker
              </button>
            </div>
          </div>

          <form onSubmit={handleAddSpeakerSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {speakerMode === "attendee" ? (
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase">1. Select Registered Attendee</label>
                <SearchableSelect
                  value={selectedAttendeeId}
                  onChange={(val) => setSelectedAttendeeId(val)}
                  options={attendees.map(a => ({ value: a.id, label: `${a.name} (${a.email})` }))}
                  placeholder="-- Choose Attendee --"
                  searchPlaceholder="Search attendee by name or email..."
                  required
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase">1. Speaker Full Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Dr. Alex Vance"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none bg-white"
                  required
                />
              </div>
            )}

            {/* Photo Upload */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[10px] font-bold text-slate-400 uppercase">2. Photo (Optional)</label>
              <div className="flex items-center gap-2">
                <label className={`flex-1 px-3 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 truncate ${
                  speakerImg ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                }`}>
                  {isUploadingPhoto ? (
                    <Loader2 size={13} className="animate-spin text-indigo-600" />
                  ) : speakerImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={speakerImg} className="w-4 h-4 rounded-full object-cover border border-indigo-200" alt="" />
                  ) : (
                    <Camera size={13} />
                  )}
                  <span>{isUploadingPhoto ? "Uploading..." : speakerImg ? "Photo Attached" : "Upload Photo"}</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                {speakerImg && (
                  <button
                    type="button"
                    onClick={() => setSpeakerImg("")}
                    className="p-2 text-rose-500 hover:text-rose-700 rounded-xl border border-slate-200 hover:bg-rose-50 cursor-pointer"
                    title="Clear photo"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Role & Session */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[10px] font-bold text-slate-400 uppercase">3. Role &amp; Session</label>
              <div className="flex gap-1.5">
                <div className="w-28 shrink-0">
                  <SearchableSelect
                    value={customRole}
                    onChange={(val) => setCustomRole(val)}
                    options={[
                      { value: "speaker", label: "Speaker" },
                      { value: "moderator", label: "Moderator" }
                    ]}
                    placeholder="Role..."
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <SearchableSelect
                    value={selectedSessionId}
                    onChange={(val) => setSelectedSessionId(val)}
                    options={[
                      { value: "", label: "-- None (Global) --" },
                      ...sessions.map(s => ({ value: s.id, label: s.title }))
                    ]}
                    placeholder="-- Select Session --"
                    searchPlaceholder="Search session by title..."
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 bg-indigo-650 hover:bg-indigo-750 text-white font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer shadow-sm text-center"
              >
                Confirm Speaker
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-3 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {directory.length === 0 ? (
          <div className="col-span-full text-center py-20 text-slate-400">
            No speakers or moderators found in scheduled timeline sessions. Add sessions in the Calendar tab with speaker names!
          </div>
        ) : (
          directory.map((person, idx) => (
            <div key={idx} className="group bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center gap-4 hover:shadow-md hover:border-indigo-150 transition-all duration-200 relative">
              {/* Clickable Avatar to Replace Photo on the Fly */}
              <label className="relative cursor-pointer" title="Click to upload / change photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={person.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=random`}
                  className="w-20 h-20 rounded-full object-cover shadow-sm border-2 border-indigo-50 group-hover:border-indigo-300 transition-colors"
                  alt={person.name}
                />
                <span className="absolute inset-0 bg-black/45 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={18} />
                  <span className="text-[9px] font-bold mt-0.5">Change</span>
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleCardPhotoReplace(person.name, e)} 
                  className="hidden" 
                />
              </label>

              <div className="flex flex-col gap-1 w-full">
                <h3 className="text-sm font-bold text-slate-850 truncate">{person.name}</h3>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full w-fit mx-auto ${person.role === "moderator" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-indigo-50 text-indigo-700 border border-indigo-100"}`}>
                  {person.role}
                </span>
              </div>
              <div className="border-t border-slate-100 w-full pt-3 mt-auto flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold">
                  {person.sessionsCount > 0 ? `${person.sessionsCount} session${person.sessionsCount > 1 ? 's' : ''}` : "Directory Speaker"}
                </span>
                <label className="text-[10px] font-bold text-indigo-650 hover:text-indigo-800 cursor-pointer">
                  Edit Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleCardPhotoReplace(person.name, e)} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 8. TICKETS VIEW
function TicketsView({ state, onUpdateState, onOpenModal, onSwitchView }) {
  const { tickets, attendees, forms = [] } = state;
  const [ticketFilter, setTicketFilter] = useState("active"); // "active" | "archived" | "all"

  const handleArchive = (id) => {
    if (confirm("Archive this ticket tier? (Tickets and attendee data are safely preserved)")) {
      onUpdateState("tickets", tickets.map(t => t.id === id ? { ...t, status: 'Archived', isArchived: true } : t));
    }
  };

  const handleRestore = (id) => {
    onUpdateState("tickets", tickets.map(t => t.id === id ? { ...t, status: 'Active', isArchived: false } : t));
  };

  const handleDeletePermanent = (id) => {
    if (confirm("Permanently delete this ticket tier? This action cannot be undone.")) {
      onUpdateState("tickets", tickets.filter(t => t.id !== id));
    }
  };

  const filteredTickets = tickets.filter(t => {
    const isArchived = t.isArchived || t.status === 'Archived';
    if (ticketFilter === "active") return !isArchived;
    if (ticketFilter === "archived") return isArchived;
    return true;
  });

  const activeCount = tickets.filter(t => !t.isArchived && t.status !== 'Archived').length;
  const archivedCount = tickets.filter(t => t.isArchived || t.status === 'Archived').length;

  const totalCap = tickets.reduce((sum, t) => sum + (t.maxQty || 100), 0);
  const totalSold = attendees.length;
  const totalSoldPct = totalCap > 0 ? (totalSold / totalCap) * 100 : 0;

  const totalRev = attendees.reduce((sum, a) => {
    const matchingTicket = tickets.find(t => t.name === a.ticketType);
    return sum + (matchingTicket ? matchingTicket.price : 0);
  }, 0);

  return (
    <div className="flex flex-col gap-8 w-full">
      <header className="flex flex-wrap justify-between items-center gap-4 select-none">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tickets & Pricing</h2>
          <p className="text-sm text-slate-500">Manage ticket tiers, prices, availability, and sales performance.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => onSwitchView && onSwitchView("forms")}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-xs cursor-pointer"
          >
            Customize Registration Forms
          </button>
          <button 
            onClick={() => onOpenModal("ticket")}
            className="bg-indigo-650 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all hover:shadow duration-200 cursor-pointer"
          >
            Add Ticket Tier
          </button>
        </div>
      </header>

      {/* Ticket Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tickets Sold</span>
            <div className="text-2xl font-extrabold text-slate-800 mt-2">{totalSold} <span className="text-sm font-semibold text-slate-400">/ {totalCap}</span></div>
          </div>
          <div className="mt-4">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${totalSoldPct}%` }}></div>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold mt-1 block">{totalSoldPct.toFixed(1)}% capacity filled</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ticket Revenue</span>
            <div className="text-2xl font-extrabold text-slate-800 mt-2">{totalRev.toLocaleString()} <span className="text-sm font-bold text-slate-400">DZD</span></div>
          </div>
          <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1 mt-4">
            ↑ 15% clean conversion
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Tiers</span>
            <div className="text-2xl font-extrabold text-slate-800 mt-2">{activeCount}</div>
          </div>
          <span className="text-[10px] text-slate-450 font-semibold mt-4">
            {tickets.filter(t => !t.isArchived && t.status !== 'Archived').map(t => t.name).join(', ')}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTicketFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              ticketFilter === "active" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Active Tiers ({activeCount})
          </button>
          <button
            onClick={() => setTicketFilter("archived")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              ticketFilter === "archived" ? "bg-slate-700 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Archived ({archivedCount})
          </button>
          <button
            onClick={() => setTicketFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              ticketFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All ({tickets.length})
          </button>
        </div>
      </div>

      {/* Ticket Tiers list */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center text-slate-400 text-xs">
          {ticketFilter === "archived" ? "No archived ticket tiers." : "No active ticket tiers found."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((t) => {
            const isArchived = t.isArchived || t.status === 'Archived';
            const tierSold = attendees.filter(a => a.ticketType === t.name).length;
            const linkedForm = forms.find(f => f.id === t.formId);
            const badgeType = t.badgeType || "thermal_qr";

            return (
              <div key={t.id} className={`bg-white border-2 rounded-3xl p-6 sm:p-7 flex flex-col gap-4 relative shadow-xs hover:shadow-lg transition-all duration-300 ${isArchived ? 'border-slate-300 bg-slate-50/50 opacity-75' : t.isPopular ? 'border-amber-400 bg-gradient-to-b from-white to-amber-50/15 ring-2 ring-amber-400/20' : 'border-slate-200'}`}>
                {/* Top Badge Strip */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                      {badgeType === "thermal_qr" && "Thermal Ticket"}
                      {badgeType === "a6" && "A6 Lanyard"}
                      {badgeType === "a4" && "A4 Full Page"}
                    </span>
                    {isArchived && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                        Archived
                      </span>
                    )}
                    {t.requiresApproval && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Approval Required
                      </span>
                    )}
                  </div>

                  {!isArchived && t.isPopular && (
                    <span className="bg-amber-500 text-white text-[9px] font-extrabold uppercase py-0.5 px-2.5 rounded-full shadow-xs flex items-center gap-1 shrink-0">
                      ★ Best Seller
                    </span>
                  )}
                </div>
                
                {/* Ticket Name (Bigger) & Price (Smaller) */}
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    {t.name}
                  </h3>
                  <div className="flex items-baseline gap-1.5 text-sm font-bold">
                    <span className="text-slate-850 font-black">
                      {t.price === 0 ? "Free" : `${t.price.toLocaleString()} DZD`}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      • {t.price > 0 ? "per attendee" : "Admission"}
                    </span>
                  </div>
                  {t.description && (
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  )}
                </div>

                {/* Simplified Connected Form UI */}
                {linkedForm && (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl w-fit">
                    <FileText size={12} className="text-slate-400 shrink-0" />
                    <span>Form: <strong className="text-slate-700 font-semibold">{linkedForm.title}</strong></span>
                  </div>
                )}

                {/* Perks List */}
                {(t.features || []).length > 0 && (
                  <ul className="flex flex-col gap-2 text-xs text-slate-600 font-medium border-t border-slate-100 pt-3.5">
                    {(t.features || []).slice(0, 4).map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2">
                        <Check size={13} className="text-emerald-600 shrink-0" />
                        <span className="truncate">{feature}</span>
                      </li>
                    ))}
                    {(t.features || []).length > 4 && (
                      <li className="text-[11px] text-slate-400 font-semibold pl-5">
                        + {(t.features || []).length - 4} more inclusions
                      </li>
                    )}
                  </ul>
                )}

                {/* Card Footer: Sold Count Left, Action Icon Buttons Right */}
                <div className="mt-auto border-t border-slate-100 pt-3.5 flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span className="font-bold text-slate-500">
                    Sold: {tierSold} / {t.maxQty >= 99999 ? "∞" : t.maxQty}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    {!isArchived && (
                      <button 
                        type="button"
                        onClick={() => onOpenModal("ticket", t)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                        title="Edit & Design Ticket Tier"
                      >
                        <Pencil size={15} />
                      </button>
                    )}
                    {isArchived ? (
                      <div className="flex items-center gap-1">
                        <button 
                          type="button"
                          onClick={() => handleRestore(t.id)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                          title="Restore Ticket Tier"
                        >
                          <RotateCcw size={15} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDeletePermanent(t.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                          title="Delete Ticket Tier Permanently"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => handleArchive(t.id)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                        title="Archive Ticket Tier"
                      >
                        <Archive size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 9. CHECK IN VIEW
function CheckInView({ state, onUpdateState }) {
  const { attendees = [], tickets = [] } = state;
  const [search, setSearch] = useState("");
  const [selectedBadgeAttendee, setSelectedBadgeAttendee] = useState(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scanInputCode, setScanInputCode] = useState("");
  const [scanFeedback, setScanFeedback] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleToggle = async (id) => {
    const target = attendees.find(a => a.id === id);
    if (!target) return;
    const isCurrentlyChecked = Boolean(target.status === "checked-in" || target.status === "checked_in" || target.checkedIn || target.checked_in);
    const nextState = !isCurrentlyChecked;
    const checkinTime = nextState ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
    const now = nextState ? new Date().toISOString() : null;

    const updated = attendees.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: nextState ? "checked_in" : "registered",
          checkedIn: nextState,
          checked_in: nextState,
          checkedInAt: now,
          checkinTime
        };
      }
      return a;
    });
    onUpdateState("attendees", updated);

    try {
      await toggleAttendeeCheckin({
        eventId: state.activeEventId,
        attendeeId: id,
        checkedIn: nextState,
        checkedInBy: "Organizer Console"
      });
    } catch (e) {
      console.warn("handleToggle check-in DB error:", e);
    }
  };

  // Direct 1-Click Print Badge Handler for CheckInView
  const handleDirectPrintAttendeeBadge = (attendee) => {
    const resolvedTier = getResolvedTicketName(attendee, tickets);
    const matchedTicket = tickets.find(t => (t.name || t.tier || "").trim().toLowerCase() === (resolvedTier || "").trim().toLowerCase()) || {};
    const eventDetails = state.eventDetails || {};
    const templateUrl = matchedTicket.badgeUrl || eventDetails.badgeUrl || "";
    const badgeSettings = matchedTicket.badgeSettings || eventDetails.badgeSettings || {};
    const attendeePhoto = getAttendeeDisplayImage(attendee);
    const attendeeName = attendee.name || "Attendee";
    const attendeeEmail = attendee.email || "";
    const { company: attendeeCompany, jobTitle: attendeeJobTitle } = extractTicketFormCredentials(attendee);
    const badgeCode = attendee.badgeCode || attendee.badge_code || `EZ-${String(attendee.id || '').slice(-4).toUpperCase() || 'PASS'}`;
    const eventTitle = eventDetails.title || "Conference Event";
    const eventId = eventDetails.id || state.activeEventId || "";

    printA4BadgeDocument({
      templateUrl,
      attendeeId: attendee.id || badgeCode,
      attendeeName,
      attendeeEmail,
      attendeePhoto,
      attendeeCompany,
      attendeeJobTitle,
      ticketType: resolvedTier || "General Pass",
      badgeCode,
      eventId,
      eventTitle,
      showFoldGuide: badgeSettings.showFoldGuide !== false,
      showPhoto: badgeSettings.showPhoto !== false,
      showQr: badgeSettings.showQr !== false,
      cardTheme: badgeSettings.cardTheme || "transparent"
    });
  };

  // Live QR Check-in Scan Processor
  const handleScanPass = (rawCode) => {
    if (!rawCode || !rawCode.trim()) return;
    const clean = rawCode.trim();
    let targetId = clean;
    let targetCode = clean;
    let targetEmail = clean;

    // Parse JSON if the scanned payload is our structured badge QR
    try {
      if (clean.startsWith("{") && clean.endsWith("}")) {
        const parsed = JSON.parse(clean);
        if (parsed.attendeeId) targetId = String(parsed.attendeeId);
        if (parsed.badgeCode) targetCode = String(parsed.badgeCode);
        if (parsed.email) targetEmail = String(parsed.email);
      }
    } catch (e) {
      console.warn("Raw scan parse:", e);
    }

    const matched = attendees.find(a => 
      String(a.id || '').toLowerCase() === targetId.toLowerCase() ||
      String(a.id || '').toLowerCase() === targetCode.toLowerCase() ||
      (a.badgeCode && String(a.badgeCode).toLowerCase() === targetCode.toLowerCase()) ||
      (a.badge_code && String(a.badge_code).toLowerCase() === targetCode.toLowerCase()) ||
      (a.email && a.email.toLowerCase() === targetEmail.toLowerCase()) ||
      (a.name && a.name.toLowerCase() === clean.toLowerCase())
    );

    if (!matched) {
      setScanFeedback({
        type: "error",
        message: `No attendee found for scanned pass: "${clean.slice(0, 30)}..."`
      });
      return;
    }

    const isAlreadyChecked = Boolean(matched.status === "checked-in" || matched.status === "checked_in" || matched.checkedIn || matched.checked_in);
    if (isAlreadyChecked) {
      setScanFeedback({
        type: "warning",
        title: "Already Checked In",
        attendee: matched,
        message: `${matched.name} (${matched.ticketType || 'Standard'}) was already checked in at ${matched.checkinTime || 'earlier'}.`
      });
      return;
    }

    const checkinTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const now = new Date().toISOString();
    const updated = attendees.map(a => 
      a.id === matched.id ? { ...a, status: "checked_in", checkedIn: true, checked_in: true, checkedInAt: now, checkinTime } : a
    );
    onUpdateState("attendees", updated);

    try {
      toggleAttendeeCheckin({
        eventId: state.activeEventId,
        attendeeId: matched.id,
        checkedIn: true,
        checkedInBy: "Organizer Scanner"
      });
    } catch (e) {}

    setScanFeedback({
      type: "success",
      title: "Check-in Successful!",
      attendee: matched,
      checkinTime,
      message: `Verified entrance for ${matched.name} (${matched.ticketType || 'General Pass'}).`
    });

    setScanInputCode("");
  };

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase();
    return attendees.filter(a =>
      (a.name || "").toLowerCase().includes(searchLower) ||
      (a.email || "").toLowerCase().includes(searchLower) ||
      (a.badgeCode || a.badge_code || "").toLowerCase().includes(searchLower)
    );
  }, [attendees, search]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="flex flex-col gap-6 w-full font-sans">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Check-in Management</h2>
          <p className="text-xs sm:text-sm text-slate-500">Scan QR passes or toggle attendee attendance status at the door.</p>
        </div>

        <button
          onClick={() => {
            setScanFeedback(null);
            setShowScannerModal(true);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-102 shrink-0"
        >
          <Camera size={16} />
          <span>Scan Attendee QR</span>
        </button>
      </header>

      {/* Live Scan Notification Alert */}
      {scanFeedback && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs animate-fade-in ${
          scanFeedback.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : scanFeedback.type === "warning"
            ? "bg-amber-50 border-amber-200 text-amber-900"
            : "bg-rose-50 border-rose-200 text-rose-900"
        }`}>
          <div className="flex items-center gap-3">
            {scanFeedback.type === "success" && <CheckCircle2 className="text-emerald-600 shrink-0" size={22} />}
            {scanFeedback.type === "warning" && <Info className="text-amber-600 shrink-0" size={22} />}
            {scanFeedback.type === "error" && <XCircle className="text-rose-600 shrink-0" size={22} />}
            <div>
              <div className="text-xs font-black">{scanFeedback.title || (scanFeedback.type === "error" ? "Scan Error" : "Notice")}</div>
              <p className="text-xs font-medium opacity-90">{scanFeedback.message}</p>
            </div>
          </div>
          <button
            onClick={() => setScanFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500 cursor-pointer font-bold"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Mobile Staff Check-In App Banner & Passcode Card */}
      {(() => {
        const eventDetails = state.eventDetails || {};
        const eventId = eventDetails.id || state.activeEventId || "";
        const eventPasscode = eventDetails.checkinPasscode || eventDetails.checkin_passcode || (eventId ? String(eventId).slice(0, 6).toUpperCase() : "202688");
        const checkinUrl = `https://ci.eventzone.pro`;
        const localCheckinUrl = `/checkin?eventId=${eventId}&passcode=${eventPasscode}`;

        return (
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
                  <Smartphone size={13} />
                  <span>Mobile Gate Portal &bull; ci.eventzone.pro</span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Mobile Staff Check-In Web App
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Gate staff and volunteers can open <strong className="text-white">ci.eventzone.pro</strong> on their mobile phones, enter their email and the event passcode below to scan badges with their phone camera or check in delegates manually.
                </p>
              </div>

              {/* Passcode & Quick Actions */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {/* Passcode Box */}
                <div className="bg-white/10 border border-white/15 px-4 py-3 rounded-2xl flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Event Passcode
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg font-mono font-black tracking-widest text-emerald-400">
                      {eventPasscode}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(eventPasscode);
                        alert(`Passcode "${eventPasscode}" copied to clipboard! Share it with your check-in staff.`);
                      }}
                      title="Copy Passcode"
                      className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <Copy size={15} />
                    </button>
                  </div>
                </div>

                {/* Open Mobile Portal */}
                <a
                  href={localCheckinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
                >
                  <ExternalLink size={15} />
                  <span>Open Check-In Web App</span>
                </a>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
            <div className="text-2xl font-extrabold text-slate-800 mt-2">
              {attendees.filter(a => a.status === "checked-in" || a.checked_in).length} <span className="text-sm font-semibold text-slate-400">/ {attendees.length}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ width: `${attendees.length > 0 ? (attendees.filter(a => a.status === "checked-in" || a.checked_in).length / attendees.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rapid Door Status</span>
            <div className="text-2xl font-extrabold text-slate-800 mt-2">Ready for Scans</div>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-4">
            <Check size={12} /> Scannable unique QR codes active on ci.eventzone.pro
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-150 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <input 
              type="text" 
              placeholder="Search attendees by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-650"
            />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (scanInputCode) handleScanPass(scanInputCode);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Scan / Type QR Badge Code..."
                value={scanInputCode}
                onChange={(e) => setScanInputCode(e.target.value)}
                className="w-48 sm:w-56 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Check In
            </button>
          </form>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left text-xs font-medium text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">
                <th className="py-4 px-6">Attendee</th>
                <th className="py-4 px-6">Ticket Type</th>
                <th className="py-4 px-6">Check-in Status</th>
                <th className="py-4 px-6">Check-in Time</th>
                <th className="py-4 px-6 w-36">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-slate-400 py-12">No attendees registered yet.</td>
                </tr>
              ) : (
                paginated.map(a => {
                  const isCheckedIn = Boolean(a.status === "checked-in" || a.status === "checked_in" || a.checkedIn || a.checked_in);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="py-4 px-6 font-semibold flex items-center gap-3">
                        <span className="text-slate-850 font-bold">{a.name}</span>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-650">{a.ticketType || a.ticket_type || "Standard"}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isCheckedIn 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {isCheckedIn ? 'Checked In' : 'Registered'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-bold">{a.checkinTime || "-"}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDirectPrintAttendeeBadge(a)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                            title="Print Attendee Badge (A4 4-Fold)"
                          >
                            <Printer size={15} />
                          </button>
                          <button 
                            onClick={() => handleToggle(a.id)}
                            className={`font-semibold py-1.5 px-4 rounded-xl text-[11px] shadow-sm transition-all duration-200 cursor-pointer ${isCheckedIn ? 'bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600' : 'bg-indigo-650 hover:bg-indigo-700 text-white'}`}
                          >
                            {isCheckedIn ? 'Check Out' : 'Check In'}
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

        {/* Table Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="attendees"
        />
      </div>

      {/* QR CAMERA / SCANNER MODAL */}
      {showScannerModal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-7 text-center space-y-4 animate-scale-up relative text-slate-900">
            <button
              onClick={() => {
                setShowScannerModal(false);
                setIsCameraActive(false);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer font-bold"
            >
              <X size={18} />
            </button>

            <div className="flex items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <QrCode size={22} />
              </div>
              <h3 className="text-lg font-black text-slate-900">Door QR Pass Scanner</h3>
            </div>

            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Scan attendee badge QR code to instantly verify registration and complete check-in.
            </p>

            {/* Quick manual scan input for Barcode Scanner Guns */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (scanInputCode) {
                  handleScanPass(scanInputCode);
                  setShowScannerModal(false);
                }
              }}
              className="flex gap-2 pt-1"
            >
              <input
                autoFocus
                type="text"
                placeholder="Scan pass with barcode reader or paste QR..."
                value={scanInputCode}
                onChange={(e) => setScanInputCode(e.target.value)}
                className="flex-1 px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Verify
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Attendees checked in:</span>
              <span className="font-black text-slate-900">
                {attendees.filter(a => a.status === "checked-in").length} / {attendees.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Attendee Badge Preview & Print Modal for Check-In */}
      {selectedBadgeAttendee && (() => {
        const attendee = selectedBadgeAttendee;
        const resolvedTier = getResolvedTicketName(attendee, tickets);
        const matchedTicket = tickets.find(t => (t.name || t.tier || "").trim().toLowerCase() === (resolvedTier || "").trim().toLowerCase()) || {};
        const eventDetails = state.eventDetails || {};
        const templateUrl = matchedTicket.badgeUrl || eventDetails.badgeUrl || "";
        const badgeSettings = matchedTicket.badgeSettings || eventDetails.badgeSettings || {};
        const attendeePhoto = getAttendeeDisplayImage(attendee);
        const attendeeName = attendee.name || "Attendee";
        const attendeeEmail = attendee.email || "";
        const { company: attendeeCompany, jobTitle: attendeeJobTitle } = extractTicketFormCredentials(attendee);
        const badgeCode = attendee.badgeCode || attendee.badge_code || `EZ-${String(attendee.id || '').slice(-4).toUpperCase() || 'PASS'}`;
        const eventTitle = eventDetails.title || "Conference Event";
        const eventId = eventDetails.id || state.activeEventId || "";

        const handlePrint = () => {
          printA4BadgeDocument({
            templateUrl,
            attendeeId: attendee.id || badgeCode,
            attendeeName,
            attendeeEmail,
            attendeePhoto,
            attendeeCompany,
            attendeeJobTitle,
            ticketType: resolvedTier || "General Pass",
            badgeCode,
            eventId,
            eventTitle,
            showFoldGuide: badgeSettings.showFoldGuide !== false,
            showPhoto: badgeSettings.showPhoto !== false,
            showQr: badgeSettings.showQr !== false,
            cardTheme: badgeSettings.cardTheme || "white"
          });
        };

        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in overflow-y-auto font-sans">
            <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-7 text-center space-y-4 animate-scale-up relative my-8 text-slate-900">
              <button
                onClick={() => setSelectedBadgeAttendee(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer font-bold"
              >
                <X size={18} />
              </button>

              <div className="flex items-center justify-center gap-2">
                <Printer size={20} className="text-blue-600" />
                <h3 className="text-lg font-black text-slate-900">Print Attendee Badge</h3>
              </div>

              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Official A4 4-Fold Badge Sheet with unique check-in QR code for <strong className="text-slate-800">{attendeeName}</strong> ({resolvedTier}).
              </p>

              {/* A4 4-Fold Preview */}
              <div className="w-full max-w-[340px] sm:max-w-[370px] mx-auto shadow-xl rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                <A4BadgeSheet
                  templateUrl={templateUrl}
                  attendeeId={attendee.id || badgeCode}
                  attendeeName={attendeeName}
                  attendeeEmail={attendeeEmail}
                  attendeePhoto={attendeePhoto}
                  attendeeCompany={attendeeCompany}
                  attendeeJobTitle={attendeeJobTitle}
                  ticketType={resolvedTier}
                  badgeCode={badgeCode}
                  eventId={eventId}
                  eventTitle={eventTitle}
                  showFoldGuide={badgeSettings.showFoldGuide !== false}
                  showPhoto={badgeSettings.showPhoto !== false}
                  showQr={badgeSettings.showQr !== false}
                  cardTheme={badgeSettings.cardTheme || "white"}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedBadgeAttendee(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Printer size={15} />
                  <span>Print Badge (A4)</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}


