/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, Check, Loader2, Plus, Trash2, Camera, 
  ShieldCheck, LogOut, Edit3, ExternalLink, Link as LinkIcon, 
  AlertCircle, X, Upload, Globe, Mail, MapPin, Phone
} from "lucide-react";
import { uploadProfileAvatar } from "../lib/db";
import UniversalTopBar from "./UniversalTopBar";
import CountryPhoneInput from "./CountryPhoneInput";
import { ProfileSkeleton } from "./SkeletonLoaders";

// Curated list of popular summit networking & matchmaking interests
const CURATED_INTERESTS = [
  "Artificial Intelligence",
  "Machine Learning",
  "Fintech",
  "SaaS & Enterprise",
  "Venture Capital",
  "Angel Investing",
  "Product Design",
  "Growth & Marketing",
  "Cloud & DevOps",
  "Cybersecurity",
  "Web3 & Blockchain",
  "HealthTech",
  "CleanTech & Climate",
  "Robotics & IoT",
  "E-Commerce",
  "EdTech"
];

// App-Matched Networking Objectives / What I'm Looking For Options
const LOOKING_FOR_OPTIONS = [
  { 
    id: "Investors", 
    label: "Investors & VCs", 
    desc: "Seeking seed funding, angel investors, or venture capital"
  },
  { 
    id: "Clients", 
    label: "Clients & Customers", 
    desc: "Looking for B2B buyers, pilot clients, enterprise leads"
  },
  { 
    id: "Partners", 
    label: "Strategic Partnerships", 
    desc: "Distribution, co-marketing, technology alliances"
  },
  { 
    id: "Co-founders", 
    label: "Co-founders", 
    desc: "Finding technical, business, or operational co-founders"
  },
  { 
    id: "Opportunities", 
    label: "Career & Projects", 
    desc: "Exploring new full-time roles, consulting, contracting"
  },
  { 
    id: "Sponsors", 
    label: "Sponsors & Backers", 
    desc: "Attracting brand sponsors, event backing, grant support"
  },
  { 
    id: "Influencers", 
    label: "Media & PR", 
    desc: "Press coverage, podcast interviews, keynote speakers"
  },
  { 
    id: "Talent", 
    label: "Talent & Hiring", 
    desc: "Recruiting top engineers, product designers, growth leads"
  },
  { 
    id: "Mentorship", 
    label: "Mentors & Advisors", 
    desc: "Guidance from seasoned founders, executives, industry experts"
  },
  { 
    id: "Suppliers", 
    label: "Suppliers & Vendors", 
    desc: "Procurement, software tooling, logistics solutions"
  }
];

// Helper to parse 'what_im_looking_for' comma string into array
const parseLookingFor = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    return raw.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [];
};

