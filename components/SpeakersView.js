/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Mic,
  Mic2,
  Users,
  User,
  UserPlus,
  UserCheck,
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Camera,
  Upload,
  Check,
  X,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Briefcase,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  Download,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
  MoreVertical,
  MoreHorizontal,
  ArrowUpRight,
  Copy,
  Share2,
  Tag,
  BookOpen,
  Layers,
  ShieldCheck,
  HelpCircle,
  Loader2,
  Award,
  Video,
  FileText,
  UserX
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { useLanguage } from "../lib/i18n";
import { uploadMedia } from "@/lib/storage";

// Custom SVG Icons for Social Networks
const LinkedinIcon = ({ size = 14, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

const TwitterIcon = ({ size = 14, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const GithubIcon = ({ size = 14, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
  </svg>
);

const SPEAKER_ROLES = [
  { value: "Keynote Speaker", label: "Keynote Speaker", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "Featured Speaker", label: "Featured Speaker", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "Speaker", label: "Speaker", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "Moderator", label: "Moderator", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "Panelist", label: "Panelist", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { value: "Workshop Host", label: "Workshop Host", color: "bg-teal-50 text-teal-700 border-teal-200" },
];

export default function SpeakersView({
  state = {},
  onUpdateState,
  onOpenModal,
  onUploadFile,
  onSwitchView,
}) {
  const { t } = useLanguage();
  const { sessions = [], attendees = [], eventDetails = {} } = state;

  // View & Filter States
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all"); // "all" | "attendee" | "custom"
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "Confirmed" | "Pending"
  const [sortBy, setSortBy] = useState("name_asc");

  // Modal / Drawer States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState(null);
  const [assigningSpeaker, setAssigningSpeaker] = useState(null);
  const [speakerToDelete, setSpeakerToDelete] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Add Form State
  const [addMode, setAddMode] = useState("attendee"); // "attendee" | "custom"
  const [selectedAttendeeId, setSelectedAttendeeId] = useState("");
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addJobTitle, setAddJobTitle] = useState("");
  const [addCompany, setAddCompany] = useState("");
  const [addRole, setAddRole] = useState("Speaker");
  const [addBio, setAddBio] = useState("");
  const [addTopic, setAddTopic] = useState("");
  const [addPhoto, setAddPhoto] = useState("");
  const [addSessionIds, setAddSessionIds] = useState([]);
  const [addLinkedin, setAddLinkedin] = useState("");
  const [addTwitter, setAddTwitter] = useState("");
  const [addWebsite, setAddWebsite] = useState("");
  const [addCreatePass, setAddCreatePass] = useState(true);

  // Quick Assign Session State
  const [quickSessionId, setQuickSessionId] = useState("");
  const [quickRole, setQuickRole] = useState("speaker");

  // Success Notification Toast
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ─────────────────────────────────────────────────────────
  // 1. UNIFIED SPEAKERS DIRECTORY EXTRACTION & NORMALIZATION
  // ─────────────────────────────────────────────────────────
  const speakersDirectory = useMemo(() => {
    const map = new Map();

    const normalizeKey = (name, email) => {
      if (email && email.trim()) return `email:${email.toLowerCase().trim()}`;
      return `name:${(name || "").toLowerCase().trim()}`;
    };

    // A. Parse from Sessions
    sessions.forEach((sess) => {
      // 1. Speakers list
      (sess.speakers || []).forEach((spk) => {
        if (!spk) return;
        const spkName = typeof spk === "string" ? spk : spk.name || spk.fullName || "";
        if (!spkName.trim()) return;

        const key = normalizeKey(spkName, spk.email);
        const existing = map.get(key) || {
          id: spk.id || `spk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: spkName,
          email: spk.email || "",
          phone: spk.phone || "",
          image: spk.image || spk.avatar || "",
          jobTitle: spk.jobTitle || spk.title || spk.position || "",
          company: spk.company || spk.organization || spk.org || "",
          bio: spk.bio || spk.about || "",
          role: spk.role || "Speaker",
          status: spk.status || "Confirmed",
          topic: spk.topic || spk.talkTitle || spk.keynoteTitle || "",
          slidesUrl: spk.slidesUrl || spk.slides || "",
          socials: {
            linkedin: spk.linkedin || (spk.socials && spk.socials.linkedin) || "",
            twitter: spk.twitter || (spk.socials && spk.socials.twitter) || "",
            github: spk.github || (spk.socials && spk.socials.github) || "",
            website: spk.website || (spk.socials && spk.socials.website) || "",
          },
          assignedSessions: [],
          isAttendee: false,
          attendeeId: null,
          ticketType: "",
          checkedIn: false,
          badgeCode: "",
        };

        // Add this session if not already attached
        if (!existing.assignedSessions.some((as) => String(as.id) === String(sess.id))) {
          existing.assignedSessions.push({
            id: sess.id,
            title: sess.title || "Untitled Session",
            date: sess.date || "",
            startTime: sess.startTime || "",
            endTime: sess.endTime || "",
            room: sess.room || sess.location || "",
            sessionRole: "speaker",
          });
        }

        // Fill in metadata if missing
        if (!existing.image && (spk.image || spk.avatar)) existing.image = spk.image || spk.avatar;
        if (!existing.jobTitle && (spk.jobTitle || spk.title)) existing.jobTitle = spk.jobTitle || spk.title;
        if (!existing.company && (spk.company || spk.organization)) existing.company = spk.company || spk.organization;
        if (!existing.bio && spk.bio) existing.bio = spk.bio;
        if (!existing.email && spk.email) existing.email = spk.email;
        if (!existing.topic && (spk.topic || spk.talkTitle)) existing.topic = spk.topic || spk.talkTitle;

        map.set(key, existing);
      });

      // 2. Moderators list
      (sess.moderators || []).forEach((mod) => {
        if (!mod) return;
        const modName = typeof mod === "string" ? mod : mod.name || mod.fullName || "";
        if (!modName.trim()) return;

        const key = normalizeKey(modName, mod.email);
        const existing = map.get(key) || {
          id: mod.id || `mod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: modName,
          email: mod.email || "",
          phone: mod.phone || "",
          image: mod.image || mod.avatar || "",
          jobTitle: mod.jobTitle || mod.title || mod.position || "",
          company: mod.company || mod.organization || mod.org || "",
          bio: mod.bio || mod.about || "",
          role: "Moderator",
          status: mod.status || "Confirmed",
          topic: mod.topic || "",
          slidesUrl: mod.slidesUrl || "",
          socials: {
            linkedin: mod.linkedin || (mod.socials && mod.socials.linkedin) || "",
            twitter: mod.twitter || (mod.socials && mod.socials.twitter) || "",
            github: mod.github || (mod.socials && mod.socials.github) || "",
            website: mod.website || (mod.socials && mod.socials.website) || "",
          },
          assignedSessions: [],
          isAttendee: false,
          attendeeId: null,
          ticketType: "",
          checkedIn: false,
          badgeCode: "",
        };

        if (!existing.assignedSessions.some((as) => String(as.id) === String(sess.id))) {
          existing.assignedSessions.push({
            id: sess.id,
            title: sess.title || "Untitled Session",
            date: sess.date || "",
            startTime: sess.startTime || "",
            endTime: sess.endTime || "",
            room: sess.room || sess.location || "",
            sessionRole: "moderator",
          });
        }

        if (!existing.image && (mod.image || mod.avatar)) existing.image = mod.image || mod.avatar;
        if (!existing.jobTitle && (mod.jobTitle || mod.title)) existing.jobTitle = mod.jobTitle || mod.title;
        if (!existing.company && (mod.company || mod.organization)) existing.company = mod.company || mod.organization;

        map.set(key, existing);
      });
    });

    // B. Match & Merge with Attendees list
    attendees.forEach((att) => {
      const isMarkedSpeaker =
        att.isSpeaker ||
        att.is_speaker ||
        (att.ticketType || att.ticket_type || "").toLowerCase().includes("speaker");

      const keyByName = normalizeKey(att.name, "");
      const keyByEmail = normalizeKey("", att.email);

      let matched = map.get(keyByEmail) || map.get(keyByName);

      if (matched) {
        matched.isAttendee = true;
        matched.attendeeId = att.id;
        matched.ticketType = att.ticketType || att.ticket_type || "";
        matched.checkedIn = Boolean(att.checkedIn || att.checked_in);
        matched.badgeCode = att.badgeCode || att.badge_code || "";
        if (!matched.email && att.email) matched.email = att.email;
        if (!matched.phone && att.phone) matched.phone = att.phone;
        if (!matched.image && (att.image || att.avatar)) matched.image = att.image || att.avatar;
        if (!matched.company && (att.company || att.organization)) matched.company = att.company || att.organization;
        if (!matched.jobTitle && (att.jobTitle || att.job_title)) matched.jobTitle = att.jobTitle || att.job_title;
      } else if (isMarkedSpeaker) {
        // Speaker in attendees list but not yet assigned to any session
        const newKey = normalizeKey(att.name, att.email);
        map.set(newKey, {
          id: att.id,
          name: att.name || "Unnamed Speaker",
          email: att.email || "",
          phone: att.phone || "",
          image: att.image || att.avatar || "",
          jobTitle: att.jobTitle || att.job_title || "",
          company: att.company || att.organization || "",
          bio: att.bio || "",
          role: "Speaker",
          status: att.status === "archived" ? "Pending" : "Confirmed",
          topic: "",
          slidesUrl: "",
          socials: {
            linkedin: att.linkedin || "",
            twitter: att.twitter || "",
            github: att.github || "",
            website: att.website || "",
          },
          assignedSessions: [],
          isAttendee: true,
          attendeeId: att.id,
          ticketType: att.ticketType || att.ticket_type || "Speaker Pass",
          checkedIn: Boolean(att.checkedIn || att.checked_in),
          badgeCode: att.badgeCode || att.badge_code || "",
        });
      }
    });

    return Array.from(map.values());
  }, [sessions, attendees]);

  // ─────────────────────────────────────────────────────────
  // 2. FILTERING & SORTING
  // ─────────────────────────────────────────────────────────
  const filteredSpeakers = useMemo(() => {
    return speakersDirectory
      .filter((spk) => {
        // Text Search
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchesName = spk.name.toLowerCase().includes(q);
          const matchesEmail = (spk.email || "").toLowerCase().includes(q);
          const matchesCompany = (spk.company || "").toLowerCase().includes(q);
          const matchesTitle = (spk.jobTitle || "").toLowerCase().includes(q);
          const matchesBio = (spk.bio || "").toLowerCase().includes(q);
          const matchesTopic = (spk.topic || "").toLowerCase().includes(q);
          const matchesSessions = spk.assignedSessions.some((s) => s.title.toLowerCase().includes(q));

          if (!matchesName && !matchesEmail && !matchesCompany && !matchesTitle && !matchesBio && !matchesTopic && !matchesSessions) {
            return false;
          }
        }

        // Role Filter
        if (roleFilter !== "all") {
          if (roleFilter === "Keynote" && !spk.role.toLowerCase().includes("keynote")) return false;
          if (roleFilter === "Moderator" && !spk.role.toLowerCase().includes("moderator") && !spk.assignedSessions.some((s) => s.sessionRole === "moderator")) return false;
          if (roleFilter === "Speaker" && spk.role.toLowerCase().includes("moderator") && !spk.role.toLowerCase().includes("speaker")) return false;
          if (roleFilter === "Panelist" && !spk.role.toLowerCase().includes("panelist")) return false;
          if (roleFilter === "Workshop" && !spk.role.toLowerCase().includes("workshop")) return false;
        }

        // Session Filter
        if (sessionFilter !== "all") {
          if (sessionFilter === "unassigned") {
            if (spk.assignedSessions.length > 0) return false;
          } else {
            if (!spk.assignedSessions.some((s) => String(s.id) === String(sessionFilter))) return false;
          }
        }

        // Source Filter (Attendee vs Custom/VIP)
        if (sourceFilter === "attendee" && !spk.isAttendee) return false;
        if (sourceFilter === "custom" && spk.isAttendee) return false;

        // Status Filter
        if (statusFilter !== "all" && spk.status !== statusFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name_asc") return a.name.localeCompare(b.name);
        if (sortBy === "name_desc") return b.name.localeCompare(a.name);
        if (sortBy === "sessions_desc") return b.assignedSessions.length - a.assignedSessions.length;
        if (sortBy === "sessions_asc") return a.assignedSessions.length - b.assignedSessions.length;
        if (sortBy === "role") return a.role.localeCompare(b.role);
        return 0;
      });
  }, [speakersDirectory, searchTerm, roleFilter, sessionFilter, sourceFilter, statusFilter, sortBy]);

  // ─────────────────────────────────────────────────────────
  // 3. STAT METRICS
  // ─────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalSpeakers = speakersDirectory.length;
    const keynotes = speakersDirectory.filter((s) => s.role.toLowerCase().includes("keynote")).length;
    const moderators = speakersDirectory.filter(
      (s) => s.role.toLowerCase().includes("moderator") || s.assignedSessions.some((as) => as.sessionRole === "moderator")
    ).length;
    const unassigned = speakersDirectory.filter((s) => s.assignedSessions.length === 0).length;

    const totalSessions = sessions.length;
    const sessionsWithSpeakers = sessions.filter(
      (s) => (s.speakers && s.speakers.length > 0) || (s.moderators && s.moderators.length > 0)
    ).length;

    return {
      totalSpeakers,
      keynotes,
      moderators,
      unassigned,
      totalSessions,
      sessionsWithSpeakers,
    };
  }, [speakersDirectory, sessions]);

  // ─────────────────────────────────────────────────────────
  // 4. PHOTO UPLOAD HELPER
  // ─────────────────────────────────────────────────────────
  const uploadImageFile = async (file) => {
    if (!file) return null;
    if (file.size > 5 * 1024 * 1024) {
      alert(`Speaker photo is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 5 MB.`);
      return null;
    }
    try {
      if (onUploadFile) {
        const customUrl = await onUploadFile(file, "avatars");
        if (customUrl) return customUrl;
      }
      return await uploadMedia(file, "avatars");
    } catch (err) {
      console.warn("Upload fallback to data url:", err);
      return null;
    }
  };

  // Direct Photo Quick-Change from Speaker Card Avatar
  const handleQuickPhotoChange = async (speaker, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const url = await uploadImageFile(file);
      if (!url) return;

      // 1. Update in Sessions
      const updatedSessions = sessions.map((sess) => {
        let modified = false;
        const newSpeakers = (sess.speakers || []).map((spk) => {
          const sName = typeof spk === "string" ? spk : spk.name;
          if (sName.toLowerCase() === speaker.name.toLowerCase() || (spk.id && spk.id === speaker.id)) {
            modified = true;
            return typeof spk === "string" ? { name: spk, image: url } : { ...spk, image: url };
          }
          return spk;
        });

        const newModerators = (sess.moderators || []).map((mod) => {
          const mName = typeof mod === "string" ? mod : mod.name;
          if (mName.toLowerCase() === speaker.name.toLowerCase() || (mod.id && mod.id === speaker.id)) {
            modified = true;
            return typeof mod === "string" ? { name: mod, image: url } : { ...mod, image: url };
          }
          return mod;
        });

        return modified ? { ...sess, speakers: newSpeakers, moderators: newModerators } : sess;
      });
      onUpdateState("sessions", updatedSessions);

      // 2. Update in Attendees if linked
      if (speaker.isAttendee || speaker.attendeeId) {
        const updatedAttendees = attendees.map((att) => {
          if (String(att.id) === String(speaker.attendeeId) || att.name.toLowerCase() === speaker.name.toLowerCase()) {
            return { ...att, image: url, avatar: url, isSpeaker: true };
          }
          return att;
        });
        onUpdateState("attendees", updatedAttendees);
      }

      showToast(`Updated photo for ${speaker.name}!`);
    } catch (err) {
      console.error("Failed to update photo:", err);
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = "";
    }
  };

  // ─────────────────────────────────────────────────────────
  // 5. ATTENDEE SELECTION AUTO-FILL IN ADD FORM
  // ─────────────────────────────────────────────────────────
  const handleAttendeeSelect = (attendeeId) => {
    setSelectedAttendeeId(attendeeId);
    if (!attendeeId) return;

    const att = attendees.find((a) => String(a.id) === String(attendeeId));
    if (att) {
      setAddName(att.name || `${att.firstName || ""} ${att.lastName || ""}`.trim());
      setAddEmail(att.email || "");
      setAddPhone(att.phone || "");
      setAddPhoto(att.image || att.avatar || "");
      setAddJobTitle(att.jobTitle || att.job_title || att.answers?.jobTitle || "");
      setAddCompany(att.company || att.organization || att.answers?.company || "");
      setAddBio(att.bio || "");
      setAddLinkedin(att.linkedin || att.socialLinks?.linkedin || "");
      setAddTwitter(att.twitter || att.socialLinks?.twitter || "");
      setAddWebsite(att.website || att.socialLinks?.website || "");
    }
  };

  // ─────────────────────────────────────────────────────────
  // 6. ADD / ASSIGN SPEAKER FORM SUBMISSION
  // ─────────────────────────────────────────────────────────
  const handleAddSpeakerSubmit = (e) => {
    e.preventDefault();

    const targetName = addName.trim();
    if (!targetName) {
      alert("Please provide a speaker name.");
      return;
    }

    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(targetName)}&background=4f46e5&color=fff`;
    const finalPhoto = addPhoto || defaultAvatar;

    const speakerPayload = {
      id: Date.now(),
      name: targetName,
      email: addEmail.trim(),
      phone: addPhone.trim(),
      image: finalPhoto,
      avatar: finalPhoto,
      jobTitle: addJobTitle.trim(),
      company: addCompany.trim(),
      role: addRole,
      bio: addBio.trim(),
      topic: addTopic.trim(),
      talkTitle: addTopic.trim(),
      status: "Confirmed",
      socials: {
        linkedin: addLinkedin.trim(),
        twitter: addTwitter.trim(),
        website: addWebsite.trim(),
      },
    };

    // 1. Assign to selected sessions
    let updatedSessions = [...sessions];
    if (addSessionIds.length > 0) {
      updatedSessions = sessions.map((sess) => {
        if (addSessionIds.includes(String(sess.id))) {
          const isMod = addRole.toLowerCase().includes("moderator");
          const listKey = isMod ? "moderators" : "speakers";
          const currentList = [...(sess[listKey] || [])];

          // Check if already in session
          const exists = currentList.some((p) => {
            const pName = typeof p === "string" ? p : p.name;
            return pName.toLowerCase() === targetName.toLowerCase();
          });

          if (!exists) {
            currentList.push(speakerPayload);
            return { ...sess, [listKey]: currentList };
          }
        }
        return sess;
      });
      onUpdateState("sessions", updatedSessions);
    }

    // 2. Update or create in Attendees
    let updatedAttendees = [...attendees];
    if (addMode === "attendee" && selectedAttendeeId) {
      // Mark existing attendee as speaker
      updatedAttendees = attendees.map((a) => {
        if (String(a.id) === String(selectedAttendeeId)) {
          return {
            ...a,
            isSpeaker: true,
            is_speaker: true,
            image: finalPhoto,
            avatar: finalPhoto,
            jobTitle: addJobTitle.trim() || a.jobTitle,
            company: addCompany.trim() || a.company,
            bio: addBio.trim() || a.bio,
          };
        }
        return a;
      });
      onUpdateState("attendees", updatedAttendees);
    } else if (addCreatePass) {
      // Create new Speaker attendee record
      const newAttendee = {
        id: `spk-${Date.now()}`,
        name: targetName,
        firstName: targetName.split(" ")[0] || "",
        lastName: targetName.split(" ").slice(1).join(" ") || "",
        email: addEmail.trim() || `${targetName.toLowerCase().replace(/\s+/g, ".")}@speaker.event`,
        phone: addPhone.trim(),
        ticketType: "Speaker Pass",
        ticket_type: "Speaker Pass",
        isSpeaker: true,
        is_speaker: true,
        image: finalPhoto,
        avatar: finalPhoto,
        jobTitle: addJobTitle.trim(),
        company: addCompany.trim(),
        bio: addBio.trim(),
        status: "confirmed",
        checkedIn: false,
        badgeCode: `SPK-${String(Date.now()).slice(-4).toUpperCase()}`,
        registeredDate: new Date().toISOString().split("T")[0],
      };
      onUpdateState("attendees", [newAttendee, ...attendees]);
    }

    showToast(`Successfully added ${targetName} to the Speakers Directory!`);
    resetAddForm();
  };

  const resetAddForm = () => {
    setShowAddModal(false);
    setSelectedAttendeeId("");
    setAddName("");
    setAddEmail("");
    setAddPhone("");
    setAddJobTitle("");
    setAddCompany("");
    setAddRole("Speaker");
    setAddBio("");
    setAddTopic("");
    setAddPhoto("");
    setAddSessionIds([]);
    setAddLinkedin("");
    setAddTwitter("");
    setAddWebsite("");
    setAddCreatePass(true);
  };

  // ─────────────────────────────────────────────────────────
  // 7. EDIT SPEAKER MODAL / SAVE PROFILE
  // ─────────────────────────────────────────────────────────
  const handleSaveSpeakerEdit = (e) => {
    e.preventDefault();
    if (!editingSpeaker) return;

    const targetName = editingSpeaker.name.trim();
    if (!targetName) {
      alert("Name cannot be empty.");
      return;
    }

    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(targetName)}&background=4f46e5&color=fff`;
    const finalImage = editingSpeaker.image || defaultAvatar;

    const updatedData = {
      ...editingSpeaker,
      name: targetName,
      image: finalImage,
      avatar: finalImage,
      socials: {
        linkedin: editingSpeaker.socials?.linkedin || "",
        twitter: editingSpeaker.socials?.twitter || "",
        github: editingSpeaker.socials?.github || "",
        website: editingSpeaker.socials?.website || "",
      },
    };

    const targetAssignedIds = (editingSpeaker.assignedSessions || []).map((s) => String(s.id));

    // 1. Update in all sessions: add, update, or remove
    const updatedSessions = sessions.map((sess) => {
      const sessIdStr = String(sess.id);
      const isAssigned = targetAssignedIds.includes(sessIdStr);
      const assignedObj = (editingSpeaker.assignedSessions || []).find((s) => String(s.id) === sessIdStr);
      const sessionRole = assignedObj?.sessionRole || (editingSpeaker.role.toLowerCase().includes("moderator") ? "moderator" : "speaker");

      // Filter out previous occurrences of this speaker from both lists
      const filteredSpeakers = (sess.speakers || []).filter((spk) => {
        const sName = typeof spk === "string" ? spk : spk.name;
        return sName.toLowerCase() !== targetName.toLowerCase() && (!spk.id || spk.id !== editingSpeaker.id);
      });

      const filteredModerators = (sess.moderators || []).filter((mod) => {
        const mName = typeof mod === "string" ? mod : mod.name;
        return mName.toLowerCase() !== targetName.toLowerCase() && (!mod.id || mod.id !== editingSpeaker.id);
      });

      if (isAssigned) {
        const speakerEntry = {
          id: editingSpeaker.id || Date.now(),
          name: targetName,
          email: editingSpeaker.email,
          phone: editingSpeaker.phone,
          image: finalImage,
          avatar: finalImage,
          jobTitle: editingSpeaker.jobTitle,
          company: editingSpeaker.company,
          role: editingSpeaker.role,
          bio: editingSpeaker.bio,
          topic: editingSpeaker.topic,
          talkTitle: editingSpeaker.topic,
          slidesUrl: editingSpeaker.slidesUrl,
          status: editingSpeaker.status,
          socials: updatedData.socials,
        };

        if (sessionRole === "moderator") {
          return {
            ...sess,
            speakers: filteredSpeakers,
            moderators: [...filteredModerators, speakerEntry],
          };
        } else {
          return {
            ...sess,
            speakers: [...filteredSpeakers, speakerEntry],
            moderators: filteredModerators,
          };
        }
      } else {
        // Not assigned to this session
        return {
          ...sess,
          speakers: filteredSpeakers,
          moderators: filteredModerators,
        };
      }
    });
    onUpdateState("sessions", updatedSessions);

    // 2. Update attendee if linked
    if (editingSpeaker.isAttendee || editingSpeaker.attendeeId) {
      const updatedAttendees = attendees.map((att) => {
        if (
          String(att.id) === String(editingSpeaker.attendeeId) ||
          att.name.toLowerCase() === targetName.toLowerCase() ||
          (att.email && editingSpeaker.email && att.email.toLowerCase() === editingSpeaker.email.toLowerCase())
        ) {
          return {
            ...att,
            name: targetName,
            firstName: targetName.split(" ")[0] || att.firstName,
            lastName: targetName.split(" ").slice(1).join(" ") || att.lastName,
            email: editingSpeaker.email || att.email,
            phone: editingSpeaker.phone || att.phone,
            image: finalImage,
            avatar: finalImage,
            jobTitle: editingSpeaker.jobTitle || att.jobTitle,
            company: editingSpeaker.company || att.company,
            bio: editingSpeaker.bio || att.bio,
            isSpeaker: true,
            is_speaker: true,
          };
        }
        return att;
      });
      onUpdateState("attendees", updatedAttendees);
    }

    showToast(`Saved changes for ${targetName}!`);
    setEditingSpeaker(null);
  };

  // ─────────────────────────────────────────────────────────
  // 8. QUICK ASSIGN TO SESSION
  // ─────────────────────────────────────────────────────────
  const handleQuickAssignSubmit = (e) => {
    e.preventDefault();
    if (!assigningSpeaker || !quickSessionId) return;

    const session = sessions.find((s) => String(s.id) === String(quickSessionId));
    if (!session) return;

    const isMod = quickRole === "moderator";
    const targetKey = isMod ? "moderators" : "speakers";
    const currentList = [...(session[targetKey] || [])];

    const exists = currentList.some((p) => {
      const pName = typeof p === "string" ? p : p.name;
      return pName.toLowerCase() === assigningSpeaker.name.toLowerCase();
    });

    if (exists) {
      alert(`${assigningSpeaker.name} is already assigned to this session.`);
      return;
    }

    const speakerEntry = {
      id: assigningSpeaker.id || Date.now(),
      name: assigningSpeaker.name,
      email: assigningSpeaker.email || "",
      phone: assigningSpeaker.phone || "",
      image: assigningSpeaker.image,
      jobTitle: assigningSpeaker.jobTitle || "",
      company: assigningSpeaker.company || "",
      role: isMod ? "Moderator" : assigningSpeaker.role || "Speaker",
      bio: assigningSpeaker.bio || "",
      topic: assigningSpeaker.topic || "",
      status: "Confirmed",
      socials: assigningSpeaker.socials || {},
    };

    currentList.push(speakerEntry);

    const updatedSessions = sessions.map((s) =>
      String(s.id) === String(quickSessionId) ? { ...s, [targetKey]: currentList } : s
    );
    onUpdateState("sessions", updatedSessions);

    showToast(`Assigned ${assigningSpeaker.name} to "${session.title}"!`);
    setAssigningSpeaker(null);
    setQuickSessionId("");
  };

  // ─────────────────────────────────────────────────────────
  // 9. REMOVE / UNASSIGN SPEAKER
  // ─────────────────────────────────────────────────────────
  const handleConfirmDelete = (mode) => {
    if (!speakerToDelete) return;
    const targetName = speakerToDelete.name;

    if (mode === "all_sessions" || mode === "demote") {
      // Remove from all sessions
      const updatedSessions = sessions.map((sess) => ({
        ...sess,
        speakers: (sess.speakers || []).filter((spk) => {
          const sName = typeof spk === "string" ? spk : spk.name;
          return sName.toLowerCase() !== targetName.toLowerCase();
        }),
        moderators: (sess.moderators || []).filter((mod) => {
          const mName = typeof mod === "string" ? mod : mod.name;
          return mName.toLowerCase() !== targetName.toLowerCase();
        }),
      }));
      onUpdateState("sessions", updatedSessions);
    }

    if (mode === "demote") {
      // Unmark isSpeaker in attendees
      const updatedAttendees = attendees.map((att) => {
        if (
          String(att.id) === String(speakerToDelete.attendeeId) ||
          att.name.toLowerCase() === targetName.toLowerCase()
        ) {
          return { ...att, isSpeaker: false, is_speaker: false };
        }
        return att;
      });
      onUpdateState("attendees", updatedAttendees);
    }

    showToast(`Removed ${targetName} from speaker directory.`);
    setSpeakerToDelete(null);
  };

  // ─────────────────────────────────────────────────────────
  // 10. EXPORT TO CSV
  // ─────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (speakersDirectory.length === 0) {
      alert("No speakers to export.");
      return;
    }

    const headers = [
      "Name",
      "Role",
      "Job Title",
      "Organization/Company",
      "Email",
      "Phone",
      "Assigned Sessions",
      "Presentation Topic",
      "Status",
      "Is Registered Attendee",
      "Badge Code",
      "LinkedIn",
      "Twitter",
      "Website",
    ];

    const rows = speakersDirectory.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${(s.role || "Speaker").replace(/"/g, '""')}"`,
      `"${(s.jobTitle || "").replace(/"/g, '""')}"`,
      `"${(s.company || "").replace(/"/g, '""')}"`,
      `"${(s.email || "").replace(/"/g, '""')}"`,
      `"${(s.phone || "").replace(/"/g, '""')}"`,
      `"${s.assignedSessions.map((as) => as.title).join("; ").replace(/"/g, '""')}"`,
      `"${(s.topic || "").replace(/"/g, '""')}"`,
      `"${s.status}"`,
      s.isAttendee ? "Yes" : "No",
      `"${s.badgeCode || ""}"`,
      `"${(s.socials?.linkedin || "").replace(/"/g, '""')}"`,
      `"${(s.socials?.twitter || "").replace(/"/g, '""')}"`,
      `"${(s.socials?.website || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Speakers_Directory_${eventDetails.name || "Event"}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for role badge colors
  const getRoleBadge = (roleName) => {
    const matched = SPEAKER_ROLES.find((r) => r.value.toLowerCase() === (roleName || "").toLowerCase());
    if (matched) return matched.color;
    if ((roleName || "").toLowerCase().includes("moderator")) return "bg-amber-50 text-amber-700 border-amber-200";
    if ((roleName || "").toLowerCase().includes("keynote")) return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* HEADER SECTION */}
      {/* ───────────────────────────────────────────────────── */}
      <header className="flex flex-wrap justify-between items-center gap-4 select-none">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-650 flex items-center justify-center font-black border border-indigo-100 shadow-2xs">
              <Mic size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                Speakers &amp; Moderators
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {speakersDirectory.length} Total
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign speakers from attendees, schedule across sessions, and manage comprehensive speaker profiles.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-2xs cursor-pointer"
            title="Export Speakers Roster to CSV"
          >
            <Download size={13} />
            <span>Export Roster</span>
          </button>

          {onSwitchView && (
            <button
              onClick={() => onSwitchView("calendar")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 transition-all cursor-pointer"
            >
              <Calendar size={13} />
              <span>Agenda Timeline</span>
            </button>
          )}

          <button
            onClick={() => {
              setAddMode("attendee");
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-650 hover:bg-indigo-700 text-white transition-all shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>Add / Assign Speaker</span>
          </button>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────── */}
      {/* STAT METRICS CARDS */}
      {/* ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            Total Experts
            <Users size={14} className="text-slate-400" />
          </span>
          <div className="text-2xl font-black text-slate-800 mt-2">
            {metrics.totalSpeakers}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1">
            Speakers &amp; moderators
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider flex items-center justify-between">
            Keynotes
            <Award size={14} className="text-purple-500" />
          </span>
          <div className="text-2xl font-black text-purple-700 mt-2">
            {metrics.keynotes}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1">
            Headline speakers
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center justify-between">
            Moderators
            <Mic2 size={14} className="text-amber-500" />
          </span>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {metrics.moderators}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1">
            Session chairs &amp; hosts
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center justify-between">
            Agenda Coverage
            <Calendar size={14} className="text-indigo-500" />
          </span>
          <div className="text-2xl font-black text-indigo-700 mt-2">
            {metrics.sessionsWithSpeakers} <span className="text-xs font-semibold text-slate-400">/ {metrics.totalSessions}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1">
            Sessions with assigned experts
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            Unassigned
            <UserX size={14} className="text-slate-400" />
          </span>
          <div className="text-2xl font-black text-slate-800 mt-2">
            {metrics.unassigned}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1">
            General directory speakers
          </span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────── */}
      {/* SEARCH & FILTERS CONTROLS BAR */}
      {/* ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search Bar */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search speaker by name, company, job title, topic, or session..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Right Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <div className="w-36">
            <SearchableSelect
              value={roleFilter}
              onChange={(val) => setRoleFilter(val)}
              options={[
                { value: "all", label: "All Roles" },
                { value: "Keynote", label: "Keynotes" },
                { value: "Speaker", label: "Speakers" },
                { value: "Moderator", label: "Moderators" },
                { value: "Panelist", label: "Panelists" },
                { value: "Workshop", label: "Workshop Hosts" },
              ]}
              placeholder="Role"
            />
          </div>

          {/* Session Filter */}
          <div className="w-48">
            <SearchableSelect
              value={sessionFilter}
              onChange={(val) => setSessionFilter(val)}
              options={[
                { value: "all", label: "All Sessions" },
                { value: "unassigned", label: "⚠️ Unassigned Only" },
                ...sessions.map((s) => ({
                  value: String(s.id),
                  label: `${s.title || "Untitled"} (${s.startTime || "TBD"})`,
                })),
              ]}
              placeholder="Filter by Session"
              searchPlaceholder="Search session..."
            />
          </div>

          {/* Source Filter */}
          <div className="w-36">
            <SearchableSelect
              value={sourceFilter}
              onChange={(val) => setSourceFilter(val)}
              options={[
                { value: "all", label: "All Sources" },
                { value: "attendee", label: "From Attendees" },
                { value: "custom", label: "External / VIP" },
              ]}
              placeholder="Source"
            />
          </div>

          {/* Sort By */}
          <div className="w-36">
            <SearchableSelect
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={[
                { value: "name_asc", label: "Name (A → Z)" },
                { value: "name_desc", label: "Name (Z → A)" },
                { value: "sessions_desc", label: "Most Sessions" },
                { value: "sessions_asc", label: "Least Sessions" },
                { value: "role", label: "By Role" },
              ]}
              placeholder="Sort By"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-white text-indigo-650 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "list" ? "bg-white text-indigo-650 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
              title="List View"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────── */}
      {/* SPEAKERS DIRECTORY LIST / GRID VIEW */}
      {/* ───────────────────────────────────────────────────── */}
      {filteredSpeakers.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Mic size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No speakers found</h3>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              {searchTerm || roleFilter !== "all" || sessionFilter !== "all"
                ? "No speakers match the current filter criteria. Try clearing search filters."
                : "No experts or moderators have been assigned yet. You can promote registered attendees to speakers or add new keynote guests."}
            </p>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            {(searchTerm || roleFilter !== "all" || sessionFilter !== "all" || sourceFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("all");
                  setSessionFilter("all");
                  setSourceFilter("all");
                }}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => {
                setAddMode("attendee");
                setShowAddModal(true);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus size={13} />
              <span>Assign from Attendees</span>
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredSpeakers.map((speaker, idx) => (
            <div
              key={idx}
              className="group bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Top Row: Role badge & More Menu */}
              <div className="flex items-center justify-between w-full mb-3">
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${getRoleBadge(speaker.role)}`}>
                  {speaker.role}
                </span>

                <div className="flex items-center gap-1">
                  {speaker.isAttendee && (
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
                      title="Linked to registered attendee profile"
                    >
                      <Check size={10} />
                      <span>Attendee</span>
                    </span>
                  )}

                  <button
                    onClick={() => setSpeakerToDelete(speaker)}
                    className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove speaker"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Center: Avatar & Speaker Details */}
              <div className="flex flex-col items-center text-center gap-2 w-full my-1">
                {/* Clickable Avatar to Quick-Change Photo */}
                <label
                  className="relative cursor-pointer group/avatar block"
                  title="Click to upload / change speaker photo"
                >
                  <img
                    src={speaker.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(speaker.name)}&background=4f46e5&color=fff`}
                    className="w-20 h-20 rounded-2xl object-cover shadow-2xs border-2 border-slate-100 group-hover/avatar:border-indigo-400 transition-colors"
                    alt={speaker.name}
                  />
                  <span className="absolute inset-0 bg-black/45 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                    <Camera size={18} />
                    <span className="text-[9px] font-bold mt-0.5">Change</span>
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleQuickPhotoChange(speaker, e)}
                    className="hidden"
                  />
                </label>

                <div className="w-full mt-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate" title={speaker.name}>
                    {speaker.name}
                  </h3>

                  {(speaker.jobTitle || speaker.company) && (
                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5" title={`${speaker.jobTitle} ${speaker.company ? `@ ${speaker.company}` : ''}`}>
                      {speaker.jobTitle}
                      {speaker.jobTitle && speaker.company ? " @ " : ""}
                      <span className="font-semibold text-slate-700">{speaker.company}</span>
                    </p>
                  )}
                </div>

                {/* Talk Topic Preview (if any) */}
                {speaker.topic && (
                  <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2 text-left mt-1">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                      <BookOpen size={10} /> Topic:
                    </span>
                    <p className="text-[11px] font-semibold text-indigo-900 truncate mt-0.5" title={speaker.topic}>
                      &ldquo;{speaker.topic}&rdquo;
                    </p>
                  </div>
                )}

                {/* Social Links Row */}
                <div className="flex items-center justify-center gap-2 mt-1">
                  {speaker.email && (
                    <a
                      href={`mailto:${speaker.email}`}
                      className="p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 rounded-lg transition-colors"
                      title={speaker.email}
                    >
                      <Mail size={13} />
                    </a>
                  )}
                  {speaker.socials?.linkedin && (
                    <a
                      href={speaker.socials.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="LinkedIn Profile"
                    >
                      <LinkedinIcon size={13} />
                    </a>
                  )}
                  {speaker.socials?.twitter && (
                    <a
                      href={speaker.socials.twitter}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Twitter / X"
                    >
                      <TwitterIcon size={13} />
                    </a>
                  )}
                  {speaker.socials?.website && (
                    <a
                      href={speaker.socials.website}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Website / Portfolio"
                    >
                      <Globe size={13} />
                    </a>
                  )}
                </div>
              </div>

              {/* Assigned Sessions Preview */}
              <div className="border-t border-slate-100 pt-3 mt-3 w-full flex flex-col gap-1.5 text-left">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Assigned Sessions</span>
                  <span className="font-extrabold text-slate-600">{speaker.assignedSessions.length}</span>
                </div>

                {speaker.assignedSessions.length === 0 ? (
                  <div className="flex items-center justify-between bg-amber-50/60 border border-amber-200/70 rounded-xl p-2 text-amber-800">
                    <span className="text-[10px] font-semibold flex items-center gap-1">
                      <AlertCircle size={12} className="text-amber-600 shrink-0" />
                      Unassigned
                    </span>
                    <button
                      onClick={() => setAssigningSpeaker(speaker)}
                      className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                    >
                      + Assign
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-0.5">
                    {speaker.assignedSessions.map((s, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[11px]"
                      >
                        <span className="font-semibold text-slate-700 truncate max-w-[170px]" title={s.title}>
                          {s.title}
                        </span>
                        {s.startTime && (
                          <span className="text-[9px] font-bold text-slate-400 shrink-0 ml-1">
                            {s.startTime}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setAssigningSpeaker(speaker)}
                  className="px-2 py-1.5 text-[11px] font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Calendar size={12} />
                  <span>Sessions</span>
                </button>

                <button
                  onClick={() => setEditingSpeaker({ ...speaker })}
                  className="px-2 py-1.5 text-[11px] font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Pencil size={12} />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Expert / Speaker</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Job Title &amp; Company</th>
                  <th className="py-3.5 px-4">Assigned Agenda Sessions</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSpeakers.map((spk, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Name & Photo */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={spk.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(spk.name)}&background=4f46e5&color=fff`}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          alt={spk.name}
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{spk.name}</span>
                          {spk.topic && (
                            <span className="text-[10px] text-indigo-650 font-medium block truncate max-w-[180px]">
                              Topic: {spk.topic}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${getRoleBadge(spk.role)}`}>
                        {spk.role}
                      </span>
                    </td>

                    {/* Title & Company */}
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-semibold text-slate-800 block truncate max-w-[200px]">
                          {spk.jobTitle || "—"}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                          {spk.company || ""}
                        </span>
                      </div>
                    </td>

                    {/* Sessions */}
                    <td className="py-3 px-4">
                      {spk.assignedSessions.length === 0 ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Unassigned
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {spk.assignedSessions.slice(0, 2).map((s, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md truncate max-w-[130px]"
                              title={s.title}
                            >
                              {s.title}
                            </span>
                          ))}
                          {spk.assignedSessions.length > 2 && (
                            <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                              +{spk.assignedSessions.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {spk.email ? (
                          <a
                            href={`mailto:${spk.email}`}
                            className="p-1 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-slate-100"
                            title={spk.email}
                          >
                            <Mail size={13} />
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                        {spk.socials?.linkedin && (
                          <a
                            href={spk.socials.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-md"
                            title="LinkedIn"
                          >
                            <LinkedinIcon size={13} />
                          </a>
                        )}
                        {spk.socials?.website && (
                          <a
                            href={spk.socials.website}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md"
                            title="Website"
                          >
                            <Globe size={13} />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Source */}
                    <td className="py-3 px-4">
                      {spk.isAttendee ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 w-fit">
                          <Check size={10} /> Attendee
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md w-fit">
                          External
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setAssigningSpeaker(spk)}
                          className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Sessions
                        </button>
                        <button
                          onClick={() => setEditingSpeaker({ ...spk })}
                          className="px-2.5 py-1 text-indigo-650 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setSpeakerToDelete(spk)}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded-lg cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* MODAL 1: ADD / ASSIGN SPEAKER (ATTENDEE OR NEW VIP) */}
      {/* ───────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full p-6 my-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add / Assign Speaker</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Promote a registered attendee to a speaker, or add an external keynote guest.
                </p>
              </div>
              <button
                onClick={resetAddForm}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setAddMode("attendee")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  addMode === "attendee"
                    ? "bg-white text-indigo-650 shadow-2xs font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <UserCheck size={14} />
                <span>Assign from Registered Attendees</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddMode("custom");
                  setSelectedAttendeeId("");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  addMode === "custom"
                    ? "bg-white text-indigo-650 shadow-2xs font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <UserPlus size={14} />
                <span>Create New Speaker (VIP / Guest)</span>
              </button>
            </div>

            <form onSubmit={handleAddSpeakerSubmit} className="flex flex-col gap-4">
              {/* If Mode === Attendee: Searchable Select */}
              {addMode === "attendee" && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Registered Attendee *
                  </label>
                  <SearchableSelect
                    value={selectedAttendeeId}
                    onChange={handleAttendeeSelect}
                    options={attendees.map((a) => ({
                      value: String(a.id),
                      label: `${a.name || "Unnamed"} (${a.email || "No email"}) • ${a.ticketType || a.ticket_type || "Pass"}`,
                    }))}
                    placeholder="-- Search & Choose Attendee --"
                    searchPlaceholder="Search attendee by name, email, or ticket..."
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Selecting an attendee will auto-populate their profile and grant them Speaker status.
                  </p>
                </div>
              )}

              {/* Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Speaker Full Name *
                  </label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Dr. Sarah Jenkins"
                    required
                    className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Role *
                  </label>
                  <SearchableSelect
                    value={addRole}
                    onChange={(val) => setAddRole(val)}
                    options={SPEAKER_ROLES}
                    placeholder="Select Role"
                    required
                  />
                </div>
              </div>

              {/* Job Title & Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Job Title / Headline
                  </label>
                  <input
                    type="text"
                    value={addJobTitle}
                    onChange={(e) => setAddJobTitle(e.target.value)}
                    placeholder="e.g. Head of AI Research"
                    className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Organization / Company
                  </label>
                  <input
                    type="text"
                    value={addCompany}
                    onChange={(e) => setAddCompany(e.target.value)}
                    placeholder="e.g. Acme Labs"
                    className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="speaker@example.com"
                    className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Presentation Topic / Keynote Title */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Presentation / Keynote Topic
                </label>
                <input
                  type="text"
                  value={addTopic}
                  onChange={(e) => setAddTopic(e.target.value)}
                  placeholder="e.g. The Future of Sustainable Tech in 2027"
                  className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Assign to Agenda Sessions */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Assign to Agenda Sessions
                </label>
                <div className="border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto flex flex-col gap-2 bg-slate-50/50">
                  {sessions.length === 0 ? (
                    <span className="text-xs text-slate-400 py-1">
                      No sessions created yet. You can add sessions in the Calendar / Timeline view.
                    </span>
                  ) : (
                    sessions.map((sess) => {
                      const isChecked = addSessionIds.includes(String(sess.id));
                      return (
                        <label
                          key={sess.id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-indigo-50 border-indigo-200 text-indigo-900"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAddSessionIds([...addSessionIds, String(sess.id)]);
                                } else {
                                  setAddSessionIds(addSessionIds.filter((id) => id !== String(sess.id)));
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                            />
                            <span className="truncate">{sess.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                            {sess.date} {sess.startTime ? `• ${sess.startTime}` : ""}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Photo Upload & Preview */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Speaker Photo</span>
                  <span className="font-normal lowercase text-[10px] text-slate-400">PNG, JPG up to 5MB</span>
                </label>
                <div className="flex items-center gap-3">
                  {addPhoto ? (
                    <img
                      src={addPhoto}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      alt=""
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                      <User size={20} />
                    </div>
                  )}

                  <label className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer flex items-center justify-center gap-2 transition-colors">
                    {isUploadingPhoto ? (
                      <Loader2 size={14} className="animate-spin text-indigo-600" />
                    ) : (
                      <Camera size={14} />
                    )}
                    <span>{isUploadingPhoto ? "Uploading..." : addPhoto ? "Change Photo" : "Upload High-Res Photo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploadingPhoto(true);
                        const url = await uploadImageFile(file);
                        if (url) setAddPhoto(url);
                        setIsUploadingPhoto(false);
                      }}
                      className="hidden"
                    />
                  </label>

                  {addPhoto && (
                    <button
                      type="button"
                      onClick={() => setAddPhoto("")}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 rounded-xl cursor-pointer"
                      title="Clear photo"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Social Links (Collapsible/Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <LinkedinIcon size={11} className="text-blue-600" /> LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={addLinkedin}
                    onChange={(e) => setAddLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <TwitterIcon size={11} className="text-slate-900" /> Twitter / X
                  </label>
                  <input
                    type="text"
                    value={addTwitter}
                    onChange={(e) => setAddTwitter(e.target.value)}
                    placeholder="https://x.com/username"
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Globe size={11} className="text-emerald-600" /> Website
                  </label>
                  <input
                    type="url"
                    value={addWebsite}
                    onChange={(e) => setAddWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Bio / Description */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Speaker Bio / Introduction
                </label>
                <textarea
                  rows={3}
                  value={addBio}
                  onChange={(e) => setAddBio(e.target.value)}
                  placeholder="Short bio, career highlights, or background..."
                  className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Automatic Speaker Pass Checkbox for Custom mode */}
              {addMode === "custom" && (
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addCreatePass}
                    onChange={(e) => setAddCreatePass(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                  />
                  <span>Also generate a verified Speaker Pass in the Attendees list with badge code</span>
                </label>
              )}

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetAddForm}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  Confirm &amp; Add Speaker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* MODAL 2: EDIT SPEAKER PROFILE & DETAILS */}
      {/* ───────────────────────────────────────────────────── */}
      {editingSpeaker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full p-6 my-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Edit Speaker Profile: {editingSpeaker.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update speaker bio, presentation details, photo, and assigned agenda sessions.
                </p>
              </div>
              <button
                onClick={() => setEditingSpeaker(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSpeakerEdit} className="flex flex-col gap-4">
              {/* Photo & Basic Info */}
              <div className="flex items-start gap-4">
                {/* Photo uploader */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <label className="relative cursor-pointer group block" title="Change Photo">
                    <img
                      src={editingSpeaker.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(editingSpeaker.name)}&background=4f46e5&color=fff`}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 group-hover:border-indigo-500 transition-colors"
                      alt=""
                    />
                    <span className="absolute inset-0 bg-black/45 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={18} />
                      <span className="text-[9px] font-bold mt-0.5">Upload</span>
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploadingPhoto(true);
                        const url = await uploadImageFile(file);
                        if (url) setEditingSpeaker({ ...editingSpeaker, image: url });
                        setIsUploadingPhoto(false);
                      }}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">Click to change</span>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={editingSpeaker.name}
                      onChange={(e) => setEditingSpeaker({ ...editingSpeaker, name: e.target.value })}
                      required
                      className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Role *
                    </label>
                    <SearchableSelect
                      value={editingSpeaker.role}
                      onChange={(val) => setEditingSpeaker({ ...editingSpeaker, role: val })}
                      options={SPEAKER_ROLES}
                      placeholder="Select Role"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Job Title / Headline
                    </label>
                    <input
                      type="text"
                      value={editingSpeaker.jobTitle || ""}
                      onChange={(e) => setEditingSpeaker({ ...editingSpeaker, jobTitle: e.target.value })}
                      placeholder="e.g. VP of Innovation"
                      className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Organization / Company
                    </label>
                    <input
                      type="text"
                      value={editingSpeaker.company || ""}
                      onChange={(e) => setEditingSpeaker({ ...editingSpeaker, company: e.target.value })}
                      placeholder="e.g. OpenAI / Stanford"
                      className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Email, Phone & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editingSpeaker.email || ""}
                    onChange={(e) => setEditingSpeaker({ ...editingSpeaker, email: e.target.value })}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editingSpeaker.phone || ""}
                    onChange={(e) => setEditingSpeaker({ ...editingSpeaker, phone: e.target.value })}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </label>
                  <SearchableSelect
                    value={editingSpeaker.status || "Confirmed"}
                    onChange={(val) => setEditingSpeaker({ ...editingSpeaker, status: val })}
                    options={[
                      { value: "Confirmed", label: "Confirmed" },
                      { value: "Pending", label: "Pending Confirmation" },
                      { value: "Declined", label: "Declined" },
                    ]}
                  />
                </div>
              </div>

              {/* Presentation Topic & Slides URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Talk / Presentation Title
                  </label>
                  <input
                    type="text"
                    value={editingSpeaker.topic || ""}
                    onChange={(e) => setEditingSpeaker({ ...editingSpeaker, topic: e.target.value })}
                    placeholder="e.g. AI-driven Automation"
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Presentation Slides URL / Link
                  </label>
                  <input
                    type="url"
                    value={editingSpeaker.slidesUrl || ""}
                    onChange={(e) => setEditingSpeaker({ ...editingSpeaker, slidesUrl: e.target.value })}
                    placeholder="https://slideshare.net/..."
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <LinkedinIcon size={11} className="text-blue-600" /> LinkedIn
                  </label>
                  <input
                    type="url"
                    value={editingSpeaker.socials?.linkedin || ""}
                    onChange={(e) =>
                      setEditingSpeaker({
                        ...editingSpeaker,
                        socials: { ...editingSpeaker.socials, linkedin: e.target.value },
                      })
                    }
                    placeholder="LinkedIn URL"
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <TwitterIcon size={11} className="text-slate-900" /> Twitter / X
                  </label>
                  <input
                    type="text"
                    value={editingSpeaker.socials?.twitter || ""}
                    onChange={(e) =>
                      setEditingSpeaker({
                        ...editingSpeaker,
                        socials: { ...editingSpeaker.socials, twitter: e.target.value },
                      })
                    }
                    placeholder="Twitter URL"
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Globe size={11} className="text-emerald-600" /> Website
                  </label>
                  <input
                    type="url"
                    value={editingSpeaker.socials?.website || ""}
                    onChange={(e) =>
                      setEditingSpeaker({
                        ...editingSpeaker,
                        socials: { ...editingSpeaker.socials, website: e.target.value },
                      })
                    }
                    placeholder="Personal website"
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Biography
                </label>
                <textarea
                  rows={3}
                  value={editingSpeaker.bio || ""}
                  onChange={(e) => setEditingSpeaker({ ...editingSpeaker, bio: e.target.value })}
                  placeholder="Speaker bio..."
                  className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                />
              </div>

              {/* Interactive Agenda Sessions Checklist */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Assigned Sessions (Check to assign/unassign)
                </label>
                <div className="border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto flex flex-col gap-2 bg-slate-50/50">
                  {sessions.length === 0 ? (
                    <span className="text-xs text-slate-400 py-1">No sessions scheduled in agenda.</span>
                  ) : (
                    sessions.map((sess) => {
                      const isAssigned = (editingSpeaker.assignedSessions || []).some(
                        (s) => String(s.id) === String(sess.id)
                      );
                      const currentAssignedObj = (editingSpeaker.assignedSessions || []).find(
                        (s) => String(s.id) === String(sess.id)
                      );

                      return (
                        <div
                          key={sess.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                            isAssigned
                              ? "bg-indigo-50 border-indigo-200 text-indigo-950"
                              : "bg-white border-slate-200 text-slate-700"
                          }`}
                        >
                          <label className="flex items-center gap-2.5 truncate cursor-pointer flex-1 mr-2">
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditingSpeaker({
                                    ...editingSpeaker,
                                    assignedSessions: [
                                      ...(editingSpeaker.assignedSessions || []),
                                      {
                                        id: sess.id,
                                        title: sess.title,
                                        date: sess.date,
                                        startTime: sess.startTime,
                                        endTime: sess.endTime,
                                        room: sess.room || "",
                                        sessionRole: editingSpeaker.role.toLowerCase().includes("moderator")
                                          ? "moderator"
                                          : "speaker",
                                      },
                                    ],
                                  });
                                } else {
                                  setEditingSpeaker({
                                    ...editingSpeaker,
                                    assignedSessions: (editingSpeaker.assignedSessions || []).filter(
                                      (s) => String(s.id) !== String(sess.id)
                                    ),
                                  });
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                            />
                            <div className="truncate">
                              <span className="font-bold block truncate">{sess.title}</span>
                              <span className="text-[10px] text-slate-400 block">
                                {sess.date} {sess.startTime ? `• ${sess.startTime} - ${sess.endTime || ""}` : ""}
                              </span>
                            </div>
                          </label>

                          {/* Role in this session */}
                          {isAssigned && (
                            <div className="w-32 shrink-0">
                              <SearchableSelect
                                value={currentAssignedObj?.sessionRole || "speaker"}
                                onChange={(val) => {
                                  const updatedAssigned = (editingSpeaker.assignedSessions || []).map((s) =>
                                    String(s.id) === String(sess.id) ? { ...s, sessionRole: val } : s
                                  );
                                  setEditingSpeaker({
                                    ...editingSpeaker,
                                    assignedSessions: updatedAssigned,
                                  });
                                }}
                                options={[
                                  { value: "speaker", label: "Speaker" },
                                  { value: "moderator", label: "Moderator" },
                                ]}
                                placeholder="Role"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSpeaker(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* MODAL 3: QUICK ASSIGN TO SESSION */}
      {/* ───────────────────────────────────────────────────── */}
      {assigningSpeaker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Assign to Session: {assigningSpeaker.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a session from the agenda to attach this expert to.
                </p>
              </div>
              <button
                onClick={() => setAssigningSpeaker(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleQuickAssignSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Agenda Session *
                </label>
                <SearchableSelect
                  value={quickSessionId}
                  onChange={(val) => setQuickSessionId(val)}
                  options={sessions.map((s) => ({
                    value: String(s.id),
                    label: `${s.title} (${s.date || ""} ${s.startTime || ""})`,
                  }))}
                  placeholder="-- Choose Session --"
                  searchPlaceholder="Search session..."
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Session Role
                </label>
                <SearchableSelect
                  value={quickRole}
                  onChange={(val) => setQuickRole(val)}
                  options={[
                    { value: "speaker", label: "Speaker" },
                    { value: "moderator", label: "Moderator" },
                  ]}
                  placeholder="Role"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningSpeaker(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!quickSessionId}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 rounded-xl cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* MODAL 4: CONFIRM DELETE / REMOVE SPEAKER */}
      {/* ───────────────────────────────────────────────────── */}
      {speakerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center font-bold">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Remove {speakerToDelete.name}?
                </h3>
                <p className="text-xs text-slate-500">
                  Choose how you want to remove this speaker from the event.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleConfirmDelete("all_sessions")}
                className="w-full text-left p-3 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-xs cursor-pointer group"
              >
                <span className="font-bold text-slate-800 group-hover:text-indigo-700 block">
                  Remove from all sessions
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Removes them from agenda session speaker lists, but keeps attendee record intact.
                </span>
              </button>

              {speakerToDelete.isAttendee && (
                <button
                  type="button"
                  onClick={() => handleConfirmDelete("demote")}
                  className="w-full text-left p-3 rounded-2xl border border-rose-200 hover:border-rose-300 hover:bg-rose-50/50 transition-all text-xs cursor-pointer group"
                >
                  <span className="font-bold text-rose-700 block">
                    Remove completely &amp; demote to Standard Attendee
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Unchecks speaker status on attendee record and removes from all session timelines.
                  </span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSpeakerToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
