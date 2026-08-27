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
  { value: "diamond", label: "💎 Diamond Tier", color: "text-sky-600 bg-sky-50 border-sky-200" },
  { value: "gold", label: "🥇 Gold Tier", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "silver", label: "🥈 Silver Tier", color: "text-slate-600 bg-slate-100 border-slate-200" },
  { value: "bronze", label: "🥉 Bronze Tier", color: "text-amber-800 bg-orange-50 border-orange-200" },
  { value: "title", label: "🌟 Title / Presenting Sponsor", color: "text-purple-700 bg-purple-50 border-purple-200" },
  { value: "partner", label: "🤝 Official Strategic Partner", color: "text-blue-700 bg-blue-50 border-blue-200" },
  { value: "custom", label: "✨ Custom Sponsorship Package", color: "text-indigo-700 bg-indigo-50 border-indigo-200" }
];

const BOOTH_TYPES = [
  { value: "Standard 3x3m (9 m²)", label: "Standard Booth 3x3m (9 m²)" },
  { value: "Premium Corner 6x3m (18 m²)", label: "Premium Corner 6x3m (18 m²)" },
  { value: "Island Pavilion 6x6m (36 m²)", label: "Island Pavilion 6x6m (36 m²)" },
  { value: "Startup Kiosk / Pod", label: "Startup Kiosk / Pod (4 m²)" },
  { value: "Custom Space", label: "Custom Exhibition Space" }
];

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
  onAssignAttendeeToCompany,
  onRemoveAttendeeFromCompany,
  onRegisterNewPersonnel,
  onUploadFile,
  activeEventId,
  eventTitle = "Eventzone Summit"
}) {
  const { t } = useLanguage();

  // Active drawer mode state (can switch within the drawer)
  const [currentMode, setCurrentMode] = useState(mode || "org");

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
  const [sponsorAmount, setSponsorAmount] = useState("");
  const [sponsorCurrency, setSponsorCurrency] = useState("DZD");
  const [sponsorPerks, setSponsorPerks] = useState(["vip_passes", "main_stage_branding"]);
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

  // Linked Sponsor & Exhibitor info for current organization
  const linkedSponsor = useMemo(() => {
    if (!item && !orgName) return null;
    const targetId = item?.id;
    const targetName = (item?.name || orgName || '').trim().toLowerCase();
    return sponsors.find(s => !s.isArchived && s.status !== 'archived' && (
      (targetId && (s.orgId === targetId || s.org_id === targetId)) ||
      (targetName && s.name && s.name.trim().toLowerCase() === targetName)
    ));
  }, [sponsors, item, orgName]);

  const linkedExhibitor = useMemo(() => {
    if (!item && !orgName) return null;
    const targetId = item?.id;
    const targetName = (item?.name || orgName || '').trim().toLowerCase();
    return exhibitors.find(e => !e.isArchived && e.status !== 'archived' && (
      (targetId && (e.orgId === targetId || e.org_id === targetId)) ||
      (targetName && e.name && e.name.trim().toLowerCase() === targetName)
    ));
  }, [exhibitors, item, orgName]);

  // List of attendees currently assigned to this company
  const assignedPersonnel = useMemo(() => {
    if (!item && !orgName) return [];
    const targetId = item?.id;
    const targetName = (item?.name || orgName || '').trim().toLowerCase();

    return (attendees || []).filter(a => {
      if (a.isArchived || a.status === 'archived') return false;
      const isMatchId = targetId && (a.orgId === targetId || a.org_id === targetId);
      const isMatchName = targetName && a.company && a.company.trim().toLowerCase() === targetName;
      return isMatchId || isMatchName;
    });
  }, [attendees, item, orgName]);

  // Dropdown options for unassigned attendees
  const unassignedAttendeesOptions = useMemo(() => {
    const assignedIds = new Set(assignedPersonnel.map(p => String(p.id)));
    return (attendees || [])
      .filter(a => !a.isArchived && a.status !== 'archived' && !assignedIds.has(String(a.id)))
      .map(a => ({
        value: String(a.id),
        label: a.name || 'Unnamed Attendee',
        description: `${a.email || 'No email'}${a.company ? ` • Current: ${a.company}` : ''} • Ticket: ${a.ticketType || a.ticket_type || 'Standard'}`,
        icon: a.image || a.avatar ? (
          <img src={a.image || a.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
        ) : (
          <User size={14} className="text-slate-400" />
        )
      }));
  }, [attendees, assignedPersonnel]);

  // Handlers for personnel assignment
  const handleAssignSelectedAttendee = async () => {
    if (!selectedAttendeeIdToAssign) return;
    setIsAssigning(true);
    setPersonnelSuccessMsg("");
    try {
      if (onAssignAttendeeToCompany) {
        await onAssignAttendeeToCompany(
          selectedAttendeeIdToAssign, 
          item || { id: item?.id, name: orgName, industry: orgIndustry }, 
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

  // Initialize/reset form state whenever item or mode changes
  useEffect(() => {
    if (isOpen) {
      setCurrentMode(mode || "org");
      setErrorMessage("");
      setIsSubmitting(false);

      if (mode === "org") {
        setOrgActiveTab("profile");
        if (item) {
          setOrgName(item.name || "");
          setOrgIndustry(item.industry || "Technology, AI & Software");
          setOrgLogo(item.logo || "");
          setOrgWebsite(item.website || "");
          setOrgAddress(item.address || "");
          setOrgDescription(item.description || "");
          setOrgContact(item.contact || "");
          setOrgContactTitle(item.jobTitle || item.contactTitle || "");
          setOrgContactEmail(item.email || item.contactEmail || "");
          setOrgContactPhone(item.phone || item.contactPhone || "");
          setOrgNotes(item.notes || "");
          setOrgStatus(item.status || (item.isArchived ? "archived" : "active"));
          setAlsoCreateSponsor(false);
          setAlsoCreateExhibitor(false);
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
          setAlsoCreateSponsor(false);
          setAlsoCreateExhibitor(false);
        }
      } else if (mode === "sponsor") {
        if (item) {
          // If editing an existing sponsor
          setOrgName(item.name || "");
          setOrgIndustry(item.industry || "Technology, AI & Software");
          setOrgLogo(item.image || item.logo || "");
          setOrgWebsite(item.website || "");
          setSponsorTier(item.tier || "silver");
          setSponsorAmount(item.amount || item.packageValue || "");
          setSponsorBooth(item.booth || item.assignedBooth || "");
          setSponsorPerks(Array.isArray(item.perks) ? item.perks : ["vip_passes", "main_stage_branding"]);
          setSponsorNotes(item.notes || "");
          if (item.orgId || item.org_id) {
            setSponsorSourceType("existing");
            setSelectedOrgIdForSponsor(String(item.orgId || item.org_id));
          } else {
            const matchedOrg = organizations.find(o => o.name?.toLowerCase() === item.name?.toLowerCase());
            if (matchedOrg) {
              setSponsorSourceType("existing");
              setSelectedOrgIdForSponsor(String(matchedOrg.id));
            } else {
              setSponsorSourceType("new");
              setSelectedOrgIdForSponsor("");
            }
          }
        } else {
          // Creating new sponsor
          setSponsorSourceType(organizations.length > 0 ? "existing" : "new");
          setSelectedOrgIdForSponsor(organizations.length > 0 ? String(organizations[0].id) : "");
          if (organizations.length > 0) {
            const first = organizations[0];
            setOrgName(first.name || "");
            setOrgIndustry(first.industry || "Technology, AI & Software");
            setOrgLogo(first.logo || "");
            setOrgWebsite(first.website || "");
            setOrgContact(first.contact || "");
          } else {
            setOrgName("");
            setOrgIndustry("Technology, AI & Software");
            setOrgLogo("");
            setOrgWebsite("");
            setOrgContact("");
          }
          setSponsorTier("silver");
          setSponsorAmount("");
          setSponsorBooth("");
          setSponsorPerks(["vip_passes", "main_stage_branding"]);
          setSponsorNotes("");
        }
      } else if (mode === "exhibitor") {
        if (item) {
          // Editing existing exhibitor
          setOrgName(item.name || "");
          setOrgIndustry(item.industry || "Technology, AI & Software");
          setOrgLogo(item.logo || item.logo_url || "");
          setOrgContact(item.contact || item.contactPerson || "");
          setOrgContactEmail(item.email || item.contactEmail || item.contact_email || "");
          setOrgContactPhone(item.phone || item.contactPhone || "");
          setExhibitorBooth(item.booth || item.boothNumber || item.booth_number || "");
          setExhibitorBoothType(item.boothType || "Standard 3x3m (9 m²)");
          setExhibitorStaffCount(item.staffCount || item.badgeCount || 2);
          setExhibitorProducts(item.description || item.products || "");
          if (item.orgId || item.org_id) {
            setExhibitorSourceType("existing");
            setSelectedOrgIdForExhibitor(String(item.orgId || item.org_id));
          } else {
            const matchedOrg = organizations.find(o => o.name?.toLowerCase() === item.name?.toLowerCase());
            if (matchedOrg) {
              setExhibitorSourceType("existing");
              setSelectedOrgIdForExhibitor(String(matchedOrg.id));
            } else {
              setExhibitorSourceType("new");
              setSelectedOrgIdForExhibitor("");
            }
          }
        } else {
          // Creating new exhibitor
          setExhibitorSourceType(organizations.length > 0 ? "existing" : "new");
          setSelectedOrgIdForExhibitor(organizations.length > 0 ? String(organizations[0].id) : "");
          if (organizations.length > 0) {
            const first = organizations[0];
            setOrgName(first.name || "");
            setOrgIndustry(first.industry || "Technology, AI & Software");
            setOrgLogo(first.logo || "");
            setOrgContact(first.contact || "");
            setOrgContactEmail(first.email || "");
            setOrgContactPhone(first.phone || "");
          } else {
            setOrgName("");
            setOrgIndustry("Technology, AI & Software");
            setOrgLogo("");
            setOrgContact("");
            setOrgContactEmail("");
            setOrgContactPhone("");
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
      setOrgContact(org.contact || "");
      if (org.email) setOrgContactEmail(org.email);
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
      setOrgContact(org.contact || "");
      setOrgContactEmail(org.email || "");
      if (org.phone) setOrgContactPhone(org.phone);
    }
  };

  // Toggle perks for sponsor
  const toggleSponsorPerk = (perkId) => {
    setSponsorPerks(prev =>
      prev.includes(perkId) ? prev.filter(p => p !== perkId) : [...prev, perkId]
    );
  };

  // Submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

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
          contact: orgContact.trim(),
          jobTitle: orgContactTitle.trim(),
          email: orgContactEmail.trim(),
          phone: orgContactPhone.trim(),
          notes: orgNotes.trim(),
          status: orgStatus,
          isArchived: orgStatus === "archived"
        };

        if (onSaveOrganization) {
          await onSaveOrganization(orgPayload, {
            createSponsor: alsoCreateSponsor,
            sponsorTier,
            sponsorAmount: sponsorAmount ? parseFloat(sponsorAmount) : null,
            createExhibitor: alsoCreateExhibitor,
            exhibitorBooth,
            exhibitorBoothType
          });
        }
      } else if (currentMode === "sponsor") {
        const selectedOrg = sponsorSourceType === "existing"
          ? organizations.find(o => String(o.id) === String(selectedOrgIdForSponsor))
          : null;

        const sponsorPayload = {
          id: item?.id,
          name: orgName.trim(),
          orgId: selectedOrg?.id || (sponsorSourceType === "existing" ? selectedOrgIdForSponsor : null),
          tier: sponsorTier,
          amount: sponsorAmount ? parseFloat(sponsorAmount) : null,
          currency: sponsorCurrency,
          website: orgWebsite.trim() ? (orgWebsite.startsWith("http") ? orgWebsite.trim() : `https://${orgWebsite.trim()}`) : "#",
          image: orgLogo || (selectedOrg?.logo || ""),
          industry: orgIndustry || (selectedOrg?.industry || ""),
          contact: orgContact.trim() || (selectedOrg?.contact || ""),
          booth: sponsorBooth.trim(),
          perks: sponsorPerks,
          notes: sponsorNotes.trim(),
          status: item?.status || "active",
          isArchived: item?.isArchived || false
        };

        if (onSaveSponsor) {
          await onSaveSponsor(sponsorPayload);
        }
      } else if (currentMode === "exhibitor") {
        const selectedOrg = exhibitorSourceType === "existing"
          ? organizations.find(o => String(o.id) === String(selectedOrgIdForExhibitor))
          : null;

        const exhibitorPayload = {
          id: item?.id,
          name: orgName.trim(),
          orgId: selectedOrg?.id || (exhibitorSourceType === "existing" ? selectedOrgIdForExhibitor : null),
          booth: exhibitorBooth.trim() || "Not Assigned",
          boothNumber: exhibitorBooth.trim() || "Not Assigned",
          boothType: exhibitorBoothType,
          industry: orgIndustry || (selectedOrg?.industry || ""),
          contact: orgContact.trim() || (selectedOrg?.contact || ""),
          contactPerson: orgContact.trim() || (selectedOrg?.contact || ""),
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
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold ${
                currentMode === "org"
                  ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                  : currentMode === "sponsor"
                  ? "bg-amber-50 text-amber-600 border border-amber-100"
                  : "bg-blue-50 text-blue-600 border border-blue-100"
              }`}>
                {currentMode === "org" && <Building2 size={20} />}
                {currentMode === "sponsor" && <Sparkles size={20} />}
                {currentMode === "exhibitor" && <Store size={20} />}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  {currentMode === "org" && (item ? `Edit ${item.name || 'Organization'}` : "Add Partner Organization")}
                  {currentMode === "sponsor" && (item ? `Edit ${item.name || 'Sponsor'}` : "Add Event Sponsor")}
                  {currentMode === "exhibitor" && (item ? `Edit ${item.name || 'Exhibitor'}` : "Register Event Exhibitor")}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {currentMode === "org" && "Manage company profile, contact liaison, and partner assets"}
                  {currentMode === "sponsor" && `Assign sponsorship tiers, package perks, and branding for ${eventTitle}`}
                  {currentMode === "exhibitor" && `Allocate booth space, staff credentials, and exhibition profile for ${eventTitle}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </header>

          {/* Mode Switcher Pills (If adding a new record) */}
          {!item && (
            <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Record Type:</span>
              <button
                type="button"
                onClick={() => setCurrentMode("org")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentMode === "org"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                }`}
              >
                <Building2 size={13} />
                <span>Organization</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentMode("sponsor")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentMode === "sponsor"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                }`}
              >
                <Sparkles size={13} />
                <span>Sponsor</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentMode("exhibitor")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentMode === "exhibitor"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                }`}
              >
                <Store size={13} />
                <span>Exhibitor</span>
              </button>
            </div>
          )}

          {/* Sub-Navigation Tabs for Organization Mode */}
          {currentMode === "org" && (
            <div className="px-6 border-b border-slate-100 bg-white flex items-center justify-between overflow-x-auto scrollbar-none">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setOrgActiveTab("profile")}
                  className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    orgActiveTab === "profile"
                      ? "border-blue-600 text-blue-600 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Building2 size={14} />
                  <span>Profile & Branding</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrgActiveTab("contact")}
                  className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    orgActiveTab === "contact"
                      ? "border-blue-600 text-blue-600 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Users size={14} />
                  <span>Contact Liaison</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrgActiveTab("roles")}
                  className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    orgActiveTab === "roles"
                      ? "border-blue-600 text-blue-600 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Sparkles size={14} />
                  <span>Sponsorship & Booth</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrgActiveTab("personnel")}
                  className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    orgActiveTab === "personnel"
                      ? "border-blue-600 text-blue-600 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <UserCheck size={14} />
                  <span>Company Personnel</span>
                  {assignedPersonnel.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-50 text-blue-700 font-black border border-blue-100">
                      {assignedPersonnel.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

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
            {/* MODE 1: ORGANIZATION FORM                                                 */}
            {/* ========================================================================= */}
            {currentMode === "org" && (
              <>
                {/* TAB 1: PROFILE & BRANDING */}
                {orgActiveTab === "profile" && (
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
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
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
                            className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
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
                          className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
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
                        className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600 resize-none"
                      />
                    </div>

                  </div>
                )}

                {/* TAB 2: KEY CONTACT LIAISON */}
                {orgActiveTab === "contact" && (
                  <div className="flex flex-col gap-5">
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center gap-3">
                      <Users size={18} className="text-indigo-600 shrink-0" />
                      <div className="text-xs text-indigo-900 font-medium">
                        Enter the primary point of contact or corporate liaison representing this organization for the event.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Contact Full Name */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Contact Person Full Name
                        </label>
                        <input
                          type="text"
                          value={orgContact}
                          onChange={(e) => setOrgContact(e.target.value)}
                          placeholder="e.g. Karim Benali"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                        />
                      </div>

                      {/* Job Title */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Job Title / Department
                        </label>
                        <input
                          type="text"
                          value={orgContactTitle}
                          onChange={(e) => setOrgContactTitle(e.target.value)}
                          placeholder="e.g. Partnership Director, Marketing Lead"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                        />
                      </div>

                      {/* Contact Email */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Official Contact Email
                        </label>
                        <div className="relative">
                          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            value={orgContactEmail}
                            onChange={(e) => setOrgContactEmail(e.target.value)}
                            placeholder="contact@company.com"
                            className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                          />
                        </div>
                      </div>

                      {/* Contact Phone */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Direct Phone Number
                        </label>
                        <CountryPhoneInput
                          value={orgContactPhone}
                          onChange={(val) => setOrgContactPhone(val)}
                          placeholder="550 12 34 56"
                          className="w-full"
                        />
                      </div>
                    </div>

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
                        className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600 resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: SPONSORSHIP & BOOTH LINKAGE */}
                {orgActiveTab === "roles" && (
                  <div className="flex flex-col gap-6">
                    <div className="text-xs text-slate-500 font-medium">
                      Simultaneously activate this company as an official event sponsor or booth exhibitor.
                    </div>

                    {/* Sponsor Option Toggle */}
                    <div className={`p-4 rounded-2xl border transition-all ${alsoCreateSponsor ? "border-amber-300 bg-amber-50/40" : "border-slate-200 bg-white"}`}>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={alsoCreateSponsor}
                          onChange={(e) => setAlsoCreateSponsor(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Sparkles size={14} className="text-amber-500" />
                            <span>Designate as Official Event Sponsor</span>
                          </span>
                          <span className="text-[11px] text-slate-500 font-normal mt-0.5">
                            Feature this organization in the Sponsors Directory and public event landing page.
                          </span>
                        </div>
                      </label>

                      {alsoCreateSponsor && (
                        <div className="mt-4 pt-4 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Sponsorship Tier
                            </label>
                            <SearchableSelect
                              value={sponsorTier}
                              onChange={(val) => setSponsorTier(val)}
                              options={SPONSOR_TIERS}
                              placeholder="-- Select Tier --"
                              isClearable={false}
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Sponsorship Package Value
                            </label>
                            <div className="relative">
                              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="number"
                                value={sponsorAmount}
                                onChange={(e) => setSponsorAmount(e.target.value)}
                                placeholder="e.g. 500000"
                                className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Exhibitor Option Toggle */}
                    <div className={`p-4 rounded-2xl border transition-all ${alsoCreateExhibitor ? "border-blue-300 bg-blue-50/40" : "border-slate-200 bg-white"}`}>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={alsoCreateExhibitor}
                          onChange={(e) => setAlsoCreateExhibitor(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Store size={14} className="text-blue-500" />
                            <span>Designate as Event Exhibitor</span>
                          </span>
                          <span className="text-[11px] text-slate-500 font-normal mt-0.5">
                            Allocate exhibition space, booth identifier, and staff credentials for the floor plan.
                          </span>
                        </div>
                      </label>

                      {alsoCreateExhibitor && (
                        <div className="mt-4 pt-4 border-t border-blue-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Booth Number / Code
                            </label>
                            <input
                              type="text"
                              value={exhibitorBooth}
                              onChange={(e) => setExhibitorBooth(e.target.value)}
                              placeholder="e.g. Booth A-101, Pavilion 3"
                              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Booth Configuration
                            </label>
                            <SearchableSelect
                              value={exhibitorBoothType}
                              onChange={(val) => setExhibitorBoothType(val)}
                              options={BOOTH_TYPES}
                              placeholder="-- Select Booth Type --"
                              isClearable={false}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status selection */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Organization Status
                      </label>
                      <SearchableSelect
                        value={orgStatus}
                        onChange={(val) => setOrgStatus(val)}
                        options={[
                          { value: "active", label: "Active Partner" },
                          { value: "pending", label: "Pending Verification" },
                          { value: "archived", label: "Archived" }
                        ]}
                        placeholder="-- Select Status --"
                        isClearable={false}
                      />
                    </div>

                  </div>
                )}

                {/* TAB 4: COMPANY PERSONNEL & REPRESENTATIVES */}
                {orgActiveTab === "personnel" && (
                  <div className="flex flex-col gap-6">
                    {/* Status & Credentialing Banner */}
                    <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      linkedSponsor 
                        ? "bg-amber-50/50 border-amber-200 text-amber-900"
                        : linkedExhibitor
                        ? "bg-blue-50/50 border-blue-200 text-blue-900"
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          linkedSponsor 
                            ? "bg-amber-100 text-amber-700" 
                            : linkedExhibitor 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-slate-200 text-slate-700"
                        }`}>
                          {linkedSponsor ? <Award size={20} /> : linkedExhibitor ? <Store size={20} /> : <Building2 size={20} />}
                        </div>
                        <div>
                          <div className="text-xs font-black flex items-center gap-2 flex-wrap">
                            <span>{item?.name || orgName || "This Organization"}</span>
                            {linkedSponsor && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                                {linkedSponsor.tier || "Official"} Sponsor
                              </span>
                            )}
                            {linkedExhibitor && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-300">
                                {linkedExhibitor.booth || "Booth Allocated"}
                              </span>
                            )}
                            {!linkedSponsor && !linkedExhibitor && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                                Partner Organization
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                            {linkedSponsor && linkedExhibitor
                              ? "Assigned personnel will automatically receive both Sponsor Representative and Exhibitor Staff credentials across badges, check-in, and attendee directories."
                              : linkedSponsor
                              ? `Assigned personnel will automatically appear as ${linkedSponsor.tier ? linkedSponsor.tier.toUpperCase() : ''} Sponsor Representatives across attendee lists, check-in, and badges.`
                              : linkedExhibitor
                              ? `Assigned personnel will automatically appear as Exhibitor Staff with booth credentials for ${linkedExhibitor.booth || 'the exhibition'}.`
                              : "Assigned personnel will represent this company as official Partner Organization Delegates."}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xl font-black text-slate-900">{assignedPersonnel.length}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Staff</div>
                      </div>
                    </div>

                    {personnelSuccessMsg && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>{personnelSuccessMsg}</span>
                      </div>
                    )}

                    {/* Section 1: Assign Existing Registered Attendee */}
                    <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col gap-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                          <UserCheck size={15} className="text-blue-600" />
                          <span>Assign Registered Attendee to this Company</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                        <div className="sm:col-span-7 flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Select Event Attendee
                          </label>
                          <SearchableSelect
                            value={selectedAttendeeIdToAssign}
                            onChange={(val) => {
                              setSelectedAttendeeIdToAssign(val);
                              const att = (attendees || []).find(a => String(a.id) === String(val));
                              if (att && !assignPersonnelRole) {
                                setAssignPersonnelRole(att.jobTitle || "Company Representative");
                              }
                            }}
                            options={unassignedAttendeesOptions}
                            placeholder="-- Choose Attendee to Assign --"
                            searchPlaceholder="Search attendee by name, email, company..."
                            isClearable={false}
                          />
                        </div>

                        <div className="sm:col-span-5 flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Company Job Title / Role
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={assignPersonnelRole}
                              onChange={(e) => setAssignPersonnelRole(e.target.value)}
                              placeholder="e.g. Lead Engineer, Booth Staff"
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/50"
                            />
                            <button
                              type="button"
                              onClick={handleAssignSelectedAttendee}
                              disabled={!selectedAttendeeIdToAssign || isAssigning}
                              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs whitespace-nowrap cursor-pointer transition-colors shrink-0 shadow-xs shadow-blue-100 flex items-center gap-1"
                            >
                              {isAssigning ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                              <span>Assign</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Quick Register New Personnel */}
                    <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                          <UserPlus size={15} className="text-blue-600" />
                          <span>Need to add a staff member not yet registered?</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddingNewStaff(prev => !prev)}
                          className="text-xs font-extrabold text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          {isAddingNewStaff ? "Cancel" : "+ Register New Staff"}
                        </button>
                      </div>

                      {isAddingNewStaff && (
                        <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Full Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={newStaffName}
                              onChange={(e) => setNewStaffName(e.target.value)}
                              placeholder="e.g. Youcef Mansouri"
                              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Email Address <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="email"
                              value={newStaffEmail}
                              onChange={(e) => setNewStaffEmail(e.target.value)}
                              placeholder="youcef@company.com"
                              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Job Title / Position
                            </label>
                            <input
                              type="text"
                              value={newStaffJobTitle}
                              onChange={(e) => setNewStaffJobTitle(e.target.value)}
                              placeholder="e.g. Sales Executive, Booth Representative"
                              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Phone (Optional)
                            </label>
                            <input
                              type="tel"
                              value={newStaffPhone}
                              onChange={(e) => setNewStaffPhone(e.target.value)}
                              placeholder="+213 550 12 34 56"
                              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                            />
                          </div>

                          <div className="sm:col-span-2 flex justify-end mt-1">
                            <button
                              type="button"
                              onClick={handleRegisterPersonnel}
                              disabled={!newStaffName.trim() || !newStaffEmail.trim() || isAssigning}
                              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-xs shadow-blue-100 flex items-center gap-1.5"
                            >
                              {isAssigning ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                              <span>Register & Assign to {item?.name || orgName || 'Company'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section 3: Assigned Personnel List */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-2">
                          <span>Assigned Company Personnel</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-100">
                            {assignedPersonnel.length}
                          </span>
                        </h4>
                      </div>

                      {assignedPersonnel.length === 0 ? (
                        <div className="p-8 bg-white border border-dashed border-slate-200 rounded-2xl text-center flex flex-col items-center justify-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                            <Users size={20} />
                          </div>
                          <p className="text-xs font-bold text-slate-700">No personnel assigned yet</p>
                          <p className="text-[11px] text-slate-400 max-w-xs">
                            Select an event attendee from the dropdown above to link them to {item?.name || orgName || 'this company'}.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2.5">
                          {assignedPersonnel.map(person => {
                            const isCheckedIn = Boolean(person.status === 'checked-in' || person.status === 'checked_in' || person.checkedIn || person.checked_in);

                            return (
                              <div 
                                key={person.id} 
                                className="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3 group"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {person.image || person.avatar ? (
                                    <img 
                                      src={person.image || person.avatar} 
                                      alt="" 
                                      className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0" 
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-black text-sm flex items-center justify-center shrink-0 border border-blue-100">
                                      {person.name ? person.name.charAt(0).toUpperCase() : 'P'}
                                    </div>
                                  )}

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h5 className="text-xs font-extrabold text-slate-900 truncate">{person.name}</h5>
                                      
                                      {/* Live role badges */}
                                      {linkedSponsor && (
                                        <span className="px-2 py-0.2 rounded-md text-[9px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                          {linkedSponsor.tier || 'Sponsor'} Rep
                                        </span>
                                      )}
                                      {linkedExhibitor && (
                                        <span className="px-2 py-0.2 rounded-md text-[9px] font-black uppercase bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                                          Exhibitor Staff
                                        </span>
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
              </>
            )}

            {/* ========================================================================= */}
            {/* MODE 2: SPONSOR FORM                                                      */}
            {/* ========================================================================= */}
            {currentMode === "sponsor" && (
              <div className="flex flex-col gap-6">

                {/* 1. Link from Existing Organization vs New */}
                {!item && (
                  <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl flex flex-col gap-3">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-600" />
                      <span>Company Source</span>
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSponsorSourceType("existing")}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                          sponsorSourceType === "existing"
                            ? "border-amber-500 bg-white ring-2 ring-amber-500/20 shadow-xs"
                            : "border-slate-200 bg-white/60 hover:bg-white"
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-800">Select Registered Org</span>
                        <span className="text-[10px] text-slate-500">Pick from existing partner organizations</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSponsorSourceType("new")}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                          sponsorSourceType === "new"
                            ? "border-amber-500 bg-white ring-2 ring-amber-500/20 shadow-xs"
                            : "border-slate-200 bg-white/60 hover:bg-white"
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-800">Create New Brand</span>
                        <span className="text-[10px] text-slate-500">Add a brand new sponsor company</span>
                      </button>
                    </div>

                    {sponsorSourceType === "existing" && (
                      <div className="mt-2 flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          Choose Existing Organization <span className="text-rose-500">*</span>
                        </label>
                        <SearchableSelect
                          value={selectedOrgIdForSponsor}
                          onChange={(val) => handleSelectOrgForSponsor(val)}
                          options={existingOrgOptions}
                          placeholder="-- Choose Organization --"
                          searchPlaceholder="Search registered organization..."
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Company Details (Pre-filled if existing org selected, or editable) */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-4">
                  <span className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building2 size={14} className="text-slate-500" />
                      <span>Sponsor Branding & Info</span>
                    </span>
                    {sponsorSourceType === "existing" && (
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded-full">
                        Linked with Organization
                      </span>
                    )}
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
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Award size={14} className="text-amber-500" />
                    <span>Sponsorship Tier & Package</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Sponsor Tier Level <span className="text-rose-500">*</span>
                      </label>
                      <SearchableSelect
                        value={sponsorTier}
                        onChange={(val) => setSponsorTier(val)}
                        options={SPONSOR_TIERS}
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

                    {/* Assigned Booth (Optional) */}
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Allocated VIP Lounge / Sponsor Booth (Optional)
                      </label>
                      {availableBooths.length > 0 ? (
                        <SearchableSelect
                          value={sponsorBooth}
                          onChange={(val) => setSponsorBooth(val)}
                          options={[
                            { value: "", label: "-- None / No Booth --" },
                            ...availableBooths
                          ]}
                          placeholder="-- Select Booth from Floor Plan or enter custom --"
                          searchPlaceholder="Search booth..."
                        />
                      ) : (
                        <input
                          type="text"
                          value={sponsorBooth}
                          onChange={(e) => setSponsorBooth(e.target.value)}
                          placeholder="e.g. VIP Suite A, Booth S-01"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                        />
                      )}
                    </div>
                  </div>

                  {/* Included Perks & Deliverables */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Included Package Deliverables & Perks
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SPONSOR_PERKS_OPTIONS.map(perk => {
                        const isChecked = sponsorPerks.includes(perk.id);
                        return (
                          <button
                            key={perk.id}
                            type="button"
                            onClick={() => toggleSponsorPerk(perk.id)}
                            className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                              isChecked
                                ? "border-amber-400 bg-amber-50/60 text-amber-950 font-bold"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            <span>{perk.label}</span>
                            {isChecked && <Check size={14} className="text-amber-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* MODE 3: EXHIBITOR FORM                                                    */}
            {/* ========================================================================= */}
            {currentMode === "exhibitor" && (
              <div className="flex flex-col gap-6">

                {/* 1. Link from Existing Organization vs New */}
                {!item && (
                  <div className="p-4 bg-blue-50/50 border border-blue-200/80 rounded-2xl flex flex-col gap-3">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Store size={14} className="text-blue-600" />
                      <span>Exhibitor Organization Source</span>
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setExhibitorSourceType("existing")}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                          exhibitorSourceType === "existing"
                            ? "border-blue-500 bg-white ring-2 ring-blue-500/20 shadow-xs"
                            : "border-slate-200 bg-white/60 hover:bg-white"
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-800">Select Registered Org</span>
                        <span className="text-[10px] text-slate-500">Pick from existing partner organizations</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExhibitorSourceType("new")}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                          exhibitorSourceType === "new"
                            ? "border-blue-500 bg-white ring-2 ring-blue-500/20 shadow-xs"
                            : "border-slate-200 bg-white/60 hover:bg-white"
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-800">Create New Exhibitor</span>
                        <span className="text-[10px] text-slate-500">Register new exhibitor company</span>
                      </button>
                    </div>

                    {exhibitorSourceType === "existing" && (
                      <div className="mt-2 flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          Choose Existing Organization <span className="text-rose-500">*</span>
                        </label>
                        <SearchableSelect
                          value={selectedOrgIdForExhibitor}
                          onChange={(val) => handleSelectOrgForExhibitor(val)}
                          options={existingOrgOptions}
                          placeholder="-- Choose Organization --"
                          searchPlaceholder="Search registered organization..."
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Exhibitor Branding & Profile */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-4">
                  <span className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building2 size={14} className="text-slate-500" />
                      <span>Exhibitor Brand Details</span>
                    </span>
                    {exhibitorSourceType === "existing" && (
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded-full">
                        Linked with Organization
                      </span>
                    )}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Exhibitor Brand / Company Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="e.g. Huawei Enterprise, Yassir, Djezzy"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 bg-white"
                      />
                    </div>

                    {/* Logo */}
                    <div className="sm:col-span-2">
                      <FormImageUploader
                        value={orgLogo}
                        onChange={(url) => setOrgLogo(url)}
                        label="Exhibitor Logo / Banner Icon"
                        placeholder="Upload exhibitor logo for floor plan interactive pins"
                      />
                    </div>

                    {/* Sector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Industry / Showcase Category
                      </label>
                      <SearchableSelect
                        value={orgIndustry}
                        onChange={(val) => setOrgIndustry(val)}
                        options={INDUSTRIES_LIST.map(i => ({ value: i, label: i }))}
                        placeholder="-- Select Industry --"
                        searchPlaceholder="Search industry..."
                      />
                    </div>

                    {/* Staff Quota */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Staff Badge Passes Quota
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={exhibitorStaffCount}
                        onChange={(e) => setExhibitorStaffCount(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Booth Space Allocation */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col gap-4">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers size={14} className="text-blue-600" />
                    <span>Floor Plan Booth Allocation</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Booth Number */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Assigned Booth Number / Code <span className="text-rose-500">*</span>
                      </label>
                      {availableBooths.length > 0 ? (
                        <SearchableSelect
                          value={exhibitorBooth}
                          onChange={(val) => setExhibitorBooth(val)}
                          options={availableBooths}
                          placeholder="-- Select Booth from Floor Plan --"
                          searchPlaceholder="Search booth number..."
                          required
                        />
                      ) : (
                        <input
                          type="text"
                          required
                          value={exhibitorBooth}
                          onChange={(e) => setExhibitorBooth(e.target.value)}
                          placeholder="e.g. Booth A-12, Pavilion B"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                        />
                      )}
                    </div>

                    {/* Booth Type */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Booth Space Type & Size
                      </label>
                      <SearchableSelect
                        value={exhibitorBoothType}
                        onChange={(val) => setExhibitorBoothType(val)}
                        options={BOOTH_TYPES}
                        placeholder="-- Select Booth Type --"
                        isClearable={false}
                      />
                    </div>

                    {/* Staff Representative Contact */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Booth Manager / Representative
                      </label>
                      <input
                        type="text"
                        value={orgContact}
                        onChange={(e) => setOrgContact(e.target.value)}
                        placeholder="e.g. Sarah Mansouri"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    {/* Contact Email */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Staff Contact Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={orgContactEmail}
                        onChange={(e) => setOrgContactEmail(e.target.value)}
                        placeholder="exhibitor@company.com"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    {/* Contact Phone */}
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Staff Phone Number
                      </label>
                      <CountryPhoneInput
                        value={orgContactPhone}
                        onChange={(val) => setOrgContactPhone(val)}
                        placeholder="550 12 34 56"
                        className="w-full"
                      />
                    </div>

                    {/* Products / Showcase Description */}
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Products & Showcase Description
                      </label>
                      <textarea
                        rows={3}
                        value={exhibitorProducts}
                        onChange={(e) => setExhibitorProducts(e.target.value)}
                        placeholder="Description of products, services, and live demos showcased at the booth..."
                        className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 resize-none"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Sticky Action Footer */}
            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                  currentMode === "org"
                    ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                    : currentMode === "sponsor"
                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
                }`}
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
