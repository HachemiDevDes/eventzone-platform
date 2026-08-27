"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Mail, Send, Sparkles, Users, CheckCircle2, XCircle, Clock,
  Search, Trash2, Edit3, Eye, RotateCcw, FileText, Ticket, QrCode as QrIcon,
  Building2, Calendar, MapPin, ArrowRight, ExternalLink, Download,
  Check, X, ChevronDown, ChevronRight, Smartphone, Monitor, Sun, Moon,
  FileSpreadsheet, Layers, Activity, BarChart3, RefreshCw, Sliders, Tag,
  Inbox, Filter, Copy, Plus, Bell, Info, ShieldCheck, Share2, Mic,
  UserCheck, AlertCircle, ArrowUpRight, CheckSquare, Heart, Store
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import SearchableSelect from "./SearchableSelect";
import {
  fetchCommunicationsWithStats,
  deleteCommunication,
  fetchCommunicationRecipientLogs,
  saveCustomEmailTemplate,
  fetchCustomEmailTemplates,
  deleteCustomEmailTemplate
} from "../lib/db";
import { useLanguage } from "../lib/i18n";

// Preset 10+ Pre-Built Templates
const PRESET_TEMPLATES = [
  {
    id: "badge_pass",
    title: "Official Digital Badge & Fast-Track QR Pass",
    category: "attendees",
    categoryLabel: "Attendee Pass",
    icon: Ticket,
    description: "Sends confirmed delegates their official digital pass with fast-track check-in QR code.",
    subject: "Your Official Badge Pass for {{eventTitle}}",
    preheader: "Your registration is confirmed! Fast-track check-in QR code and pass details inside.",
    body: `Hello {{name}},

We are delighted to confirm your registration for **{{eventTitle}}**. Your official pass has been generated.

📅 **Dates:** {{eventDate}}
📍 **Venue:** {{eventLocation}}
🎟️ **Access Tier:** {{ticketTier}}
🔖 **Pass Code:** {{badgeCode}}

Please present your fast-track QR code below upon arrival at the registration counters for instant badge printing and swift ingress.

We look forward to welcoming you!`,
    includeQr: true,
    buttonConfig: {
      includeTicketButton: true,
      ticketButtonText: "View My Digital Pass",
      includeFormButton: false,
      formButtonText: "",
      includeCustomButton: false,
      customButtonText: "",
      customButtonUrl: ""
    }
  },
  {
    id: "registration_welcome",
    title: "Registration Welcome & Ingress Overview",
    category: "attendees",
    categoryLabel: "Onboarding",
    icon: Sparkles,
    subject: "Welcome to {{eventTitle}}! Important Arrival Details",
    preheader: "Everything you need to know before stepping into the summit hall.",
    description: "Warm welcome message introducing key stages, networking sessions, and arrival guidance.",
    body: `Dear {{name}},

Thank you for registering for **{{eventTitle}}**! We are thrilled to have you join our community of industry leaders and innovators.

**Key Highlights to Note:**
• Keynote speeches and expert panel discussions across all stages.
• Interactive 2D floor plans available in your attendee portal.
• Dedicated B2B networking zones and exhibition demo pods.

Please ensure you arrive 15 minutes prior to the opening ceremony to collect your conference lanyard and badge.

Warm regards,
{{organizerName}}`,
    includeQr: true,
    buttonConfig: {
      includeTicketButton: true,
      ticketButtonText: "Access Attendee Portal",
      includeFormButton: false,
      formButtonText: "",
      includeCustomButton: false,
      customButtonText: "",
      customButtonUrl: ""
    }
  },
  {
    id: "event_countdown",
    title: "Event Countdown & Arrival Reminder",
    category: "logistics",
    categoryLabel: "Logistics & Reminder",
    icon: Clock,
    subject: "Countdown to {{eventTitle}}: 3 Days Until We Open!",
    preheader: "Prepare your arrival: venue directions, check-in tips, and agenda recap.",
    description: "High-urgency countdown reminder with venue address and check-in preparation checklist.",
    body: `Hello {{name}},

The countdown is on! In just a few days, **{{eventTitle}}** will officially open its doors.

📍 **Venue Location:** {{eventLocation}}
📅 **Opening Date:** {{eventDate}}

**Arrival Checklist:**
• Have your mobile QR pass or printed badge ready at the entrance.
• Bring a valid photo ID matching your registered name ({{name}}).
• Download the event floor plan map to locate keynote stages and exhibition booths.

If you have any last-minute questions or accessibility requirements, please feel free to reach out.

See you very soon!`,
    includeQr: true,
    buttonConfig: {
      includeTicketButton: true,
      ticketButtonText: "Get Fast-Track Pass",
      includeFormButton: false,
      formButtonText: "",
      includeCustomButton: true,
      customButtonText: "View Interactive Floor Plan",
      customButtonUrl: ""
    }
  },
  {
    id: "schedule_change",
    title: "Urgent Schedule / Room / Speaker Update",
    category: "logistics",
    categoryLabel: "Urgent Alert",
    icon: Bell,
    subject: "Important Program Update: {{eventTitle}} Schedule Alert",
    preheader: "Please take note of upcoming keynote room allocations and timeline adjustments.",
    description: "Alert attendees of urgent program changes, new keynote speakers, or track room assignments.",
    body: `Attention {{name}},

We would like to inform you of an important schedule update regarding the conference agenda for **{{eventTitle}}**.

**Key Adjustments:**
• Keynote sessions have been updated with latest stage allocations.
• Additional panel breakouts have been added to the afternoon track.
• Please review the updated schedule on the event portal to plan your sessions.

We appreciate your flexibility and look forward to an exceptional experience.

Best regards,
{{organizerName}}`,
    includeQr: false,
    buttonConfig: {
      includeTicketButton: false,
      ticketButtonText: "",
      includeFormButton: false,
      formButtonText: "",
      includeCustomButton: true,
      customButtonText: "View Live Updated Agenda",
      customButtonUrl: ""
    }
  },
  {
    id: "feedback_survey",
    title: "Post-Event Thank You & Feedback Survey",
    category: "surveys",
    categoryLabel: "Surveys & Feedback",
    icon: FileSpreadsheet,
    subject: "Thank you for attending {{eventTitle}} — Share your feedback!",
    preheader: "Your feedback helps us shape future editions. Take our 2-minute survey.",
    description: "Thank participants for their presence and link directly to a feedback form.",
    body: `Dear {{name}},

Thank you for participating in **{{eventTitle}}**! Your presence, insights, and engagement made this edition truly memorable.

To help us improve future conferences and summits, we would love to hear your thoughts. Please take 2 minutes to complete our quick post-event questionnaire.

Your insights are invaluable to our continuous improvement.

With gratitude,
{{organizerName}}`,
    includeQr: false,
    buttonConfig: {
      includeFormButton: true,
      formButtonText: "Complete 2-Minute Feedback Form",
      includeTicketButton: false,
      ticketButtonText: "",
      includeCustomButton: false,
      customButtonText: "",
      customButtonUrl: ""
    }
  },
  {
    id: "exhibitor_briefing",
    title: "Exhibitor & Sponsor Setup Briefing",
    category: "partners",
    categoryLabel: "Exhibitors & Sponsors",
    icon: Store,
    subject: "Exhibitor & Sponsor Logistics Packet: {{eventTitle}}",
    preheader: "Crucial booth setup hours, electrical allocations, and loading bay guidelines.",
    description: "Briefing pack for booth holders and sponsor representatives with setup schedules.",
    body: `Dear {{name}} team,

We are excited to welcome your organization as an official partner of **{{eventTitle}}**.

**Exhibition Hall Logistics:**
• **Setup Window:** 08:00 AM - 18:00 PM on the day preceding the summit.
• **Booth Badges:** Please register your booth staff passes in advance.
• **Loading Bay Access:** Gate 3 (Commercial Vehicle Unloading Zone).
• **Power & Internet:** High-speed Wi-Fi and power hookups will be provisioned at your allocated booth.

Please review your floor plan location and ensure your onsite team has access to this information.

Best regards,
Exhibition Operations Team`,
    includeQr: false,
    buttonConfig: {
      includeTicketButton: false,
      ticketButtonText: "",
      includeFormButton: false,
      formButtonText: "",
      includeCustomButton: true,
      customButtonText: "View Exhibitor Floor Plan",
      customButtonUrl: ""
    }
  },
  {
    id: "speaker_logistics",
    title: "Speaker & Keynote Presenter Briefing",
    category: "partners",
    categoryLabel: "Speakers & Keynotes",
    icon: Mic,
    subject: "Speaker Briefing & AV Technical Guide: {{eventTitle}}",
    preheader: "AV check times, presentation slide uploads, and Green Room access details.",
    description: "Technical instructions for speakers regarding slide formats, microphones, and backstage timings.",
    body: `Dear {{name}},

We are honored to have you as a distinguished speaker at **{{eventTitle}}**.

**Speaker Guidelines & Checklist:**
• **AV Check:** Please arrive at the Speaker Green Room at least 30 minutes before your session.
• **Presentation Aspect Ratio:** 16:9 widescreen format (PDF or PowerPoint).
• **Microphone & Clicker:** Provisioned at the stage podium.
• **VIP Access:** Your speaker pass grants all-access entry to executive networking suites.

If you have updated presentation slides, please upload them or reply directly to this message.

Warm regards,
Program Committee`,
    includeQr: true,
    buttonConfig: {
      includeTicketButton: true,
      ticketButtonText: "View Speaker Access Pass",
      includeFormButton: false,
      formButtonText: "",
      includeCustomButton: true,
      customButtonText: "Upload Presentation Slides",
      customButtonUrl: ""
    }
  },
  {
    id: "b2b_networking",
    title: "VIP Networking & B2B Matchmaking Invitation",
    category: "attendees",
    categoryLabel: "Networking",
    icon: Users,
    subject: "Exclusive Networking & B2B Lounge Access: {{eventTitle}}",
    preheader: "Connect with delegates, schedule 1-on-1 meetings, and explore the directory.",
    description: "Invite high-tier attendees to explore B2B matchmaking lounges and book meetings.",
    body: `Hello {{name}},

As a registered participant of **{{eventTitle}}**, you have exclusive access to our B2B Networking Lounge and delegate matchmaking portal.

**What You Can Do:**
• Explore the verified attendee and company directory.
• Schedule 1-on-1 business meetings in reserved executive suites.
• Exchange digital contact cards instantly using the event portal.

Take advantage of this opportunity to expand your network and foster impactful partnerships.

Best regards,
{{organizerName}}`,
    includeQr: false,
    buttonConfig: {
      includeTicketButton: false,
      ticketButtonText: "",
      includeFormButton: false,
      formButtonText: "",
      includeCustomButton: true,
      customButtonText: "Open B2B Networking Hub",
      customButtonUrl: ""
    }
  },
  {
    id: "resource_materials",
    title: "Event Presentations & Slide Decks Download",
    category: "surveys",
    categoryLabel: "Resources & Media",
    icon: Download,
    subject: "Keynote Slides & Presentation Decks: {{eventTitle}}",
    preheader: "Download keynote slides, official photo galleries, and session recordings.",
    description: "Distribute downloadable presentation slides, session replays, and photo galleries.",
    body: `Hello {{name}},

Thank you once again for attending **{{eventTitle}}**.

We have compiled all approved keynote presentation slides, session recordings, and the official event photo gallery into our Resource Vault.

You can browse, download, and review the materials at your convenience.

We hope these resources empower your ongoing work and initiatives.

Sincerely,
{{organizerName}}`,
    includeQr: false,
    buttonConfig: {
      includeTicketButton: false,
      ticketButtonText: "",
      includeFormButton: false,
      formButtonText: "",
      includeCustomButton: true,
      customButtonText: "Download Keynote Slide Decks",
      customButtonUrl: ""
    }
  },
  {
    id: "custom_blank",
    title: "Blank Custom Announcement",
    category: "custom",
    categoryLabel: "Custom Slate",
    icon: Edit3,
    subject: "Announcement from {{organizerName}} regarding {{eventTitle}}",
    preheader: "Official communication regarding {{eventTitle}}.",
    description: "Start with a clean canvas to write your own personalized broadcast announcement.",
    body: `Hello {{name}},

Write your custom announcement here...

Best regards,
{{organizerName}}`,
    includeQr: false,
    buttonConfig: {
      includeFormButton: false,
      formButtonText: "",
      includeTicketButton: false,
      ticketButtonText: "",
      includeCustomButton: false,
      customButtonText: "",
      customButtonUrl: ""
    }
  }
];

