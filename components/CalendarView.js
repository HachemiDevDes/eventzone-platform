"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Calendar, Archive, RotateCcw, Camera, Upload, Check, Loader2, X, Trash2, Users, Plus, UserPlus, Eye, FileText, FileSpreadsheet, Download } from "lucide-react";
import CustomDatePicker from "./CustomDatePicker";
import CustomTimePicker from "./CustomTimePicker";
import SearchableSelect from "./SearchableSelect";
import { generateUuid } from "../lib/db";
import { CalendarSkeleton } from "./SkeletonLoaders";
import { uploadMedia } from "@/lib/storage";
import { useLanguage } from "../lib/i18n";
import { canEditModule } from "../lib/permissions";
import { downloadAgendaPdf, exportAgendaToExcel } from "@/lib/agendaExport";

export default function CalendarView({
  sessions = [],
  attendees = [],
  eventDetails = null,
  eventId = "",
  isLoading = false,
  effectivePermissions = null,
  onSaveSessions,
  onClearAllSessions,
  onUploadFile
}) {
  const { t, lang } = useLanguage();
  const canEdit = canEditModule("calendar", effectivePermissions);
  // Database states
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  
  // Person input states
  const [speakerMode, setSpeakerMode] = useState("manual"); // "manual" | "list"
  const [selectedSpeakerFromList, setSelectedSpeakerFromList] = useState("");
  const [speakerName, setSpeakerName] = useState("");
  const [speakerImg, setSpeakerImg] = useState("");
  const [speakersList, setSpeakersList] = useState([]);
  const [isUploadingSpeaker, setIsUploadingSpeaker] = useState(false);
  
  const [moderatorMode, setModeratorMode] = useState("manual"); // "manual" | "list"
  const [selectedModeratorFromList, setSelectedModeratorFromList] = useState("");
  const [moderatorName, setModeratorName] = useState("");
  const [moderatorImg, setModeratorImg] = useState("");
  const [moderatorsList, setModeratorsList] = useState([]);
  const [isUploadingModerator, setIsUploadingModerator] = useState(false);

  // Logo input states
  const [logoLabel, setLogoLabel] = useState("");
  const [logoImg, setLogoImg] = useState("");
  const [logosList, setLogosList] = useState([]);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Sidebar Resizing state
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const isResizing = useRef(false);
  const formPanelRef = useRef(null);

  // Initialize sidebar width from local storage
  useEffect(() => {
    const savedWidth = localStorage.getItem("calendar_sidebar_width");
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth));
    }
  }, []);

  // Handle resizing mouse events
  const startResizing = (e) => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      const newWidth = e.clientX - 320; // offset the main navigation sidebar (320px)
      if (newWidth > 320 && newWidth < 700) {
        setSidebarWidth(newWidth);
        localStorage.setItem("calendar_sidebar_width", newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Unified directory of all experts (speakers + moderators + attendee experts) across the entire event
  const allEventExperts = useMemo(() => {
    const map = new Map();

    // 1. From all sessions: extract both speakers and moderators
    sessions.forEach(sess => {
      (sess.speakers || []).forEach(sp => {
        if (sp && sp.name && sp.name.trim()) {
          const key = sp.name.trim().toLowerCase();
          const existing = map.get(key);
          if (existing) {
            existing.isSpeaker = true;
            if (!existing.image && sp.image) existing.image = sp.image;
            if (!existing.title && (sp.title || sp.jobTitle)) existing.title = sp.title || sp.jobTitle;
            if (!existing.company && sp.company) existing.company = sp.company;
          } else {
            map.set(key, {
              id: sp.id || `spk-${key}`,
              name: sp.name.trim(),
              image: sp.image || sp.avatar_url || "",
              title: sp.title || sp.jobTitle || "",
              company: sp.company || "",
              isSpeaker: true,
              isModerator: false
            });
          }
        }
      });

      (sess.moderators || []).forEach(mod => {
        if (mod && mod.name && mod.name.trim()) {
          const key = mod.name.trim().toLowerCase();
          const existing = map.get(key);
          if (existing) {
            existing.isModerator = true;
            if (!existing.image && mod.image) existing.image = mod.image;
            if (!existing.title && (mod.title || mod.jobTitle)) existing.title = mod.title || mod.jobTitle;
            if (!existing.company && mod.company) existing.company = mod.company;
          } else {
            map.set(key, {
              id: mod.id || `mod-${key}`,
              name: mod.name.trim(),
              image: mod.image || mod.avatar_url || "",
              title: mod.title || mod.jobTitle || "",
              company: mod.company || "",
              isSpeaker: false,
              isModerator: true
            });
          }
        }
      });
    });

    // 2. From attendees: enrich existing experts and add attendee speakers/moderators
    attendees.forEach(att => {
      if (!att || !att.name || !att.name.trim()) return;
      const key = att.name.trim().toLowerCase();
      const tType = typeof att.ticketType === 'string' ? att.ticketType.toLowerCase() : '';
      const isAttSpeaker = Boolean(att.isSpeaker || tType.includes("speaker"));
      const isAttMod = Boolean(att.isModerator || tType.includes("moderator"));

      const title = att.jobTitle || att.job_title || att.title || att.headline || att.function || att.profession || "";
      const company = att.company || att.companyName || att.organization || "";
      const image = att.image || att.avatar || att.avatar_url || "";

      const existing = map.get(key);
      if (existing) {
        if (isAttSpeaker) existing.isSpeaker = true;
        if (isAttMod) existing.isModerator = true;
        if (!existing.image && image) existing.image = image;
        if (!existing.title && title) existing.title = title;
        if (!existing.company && company) existing.company = company;
      } else if (isAttSpeaker || isAttMod) {
        map.set(key, {
          id: att.id || `att-${key}`,
          name: att.name.trim(),
          image: image || "",
          title: title,
          company: company,
          isSpeaker: isAttSpeaker,
          isModerator: isAttMod
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [sessions, attendees]);

  // Aliases for speaker & moderator candidate lists
  const allEventSpeakers = allEventExperts;
  const allEventModerators = allEventExperts;

  // Add an existing speaker from event directory to current session
  const handleAddExistingSpeaker = (speaker) => {
    if (!canEdit || !speaker || !speaker.name) return;
    const exists = speakersList.some(s => s.name.trim().toLowerCase() === speaker.name.trim().toLowerCase());
    if (exists) {
      alert(`"${speaker.name}" is already in this session's speaker list.`);
      return;
    }
    const newSpeaker = {
      id: Date.now(),
      name: speaker.name.trim(),
      image: speaker.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(speaker.name.trim())}&background=2563eb&color=fff`,
      title: speaker.title || "",
      company: speaker.company || "",
      role: "Speaker"
    };
    setSpeakersList(prev => [...prev, newSpeaker]);
    setSelectedSpeakerFromList("");
  };

  // Add an existing moderator from event directory to current session
  const handleAddExistingModerator = (moderator) => {
    if (!canEdit || !moderator || !moderator.name) return;
    const exists = moderatorsList.some(m => m.name.trim().toLowerCase() === moderator.name.trim().toLowerCase());
    if (exists) {
      alert(`"${moderator.name}" is already in this session's moderator list.`);
      return;
    }
    const newModerator = {
      id: Date.now(),
      name: moderator.name.trim(),
      image: moderator.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(moderator.name.trim())}&background=4f46e5&color=fff`,
      title: moderator.title || "",
      company: moderator.company || "",
      role: "Moderator"
    };
    setModeratorsList(prev => [...prev, newModerator]);
    setSelectedModeratorFromList("");
  };

  // Resilient Image / Photo Uploader
  const handleImageUpload = async (e, type) => {
    if (!canEdit) return;
    let event = e;
    let targetType = type;
    // In case arguments were passed as (type, e)
    if (typeof e === "string" && type && type.target) {
      targetType = e;
      event = type;
    }

    const file = event?.target?.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert(`Image file is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
      if (event.target) event.target.value = "";
      return;
    }

    if (targetType === "speaker") setIsUploadingSpeaker(true);
    else if (targetType === "moderator") setIsUploadingModerator(true);
    else if (targetType === "logo") setIsUploadingLogo(true);

    try {
      let publicUrl = null;
      const targetBucket = targetType === "logo" ? "event-images" : "avatars";
      if (onUploadFile) {
        publicUrl = await onUploadFile(file, targetBucket);
      }
      if (!publicUrl) {
        try {
          publicUrl = await uploadMedia(file, targetBucket);
        } catch (storageErr) {
          console.warn("Storage upload notice:", storageErr);
        }
      }

      if (publicUrl) {
        if (targetType === "speaker") {
          setSpeakerImg(publicUrl);
        } else if (targetType === "moderator") {
          setModeratorImg(publicUrl);
        } else if (targetType === "logo") {
          setLogoImg(publicUrl);
        }
      } else {
        alert("Could not upload image to cloud storage. Please check your connection and try again.");
      }
    } catch (err) {
      console.warn("Image upload error:", err);
      alert("An error occurred while uploading the image.");
    } finally {
      if (targetType === "speaker") setIsUploadingSpeaker(false);
      else if (targetType === "moderator") setIsUploadingModerator(false);
      else if (targetType === "logo") setIsUploadingLogo(false);
      if (event?.target) event.target.value = "";
    }
  };

  const handlePhotoUpload = handleImageUpload;

  // Inline Photo Update for existing speaker / moderator in the list
  const handleUpdateExistingPersonPhoto = async (id, type, e) => {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert(`Image file is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
      e.target.value = "";
      return;
    }

    try {
      let publicUrl = null;
      if (onUploadFile) {
        publicUrl = await onUploadFile(file, "avatars");
      }
      if (!publicUrl) {
        try {
          publicUrl = await uploadMedia(file, "avatars");
        } catch (storageErr) {
          console.warn("Storage upload notice:", storageErr);
        }
      }

      if (publicUrl) {
        if (type === "speaker") {
          setSpeakersList(prev => prev.map(s => s.id === id ? { ...s, image: publicUrl } : s));
        } else {
          setModeratorsList(prev => prev.map(m => m.id === id ? { ...m, image: publicUrl } : m));
        }
      } else {
        alert("Could not update photo to cloud storage. Please try again.");
      }
    } catch (err) {
      console.warn("Photo replacement error:", err);
      alert("An error occurred while replacing the photo.");
    } finally {
      e.target.value = "";
    }
  };

  // Add person to list
  const addPerson = (type) => {
    if (!canEdit) return;
    if (type === "speaker") {
      if (!speakerName.trim()) return;
      const key = speakerName.trim().toLowerCase();
      const matched = allEventExperts.find(e => e.name.toLowerCase() === key);
      const newSpeaker = {
        id: Date.now(),
        name: speakerName.trim(),
        image: speakerImg || matched?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(speakerName.trim())}&background=2563eb&color=fff`,
        title: matched?.title || "",
        jobTitle: matched?.title || "",
        company: matched?.company || "",
        role: "Speaker"
      };
      setSpeakersList([...speakersList, newSpeaker]);
      setSpeakerName("");
      setSpeakerImg("");
    } else {
      if (!moderatorName.trim()) return;
      const key = moderatorName.trim().toLowerCase();
      const matched = allEventExperts.find(e => e.name.toLowerCase() === key);
      const newModerator = {
        id: Date.now(),
        name: moderatorName.trim(),
        image: moderatorImg || matched?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(moderatorName.trim())}&background=4f46e5&color=fff`,
        title: matched?.title || "",
        jobTitle: matched?.title || "",
        company: matched?.company || "",
        role: "Moderator"
      };
      setModeratorsList([...moderatorsList, newModerator]);
      setModeratorName("");
      setModeratorImg("");
    }
  };

  const removePerson = (id, type) => {
    if (!canEdit) return;
    if (type === "speaker") {
      setSpeakersList(speakersList.filter(s => s.id !== id));
    } else {
      setModeratorsList(moderatorsList.filter(m => m.id !== id));
    }
  };

  // Add logo to list
  const addLogo = () => {
    if (!canEdit) return;
    if (!logoImg) return;
    const newLogo = {
      id: Date.now(),
      image: logoImg,
      label: logoLabel.trim() || "Partner"
    };
    setLogosList([...logosList, newLogo]);
    setLogoImg("");
    setLogoLabel("");
  };

  const removeLogo = (id) => {
    if (!canEdit) return;
    setLogosList(logosList.filter(l => l.id !== id));
  };

  // Form Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!title.trim()) {
      alert("Please enter a session title.");
      return;
    }
    if (!date) {
      alert("Please select a date for the session.");
      return;
    }

    const enrichedSpeakers = speakersList.map(s => {
      const match = allEventExperts.find(e => e.name.toLowerCase() === (s.name || "").trim().toLowerCase());
      return {
        ...s,
        title: s.title || s.jobTitle || match?.title || "",
        jobTitle: s.jobTitle || s.title || match?.title || "",
        company: s.company || match?.company || "",
        image: s.image || match?.image || ""
      };
    });

    const enrichedModerators = moderatorsList.map(m => {
      const match = allEventExperts.find(e => e.name.toLowerCase() === (m.name || "").trim().toLowerCase());
      return {
        ...m,
        title: m.title || m.jobTitle || match?.title || "",
        jobTitle: m.jobTitle || m.title || match?.title || "",
        company: m.company || match?.company || "",
        image: m.image || match?.image || ""
      };
    });

    if (editingSessionId) {
      const updatedSessions = sessions.map(s => {
        if (s.id === editingSessionId) {
          return {
            ...s,
            title: title.trim(),
            date,
            startTime: startTime || "09:00",
            endTime: endTime || "10:00",
            description,
            speakers: enrichedSpeakers,
            moderators: enrichedModerators,
            logos: logosList
          };
        }
        return s;
      });
      onSaveSessions(updatedSessions);
    } else {
      const newSession = {
        id: generateUuid(),
        title: title.trim(),
        date,
        startTime: startTime || "09:00",
        endTime: endTime || "10:00",
        description,
        speakers: enrichedSpeakers,
        moderators: enrichedModerators,
        logos: logosList
      };
      onSaveSessions([newSession, ...sessions]);
    }

    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setDescription("");
    setSpeakersList([]);
    setModeratorsList([]);
    setSpeakerName("");
    setSpeakerImg("");
    setModeratorName("");
    setModeratorImg("");
    setLogosList([]);
    setLogoLabel("");
    setLogoImg("");
    setSelectedSpeakerFromList("");
    setSelectedModeratorFromList("");
    setEditingSessionId(null);
    if (formPanelRef.current) {
      formPanelRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const startEdit = (session) => {
    setEditingSessionId(session.id);
    setTitle(session.title || "");
    setDate(session.date || "");
    setStartTime(session.startTime || "");
    setEndTime(session.endTime || "");
    setDescription(session.description || "");
    setSpeakersList(session.speakers || []);
    setModeratorsList(session.moderators || []);
    setLogosList(session.logos || []);
    setSpeakerName("");
    setSpeakerImg("");
    setModeratorName("");
    setModeratorImg("");
    setLogoLabel("");
    setLogoImg("");
    setSelectedSpeakerFromList("");
    setSelectedModeratorFromList("");
    if (formPanelRef.current) {
      formPanelRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleArchive = (id) => {
    if (!canEdit) return;
    if (confirm("Archive this session? (Preserved in archives)")) {
      onSaveSessions(sessions.map(s => s.id === id ? { ...s, status: "archived", isArchived: true } : s));
      if (editingSessionId === id) resetForm();
    }
  };

  const handleRestore = (id) => {
    if (!canEdit) return;
    onSaveSessions(sessions.map(s => s.id === id ? { ...s, status: "published", isArchived: false } : s));
  };

  const handleDeletePermanent = (id) => {
    if (!canEdit) return;
    if (confirm("Permanently delete this session from the calendar? This action cannot be undone.")) {
      onSaveSessions(sessions.filter(s => s.id !== id));
      if (editingSessionId === id) resetForm();
    }
  };

  const handleDelete = handleArchive;

  // Active vs Archived sessions
  const activeSessions = sessions.filter(s => s.status !== "archived" && !s.isArchived);
  const archivedSessions = sessions.filter(s => s.status === "archived" || s.isArchived);

  // Timeline separation logic - filter active sessions by default
  const uniqueDates = [...new Set(activeSessions.map(s => s.date))].filter(Boolean).sort();

  const filteredSessions = sessions
    .filter(s => {
      const isArchived = s.status === "archived" || s.isArchived;
      if (activeFilter === "archived") return isArchived;
      if (isArchived) return false;
      return activeFilter === "all" || s.date === activeFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime || "00:00"}`);
      const dateB = new Date(`${b.date}T${b.startTime || "00:00"}`);
      return dateA - dateB;
    });

  const formatDateLabel = (dateStr) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const locale = lang === 'ar' ? 'ar-EG' : lang === 'fr' ? 'fr-FR' : 'en-US';
    return new Date(dateStr).toLocaleDateString(locale, options);
  };

  const formatFullDate = (dateStr) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    const locale = lang === 'ar' ? 'ar-EG' : lang === 'fr' ? 'fr-FR' : 'en-US';
    return new Date(dateStr).toLocaleDateString(locale, options);
  };

  // Google Calendar integration URL helper
  const getGoogleCalendarLink = (session) => {
    const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
    const titleText = encodeURIComponent(session.title);
    const speakersText = (session.speakers || []).map(s => s.name).join(', ');
    const moderatorsText = (session.moderators || []).map(m => m.name).join(', ');
    const descText = encodeURIComponent(
      `${session.description || ""}\n\nSpeakers: ${speakersText}${moderatorsText ? '\nModerators: ' + moderatorsText : ''}`
    );
    const start = new Date(`${session.date}T${session.startTime}`);
    const end = new Date(`${session.date}T${session.endTime}`);
    const formatGCalDate = (d) => {
      try {
        return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
      } catch {
        return "";
      }
    };
    const dates = `${formatGCalDate(start)}/${formatGCalDate(end)}`;
    return `${baseUrl}&text=${titleText}&details=${descText}&dates=${dates}`;
  };

  // Helper to enrich sessions for export with full talent directory
  const getEnrichedSessionsForExport = (targetSessions) => {
    return targetSessions.map(sess => {
      const spks = (sess.speakers || []).map(s => {
        const name = typeof s === "string" ? s : s?.name || "";
        const match = allEventExperts.find(e => e.name.toLowerCase() === name.trim().toLowerCase());
        return {
          id: s?.id || match?.id,
          name,
          title: s?.title || s?.jobTitle || match?.title || "",
          company: s?.company || match?.company || "",
          role: s?.role || "Speaker"
        };
      });

      const mods = (sess.moderators || []).map(m => {
        const name = typeof m === "string" ? m : m?.name || "";
        const match = allEventExperts.find(e => e.name.toLowerCase() === name.trim().toLowerCase());
        return {
          id: m?.id || match?.id,
          name,
          title: m?.title || m?.jobTitle || match?.title || "",
          company: m?.company || match?.company || "",
          role: m?.role || "Moderator"
        };
      });

      return {
        ...sess,
        speakers: spks,
        moderators: mods
      };
    });
  };

  const handleDownloadPdf = async () => {
    if (sessions.length === 0) return;
    setIsExportingPdf(true);
    try {
      const targetSessions = activeFilter === "all" ? activeSessions : filteredSessions;
      const enriched = getEnrichedSessionsForExport(targetSessions);
      const filterLabel = activeFilter === "all" 
        ? "Full Event Agenda" 
        : `Day Agenda (${formatDateLabel(activeFilter)})`;

      await downloadAgendaPdf({
        eventId,
        eventDetails: eventDetails || { title: "Event Agenda" },
        sessions: enriched,
        filterLabel
      });
    } catch (err) {
      console.error("Failed to export agenda PDF:", err);
      alert(err.message || "Failed to generate agenda PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = () => {
    if (sessions.length === 0) return;
    setIsExportingExcel(true);
    try {
      const targetSessions = activeFilter === "all" ? activeSessions : filteredSessions;
      const enriched = getEnrichedSessionsForExport(targetSessions);
      const filterLabel = activeFilter === "all" 
        ? "Full Event Agenda" 
        : `Day Agenda (${formatDateLabel(activeFilter)})`;

      exportAgendaToExcel({
        eventDetails: eventDetails || { title: "Event Agenda" },
        sessions: enriched,
        filterLabel
      });
    } catch (err) {
      console.error("Failed to export agenda Excel:", err);
      alert(err.message || "Failed to export Excel spreadsheet.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="flex flex-1 w-full h-full min-h-0 max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-3rem)] bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* LEFT PANEL: CREATE A SESSION / EDIT A SESSION                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <aside 
        ref={formPanelRef}
        className="bg-white border-r border-slate-200 p-6 sm:p-7 flex flex-col gap-5 overflow-y-auto shrink-0 select-none h-full min-h-0 relative scroll-smooth"
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Viewer Mode Alert Banner */}
        {!canEdit && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-semibold">
            <Eye size={16} className="shrink-0 text-amber-600" />
            <span>{t("calendar.viewerNotice", "Viewer Mode: Read-only access. You cannot create, edit, or delete sessions.")}</span>
          </div>
        )}

        {/* Dynamic Title: switches between Create a Session, Edit a Session, and View Session */}
        <div className="flex flex-col gap-1 pb-2 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900">
            {!canEdit 
              ? (editingSessionId ? t("calendar.viewSession", "View Session Details") : t("calendar.sessionDetails", "Session Details"))
              : (editingSessionId ? t("calendar.editSession", "Edit a Session") : t("calendar.createSession", "Create a Session"))}
          </h2>
          <p className="text-sm text-slate-500">
            {!canEdit
              ? t("calendar.viewerSessionDesc", "Inspect session information, speakers, moderators, and partner details.")
              : (editingSessionId 
                  ? t("calendar.editSessionDesc", "Edit the details below to update this session.") 
                  : t("calendar.createSessionDesc", "Fill in the details to schedule a new event session."))}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <fieldset disabled={!canEdit} className="contents">
            {/* Session Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                * {t("calendar.sessionTitle", "Session Title")}
              </label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("calendar.titlePlaceholder", "e.g. Opening Keynote")} 
                required
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600 text-xs font-semibold disabled:opacity-75 disabled:bg-slate-100"
              />
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                * {t("calendar.date", "Date")}
              </label>
              <CustomDatePicker
                value={date}
                onChange={setDate}
                placeholder={t("calendar.selectDatePlaceholder", "Select session date")}
              />
            </div>

            {/* Start and End Times */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  * {t("calendar.startTime", "Start Time")}
                </label>
                <CustomTimePicker
                  value={startTime}
                  onChange={setStartTime}
                  placeholder={t("calendar.startTimePlaceholder", "Start time")}
                  align="left"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  * {t("calendar.endTime", "End Time")}
                </label>
                <CustomTimePicker
                  value={endTime}
                  onChange={setEndTime}
                  placeholder={t("calendar.endTimePlaceholder", "End time")}
                  align="right"
                />
              </div>
            </div>

            {/* Speakers */}
            <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t("calendar.speakers", "Speakers")}
                </label>

                {canEdit && (
                  <div className="flex items-center gap-2">
                    {speakerImg && speakerMode === "manual" && (
                      <button
                        type="button"
                        onClick={() => setSpeakerImg("")}
                        className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                      >
                        {t("calendar.clearPhoto", "Clear Photo")}
                      </button>
                    )}

                    {allEventSpeakers.length > 0 && (
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setSpeakerMode("list")}
                          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            speakerMode === "list" ? "bg-white text-blue-700 shadow-2xs font-extrabold" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {t("calendar.fromList", "From List")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSpeakerMode("manual")}
                          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            speakerMode === "manual" ? "bg-white text-blue-700 shadow-2xs font-extrabold" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {t("calendar.newSpeaker", "New Speaker")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* From List Selector */}
              {canEdit && speakerMode === "list" && allEventSpeakers.length > 0 ? (
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <SearchableSelect
                      value={selectedSpeakerFromList}
                      disabled={!canEdit}
                      onChange={(val) => {
                        setSelectedSpeakerFromList(val);
                        const found = allEventSpeakers.find(s => s.name === val);
                        if (found) handleAddExistingSpeaker(found);
                      }}
                      options={allEventSpeakers.map(s => ({
                        value: s.name,
                        label: s.name,
                        icon: s.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.image} className="w-5 h-5 rounded-full object-cover border border-slate-200" alt="" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[9px] flex items-center justify-center">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                        ),
                        badge: speakersList.some(item => item.name.toLowerCase() === s.name.toLowerCase()) ? "Added" : undefined,
                        description: s.isSpeaker && s.isModerator ? "Event Speaker & Moderator" : s.isModerator ? "Event Moderator" : "Event Speaker"
                      }))}
                      placeholder="-- Select speaker from list --"
                      searchPlaceholder="Search event speakers..."
                      buttonClassName="py-2 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedSpeakerFromList) {
                        alert("Please select a speaker from the dropdown.");
                        return;
                      }
                      const found = allEventSpeakers.find(s => s.name === selectedSpeakerFromList);
                      if (found) handleAddExistingSpeaker(found);
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={13} />
                    {t("common.add", "Add")}
                  </button>
                </div>
              ) : canEdit ? (
                /* Manual Input */
                <div className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    value={speakerName}
                    onChange={(e) => setSpeakerName(e.target.value)}
                    placeholder={t("calendar.speakerName", "Speaker Name")}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                  <label className={`px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all shrink-0 flex items-center gap-1.5 ${
                    speakerImg 
                      ? "border-blue-300 bg-blue-50 text-blue-700 ring-2 ring-blue-100" 
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                  }`}>
                    {isUploadingSpeaker ? (
                      <Loader2 size={13} className="animate-spin text-blue-600" />
                    ) : speakerImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={speakerImg} className="w-4 h-4 rounded-full object-cover border border-blue-200" alt="Preview" />
                    ) : (
                      <Camera size={13} />
                    )}
                    <span>{isUploadingSpeaker ? t("common.uploading", "Uploading...") : speakerImg ? t("calendar.photoAttached", "Photo Attached") : t("calendar.photo", "Photo")}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "speaker")} className="hidden" />
                  </label>
                  <button 
                    type="button" 
                    onClick={() => addPerson("speaker")}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    {t("common.add", "Add")}
                  </button>
                </div>
              ) : null}

              {/* Current Session Speakers List */}
              {speakersList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {speakersList.map(s => (
                    <div key={s.id} className="group relative flex items-center gap-1.5 pl-1 pr-2 py-1 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 rounded-full text-[11px] font-bold text-slate-700 transition-colors">
                      {/* Clickable Avatar to Replace Photo */}
                      <label className={`relative ${canEdit ? "cursor-pointer" : "cursor-default"}`} title={canEdit ? "Click to change photo" : ""}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.image} className="w-5 h-5 rounded-full object-cover border border-slate-200 group-hover:border-blue-400 transition-colors" alt="" />
                        {canEdit && (
                          <>
                            <span className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera size={9} className="text-white" />
                            </span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleUpdateExistingPersonPhoto(s.id, "speaker", e)} 
                              className="hidden" 
                            />
                          </>
                        )}
                      </label>
                      <span className="truncate max-w-[110px]">{s.name}</span>
                      {canEdit && (
                        <button type="button" onClick={() => removePerson(s.id, "speaker")} className="text-slate-400 hover:text-rose-600 font-bold ml-0.5 cursor-pointer" title="Remove speaker">×</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Moderators */}
            <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t("calendar.moderators", "Moderators")}
                </label>

                {canEdit && (
                  <div className="flex items-center gap-2">
                    {moderatorImg && moderatorMode === "manual" && (
                      <button
                        type="button"
                        onClick={() => setModeratorImg("")}
                        className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                      >
                        Clear Photo
                      </button>
                    )}

                    {(allEventModerators.length > 0 || allEventSpeakers.length > 0) && (
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setModeratorMode("list")}
                          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            moderatorMode === "list" ? "bg-white text-indigo-700 shadow-2xs font-extrabold" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          From List
                        </button>
                        <button
                          type="button"
                          onClick={() => setModeratorMode("manual")}
                          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            moderatorMode === "manual" ? "bg-white text-indigo-700 shadow-2xs font-extrabold" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {t("calendar.newModerator", "New Moderator")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* From List Selector */}
              {canEdit && moderatorMode === "list" && allEventModerators.length > 0 ? (
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <SearchableSelect
                      value={selectedModeratorFromList}
                      disabled={!canEdit}
                      onChange={(val) => {
                        setSelectedModeratorFromList(val);
                        const found = allEventModerators.find(m => m.name === val);
                        if (found) handleAddExistingModerator(found);
                      }}
                      options={allEventModerators.map(m => ({
                        value: m.name,
                        label: m.name,
                        icon: m.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.image} className="w-5 h-5 rounded-full object-cover border border-slate-200" alt="" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[9px] flex items-center justify-center">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                        ),
                        badge: moderatorsList.some(item => item.name.toLowerCase() === m.name.toLowerCase()) ? "Added" : undefined,
                        description: m.isModerator && m.isSpeaker ? "Event Moderator & Speaker" : m.isModerator ? "Event Moderator" : "Event Speaker"
                      }))}
                      placeholder="-- Select moderator from list --"
                      searchPlaceholder="Search event moderators..."
                      buttonClassName="py-2 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedModeratorFromList) {
                        alert("Please select a moderator from the dropdown.");
                        return;
                      }
                      const found = allEventModerators.find(m => m.name === selectedModeratorFromList);
                      if (found) handleAddExistingModerator(found);
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={13} />
                    Add
                  </button>
                </div>
              ) : canEdit ? (
                /* Manual Input */
                <div className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    value={moderatorName}
                    onChange={(e) => setModeratorName(e.target.value)}
                    placeholder={t("calendar.moderatorName", "Moderator Name")}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                  <label className={`px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all shrink-0 flex items-center gap-1.5 ${
                    moderatorImg 
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100" 
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                  }`}>
                    {isUploadingModerator ? (
                      <Loader2 size={13} className="animate-spin text-indigo-600" />
                    ) : moderatorImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={moderatorImg} className="w-4 h-4 rounded-full object-cover border border-indigo-200" alt="Preview" />
                    ) : (
                      <Camera size={13} />
                    )}
                    <span>{isUploadingModerator ? t("common.uploading", "Uploading...") : moderatorImg ? t("calendar.photoAttached", "Photo Attached") : t("calendar.photo", "Photo")}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "moderator")} className="hidden" />
                  </label>
                  <button 
                    type="button" 
                    onClick={() => addPerson("moderator")}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              ) : null}

              {/* Current Session Moderators List */}
              {moderatorsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {moderatorsList.map(m => (
                    <div key={m.id} className="group relative flex items-center gap-1.5 pl-1 pr-2 py-1 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 rounded-full text-[11px] font-bold text-slate-700 transition-colors">
                      <label className={`relative ${canEdit ? "cursor-pointer" : "cursor-default"}`} title={canEdit ? "Click to change photo" : ""}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.image} className="w-5 h-5 rounded-full object-cover border border-slate-200 group-hover:border-indigo-400 transition-colors" alt="" />
                        {canEdit && (
                          <>
                            <span className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera size={9} className="text-white" />
                            </span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleUpdateExistingPersonPhoto(m.id, "moderator", e)} 
                              className="hidden" 
                            />
                          </>
                        )}
                      </label>
                      <span className="truncate max-w-[110px]">{m.name}</span>
                      {canEdit && (
                        <button type="button" onClick={() => removePerson(m.id, "moderator")} className="text-slate-400 hover:text-rose-600 font-bold ml-0.5 cursor-pointer" title="Remove moderator">×</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logos & Partners */}
            <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t("calendar.logosPartners", "Logos & Partners")}
              </label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2.5">
                <input 
                  type="text" 
                  value={logoLabel}
                  onChange={(e) => setLogoLabel(e.target.value)}
                  placeholder={t("calendar.labelPlaceholder", "Label (e.g. Sponsor, Co-Host)")}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 disabled:opacity-75 disabled:bg-slate-100"
                />

                {canEdit && (
                  <div className="flex items-center gap-2">
                    <label className={`flex-1 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all text-center truncate flex items-center justify-center gap-1.5 ${
                      logoImg ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                    }`}>
                      {isUploadingLogo ? (
                        <Loader2 size={13} className="animate-spin text-blue-600" />
                      ) : logoImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoImg} className="h-4 w-auto object-contain max-w-[50px]" alt="" />
                      ) : (
                        <Upload size={13} />
                      )}
                      <span>{isUploadingLogo ? t("common.uploading", "Uploading...") : logoImg ? t("calendar.photoAttached", "Logo Attached") : t("calendar.uploadLogoImage", "Upload Logo Image")}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "logo")} className="hidden" />
                    </label>

                    <button 
                      type="button" 
                      onClick={addLogo}
                      className="px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                )}

                {logosList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/80">
                    {logosList.map(l => (
                      <div key={l.id} className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-white border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-700 shadow-2xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={l.image} className="h-4 object-contain max-w-[60px]" alt="" />
                        <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-[80px]">{l.label}</span>
                        {canEdit && (
                          <button type="button" onClick={() => removeLogo(l.id)} className="text-slate-400 hover:text-rose-500 ml-1 font-bold text-xs cursor-pointer">×</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t("calendar.description", "Description")}
              </label>
              <textarea 
                rows={3} 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder={t("calendar.descPlaceholder", "Tell us about this session...")} 
                className="px-3.5 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-slate-800 focus:outline-none focus:border-blue-600 text-xs resize-none font-medium disabled:opacity-75 disabled:bg-slate-100"
              />
            </div>
          </fieldset>

          {/* Form Action Buttons (Sticky at bottom of left panel) */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-3 pb-2 border-t border-slate-100 flex flex-col gap-2 z-10 -mx-6 sm:-mx-7 px-6 sm:px-7 mt-2 shadow-2xs">
            {canEdit && (
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer"
              >
                {editingSessionId ? t("calendar.updateSession", "Update Session") : t("calendar.createSession", "Create Session")}
              </button>
            )}

            {editingSessionId && (
              <button 
                type="button"
                onClick={resetForm}
                className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                {canEdit ? t("calendar.cancelEdit", "Cancel Edit") : t("common.close", "Close Details")}
              </button>
            )}
          </div>
        </form>
      </aside>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* RESIZABLE DIVIDER BAR                                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div 
        className="w-1.5 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize transition-all shrink-0 self-stretch z-10 bg-slate-100 flex items-center justify-center select-none" 
        onMouseDown={startResizing}
        title="Drag to resize panel"
      >
        <div className="w-0.5 h-8 bg-slate-300 rounded-full" />
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* RIGHT PANEL: EVENT TIMELINE & SESSIONS                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="flex-1 bg-slate-50/70 p-6 sm:p-8 flex flex-col overflow-y-auto h-full min-h-0 scroll-smooth">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {t("calendar.timelineSessions", "Event Timeline & Sessions")}
            </h2>
            <p className="text-sm text-slate-500">
              {t("calendar.timelineSubtitle", "Sort, view, edit, and organize scheduled sessions by day.")}
            </p>
          </div>

          {/* Export / Download Agenda Buttons */}
          {sessions.length > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
              {/* PDF Download Button */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-blue-300 text-slate-700 hover:text-blue-600 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group active:scale-95"
                title="Download formatted executive agenda PDF"
              >
                {isExportingPdf ? (
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                ) : (
                  <FileText size={14} className="text-rose-500 group-hover:scale-110 transition-transform shrink-0" />
                )}
                <span>{isExportingPdf ? t("export.generating", "Generating...") : t("calendar.downloadPdf", "Download PDF")}</span>
              </button>

              {/* Excel Export Button */}
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-emerald-300 text-slate-700 hover:text-emerald-600 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group active:scale-95"
                title="Export agenda spreadsheet to Excel (.xlsx)"
              >
                {isExportingExcel ? (
                  <Loader2 size={14} className="animate-spin text-emerald-600" />
                ) : (
                  <FileSpreadsheet size={14} className="text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
                )}
                <span>{isExportingExcel ? t("export.generating", "Generating...") : t("calendar.exportExcel", "Export Excel")}</span>
              </button>
            </div>
          )}
        </header>

        {/* Dynamic Day Filter Tabs */}
        {(uniqueDates.length > 1 || archivedSessions.length > 0) && (
          <div className="flex gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit mb-6 max-w-full overflow-x-auto shrink-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === "all" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t("calendar.allActive", "All Active")} ({activeSessions.length})
            </button>
            {uniqueDates.map((date, i) => (
              <button
                key={date}
                type="button"
                onClick={() => setActiveFilter(date)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === date ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("calendar.day", "Day")} {i + 1} ({formatDateLabel(date)})
              </button>
            ))}
            {archivedSessions.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter("archived")}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeFilter === "archived" ? "bg-amber-500 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Archive size={13} />
                <span>{t("table.archived", "Archived")} ({archivedSessions.length})</span>
              </button>
            )}
          </div>
        )}

        {/* Sessions list */}
        <div className="flex flex-col gap-4 w-full">
          {filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-16 bg-white border border-slate-200 rounded-3xl gap-3 text-slate-400">
              <Calendar size={48} className="opacity-25" />
              <div>
                <h3 className="text-base font-bold text-slate-700">
                  {activeFilter === "archived" ? "No archived sessions" : "No sessions scheduled"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {activeFilter === "archived" ? "Archived sessions will appear here." : "Use the panel on the left to add your first session details."}
                </p>
              </div>
            </div>
          ) : (
            (() => {
              let lastDate = null;
              return filteredSessions.map(session => {
                const isArchivedSession = session.status === "archived" || session.isArchived;
                const isCurrentlyEditing = session.id === editingSessionId;
                const renderSeparator = activeFilter === "all" && session.date !== lastDate;
                if (renderSeparator) {
                  lastDate = session.date;
                }

                return (
                  <React.Fragment key={session.id}>
                    {renderSeparator && (
                      <div className="flex items-center gap-4 mt-4 mb-2 select-none">
                        <span className="text-xs font-black text-blue-600 tracking-wider uppercase shrink-0">
                          {formatFullDate(session.date)}
                        </span>
                        <div className="h-px bg-slate-200 flex-1" />
                      </div>
                    )}

                    <div 
                      id={`session-card-${session.id}`}
                      className={`bg-white border ${
                        isCurrentlyEditing 
                          ? 'border-blue-500 ring-2 ring-blue-500/25 shadow-md bg-blue-50/15' 
                          : isArchivedSession 
                            ? 'border-slate-200 opacity-80' 
                            : 'border-slate-200'
                      } rounded-3xl p-6 flex flex-col gap-4 hover:shadow-md transition-all relative group`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-2">
                          <div className={`px-3 py-1 ${
                            isCurrentlyEditing 
                              ? 'bg-blue-600 text-white shadow-2xs' 
                              : 'bg-blue-50 border border-blue-200/80 text-blue-700'
                          } rounded-full font-extrabold text-xs select-none transition-colors`}>
                            <span>{session.startTime} — {session.endTime}</span>
                          </div>
                          {isCurrentlyEditing && (
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 border border-blue-300 px-2.5 py-0.5 rounded-full animate-pulse">
                              Editing
                            </span>
                          )}
                          {isArchivedSession && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                              Archived
                            </span>
                          )}
                        </div>

                        <div className={`flex items-center gap-1.5 ${(!canEdit || isCurrentlyEditing) ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"}`}>
                          {!isArchivedSession && (
                            <button 
                              type="button"
                              onClick={() => startEdit(session)}
                              className={`px-2.5 py-1 ${
                                isCurrentlyEditing 
                                  ? 'bg-blue-600 text-white shadow-xs' 
                                  : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700'
                              } rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1`}
                              title={canEdit ? (isCurrentlyEditing ? "Currently Editing" : "Edit Session") : "View Session"}
                            >
                              {!canEdit && <Eye size={12} />}
                              <span>{canEdit ? (isCurrentlyEditing ? "Editing..." : t("common.edit", "Edit")) : t("common.view", "View")}</span>
                            </button>
                          )}

                          {canEdit && (
                            isArchivedSession ? (
                              <div className="flex items-center gap-1">
                                <button 
                                  type="button"
                                  onClick={() => handleRestore(session.id)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                  title="Restore Session"
                                >
                                  <RotateCcw size={12} />
                                  <span>{t("common.restore", "Restore")}</span>
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleDeletePermanent(session.id)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                  title="Delete Session Permanently"
                                >
                                  <Trash2 size={12} />
                                  <span>{t("common.delete", "Delete")}</span>
                                </button>
                              </div>
                            ) : (
                              <button 
                                type="button"
                                onClick={() => handleArchive(session.id)}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                title="Archive Session (Data preserved)"
                              >
                                <Archive size={11} />
                                <span>{t("common.archive", "Archive")}</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {session.title}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Speakers */}
                        {Array.isArray(session.speakers) && session.speakers.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">{t("calendar.speakers", "Speakers")}</span>
                            <div className="flex flex-wrap gap-2">
                              {session.speakers.map((s, idx) => {
                                if (!s) return null;
                                const matched = allEventExperts.find(e => e.name.toLowerCase() === (s.name || "").trim().toLowerCase());
                                const sTitle = s.title || s.jobTitle || matched?.title || "";
                                const sCompany = s.company || matched?.company || "";
                                const sImg = s.image || matched?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || "User")}`;
                                return (
                                  <div 
                                    key={idx} 
                                    className="flex items-center gap-2 bg-slate-50 border border-slate-200 pl-1.5 pr-2.5 py-1 rounded-full text-xs font-bold text-slate-700"
                                    title={[s.name, sTitle, sCompany].filter(Boolean).join(" • ")}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={sImg} className="w-5 h-5 rounded-full object-cover shrink-0" alt="" />
                                    <div className="flex flex-col min-w-0 leading-tight">
                                      <span className="truncate max-w-[140px]">{s.name || "Unknown"}</span>
                                      {(sTitle || sCompany) && (
                                        <span className="text-[10px] text-slate-400 font-normal truncate max-w-[140px]">
                                          {[sTitle, sCompany].filter(Boolean).join(" • ")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Moderators */}
                        {Array.isArray(session.moderators) && session.moderators.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">{t("calendar.moderators", "Moderators")}</span>
                            <div className="flex flex-wrap gap-2">
                              {session.moderators.map((m, idx) => {
                                if (!m) return null;
                                const matched = allEventExperts.find(e => e.name.toLowerCase() === (m.name || "").trim().toLowerCase());
                                const mTitle = m.title || m.jobTitle || matched?.title || "";
                                const mCompany = m.company || matched?.company || "";
                                const mImg = m.image || matched?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || "User")}`;
                                return (
                                  <div 
                                    key={idx} 
                                    className="flex items-center gap-2 bg-slate-50 border border-slate-200 pl-1.5 pr-2.5 py-1 rounded-full text-xs font-bold text-slate-700"
                                    title={[m.name, mTitle, mCompany].filter(Boolean).join(" • ")}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={mImg} className="w-5 h-5 rounded-full object-cover shrink-0" alt="" />
                                    <div className="flex flex-col min-w-0 leading-tight">
                                      <span className="truncate max-w-[140px]">{m.name || "Unknown"}</span>
                                      {(mTitle || mCompany) && (
                                        <span className="text-[10px] text-indigo-500 font-normal truncate max-w-[140px]">
                                          {[mTitle, mCompany].filter(Boolean).join(" • ")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Session Logos Section */}
                      {Array.isArray(session.logos) && session.logos.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                          {session.logos.map((logo, idx) => (
                            logo && logo.image ? (
                              <div key={idx} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={logo.image} className="h-4 object-contain max-w-[70px]" alt="" />
                                <span className="text-[10px] font-bold text-slate-500">{logo.label}</span>
                              </div>
                            ) : null
                          ))}
                        </div>
                      )}

                      {/* Description */}
                      {session.description && (
                        <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                          {session.description}
                        </p>
                      )}

                      {/* Calendar Link */}
                      <div className="flex border-t border-slate-100 pt-3 justify-start">
                        <a 
                          href={getGoogleCalendarLink(session)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 px-3.5 py-1.5 rounded-xl transition-colors"
                        >
                          {t("calendar.addToGCal", "Add to Google Calendar")}
                        </a>
                      </div>
                    </div>
                  </React.Fragment>
                );
              });
            })()
          )}
        </div>
      </section>
    </div>
  );
}
