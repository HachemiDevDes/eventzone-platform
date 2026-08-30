/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Building2,
  Sparkles,
  Store,
  Users,
  User,
  UserPlus,
  UserCheck,
  Mail,
  Phone,
  Globe,
  MapPin,
  Award,
  Check,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Info,
  ExternalLink,
  Plus,
  Briefcase,
  Layers,
  Trash2,
  DollarSign,
  Ticket,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import SearchableSelect from './SearchableSelect';
import CountryPhoneInput from './CountryPhoneInput';
import FormImageUploader from './FormImageUploader';

const INDUSTRIES_LIST = [
  "Technology, AI & Software",
  "Energy, Oil & Gas",
  "Renewable Energy & CleanTech",
  "Finance, Banking & FinTech",
  "Healthcare, Pharmaceuticals & Biotech",
  "Education, EdTech & Academia",
  "Manufacturing & Heavy Industry",
  "Transportation, Aviation & Logistics",
  "Real Estate, Architecture & Construction",
  "Retail, Consumer Goods & E-Commerce",
  "Media, Entertainment & Gaming",
  "Agriculture, AgriTech & Food Production",
  "Government, Defense & Public Sector",
  "Non-Profit, NGOs & Social Impact",
  "Hospitality, Travel & Tourism",
  "Aerospace, Defense & SpaceTech",
  "Automotive, EV & Future Mobility",
  "Telecommunications & Networking",
  "Chemicals, Materials & Mining",
  "Environmental, Climate & Sustainability",
  "Legal, Consulting & Professional Services",
  "Cybersecurity & Cloud Infrastructure",
  "Biotechnology & Life Sciences",
  "Fashion, Luxury & Apparel",
  "Sports, Fitness & Recreation",
  "Blockchain, Web3 & Digital Assets",
  "Venture Capital & Private Equity",
  "Robotics & Industrial Automation",
  "Supply Chain & Maritime Shipping",
  "Arts, Culture & Heritage",
  "Other / General Business"
];

const SPONSOR_TIERS = [
  { value: "diamond", label: "Diamond Tier", color: "text-sky-600 bg-sky-50 border-sky-200" },
  { value: "gold", label: "Gold Tier", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "silver", label: "Silver Tier", color: "text-slate-600 bg-slate-100 border-slate-200" },
  { value: "bronze", label: "Bronze Tier", color: "text-amber-800 bg-orange-50 border-orange-200" },
  { value: "title", label: "Title / Presenting Sponsor", color: "text-purple-700 bg-purple-50 border-purple-200" },
  { value: "partner", label: "Official Strategic Partner", color: "text-blue-700 bg-blue-50 border-blue-200" },
  { value: "custom", label: "Custom Sponsorship Package", color: "text-blue-700 bg-blue-50 border-blue-200" }
];

const BOOTH_TYPES = [
  { value: "Standard 3x3m (9 m²)", label: "Standard Booth 3x3m (9 m²)" },
  { value: "Premium Corner 6x3m (18 m²)", label: "Premium Corner 6x3m (18 m²)" },
  { value: "Island Pavilion 6x6m (36 m²)", label: "Island Pavilion 6x6m (36 m²)" },
  { value: "Startup Kiosk / Pod", label: "Startup Kiosk / Pod (4 m²)" },
  { value: "Custom Space", label: "Custom Exhibition Space" }
];
const BOOTH_TYPE_OPTIONS = BOOTH_TYPES;

const SPONSOR_PERKS_OPTIONS = [
  { id: "vip_passes", label: "VIP Delegate Passes Included" },
  { id: "keynote_slot", label: "Keynote / Panel Speaking Slot" },
  { id: "main_stage_branding", label: "Main Stage & Backdrop Logo" },
  { id: "exhibition_booth", label: "Complimentary Exhibition Booth" },
  { id: "email_blast", label: "Featured in Attendee Email Broadcasts" },
  { id: "badge_lanyard", label: "Logo on Physical Badges & Lanyards" },
  { id: "press_interview", label: "Official Press & Media Interview" },
  { id: "gift_bag", label: "Insert in VIP Gift Bags" }
];

function getAttendeePhoto(att) {
  if (!att) return "";
  if (att.image && typeof att.image === "string" && att.image.trim() && !att.image.includes("ui-avatars.com")) return att.image.trim();
  if (att.avatar && typeof att.avatar === "string" && att.avatar.trim() && !att.avatar.includes("ui-avatars.com")) return att.avatar.trim();
  if (att.photo && typeof att.photo === "string" && att.photo.trim()) return att.photo.trim();
  if (att.badgePicture && typeof att.badgePicture === "string" && att.badgePicture.trim()) return att.badgePicture.trim();
  if (att.badge_picture && typeof att.badge_picture === "string" && att.badge_picture.trim()) return att.badge_picture.trim();
  if (att.profilePicture && typeof att.profilePicture === "string" && att.profilePicture.trim()) return att.profilePicture.trim();
  if (att.profile_picture && typeof att.profile_picture === "string" && att.profile_picture.trim()) return att.profile_picture.trim();
  
  const answers = att.answers || att.customAnswers || att.formAnswers || {};
  if (answers && typeof answers === "object") {
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
  }
  return "";
}