// Automated System Event Triggers Configuration
export const AUTOMATED_TRIGGERS_CONFIG = [
  {
    id: "trigger_ticket_pass",
    trigger_id: "trigger_ticket_pass",
    title: "1. Instant Ticket Registration Pass & PDF Badge",
    name: "Ticket Registration & Badge Pass",
    trigger: "Triggered instantly when a visitor purchases a ticket or organizer approves an attendee application.",
    badge: "Active • Auto-Send",
    color: "emerald",
    features: ["Scannable mobile check-in QR pass", "Official A6 badge PDF attachment", "Venue arrival checklist", "Custom dynamic form intake link"],
    subject: "Your Official Badge Pass for {{eventTitle}}",
    preheader: "Your digital ticket, fast-track QR pass, and check-in details for {{eventTitle}}.",
    body: `Hello {{name}},

We are delighted to confirm your registration for **{{eventTitle}}**. Your official digital pass and check-in QR code are ready below.

Please save this email or add the pass to your mobile device for rapid ingress at our fast-track check-in kiosks.

**Venue Location:** {{eventLocation}}
**Event Dates:** {{eventDate}}

We look forward to welcoming you!

Best regards,
{{organizerName}}`,
    includeQr: true,
    buttonConfig: {
      includeTicketButton: true,
      ticketButtonText: "View My Event Badge",
      includeFormButton: false,
      formButtonText: "Fill Out Required Questionnaire",
      formUrl: "",
      includeCustomButton: false,
      customButtonText: "",
      customButtonUrl: ""
    }
  },
  {
    id: "trigger_rsvp_confirmation",
    trigger_id: "trigger_rsvp_confirmation",
    title: "2. RSVP Confirmation & Door Access QR",
    name: "RSVP Confirmation & Entry Pass",
    trigger: "Triggered when a guest confirms RSVP on the public event landing page.",
    badge: "Active • Auto-Send",
    color: "blue",
    features: ["Door check-in QR code", "Dietary & special request confirmation", "Venue GPS coordinates & dates", "Calendar invitation link"],
    subject: "RSVP Confirmed: Welcome to {{eventTitle}}",
    preheader: "Your attendance is confirmed for {{eventTitle}}.",
    body: `Hello {{name}},

Thank you for confirming your attendance for **{{eventTitle}}**.

Your seat has been reserved. Please find your personal door access QR pass attached below.

**Event Highlights:**
• Date & Time: {{eventDate}}
• Location: {{eventLocation}}

If your plans change, please let us know in advance. See you there!

Warm regards,
{{organizerName}}`,
    includeQr: true,
    buttonConfig: {
      includeTicketButton: true,
      ticketButtonText: "View My RSVP Pass",
      includeFormButton: false,
      formButtonText: "",
      formUrl: "",
      includeCustomButton: true,
      customButtonText: "Add to Calendar / Directions",
      customButtonUrl: ""
    }
  },
  {
    id: "trigger_exhibitor_briefing",
    trigger_id: "trigger_exhibitor_briefing",
    title: "3. Exhibitor Space Allocation Packet",
    name: "Exhibitor Stand & Floor Plan Packet",
    trigger: "Dispatched from the Interactive 2D Floor Plan tool when assigning booths to exhibitors.",
    badge: "Active • Auto-Send",
    color: "indigo",
    features: ["Booth number & zone reference", "Technical setup window times", "Loading bay access rules", "Exhibitor floor plan PDF"],
    subject: "Exhibitor Stand & Floor Plan Packet: {{eventTitle}}",
    preheader: "Your confirmed booth allocation, setup schedule, and freight instructions.",
    body: `Dear {{name}} and the {{company}} team,

We are pleased to share your confirmed exhibition booth allocation and venue instructions for **{{eventTitle}}**.

**Your Booth Details:**
• Organization: {{company}}
• Assigned Zone: Main Exhibition Hall
• Stand Reference: As assigned on master floor plan

Please review the freight delivery guidelines, power hookup schedule, and build-up deadlines on the interactive portal.

Best regards,
{{organizerName}}`,
    includeQr: false,
    buttonConfig: {
      includeTicketButton: false,
      ticketButtonText: "",
      includeFormButton: false,
      formButtonText: "",
      formUrl: "",
      includeCustomButton: true,
      customButtonText: "Access Exhibitor Portal & Floor Plan",
      customButtonUrl: ""
    }
  },
  {
    id: "trigger_team_invite",
    trigger_id: "trigger_team_invite",
    title: "4. Organizer Team & Staff Invite",
    name: "Organizer Team & Staff Invitation",
    trigger: "Dispatched when inviting new staff or volunteers in the Team Management Center.",
    badge: "Active • Auto-Send",
    color: "amber",
    features: ["Secure one-time login access link", "Assigned role & permission breakdown", "Event dashboard access credentials"],
    subject: "You're Invited to Join the {{eventTitle}} Organizing Team",
    preheader: "Staff & operations portal credentials for {{eventTitle}}.",
    body: `Hello {{name}},

You have been invited to join the operations and organizing team for **{{eventTitle}}** on Eventzone Platform.

As a member of the event operations crew, you have access to the live event management console, attendee roster, and gate check-in scanners.

Please click the button below to verify your account and access your assigned console.

Best regards,
{{organizerName}}`,
    includeQr: false,
    buttonConfig: {
      includeTicketButton: false,
      ticketButtonText: "",
      includeFormButton: false,
      formButtonText: "",
      formUrl: "",
      includeCustomButton: true,
      customButtonText: "Access Operations Console",
      customButtonUrl: ""
    }
  }
];

