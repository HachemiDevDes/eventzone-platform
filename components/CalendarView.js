"use client";

import React, { useState, useEffect, useRef } from "react";
import { Calendar, Archive, RotateCcw, Camera, Upload, Check, Loader2, X, Trash2 } from "lucide-react";
import CustomDatePicker from "./CustomDatePicker";
import CustomTimePicker from "./CustomTimePicker";
import { generateUuid } from "../lib/db";
import { CalendarSkeleton } from "./SkeletonLoaders";

export default function CalendarView({
  sessions = [],
  attendees = [],
  isLoading = false,
  onSaveSessions,
  onClearAllSessions,
  onUploadFile
}) {
  // Database states
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  // Form states
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  
  // Person input states
  const [speakerName, setSpeakerName] = useState("");
  const [speakerImg, setSpeakerImg] = useState("");
  const [speakersList, setSpeakersList] = useState([]);
  const [isUploadingSpeaker, setIsUploadingSpeaker] = useState(false);
  
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

  // Base64 file converter or storage uploader
  const handleImageUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "speaker") setIsUploadingSpeaker(true);
    else if (type === "moderator") setIsUploadingModerator(true);
    else if (type === "logo") setIsUploadingLogo(true);

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
        if (type === "speaker") {
          setSpeakerImg(publicUrl);
        } else if (type === "moderator") {
          setModeratorImg(publicUrl);
        } else if (type === "logo") {
          setLogoImg(publicUrl);
        }
      }
    } catch (err) {
      console.warn("Storage upload notice, converting to local preview:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          if (type === "speaker") setSpeakerImg(reader.result);
          else if (type === "moderator") setModeratorImg(reader.result);
          else if (type === "logo") setLogoImg(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      if (type === "speaker") setIsUploadingSpeaker(false);
      else if (type === "moderator") setIsUploadingModerator(false);
      else if (type === "logo") setIsUploadingLogo(false);
      e.target.value = "";
    }
  };

  // Inline Photo Update for existing speaker / moderator in the list
  const handleUpdateExistingPersonPhoto = async (id, type, e) => {
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
        if (type === "speaker") {
          setSpeakersList(prev => prev.map(s => s.id === id ? { ...s, image: publicUrl } : s));
        } else {
          setModeratorsList(prev => prev.map(m => m.id === id ? { ...m, image: publicUrl } : m));
        }
      }
    } catch (err) {
      console.warn("Photo replacement error, using local fallback:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          if (type === "speaker") {
            setSpeakersList(prev => prev.map(s => s.id === id ? { ...s, image: reader.result } : s));
          } else {
            setModeratorsList(prev => prev.map(m => m.id === id ? { ...m, image: reader.result } : m));
          }
        }
      };
      reader.readAsDataURL(file);
    } finally {
      e.target.value = "";
    }
  };

  // Add person to list
  const addPerson = (type) => {
    if (type === "speaker") {
      if (!speakerName.trim()) return;
      const newSpeaker = {
        id: Date.now(),
        name: speakerName.trim(),
        image: speakerImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(speakerName.trim())}&background=2563eb&color=fff`
      };
      setSpeakersList([...speakersList, newSpeaker]);
      setSpeakerName("");
      setSpeakerImg("");
    } else {
      if (!moderatorName.trim()) return;
      const newModerator = {
        id: Date.now(),
        name: moderatorName.trim(),
        image: moderatorImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(moderatorName.trim())}&background=4f46e5&color=fff`
      };
      setModeratorsList([...moderatorsList, newModerator]);
      setModeratorName("");
      setModeratorImg("");
    }
  };

  const removePerson = (id, type) => {
    if (type === "speaker") {
      setSpeakersList(speakersList.filter(s => s.id !== id));
    } else {
      setModeratorsList(moderatorsList.filter(m => m.id !== id));
    }
  };

  // Add logo to list
  const addLogo = () => {
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
    setLogosList(logosList.filter(l => l.id !== id));
  };

  // Form Submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a session title.");
      return;
    }
    if (!date) {
      alert("Please select a date for the session.");
      return;
    }

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
            speakers: speakersList,
            moderators: moderatorsList,
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
        speakers: speakersList,
        moderators: moderatorsList,
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
    setEditingSessionId(null);
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
  };

  const handleArchive = (id) => {
    if (confirm("Archive this session? (Preserved in archives)")) {
      onSaveSessions(sessions.map(s => s.id === id ? { ...s, status: "archived", isArchived: true } : s));
      if (editingSessionId === id) resetForm();
    }
  };

  const handleRestore = (id) => {
    onSaveSessions(sessions.map(s => s.id === id ? { ...s, status: "published", isArchived: false } : s));
  };

  const handleDeletePermanent = (id) => {
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
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  const formatFullDate = (dateStr) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
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

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="flex flex-1 w-full min-h-[calc(100vh-140px)] bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* LEFT PANEL: CREATE A SESSION / EDIT A SESSION                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <aside 
        className="bg-white border-r border-slate-200 p-6 sm:p-7 flex flex-col gap-5 overflow-y-auto shrink-0 select-none"
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Dynamic Title: switches between Create a Session and Edit a Session */}
        <div className="flex flex-col gap-1 pb-2 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900">
            {editingSessionId ? "Edit a Session" : "Create a Session"}
          </h2>
          <p className="text-sm text-slate-500">
            {editingSessionId 
              ? "Edit the details below to update this session." 
              : "Fill in the details to schedule a new event session."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Session Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Session Title *
            </label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Opening Keynote" 
              required
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600 text-xs font-semibold"
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Date *
            </label>
            <CustomDatePicker
              value={date}
              onChange={setDate}
              placeholder="Select session date"
            />
          </div>

          {/* Start and End Times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Start Time *
              </label>
              <CustomTimePicker
                value={startTime}
                onChange={setStartTime}
                placeholder="Start time"
                align="left"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                End Time *
              </label>
              <CustomTimePicker
                value={endTime}
                onChange={setEndTime}
                placeholder="End time"
                align="right"
              />
            </div>
          </div>

          {/* Speakers */}
          <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Speakers
              </label>
              {speakerImg && (
                <button
                  type="button"
                  onClick={() => setSpeakerImg("")}
                  className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  Clear Photo
                </button>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <input 
                type="text" 
                value={speakerName}
                onChange={(e) => setSpeakerName(e.target.value)}
                placeholder="Speaker Name"
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
                <span>{isUploadingSpeaker ? "Uploading..." : speakerImg ? "Photo Attached" : "Photo"}</span>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "speaker")} className="hidden" />
              </label>
              <button 
                type="button" 
                onClick={() => addPerson("speaker")}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
              >
                Add
              </button>
            </div>

            {speakersList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {speakersList.map(s => (
                  <div key={s.id} className="group relative flex items-center gap-1.5 pl-1 pr-2 py-1 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 rounded-full text-[11px] font-bold text-slate-700 transition-colors">
                    {/* Clickable Avatar to Replace Photo */}
                    <label className="relative cursor-pointer" title="Click to change photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.image} className="w-5 h-5 rounded-full object-cover border border-slate-200 group-hover:border-blue-400 transition-colors" alt="" />
                      <span className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={9} className="text-white" />
                      </span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleUpdateExistingPersonPhoto(s.id, "speaker", e)} 
                        className="hidden" 
                      />
                    </label>
                    <span className="truncate max-w-[110px]">{s.name}</span>
                    <button type="button" onClick={() => removePerson(s.id, "speaker")} className="text-slate-400 hover:text-rose-600 font-bold ml-0.5 cursor-pointer" title="Remove speaker">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Moderators */}
          <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Moderators
              </label>
              {moderatorImg && (
                <button
                  type="button"
                  onClick={() => setModeratorImg("")}
                  className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  Clear Photo
                </button>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <input 
                type="text" 
                value={moderatorName}
                onChange={(e) => setModeratorName(e.target.value)}
                placeholder="Moderator Name"
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
                <span>{isUploadingModerator ? "Uploading..." : moderatorImg ? "Photo Attached" : "Photo"}</span>
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

            {moderatorsList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {moderatorsList.map(m => (
                  <div key={m.id} className="group relative flex items-center gap-1.5 pl-1 pr-2 py-1 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 rounded-full text-[11px] font-bold text-slate-700 transition-colors">
                    <label className="relative cursor-pointer" title="Click to change photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.image} className="w-5 h-5 rounded-full object-cover border border-slate-200 group-hover:border-indigo-400 transition-colors" alt="" />
                      <span className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={9} className="text-white" />
                      </span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleUpdateExistingPersonPhoto(m.id, "moderator", e)} 
                        className="hidden" 
                      />
                    </label>
                    <span className="truncate max-w-[110px]">{m.name}</span>
                    <button type="button" onClick={() => removePerson(m.id, "moderator")} className="text-slate-400 hover:text-rose-600 font-bold ml-0.5 cursor-pointer" title="Remove moderator">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logos & Partners */}
          <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Logos &amp; Partners
            </label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2.5">
              <input 
                type="text" 
                value={logoLabel}
                onChange={(e) => setLogoLabel(e.target.value)}
                placeholder="Label (e.g. Sponsor, Co-Host)"
                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
              />

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
                  <span>{isUploadingLogo ? "Uploading..." : logoImg ? "Logo Attached" : "Upload Logo Image"}</span>
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

              {logosList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/80">
                  {logosList.map(l => (
                    <div key={l.id} className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-white border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-700 shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={l.image} className="h-4 object-contain max-w-[60px]" alt="" />
                      <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-[80px]">{l.label}</span>
                      <button type="button" onClick={() => removeLogo(l.id)} className="text-slate-400 hover:text-rose-500 ml-1 font-bold text-xs">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Description
            </label>
            <textarea 
              rows={3} 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Tell us about this session..." 
              className="px-3.5 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-slate-800 focus:outline-none focus:border-blue-600 text-xs resize-none font-medium"
            />
          </div>

          {/* Form Action Buttons */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              {editingSessionId ? "Update Session" : "Create Session"}
            </button>

            {editingSessionId && (
              <button 
                type="button"
                onClick={resetForm}
                className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Cancel Edit
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
      <section className="flex-1 bg-slate-50/70 p-6 sm:p-8 flex flex-col overflow-y-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Event Timeline &amp; Sessions
            </h2>
            <p className="text-sm text-slate-500">
              Sort, view, edit, and organize scheduled sessions by day.
            </p>
          </div>

          {sessions.length > 0 && (
            <button 
              type="button"
              onClick={onClearAllSessions}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              Clear All
            </button>
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
              All Active ({activeSessions.length})
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
                Day {i + 1} ({formatDateLabel(date)})
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
                <span>Archived ({archivedSessions.length})</span>
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

                    <div className={`bg-white border ${isArchivedSession ? 'border-slate-200 opacity-80' : 'border-slate-200'} rounded-3xl p-6 flex flex-col gap-4 hover:shadow-md transition-all relative group`}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-blue-50 border border-blue-200/80 rounded-full text-blue-700 font-extrabold text-xs select-none">
                            <span>{session.startTime} — {session.endTime}</span>
                          </div>
                          {isArchivedSession && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                              Archived
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isArchivedSession && (
                            <button 
                              type="button"
                              onClick={() => startEdit(session)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              title="Edit Session"
                            >
                              Edit
                            </button>
                          )}

                          {isArchivedSession ? (
                            <div className="flex items-center gap-1">
                              <button 
                                type="button"
                                onClick={() => handleRestore(session.id)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                title="Restore Session"
                              >
                                <RotateCcw size={12} />
                                <span>Restore</span>
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeletePermanent(session.id)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                title="Delete Session Permanently"
                              >
                                <Trash2 size={12} />
                                <span>Delete</span>
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
                              <span>Archive</span>
                            </button>
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
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">Speakers</span>
                            <div className="flex flex-wrap gap-2">
                              {session.speakers.map((s, idx) => (
                                s ? (
                                  <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 pl-1.5 pr-2.5 py-1 rounded-full text-xs font-bold text-slate-700">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={s.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || "User")}`} className="w-5 h-5 rounded-full object-cover shrink-0" alt="" />
                                    <span className="truncate max-w-[120px]">{s.name || "Unknown"}</span>
                                  </div>
                                ) : null
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Moderators */}
                        {Array.isArray(session.moderators) && session.moderators.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">Moderators</span>
                            <div className="flex flex-wrap gap-2">
                              {session.moderators.map((m, idx) => (
                                m ? (
                                  <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 pl-1.5 pr-2.5 py-1 rounded-full text-xs font-bold text-slate-700">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={m.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || "User")}`} className="w-5 h-5 rounded-full object-cover shrink-0" alt="" />
                                    <span className="truncate max-w-[120px]">{m.name || "Unknown"}</span>
                                  </div>
                                ) : null
                              ))}
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
                          Add to Google Calendar
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