export default function CompanyDrawer({
  isOpen,
  onClose,
  mode = "org", // "org" | "sponsor" | "exhibitor"
  item = null,
  organizations = [],
  sponsors = [],
  exhibitors = [],
  floorPlans = [],
  attendees = [],
  onSaveOrganization,
  onSaveSponsor,
  onSaveExhibitor,
  onDeleteOrganization,
  onDeleteSponsor,
  onDeleteExhibitor,
  onAssignAttendeeToCompany,
  onRemoveAttendeeFromCompany,
  onRegisterNewPersonnel,
  onUploadFile,
  activeEventId,
  eventTitle = "Eventzone Summit",
  eventDetails = null
}) {
  const { t } = useLanguage();

  // Tier names map from eventDetails or localStorage
  const tierNamesMap = useMemo(() => {
    let cached = {};
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(`eventzone_cache_tier_names_${activeEventId || eventDetails?.id || "default"}`);
        if (raw) cached = JSON.parse(raw);
      } catch (e) {}
    }
    return {
      ...cached,
      ...(eventDetails?.sponsorTierNames || eventDetails?.sponsor_tier_names || {})
    };
  }, [eventDetails, activeEventId]);

  const sponsorTierOptions = useMemo(() => [
    { value: "diamond", label: tierNamesMap.diamond || "Diamond Tier", color: "text-sky-600 bg-sky-50 border-sky-200" },
    { value: "gold", label: tierNamesMap.gold || "Gold Tier", color: "text-amber-600 bg-amber-50 border-amber-200" },
    { value: "silver", label: tierNamesMap.silver || "Silver Tier", color: "text-slate-600 bg-slate-100 border-slate-200" },
    { value: "bronze", label: tierNamesMap.bronze || "Bronze Tier", color: "text-amber-800 bg-orange-50 border-orange-200" },
    { value: "title", label: tierNamesMap.title || "Title / Presenting Sponsor", color: "text-purple-700 bg-purple-50 border-purple-200" },
    { value: "partner", label: tierNamesMap.partner || "Official Strategic Partner", color: "text-blue-700 bg-blue-50 border-blue-200" },
    { value: "custom", label: tierNamesMap.custom || "Custom Sponsorship Package", color: "text-blue-700 bg-blue-50 border-blue-200" }
  ], [tierNamesMap]);

  // Active drawer mode state (can switch within the drawer)
  const [currentMode, setCurrentMode] = useState(mode || "org");
  const [isDeleting, setIsDeleting] = useState(false);

  // Organization fields
  const [orgName, setOrgName] = useState("");
  const [orgIndustry, setOrgIndustry] = useState("Technology, AI & Software");
  const [orgLogo, setOrgLogo] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [orgContact, setOrgContact] = useState("");
  const [orgContactTitle, setOrgContactTitle] = useState("");
  const [orgContactEmail, setOrgContactEmail] = useState("");
  const [orgContactPhone, setOrgContactPhone] = useState("");
  const [orgNotes, setOrgNotes] = useState("");
  const [orgStatus, setOrgStatus] = useState("active");
  const [selectedLiaisonAttendeeId, setSelectedLiaisonAttendeeId] = useState("");

  // Personnel management state
  const [selectedAttendeeIdToAssign, setSelectedAttendeeIdToAssign] = useState("");
  const [assignPersonnelRole, setAssignPersonnelRole] = useState("");
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffJobTitle, setNewStaffJobTitle] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [isAddingNewStaff, setIsAddingNewStaff] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [personnelSuccessMsg, setPersonnelSuccessMsg] = useState("");

  // Optional 1-click linkage flags when creating/editing an Organization
  const [alsoCreateSponsor, setAlsoCreateSponsor] = useState(false);
  const [alsoCreateExhibitor, setAlsoCreateExhibitor] = useState(false);

  // Sponsor-specific fields
  const [sponsorSourceType, setSponsorSourceType] = useState("existing"); // "existing" | "new"
  const [selectedOrgIdForSponsor, setSelectedOrgIdForSponsor] = useState("");
  const [sponsorTier, setSponsorTier] = useState("silver");
  const [customTierName, setCustomTierName] = useState("");
  const [sponsorAmount, setSponsorAmount] = useState("");
  const [sponsorCurrency, setSponsorCurrency] = useState("DZD");
  const [sponsorPerks, setSponsorPerks] = useState(["vip_passes", "main_stage_branding"]);
  const [customPerks, setCustomPerks] = useState([]); // Array of { id, label, isCustom: true }
  const [newCustomPerkInput, setNewCustomPerkInput] = useState("");
  const [sponsorBooth, setSponsorBooth] = useState("");
  const [sponsorNotes, setSponsorNotes] = useState("");

  // Exhibitor-specific fields
  const [exhibitorSourceType, setExhibitorSourceType] = useState("existing"); // "existing" | "new"
  const [selectedOrgIdForExhibitor, setSelectedOrgIdForExhibitor] = useState("");
  const [exhibitorBooth, setExhibitorBooth] = useState("");
  const [exhibitorBoothType, setExhibitorBoothType] = useState("Standard 3x3m (9 m²)");
  const [exhibitorStaffCount, setExhibitorStaffCount] = useState(2);
  const [exhibitorProducts, setExhibitorProducts] = useState("");

  // Sub-tabs in Org mode: "profile" | "contact" | "roles" | "personnel"
  const [orgActiveTab, setOrgActiveTab] = useState("profile");

  // Loading & error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Extract available booths from floorPlans
  const availableBooths = useMemo(() => {
    const booths = [];
    (floorPlans || []).forEach(plan => {
      (plan.elements || []).forEach(el => {
        if (el.type && (el.type.startsWith("booth") || el.type === "exhibitor-space")) {
          const boothLabel = el.label || el.name || `Booth #${el.id.slice(0, 5)}`;
          booths.push({
            value: boothLabel,
            label: `${boothLabel} (${plan.title || 'Main Hall'})`,
            id: el.id
          });
        }
      });
    });
    return booths;
  }, [floorPlans]);

  // Attendee options for Contact Liaison SearchableSelect
  const liaisonAttendeeOptions = useMemo(() => {
    return (attendees || [])
      .filter(a => !a.isArchived && a.status !== 'archived')
      .map(a => {
        const photo = getAttendeePhoto(a);
        return {
          value: String(a.id),
          label: a.name || 'Unnamed Attendee',
          description: `${a.email || 'No email'}${a.ticketType || a.ticket_type ? ` • ${a.ticketType || a.ticket_type}` : ''}${a.company ? ` • ${a.company}` : ''}`,
          icon: photo ? (
            <img 
              src={photo} 
              alt="" 
              className="w-5 h-5 rounded-full object-cover border border-slate-200" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
              {a.name ? a.name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2) : "AT"}
            </div>
          )
        };
      });
  }, [attendees]);

  // Resolved selected liaison attendee object
  const selectedLiaisonAttendee = useMemo(() => {
    if (!selectedLiaisonAttendeeId) return null;
    return (attendees || []).find(a => String(a.id) === String(selectedLiaisonAttendeeId)) || null;
  }, [attendees, selectedLiaisonAttendeeId]);

  // Options for selecting existing organization
  const existingOrgOptions = useMemo(() => {
    return organizations.map(o => ({
      value: String(o.id),
      label: o.name,
      description: o.industry || "Partner Organization",
      icon: o.logo ? (
        <img src={o.logo} alt="" className="w-4 h-4 rounded object-cover" />
      ) : (
        <Building2 size={14} className="text-slate-400" />
      )
    }));
  }, [organizations]);

  const existingOrgOptionsForSponsor = useMemo(() => {
    const registeredOrgIds = new Set(
      (sponsors || [])
        .filter(s => !s.isArchived && s.status !== 'archived' && s.id !== item?.id)
        .map(s => String(s.orgId || s.org_id || ''))
        .filter(Boolean)
    );
    const registeredNames = new Set(
      (sponsors || [])
        .filter(s => !s.isArchived && s.status !== 'archived' && s.id !== item?.id)
        .map(s => (s.name || '').trim().toLowerCase())
        .filter(Boolean)
    );
    return (organizations || []).map(o => {
      const isAlreadySponsor = registeredOrgIds.has(String(o.id)) || registeredNames.has((o.name || '').trim().toLowerCase());
      return {
        value: String(o.id),
        label: isAlreadySponsor ? `${o.name} (Already a Sponsor)` : o.name,
        description: isAlreadySponsor ? "Already added as sponsor" : (o.industry || "Partner Organization"),
        disabled: isAlreadySponsor,
        icon: o.logo ? (
          <img src={o.logo} alt="" className="w-4 h-4 rounded object-cover" />
        ) : (
          <Building2 size={14} className="text-slate-400" />
        )
      };
    });
  }, [organizations, sponsors, item]);

  const existingOrgOptionsForExhibitor = useMemo(() => {
    const registeredOrgIds = new Set(
      (exhibitors || [])
        .filter(e => !e.isArchived && e.status !== 'archived' && e.id !== item?.id)
        .map(e => String(e.orgId || e.org_id || ''))
        .filter(Boolean)
    );
    const registeredNames = new Set(
      (exhibitors || [])
        .filter(e => !e.isArchived && e.status !== 'archived' && e.id !== item?.id)
        .map(e => (e.name || '').trim().toLowerCase())
        .filter(Boolean)
    );
    return (organizations || []).map(o => {
      const isAlreadyExhibitor = registeredOrgIds.has(String(o.id)) || registeredNames.has((o.name || '').trim().toLowerCase());
      return {
        value: String(o.id),
        label: isAlreadyExhibitor ? `${o.name} (Already an Exhibitor)` : o.name,
        description: isAlreadyExhibitor ? "Already registered with booth" : (o.industry || "Partner Organization"),
        disabled: isAlreadyExhibitor,
        icon: o.logo ? (
          <img src={o.logo} alt="" className="w-4 h-4 rounded object-cover" />
        ) : (
          <Building2 size={14} className="text-slate-400" />
        )
      };
    });
  }, [organizations, exhibitors, item]);

  // Linked Sponsor & Exhibitor info for current organization (ID & Name linkage)
  const linkedSponsor = useMemo(() => {
    if (!item?.id && !item?.name) return null;
    const cleanItemName = (item?.name || '').trim().toLowerCase();
    return (sponsors || []).find(s => !s.isArchived && s.status !== 'archived' && (
      (item?.id && (String(s.orgId) === String(item.id) || String(s.org_id) === String(item.id) || String(s.id) === String(item.id))) ||
      (cleanItemName && s.name && s.name.trim().toLowerCase() === cleanItemName)
    )) || null;
  }, [sponsors, item]);

  const linkedExhibitor = useMemo(() => {
    if (!item?.id && !item?.name) return null;
    const cleanItemName = (item?.name || '').trim().toLowerCase();
    return (exhibitors || []).find(e => !e.isArchived && e.status !== 'archived' && (
      (item?.id && (String(e.orgId) === String(item.id) || String(e.org_id) === String(item.id) || String(e.id) === String(item.id))) ||
      (cleanItemName && e.name && e.name.trim().toLowerCase() === cleanItemName)
    )) || null;
  }, [exhibitors, item]);

  const effectiveCompanyOrgId = useMemo(() => {
    if (item?.orgId) return String(item.orgId);
    if (item?.org_id) return String(item.org_id);
    if (selectedOrgIdForSponsor) return String(selectedOrgIdForSponsor);
    if (selectedOrgIdForExhibitor) return String(selectedOrgIdForExhibitor);
    if (item?.id) return String(item.id);
    return null;
  }, [item, selectedOrgIdForSponsor, selectedOrgIdForExhibitor]);

  const effectiveCompanyName = useMemo(() => {
    return (orgName || item?.name || '').trim().toLowerCase();
  }, [orgName, item]);

  // List of attendees currently assigned to this company (Strict ID or Name linkage + Contact Liaison auto-inclusion)
  const assignedPersonnel = useMemo(() => {
    const list = [];
    const seenIds = new Set();

    // 1. If an attendee is selected as Contact Liaison, auto-include them in personnel!
    if (selectedLiaisonAttendee && !selectedLiaisonAttendee.isArchived && selectedLiaisonAttendee.status !== 'archived') {
      list.push({
        ...selectedLiaisonAttendee,
        jobTitle: orgContactTitle || selectedLiaisonAttendee.jobTitle || "Contact Liaison",
        isLiaison: true
      });
      seenIds.add(String(selectedLiaisonAttendee.id));
    } else if (orgContactEmail || orgContact) {
      const cleanEmail = (orgContactEmail || '').trim().toLowerCase();
      const cleanContact = (orgContact || '').trim().toLowerCase();
      if (cleanEmail || cleanContact) {
        const matchedAtt = (attendees || []).find(a => 
          !a.isArchived && a.status !== 'archived' && (
            (cleanEmail && a.email && a.email.trim().toLowerCase() === cleanEmail) ||
            (cleanContact && a.name && a.name.trim().toLowerCase() === cleanContact)
          )
        );
        if (matchedAtt && !seenIds.has(String(matchedAtt.id))) {
          list.push({
            ...matchedAtt,
            jobTitle: orgContactTitle || matchedAtt.jobTitle || "Contact Liaison",
            isLiaison: true
          });
          seenIds.add(String(matchedAtt.id));
        }
      }
    }

    // 2. Add other attendees assigned to this company by ID or name (Strict truthy matching!)
    if (effectiveCompanyOrgId || effectiveCompanyName) {
      (attendees || []).forEach(a => {
        if (a.isArchived || a.status === 'archived' || seenIds.has(String(a.id))) return;
        const attOrgId = a.orgId || a.org_id || a.answers?.orgId || a.answers?.org_id;
        const matchId = !!effectiveCompanyOrgId && !!attOrgId && (
          String(attOrgId) === effectiveCompanyOrgId || 
          (item?.id && String(attOrgId) === String(item.id))
        );
        const matchName = !!effectiveCompanyName && !!a.company && a.company.trim().toLowerCase() === effectiveCompanyName;
        if (matchId || matchName) {
          list.push(a);
          seenIds.add(String(a.id));
        }
      });
    }

    return list;
  }, [attendees, effectiveCompanyOrgId, effectiveCompanyName, item, selectedLiaisonAttendee, orgContact, orgContactEmail, orgContactTitle]);

  // Max staff badge quota determination based on staff badge count
  const maxStaffBadges = useMemo(() => {
    if (currentMode === "exhibitor") {
      return Math.max(1, parseInt(exhibitorStaffCount) || 2);
    }
    if (currentMode === "org") {
      if (alsoCreateExhibitor) return Math.max(1, parseInt(exhibitorStaffCount) || 2);
      if (linkedExhibitor) return Math.max(1, parseInt(linkedExhibitor.staffCount || linkedExhibitor.badgeCount) || 2);
      if (item?.staffCount || item?.badgeCount) return Math.max(1, parseInt(item.staffCount || item.badgeCount));
    }
    if (currentMode === "sponsor") {
      if (linkedExhibitor) return Math.max(1, parseInt(linkedExhibitor.staffCount || linkedExhibitor.badgeCount) || 2);
      if (item?.staffCount || item?.badgeCount) return Math.max(1, parseInt(item.staffCount || item.badgeCount));
    }
    return null;
  }, [currentMode, exhibitorStaffCount, alsoCreateExhibitor, linkedExhibitor, item]);

  const isQuotaReached = maxStaffBadges !== null && assignedPersonnel.length >= maxStaffBadges;

  // Dropdown options for unassigned attendees
  const unassignedAttendeesOptions = useMemo(() => {
    const assignedIds = new Set(assignedPersonnel.map(p => String(p.id)));
    return (attendees || [])
      .filter(a => !a.isArchived && a.status !== 'archived' && !assignedIds.has(String(a.id)))
      .map(a => {
        const photo = getAttendeePhoto(a);
        return {
          value: String(a.id),
          label: a.name || 'Unnamed Attendee',
          description: `${a.email || 'No email'}${a.company ? ` • Current: ${a.company}` : ''} • Ticket: ${a.ticketType || a.ticket_type || 'Standard'}`,
          icon: photo ? (
            <img 
              src={photo} 
              alt="" 
              className="w-4 h-4 rounded-full object-cover" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <User size={14} className="text-slate-400" />
          )
        };
      });
  }, [attendees, assignedPersonnel]);

  // Handlers for personnel assignment
  const handleAssignSelectedAttendee = async () => {
    if (!selectedAttendeeIdToAssign) return;
    if (isQuotaReached) {
      setErrorMessage(`Cannot assign more personnel. Staff badge quota reached (${assignedPersonnel.length} of ${maxStaffBadges}). Increase the Staff Badge Count to assign more.`);
      return;
    }
    setIsAssigning(true);
    setPersonnelSuccessMsg("");
    try {
      const companyTarget = {
        id: effectiveCompanyOrgId || item?.id,
        orgId: effectiveCompanyOrgId || item?.id,
        org_id: effectiveCompanyOrgId || item?.id,
        name: orgName || item?.name || '',
        industry: orgIndustry
      };
      if (onAssignAttendeeToCompany) {
        await onAssignAttendeeToCompany(
          selectedAttendeeIdToAssign, 
          companyTarget, 
          { jobTitle: assignPersonnelRole.trim() }
        );
      }
      setSelectedAttendeeIdToAssign("");
      setAssignPersonnelRole("");
      setPersonnelSuccessMsg("Personnel successfully assigned to company!");
      setTimeout(() => setPersonnelSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMessage("Failed to assign personnel. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRegisterPersonnel = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) {
      setErrorMessage("Please provide a full name and email for the new personnel.");
      return;
    }
    if (isQuotaReached) {
      setErrorMessage(`Cannot register more personnel. Staff badge quota reached (${assignedPersonnel.length} of ${maxStaffBadges}). Increase the Staff Badge Count to add more.`);
      return;
    }
    setIsAssigning(true);
    setPersonnelSuccessMsg("");
    try {
      if (onRegisterNewPersonnel) {
        await onRegisterNewPersonnel({
          name: newStaffName.trim(),
          email: newStaffEmail.trim(),
          jobTitle: newStaffJobTitle.trim() || 'Company Representative',
          phone: newStaffPhone.trim()
        }, item || { id: item?.id, name: orgName, industry: orgIndustry });
      }
      setNewStaffName("");
      setNewStaffEmail("");
      setNewStaffJobTitle("");
      setNewStaffPhone("");
      setIsAddingNewStaff(false);
      setPersonnelSuccessMsg("New personnel registered and assigned to company!");
      setTimeout(() => setPersonnelSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMessage("Failed to register personnel. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemovePersonnel = async (attendeeId) => {
    if (confirm("Remove this attendee from company personnel?")) {
      try {
        if (onRemoveAttendeeFromCompany) {
          await onRemoveAttendeeFromCompany(attendeeId);
        }
      } catch (err) {
        console.error("Failed to remove personnel:", err);
      }
    }
  };

  // Helper to match an attendee by contact name / email / phone
  const findLiaisonAttendeeId = (contactName, email, phone) => {
    if (!attendees || attendees.length === 0) return "";
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim().replace(/[\s\-\(\)\+]/g, '');
    const cleanName = (contactName || '').trim().toLowerCase();

    if (cleanEmail) {
      const found = attendees.find(a => (a.email || '').trim().toLowerCase() === cleanEmail);
      if (found) return String(found.id);
    }
    if (cleanPhone && cleanPhone.length > 5) {
      const found = attendees.find(a => {
        const p = (a.phone || '').trim().replace(/[\s\-\(\)\+]/g, '');
        return p && p === cleanPhone;
      });
      if (found) return String(found.id);
    }
    if (cleanName) {
      const found = attendees.find(a => (a.name || '').trim().toLowerCase() === cleanName);
      if (found) return String(found.id);
    }
    return "";
  };

  // Handler when user selects a liaison attendee from the SearchableSelect
  const handleSelectLiaisonAttendee = async (attendeeId) => {
    setSelectedLiaisonAttendeeId(attendeeId || "");
    if (!attendeeId) {
      setOrgContact("");
      setOrgContactTitle("");
      setOrgContactEmail("");
      setOrgContactPhone("");
      return;
    }
    const att = (attendees || []).find(a => String(a.id) === String(attendeeId));
    if (att) {
      const defaultRole = att.jobTitle || att.title || (currentMode === "sponsor" ? "Sponsor Liaison" : currentMode === "exhibitor" ? "Exhibitor Liaison" : "Corporate Liaison");
      setOrgContact(att.name || "");
      setOrgContactTitle(defaultRole);
      setOrgContactEmail(att.email || "");
      setOrgContactPhone(att.phone || "");

      // Automatically assign attendee to company personnel if company ID is already known
      const targetOrgId = effectiveCompanyOrgId || item?.id;
      const targetCompName = orgName || item?.name || '';
      if (onAssignAttendeeToCompany && targetOrgId) {
        const companyTarget = {
          id: String(targetOrgId),
          orgId: String(targetOrgId),
          org_id: String(targetOrgId),
          name: targetCompName,
          industry: orgIndustry
        };
        try {
          await onAssignAttendeeToCompany(attendeeId, companyTarget, { jobTitle: defaultRole });
          setPersonnelSuccessMsg(`${att.name} assigned as Contact Liaison & added to Company Personnel`);
          setTimeout(() => setPersonnelSuccessMsg(""), 3500);
        } catch (e) {
          console.warn("Auto-assign liaison to personnel notice:", e);
        }
      }
    }
  };

  // Initialize/reset form state whenever item or mode changes
  useEffect(() => {
    if (isOpen) {
      setCurrentMode(mode || "org");
      setOrgActiveTab("profile");
      setErrorMessage("");
      setIsSubmitting(false);

      if (mode === "org") {
        if (item) {
          setOrgName(item.name || "");
          setOrgIndustry(item.industry || "Technology, AI & Software");
          setOrgLogo(item.logo || "");
          setOrgWebsite(item.website || "");
          setOrgAddress(item.address || "");
          setOrgDescription(item.description || "");
          setOrgContact(item.contact || item.contactPerson || "");
          setOrgContactTitle(item.jobTitle || item.contactTitle || item.contactPosition || "");
          setOrgContactEmail(item.email || item.contactEmail || "");
          setOrgContactPhone(item.phone || item.contactPhone || "");
          setOrgNotes(item.notes || "");
          setOrgStatus(item.status || (item.isArchived ? "archived" : "active"));

          const matchedLiaisonId = findLiaisonAttendeeId(item.contact || item.contactPerson, item.email || item.contactEmail, item.phone || item.contactPhone);
          setSelectedLiaisonAttendeeId(matchedLiaisonId);

          // Pre-populate sponsorship data if this organization is a sponsor
          const existingSponsor = (sponsors || []).find(s => !s.isArchived && s.status !== 'archived' && (s.orgId === item.id || s.org_id === item.id));
          if (existingSponsor) {
            setAlsoCreateSponsor(true);
            setSponsorTier(existingSponsor.tier || "silver");
            setSponsorAmount(existingSponsor.amount || existingSponsor.packageValue || "");
            setSponsorCurrency(existingSponsor.currency || "DZD");
            setSponsorBooth(existingSponsor.booth || existingSponsor.assignedBooth || "");
            setSponsorPerks(Array.isArray(existingSponsor.perks) ? existingSponsor.perks : ["vip_passes", "main_stage_branding"]);
            setSponsorNotes(existingSponsor.notes || "");
          } else {
            setAlsoCreateSponsor(false);
            setSponsorTier("silver");
            setSponsorAmount("");
            setSponsorCurrency("DZD");
            setSponsorBooth("");
            setSponsorPerks(["vip_passes", "main_stage_branding"]);
            setSponsorNotes("");
          }

          // Pre-populate exhibitor data if this organization is an exhibitor
          const existingExhibitor = (exhibitors || []).find(e => !e.isArchived && e.status !== 'archived' && (e.orgId === item.id || e.org_id === item.id));
          if (existingExhibitor) {
            setAlsoCreateExhibitor(true);
            setExhibitorBooth(existingExhibitor.booth || existingExhibitor.boothNumber || existingExhibitor.booth_number || "");
            setExhibitorBoothType(existingExhibitor.boothType || "Standard 3x3m (9 m²)");
            setExhibitorStaffCount(existingExhibitor.staffCount || existingExhibitor.badgeCount || 2);
            setExhibitorProducts(existingExhibitor.description || existingExhibitor.products || "");
          } else {
            setAlsoCreateExhibitor(false);
            setExhibitorBooth(availableBooths.length > 0 ? availableBooths[0].value : "Booth A-01");
            setExhibitorBoothType("Standard 3x3m (9 m²)");
            setExhibitorStaffCount(2);
            setExhibitorProducts("");
          }
        } else {
          setOrgName("");
          setOrgIndustry("Technology, AI & Software");
          setOrgLogo("");
          setOrgWebsite("");
          setOrgAddress("");
          setOrgDescription("");
          setOrgContact("");
          setOrgContactTitle("");
          setOrgContactEmail("");
          setOrgContactPhone("");
          setOrgNotes("");
          setOrgStatus("active");
          setSelectedLiaisonAttendeeId("");
          setAlsoCreateSponsor(false);
          setSponsorTier("silver");
          setSponsorAmount("");
          setSponsorCurrency("DZD");
          setSponsorBooth("");
          setSponsorPerks(["vip_passes", "main_stage_branding"]);
          setSponsorNotes("");
          setAlsoCreateExhibitor(false);
          setExhibitorBooth(availableBooths.length > 0 ? availableBooths[0].value : "Booth A-01");
          setExhibitorBoothType("Standard 3x3m (9 m²)");
          setExhibitorStaffCount(2);
          setExhibitorProducts("");
        }
      } else if (mode === "sponsor") {
        if (item) {
          // If editing an existing sponsor
          setOrgName(item.name || "");
          setOrgIndustry(item.industry || "Technology, AI & Software");
          setOrgLogo(item.image || item.logo || "");
          setOrgWebsite(item.website || "");
          const isStandardTier = SPONSOR_TIERS.some(t => t.value === item.tier);
          setSponsorTier(isStandardTier ? item.tier : (item.tier ? "custom" : "silver"));
          setCustomTierName(item.customTier || item.customTierName || (!isStandardTier && item.tier ? item.tier : ""));
          setSponsorAmount(item.amount || item.packageValue || "");
          setSponsorBooth(item.booth || item.assignedBooth || "");
          setSponsorNotes(item.notes || "");

          // Load perks and extract any custom perks
          const loadedPerks = Array.isArray(item.perks) ? item.perks : ["vip_passes", "main_stage_branding"];
          const standardIds = new Set(SPONSOR_PERKS_OPTIONS.map(p => p.id));
          const existingCustom = [];
          const normalizedPerkIds = [];

          loadedPerks.forEach(p => {
            if (typeof p === "object" && p !== null) {
              const pId = p.id || `custom_${p.label}`;
              normalizedPerkIds.push(pId);
              if (!standardIds.has(pId) && !existingCustom.some(e => e.id === pId)) {
                existingCustom.push({ id: pId, label: p.label || p.id, isCustom: true });
              }
            } else if (typeof p === "string") {
              normalizedPerkIds.push(p);
              if (!standardIds.has(p) && !existingCustom.some(e => e.id === p)) {
                const label = p.startsWith("custom_") 
                  ? p.replace(/^custom_\d*_?/, '').replace(/_/g, ' ') 
                  : p;
                existingCustom.push({ 
                  id: p, 
                  label: label.charAt(0).toUpperCase() + label.slice(1), 
                  isCustom: true 
                });
              }
            }
          });

          if (Array.isArray(item.customPerks)) {
            item.customPerks.forEach(cp => {
              if (cp && cp.id && !existingCustom.some(e => e.id === cp.id)) {
                existingCustom.push({ id: cp.id, label: cp.label || cp.id, isCustom: true });
              }
            });
          }

          setCustomPerks(existingCustom);
          setSponsorPerks(normalizedPerkIds.length > 0 ? normalizedPerkIds : ["vip_passes", "main_stage_branding"]);
          setNewCustomPerkInput("");

          const matchedOrg = (organizations || []).find(o => 
            (item.orgId && String(o.id) === String(item.orgId)) || 
            (item.org_id && String(o.id) === String(item.org_id)) || 
            (o.name && item.name && o.name.trim().toLowerCase() === item.name.trim().toLowerCase())
          );

          if (matchedOrg) {
            setSponsorSourceType("existing");
            setSelectedOrgIdForSponsor(String(matchedOrg.id));
          } else {
            setSponsorSourceType("new");
            setSelectedOrgIdForSponsor("");
          }

          const contactName = item.contact || item.contactPerson || matchedOrg?.contact || "";
          const contactTitle = item.jobTitle || item.contactPosition || matchedOrg?.jobTitle || "";
          const contactEmail = item.email || item.contactEmail || matchedOrg?.email || "";
          const contactPhone = item.phone || item.contactPhone || matchedOrg?.phone || "";

          setOrgContact(contactName);
          setOrgContactTitle(contactTitle);
          setOrgContactEmail(contactEmail);
          setOrgContactPhone(contactPhone);

          const matchedLiaisonId = findLiaisonAttendeeId(contactName, contactEmail, contactPhone);
          setSelectedLiaisonAttendeeId(matchedLiaisonId);
        } else {
          // Creating new sponsor
          const defaultOrg = organizations.length > 0 ? organizations[0] : null;
          setSponsorSourceType(defaultOrg ? "existing" : "new");
          setSelectedOrgIdForSponsor(defaultOrg ? String(defaultOrg.id) : "");
          if (defaultOrg) {
            setOrgName(defaultOrg.name || "");
            setOrgIndustry(defaultOrg.industry || "Technology, AI & Software");
            setOrgLogo(defaultOrg.logo || "");
            setOrgWebsite(defaultOrg.website || "");
            setOrgContact(defaultOrg.contact || "");
            setOrgContactTitle(defaultOrg.jobTitle || "");
            setOrgContactEmail(defaultOrg.email || "");
            setOrgContactPhone(defaultOrg.phone || "");
            const matchedLiaisonId = findLiaisonAttendeeId(defaultOrg.contact, defaultOrg.email, defaultOrg.phone);
            setSelectedLiaisonAttendeeId(matchedLiaisonId);
          } else {
            setOrgName("");
            setOrgIndustry("Technology, AI & Software");
            setOrgLogo("");
            setOrgWebsite("");
            setOrgContact("");
            setOrgContactTitle("");
            setOrgContactEmail("");
            setOrgContactPhone("");
            setSelectedLiaisonAttendeeId("");
          }
          setSponsorTier("silver");
          setCustomTierName("");
          setSponsorAmount("");
          setSponsorBooth("");
          setSponsorPerks(["vip_passes", "main_stage_branding"]);
          setCustomPerks([]);
          setNewCustomPerkInput("");
          setSponsorNotes("");
        }
      } else if (mode === "exhibitor") {
        if (item) {
          // Editing existing exhibitor
          setOrgName(item.name || "");
          setOrgIndustry(item.industry || "Technology, AI & Software");
          setOrgLogo(item.logo || item.logo_url || "");
          setExhibitorBooth(item.booth || item.boothNumber || item.booth_number || "");
          setExhibitorBoothType(item.boothType || "Standard 3x3m (9 m²)");
          setExhibitorStaffCount(item.staffCount || item.badgeCount || 2);
          setExhibitorProducts(item.description || item.products || "");

          const matchedOrg = (organizations || []).find(o => 
            (item.orgId && String(o.id) === String(item.orgId)) || 
            (item.org_id && String(o.id) === String(item.org_id)) || 
            (o.name && item.name && o.name.trim().toLowerCase() === item.name.trim().toLowerCase())
          );

          if (matchedOrg) {
            setExhibitorSourceType("existing");
            setSelectedOrgIdForExhibitor(String(matchedOrg.id));
          } else {
            setExhibitorSourceType("new");
            setSelectedOrgIdForExhibitor("");
          }

          const contactName = item.contact || item.contactPerson || matchedOrg?.contact || "";
          const contactTitle = item.jobTitle || item.contactPosition || matchedOrg?.jobTitle || "";
          const contactEmail = item.email || item.contactEmail || item.contact_email || matchedOrg?.email || "";
          const contactPhone = item.phone || item.contactPhone || item.contact_phone || matchedOrg?.phone || "";

          setOrgContact(contactName);
          setOrgContactTitle(contactTitle);
          setOrgContactEmail(contactEmail);
          setOrgContactPhone(contactPhone);

          const matchedLiaisonId = findLiaisonAttendeeId(contactName, contactEmail, contactPhone);
          setSelectedLiaisonAttendeeId(matchedLiaisonId);
        } else {
          // Creating new exhibitor
          const defaultOrg = organizations.length > 0 ? organizations[0] : null;
          setExhibitorSourceType(defaultOrg ? "existing" : "new");
          setSelectedOrgIdForExhibitor(defaultOrg ? String(defaultOrg.id) : "");
          if (defaultOrg) {
            setOrgName(defaultOrg.name || "");
            setOrgIndustry(defaultOrg.industry || "Technology, AI & Software");
            setOrgLogo(defaultOrg.logo || "");
            setOrgContact(defaultOrg.contact || "");
            setOrgContactTitle(defaultOrg.jobTitle || "");
            setOrgContactEmail(defaultOrg.email || "");
            setOrgContactPhone(defaultOrg.phone || "");
            const matchedLiaisonId = findLiaisonAttendeeId(defaultOrg.contact, defaultOrg.email, defaultOrg.phone);
            setSelectedLiaisonAttendeeId(matchedLiaisonId);
          } else {
            setOrgName("");
            setOrgIndustry("Technology, AI & Software");
            setOrgLogo("");
            setOrgContact("");
            setOrgContactTitle("");
            setOrgContactEmail("");
            setOrgContactPhone("");
            setSelectedLiaisonAttendeeId("");
          }
          setExhibitorBooth(availableBooths.length > 0 ? availableBooths[0].value : "Booth A-01");
          setExhibitorBoothType("Standard 3x3m (9 m²)");
          setExhibitorStaffCount(2);
          setExhibitorProducts("");
        }
      }
    }
  }, [isOpen, mode, item, organizations, availableBooths]);

  // When selected existing organization changes for sponsor
  const handleSelectOrgForSponsor = (orgId) => {
    setSelectedOrgIdForSponsor(orgId);
    const org = organizations.find(o => String(o.id) === String(orgId));
    if (org) {
      setOrgName(org.name || "");
      setOrgIndustry(org.industry || "Technology, AI & Software");
      setOrgLogo(org.logo || "");
      setOrgWebsite(org.website || "");
      setOrgContact(org.contact || org.contactPerson || "");
      setOrgContactTitle(org.jobTitle || org.contactPosition || "");
      setOrgContactEmail(org.email || org.contactEmail || "");
      setOrgContactPhone(org.phone || org.contactPhone || "");
      const matchedLiaisonId = findLiaisonAttendeeId(org.contact || org.contactPerson, org.email || org.contactEmail, org.phone || org.contactPhone);
      setSelectedLiaisonAttendeeId(matchedLiaisonId);
    }
  };

  // When selected existing organization changes for exhibitor
  const handleSelectOrgForExhibitor = (orgId) => {
    setSelectedOrgIdForExhibitor(orgId);
    const org = organizations.find(o => String(o.id) === String(orgId));
    if (org) {
      setOrgName(org.name || "");
      setOrgIndustry(org.industry || "Technology, AI & Software");
      setOrgLogo(org.logo || "");
      setOrgContact(org.contact || org.contactPerson || "");
      setOrgContactTitle(org.jobTitle || org.contactPosition || "");
      setOrgContactEmail(org.email || org.contactEmail || "");
      setOrgContactPhone(org.phone || org.contactPhone || "");
      const matchedLiaisonId = findLiaisonAttendeeId(org.contact || org.contactPerson, org.email || org.contactEmail, org.phone || org.contactPhone);
      setSelectedLiaisonAttendeeId(matchedLiaisonId);
    }
  };

  // All available perks (built-in + custom created by organizer)
  const allAvailablePerks = useMemo(() => {
    const standardIds = new Set(SPONSOR_PERKS_OPTIONS.map(p => p.id));
    const uniqueCustom = (customPerks || []).filter(cp => !standardIds.has(cp.id));
    return [...SPONSOR_PERKS_OPTIONS, ...uniqueCustom];
  }, [customPerks]);

  // Toggle perks for sponsor
  const toggleSponsorPerk = (perkId) => {
    setSponsorPerks(prev =>
      prev.includes(perkId) ? prev.filter(p => p !== perkId) : [...prev, perkId]
    );
  };

  // Add custom deliverable / perk
  const handleAddCustomPerk = (e) => {
    if (e) e.preventDefault();
    const trimmed = newCustomPerkInput.trim();
    if (!trimmed) return;

    const existing = allAvailablePerks.find(p => p.label.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (!sponsorPerks.includes(existing.id)) {
        setSponsorPerks(prev => [...prev, existing.id]);
      }
      setNewCustomPerkInput("");
      return;
    }

    const customId = `custom_${Date.now()}_${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)}`;
    const newPerk = { id: customId, label: trimmed, isCustom: true };
    setCustomPerks(prev => [...prev, newPerk]);
    setSponsorPerks(prev => [...prev, customId]);
    setNewCustomPerkInput("");
  };

  // Remove custom deliverable / perk
  const handleRemoveCustomPerk = (perkId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCustomPerks(prev => prev.filter(p => p.id !== perkId));
    setSponsorPerks(prev => prev.filter(id => id !== perkId));
  };

  // Submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (currentMode === "sponsor" && !item && !selectedOrgIdForSponsor) {
      setErrorMessage("Please select a registered organization to sponsor this event.");
      return;
    }

    if (currentMode === "exhibitor" && !item && !selectedOrgIdForExhibitor) {
      setErrorMessage("Please select a registered organization to exhibit at this event.");
      return;
    }

    if (!orgName.trim()) {
      setErrorMessage("Please enter an organization name.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (currentMode === "org") {
        const orgPayload = {
          id: item?.id,
          name: orgName.trim(),
          industry: orgIndustry,
          logo: orgLogo,
          website: orgWebsite.trim() ? (orgWebsite.startsWith("http") ? orgWebsite.trim() : `https://${orgWebsite.trim()}`) : "",
          address: orgAddress.trim(),
          description: orgDescription.trim(),
          selectedLiaisonAttendeeId: selectedLiaisonAttendeeId || "",
          contact: orgContact.trim(),
          contactPerson: orgContact.trim(),
          jobTitle: orgContactTitle.trim(),
          contactPosition: orgContactTitle.trim(),
          email: orgContactEmail.trim(),
          contactEmail: orgContactEmail.trim(),
          phone: orgContactPhone.trim(),
          contactPhone: orgContactPhone.trim(),
          notes: orgNotes.trim(),
          status: orgStatus,
          isArchived: orgStatus === "archived"
        };

        if (onSaveOrganization) {
          await onSaveOrganization(orgPayload, {
            createSponsor: alsoCreateSponsor,
            sponsorTier,
            sponsorAmount: sponsorAmount ? parseFloat(sponsorAmount) : null,
            sponsorCurrency,
            sponsorBooth,
            sponsorPerks,
            sponsorNotes,
            createExhibitor: alsoCreateExhibitor,
            exhibitorBooth,
            exhibitorBoothType,
            exhibitorStaffCount,
            exhibitorProducts
          });
        }
      } else if (currentMode === "sponsor") {
        const selectedOrg = organizations.find(o => String(o.id) === String(selectedOrgIdForSponsor)) || (item?.orgId ? organizations.find(o => String(o.id) === String(item.orgId)) : null);
        const targetOrgId = selectedOrg?.id || selectedOrgIdForSponsor || item?.orgId || item?.org_id || null;
        const cleanName = orgName.trim().toLowerCase();

        const existingSponsor = (sponsors || []).find(s => 
          !s.isArchived && s.status !== 'archived' && (
            (item?.id && String(s.id) === String(item.id)) ||
            (targetOrgId && (String(s.orgId) === String(targetOrgId) || String(s.org_id) === String(targetOrgId))) ||
            (cleanName && s.name && s.name.trim().toLowerCase() === cleanName)
          )
        );

        const effectiveTier = sponsorTier === "custom" && customTierName.trim() ? customTierName.trim() : sponsorTier;
        const sponsorPayload = {
          id: existingSponsor?.id || (item && !item.orgId ? item.id : undefined),
          name: orgName.trim(),
          orgId: targetOrgId,
          tier: effectiveTier,
          customTier: sponsorTier === "custom" ? customTierName.trim() : "",
          amount: sponsorAmount ? parseFloat(sponsorAmount) : null,
          currency: sponsorCurrency,
          website: orgWebsite.trim() ? (orgWebsite.startsWith("http") ? orgWebsite.trim() : `https://${orgWebsite.trim()}`) : "#",
          image: orgLogo || (selectedOrg?.logo || ""),
          industry: orgIndustry || (selectedOrg?.industry || ""),
          selectedLiaisonAttendeeId: selectedLiaisonAttendeeId || "",
          contact: orgContact.trim() || (selectedOrg?.contact || ""),
          contactPerson: orgContact.trim() || (selectedOrg?.contact || ""),
          jobTitle: orgContactTitle.trim() || (selectedOrg?.jobTitle || ""),
          contactPosition: orgContactTitle.trim() || (selectedOrg?.jobTitle || ""),
          email: orgContactEmail.trim() || (selectedOrg?.email || ""),
          contactEmail: orgContactEmail.trim() || (selectedOrg?.email || ""),
          phone: orgContactPhone.trim() || (selectedOrg?.phone || ""),
          contactPhone: orgContactPhone.trim() || (selectedOrg?.phone || ""),
          booth: sponsorBooth.trim() || item?.booth || "",
          perks: sponsorPerks,
          customPerks: customPerks,
          notes: sponsorNotes.trim(),
          status: item?.status || "active",
          isArchived: item?.isArchived || false
        };

        if (onSaveSponsor) {
          await onSaveSponsor(sponsorPayload);
        }
      } else if (currentMode === "exhibitor") {
        const selectedOrg = organizations.find(o => String(o.id) === String(selectedOrgIdForExhibitor)) || (item?.orgId ? organizations.find(o => String(o.id) === String(item.orgId)) : null);
        const targetOrgId = selectedOrg?.id || selectedOrgIdForExhibitor || item?.orgId || item?.org_id || null;
        const cleanName = orgName.trim().toLowerCase();

        const existingExhibitor = (exhibitors || []).find(e => 
          !e.isArchived && e.status !== 'archived' && (
            (item?.id && String(e.id) === String(item.id)) ||
            (targetOrgId && (String(e.orgId) === String(targetOrgId) || String(e.org_id) === String(targetOrgId))) ||
            (cleanName && e.name && e.name.trim().toLowerCase() === cleanName)
          )
        );

        const exhibitorPayload = {
          id: existingExhibitor?.id || (item && !item.orgId ? item.id : undefined),
          name: orgName.trim(),
          orgId: targetOrgId,
          booth: exhibitorBooth.trim() || item?.booth || "",
          boothNumber: exhibitorBooth.trim() || item?.boothNumber || "",
          boothType: exhibitorBoothType || item?.boothType || "Standard",
          industry: orgIndustry || (selectedOrg?.industry || ""),
          selectedLiaisonAttendeeId: selectedLiaisonAttendeeId || "",
          contact: orgContact.trim() || (selectedOrg?.contact || ""),
          contactPerson: orgContact.trim() || (selectedOrg?.contact || ""),
          jobTitle: orgContactTitle.trim() || (selectedOrg?.jobTitle || ""),
          contactPosition: orgContactTitle.trim() || (selectedOrg?.jobTitle || ""),
          email: orgContactEmail.trim() || (selectedOrg?.email || ""),
          contactEmail: orgContactEmail.trim() || (selectedOrg?.email || ""),
          phone: orgContactPhone.trim() || (selectedOrg?.phone || ""),
          contactPhone: orgContactPhone.trim() || (selectedOrg?.phone || ""),
          logo: orgLogo || (selectedOrg?.logo || ""),
          staffCount: parseInt(exhibitorStaffCount) || 2,
          badgeCount: parseInt(exhibitorStaffCount) || 2,
          products: exhibitorProducts.trim(),
          description: exhibitorProducts.trim(),
          status: item?.status || "active",
          isArchived: item?.isArchived || false
        };

        if (onSaveExhibitor) {
          await onSaveExhibitor(exhibitorPayload);
        }
      }

      onClose();
    } catch (err) {
      console.error("Save company record error:", err);
      setErrorMessage(err.message || "Failed to save record. Please check the form and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!item?.id) return;
    const isOrg = currentMode === "org";
    const isSponsor = currentMode === "sponsor";
    const isExhibitor = currentMode === "exhibitor";

    const confirmMsg = isOrg
      ? `Are you sure you want to permanently delete this organization? This will completely remove it, including any linked sponsor and exhibitor registrations.`
      : isSponsor
      ? `Remove this company from the Event Sponsors list? (The organization profile will remain intact).`
      : `Remove this company from the Event Exhibitors list? (The organization profile will remain intact).`;

    if (!window.confirm(confirmMsg)) {
      return;
    }
    try {
      setIsDeleting(true);
      if (isOrg && onDeleteOrganization) {
        await onDeleteOrganization(item.id);
      } else if (isSponsor && onDeleteSponsor) {
        await onDeleteSponsor(item.id);
      } else if (isExhibitor && onDeleteExhibitor) {
        await onDeleteExhibitor(item.id);
      } else if (onDeleteOrganization) {
        await onDeleteOrganization(item.id);
      }
      onClose();
    } catch (err) {
      console.error("Failed to delete company from drawer:", err);
      setErrorMessage("Failed to delete company. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in select-none">
      {/* Blurry Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-2xl lg:max-w-3xl bg-white shadow-2xl flex flex-col border-l border-slate-100 transform transition-transform ease-in-out duration-300">
          
          {/* Header */}
          <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {currentMode === "org" && (item ? `Edit ${item.name || 'Organization'}` : "Add Partner Organization")}
                {currentMode === "sponsor" && (item ? `Edit ${item.name || 'Sponsor'}` : "Add Event Sponsor")}
                {currentMode === "exhibitor" && (item ? `Edit ${item.name || 'Exhibitor'}` : "Add Event Exhibitor")}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {currentMode === "org" && "Manage company profile, contact liaison, and partner assets"}
                {currentMode === "sponsor" && "Configure sponsorship package, branding tier, and contact liaison"}
                {currentMode === "exhibitor" && "Allocate booth space, staff credentials, and contact liaison"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </header>



          {/* Sub-Navigation Tabs across all modes (Org, Sponsor, Exhibitor) */}
          <div className="px-6 border-b border-slate-100 bg-white shrink-0">
            <div className="flex gap-4 sm:gap-6 overflow-x-auto">
              <button
                type="button"
                onClick={() => setOrgActiveTab("profile")}
                className={`py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  orgActiveTab === "profile"
                    ? "border-blue-600 text-blue-600 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>
                  {currentMode === "sponsor"
                    ? "Sponsorship Details"
                    : currentMode === "exhibitor"
                    ? "Exhibitor Details"
                    : "Showcase & Profile"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOrgActiveTab("contact")}
                className={`py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  orgActiveTab === "contact"
                    ? "border-blue-600 text-blue-600 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Contact Liaison</span>
                {selectedLiaisonAttendee && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setOrgActiveTab("personnel")}
                className={`py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  orgActiveTab === "personnel"
                    ? "border-blue-600 text-blue-600 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Company Personnel</span>
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black border ${
                  isQuotaReached 
                    ? "bg-amber-50 text-amber-800 border-amber-200" 
                    : "bg-blue-50 text-blue-700 border-blue-100"
                }`}>
                  {maxStaffBadges !== null ? `${assignedPersonnel.length} / ${maxStaffBadges}` : assignedPersonnel.length}
                </span>
              </button>
            </div>
          </div>

          {/* Form Content Area */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            
            {/* Error Notification */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 font-semibold">
                <ShieldAlert size={16} className="text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: SHOWCASE & PROFILE / SPONSOR DETAILS / EXHIBITOR DETAILS          */}
            {/* ========================================================================= */}
            {orgActiveTab === "profile" && (
              <>
                {/* 1. ORGANIZATION MODE */}
                {currentMode === "org" && (
                  <div className="flex flex-col gap-5">
                    {/* Logo Uploader */}
                    <FormImageUploader
                      value={orgLogo}
                      onChange={(url) => setOrgLogo(url)}
                      label="Company / Organization Logo"
                      placeholder="Upload official high-resolution brand logo (JPG, PNG, SVG)"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Organization Legal / Brand Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          placeholder="e.g. Sonatrach, Algérie Télécom, Google"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      {/* Industry */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Sector / Industry <span className="text-rose-500">*</span>
                        </label>
                        <SearchableSelect
                          value={orgIndustry}
                          onChange={(val) => setOrgIndustry(val)}
                          options={INDUSTRIES_LIST.map(ind => ({ value: ind, label: ind }))}
                          placeholder="-- Select Industry --"
                          searchPlaceholder="Search industry..."
                          required
                        />
                      </div>

                      {/* Website */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Company Website URL
                        </label>
                        <div className="relative">
                          <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={orgWebsite}
                            onChange={(e) => setOrgWebsite(e.target.value)}
                            placeholder="www.company.com"
                            className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address / Location */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Headquarters / City & Country
                      </label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={orgAddress}
                          onChange={(e) => setOrgAddress(e.target.value)}
                          placeholder="e.g. Algiers, Algeria / Paris, France"
                          className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>

                    {/* Bio / Description */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Organization Overview & Description (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={orgDescription}
                        onChange={(e) => setOrgDescription(e.target.value)}
                        placeholder="Brief summary of the organization's business, mission, and activities..."
                        className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* 2. SPONSOR MODE */}
                {currentMode === "sponsor" && (
                  <div className="flex flex-col gap-6">
                    {/* Organization Selector for New Sponsor */}
                    {!item && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Select Registered Organization <span className="text-rose-500">*</span>
                        </label>
                        <SearchableSelect
                          value={selectedOrgIdForSponsor}
                          onChange={(val) => handleSelectOrgForSponsor(val)}
                          options={existingOrgOptionsForSponsor}
                          placeholder="-- Choose a registered organization to sponsor this event --"
                          searchPlaceholder="Search registered organization..."
                          required
                        />
                      </div>
                    )}

                    {/* Company Details (Pre-filled from existing org selected, or editable) */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-4">
                      <span className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>Sponsor Branding & Info</span>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded-full">
                          Linked with Organization
                        </span>
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Sponsor Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            placeholder="e.g. Air Liquide, Ooredoo, Cisco"
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 bg-white"
                          />
                        </div>

                        {/* Logo Uploader */}
                        <div className="sm:col-span-2">
                          <FormImageUploader
                            value={orgLogo}
                            onChange={(url) => setOrgLogo(url)}
                            label="Sponsor Logo"
                            placeholder="Upload sponsor logo for website and badges"
                          />
                        </div>

                        {/* Sector */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Industry / Sector
                          </label>
                          <SearchableSelect
                            value={orgIndustry}
                            onChange={(val) => setOrgIndustry(val)}
                            options={INDUSTRIES_LIST.map(i => ({ value: i, label: i }))}
                            placeholder="-- Select Industry --"
                            searchPlaceholder="Search industry..."
                          />
                        </div>

                        {/* Website */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Sponsor Website
                          </label>
                          <input
                            type="text"
                            value={orgWebsite}
                            onChange={(e) => setOrgWebsite(e.target.value)}
                            placeholder="https://sponsor.com"
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. Sponsorship Tier & Financial Package */}
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col gap-4">
                      <span className="text-xs font-bold text-slate-800">
                        Sponsorship Tier & Package
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Sponsor Tier Level <span className="text-rose-500">*</span>
                          </label>
                          <SearchableSelect
                            value={sponsorTier}
                            onChange={(val) => setSponsorTier(val)}
                            options={sponsorTierOptions}
                            placeholder="-- Select Tier --"
                            isClearable={false}
                            required
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Contribution Amount & Currency
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={sponsorAmount}
                              onChange={(e) => setSponsorAmount(e.target.value)}
                              placeholder="e.g. 500000"
                              className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                            />
                            <select
                              value={sponsorCurrency}
                              onChange={(e) => setSponsorCurrency(e.target.value)}
                              className="w-24 px-2 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:outline-none focus:border-amber-500"
                            >
                              <option value="DZD">DZD</option>
                              <option value="USD">USD ($)</option>
                              <option value="EUR">EUR (€)</option>
                              <option value="GBP">GBP (£)</option>
                            </select>
                          </div>
                        </div>

                        {/* Custom Tier / Package Name Input */}
                        {sponsorTier === "custom" && (
                          <div className="flex flex-col gap-1.5 sm:col-span-2 animate-fade-in">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Custom Package / Tier Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={customTierName}
                              onChange={(e) => setCustomTierName(e.target.value)}
                              placeholder="e.g. VIP Gala Dinner Partner, Official Tech Host"
                              className="w-full px-3.5 py-2.5 border border-blue-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 bg-blue-50/20"
                            />
                          </div>
                        )}
                      </div>

                      {/* Included Perks & Deliverables */}
                      <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Included Package Deliverables & Perks
                          </label>
                          <span className="text-[10px] font-semibold text-blue-600">
                            {sponsorPerks.length} Selected
                          </span>
                        </div>

                        {/* Deliverables Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {allAvailablePerks.map(perk => {
                            const isChecked = sponsorPerks.includes(perk.id);
                            return (
                              <div
                                key={perk.id}
                                onClick={() => toggleSponsorPerk(perk.id)}
                                className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between group ${
                                  isChecked
                                    ? "border-blue-500 bg-blue-50/70 text-blue-950 font-bold shadow-2xs"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                                  <span className="truncate">{perk.label}</span>
                                  {perk.isCustom && (
                                    <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold uppercase bg-blue-100 text-blue-700 shrink-0">
                                      Custom
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isChecked && <Check size={14} className="text-blue-600" />}
                                  {perk.isCustom && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleRemoveCustomPerk(perk.id, e)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                                      title="Remove custom deliverable"
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Add Custom Deliverable Input Bar */}
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={newCustomPerkInput}
                            onChange={(e) => setNewCustomPerkInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddCustomPerk(e);
                              }
                            }}
                            placeholder="Add custom deliverable (e.g. VIP Gala Table, Coffee Lounge)..."
                            className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 bg-white"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomPerk}
                            disabled={!newCustomPerkInput.trim()}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                          >
                            + Add Perk
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. EXHIBITOR MODE */}
                {currentMode === "exhibitor" && (
                  <div className="flex flex-col gap-6">
                    {/* Organization Selector for New Exhibitor */}
                    {!item && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Select Registered Organization <span className="text-rose-500">*</span>
                        </label>
                        <SearchableSelect
                          value={selectedOrgIdForExhibitor}
                          onChange={(val) => handleSelectOrgForExhibitor(val)}
                          options={existingOrgOptionsForExhibitor}
                          placeholder="-- Choose a registered organization to exhibit at this event --"
                          searchPlaceholder="Search registered organization..."
                          required
                        />
                      </div>
                    )}

                    {/* Form Fields */}
                    <div className="flex flex-col gap-4">

                      {/* Industry & Staff Count */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Sector / Industry
                          </label>
                          <SearchableSelect
                            value={orgIndustry}
                            onChange={(val) => setOrgIndustry(val)}
                            options={INDUSTRIES_LIST.map(ind => ({ value: ind, label: ind }))}
                            placeholder="-- Select Industry --"
                            searchPlaceholder="Search industry..."
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Staff Badge Count (Credentials)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={exhibitorStaffCount}
                            onChange={(e) => setExhibitorStaffCount(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 bg-white"
                          />
                        </div>
                      </div>

                      {/* Products & Description */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Showcase & Products Description
                        </label>
                        <textarea
                          rows={2}
                          value={exhibitorProducts}
                          onChange={(e) => setExhibitorProducts(e.target.value)}
                          placeholder="What products or innovations will this company be exhibiting?"
                          className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 resize-none bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: KEY CONTACT LIAISON (Unified across Org, Sponsor, Exhibitor)      */}
            {/* ========================================================================= */}
            {orgActiveTab === "contact" && (
              <div className="flex flex-col gap-5">
                {/* Attendee Liaison Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Select Liaison from Registered Event Attendees
                  </label>
                  <SearchableSelect
                    value={selectedLiaisonAttendeeId}
                    onChange={(val) => handleSelectLiaisonAttendee(val)}
                    options={liaisonAttendeeOptions}
                    placeholder="-- Choose a registered attendee as contact liaison --"
                    searchPlaceholder="Search attendee by name, email, or company..."
                  />
                </div>

                {/* Selected Liaison Profile Card Preview */}
                {selectedLiaisonAttendee ? (
                  <div className="p-3.5 bg-blue-50/40 border border-blue-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {getAttendeePhoto(selectedLiaisonAttendee) ? (
                        <img
                          src={getAttendeePhoto(selectedLiaisonAttendee)}
                          alt={selectedLiaisonAttendee.name}
                          className="w-11 h-11 rounded-full object-cover border border-blue-200 shadow-2xs shrink-0"
                          onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div 
                        style={{ display: getAttendeePhoto(selectedLiaisonAttendee) ? 'none' : 'flex' }}
                        className="w-11 h-11 rounded-full bg-blue-600 text-white font-black text-xs items-center justify-center shadow-2xs shrink-0"
                      >
                        {selectedLiaisonAttendee.name ? selectedLiaisonAttendee.name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2) : "CL"}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black text-slate-900 truncate">{selectedLiaisonAttendee.name}</span>
                        <span className="text-[11px] font-semibold text-blue-700 truncate">
                          {orgContactTitle || selectedLiaisonAttendee.jobTitle || selectedLiaisonAttendee.ticketType || selectedLiaisonAttendee.ticket_type || (currentMode === "sponsor" ? "Sponsor Liaison" : currentMode === "exhibitor" ? "Exhibitor Liaison" : "Corporate Liaison")}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 truncate">
                          {selectedLiaisonAttendee.email && <span>{selectedLiaisonAttendee.email}</span>}
                          {selectedLiaisonAttendee.phone && <span>• {selectedLiaisonAttendee.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectLiaisonAttendee("")}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
                      title="Unassign contact liaison"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-500 font-medium">
                    No contact liaison assigned. Choose an attendee from the registered attendees list above.
                  </div>
                )}

                {/* Internal Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Internal Organizer Notes (Private)
                  </label>
                  <textarea
                    rows={3}
                    value={orgNotes}
                    onChange={(e) => setOrgNotes(e.target.value)}
                    placeholder="Internal communication notes, billing details, contract references..."
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 resize-none"
                  />
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: COMPANY PERSONNEL & REPRESENTATIVES (Unified across all modes)    */}
            {/* ========================================================================= */}
            {orgActiveTab === "personnel" && (
              <div className="flex flex-col gap-6">

                {/* Success Message Banner */}
                {personnelSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                    <Check size={16} className="text-emerald-600" />
                    <span>{personnelSuccessMsg}</span>
                  </div>
                )}

                {/* Success Message Banner */}
                {personnelSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                    <Check size={16} className="text-emerald-600" />
                    <span>{personnelSuccessMsg}</span>
                  </div>
                )}

                {/* Quota Reached Notification Banner */}
                {isQuotaReached && (
                  <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 font-semibold">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                      <span>Staff badge limit reached ({assignedPersonnel.length} / {maxStaffBadges} credentials assigned).</span>
                    </div>
                    {currentMode === "exhibitor" && (
                      <button
                        type="button"
                        onClick={() => setOrgActiveTab("profile")}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-extrabold uppercase transition-colors cursor-pointer shrink-0"
                      >
                        Increase Badges
                      </button>
                    )}
                  </div>
                )}

                {/* Section 1: Assign from registered attendees */}
                <div className={`p-4 rounded-2xl flex flex-col gap-4 transition-all ${
                  isQuotaReached ? "bg-slate-50/70 border border-slate-200/80 opacity-70" : "bg-blue-50/40 border border-blue-100"
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">Assign Registered Attendee to Personnel</h4>
                    {maxStaffBadges !== null && (
                      <span className="text-[10px] font-bold text-slate-500">
                        Quota: <span className="font-extrabold text-blue-700">{assignedPersonnel.length}</span> / {maxStaffBadges} Badges
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Select Attendee
                      </label>
                      <SearchableSelect
                        value={selectedAttendeeIdToAssign}
                        onChange={(val) => setSelectedAttendeeIdToAssign(val)}
                        options={unassignedAttendeesOptions}
                        placeholder={isQuotaReached ? `-- Badge limit reached (${maxStaffBadges} max) --` : "-- Choose a registered attendee to add as staff --"}
                        searchPlaceholder="Search attendee by name, email, or company..."
                        disabled={isQuotaReached}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Role / Title in Company
                        </label>
                        <input
                          type="text"
                          value={assignPersonnelRole}
                          onChange={(e) => setAssignPersonnelRole(e.target.value)}
                          placeholder="e.g. Booth Manager, Senior Engineer, CEO"
                          disabled={isQuotaReached}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleAssignSelectedAttendee}
                          disabled={!selectedAttendeeIdToAssign || isAssigning || isQuotaReached}
                          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isAssigning ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                          <span>Assign Attendee</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Current Assigned Personnel List */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Users size={14} className="text-slate-500" />
                      <span>Assigned Company Personnel</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        isQuotaReached ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-100"
                      }`}>
                        {maxStaffBadges !== null ? `${assignedPersonnel.length} / ${maxStaffBadges} Badges Used` : `${assignedPersonnel.length} Assigned`}
                      </span>
                    </h4>
                  </div>

                  {assignedPersonnel.length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center flex flex-col items-center gap-2">
                      <UserCheck size={28} className="text-slate-300" />
                      <p className="text-xs font-bold text-slate-700">No personnel assigned yet</p>
                      <p className="text-[11px] text-slate-400 max-w-xs">
                        Assign registered event attendees to this company using the dropdown above.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {assignedPersonnel.map(person => {
                        const isCheckedIn = person.checkedIn || person.check_in_status === 'checked_in' || person.status === 'checked_in';
                        const photo = getAttendeePhoto(person);

                        return (
                          <div 
                            key={person.id}
                            className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-300 transition-all shadow-2xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {photo ? (
                                <img
                                  src={photo}
                                  alt={person.name}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                  onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                                />
                              ) : null}
                              <div 
                                style={{ display: photo ? 'none' : 'flex' }}
                                className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-xs items-center justify-center shrink-0"
                              >
                                {person.name ? person.name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2) : "CP"}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-slate-900 truncate">{person.name}</span>
                                  {person.isLiaison ? (
                                    <span className="px-2 py-0.2 rounded-md text-[9px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                                      Contact Liaison
                                    </span>
                                  ) : (
                                    <>
                                      {(currentMode === "sponsor" || linkedSponsor) && (
                                        <span className="px-2 py-0.2 rounded-md text-[9px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                          {sponsorTier || linkedSponsor?.tier || 'Sponsor'} Rep
                                        </span>
                                      )}
                                      {(currentMode === "exhibitor" || linkedExhibitor) && (
                                        <span className="px-2 py-0.2 rounded-md text-[9px] font-black uppercase bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                                          Exhibitor Staff
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                  <span className="font-bold text-slate-700 truncate">{person.jobTitle || 'Representative'}</span>
                                  {person.email && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span className="truncate">{person.email}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isCheckedIn ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Checked In
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                  Registered
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRemovePersonnel(person.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove from Company Personnel"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sticky Action Footer */}
            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {item?.id && (
                  <button
                    type="button"
                    onClick={handleDeleteCompany}
                    disabled={isDeleting || isSubmitting}
                    className="px-4 py-2.5 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 size={14} className="animate-spin text-rose-600" /> : <Trash2 size={14} className="text-rose-500" />}
                    <span>
                      {currentMode === "org" && "Delete Organization"}
                      {currentMode === "sponsor" && "Delete Sponsor"}
                      {currentMode === "exhibitor" && "Delete Exhibitor"}
                    </span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md bg-blue-600 hover:bg-blue-700 shadow-blue-100 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving Entry...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>
                      {currentMode === "org" && (item ? "Save Organization" : "Create Organization")}
                      {currentMode === "sponsor" && (item ? "Save Sponsor" : "Register Sponsor")}
                      {currentMode === "exhibitor" && (item ? "Save Exhibitor" : "Register Exhibitor")}
                    </span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