export default function CommunicationsView({ state = {}, onUpdateState }) {
  const {
    eventDetails = {},
    attendees = [],
    pending = [],
    organizations = [],
    sponsors = [],
    exhibitors = [],
    influencers = [],
    tickets = [],
    team = [],
    forms = [],
    currentUser,
    activeEventId: explicitEventId
  } = state;

  const activeEventId = explicitEventId || eventDetails?.id || "default";
  const { t, lang, isRTL } = useLanguage();

  // Top Tabs: "compose" | "history" | "templates" | "triggers"
  const [activeTab, setActiveTab] = useState("compose");

  // Compose State
  const [selectedTemplateId, setSelectedTemplateId] = useState("badge_pass");
  const [recipientGroup, setRecipientGroup] = useState("all");
  const [ticketTierFilter, setTicketTierFilter] = useState("all");
  const [checkinStatusFilter, setCheckinStatusFilter] = useState("all");
  const [sponsorTierFilter, setSponsorTierFilter] = useState("all");
  const [customSelectedEmails, setCustomSelectedEmails] = useState([]);
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const [recipientSearchTerm, setRecipientSearchTerm] = useState("");

  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [body, setBody] = useState("");
  const [includeQr, setIncludeQr] = useState(true);

  // Button Widgets
  const [includeFormButton, setIncludeFormButton] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState("none");
  const [customFormUrl, setCustomFormUrl] = useState("");
  const [formButtonText, setFormButtonText] = useState("Complete Form / Survey");

  const [includeTicketButton, setIncludeTicketButton] = useState(false);
  const [ticketButtonText, setTicketButtonText] = useState("View My Event Badge");
  const [ticketActionType, setTicketActionType] = useState("badge_pass");

  const [includeCustomButton, setIncludeCustomButton] = useState(false);
  const [customButtonText, setCustomButtonText] = useState("Visit Resource");
  const [customButtonUrl, setCustomButtonUrl] = useState("");

  const [includeEventCard, setIncludeEventCard] = useState(true);

  // Live Preview Mode
  const [previewDevice, setPreviewDevice] = useState("desktop"); // "desktop" | "mobile"
  const [previewTheme, setPreviewTheme] = useState("light"); // "light" | "dark"
  const [previewAttendeeIndex, setPreviewAttendeeIndex] = useState(0);

  // Sending & History States
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState(currentUser?.email || "");
  const [isTestSending, setIsTestSending] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [recipientLogs, setRecipientLogs] = useState([]);
  const [recipientLogsLoading, setRecipientLogsLoading] = useState(false);
  const [recipientLogSearch, setRecipientLogSearch] = useState("");

  // Custom Saved Templates
  const [customTemplates, setCustomTemplates] = useState([]);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("custom");
  const [templateFilterCategory, setTemplateFilterCategory] = useState("all");

  // Trigger & Template Customizer / Editor Modal States
  const [editingTemplateData, setEditingTemplateData] = useState(null);
  const [isEditingTemplateModalOpen, setIsEditingTemplateModalOpen] = useState(false);
  const [editModalName, setEditModalName] = useState("");
  const [editModalCategory, setEditModalCategory] = useState("custom");
  const [editModalSubject, setEditModalSubject] = useState("");
  const [editModalPreheader, setEditModalPreheader] = useState("");
  const [editModalBody, setEditModalBody] = useState("");
  const [editModalIncludeQr, setEditModalIncludeQr] = useState(false);
  const [editModalIncludeFormBtn, setEditModalIncludeFormBtn] = useState(false);
  const [editModalFormBtnText, setEditModalFormBtnText] = useState("Complete Form / Survey");
  const [editModalFormUrl, setEditModalFormUrl] = useState("");
  const [editModalIncludeTicketBtn, setEditModalIncludeTicketBtn] = useState(false);
  const [editModalTicketBtnText, setEditModalTicketBtnText] = useState("View My Event Badge");
  const [editModalIncludeCustomBtn, setEditModalIncludeCustomBtn] = useState(false);
  const [editModalCustomBtnText, setEditModalCustomBtnText] = useState("Visit Resource");
  const [editModalCustomBtnUrl, setEditModalCustomBtnUrl] = useState("");
  const [editModalPreviewDevice, setEditModalPreviewDevice] = useState("desktop");
  const [editModalPreviewTheme, setEditModalPreviewTheme] = useState("light");
  const [isSavingEditTemplate, setIsSavingEditTemplate] = useState(false);
  const [isTestSendingEditTemplate, setIsTestSendingEditTemplate] = useState(false);
  const [editModalLastFocused, setEditModalLastFocused] = useState("body");
  const editSubjectRef = useRef(null);
  const editPreheaderRef = useRef(null);
  const editBodyRef = useRef(null);

  const [notification, setNotification] = useState(null);

  // Field Focus and Cursor Position Tracking for Dynamic Variables
  const subjectInputRef = useRef(null);
  const preheaderInputRef = useRef(null);
  const bodyTextareaRef = useRef(null);
  const [lastFocusedField, setLastFocusedField] = useState("body"); // "body" | "subject" | "preheader"

  const showToast = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // 1. Fetch History on Mount
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await fetchCommunicationsWithStats(activeEventId);
      setHistory(data || []);
    } catch (err) {
      console.warn("Failed to load communications history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 2. Fetch Custom Templates on Mount
  const loadCustomTemplates = async () => {
    try {
      const tmpls = await fetchCustomEmailTemplates(activeEventId);
      setCustomTemplates(tmpls || []);
    } catch (err) {
      console.warn("Failed to load custom templates:", err);
    }
  };

  useEffect(() => {
    loadHistory();
    loadCustomTemplates();
  }, [activeEventId]);

  // Load initial template
  useEffect(() => {
    const tmpl = PRESET_TEMPLATES.find(t => t.id === selectedTemplateId) || PRESET_TEMPLATES[0];
    if (tmpl) {
      setSubject(tmpl.subject);
      setPreheader(tmpl.preheader || "");
      setBody(tmpl.body);
      setIncludeQr(Boolean(tmpl.includeQr));
      if (tmpl.buttonConfig) {
        setIncludeFormButton(Boolean(tmpl.buttonConfig.includeFormButton));
        setFormButtonText(tmpl.buttonConfig.formButtonText || "Complete Form / Survey");
        setIncludeTicketButton(Boolean(tmpl.buttonConfig.includeTicketButton));
        setTicketButtonText(tmpl.buttonConfig.ticketButtonText || "View My Event Badge");
        setIncludeCustomButton(Boolean(tmpl.buttonConfig.includeCustomButton));
        setCustomButtonText(tmpl.buttonConfig.customButtonText || "Visit Resource");
        setCustomButtonUrl(tmpl.buttonConfig.customButtonUrl || "");
      }
    }
  }, [selectedTemplateId]);

  // All Available Forms for Survey Button
  const activeForms = useMemo(() => {
    return (forms || []).filter(f => f.status !== "archived" && !f.isArchived);
  }, [forms]);

  // Available Ticket Tiers
  const ticketTiersList = useMemo(() => {
    const tiers = new Set((tickets || []).map(t => t.name).filter(Boolean));
    attendees.forEach(a => {
      const tier = a.ticketType || a.ticket_type || a.ticketTier;
      if (tier) tiers.add(tier);
    });
    return Array.from(tiers);
  }, [tickets, attendees]);

  // Available Sponsor Tiers
  const sponsorTiersList = useMemo(() => {
    const tiers = new Set((sponsors || []).map(s => s.tier).filter(Boolean));
    return Array.from(tiers);
  }, [sponsors]);

  // 3. Smart Recipient Calculation & Filtering
  const targetRecipients = useMemo(() => {
    let list = [];

    const formatAttendee = (a) => ({
      id: a.id,
      name: a.name || `${a.first_name || ""} ${a.last_name || ""}`.trim() || "Attendee",
      email: (a.email || a.answers?.email || a.customAnswers?.email || "").trim(),
      role: "attendee",
      ticketTier: a.ticketType || a.ticket_type || a.ticketTier || "Standard Admission",
      badgeCode: a.badgeCode || a.badge_code || `EZ-${String(a.id || "").slice(-4).toUpperCase() || "PASS"}`,
      company: a.company || a.organization || "",
      jobTitle: a.jobTitle || a.job_title || "",
      isCheckedIn: Boolean(a.checked_in || a.checkedIn || a.status === "checked_in"),
      isApproved: a.status === "approved" || !a.status || a.status === "confirmed"
    });

    const formatExhibitor = (e) => ({
      id: e.id,
      name: e.name || e.contact_name || e.representative || "Exhibitor Representative",
      email: (e.email || e.contact_email || "").trim(),
      role: "exhibitor",
      ticketTier: "Exhibitor Pass",
      badgeCode: `EXH-${String(e.id || "").slice(-4).toUpperCase()}`,
      company: e.company || e.name || "Exhibitor Partner",
      jobTitle: "Booth Lead"
    });

    const formatSponsor = (s) => ({
      id: s.id,
      name: s.name || s.contact_name || "Sponsor Representative",
      email: (s.email || s.contact_email || "").trim(),
      role: "sponsor",
      ticketTier: `${s.tier || "Partner"} Sponsor Pass`,
      badgeCode: `SPN-${String(s.id || "").slice(-4).toUpperCase()}`,
      company: s.name || "Sponsor",
      tier: s.tier || "General"
    });

    const formatSpeaker = (spk) => ({
      id: spk.id,
      name: spk.name || "Keynote Speaker",
      email: (spk.email || "").trim(),
      role: "speaker",
      ticketTier: "Keynote Speaker Pass",
      badgeCode: `SPK-${String(spk.id || "").slice(-4).toUpperCase()}`,
      company: spk.company || spk.organization || "",
      jobTitle: spk.role || spk.jobTitle || "Speaker"
    });

    const formatTeam = (tm) => ({
      id: tm.id,
      name: tm.name || "Team Member",
      email: (tm.email || "").trim(),
      role: "team",
      ticketTier: "Staff & Organizer Pass",
      badgeCode: `STAFF-${String(tm.id || "").slice(-4).toUpperCase()}`,
      company: eventDetails?.title || "Eventzone",
      jobTitle: tm.role || "Staff"
    });

    switch (recipientGroup) {
      case "attendees": {
        let atts = attendees.map(formatAttendee);
        if (ticketTierFilter !== "all") {
          atts = atts.filter(a => a.ticketTier.toLowerCase() === ticketTierFilter.toLowerCase());
        }
        if (checkinStatusFilter === "checked_in") {
          atts = atts.filter(a => a.isCheckedIn);
        } else if (checkinStatusFilter === "not_checked_in") {
          atts = atts.filter(a => !a.isCheckedIn);
        }
        list = atts;
        break;
      }
      case "sponsors": {
        let sps = sponsors.map(formatSponsor);
        if (sponsorTierFilter !== "all") {
          sps = sps.filter(s => (s.tier || "").toLowerCase() === sponsorTierFilter.toLowerCase());
        }
        list = sps;
        break;
      }
      case "exhibitors": {
        list = exhibitors.map(formatExhibitor);
        break;
      }
      case "speakers": {
        const spks = (state.sessions || [])
          .flatMap(s => (s.speakers || []).map(sp => ({ ...sp, sessionTitle: s.title })))
          .filter(Boolean);
        list = spks.map(formatSpeaker);
        break;
      }
      case "team": {
        list = team.map(formatTeam);
        break;
      }
      case "custom": {
        // Collect all pool and filter by custom selected emails
        const allPool = [
          ...attendees.map(formatAttendee),
          ...exhibitors.map(formatExhibitor),
          ...sponsors.map(formatSponsor),
          ...team.map(formatTeam)
        ];
        list = allPool.filter(r => customSelectedEmails.includes(r.email.toLowerCase()));
        break;
      }
      case "all":
      default: {
        list = [
          ...attendees.map(formatAttendee),
          ...exhibitors.map(formatExhibitor),
          ...sponsors.map(formatSponsor),
          ...team.map(formatTeam)
        ];
        break;
      }
    }

    // Deduplicate by email address and filter valid emails
    const seenEmails = new Set();
    const validUniqueList = [];
    for (const item of list) {
      if (item && item.email && item.email.includes("@")) {
        const lower = item.email.toLowerCase();
        if (!seenEmails.has(lower)) {
          seenEmails.add(lower);
          validUniqueList.push(item);
        }
      }
    }
    return validUniqueList;
  }, [
    recipientGroup, ticketTierFilter, checkinStatusFilter, sponsorTierFilter,
    customSelectedEmails, attendees, exhibitors, sponsors, team, state.sessions, eventDetails
  ]);

  // Resolved Form Link
  const resolvedFormUrl = useMemo(() => {
    if (!includeFormButton) return "";
    if (selectedFormId === "custom_url") return customFormUrl.trim();
    if (selectedFormId && selectedFormId !== "none") {
      const matched = activeForms.find(f => f.id === selectedFormId);
      if (matched) {
        if (typeof window !== "undefined") {
          return `${window.location.origin}/?formId=${matched.id}`;
        }
        return `/?formId=${matched.id}`;
      }
    }
    return customFormUrl.trim() || "";
  }, [includeFormButton, selectedFormId, customFormUrl, activeForms]);

  // Resolved Ticket Link
  const resolvedTicketUrl = useMemo(() => {
    if (!includeTicketButton) return "";
    if (typeof window !== "undefined") {
      return `${window.location.origin}/?eventId=${activeEventId}&view=my-tickets`;
    }
    return `/?eventId=${activeEventId}&view=my-tickets`;
  }, [includeTicketButton, activeEventId]);

  // Active Sample Attendee for Live Preview
  const sampleAttendee = useMemo(() => {
    if (targetRecipients.length > 0) {
      const idx = Math.min(previewAttendeeIndex, targetRecipients.length - 1);
      return targetRecipients[idx >= 0 ? idx : 0];
    }
    return {
      name: "Alex Morgan",
      email: "alex.morgan@acme.com",
      role: "attendee",
      ticketTier: "VIP All-Access Pass",
      badgeCode: "EZ-8821",
      company: "Acme Innovations Corp",
      jobTitle: "Chief Strategy Officer"
    };
  }, [targetRecipients, previewAttendeeIndex]);

  // Live Variable Interpolation Helper
  const interpolateText = (textStr, sampleObj = sampleAttendee) => {
    if (!textStr) return "";
    const name = sampleObj?.name || "Alex Morgan";
    const firstName = name.split(" ")[0] || "Alex";
    const eventTitle = eventDetails?.title || "Eventzone Summit & Expo";
    const eventDate = eventDetails?.startDate || "Oct 24 - 26, 2026";
    const eventLocation = eventDetails?.location || "Metropolitan Grand Convention Center";
    const organizerName = eventDetails?.organizerName || currentUser?.name || "Eventzone Platform";
    const ticketTier = sampleObj?.ticketTier || "VIP All-Access Pass";
    const badgeCode = sampleObj?.badgeCode || "EZ-8821";
    const company = sampleObj?.company || "Acme Innovations Corp";
    const jobTitle = sampleObj?.jobTitle || "Director";

    return textStr
      .replace(/\{\{name\}\}/gi, name)
      .replace(/\{\{first_name\}\}/gi, firstName)
      .replace(/\{\{firstName\}\}/gi, firstName)
      .replace(/\{\{company\}\}/gi, company)
      .replace(/\{\{jobTitle\}\}/gi, jobTitle)
      .replace(/\{\{ticketTier\}\}/gi, ticketTier)
      .replace(/\{\{badgeCode\}\}/gi, badgeCode)
      .replace(/\{\{eventTitle\}\}/gi, eventTitle)
      .replace(/\{\{eventDate\}\}/gi, eventDate)
      .replace(/\{\{eventLocation\}\}/gi, eventLocation)
      .replace(/\{\{venue\}\}/gi, eventLocation)
      .replace(/\{\{date\}\}/gi, eventDate)
      .replace(/\{\{organizerName\}\}/gi, organizerName)
      .replace(/\{\{formLink\}\}/gi, resolvedFormUrl || "https://eventzone.pro")
      .replace(/\{\{ticketLink\}\}/gi, resolvedTicketUrl || "https://eventzone.pro");
  };

  // Event-Level & Attendee Variable Interpolator (for history titles, drawer headers, and card previews)
  const formatEventText = (textStr, recipientSample = null) => {
    if (!textStr || typeof textStr !== "string") return "";
    const eventTitle = eventDetails?.title || eventDetails?.name || state?.title || "Eventzone Summit";
    const eventDate = eventDetails?.startDate || eventDetails?.date || "October 24-26, 2026";
    const eventLocation = eventDetails?.location || eventDetails?.venue || "Grand Convention Center";
    const organizerName = eventDetails?.organizerName || eventDetails?.organizer || currentUser?.name || "Eventzone Organizer";
    const attendeeName = recipientSample?.name || "Attendee";
    const firstName = (recipientSample?.name || "Attendee").split(" ")[0];
    const company = recipientSample?.company || "";
    const jobTitle = recipientSample?.jobTitle || "";
    const ticketTier = recipientSample?.ticketTier || "Standard Admission";
    const badgeCode = recipientSample?.badgeCode || "EZ-PASS";

    let res = textStr
      .replace(/\{\{eventTitle\}\}/gi, eventTitle)
      .replace(/\{\{eventDate\}\}/gi, eventDate)
      .replace(/\{\{eventLocation\}\}/gi, eventLocation)
      .replace(/\{\{venue\}\}/gi, eventLocation)
      .replace(/\{\{date\}\}/gi, eventDate)
      .replace(/\{\{organizerName\}\}/gi, organizerName)
      .replace(/\{\{name\}\}/gi, attendeeName)
      .replace(/\{\{first_name\}\}/gi, firstName)
      .replace(/\{\{firstName\}\}/gi, firstName)
      .replace(/\{\{company\}\}/gi, company)
      .replace(/\{\{jobTitle\}\}/gi, jobTitle)
      .replace(/\{\{ticketTier\}\}/gi, ticketTier)
      .replace(/\{\{badgeCode\}\}/gi, badgeCode)
      .replace(/\{\{formLink\}\}/gi, resolvedFormUrl || "https://eventzone.pro")
      .replace(/\{\{ticketLink\}\}/gi, resolvedTicketUrl || "https://eventzone.pro");

    // Clean up any remaining unresolved {{...}} tags
    res = res.replace(/\{\{[^}]+\}\}/g, "");
    // Clean up markdown bold/italic asterisks for plaintext summary
    return res.replace(/\*\*/g, "").replace(/(?<!\*)\*(?!\*)/g, "").trim();
  };

  // Variable Inserter (inserts exactly at current cursor location)
  const handleInsertVariable = (tag) => {
    if (lastFocusedField === "subject" && subjectInputRef.current) {
      const input = subjectInputRef.current;
      const start = input.selectionStart !== undefined ? input.selectionStart : subject.length;
      const end = input.selectionEnd !== undefined ? input.selectionEnd : subject.length;
      const before = subject.substring(0, start);
      const after = subject.substring(end);
      const newSubject = before + tag + after;
      setSubject(newSubject);
      setTimeout(() => {
        if (input) {
          input.focus();
          const newPos = start + tag.length;
          input.setSelectionRange(newPos, newPos);
        }
      }, 0);
      return;
    }

    if (lastFocusedField === "preheader" && preheaderInputRef.current) {
      const input = preheaderInputRef.current;
      const start = input.selectionStart !== undefined ? input.selectionStart : preheader.length;
      const end = input.selectionEnd !== undefined ? input.selectionEnd : preheader.length;
      const before = preheader.substring(0, start);
      const after = preheader.substring(end);
      const newPreheader = before + tag + after;
      setPreheader(newPreheader);
      setTimeout(() => {
        if (input) {
          input.focus();
          const newPos = start + tag.length;
          input.setSelectionRange(newPos, newPos);
        }
      }, 0);
      return;
    }

    // Default: Message Body Textarea
    const textarea = bodyTextareaRef.current;
    const start = textarea && textarea.selectionStart !== undefined ? textarea.selectionStart : body.length;
    const end = textarea && textarea.selectionEnd !== undefined ? textarea.selectionEnd : body.length;
    const before = body.substring(0, start);
    const after = body.substring(end);
    const newBody = before + tag + after;
    setBody(newBody);
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newPos = start + tag.length;
        textarea.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  // 4. Send Test Email
  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      showToast("error", "Please enter a valid test email address.");
      return;
    }
    setIsTestSending(true);
    try {
      const res = await fetch("/api/email/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: activeEventId,
          appUrl: typeof window !== "undefined" ? window.location.origin : "",
          testEmail: testEmailAddress.trim(),
          subject: subject.trim(),
          body: body.trim(),
          preheader: preheader.trim(),
          eventTitle: eventDetails?.title || "Eventzone Summit",
          organizerName: eventDetails?.organizerName || currentUser?.name || "Eventzone Team",
          eventLogo: eventDetails?.eventLogo || eventDetails?.logo || "",
          eventDate: eventDetails?.startDate || "",
          eventLocation: eventDetails?.location || "",
          buttonConfig: {
            includeFormButton,
            formButtonText: formButtonText.trim(),
            formUrl: resolvedFormUrl,
            includeTicketButton,
            ticketButtonText: ticketButtonText.trim(),
            ticketUrl: resolvedTicketUrl,
            includeCustomButton,
            customButtonText: customButtonText.trim(),
            customButtonUrl: customButtonUrl.trim()
          },
          includeQr,
          sampleAttendee
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Test preview with open tracking successfully sent to ${testEmailAddress}! Check your inbox.`);
        setIsTestModalOpen(false);
        await loadHistory();
      } else {
        showToast("error", data.error || "Failed to deliver test email.");
      }
    } catch (err) {
      console.error("Test send error:", err);
      showToast("error", "Network error sending test email. Please verify connection.");
    } finally {
      setIsTestSending(false);
    }
  };

  // 5. Send Real Broadcast Announcement
  const handleSendBroadcast = async () => {
    if (targetRecipients.length === 0) {
      showToast("error", "No recipients match your current group and filter criteria.");
      return;
    }
    if (!subject.trim() || !body.trim()) {
      showToast("error", "Please provide both a subject line and email body.");
      return;
    }

    setIsSending(true);
    setSendingProgress(0);

    try {
      const res = await fetch("/api/email/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: activeEventId,
          appUrl: typeof window !== "undefined" ? window.location.origin : "",
          recipients: targetRecipients,
          recipientGroup,
          recipientFilter: {
            ticketTier: ticketTierFilter,
            checkinStatus: checkinStatusFilter,
            sponsorTier: sponsorTierFilter
          },
          templateId: selectedTemplateId,
          subject: subject.trim(),
          body: body.trim(),
          preheader: preheader.trim(),
          eventTitle: eventDetails?.title || "Eventzone Summit",
          organizerName: eventDetails?.organizerName || currentUser?.name || "Eventzone Organizer",
          eventLogo: eventDetails?.eventLogo || eventDetails?.logo || "",
          eventDate: eventDetails?.startDate || "",
          eventLocation: eventDetails?.location || "",
          buttonConfig: {
            includeFormButton,
            formButtonText: formButtonText.trim(),
            formUrl: resolvedFormUrl,
            includeTicketButton,
            ticketButtonText: ticketButtonText.trim(),
            ticketUrl: resolvedTicketUrl,
            includeCustomButton,
            customButtonText: customButtonText.trim(),
            customButtonUrl: customButtonUrl.trim()
          },
          includeQr
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Broadcast successfully dispatched to ${data.sent || targetRecipients.length} recipients!`);
        setIsConfirmModalOpen(false);
        // Refresh history
        await loadHistory();
        // Switch to history tab to view results
        setActiveTab("history");
      } else {
        showToast("error", data.error || "Failed to dispatch broadcast announcement.");
      }
    } catch (err) {
      console.error("Broadcast send error:", err);
      showToast("error", "An error occurred while broadcasting emails.");
    } finally {
      setIsSending(false);
    }
  };

  // 6. Delete Past Broadcast
  const handleDeleteBroadcast = async (commId) => {
    if (!window.confirm("Are you sure you want to delete this broadcast record and its tracking logs?")) return;
    try {
      await deleteCommunication(commId);
      setHistory(prev => prev.filter(item => item.id !== commId));
      if (selectedHistoryItem?.id === commId) setSelectedHistoryItem(null);
      showToast("success", "Broadcast record removed.");
    } catch (err) {
      showToast("error", "Failed to delete broadcast record.");
    }
  };

  // 7. Load Detailed Recipient Log Drawer
  const handleOpenRecipientLog = async (commItem) => {
    setSelectedHistoryItem(commItem);
    setRecipientLogsLoading(true);
    try {
      const logs = await fetchCommunicationRecipientLogs(commItem.id);
      setRecipientLogs(logs || []);
    } catch (err) {
      console.warn("Error fetching recipient logs:", err);
    } finally {
      setRecipientLogsLoading(false);
    }
  };

  // 8. Clone / Re-use Past Broadcast
  const handleCloneBroadcast = (commItem) => {
    setSubject(commItem.subject || "");
    setBody(commItem.body || "");
    setRecipientGroup(commItem.recipient_group || "all");
    setIncludeQr(Boolean(commItem.include_qr));
    if (commItem.button_config) {
      try {
        const cfg = typeof commItem.button_config === "string" ? JSON.parse(commItem.button_config) : commItem.button_config;
        setIncludeFormButton(Boolean(cfg.includeFormButton));
        setFormButtonText(cfg.formButtonText || "Complete Form");
        setCustomFormUrl(cfg.formUrl || "");
        setIncludeTicketButton(Boolean(cfg.includeTicketButton));
        setTicketButtonText(cfg.ticketButtonText || "View My Event Badge");
        setIncludeCustomButton(Boolean(cfg.includeCustomButton));
        setCustomButtonText(cfg.customButtonText || "Visit Link");
        setCustomButtonUrl(cfg.customButtonUrl || "");
      } catch (e) {}
    }
    setActiveTab("compose");
    showToast("success", "Past broadcast loaded into Compose builder!");
  };

  // 9. Save as Custom Template
  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      showToast("error", "Please specify a name for this template.");
      return;
    }
    try {
      const saved = await saveCustomEmailTemplate({
        name: newTemplateName.trim(),
        category: newTemplateCategory,
        description: `Custom organizer template created on ${new Date().toLocaleDateString()}`,
        subject: subject.trim(),
        body: body.trim(),
        includeQr,
        buttonConfig: {
          includeFormButton,
          formButtonText,
          formUrl: customFormUrl,
          includeTicketButton,
          ticketButtonText,
          includeCustomButton,
          customButtonText,
          customButtonUrl
        }
      }, activeEventId);

      setCustomTemplates(prev => [saved, ...prev]);
      setIsSaveTemplateModalOpen(false);
      setNewTemplateName("");
      showToast("success", "Custom template successfully saved!");
    } catch (err) {
      console.error("Save template error:", err);
      showToast("error", "Failed to save custom template.");
    }
  };

  // 10. Delete Custom Template
  const handleDeleteCustomTemplate = async (templateId) => {
    if (!window.confirm("Are you sure you want to delete this custom template?")) return;
    try {
      await deleteCustomEmailTemplate(templateId);
      setCustomTemplates(prev => prev.filter(t => t.id !== templateId));
      showToast("success", "Template removed.");
    } catch (err) {
      showToast("error", "Failed to delete template.");
    }
  };

  // 11. Get Active Trigger Configuration (Customized override or default)
  const getTriggerConfig = (triggerDef) => {
    const custom = customTemplates.find(
      (ct) => (ct.is_trigger && ct.trigger_id === triggerDef.id) || ct.id === triggerDef.id
    );
    if (!custom) return { ...triggerDef, isCustomized: false };
    
    let btnCfg = triggerDef.buttonConfig;
    if (custom.button_config) {
      try {
        btnCfg = typeof custom.button_config === "string" ? JSON.parse(custom.button_config) : custom.button_config;
      } catch (e) {}
    }
    return {
      ...triggerDef,
      dbId: custom.id,
      name: custom.name || triggerDef.name || triggerDef.title,
      subject: custom.subject || triggerDef.subject,
      preheader: custom.preheader || triggerDef.preheader,
      body: custom.body || triggerDef.body,
      includeQr: custom.include_qr !== undefined ? Boolean(custom.include_qr) : triggerDef.includeQr,
      buttonConfig: btnCfg || triggerDef.buttonConfig,
      isCustomized: true,
    };
  };

  // 12. Open Trigger / Template Editor Modal
  const handleOpenEditor = (item, isTrigger = false) => {
    let resolvedItem = item;
    if (isTrigger) {
      resolvedItem = getTriggerConfig(item);
    }
    
    const btnCfg = resolvedItem.buttonConfig || {};
    setEditingTemplateData({
      ...resolvedItem,
      isTrigger,
      trigger_id: isTrigger ? (resolvedItem.trigger_id || resolvedItem.id) : null,
    });
    setEditModalName(resolvedItem.title || resolvedItem.name || "Untitled Template");
    setEditModalCategory(resolvedItem.category || "custom");
    setEditModalSubject(resolvedItem.subject || "");
    setEditModalPreheader(resolvedItem.preheader || "");
    setEditModalBody(resolvedItem.body || "");
    setEditModalIncludeQr(Boolean(resolvedItem.includeQr || resolvedItem.include_qr));
    
    setEditModalIncludeFormBtn(Boolean(btnCfg.includeFormButton));
    setEditModalFormBtnText(btnCfg.formButtonText || "Complete Form / Survey");
    setEditModalFormUrl(btnCfg.formUrl || "");
    
    setEditModalIncludeTicketBtn(Boolean(btnCfg.includeTicketButton));
    setEditModalTicketBtnText(btnCfg.ticketButtonText || "View My Event Badge");
    
    setEditModalIncludeCustomBtn(Boolean(btnCfg.includeCustomButton));
    setEditModalCustomBtnText(btnCfg.customButtonText || "Visit Resource");
    setEditModalCustomBtnUrl(btnCfg.customButtonUrl || "");
    
    setIsEditingTemplateModalOpen(true);
  };

  // 13. Save Edited Template / Trigger
  const handleSaveEditedTemplate = async () => {
    if (!editModalSubject.trim() || !editModalBody.trim()) {
      showToast("error", "Subject line and email body cannot be blank.");
      return;
    }

    setIsSavingEditTemplate(true);
    try {
      const isTrigger = Boolean(editingTemplateData?.isTrigger);
      const triggerId = isTrigger ? (editingTemplateData.trigger_id || editingTemplateData.id) : null;
      
      const payload = {
        id: editingTemplateData?.dbId || (editingTemplateData?.id && !isTrigger && customTemplates.some(ct => ct.id === editingTemplateData.id) ? editingTemplateData.id : undefined),
        name: editModalName.trim() || editingTemplateData?.title || "Custom Template",
        category: editModalCategory,
        subject: editModalSubject.trim(),
        preheader: editModalPreheader.trim(),
        body: editModalBody.trim(),
        includeQr: editModalIncludeQr,
        is_trigger: isTrigger,
        trigger_id: triggerId,
        buttonConfig: {
          includeFormButton: editModalIncludeFormBtn,
          formButtonText: editModalFormBtnText.trim(),
          formUrl: editModalFormUrl.trim(),
          includeTicketButton: editModalIncludeTicketBtn,
          ticketButtonText: editModalTicketBtnText.trim(),
          includeCustomButton: editModalIncludeCustomBtn,
          customButtonText: editModalCustomBtnText.trim(),
          customButtonUrl: editModalCustomBtnUrl.trim(),
        }
      };

      const saved = await saveCustomEmailTemplate(payload, activeEventId);
      
      // Update local state
      setCustomTemplates((prev) => {
        const filtered = prev.filter((t) => t.id !== saved.id && !(isTrigger && t.trigger_id === triggerId));
        return [saved, ...filtered];
      });

      showToast("success", isTrigger ? "Automated Trigger template saved for this event!" : "Template successfully saved to library!");
      setIsEditingTemplateModalOpen(false);
    } catch (err) {
      console.error("Save template error:", err);
      showToast("error", "Failed to save template changes.");
    } finally {
      setIsSavingEditTemplate(false);
    }
  };

  // 14. Reset Trigger to Default Template
  const handleResetTrigger = async (triggerId) => {
    if (!window.confirm("Reset this automated trigger back to the system default template?")) return;
    try {
      const existing = customTemplates.find(
        (ct) => (ct.is_trigger && ct.trigger_id === triggerId) || ct.id === triggerId
      );
      if (existing && existing.id) {
        await deleteCustomEmailTemplate(existing.id);
        setCustomTemplates((prev) => prev.filter((t) => t.id !== existing.id));
      }
      showToast("success", "Automated trigger restored to default template.");
    } catch (err) {
      showToast("error", "Failed to reset trigger.");
    }
  };

  // 15. Dynamic Variable Inserter in Edit Modal
  const handleInsertVariableInEditModal = (tag) => {
    if (editModalLastFocused === "subject" && editSubjectRef.current) {
      const input = editSubjectRef.current;
      const start = input.selectionStart !== undefined ? input.selectionStart : editModalSubject.length;
      const end = input.selectionEnd !== undefined ? input.selectionEnd : editModalSubject.length;
      const before = editModalSubject.substring(0, start);
      const after = editModalSubject.substring(end);
      const nextVal = `${before}${tag}${after}`;
      setEditModalSubject(nextVal);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else if (editModalLastFocused === "preheader" && editPreheaderRef.current) {
      const input = editPreheaderRef.current;
      const start = input.selectionStart !== undefined ? input.selectionStart : editModalPreheader.length;
      const end = input.selectionEnd !== undefined ? input.selectionEnd : editModalPreheader.length;
      const before = editModalPreheader.substring(0, start);
      const after = editModalPreheader.substring(end);
      const nextVal = `${before}${tag}${after}`;
      setEditModalPreheader(nextVal);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else {
      const textarea = editBodyRef.current;
      if (textarea) {
        const start = textarea.selectionStart !== undefined ? textarea.selectionStart : editModalBody.length;
        const end = textarea.selectionEnd !== undefined ? textarea.selectionEnd : editModalBody.length;
        const before = editModalBody.substring(0, start);
        const after = editModalBody.substring(end);
        const nextVal = `${before}${tag}${after}`;
        setEditModalBody(nextVal);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + tag.length, start + tag.length);
        }, 0);
      } else {
        setEditModalBody(prev => `${prev} ${tag}`);
      }
    }
  };

  // 16. Test Send from Edit Modal
  const handleSendTestFromEditor = async () => {
    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      showToast("error", "Please provide a valid test email recipient.");
      return;
    }
    if (!editModalSubject.trim() || !editModalBody.trim()) {
      showToast("error", "Subject and message body cannot be blank.");
      return;
    }

    setIsTestSendingEditTemplate(true);
    try {
      const res = await fetch("/api/email/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testEmail: testEmailAddress.trim(),
          eventId: activeEventId,
          appUrl: typeof window !== "undefined" ? window.location.origin : "",
          templateId: editingTemplateData?.id || "custom",
          subject: editModalSubject.trim(),
          body: editModalBody.trim(),
          preheader: editModalPreheader.trim(),
          eventTitle: eventDetails?.title || "Eventzone Summit",
          organizerName: eventDetails?.organizerName || currentUser?.name || "Eventzone Organizer",
          eventLogo: eventDetails?.eventLogo || eventDetails?.logo || "",
          eventDate: eventDetails?.startDate || "",
          eventLocation: eventDetails?.location || "",
          buttonConfig: {
            includeFormButton: editModalIncludeFormBtn,
            formButtonText: editModalFormBtnText.trim(),
            formUrl: editModalFormUrl.trim(),
            includeTicketButton: editModalIncludeTicketBtn,
            ticketButtonText: editModalTicketBtnText.trim(),
            includeCustomButton: editModalIncludeCustomBtn,
            customButtonText: editModalCustomBtnText.trim(),
            customButtonUrl: editModalCustomBtnUrl.trim()
          },
          includeQr: editModalIncludeQr
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Test preview dispatched to ${testEmailAddress}!`);
      } else {
        showToast("error", data.error || "Failed to send test email preview.");
      }
    } catch (err) {
      console.error("Test send error:", err);
      showToast("error", "An error occurred while sending test email.");
    } finally {
      setIsTestSendingEditTemplate(false);
    }
  };

  // 17. Export Tracking CSV
  const handleExportTrackingCsv = () => {
    if (!recipientLogs || recipientLogs.length === 0) return;
    const headers = ["Recipient Email", "Recipient Name", "Role", "Status", "Open Count", "First Opened At", "Last Opened At", "User Agent"];
    const rows = recipientLogs.map(log => [
      `"${log.recipient_email || ""}"`,
      `"${log.recipient_name || ""}"`,
      `"${log.recipient_role || "attendee"}"`,
      `"${log.status || "sent"}"`,
      log.open_count || 0,
      `"${log.opened_at ? new Date(log.opened_at).toLocaleString() : "Unopened"}"`,
      `"${log.last_opened_at ? new Date(log.last_opened_at).toLocaleString() : ""}"`,
      `"${(log.user_agent || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tracking_report_${selectedHistoryItem?.subject?.slice(0, 20) || "broadcast"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 12. Simulate Recipient Open (for Testing & Local Development)
  const handleSimulateOpen = async (log) => {
    if (!selectedHistoryItem || !log) return;
    try {
      const url = `/api/email/track?cid=${selectedHistoryItem.id}&rid=${log.id}&em=${encodeURIComponent(log.recipient_email)}`;
      await fetch(url, { cache: "no-store" });
      showToast("success", `Recorded open for ${log.recipient_name || log.recipient_email}!`);
      const freshLogs = await fetchCommunicationRecipientLogs(selectedHistoryItem.id);
      setRecipientLogs(freshLogs || []);
      await loadHistory();
    } catch (err) {
      console.error("Simulation error:", err);
      showToast("error", "Failed to simulate open.");
    }
  };

  // 13. Simulate All Unopened Recipient Opens
  const handleSimulateAllOpens = async () => {
    if (!selectedHistoryItem || !recipientLogs.length) return;
    try {
      const unopened = recipientLogs.filter(l => !(l.open_count > 0 || l.status === "opened" || l.opened_at));
      if (unopened.length === 0) {
        showToast("success", "All recipients have already opened this broadcast!");
        return;
      }
      for (const log of unopened) {
        const url = `/api/email/track?cid=${selectedHistoryItem.id}&rid=${log.id}&em=${encodeURIComponent(log.recipient_email)}`;
        await fetch(url, { cache: "no-store" });
      }
      showToast("success", `Simulated opens for ${unopened.length} recipient(s)!`);
      const freshLogs = await fetchCommunicationRecipientLogs(selectedHistoryItem.id);
      setRecipientLogs(freshLogs || []);
      await loadHistory();
    } catch (err) {
      console.error("Simulation all error:", err);
      showToast("error", "Failed to simulate all opens.");
    }
  };

  // 14. Copy Tracking Pixel URL
  const handleCopyTrackingPixelUrl = (log) => {
    if (!selectedHistoryItem || !log) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/api/email/track?cid=${selectedHistoryItem.id}&rid=${log.id}&em=${encodeURIComponent(log.recipient_email)}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast("success", "Tracking pixel URL copied to clipboard! Open it in any browser tab to test.");
    }
  };

  // Filtered History List
  const filteredHistory = useMemo(() => {
    if (!historySearchQuery.trim()) return history;
    const q = historySearchQuery.toLowerCase();
    return history.filter(h => (h.subject || "").toLowerCase().includes(q) || (h.body || "").toLowerCase().includes(q) || (h.recipient_group || "").toLowerCase().includes(q));
  }, [history, historySearchQuery]);

  // Aggregated Overall Metrics
  const aggregateMetrics = useMemo(() => {
    const totalBroadcasts = history.length;
    const totalEmailsSent = history.reduce((sum, h) => sum + (h.recipient_count || 0), 0);
    const totalUniqueOpens = history.reduce((sum, h) => sum + (h.unique_opens_count || 0), 0);
    const avgOpenRate = totalEmailsSent > 0 ? Math.round((totalUniqueOpens / totalEmailsSent) * 100) : 0;
    return { totalBroadcasts, totalEmailsSent, totalUniqueOpens, avgOpenRate };
  }, [history]);

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold ${
              notification.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            {notification.type === "error" ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Global Stats Banner */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Announcements & Communications</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Broadcast branded event communications, embed interactive action buttons, and track real-time email opens.
          </p>
        </div>

        {/* Global Metric Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 shadow-xs">
            <Send size={15} className="text-blue-600" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Broadcasts</span>
              <span className="text-xs font-black text-slate-850">{aggregateMetrics.totalBroadcasts}</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 shadow-xs">
            <Users size={15} className="text-indigo-600" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Dispatched</span>
              <span className="text-xs font-black text-slate-850">{aggregateMetrics.totalEmailsSent}</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 shadow-xs">
            <Activity size={15} className="text-emerald-600" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Avg Open Rate</span>
              <span className="text-xs font-black text-emerald-600">{aggregateMetrics.avgOpenRate}%</span>
            </div>
          </div>
        </div>
      </header>

      {/* Top Navigation Tabs (Logistics Style) */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("compose")}
            className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
              activeTab === "compose"
                ? "text-blue-600 font-black bg-blue-50/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Edit3 size={15} />
            <span>Compose & Broadcast</span>
            {activeTab === "compose" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("history");
              loadHistory();
            }}
            className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
              activeTab === "history"
                ? "text-blue-600 font-black bg-blue-50/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <BarChart3 size={15} />
            <span>Broadcast History & Opens</span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              activeTab === "history" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              {history.length}
            </span>
            {activeTab === "history" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("templates")}
            className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
              activeTab === "templates"
                ? "text-blue-600 font-black bg-blue-50/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Layers size={15} />
            <span>Template Library</span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              activeTab === "templates" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              {PRESET_TEMPLATES.length + customTemplates.length}
            </span>
            {activeTab === "templates" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("triggers")}
            className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
              activeTab === "triggers"
                ? "text-blue-600 font-black bg-blue-50/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Sparkles size={15} />
            <span>Automated Triggers</span>
            {activeTab === "triggers" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
            )}
          </button>
        </div>

        {activeTab === "history" && (
          <button
            onClick={loadHistory}
            disabled={historyLoading}
            className="px-3 py-1.5 mr-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={historyLoading ? "animate-spin" : ""} />
            <span>Refresh Analytics</span>
          </button>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: COMPOSE & BROADCAST BUILDER */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "compose" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Left Form Builder Pane (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* 1. Audience Segmentation Card */}
            <div className="bg-white border border-slate-250/70 rounded-3xl p-6 shadow-sm flex flex-col gap-4.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Users size={16} />
                  </div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Target Audience & Segmentation
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                    <UserCheck size={13} />
                    {targetRecipients.length} Recipient{targetRecipients.length === 1 ? "" : "s"} Selected
                  </span>
                  {targetRecipients.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsRecipientModalOpen(true)}
                      className="text-[11px] font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      View List
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Recipient Group
                  </label>
                  <SearchableSelect
                    value={recipientGroup}
                    onChange={(val) => setRecipientGroup(val)}
                    options={[
                      { value: "all", label: `Everyone: All Participants & Partners (${attendees.length + exhibitors.length + sponsors.length + team.length})` },
                      { value: "attendees", label: `Attendees & Registered Delegates (${attendees.length})` },
                      { value: "sponsors", label: `Sponsors & Partner Organizations (${sponsors.length})` },
                      { value: "exhibitors", label: `Exhibitors & Booth Staff (${exhibitors.length})` },
                      { value: "speakers", label: "Keynote Speakers & Presenters" },
                      { value: "team", label: `Organizer Staff & Volunteers (${team.length})` },
                      { value: "custom", label: `Custom Hand-Picked Selection (${customSelectedEmails.length} picked)` }
                    ]}
                    placeholder="Select audience group..."
                  />
                </div>

                {/* Sub-Filters for Attendees */}
                {recipientGroup === "attendees" && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Filter by Ticket Tier
                      </label>
                      <SearchableSelect
                        value={ticketTierFilter}
                        onChange={(val) => setTicketTierFilter(val)}
                        options={[
                          { value: "all", label: "All Admission Tiers" },
                          ...ticketTiersList.map(tier => ({ value: tier, label: tier }))
                        ]}
                        placeholder="All Tiers"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Check-in Status
                      </label>
                      <SearchableSelect
                        value={checkinStatusFilter}
                        onChange={(val) => setCheckinStatusFilter(val)}
                        options={[
                          { value: "all", label: "All Attendees (Any Status)" },
                          { value: "checked_in", label: "Checked-in at Venue Gate Only" },
                          { value: "not_checked_in", label: "Not Yet Checked-in Only" }
                        ]}
                        placeholder="Any Status"
                      />
                    </div>
                  </>
                )}

                {/* Sub-Filters for Sponsors */}
                {recipientGroup === "sponsors" && sponsorTiersList.length > 0 && (
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Filter by Sponsorship Tier
                    </label>
                    <SearchableSelect
                      value={sponsorTierFilter}
                      onChange={(val) => setSponsorTierFilter(val)}
                      options={[
                        { value: "all", label: "All Sponsor Tiers" },
                        ...sponsorTiersList.map(tier => ({ value: tier, label: `${tier} Tier Sponsors` }))
                      ]}
                      placeholder="All Sponsor Tiers"
                    />
                  </div>
                )}

                {/* Custom Pick Button */}
                {recipientGroup === "custom" && (
                  <div className="md:col-span-2 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Hand-Pick Specific Recipients</h4>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        {customSelectedEmails.length} individual recipient{customSelectedEmails.length === 1 ? "" : "s"} selected.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRecipientModalOpen(true)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Select Individuals →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Message Composition Card */}
            <div className="bg-white border border-slate-250/70 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              {/* Template Header Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <FileText size={16} />
                  </div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Message Content & Styling
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSaveTemplateModalOpen(true)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Save as Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("templates")}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Layers size={13} />
                    <span>Browse Templates</span>
                  </button>
                </div>
              </div>

              {/* Template Quick Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Base Email Template
                </label>
                <SearchableSelect
                  value={selectedTemplateId}
                  onChange={(val) => {
                    setSelectedTemplateId(val);
                    const tmpl = [...PRESET_TEMPLATES, ...customTemplates].find(t => t.id === val);
                    if (tmpl) {
                      setSubject(tmpl.subject || "");
                      setBody(tmpl.body || "");
                      setPreheader(tmpl.preheader || "");
                      setIncludeQr(Boolean(tmpl.include_qr || tmpl.includeQr));
                      if (tmpl.button_config || tmpl.buttonConfig) {
                        const cfg = typeof (tmpl.button_config || tmpl.buttonConfig) === "string" 
                          ? JSON.parse(tmpl.button_config || tmpl.buttonConfig) 
                          : (tmpl.button_config || tmpl.buttonConfig);
                        setIncludeFormButton(Boolean(cfg.includeFormButton));
                        setFormButtonText(cfg.formButtonText || "Complete Form");
                        setIncludeTicketButton(Boolean(cfg.includeTicketButton));
                        setTicketButtonText(cfg.ticketButtonText || "View My Event Badge");
                        setIncludeCustomButton(Boolean(cfg.includeCustomButton));
                        setCustomButtonText(cfg.customButtonText || "Visit Resource");
                        setCustomButtonUrl(cfg.customButtonUrl || "");
                      }
                    }
                  }}
                  options={[
                    ...PRESET_TEMPLATES.map(t => ({
                      value: t.id,
                      label: `${t.title} (${t.categoryLabel})`
                    })),
                    ...customTemplates.map(ct => ({
                      value: ct.id,
                      label: `⭐ ${ct.name} (Custom Template)`
                    }))
                  ]}
                  placeholder="Select a template..."
                />
              </div>

              {/* Subject Line */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Subject Line <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">{subject.length} chars</span>
                </div>
                <input
                  ref={subjectInputRef}
                  type="text"
                  required
                  placeholder="e.g. Important Arrival Notice: Fast-Track Pass for {{eventTitle}}"
                  value={subject}
                  onFocus={() => setLastFocusedField("subject")}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none rounded-xl text-xs font-bold text-slate-900 transition-all"
                />
              </div>

              {/* Preheader Snippet */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Preheader Snippet (Preview Text)</span>
                    <span className="text-[9px] font-semibold text-slate-400">(Shows on mobile lock screens)</span>
                  </label>
                </div>
                <input
                  ref={preheaderInputRef}
                  type="text"
                  placeholder="e.g. Your registration is confirmed. Access your badge and fast-track pass."
                  value={preheader}
                  onFocus={() => setLastFocusedField("preheader")}
                  onChange={(e) => setPreheader(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50/70 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-700 transition-all"
                />
              </div>

              {/* Dynamic Variables Ribbon */}
              <div className="flex flex-col gap-2 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Tag size={12} className="text-blue-600" />
                    Insert Dynamic Variables
                  </span>
                  <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                    Inserts directly at cursor position ({lastFocusedField === "subject" ? "Subject" : lastFocusedField === "preheader" ? "Preheader" : "Message Body"})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { tag: "{{name}}", label: "Full Name" },
                    { tag: "{{first_name}}", label: "First Name" },
                    { tag: "{{company}}", label: "Company" },
                    { tag: "{{jobTitle}}", label: "Job Title" },
                    { tag: "{{ticketTier}}", label: "Ticket Tier" },
                    { tag: "{{badgeCode}}", label: "Badge Code" },
                    { tag: "{{eventTitle}}", label: "Event Title" },
                    { tag: "{{eventDate}}", label: "Dates" },
                    { tag: "{{venue}}", label: "Venue Location" },
                    { tag: "{{organizerName}}", label: "Organizer Name" }
                  ].map(({ tag, label }) => (
                    <button
                      key={tag}
                      type="button"
                      onMouseDown={(e) => {
                        // Prevent button from stealing input focus before click fires
                        e.preventDefault();
                      }}
                      onClick={() => handleInsertVariable(tag)}
                      className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <span>{label}</span>
                      <span className="text-[9px] font-mono text-slate-400">{tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Content Editor */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Message Body <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">Supports **bold**, *italic*, • bullet points</span>
                </div>
                <textarea
                  ref={bodyTextareaRef}
                  rows={9}
                  required
                  placeholder="Write your email body here..."
                  value={body}
                  onFocus={() => setLastFocusedField("body")}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none rounded-2xl text-xs font-semibold text-slate-850 leading-relaxed transition-all resize-y"
                />
              </div>
            </div>

            {/* 3. Interactive Action Buttons & Widgets Card */}
            <div className="bg-white border border-slate-250/70 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Sliders size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Interactive Action Buttons & Smart Widgets
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Embed clickable dynamic buttons, forms, QR passes, and event cards.
                  </p>
                </div>
              </div>

              {/* Widget 1: Dynamic Form / Survey Button */}
              <div className={`p-4 rounded-2xl border transition-all ${
                includeFormButton ? "bg-blue-50/40 border-blue-200" : "bg-slate-50/50 border-slate-200"
              }`}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeFormButton}
                      onChange={(e) => {
                        setIncludeFormButton(e.target.checked);
                        if (e.target.checked && selectedFormId === "none" && activeForms.length > 0) {
                          setSelectedFormId(activeForms[0].id);
                        }
                      }}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <FileSpreadsheet size={14} className="text-blue-600" />
                        Form / Survey CTA Button
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Link delegates directly to an active questionnaire, feedback survey, or intake form.
                      </span>
                    </div>
                  </label>
                </div>

                {includeFormButton && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4 pt-3.5 border-t border-blue-200/60">
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Select Target Form
                      </label>
                      <SearchableSelect
                        value={selectedFormId}
                        onChange={(val) => setSelectedFormId(val)}
                        options={[
                          ...activeForms.map(f => ({
                            value: f.id,
                            label: `📋 ${f.title || f.name || "Untitled Form"} (${f.submissionsCount || 0} responses)`
                          })),
                          { value: "custom_url", label: "🔗 Enter Custom Form / Survey URL..." }
                        ]}
                        placeholder="Choose an event form..."
                      />
                    </div>

                    {selectedFormId === "custom_url" && (
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Custom Survey URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://forms.google.com/... or https://typeform.com/..."
                          value={customFormUrl}
                          onChange={(e) => setCustomFormUrl(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Button CTA Label
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Complete 2-Minute Feedback Form →"
                        value={formButtonText}
                        onChange={(e) => setFormButtonText(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-850 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Widget 2: Ticket / Badge Registration Button */}
              <div className={`p-4 rounded-2xl border transition-all ${
                includeTicketButton ? "bg-indigo-50/40 border-indigo-200" : "bg-slate-50/50 border-slate-200"
              }`}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeTicketButton}
                      onChange={(e) => setIncludeTicketButton(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Ticket size={14} className="text-indigo-600" />
                        Digital Badge Pass Button
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Direct CTA leading recipient to view and download their official digital badge pass.
                      </span>
                    </div>
                  </label>
                </div>

                {includeTicketButton && (
                  <div className="flex flex-col gap-1 mt-4 pt-3.5 border-t border-indigo-200/60">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Button Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 🎟️ View My Digital Event Badge"
                      value={ticketButtonText}
                      onChange={(e) => setTicketButtonText(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-850 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Widget 3: Secondary Custom CTA Button */}
              <div className={`p-4 rounded-2xl border transition-all ${
                includeCustomButton ? "bg-slate-100 border-slate-300" : "bg-slate-50/50 border-slate-200"
              }`}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeCustomButton}
                      onChange={(e) => setIncludeCustomButton(e.target.checked)}
                      className="w-4 h-4 rounded text-slate-700 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <ExternalLink size={14} className="text-slate-600" />
                        Secondary Custom CTA Button
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Link to external schedules, hotel bookings, sponsor brochures, or floor plan viewer.
                      </span>
                    </div>
                  </label>
                </div>

                {includeCustomButton && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-slate-200">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Button Text
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. View Floor Plan Map"
                        value={customButtonText}
                        onChange={(e) => setCustomButtonText(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-850 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Target Link URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={customButtonUrl}
                        onChange={(e) => setCustomButtonUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Widget 4 & 5: Check-in QR & Event Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="flex items-center gap-2.5 p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeQr}
                    onChange={(e) => setIncludeQr(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <QrIcon size={14} className="text-blue-600" />
                      Embed Fast-Track QR Pass
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold">Generates personalized QR pass</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeEventCard}
                    onChange={(e) => setIncludeEventCard(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar size={14} className="text-blue-600" />
                      Include Event Details Card
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold">Shows date, venue & host details</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between gap-3 bg-white border border-slate-250/70 rounded-3xl p-5 shadow-sm">
              <button
                type="button"
                onClick={() => setIsTestModalOpen(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Mail size={14} />
                <span>Send Test Preview to Me</span>
              </button>

              <button
                type="button"
                disabled={isSending || targetRecipients.length === 0 || !subject.trim() || !body.trim()}
                onClick={() => setIsConfirmModalOpen(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-600/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:transform-none"
              >
                <Send size={15} />
                <span>Dispatch Broadcast ({targetRecipients.length} Recipients) →</span>
              </button>
            </div>
          </div>

          {/* Right Live Email Simulator Pane (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4 sticky top-6">
            <div className="bg-white border border-slate-250/70 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
              {/* Simulator Header & Controls */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-blue-600" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Live Email Simulator
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Theme Switcher */}
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewTheme("light")}
                      className={`p-1 rounded-md transition-all cursor-pointer ${
                        previewTheme === "light" ? "bg-white text-amber-500 shadow-xs" : "text-slate-400"
                      }`}
                      title="Light Mode Preview"
                    >
                      <Sun size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTheme("dark")}
                      className={`p-1 rounded-md transition-all cursor-pointer ${
                        previewTheme === "dark" ? "bg-slate-900 text-blue-400 shadow-xs" : "text-slate-400"
                      }`}
                      title="Dark Mode Preview"
                    >
                      <Moon size={13} />
                    </button>
                  </div>

                  {/* Device Switcher */}
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={`p-1 rounded-md transition-all cursor-pointer ${
                        previewDevice === "desktop" ? "bg-white text-blue-600 shadow-xs" : "text-slate-400"
                      }`}
                      title="Desktop View"
                    >
                      <Monitor size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={`p-1 rounded-md transition-all cursor-pointer ${
                        previewDevice === "mobile" ? "bg-white text-blue-600 shadow-xs" : "text-slate-400"
                      }`}
                      title="Mobile View"
                    >
                      <Smartphone size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sample Recipient Selector */}
              {targetRecipients.length > 1 && (
                <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Previewing as:</span>
                  <select
                    value={previewAttendeeIndex}
                    onChange={(e) => setPreviewAttendeeIndex(parseInt(e.target.value, 10))}
                    className="bg-transparent text-[11px] font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[200px] truncate"
                  >
                    {targetRecipients.slice(0, 15).map((rec, idx) => (
                      <option key={rec.id || idx} value={idx}>
                        {rec.name} ({rec.ticketTier})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Live Rendered Email Container */}
              <div className={`rounded-2xl transition-all overflow-hidden border ${
                previewTheme === "dark" 
                  ? "bg-slate-950 border-slate-800 text-slate-100" 
                  : "bg-slate-100 border-slate-200 text-slate-850"
              } ${previewDevice === "mobile" ? "max-w-[340px] mx-auto shadow-2xl" : "w-full"}`}>
                
                {/* Email Client Top Bar */}
                <div className={`px-4 py-3 border-b text-[11px] flex flex-col gap-1 transition-colors ${
                  previewTheme === "dark" ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-500"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-extrabold truncate max-w-[200px] text-xs ${
                      previewTheme === "dark" ? "text-slate-100" : "text-slate-850"
                    }`}>
                      {interpolateText(subject) || "Subject Line Preview"}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400">Just now</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="font-bold text-slate-400">From:</span>
                    <span className={`font-semibold truncate ${
                      previewTheme === "dark" ? "text-slate-300" : "text-slate-700"
                    }`}>
                      {eventDetails?.organizerName || currentUser?.name || "Eventzone"} &lt;contact@eventzone.pro&gt;
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="font-bold text-slate-400">To:</span>
                    <span className="font-semibold text-blue-500 truncate">{sampleAttendee?.email}</span>
                  </div>
                </div>

                {/* Email Card Inner */}
                <div className="p-4 sm:p-5">
                  <div className={`rounded-2xl overflow-hidden border shadow-sm transition-colors ${
                    previewTheme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                  }`}>
                    {/* Header Banner */}
                    <div className={`p-4 border-b transition-colors ${
                      previewTheme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                    }`}>
                      {eventDetails?.eventLogo && (
                        <img src={eventDetails.eventLogo} alt="Logo" className="max-h-8 max-w-[140px] object-contain mb-2" />
                      )}
                      <h2 className={`text-base font-black tracking-tight ${
                        previewTheme === "dark" ? "text-slate-100" : "text-slate-900"
                      }`}>
                        {eventDetails?.title || "Eventzone Summit"}
                      </h2>
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-0.5">
                        Official Event Broadcast
                      </p>
                    </div>

                    {/* Email Content Body */}
                    <div className="p-4 sm:p-5 flex flex-col gap-4 text-xs font-semibold leading-relaxed">
                      <div className={`border-l-4 border-blue-500 pl-3.5 py-1.5 whitespace-pre-wrap rounded-r-xl transition-colors ${
                        previewTheme === "dark" 
                          ? "bg-slate-800/70 border-blue-400 text-slate-100" 
                          : "bg-slate-50 border-blue-600 text-slate-800"
                      }`}>
                        {interpolateText(body) || "Your email content will render here dynamically..."}
                      </div>

                      {/* Rendered Action Buttons */}
                      {includeFormButton && (
                        <div className={`text-center p-3.5 border rounded-xl my-1 transition-colors ${
                          previewTheme === "dark" ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200"
                        }`}>
                          <div className={`text-[11px] font-extrabold mb-2 ${
                            previewTheme === "dark" ? "text-slate-100" : "text-slate-900"
                          }`}>
                            Action Required: Event Questionnaire
                          </div>
                          <div className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/30">
                            {formButtonText || "Complete Form"} →
                          </div>
                        </div>
                      )}

                      {includeTicketButton && (
                        <div className="text-center my-1">
                          <div className={`inline-block font-black text-xs px-5 py-2.5 rounded-xl shadow-md ${
                            previewTheme === "dark" 
                              ? "bg-slate-800 text-white border border-slate-700 shadow-slate-950/40" 
                              : "bg-slate-900 text-white shadow-slate-900/20"
                          }`}>
                            {ticketButtonText || "🎟️ View My Event Badge"} →
                          </div>
                        </div>
                      )}

                      {includeCustomButton && (
                        <div className="text-center my-1">
                          <div className={`inline-block font-bold text-xs px-4 py-2 rounded-xl transition-colors ${
                            previewTheme === "dark" 
                              ? "bg-slate-800 border border-slate-700 text-slate-200" 
                              : "bg-slate-100 border border-slate-300 text-slate-850"
                          }`}>
                            🔗 {customButtonText || "Visit Resource"} →
                          </div>
                        </div>
                      )}

                      {/* Rendered Fast-Track QR Pass */}
                      {includeQr && (
                        <div className={`text-center p-4 border-2 border-dashed rounded-2xl my-2 transition-colors ${
                          previewTheme === "dark" ? "bg-slate-850/80 border-slate-700" : "bg-slate-50 border-slate-250"
                        }`}>
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider block mb-2">
                            Fast-Track Check-In Pass
                          </span>
                          <div className="bg-white p-2.5 rounded-xl inline-block shadow-sm">
                            <div className="w-24 h-24 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                              <QrIcon size={56} />
                            </div>
                          </div>
                          <span className={`text-[9px] font-semibold block mt-1.5 ${
                            previewTheme === "dark" ? "text-slate-400" : "text-slate-400"
                          }`}>
                            Pass Code: {sampleAttendee?.badgeCode || "EZ-PASS"}
                          </span>
                        </div>
                      )}

                      {/* Rendered Event Details Card */}
                      {includeEventCard && (
                        <div className={`border rounded-xl p-3 text-[10px] transition-colors ${
                          previewTheme === "dark" ? "bg-slate-850/80 border-slate-700" : "bg-slate-50 border-slate-200"
                        }`}>
                          <span className={`font-extrabold uppercase tracking-wider block mb-2 pb-1 border-b ${
                            previewTheme === "dark" ? "text-slate-400 border-slate-700" : "text-slate-400 border-slate-200"
                          }`}>
                            Event Highlights
                          </span>
                          <div className={`flex justify-between py-1 border-b ${
                            previewTheme === "dark" ? "border-slate-800" : "border-slate-150"
                          }`}>
                            <span className="text-slate-400 font-bold">📅 Date:</span>
                            <span className={`font-black ${
                              previewTheme === "dark" ? "text-slate-100" : "text-slate-900"
                            }`}>{eventDetails?.startDate || "Oct 2026"}</span>
                          </div>
                          <div className={`flex justify-between py-1 border-b ${
                            previewTheme === "dark" ? "border-slate-800" : "border-slate-150"
                          }`}>
                            <span className="text-slate-400 font-bold">📍 Venue:</span>
                            <span className={`font-black ${
                              previewTheme === "dark" ? "text-slate-100" : "text-slate-900"
                            }`}>{eventDetails?.location || "Grand Hall"}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-400 font-bold">🏛️ Host:</span>
                            <span className={`font-black ${
                              previewTheme === "dark" ? "text-slate-100" : "text-slate-900"
                            }`}>{eventDetails?.organizerName || "Organizer"}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Email Footer */}
                    <div className={`p-3.5 border-t text-center text-[9px] font-semibold transition-colors ${
                      previewTheme === "dark" 
                        ? "bg-slate-950 border-slate-800 text-slate-400" 
                        : "bg-slate-50 border-slate-100 text-slate-400"
                    }`}>
                      <p className="m-0">Dispatched securely via <strong className={previewTheme === "dark" ? "text-slate-200" : "text-slate-700"}>Eventzone Platform</strong></p>
                      <p className="m-0 mt-0.5">Sent to registered participants of {eventDetails?.title || "Summit"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: BROADCAST HISTORY & OPEN ANALYTICS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="flex flex-col gap-6">
          {/* Summary Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-250/70 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Broadcasts</span>
                <Send size={18} className="text-blue-600" />
              </div>
              <span className="text-2xl font-black text-slate-900">{aggregateMetrics.totalBroadcasts}</span>
              <span className="text-[10px] text-slate-400 font-semibold mt-1">Dispatched campaigns</span>
            </div>

            <div className="bg-white border border-slate-250/70 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Emails Sent</span>
                <Users size={18} className="text-indigo-600" />
              </div>
              <span className="text-2xl font-black text-slate-900">{aggregateMetrics.totalEmailsSent}</span>
              <span className="text-[10px] text-slate-400 font-semibold mt-1">Delivered via SMTP</span>
            </div>

            <div className="bg-white border border-slate-250/70 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Unique Opens</span>
                <Eye size={18} className="text-emerald-600" />
              </div>
              <span className="text-2xl font-black text-emerald-600">{aggregateMetrics.totalUniqueOpens}</span>
              <span className="text-[10px] text-slate-400 font-semibold mt-1">Confirmed readers</span>
            </div>

            <div className="bg-white border border-slate-250/70 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Average Open Rate</span>
                <Activity size={18} className="text-amber-500" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-slate-900">{aggregateMetrics.avgOpenRate}%</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(aggregateMetrics.avgOpenRate, 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold mt-1">Audience engagement pace</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-250/70 rounded-2xl p-4 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search history by subject or content..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold"
              />
            </div>

            <span className="text-xs font-bold text-slate-500">
              Showing {filteredHistory.length} broadcast{filteredHistory.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* History List */}
          {historyLoading ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-xs font-bold text-slate-400">
              Loading broadcast history and real-time open statistics...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Mail size={24} />
              </div>
              <h3 className="text-sm font-black text-slate-850">No Broadcast Announcements Found</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Dispatch your first announcement to participants to track delivery, open rates, and engagement.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("compose")}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Compose Announcement Now →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredHistory.map((item) => {
                const sentDate = item.sent_at ? new Date(item.sent_at) : new Date();
                const recipientCount = item.recipient_count || 0;
                const uniqueOpens = item.unique_opens_count || 0;
                const openRate = recipientCount > 0 ? Math.round((uniqueOpens / recipientCount) * 100) : 0;

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-250/70 hover:border-blue-300 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 mt-0.5">
                        <Send size={18} />
                      </div>

                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                            {recipientCount} Recipient{recipientCount === 1 ? "" : "s"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {sentDate.toLocaleDateString()} at {sentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {item.include_qr && (
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                              <QrIcon size={10} /> QR Pass
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-black text-slate-900 truncate">{formatEventText(item.subject)}</h3>
                        <p className="text-xs font-semibold text-slate-500 line-clamp-1 max-w-xl">
                          {formatEventText(item.body)}
                        </p>
                      </div>
                    </div>

                    {/* Open Rate & Actions */}
                    <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      {/* Open Rate Meter */}
                      <div className="flex flex-col items-start md:items-end">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900">{openRate}%</span>
                          <span className="text-[10px] font-bold text-slate-400">Open Rate</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {uniqueOpens} / {recipientCount} Opened
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenRecipientLog(item)}
                          className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                          title="View Recipient Open Logs"
                        >
                          <Activity size={14} />
                          <span>View Analytics</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCloneBroadcast(item)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                          title="Clone into Compose Builder"
                        >
                          <RotateCcw size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBroadcast(item.id)}
                          className="p-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-xl transition-colors cursor-pointer"
                          title="Delete Broadcast"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: TEMPLATE LIBRARY */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "templates" && (
        <div className="flex flex-col gap-6">
          {/* Header & Category Filters */}
          <div className="flex flex-col gap-4 bg-white border border-slate-250/70 rounded-3xl p-5 shadow-sm">
            {/* Top row: Title & Create New Template Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Event Template Library
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Select from 10+ professionally crafted email layouts, customize trigger emails, or build new custom templates.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenEditor({
                  id: null,
                  title: "My Custom Template",
                  name: "My Custom Template",
                  category: "custom",
                  subject: "Announcement regarding {{eventTitle}}",
                  preheader: "Important updates and announcements for {{eventTitle}}.",
                  body: `Hello {{name}},\n\nWrite your announcement here...\n\nBest regards,\n{{organizerName}}`,
                  includeQr: false,
                  buttonConfig: {}
                }, false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <Plus size={14} />
                <span>Create New Template</span>
              </button>
            </div>

            {/* Bottom row: Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-slate-100 no-scrollbar">
              {[
                { id: "all", label: "All Templates" },
                { id: "attendees", label: "Attendees & Passes" },
                { id: "logistics", label: "Logistics & Alerts" },
                { id: "partners", label: "Sponsors & Speakers" },
                { id: "surveys", label: "Surveys & Feedback" },
                { id: "custom", label: "Saved Custom" }
              ].map(({ id, label }) => {
                const count = id === "all" 
                  ? [...PRESET_TEMPLATES, ...customTemplates.filter(ct => !ct.is_trigger)].length
                  : [...PRESET_TEMPLATES, ...customTemplates.filter(ct => !ct.is_trigger)].filter(t => t.category === id).length;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTemplateFilterCategory(id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      templateFilterCategory === id
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                      templateFilterCategory === id ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-500"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...PRESET_TEMPLATES, ...customTemplates.filter(ct => !ct.is_trigger)]
              .filter(tmpl => templateFilterCategory === "all" || tmpl.category === templateFilterCategory)
              .map((tmpl) => {
                const IconComp = tmpl.icon || FileText;
                const isCustom = Boolean(customTemplates.some(ct => ct.id === tmpl.id));

                return (
                  <div
                    key={tmpl.id}
                    className="bg-white border border-slate-250/70 hover:border-blue-400 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <IconComp size={18} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isCustom && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              Custom Preset
                            </span>
                          )}
                          <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {tmpl.categoryLabel || tmpl.category}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                          {tmpl.title || tmpl.name}
                        </h3>
                        <p className="text-[11px] font-semibold text-slate-500 mt-1 line-clamp-2">
                          {tmpl.description || "Reusable custom template"}
                        </p>
                      </div>

                      {/* Subject Preview */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Subject</span>
                        <p className="text-[11px] font-bold text-slate-800 truncate mt-0.5">
                          {formatEventText(tmpl.subject)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomTemplate(tmpl.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete Template"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditor(tmpl, false)}
                        className="p-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-xl transition-colors cursor-pointer"
                        title="Customize & Edit Template"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplateId(tmpl.id);
                          setSubject(tmpl.subject || "");
                          setBody(tmpl.body || "");
                          setPreheader(tmpl.preheader || "");
                          setIncludeQr(Boolean(tmpl.include_qr || tmpl.includeQr));
                          if (tmpl.button_config || tmpl.buttonConfig) {
                            const cfg = typeof (tmpl.button_config || tmpl.buttonConfig) === "string"
                              ? JSON.parse(tmpl.button_config || tmpl.buttonConfig)
                              : (tmpl.button_config || tmpl.buttonConfig);
                            setIncludeFormButton(Boolean(cfg.includeFormButton));
                            setFormButtonText(cfg.formButtonText || "Complete Form");
                            setIncludeTicketButton(Boolean(cfg.includeTicketButton));
                            setTicketButtonText(cfg.ticketButtonText || "View My Event Badge");
                            setIncludeCustomButton(Boolean(cfg.includeCustomButton));
                            setCustomButtonText(cfg.customButtonText || "Visit Resource");
                            setCustomButtonUrl(cfg.customButtonUrl || "");
                          }
                          setActiveTab("compose");
                          showToast("success", `Template "${tmpl.title || tmpl.name}" loaded into Compose builder!`);
                        }}
                        className="flex-1 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Use in Compose</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 4: AUTOMATED TRIGGERS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "triggers" && (
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-250/70 rounded-3xl p-6 shadow-sm flex flex-col gap-2">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Automated Event Triggers & System Notifications
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              Eventzone automatically dispatches branded transactional notifications upon key participant actions. You can customize the email wording, action buttons, and fast-track QR passes for every trigger.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {AUTOMATED_TRIGGERS_CONFIG.map((triggerDef) => {
              const config = getTriggerConfig(triggerDef);

              return (
                <div key={triggerDef.id} className="bg-white border border-slate-250/70 hover:border-blue-300 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-5 transition-all">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-900">{config.title}</span>
                      <div className="flex items-center gap-1.5">
                        {config.isCustomized ? (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Sparkles size={11} /> Customized
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {config.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-slate-500">{config.trigger}</p>

                    {/* Subject Line Preview */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col gap-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Trigger Subject</span>
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {formatEventText(config.subject)}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Included Assets & Settings</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {config.features.map((feat, fidx) => (
                          <div key={fidx} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                    {config.isCustomized ? (
                      <button
                        type="button"
                        onClick={() => handleResetTrigger(triggerDef.id)}
                        className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Restore system default template"
                      >
                        <RotateCcw size={13} />
                        <span>Reset to Default</span>
                      </button>
                    ) : <div />}

                    <button
                      type="button"
                      onClick={() => handleOpenEditor(triggerDef, true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit3 size={13} />
                      <span>Customize Template →</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 1: RECIPIENT LIST INSPECTION & CUSTOM PICKER */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isRecipientModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    {recipientGroup === "custom" ? "Select Custom Recipients" : "Target Recipient Roster"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecipientModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search in recipients */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, company, or role..."
                  value={recipientSearchTerm}
                  onChange={(e) => setRecipientSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Recipients Table List */}
              <div className="flex-1 overflow-y-auto max-h-[380px] border border-slate-100 rounded-2xl">
                {targetRecipients.length === 0 ? (
                  <div className="p-8 text-center text-xs font-bold text-slate-400">
                    No recipients matching current filter criteria.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {targetRecipients
                      .filter(r => {
                        if (!recipientSearchTerm) return true;
                        const q = recipientSearchTerm.toLowerCase();
                        return (
                          (r.name || "").toLowerCase().includes(q) ||
                          (r.email || "").toLowerCase().includes(q) ||
                          (r.company || "").toLowerCase().includes(q) ||
                          (r.ticketTier || "").toLowerCase().includes(q)
                        );
                      })
                      .map((rec) => {
                        const isSelected = customSelectedEmails.includes(rec.email.toLowerCase());
                        return (
                          <div
                            key={rec.email}
                            className={`p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors ${
                              recipientGroup === "custom" ? "cursor-pointer" : ""
                            }`}
                            onClick={() => {
                              if (recipientGroup === "custom") {
                                const emailLower = rec.email.toLowerCase();
                                setCustomSelectedEmails(prev =>
                                  prev.includes(emailLower)
                                    ? prev.filter(e => e !== emailLower)
                                    : [...prev, emailLower]
                                );
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {recipientGroup === "custom" && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                                />
                              )}
                              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center">
                                {(rec.name || "A")[0].toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-900">{rec.name}</span>
                                <span className="text-[11px] text-slate-500 font-semibold">{rec.email}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {rec.company && (
                                <span className="text-[10px] font-semibold text-slate-500 hidden sm:inline">
                                  {rec.company}
                                </span>
                              )}
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                {rec.ticketTier || rec.role}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-slate-500">
                  {targetRecipients.length} total recipients
                </span>
                <button
                  type="button"
                  onClick={() => setIsRecipientModalOpen(false)}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 2: SEND TEST EMAIL MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isTestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Send Test Preview Email
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-slate-500 font-semibold">
                Dispatch an instant test copy of this broadcast to your personal inbox to verify styling, button links, and mobile responsiveness.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Test Email Destination
                </label>
                <input
                  type="email"
                  required
                  placeholder="your.email@company.com"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isTestSending || !testEmailAddress}
                  onClick={handleSendTestEmail}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isTestSending ? (
                    <span>Sending Test...</span>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Send Test Now</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 3: BROADCAST DISPATCH CONFIRMATION */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Send size={18} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Confirm Broadcast Announcement
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => !isSending && setIsConfirmModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-600 font-semibold">
                  You are about to broadcast an official email announcement to <strong>{targetRecipients.length} recipients</strong> with live open tracking enabled.
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Subject</span>
                    <span className="text-slate-900 font-bold truncate max-w-[240px]">{subject}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Recipient Group</span>
                    <span className="text-blue-700 font-bold uppercase tracking-wider text-[10px]">{recipientGroup}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Total Recipients</span>
                    <span className="text-slate-900 font-black">{targetRecipients.length}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Open Tracking</span>
                    <span className="text-emerald-600 font-black flex items-center gap-1">
                      <Check size={13} /> Active (1x1 Pixel)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isSending}
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSending}
                  onClick={handleSendBroadcast}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSending ? (
                    <span>Broadcasting Emails...</span>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Confirm & Send Now</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 4: SAVE AS CUSTOM TEMPLATE */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isSaveTemplateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Save as Custom Template
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSaveTemplateModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Template Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Speaker Setup Reminder"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Category
                </label>
                <SearchableSelect
                  value={newTemplateCategory}
                  onChange={(val) => setNewTemplateCategory(val)}
                  options={[
                    { value: "attendees", label: "Attendees & Passes" },
                    { value: "logistics", label: "Logistics & Alerts" },
                    { value: "partners", label: "Sponsors & Exhibitors" },
                    { value: "surveys", label: "Surveys & Feedback" },
                    { value: "custom", label: "General Custom" }
                  ]}
                  placeholder="Select Category"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveTemplateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!newTemplateName.trim()}
                  onClick={handleSaveAsTemplate}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Save Template
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* DRAWER / MODAL 5: DETAILED RECIPIENT OPEN TRACKING LOG */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedHistoryItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900 truncate max-w-lg">
                    {formatEventText(selectedHistoryItem.subject)}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    Sent on {new Date(selectedHistoryItem.sent_at).toLocaleString()} • {selectedHistoryItem.recipient_count || recipientLogs.length} Recipients
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedHistoryItem(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Metrics Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Total Sent</span>
                  <span className="text-base font-black text-slate-900">{selectedHistoryItem.recipient_count || 0}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Unique Opens</span>
                  <span className="text-base font-black text-emerald-600">
                    {recipientLogs.filter(l => (l.open_count > 0) || l.status === "opened" || l.opened_at).length}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Total Opens</span>
                  <span className="text-base font-black text-indigo-600">
                    {recipientLogs.reduce((sum, l) => sum + (l.open_count || 0), 0)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Open Rate</span>
                  <span className="text-base font-black text-blue-600">
                    {selectedHistoryItem.recipient_count > 0
                      ? Math.round(
                          (recipientLogs.filter(l => (l.open_count > 0) || l.status === "opened" || l.opened_at).length /
                            selectedHistoryItem.recipient_count) *
                            100
                        )
                      : 0}%
                  </span>
                </div>
              </div>

              {/* Search, Simulation & Export bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search recipients or email..."
                    value={recipientLogSearch}
                    onChange={(e) => setRecipientLogSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportTrackingCsv}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Tracking Notice */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-[11px] text-blue-900 font-semibold">
                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>
                    <strong>Open Tracking Active:</strong> A 1x1 transparent tracking pixel is embedded in each sent email. When opened in an email client (Gmail, Outlook, Apple Mail), the pixel logs the timestamp and increments open counts in real time.
                  </span>
                </div>
              </div>

              {/* Recipient Logs Table */}
              <div className="flex-1 overflow-y-auto max-h-[380px] border border-slate-150 rounded-2xl">
                {recipientLogsLoading ? (
                  <div className="p-8 text-center text-xs font-bold text-slate-400">
                    Loading recipient open timestamps...
                  </div>
                ) : recipientLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs font-bold text-slate-400">
                    No recipient tracking rows found for this broadcast.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        <th className="p-3 pl-4">Recipient</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Open Count</th>
                        <th className="p-3">First Opened At</th>
                        <th className="p-3">Last Activity</th>
                        <th className="p-3 pr-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {recipientLogs
                        .filter(l => {
                          if (!recipientLogSearch) return true;
                          const q = recipientLogSearch.toLowerCase();
                          return (
                            (l.recipient_email || "").toLowerCase().includes(q) ||
                            (l.recipient_name || "").toLowerCase().includes(q)
                          );
                        })
                        .map((log) => {
                          const hasOpened = (log.open_count > 0) || log.status === "opened" || log.opened_at;
                          return (
                            <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="p-3 pl-4">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900">{log.recipient_name || "Attendee"}</span>
                                  <span className="text-[11px] text-slate-400">{log.recipient_email}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                {hasOpened ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <Check size={11} /> Opened
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                    Delivered
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-bold text-slate-850">
                                {log.open_count || (hasOpened ? 1 : 0)} time{(log.open_count || 1) === 1 ? "" : "s"}
                              </td>
                              <td className="p-3 text-[11px] text-slate-500">
                                {log.opened_at ? new Date(log.opened_at).toLocaleString() : "—"}
                              </td>
                              <td className="p-3 text-[11px] text-slate-400">
                                {log.last_opened_at ? new Date(log.last_opened_at).toLocaleTimeString() : "—"}
                              </td>
                              <td className="p-3 pr-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyTrackingPixelUrl(log)}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                                    title="Copy 1x1 Pixel URL"
                                  >
                                    <Copy size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedHistoryItem(null)}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 6: INTERACTIVE TRIGGER & TEMPLATE CUSTOMIZER & SIMULATOR */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isEditingTemplateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-6xl w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[92vh] my-auto overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        {editingTemplateData?.isTrigger
                          ? `Customize Trigger: ${editingTemplateData.title}`
                          : `Edit Template: ${editModalName || "Custom Template"}`}
                      </h3>
                      {editingTemplateData?.isTrigger && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Automated Trigger
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      {editingTemplateData?.isTrigger
                        ? "Edits will automatically customize this transactional notification for this event."
                        : "Modify email content, preheaders, action buttons, and save updates to your library."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingTemplateModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Split Body (Left Editor, Right Live Simulator) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-y-auto min-h-0 pr-1">
                {/* Left Form Controls (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-5">
                  {/* Template Title & Category (if library template) */}
                  {!editingTemplateData?.isTrigger && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                          Template Name
                        </label>
                        <input
                          type="text"
                          value={editModalName}
                          onChange={(e) => setEditModalName(e.target.value)}
                          placeholder="e.g. VIP Registration Invitation"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-850 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                          Category
                        </label>
                        <select
                          value={editModalCategory}
                          onChange={(e) => setEditModalCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-850 focus:border-blue-500 focus:outline-none cursor-pointer"
                        >
                          <option value="attendees">Attendees & Passes</option>
                          <option value="logistics">Logistics & Alerts</option>
                          <option value="partners">Sponsors & Speakers</option>
                          <option value="surveys">Surveys & Feedback</option>
                          <option value="custom">Custom Presets</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Subject Line Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                        Subject Line
                      </label>
                      <span className="text-[10px] font-bold text-slate-400">
                        {editModalSubject.length} chars
                      </span>
                    </div>
                    <input
                      ref={editSubjectRef}
                      type="text"
                      value={editModalSubject}
                      onFocus={() => setEditModalLastFocused("subject")}
                      onChange={(e) => setEditModalSubject(e.target.value)}
                      placeholder="e.g. Your Badge Pass for {{eventTitle}}"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-850 focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Preheader Line Field */}
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                      Preheader Preview Text
                    </label>
                    <input
                      ref={editPreheaderRef}
                      type="text"
                      value={editModalPreheader}
                      onFocus={() => setEditModalLastFocused("preheader")}
                      onChange={(e) => setEditModalPreheader(e.target.value)}
                      placeholder="e.g. Your official pass and fast-track access QR code inside."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-850 focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Dynamic Variables Inserter Ribbon */}
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-amber-500" />
                        <span>Insert Dynamic Tag at Cursor</span>
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Active Field: <strong className="text-blue-600 uppercase">{editModalLastFocused}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { label: "{{name}}", desc: "Full Name" },
                        { label: "{{first_name}}", desc: "First Name" },
                        { label: "{{ticketTier}}", desc: "Ticket Tier" },
                        { label: "{{badgeCode}}", desc: "Badge Code" },
                        { label: "{{company}}", desc: "Company" },
                        { label: "{{jobTitle}}", desc: "Job Title" },
                        { label: "{{eventTitle}}", desc: "Event Title" },
                        { label: "{{eventDate}}", desc: "Event Date" },
                        { label: "{{venue}}", desc: "Venue" },
                        { label: "{{organizerName}}", desc: "Organizer" }
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleInsertVariableInEditModal(item.label)}
                          className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message Body Field */}
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                      Email Message Body (Markdown Supported)
                    </label>
                    <textarea
                      ref={editBodyRef}
                      rows={8}
                      value={editModalBody}
                      onFocus={() => setEditModalLastFocused("body")}
                      onChange={(e) => setEditModalBody(e.target.value)}
                      placeholder="Write your email body here..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-850 focus:border-blue-500 focus:bg-white focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Feature Checkboxes & Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* QR Code Pass Toggle */}
                    <label className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={editModalIncludeQr}
                        onChange={(e) => setEditModalIncludeQr(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <QrIcon size={14} className="text-blue-600" />
                          <span>Include Fast-Track QR Pass</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          Generates scannable QR pass for each recipient
                        </span>
                      </div>
                    </label>

                    {/* Ticket / Badge Button Toggle */}
                    <label className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={editModalIncludeTicketBtn}
                        onChange={(e) => setEditModalIncludeTicketBtn(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Ticket size={14} className="text-indigo-600" />
                          <span>Badge Pass Action Button</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          Links directly to digital attendee pass
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Form & Custom Buttons Configuration */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Interactive CTA Buttons
                    </span>

                    {/* Form Button */}
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editModalIncludeFormBtn}
                          onChange={(e) => setEditModalIncludeFormBtn(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span className="text-xs font-bold text-slate-800">Include Form / Survey CTA Button</span>
                      </label>
                      {editModalIncludeFormBtn && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                          <input
                            type="text"
                            placeholder="Button Text"
                            value={editModalFormBtnText}
                            onChange={(e) => setEditModalFormBtnText(e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                          />
                          <input
                            type="text"
                            placeholder="Custom Form URL (Optional)"
                            value={editModalFormUrl}
                            onChange={(e) => setEditModalFormUrl(e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                      )}
                    </div>

                    {/* Custom Button */}
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editModalIncludeCustomBtn}
                          onChange={(e) => setEditModalIncludeCustomBtn(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span className="text-xs font-bold text-slate-800">Include Secondary Resource CTA Button</span>
                      </label>
                      {editModalIncludeCustomBtn && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                          <input
                            type="text"
                            placeholder="Button Text (e.g. View Floor Plan)"
                            value={editModalCustomBtnText}
                            onChange={(e) => setEditModalCustomBtnText(e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                          />
                          <input
                            type="text"
                            placeholder="Resource URL (e.g. https://...)"
                            value={editModalCustomBtnUrl}
                            onChange={(e) => setEditModalCustomBtnUrl(e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Live Responsive Email Simulator (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Eye size={14} className="text-blue-600" />
                      <span>Live Email Simulator</span>
                    </span>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setEditModalPreviewDevice("desktop")}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          editModalPreviewDevice === "desktop" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500"
                        }`}
                        title="Desktop View (600px)"
                      >
                        <Monitor size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditModalPreviewDevice("mobile")}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          editModalPreviewDevice === "mobile" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500"
                        }`}
                        title="Mobile View (340px)"
                      >
                        <Smartphone size={14} />
                      </button>
                      <div className="w-[1px] h-3 bg-slate-300 mx-0.5" />
                      <button
                        type="button"
                        onClick={() => setEditModalPreviewTheme(editModalPreviewTheme === "light" ? "dark" : "light")}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          editModalPreviewTheme === "dark" ? "bg-slate-800 text-amber-400 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                        }`}
                        title="Toggle Light / Dark Mode"
                      >
                        {editModalPreviewTheme === "light" ? <Moon size={14} /> : <Sun size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Simulator Container */}
                  <div className="flex-1 bg-slate-100/80 border border-slate-200 rounded-2xl p-3 flex items-start justify-center overflow-y-auto max-h-[560px]">
                    <div
                      className={`transition-all rounded-2xl shadow-lg border overflow-hidden flex flex-col ${
                        editModalPreviewDevice === "mobile" ? "max-w-[340px] w-full" : "w-full max-w-[480px]"
                      } ${
                        editModalPreviewTheme === "dark"
                          ? "bg-slate-900 border-slate-800 text-slate-100"
                          : "bg-white border-slate-200 text-slate-900"
                      }`}
                    >
                      {/* Email Header */}
                      <div className={`p-4 text-center border-b flex flex-col items-center gap-1.5 ${
                        editModalPreviewTheme === "dark" ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-100"
                      }`}>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-600/10 text-blue-600">
                          {editingTemplateData?.isTrigger ? "System Automated Notification" : "Official Event Announcement"}
                        </span>
                        <h4 className="text-sm font-black tracking-tight mt-0.5">
                          {eventDetails?.title || "Eventzone Summit & Expo"}
                        </h4>
                      </div>

                      {/* Email Body */}
                      <div className="p-5 flex flex-col gap-3 text-xs">
                        <h5 className="text-sm font-black tracking-tight">
                          {interpolateText(editModalSubject || "Event Announcement")}
                        </h5>

                        <div className={`p-3.5 rounded-xl border leading-relaxed whitespace-pre-wrap ${
                          editModalPreviewTheme === "dark"
                            ? "bg-slate-800/80 border-slate-700/80 text-slate-200"
                            : "bg-slate-50/90 border-slate-200 text-slate-800"
                        }`}>
                          {interpolateText(editModalBody || "Write your message content...")}
                        </div>

                        {/* CTA Buttons */}
                        {editModalIncludeFormBtn && (
                          <div className="text-center my-1">
                            <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-xs">
                              {editModalFormBtnText || "Complete Form"} →
                            </span>
                          </div>
                        )}

                        {editModalIncludeTicketBtn && (
                          <div className="text-center my-1">
                            <span className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-xs">
                              🎟️ {editModalTicketBtnText || "View My Event Badge"} →
                            </span>
                          </div>
                        )}

                        {editModalIncludeCustomBtn && (
                          <div className="text-center my-1">
                            <span className="inline-block px-4 py-2 bg-slate-100 border border-slate-300 text-slate-800 rounded-xl font-bold text-xs">
                              🔗 {editModalCustomBtnText || "Access Resource"} →
                            </span>
                          </div>
                        )}

                        {/* QR Code Pass */}
                        {editModalIncludeQr && (
                          <div className={`p-3 rounded-xl border text-center my-1 flex flex-col items-center gap-1.5 ${
                            editModalPreviewTheme === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                          }`}>
                            <span className="text-[9px] font-black uppercase tracking-wider text-blue-600">
                              Fast-Track Check-In QR Pass
                            </span>
                            <div className="bg-white p-2 rounded-xl shadow-xs">
                              <QrIcon size={80} className="text-slate-900" />
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              Present upon arrival at reception
                            </span>
                          </div>
                        )}

                        {/* Footer */}
                        <div className={`pt-3 border-t text-[10px] text-center ${
                          editModalPreviewTheme === "dark" ? "border-slate-800 text-slate-500" : "border-slate-100 text-slate-400"
                        }`}>
                          Sent via <strong className="text-slate-600">Eventzone Platform</strong> • Organized by {eventDetails?.organizerName || currentUser?.name || "Eventzone"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  {editingTemplateData?.isTrigger && editingTemplateData?.isCustomized && (
                    <button
                      type="button"
                      onClick={async () => {
                        await handleResetTrigger(editingTemplateData.trigger_id || editingTemplateData.id);
                        setIsEditingTemplateModalOpen(false);
                      }}
                      className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw size={13} />
                      <span>Reset to System Default</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSendTestFromEditor}
                    disabled={isTestSendingEditTemplate}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send size={13} />
                    <span>{isTestSendingEditTemplate ? "Sending Test..." : "Send Test Preview"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingTemplateModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={isSavingEditTemplate || !editModalSubject.trim() || !editModalBody.trim()}
                    onClick={handleSaveEditedTemplate}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingEditTemplate ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Save & Apply Template</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
