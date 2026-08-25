"use client";

import React, { useState, useEffect } from "react";
import { 
  X, User, Building2, MapPin, Phone, Mail, 
  Sparkles, Globe, 
  Check, Loader2, Plus, Trash2, Camera, ShieldCheck, 
  Smartphone, Share2, Award, Tag, Info, ArrowUpRight
} from "lucide-react";
import CountryPhoneInput from "./CountryPhoneInput";

// Social Brand SVG Icons
const LinkedinIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const TwitterIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const GithubIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
  </svg>
);

const InstagramIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

// Curated preset avatars for quick professional selection
const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=300&q=80",
];

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

export default function ProfileModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onSaveProfile 
}) {
  const [activeTab, setActiveTab] = useState("general"); // 'general' | 'interests' | 'socials'
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [customTagInput, setCustomTagInput] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [interests, setInterests] = useState([]);
  const [socialLinks, setSocialLinks] = useState({
    linkedin: "",
    twitter: "",
    github: "",
    website: "",
    instagram: ""
  });

  // Populate from currentUser on open
  useEffect(() => {
    if (currentUser && isOpen) {
      setFullName(currentUser.fullName || "");
      setJobTitle(currentUser.jobTitle || "");
      setCompanyName(currentUser.companyName || "");
      setLocation(currentUser.location || "");
      setPhone(currentUser.phone || "");
      setBio(currentUser.bio || "");
      setAvatar(currentUser.avatar || PRESET_AVATARS[0]);
      setInterests(Array.isArray(currentUser.interests) ? [...currentUser.interests] : []);
      setSocialLinks({
        linkedin: currentUser.socialLinks?.linkedin || "",
        twitter: currentUser.socialLinks?.twitter || "",
        github: currentUser.socialLinks?.github || "",
        website: currentUser.socialLinks?.website || "",
        instagram: currentUser.socialLinks?.instagram || ""
      });
      setSaveSuccess(false);
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

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

  // Handle Save
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
        socialLinks: socialLinks,
        social_links: socialLinks,
      };

      if (onSaveProfile) {
        await onSaveProfile(updatedProfile);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Profile save error:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* ================================================================ */}
        {/* MODAL HEADER                                                     */}
        {/* ================================================================ */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-200/60 shadow-xs">
              <User size={20} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">My Networking Profile</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Cloud Sync Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Shared in real time between the Eventzone Web Platform and Mobile Companion App.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ================================================================ */}
        {/* NAVIGATION TABS                                                  */}
        {/* ================================================================ */}
        <div className="px-6 pt-3 border-b border-slate-100 flex items-center gap-2 bg-white">
          <button
            onClick={() => setActiveTab("general")}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "general"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <User size={14} />
            <span>General Info</span>
          </button>

          <button
            onClick={() => setActiveTab("interests")}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "interests"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Tag size={14} />
            <span>Interests &amp; Matchmaking</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black">
              {interests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("socials")}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "socials"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Globe size={14} />
            <span>Social &amp; Web Links</span>
          </button>
        </div>

        {/* ================================================================ */}
        {/* MODAL BODY (TWO COLUMNS: FORM + LIVE APP PREVIEW)                */}
        {/* ================================================================ */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* TAB 1: GENERAL INFO */}
            {activeTab === "general" && (
              <div className="space-y-4">
                {/* Avatar Preview & Picker */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-4">
                    <img
                      src={avatar || PRESET_AVATARS[0]}
                      alt="Avatar"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-600 shadow-sm shrink-0"
                    />
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Camera size={13} />
                        <span>{showAvatarPicker ? "Hide Presets" : "Choose Preset Photo"}</span>
                      </button>
                      <p className="text-[11px] text-slate-400">
                        Or enter a direct image URL below.
                      </p>
                    </div>
                  </div>

                  {/* Preset Avatar Selection Grid */}
                  {showAvatarPicker && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {PRESET_AVATARS.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setAvatar(url);
                              setShowAvatarPicker(false);
                            }}
                            className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer aspect-square ${
                              avatar === url ? "border-blue-600 scale-105 shadow-md" : "border-slate-200 hover:border-blue-400"
                            }`}
                          >
                            <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                            {avatar === url && (
                              <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center text-white">
                                <Check size={14} className="stroke-[3]" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom URL Input */}
                  <div>
                    <input
                      type="url"
                      placeholder="https://example.com/your-photo.jpg"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-mono transition-all"
                    />
                  </div>
                </div>

                {/* Full Name & Job Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>Full Name</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Maya Kaci"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Job Title / Headline</label>
                    <input
                      type="text"
                      placeholder="e.g. Chief AI Architect"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                </div>

                {/* Company & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Company / Organization</label>
                    <input
                      type="text"
                      placeholder="e.g. NeuroTech Labs"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">City, Country</label>
                    <input
                      type="text"
                      placeholder="e.g. Algiers, Algeria"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Phone / WhatsApp (Optional)</label>
                  <CountryPhoneInput
                    value={phone}
                    onChange={setPhone}
                    placeholder="555 123 456"
                    defaultCountry="DZ"
                    className="w-full"
                  />
                </div>

                {/* Bio */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Bio &amp; Networking Goals</label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe what you do and what you're looking for at summits (e.g. looking for seed investment, hiring AI researchers, co-founders)..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: INTERESTS & MATCHMAKING */}
            {activeTab === "interests" && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/60 text-blue-900 space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-blue-600" />
                    <h4 className="text-xs font-extrabold">AI Delegate Matchmaking Tags</h4>
                  </div>
                  <p className="text-[11px] text-blue-700/80 leading-relaxed">
                    Select up to 12 keywords that represent your domain expertise, industry focus, and what you want to discover. The Eventzone mobile app uses these to recommend delegate meetings.
                  </p>
                </div>

                {/* Custom Tag Input */}
                <form onSubmit={handleAddCustomTag} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a custom interest (e.g. Quantum Computing)..."
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </form>

                {/* Selected Tags */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Your Selected Tags ({interests.length}/12):</span>
                    {interests.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setInterests([])}
                        className="text-slate-400 hover:text-red-500 text-[11px] transition-colors cursor-pointer"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {interests.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No tags selected yet. Click tags below or add your own!
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {interests.map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs animate-scale-up"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeInterest(tag)}
                            className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Curated Suggested Tags */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-500 block">Suggested Domains &amp; Topics:</label>
                  <div className="flex flex-wrap gap-2">
                    {CURATED_INTERESTS.map((tag, i) => {
                      const isSelected = interests.includes(tag);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleInterest(tag)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-blue-50 border border-blue-400 text-blue-700 font-bold"
                              : "bg-slate-100 hover:bg-slate-200 border border-transparent text-slate-700"
                          }`}
                        >
                          {isSelected && <Check size={12} className="text-blue-600" />}
                          <span>{tag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SOCIAL & WEB LINKS */}
            {activeTab === "socials" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Add your social profiles and online presence so delegates you meet can connect with one tap.
                </p>

                {/* LinkedIn */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <LinkedinIcon size={14} className="text-blue-600" />
                    <span>LinkedIn Profile URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/yourname"
                    value={socialLinks.linkedin}
                    onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                {/* X / Twitter */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <TwitterIcon size={14} className="text-sky-500" />
                    <span>X / Twitter Handle or URL</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://x.com/yourhandle or @yourhandle"
                    value={socialLinks.twitter}
                    onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                {/* GitHub */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <GithubIcon size={14} className="text-slate-800" />
                    <span>GitHub Profile</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/yourusername"
                    value={socialLinks.github}
                    onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                {/* Website / Portfolio */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Globe size={14} className="text-emerald-600" />
                    <span>Personal Website / Company Portfolio</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://mycompany.com"
                    value={socialLinks.website}
                    onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                {/* Instagram */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <InstagramIcon size={14} className="text-pink-600" />
                    <span>Instagram Profile</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://instagram.com/yourname"
                    value={socialLinks.instagram}
                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Companion App Profile Preview */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                <Smartphone size={14} className="text-blue-600" />
                <span>Mobile App Live Card</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">Live Preview</span>
            </div>

            {/* Mobile Card Preview Shell */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 rounded-3xl p-5 border border-slate-800 text-white shadow-xl text-left space-y-4">
              {/* App Status Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-1.5">
                  <img src="https://i.imgur.com/jFDrQbM.png" alt="eventzone" className="h-3.5 w-auto brightness-0 invert" />
                  <span className="text-[9px] font-black text-blue-400 tracking-wider">NETWORKING PASS</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                  ● Verified
                </span>
              </div>

              {/* User Avatar + Details */}
              <div className="flex items-start gap-3.5">
                <img
                  src={avatar || PRESET_AVATARS[0]}
                  alt="Preview Avatar"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shrink-0 shadow-md"
                />
                <div className="overflow-hidden space-y-0.5">
                  <div className="flex items-center gap-1">
                    <h5 className="text-sm font-extrabold text-white truncate">
                      {fullName || "Your Full Name"}
                    </h5>
                    <ShieldCheck size={14} className="text-blue-400 shrink-0" />
                  </div>
                  <p className="text-xs text-blue-300 font-semibold truncate">
                    {jobTitle || "Job Title / Role"}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {companyName ? `${companyName}` : "Company Name"} 
                    {location ? ` • ${location}` : ""}
                  </p>
                </div>
              </div>

              {/* Bio Snippet if any */}
              {bio && (
                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 font-normal">
                  &ldquo;{bio}&rdquo;
                </p>
              )}

              {/* Selected Interests Tag Cloud */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                  Interests &amp; Expertise
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {interests.length === 0 ? (
                    <span className="text-[10px] text-slate-500 italic">No interests selected yet</span>
                  ) : (
                    interests.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      >
                        {t}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Social Links Row in Preview */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold">Connect Directly:</span>
                <div className="flex items-center gap-2">
                  {socialLinks.linkedin && (
                    <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                      <LinkedinIcon size={14} />
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a href={socialLinks.twitter} target="_blank" rel="noreferrer" className="text-sky-400 hover:text-sky-300 transition-colors">
                      <TwitterIcon size={14} />
                    </a>
                  )}
                  {socialLinks.github && (
                    <a href={socialLinks.github} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-white transition-colors">
                      <GithubIcon size={14} />
                    </a>
                  )}
                  {socialLinks.website && (
                    <a href={socialLinks.website} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                      <Globe size={14} />
                    </a>
                  )}
                  {!socialLinks.linkedin && !socialLinks.twitter && !socialLinks.github && !socialLinks.website && (
                    <span className="text-[10px] text-slate-600">No social links</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* MODAL FOOTER                                                     */}
        {/* ================================================================ */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {saveSuccess ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold animate-fade-in">
                <Check size={15} />
                Profile updated &amp; synced across platform &amp; app!
              </span>
            ) : (
              <span>All changes automatically sync with your QR pass.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving &amp; Syncing...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