// ============================================================================
// PLATFORM ICONS & CATALOG FOR SOCIAL LINKS
// ============================================================================
const SOCIAL_PLATFORMS = [
  {
    id: "linkedin",
    name: "LinkedIn",
    defaultTitle: "LinkedIn",
    placeholder: "https://linkedin.com/in/username",
    color: "bg-[#0A66C2] text-white",
    renderIcon: ({ size = 15, className = "" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect x="2" y="9" width="4" height="12"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    )
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    defaultTitle: "X (Twitter)",
    placeholder: "https://x.com/username or @username",
    color: "bg-black text-white",
    renderIcon: ({ size = 15, className = "" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )
  },
  {
    id: "github",
    name: "GitHub",
    defaultTitle: "GitHub",
    placeholder: "https://github.com/username",
    color: "bg-[#24292e] text-white",
    renderIcon: ({ size = 15, className = "" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
      </svg>
    )
  },
  {
    id: "website",
    name: "Website / Portfolio",
    defaultTitle: "Personal Website",
    placeholder: "https://myportfolio.com",
    color: "bg-[#059669] text-white",
    renderIcon: ({ size = 15, className = "" }) => (
      <Globe size={size} className={className} />
    )
  },
  {
    id: "instagram",
    name: "Instagram",
    defaultTitle: "Instagram",
    placeholder: "https://instagram.com/username",
    color: "bg-[#DD2A7B] text-white",
    renderIcon: ({ size = 15, className = "" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    )
  },
  {
    id: "youtube",
    name: "YouTube",
    defaultTitle: "YouTube Channel",
    placeholder: "https://youtube.com/@channel",
    color: "bg-[#FF0000] text-white",
    renderIcon: ({ size = 15, className = "" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  },
  {
    id: "discord",
    name: "Discord",
    defaultTitle: "Discord Server / Profile",
    placeholder: "https://discord.gg/invite or username",
    color: "bg-[#5865F2] text-white",
    renderIcon: ({ size = 15, className = "" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    )
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    defaultTitle: "WhatsApp",
    placeholder: "https://wa.me/number or phone",
    color: "bg-[#25D366] text-white",
    renderIcon: ({ size = 15, className = "" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17.472 14.382c-.301-.15-1.776-.876-2.05-.976-.275-.1-.475-.15-.675.15-.2.3-.775.976-.95 1.176-.175.2-.35.225-.65.075-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.785-1.675-2.085-.175-.3-.018-.462.132-.612.135-.135.301-.35.451-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.243-.585-.491-.505-.675-.515-.175-.01-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.115 3.23 5.124 4.53.716.31 1.275.495 1.71.635.719.23 1.374.197 1.892.12.577-.087 1.776-.725 2.026-1.425.25-.7.25-1.3.175-1.425-.075-.125-.275-.2-.575-.35zM12 21.84a9.78 9.78 0 0 1-4.99-1.37l-.36-.21-3.71.97.99-3.62-.23-.37A9.84 9.84 0 1 1 12 21.84zM12 0C5.373 0 0 5.373 0 12a11.96 11.96 0 0 0 1.636 6.075L0 24l6.105-1.602A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
      </svg>
    )
  },
  {
    id: "telegram",
    name: "Telegram",
    defaultTitle: "Telegram",
    placeholder: "https://t.me/username",
    color: "bg-[#229ED9] text-white",
    renderIcon: ({ size = 15, className = "" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    )
  },
  {
    id: "medium",
    name: "Medium / Blog",
    defaultTitle: "Medium Blog",
    placeholder: "https://medium.com/@username",
    color: "bg-black text-white",
    renderIcon: ({ size = 15, className = "" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42c1.87 0 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
      </svg>
    )
  },
  {
    id: "dribbble",
    name: "Dribbble",
    defaultTitle: "Dribbble Portfolio",
    placeholder: "https://dribbble.com/username",
    color: "bg-[#EA4C89] text-white",
    renderIcon: ({ size = 15, className = "" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm9.73 10.82c-.88-.04-2.82-.1-5.46.68a26.68 26.68 0 0 0-1.74-3.69c3.34-1.42 6.55-.45 7.2 3.01zm-9.35-7.44c1.19 1.48 2.22 3.18 3.03 5.01-2.97.98-6.19 1.4-9.34 1.45 1.05-3.37 3.52-5.83 6.31-6.46zm-8.3 8.35l.06-.01c3.55-.06 7.21-.55 10.51-1.67.43.91.81 1.85 1.14 2.81-4.71 1.49-8.48 4.41-10.45 8.16A9.97 9.97 0 0 1 4.08 11.73zm8.34 9.93c-2.48 0-4.75-.9-6.5-2.41 1.76-3.39 5.09-6.07 9.38-7.45a27.17 27.17 0 0 1 2.27 7.74 9.92 9.92 0 0 1-5.15 2.12zm7.1-3.69a25.1 25.1 0 0 0-2.02-6.93c2.25-.66 3.97-.66 4.79-.59a9.97 9.97 0 0 1-2.77 7.52z"/>
      </svg>
    )
  },
  {
    id: "calendly",
    name: "Calendly / Meeting",
    defaultTitle: "Book a Meeting",
    placeholder: "https://calendly.com/username",
    color: "bg-[#006BFF] text-white",
    renderIcon: ({ size = 15, className = "" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    )
  },
  {
    id: "email",
    name: "Email Contact",
    defaultTitle: "Direct Email",
    placeholder: "mailto:contact@example.com",
    color: "bg-[#D97706] text-white",
    renderIcon: ({ size = 15, className = "" }) => (
      <Mail size={size} className={className} />
    )
  }
];

const matchPlatformId = (platStr) => {
  if (!platStr) return "website";
  const s = platStr.toLowerCase();
  if (s.includes("linkedin")) return "linkedin";
  if (s.includes("twitter") || s === "x" || s.includes("x (twitter)")) return "twitter";
  if (s.includes("github")) return "github";
  if (s.includes("whatsapp") || s.includes("phone")) return "whatsapp";
  if (s.includes("instagram")) return "instagram";
  if (s.includes("youtube")) return "youtube";
  if (s.includes("telegram")) return "telegram";
  if (s.includes("discord")) return "discord";
  if (s.includes("medium")) return "medium";
  if (s.includes("dribbble")) return "dribbble";
  if (s.includes("calendly")) return "calendly";
  if (s.includes("email") || s.includes("mail")) return "email";
  if (s.includes("website") || s.includes("company")) return "website";
  return "website";
};

// Helper to normalize socialLinks from Mobile App (metadata.socials) or DB
const normalizeSocialLinks = (user) => {
  if (!user) return [];

  // 1. Prioritize metadata.socials (Used by Mobile App)
  const metaSocials = user.metadata?.socials;
  if (Array.isArray(metaSocials) && metaSocials.length > 0) {
    return metaSocials.map((item, idx) => ({
      id: `social-meta-${idx}-${Date.now()}`,
      platform: matchPlatformId(item.platform),
      title: item.label || item.platform || "Social Link",
      url: item.value || ""
    })).filter(s => s.url && s.url.trim());
  }

  // 2. Check if socialLinks or social_links is an array
  const rawList = user.socialLinks || user.social_links;
  if (Array.isArray(rawList) && rawList.length > 0) {
    return rawList.map((item, idx) => {
      const plat = item.platform || "Website";
      return {
        id: item.id || `social-list-${idx}-${Date.now()}`,
        platform: matchPlatformId(plat),
        title: item.title || item.label || plat || "Social Link",
        url: item.url || item.value || ""
      };
    }).filter(s => s.url && s.url.trim());
  }

  // 3. Check if social_links is a key-value object { linkedin: "...", email: "..." }
  if (rawList && typeof rawList === "object") {
    const list = [];
    Object.entries(rawList).forEach(([key, val], idx) => {
      if (val && typeof val === "string") {
        list.push({
          id: `social-obj-${idx}-${Date.now()}`,
          platform: matchPlatformId(key),
          title: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
          url: val
        });
      }
    });
    if (list.length > 0) return list;
  }

  return [];
};

export default function ProfileView({
  currentUser,
  isLoading = false,
  onSaveProfile,
  onGoToHome,
  onOpenAuth,
  onSignOut,
  registrations = []
}) {
  const [activeTab, setActiveTab] = useState("general"); // "general" | "looking_for" | "interests" | "socials"
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [customTagInput, setCustomTagInput] = useState("");
  const [customLookingForInput, setCustomLookingForInput] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [interests, setInterests] = useState([]);
  const [selectedLookingFor, setSelectedLookingFor] = useState([]);
  const [socialLinksList, setSocialLinksList] = useState([]);

  // Add / Edit Social Link Modal State
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [editingSocialId, setEditingSocialId] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState("linkedin");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkFormError, setLinkFormError] = useState("");

  // Populate from currentUser on load
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || currentUser.full_name || "");
      setJobTitle(currentUser.jobTitle || currentUser.job_title || "");
      setCompanyName(currentUser.companyName || currentUser.company_name || currentUser.company || "");
      setLocation(currentUser.location || currentUser.address || "");
      setPhone(currentUser.phone || "");
      setBio(currentUser.bio || "");
      setAvatar(currentUser.avatar || currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName || currentUser.full_name || "User")}&background=0b5cdb&color=fff`);
      setInterests(Array.isArray(currentUser.interests) ? [...currentUser.interests] : []);
      
      const rawLooking = currentUser.what_im_looking_for || currentUser.whatImLookingFor || "";
      setSelectedLookingFor(parseLookingFor(rawLooking));
      
      setSocialLinksList(normalizeSocialLinks(currentUser));
    }
  }, [currentUser]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // If user is not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Sign in to Access Your Profile</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Create or sign in to your Eventzone account to customize your professional networking profile and sync with the companion mobile app.
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => onOpenAuth && onOpenAuth("signin")}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              Sign In to Eventzone
            </button>
            <button
              onClick={onGoToHome}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle Desktop Image File Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 5MB.");
      return;
    }

    setUploadingPhoto(true);
    try {
      const publicUrl = await uploadProfileAvatar(file, currentUser.id);
      if (publicUrl) {
        setAvatar(publicUrl);

        if (onSaveProfile) {
          const autoSavePayload = {
            id: currentUser.id,
            email: currentUser.email,
            role: currentUser.role,
            fullName: fullName.trim() || currentUser.fullName,
            full_name: fullName.trim() || currentUser.fullName,
            jobTitle: jobTitle.trim(),
            job_title: jobTitle.trim(),
            companyName: companyName.trim(),
            company_name: companyName.trim(),
            location: location.trim(),
            phone: phone.trim(),
            bio: bio.trim(),
            avatar: publicUrl,
            avatar_url: publicUrl,
            interests: interests,
            what_im_looking_for: selectedLookingFor.join(", "),
            whatImLookingFor: selectedLookingFor.join(", "),
            socialLinks: socialLinksList,
            social_links: socialLinksList,
            metadata: currentUser.metadata || {},
          };
          await onSaveProfile(autoSavePayload);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      }
    } catch (err) {
      console.error("Storage avatar upload failed:", err);
      alert("Failed to upload profile photo. Please try another image file.");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Remove Photo
  const handleRemovePhoto = async () => {
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || "User")}&background=0b5cdb&color=fff`;
    setAvatar(defaultAvatar);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (onSaveProfile) {
      const autoSavePayload = {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        fullName: fullName.trim() || currentUser.fullName,
        full_name: fullName.trim() || currentUser.fullName,
        jobTitle: jobTitle.trim(),
        job_title: jobTitle.trim(),
        companyName: companyName.trim(),
        company_name: companyName.trim(),
        location: location.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        avatar: defaultAvatar,
        avatar_url: defaultAvatar,
        interests: interests,
        what_im_looking_for: selectedLookingFor.join(", "),
        whatImLookingFor: selectedLookingFor.join(", "),
        socialLinks: socialLinksList,
        social_links: socialLinksList,
        metadata: currentUser.metadata || {},
      };
      await onSaveProfile(autoSavePayload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Toggle "What I'm looking for" option
  const toggleLookingFor = (itemId) => {
    if (selectedLookingFor.includes(itemId)) {
      setSelectedLookingFor(selectedLookingFor.filter(i => i !== itemId));
    } else {
      setSelectedLookingFor([...selectedLookingFor, itemId]);
    }
  };

  // Add custom "What I'm looking for" objective
  const handleAddCustomLookingFor = (e) => {
    e?.preventDefault();
    const clean = customLookingForInput.trim();
    if (clean && !selectedLookingFor.includes(clean)) {
      setSelectedLookingFor([...selectedLookingFor, clean]);
      setCustomLookingForInput("");
    }
  };

  // Remove looking for item
  const removeLookingFor = (itemToRemove) => {
    setSelectedLookingFor(selectedLookingFor.filter(i => i !== itemToRemove));
  };

  // Toggle interest chip
  const toggleInterest = (tag) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter(t => t !== tag));
    } else {
      if (interests.length < 12) {
        setInterests([...interests, tag]);
      }
    }
  };

  // Add custom interest tag
  const handleAddCustomTag = (e) => {
    e?.preventDefault();
    const clean = customTagInput.trim();
    if (clean && !interests.includes(clean)) {
      if (interests.length < 12) {
        setInterests([...interests, clean]);
        setCustomTagInput("");
      }
    }
  };

  // Remove tag
  const removeInterest = (tagToRemove) => {
    setInterests(interests.filter(t => t !== tagToRemove));
  };

  // Open modal to Add a new social link
  const openAddSocialModal = () => {
    setEditingSocialId(null);
    setSelectedPlatform("linkedin");
    setLinkTitle("LinkedIn");
    setLinkUrl("");
    setLinkFormError("");
    setIsSocialModalOpen(true);
  };

  // Open modal to Edit existing social link
  const openEditSocialModal = (item) => {
    setEditingSocialId(item.id);
    setSelectedPlatform(item.platform || "website");
    setLinkTitle(item.title || "");
    setLinkUrl(item.url || "");
    setLinkFormError("");
    setIsSocialModalOpen(true);
  };

  // Select platform in modal
  const handlePlatformSelect = (platId) => {
    setSelectedPlatform(platId);
    const plat = SOCIAL_PLATFORMS.find(p => p.id === platId);
    if (plat && (!linkTitle || SOCIAL_PLATFORMS.some(p => p.defaultTitle === linkTitle))) {
      setLinkTitle(plat.defaultTitle);
    }
  };

  // Save Social Link in Modal
  const handleSaveSocialLink = (e) => {
    e.preventDefault();
    if (!linkTitle.trim()) {
      setLinkFormError("Please enter a title for this link.");
      return;
    }
    if (!linkUrl.trim()) {
      setLinkFormError("Please enter a URL or handle.");
      return;
    }

    let formattedUrl = linkUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://") && !formattedUrl.startsWith("mailto:") && !formattedUrl.startsWith("tel:")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    if (editingSocialId) {
      setSocialLinksList(prev => prev.map(item => 
        item.id === editingSocialId 
          ? { ...item, platform: selectedPlatform, title: linkTitle.trim(), url: formattedUrl }
          : item
      ));
    } else {
      const newItem = {
        id: `link-${Date.now()}`,
        platform: selectedPlatform,
        title: linkTitle.trim(),
        url: formattedUrl
      };
      setSocialLinksList(prev => [...prev, newItem]);
    }

    setIsSocialModalOpen(false);
  };

  // Delete Social Link
  const handleDeleteSocialLink = (idToDelete) => {
    setSocialLinksList(prev => prev.filter(item => item.id !== idToDelete));
  };

  // Handle Save Profile
  const handleSave = async () => {
    if (!fullName.trim()) {
      alert("Full Name is required.");
      return;
    }

    setSaving(true);
    try {
      const updatedProfile = {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        fullName: fullName.trim(),
        full_name: fullName.trim(),
        jobTitle: jobTitle.trim(),
        job_title: jobTitle.trim(),
        companyName: companyName.trim(),
        company_name: companyName.trim(),
        location: location.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        avatar: avatar,
        avatar_url: avatar,
        interests: interests,
        what_im_looking_for: selectedLookingFor.join(", "),
        whatImLookingFor: selectedLookingFor.join(", "),
        socialLinks: socialLinksList,
        social_links: socialLinksList,
        metadata: currentUser.metadata || {},
      };

      if (onSaveProfile) {
        await onSaveProfile(updatedProfile);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err) {
      console.error("Profile save error:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Hidden File Input for Native Desktop Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* ==================================================================== */}
      {/* 1. UNIVERSAL TOP BAR NAVIGATION                                       */}
      {/* ==================================================================== */}
      <UniversalTopBar
        currentUser={currentUser}
        registrations={registrations}
        onGoToHome={onGoToHome}
        onOpenAuth={onOpenAuth}
        onOpenProfile={() => {}}
        onOpenPassesModal={onGoToHome}
        onOpenCreationWizard={onGoToHome}
        onOpenEventsHub={onGoToHome}
        onSignOut={onSignOut}
        rightExtra={
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-2.5 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 sm:gap-1.5 shadow-sm shadow-blue-600/20 hover:shadow transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {saving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span className="hidden xs:inline sm:inline">Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check size={13} />
                <span className="hidden xs:inline sm:inline">Saved!</span>
              </>
            ) : (
              <>
                <Check size={13} className="sm:hidden" />
                <span className="hidden sm:inline">Save Profile</span>
                <span className="sm:hidden text-[11px]">Save</span>
              </>
            )}
          </button>
        }
      />

      {/* ==================================================================== */}
      {/* 2. MAIN PROFILE CONTAINER                                            */}
      {/* ==================================================================== */}
      <main className="max-w-4xl w-full mx-auto px-3.5 sm:px-8 py-5 sm:py-10 space-y-4 sm:space-y-6">
        
        {/* CENTERED PROFILE IDENTITY CARD (NO COVER BANNER) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-center">
          <div className="p-5 sm:p-10 flex flex-col items-center justify-center space-y-3.5 sm:space-y-4">
            
            {/* Centered Rounded Avatar with Camera Trigger */}
            <div 
              className="relative group cursor-pointer" 
              onClick={() => fileInputRef.current?.click()}
              title="Click to change profile picture"
            >
              <img
                src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || "User")}&background=0b5cdb&color=fff`}
                alt="Avatar"
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-slate-100 shadow-md bg-slate-100 group-hover:opacity-95 transition-all"
              />
              
              {uploadingPhoto ? (
                <div className="absolute inset-0 rounded-full bg-slate-900/60 flex items-center justify-center text-white border-4 border-white">
                  <Loader2 size={22} className="animate-spin" />
                </div>
              ) : (
                <div className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 group-hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-transform group-hover:scale-110 border-2 border-white">
                  <Camera size={13} />
                </div>
              )}
            </div>

            {/* Name, Headline & Metadata (Centered) */}
            <div className="space-y-1 sm:space-y-1.5 max-w-md mx-auto w-full px-2">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                  {fullName || "Eventzone Member"}
                </h1>
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-5 h-5 shrink-0 inline-block" 
                  title="Verified Account"
                  aria-label="Verified Account"
                >
                  <path 
                    fill="#0095F6" 
                    d="M12.001 2.002c-.85 0-1.68.32-2.31.91l-1.39 1.28c-.46.42-1.04.66-1.66.67l-1.89.04c-.87.02-1.69.46-2.2 1.18-.51.72-.65 1.62-.38 2.45l.6 1.83c.2.6.2 1.25 0 1.85l-.6 1.83c-.27.83-.13 1.73.38 2.45.51.72 1.33 1.16 2.2 1.18l1.89.04c.62.01 1.2.25 1.66.67l1.39 1.28c.63.59 1.46.91 2.31.91s1.68-.32 2.31-.91l1.39-1.28c.46-.42 1.04-.66 1.66-.67l1.89-.04c.87-.02 1.69-.46 2.2-1.18.51-.72.65-1.62.38-2.45l-.6-1.83c-.2-.6-.2-1.25 0-1.85l.6-1.83c.27-.83.13-1.73-.38-2.45-.51-.72-1.33-1.16-2.2-1.18l-1.89-.04c-.62-.01-1.2-.25-1.66-.67l-1.39-1.28c-.63-.59-1.46-.91-2.31-.91z"
                  />
                  <path 
                    fill="#ffffff" 
                    d="M10.4 15.6l-3.2-3.2 1.4-1.4 1.8 1.8 4.8-4.8 1.4 1.4-6.2 6.2z"
                  />
                </svg>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-normal">
                {jobTitle || "Attendee & Participant"} 
                {companyName ? ` at ${companyName}` : ""}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-slate-500 pt-1">
                {location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    <span>{location}</span>
                  </span>
                )}
                {currentUser.email && (
                  <span className="inline-flex items-center gap-1 max-w-full truncate">
                    <Mail size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{currentUser.email}</span>
                  </span>
                )}
                {phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone size={12} className="text-slate-400 shrink-0" />
                    <span>{phone}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Status Badges (Clean 2x2 grid on mobile, flex row on desktop) */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 pt-1.5 text-xs text-slate-600 w-full max-w-xs sm:max-w-none">
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 font-medium text-center">
                {registrations.length} Passes
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 font-medium text-center">
                {selectedLookingFor.length} Looking For
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 font-medium text-center">
                {interests.length} Interests
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 font-medium text-center">
                {socialLinksList.length} Links
              </div>
            </div>
          </div>

          {/* CLEAN NAVIGATION TABS (SCROLLABLE ON MOBILE) */}
          <div className="border-t border-slate-200 px-3 sm:px-8 flex items-center justify-start sm:justify-center gap-1 sm:gap-4 bg-slate-50/70 overflow-x-auto scrollbar-none whitespace-nowrap">
            <button
              onClick={() => setActiveTab("general")}
              className={`px-3.5 py-3 sm:px-4 sm:py-3.5 text-xs font-semibold border-b-2 transition-all cursor-pointer shrink-0 ${
                activeTab === "general"
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              General Info
            </button>

            <button
              onClick={() => setActiveTab("looking_for")}
              className={`px-3.5 py-3 sm:px-4 sm:py-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "looking_for"
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>What I&apos;m Looking For</span>
              {selectedLookingFor.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                  {selectedLookingFor.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("interests")}
              className={`px-3.5 py-3 sm:px-4 sm:py-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "interests"
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Interests &amp; Matchmaking</span>
              {interests.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                  {interests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("socials")}
              className={`px-3.5 py-3 sm:px-4 sm:py-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "socials"
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Social Links</span>
              {socialLinksList.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                  {socialLinksList.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* TAB 1: GENERAL INFORMATION                                         */}
        {/* ================================================================== */}
        {activeTab === "general" && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-8 shadow-sm space-y-4 sm:space-y-6 text-left animate-fade-in">
            <div className="border-b border-slate-100 pb-3 sm:pb-4">
              <h2 className="text-sm font-bold text-slate-900">Personal &amp; Organization Details</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
                Appears on your event badges, delegate directory, and networking requests.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                  <span>Full Name</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hachemi Mohamed"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Job Title / Role</label>
                <input
                  type="text"
                  placeholder="e.g. CEO &amp; Founder"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Company / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Eventzone"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Location (City, Country)</label>
                <input
                  type="text"
                  placeholder="e.g. Algiers, Algeria"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Phone / WhatsApp Number</label>
                <CountryPhoneInput
                  value={phone}
                  onChange={setPhone}
                  placeholder="781 457 611"
                  defaultCountry="DZ"
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Account Email</label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email || ""}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1 sm:pt-2">
              <label className="text-xs font-medium text-slate-700">Bio &amp; Networking Elevator Pitch</label>
              <textarea
                rows={4}
                placeholder="Share a short introduction about yourself, your startup, or what connections you are looking to make during summits..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
              />
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: WHAT I'M LOOKING FOR                                         */}
        {/* ================================================================== */}
        {activeTab === "looking_for" && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-8 shadow-sm space-y-4 sm:space-y-6 text-left animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-100 pb-3 sm:pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  What Are You Looking For?
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Select your primary objectives so attendees and matchmaking algorithms can connect with you.
                </p>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0 self-start sm:self-auto">
                {selectedLookingFor.length} Selected
              </span>
            </div>

            {/* Selected Tags */}
            {selectedLookingFor.length > 0 && (
              <div className="space-y-2 p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                  <span>Selected Objectives:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedLookingFor([])}
                    className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer text-[11px]"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {selectedLookingFor.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white text-slate-900 text-xs font-medium shadow-2xs border border-slate-200 animate-scale-up"
                    >
                      <Check size={12} className="text-blue-600 shrink-0" />
                      <span className="truncate">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeLookingFor(item)}
                        className="w-4 h-4 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Minimal Clean Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {LOOKING_FOR_OPTIONS.map((opt) => {
                const isSelected = selectedLookingFor.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleLookingFor(opt.id)}
                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                      isSelected
                        ? "bg-blue-50/50 border-blue-500 ring-1 ring-blue-500/20"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <h4 className={`text-xs font-semibold ${isSelected ? "text-blue-900" : "text-slate-900"}`}>
                        {opt.label}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed truncate">
                        {opt.desc}
                      </p>
                    </div>

                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected 
                        ? "bg-blue-600 border-blue-600 text-white" 
                        : "border-slate-300 bg-white"
                    }`}>
                      {isSelected && <Check size={11} className="stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Objective Adder */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Add Custom Goal
              </span>
              <form onSubmit={handleAddCustomLookingFor} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Beta Testers, Advisory Board Members..."
                  value={customLookingForInput}
                  onChange={(e) => setCustomLookingForInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all min-w-0"
                />
                <button
                  type="submit"
                  className="px-3.5 sm:px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus size={13} />
                  <span>Add</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: INTERESTS & MATCHMAKING                                     */}
        {/* ================================================================== */}
        {activeTab === "interests" && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-8 shadow-sm space-y-4 sm:space-y-6 text-left animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-100 pb-3 sm:pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Networking &amp; Matchmaking Interests</h2>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Select keywords for AI matchmaking and domain-based recommendations.
                </p>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0 self-start sm:self-auto">
                {interests.length} / 12 Selected
              </span>
            </div>

            {/* Custom Tag Input */}
            <form onSubmit={handleAddCustomTag} className="flex gap-2">
              <input
                type="text"
                placeholder="Type custom skill (e.g. Deep Learning)..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all min-w-0"
              />
              <button
                type="submit"
                className="px-3.5 sm:px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus size={13} />
                <span>Add</span>
              </button>
            </form>

            {/* Active Selected Tags */}
            {interests.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                  <span>Your Active Tags:</span>
                  <button
                    type="button"
                    onClick={() => setInterests([])}
                    className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer text-[11px]"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {interests.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-900 text-white text-xs font-medium shadow-2xs animate-scale-up"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeInterest(tag)}
                        className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Domains */}
            <div className="space-y-2.5 pt-3 sm:pt-4 border-t border-slate-100">
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Suggested Domains
              </span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {CURATED_INTERESTS.map((tag, idx) => {
                  const isSelected = interests.includes(tag);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 4: SOCIAL & WEB LINKS                                          */}
        {/* ================================================================== */}
        {activeTab === "socials" && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-8 shadow-sm space-y-4 sm:space-y-6 text-left animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-3 sm:pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Social &amp; Web Links</h2>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Connect your social profiles and web links with summit attendees.
                </p>
              </div>

              <button
                type="button"
                onClick={openAddSocialModal}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <Plus size={14} />
                <span>Add Social Link</span>
              </button>
            </div>

            {/* List of Added Social Links */}
            {socialLinksList.length === 0 ? (
              <div className="py-8 sm:py-10 border border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50/50 p-4">
                <h3 className="text-xs font-semibold text-slate-700">No Social Links Added Yet</h3>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Add LinkedIn, GitHub, X, or your website to display on your delegate pass.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={openAddSocialModal}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Link</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {socialLinksList.map((item) => {
                  const plat = SOCIAL_PLATFORMS.find(p => p.id === item.platform) || SOCIAL_PLATFORMS[3];
                  return (
                    <div
                      key={item.id}
                      className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-slate-300 bg-white transition-all flex items-center justify-between gap-2.5 sm:gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${plat.color}`}>
                          {plat.renderIcon({ size: 15 })}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <h4 className="text-xs font-semibold text-slate-900 truncate">
                            {item.title || plat.name}
                          </h4>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-slate-400 hover:text-blue-600 truncate flex items-center gap-1 transition-colors max-w-[150px] sm:max-w-[200px]"
                          >
                            <span className="truncate">{item.url}</span>
                            <ExternalLink size={10} className="shrink-0" />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditSocialModal(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSocialLink(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* BOTTOM SAVE BAR */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <div className="text-center sm:text-left">
            {saveSuccess ? (
              <span className="text-xs font-semibold text-emerald-600 animate-fade-in block">
                Profile updated &amp; synced across platform &amp; mobile app.
              </span>
            ) : (
              <span className="text-xs text-slate-400 block">
                Changes persist instantly to your shared account.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </main>

      {/* ==================================================================== */}
      {/* 3. ADD / EDIT SOCIAL LINK MODAL                                      */}
      {/* ==================================================================== */}
      {isSocialModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-3.5 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 sm:space-y-5 text-left animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingSocialId ? "Edit Social Link" : "Add Social Link"}
              </h3>
              <button
                type="button"
                onClick={() => setIsSocialModalOpen(false)}
                className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveSocialLink} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 block">
                  Platform:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                  {SOCIAL_PLATFORMS.map((plat) => {
                    const isSelected = selectedPlatform === plat.id;
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => handlePlatformSelect(plat.id)}
                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-white border-blue-600 shadow-2xs ring-1 ring-blue-500/20"
                            : "bg-white/60 border-slate-200/80 hover:bg-white"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${plat.color}`}>
                          {plat.renderIcon({ size: 13 })}
                        </div>
                        <span className="text-[9px] font-medium text-slate-700 truncate w-full text-center">
                          {plat.name.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Title:
                </label>
                <input
                  type="text"
                  placeholder="e.g. LinkedIn, Personal Portfolio, Blog..."
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  URL / Handle:
                </label>
                <input
                  type="text"
                  placeholder={SOCIAL_PLATFORMS.find(p => p.id === selectedPlatform)?.placeholder || "https://..."}
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  required
                />
              </div>

              {linkFormError && (
                <p className="text-xs font-semibold text-red-500 flex items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{linkFormError}</span>
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSocialModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>{editingSocialId ? "Update Link" : "Add Link"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
