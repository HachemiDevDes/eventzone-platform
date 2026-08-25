/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  User,
  Ticket,
  FileText,
  Printer,
  QrCode as QrIcon,
  Camera,
  Upload,
  Check,
  Loader2,
  CheckCircle2,
  Building2,
  Briefcase,
  Phone,
  Mail,
  Globe,
  MapPin,
  Calendar,
  ChevronRight,
  Sparkles,
  Layers,
  AlertCircle,
  Trash2,
  Maximize2
} from 'lucide-react';
import QRCode from 'qrcode';
import { useLanguage } from '../lib/i18n';
import { COUNTRY_CITIES_MAP } from '../lib/formPresets';
import FormImageUploader from './FormImageUploader';
import SearchableSelect from './SearchableSelect';
import CountryPhoneInput from './CountryPhoneInput';
import A4BadgeSheet, { printA4BadgeDocument } from './A4BadgeSheet';

export default function AttendeeDrawer({
  isOpen,
  onClose,
  attendee = null,
  tickets = [],
  forms = [],
  onSaveAttendee,
  onUploadFile,
  activeEventId,
  eventTitle = 'Eventzone Summit',
  onSwitchView,
  eventDetails = {}
}) {
  const { t } = useLanguage();

  // Navigation Tabs: 'form' (Registration & Intake Form) | 'badge' (Badge & Check-in)
  const [activeTab, setActiveTab] = useState('form');

  // Core Attendee Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedTicketTier, setSelectedTicketTier] = useState('');
  const [status, setStatus] = useState('registered'); // 'registered' | 'checked-in' | 'archived'
  const [badgeCode, setBadgeCode] = useState('');
  const [avatar, setAvatar] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [country, setCountry] = useState('Algeria');
  const [city, setCity] = useState('');

  // Dynamic Form Intake Answers: map of field.id -> answerValue
  const [answers, setAnswers] = useState({});

  // Loading & QR Preview States
  const [isSaving, setIsSaving] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [customOtherTexts, setCustomOtherTexts] = useState({});

  const isOtherOption = (opt) => {
    if (!opt || typeof opt !== "string") return false;
    const clean = opt.trim().toLowerCase();
    return clean === "other" || clean.startsWith("other") || clean === "autre" || clean.startsWith("autre");
  };

  const isOtherValue = (val) => {
    if (!val || typeof val !== "string") return false;
    const clean = val.trim().toLowerCase();
    return clean === "other" || clean.startsWith("other:") || clean.startsWith("other (") || clean === "autre" || clean.startsWith("autre:") || clean.startsWith("autre (");
  };

  const getOtherTextForField = (fieldId, val) => {
    if (customOtherTexts[fieldId] !== undefined) return customOtherTexts[fieldId];
    if (typeof val === "string") {
      if (val.toLowerCase().startsWith("other:")) return val.slice(6).trim();
      if (val.toLowerCase().startsWith("autre:")) return val.slice(6).trim();
    }
    return "";
  };

  // Available tickets fallback
  const availableTickets = useMemo(() => {
    if (tickets && tickets.length > 0) return tickets;
    return [{ id: 'default-ticket', name: 'Standard Admission', tier: 'Standard Admission', price: 0, formId: 'default' }];
  }, [tickets]);

  // Current matched ticket object
  const currentTicket = useMemo(() => {
    return availableTickets.find(t => 
      (t.name || t.tier || '').trim().toLowerCase() === (selectedTicketTier || '').trim().toLowerCase()
    ) || availableTickets[0];
  }, [availableTickets, selectedTicketTier]);

  // Current associated Form based on ticket.formId or default
  const associatedForm = useMemo(() => {
    if (!currentTicket) return null;
    const formId = currentTicket.formId || currentTicket.form_id;
    if (formId && formId !== 'default') {
      const matched = forms.find(f => f.id === formId && f.status !== 'archived' && !f.isArchived);
      if (matched) return matched;
    }
    // Fallback to active registration form or first form
    const defaultRegForm = forms.find(f => (f.type === 'ticket_registration' || f.category === 'Registration' || f.category === 'tickets') && f.status !== 'archived');
    return defaultRegForm || forms.find(f => f.status !== 'archived') || null;
  }, [currentTicket, forms]);

  // Form Fields to render: either from associated form or default standard fields
  const formFields = useMemo(() => {
    if (associatedForm && Array.isArray(associatedForm.fields) && associatedForm.fields.length > 0) {
      return associatedForm.fields;
    }
    return [
      { id: 'f_core_name', type: 'text', label: 'Full Name', placeholder: 'e.g. Elena Rostova', required: true, isLocked: true },
      { id: 'f_core_email', type: 'email', label: 'Email Address', placeholder: 'elena@example.com', required: true, isLocked: true },
      { id: 'f_core_phone', type: 'phone', label: 'Phone Number', placeholder: '550 12 34 56', required: false, isLocked: true },
      { id: 'f_company', type: 'text', label: 'Company / Organization', placeholder: 'e.g. Sonatrach', required: false },
      { id: 'f_job_title', type: 'text', label: 'Job Function / Role', placeholder: 'e.g. Senior Director', required: false },
      { id: 'f_core_country', type: 'country', label: 'Country', required: false },
      { id: 'f_core_city', type: 'city', label: 'Wilaya / City', required: false },
    ];
  }, [associatedForm]);

  // Sync state on open or attendee change
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (attendee) {
        // Edit Mode
        const attName = attendee.name || attendee.fullName || '';
        const attEmail = attendee.email || '';
        const attTicket = attendee.ticketType || attendee.ticket_type || (availableTickets[0]?.name || 'Standard Admission');
        const attStatus = attendee.status || (attendee.isArchived ? 'archived' : 'registered');
        const attBadge = attendee.badgeCode || attendee.badge_code || `EZ-${String(attendee.id || '').slice(-4).toUpperCase() || 'PASS'}`;
        const attAvatar = attendee.avatar || attendee.image || attendee.photo || attendee.avatar_url || '';
        const attPhone = attendee.answers?.phone || attendee.answers?.f_core_phone || attendee.customAnswers?.phone || attendee.customAnswers?.f_core_phone || attendee.phone || attendee.phoneNumber || '';
        let attCompany = '';
        let attJob = '';
        const allAns = { ...(attendee.answers || {}), ...(attendee.customAnswers || {}), ...(attendee.formAnswers || {}) };
        if (typeof allAns === 'object') {
          for (const [k, v] of Object.entries(allAns)) {
            if (!v || typeof v !== 'string') continue;
            const key = k.toLowerCase();
            if (!attCompany && (key.includes('company') || key.includes('societe') || key.includes('entreprise') || key.includes('org'))) {
              attCompany = String(v).trim();
            }
            if (!attJob && (key.includes('job') || key.includes('title') || key.includes('function') || key.includes('profession') || key.includes('poste') || key.includes('role') || key.includes('fonction'))) {
              attJob = String(v).trim();
            }
          }
        }
        if (!attCompany) attCompany = attendee.company || '';
        if (!attJob) attJob = attendee.jobTitle || attendee.job_title || attendee.function || attendee.profession || attendee.role || '';
        const attCountry = attendee.country || 'Algeria';
        const attCity = attendee.city || attendee.wilaya || '';

        setName(attName);
        setEmail(attEmail);
        setSelectedTicketTier(attTicket);
        setStatus(attStatus);
        setBadgeCode(attBadge);
        setAvatar(attAvatar);
        setPhone(attPhone);
        setCompany(attCompany);
        setJobTitle(attJob);
        setCountry(attCountry);
        setCity(attCity);

        // Pre-fill answers map
        const existingAnswers = {
          ...(attendee.answers || {}),
          ...(attendee.customAnswers || {}),
          ...(attendee.formAnswers || {}),
          f_core_name: attName,
          f_core_email: attEmail,
          f_core_phone: attPhone,
          phone: attPhone,
          f_company: attCompany,
          company: attCompany,
          f_job_title: attJob,
          jobTitle: attJob,
          f_core_country: attCountry,
          country: attCountry,
          f_core_city: attCity,
          city: attCity,
          avatar: attAvatar,
          f_core_avatar: attAvatar,
        };
        setAnswers(existingAnswers);
      } else {
        // Add Mode - clean defaults
        const defaultTier = availableTickets[0]?.name || availableTickets[0]?.tier || 'Standard Admission';
        const newBadge = `EZ-${Math.floor(1000 + Math.random() * 9000)}-REG`;
        setName('');
        setEmail('');
        setSelectedTicketTier(defaultTier);
        setStatus('registered');
        setBadgeCode(newBadge);
        setAvatar('');
        setPhone('');
        setCompany('');
        setJobTitle('');
        setCountry('Algeria');
        setCity('');
        setAnswers({
          f_core_country: 'Algeria',
          country: 'Algeria'
        });
      }
    }
  }, [isOpen, attendee, availableTickets]);

  // Generate QR Code for Badge
  useEffect(() => {
    if (!isOpen) return;
    const generateQR = async () => {
      try {
        const payload = JSON.stringify({
          passId: attendee?.id || badgeCode,
          badgeCode: badgeCode || 'EZ-PASS',
          name: name || 'Attendee',
          email: email || '',
          ticket: selectedTicketTier || 'Standard Admission',
          event: eventTitle
        });
        const url = await QRCode.toDataURL(payload, {
          width: 260,
          margin: 1,
          color: { dark: '#0b5cdb', light: '#ffffff' }
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.warn('QR generation error:', err);
      }
    };
    generateQR();
  }, [isOpen, attendee, badgeCode, name, email, selectedTicketTier, eventTitle]);

  // Field change handler
  const handleAnswerChange = (fieldId, value) => {
    setAnswers(prev => ({
      ...prev,
      [fieldId]: value
    }));

    if (errors[fieldId]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }

    if (fieldId === 'f_core_name' || fieldId === 'name' || fieldId === 'fullName') setName(value);
    if (fieldId === 'f_core_email' || fieldId === 'email') setEmail(value);
    if (fieldId === 'f_core_phone' || fieldId === 'phone' || fieldId === 'phoneNumber') setPhone(value);
    if (fieldId === 'f_company' || fieldId === 'company') setCompany(value);
    if (fieldId === 'f_job_title' || fieldId === 'jobTitle' || fieldId === 'job_title') setJobTitle(value);
    if (fieldId === 'f_core_country' || fieldId === 'country') setCountry(value);
    if (fieldId === 'f_core_city' || fieldId === 'city' || fieldId === 'wilaya') setCity(value);
    if (fieldId === 'f_core_avatar' || fieldId === 'avatar' || fieldId === 'photo') setAvatar(value);
  };

  const handleSelectChoice = (fieldId, selectedOpt) => {
    if (isOtherOption(selectedOpt)) {
      const existingText = customOtherTexts[fieldId] || "";
      const fullVal = existingText.trim() ? `Other: ${existingText.trim()}` : "Other";
      handleAnswerChange(fieldId, fullVal);
    } else {
      handleAnswerChange(fieldId, selectedOpt);
    }
  };

  const handleRadioChoice = (fieldId, selectedOpt) => {
    if (isOtherOption(selectedOpt)) {
      const existingText = customOtherTexts[fieldId] || "";
      const fullVal = existingText.trim() ? `Other: ${existingText.trim()}` : "Other";
      handleAnswerChange(fieldId, fullVal);
    } else {
      handleAnswerChange(fieldId, selectedOpt);
    }
  };

  const handleOtherTextChange = (fieldId, text) => {
    setCustomOtherTexts(prev => ({ ...prev, [fieldId]: text }));
    const fullVal = text.trim() ? `Other: ${text.trim()}` : "Other";
    handleAnswerChange(fieldId, fullVal);
  };

  const handleCheckboxChoice = (fieldId, opt, isChecked) => {
    const fieldVal = getFieldValue({ id: fieldId });
    const currentList = Array.isArray(fieldVal) ? fieldVal : (fieldVal ? [fieldVal] : []);
    let updated;
    if (isChecked) {
      if (isOtherOption(opt)) {
        const existingText = customOtherTexts[`${fieldId}__other`] || "";
        const fullVal = existingText.trim() ? `Other: ${existingText.trim()}` : opt;
        const withoutOther = currentList.filter(x => !isOtherValue(x));
        updated = [...withoutOther, fullVal];
      } else {
        updated = [...currentList, opt];
      }
    } else {
      if (isOtherOption(opt)) {
        updated = currentList.filter(x => !isOtherValue(x));
      } else {
        updated = currentList.filter(x => x !== opt);
      }
    }
    handleAnswerChange(fieldId, updated);
  };

  const handleCheckboxOtherTextChange = (fieldId, opt, text) => {
    setCustomOtherTexts(prev => ({ ...prev, [`${fieldId}__other`]: text }));
    const fieldVal = getFieldValue({ id: fieldId });
    const currentList = Array.isArray(fieldVal) ? fieldVal : (fieldVal ? [fieldVal] : []);
    const withoutOther = currentList.filter(x => !isOtherValue(x));
    const fullVal = text.trim() ? `Other: ${text.trim()}` : (opt || "Other");
    handleAnswerChange(fieldId, [...withoutOther, fullVal]);
  };

  // Get field value with fallback chain
  const getFieldValue = (field) => {
    const fid = field.id;
    if (answers[fid] !== undefined) return answers[fid];
    
    const idNorm = (fid || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (idNorm.includes('name') && name) return name;
    if (idNorm.includes('email') && email) return email;
    if (idNorm.includes('phone') && phone) return phone;
    if (idNorm.includes('company') && company) return company;
    if ((idNorm.includes('job') || idNorm.includes('title') || idNorm.includes('role')) && jobTitle) return jobTitle;
    if (idNorm.includes('country') && country) return country;
    if ((idNorm.includes('city') || idNorm.includes('wilaya')) && city) return city;
    if ((idNorm.includes('avatar') || idNorm.includes('photo') || idNorm.includes('image')) && avatar) return avatar;
    
    return '';
  };

  // Form Save validation & submit
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const newErrors = {};

    const cleanName = (name || answers.f_core_name || '').trim();
    const cleanEmail = (email || answers.f_core_email || '').trim();

    if (!cleanName) {
      newErrors.f_core_name = 'Full Name is required';
    }
    if (!cleanEmail) {
      newErrors.f_core_email = 'Email Address is required';
    } else if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      newErrors.f_core_email = 'Please enter a valid email address';
    }

    formFields.forEach(field => {
      if (field.required && !field.isLocked && field.type !== 'section') {
        const val = getFieldValue(field);
        if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '') || (Array.isArray(val) && val.length === 0)) {
          newErrors[field.id] = `${field.label || 'This field'} is required`;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setActiveTab('form');
      return;
    }

    setIsSaving(true);
    try {
      const attendeeId = attendee?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `att-${Date.now()}`);
      const nowIso = new Date().toISOString();

      const finalAnswers = {
        ...answers,
        f_core_name: cleanName,
        name: cleanName,
        f_core_email: cleanEmail,
        email: cleanEmail,
        f_core_phone: phone || answers.f_core_phone || '',
        phone: phone || answers.f_core_phone || '',
        f_company: company || answers.f_company || '',
        company: company || answers.f_company || '',
        f_job_title: jobTitle || answers.f_job_title || '',
        jobTitle: jobTitle || answers.f_job_title || '',
        f_core_country: country || answers.f_core_country || 'Algeria',
        country: country || answers.f_core_country || 'Algeria',
        f_core_city: city || answers.f_core_city || '',
        city: city || answers.f_core_city || '',
        avatar: avatar || answers.f_core_avatar || '',
        f_core_avatar: avatar || answers.f_core_avatar || '',
      };

      const payload = {
        id: attendeeId,
        name: cleanName,
        email: cleanEmail,
        ticketType: selectedTicketTier || currentTicket?.name || 'Standard Admission',
        ticket_type: selectedTicketTier || currentTicket?.name || 'Standard Admission',
        ticketId: currentTicket?.id || undefined,
        status: status,
        isArchived: status === 'archived',
        badgeCode: badgeCode || `EZ-${attendeeId.slice(-4).toUpperCase()}`,
        badge_code: badgeCode || `EZ-${attendeeId.slice(-4).toUpperCase()}`,
        avatar: avatar,
        image: avatar,
        photo: avatar,
        phone: phone,
        company: company,
        organization: company,
        jobTitle: jobTitle,
        job_title: jobTitle,
        country: country,
        city: city,
        wilaya: city,
        registeredDate: attendee?.registeredDate || nowIso.split('T')[0],
        answers: finalAnswers,
        customAnswers: finalAnswers,
        formAnswers: finalAnswers,
        formId: associatedForm?.id || currentTicket?.formId || 'default',
        updatedAt: nowIso,
      };

      if (onSaveAttendee) {
        await onSaveAttendee(payload);
      }
      onClose();
    } catch (err) {
      console.error('Error in AttendeeDrawer save:', err);
      alert('Failed to save attendee. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintBadge = () => {
    const matchedTicket = currentTicket || {};
    const templateUrl = matchedTicket.badgeUrl || eventDetails?.badgeUrl || '';
    const badgeSettings = matchedTicket.badgeSettings || eventDetails?.badgeSettings || {};

    printA4BadgeDocument({
      templateUrl,
      attendeeId: attendee?.id || badgeCode,
      attendeeName: name || 'Attendee',
      attendeeEmail: email || '',
      attendeePhoto: avatar || '',
      attendeeCompany: company || '',
      attendeeJobTitle: jobTitle || '',
      ticketType: selectedTicketTier || 'Standard Admission',
      badgeCode: badgeCode || 'EZ-PASS',
      eventId: activeEventId || '',
      eventTitle: eventTitle || 'Conference Event',
      showFoldGuide: badgeSettings.showFoldGuide !== false,
      showPhoto: badgeSettings.showPhoto !== false,
      showQr: badgeSettings.showQr !== false,
      cardTheme: badgeSettings.cardTheme || 'white'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fade-in font-sans">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl lg:max-w-3xl bg-white h-full shadow-2xl z-10 flex flex-col border-l border-slate-200 overflow-hidden animate-slide-in-right">
        
        <header className="px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-white select-none">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {attendee ? 'Edit Attendee' : 'Add New Attendee'}
              </h2>
              <span className={`text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                status === 'checked-in'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : status === 'archived'
                    ? 'bg-slate-100 text-slate-600 border border-slate-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {status === 'checked-in' ? 'Checked In' : status === 'archived' ? 'Archived' : 'Registered'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {attendee 
                ? `Editing registration record and form answers for ${name || 'attendee'}.`
                : 'Manually register an attendee and complete their ticket-specific intake form.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </header>

        <div className="px-8 pt-3.5 pb-3 bg-slate-50/80 border-b border-slate-200 select-none">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/70 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <FileText size={15} className={activeTab === 'form' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Ticket & Intake Form</span>
              {Object.keys(errors).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('badge')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'badge'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Printer size={15} className={activeTab === 'badge' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Badge, Photo & Check-in</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">

          {activeTab === 'form' && (
            <div className="flex flex-col gap-6 animate-fade-in">

              <div className="bg-slate-50/90 border border-slate-250 rounded-2xl p-5 flex flex-col gap-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket size={16} className="text-blue-600" />
                    <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Select Ticket Tier
                    </label>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {availableTickets.length} Tier{availableTickets.length !== 1 ? 's' : ''} available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {availableTickets.map((tItem) => {
                    const tName = tItem.name || tItem.tier || 'Ticket';
                    const isSelected = (selectedTicketTier || '').trim().toLowerCase() === tName.trim().toLowerCase();
                    const numPrice = typeof tItem.price === 'number' ? tItem.price : parseFloat(String(tItem.price).replace(/[^0-9.]/g, '')) || 0;
                    const priceLabel = numPrice === 0 ? 'Free' : `${numPrice.toLocaleString()} DZD`;

                    return (
                      <div
                        key={tItem.id || tName}
                        onClick={() => setSelectedTicketTier(tName)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 select-none ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 leading-snug">{tName}</span>
                          {isSelected ? (
                            <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                              <Check size={10} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0 mt-0.5" />
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-extrabold text-blue-600">{priceLabel}</span>
                          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                            {tItem.formId && tItem.formId !== 'default' ? 'Custom Form' : 'Standard Form'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-900 select-none">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText size={16} className="text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">
                      Linked Form: {associatedForm?.title || 'Default Registration Form'}
                    </span>
                    <span className="text-[10px] text-indigo-600/80 font-medium block truncate">
                      {formFields.length} Form Field{formFields.length !== 1 ? 's' : ''} configured for this ticket
                    </span>
                  </div>
                </div>

                {associatedForm?.id && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onSwitchView) onSwitchView('forms');
                      onClose();
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Edit Form</span>
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-4.5">
                {formFields.map((field, idx) => {
                  if (field.type === 'section') {
                    return (
                      <div key={field.id || idx} className="pt-3 pb-1 border-b border-slate-200">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                          {field.label || 'Section'}
                        </h4>
                        {field.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{field.description}</p>
                        )}
                      </div>
                    );
                  }

                  const fieldVal = getFieldValue(field);
                  const fieldError = errors[field.id];
                  const fieldType = (field.type || 'text').toLowerCase();

                  return (
                    <div key={field.id || idx} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <span>{field.label || field.placeholder || 'Field'}</span>
                          {field.required && (
                            <span className="text-rose-500 font-extrabold">*</span>
                          )}
                        </label>
                        {field.description && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {field.description}
                          </span>
                        )}
                      </div>

                      {fieldType === 'country' ? (
                        <SearchableSelect
                          value={fieldVal || 'Algeria'}
                          onChange={(val) => handleAnswerChange(field.id, val)}
                          options={[
                            "Algeria", "Tunisia", "Morocco", "France",
                            "United Arab Emirates", "Saudi Arabia", "Qatar",
                            "United Kingdom", "United States", "Canada",
                            "Germany", "Other"
                          ]}
                          placeholder="-- Select Country --"
                          searchPlaceholder="Search countries..."
                          error={Boolean(fieldError)}
                        />
                      ) : (fieldType === 'city' || fieldType === 'wilaya' || (field.label || '').toLowerCase().includes('wilaya') || (field.label || '').toLowerCase().includes('city')) ? (
                        <SearchableSelect
                          value={fieldVal || ''}
                          onChange={(val) => handleAnswerChange(field.id, val)}
                          options={COUNTRY_CITIES_MAP['Algeria'] || []}
                          placeholder="-- Select Wilaya / City --"
                          searchPlaceholder="Search wilaya or city..."
                          error={Boolean(fieldError)}
                        />
                      ) : (fieldType === 'select' || fieldType === 'dropdown') ? (
                        <div className="flex flex-col gap-2">
                          <SearchableSelect
                            value={isOtherValue(fieldVal) ? ((field.options || []).find(o => isOtherOption(o)) || "Other") : (fieldVal || '')}
                            onChange={(val) => handleSelectChoice(field.id, val)}
                            options={field.options || []}
                            placeholder="-- Choose an Option --"
                            searchPlaceholder="Search choices..."
                            error={Boolean(fieldError)}
                          />
                          {isOtherValue(fieldVal) && (
                            <div className="animate-fade-in flex items-center gap-2 p-2 bg-blue-50/50 border border-blue-200 rounded-xl">
                              <input
                                type="text"
                                value={getOtherTextForField(field.id, fieldVal)}
                                onChange={(e) => handleOtherTextChange(field.id, e.target.value)}
                                placeholder="Please specify / Type what's other..."
                                className="w-full px-3 py-2 bg-white border border-blue-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-slate-900 outline-none shadow-2xs placeholder:text-slate-400"
                                autoFocus
                              />
                            </div>
                          )}
                        </div>
                      ) : fieldType === 'radio' ? (
                        <div className="flex flex-col gap-2 pt-0.5">
                          {(field.options || []).map((opt, oIdx) => {
                            const optVal = typeof opt === 'string' ? opt : (opt.label || opt.value);
                            const isOtherOpt = isOtherOption(optVal);
                            const isChecked = isOtherOpt
                              ? isOtherValue(fieldVal)
                              : fieldVal === optVal;

                            return (
                              <div key={oIdx} className="flex flex-col gap-1.5">
                                <label
                                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all select-none ${
                                    isChecked 
                                      ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-2xs font-bold' 
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={field.id}
                                    value={optVal}
                                    checked={isChecked}
                                    onChange={() => handleRadioChoice(field.id, optVal)}
                                    className="text-blue-600 focus:ring-blue-500 shrink-0"
                                  />
                                  <span>{optVal}</span>
                                </label>
                                {isOtherOpt && isChecked && (
                                  <div className="ml-4 animate-fade-in">
                                    <input
                                      type="text"
                                      value={getOtherTextForField(field.id, fieldVal)}
                                      onChange={(e) => handleOtherTextChange(field.id, e.target.value)}
                                      placeholder="Please specify / Type what's other..."
                                      className="w-full px-3 py-2 bg-white border border-blue-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-slate-900 outline-none shadow-2xs placeholder:text-slate-400"
                                      autoFocus
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (fieldType === 'checkbox' || fieldType === 'multiselect') ? (
                        <div className="flex flex-col gap-2 pt-0.5">
                          {(field.options || []).map((opt, oIdx) => {
                            const optVal = typeof opt === 'string' ? opt : (opt.label || opt.value);
                            const currentArr = Array.isArray(fieldVal) ? fieldVal : (fieldVal ? [fieldVal] : []);
                            const isOtherOpt = isOtherOption(optVal);
                            const isChecked = isOtherOpt
                              ? currentArr.some(x => isOtherValue(x))
                              : currentArr.includes(optVal);

                            const otherItem = isOtherOpt ? currentArr.find(x => isOtherValue(x)) : null;

                            return (
                              <div key={oIdx} className="flex flex-col gap-1.5">
                                <label
                                  onClick={(e) => { e.preventDefault(); handleCheckboxChoice(field.id, optVal, !isChecked); }}
                                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all select-none ${
                                    isChecked 
                                      ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-2xs font-bold' 
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                    isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                                  }`}>
                                    {isChecked && <Check size={11} strokeWidth={3} />}
                                  </div>
                                  <span>{optVal}</span>
                                </label>
                                {isOtherOpt && isChecked && (
                                  <div className="ml-4 animate-fade-in">
                                    <input
                                      type="text"
                                      value={customOtherTexts[`${field.id}__other`] || (otherItem && isOtherValue(otherItem) && otherItem.startsWith("Other: ") ? otherItem.slice(7) : "")}
                                      onChange={(e) => handleCheckboxOtherTextChange(field.id, optVal, e.target.value)}
                                      placeholder="Please specify / Type what's other..."
                                      className="w-full px-3 py-2 bg-white border border-blue-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-slate-900 outline-none shadow-2xs placeholder:text-slate-400"
                                      autoFocus
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (fieldType === 'textarea' || fieldType === 'long_text' || fieldType === 'paragraph') ? (
                        <textarea
                          rows={3}
                          value={fieldVal || ''}
                          onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                          placeholder={field.placeholder || 'Type answer here...'}
                          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-50 shadow-2xs ${
                            fieldError ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-300'
                          }`}
                        />
                      ) : ['picture', 'photo', 'image', 'avatar', 'file'].includes(fieldType) ? (
                        <FormImageUploader
                          value={fieldVal || ''}
                          onChange={(imgData) => handleAnswerChange(field.id, imgData)}
                          label={field.label || 'Upload File / Photo'}
                          placeholder={field.placeholder || 'Upload attendee photo or document'}
                        />
                      ) : fieldType === 'number' ? (
                        <input
                          type="number"
                          value={fieldVal || ''}
                          onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                          placeholder={field.placeholder || '0'}
                          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-50 shadow-2xs ${
                            fieldError ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-300'
                          }`}
                        />
                      ) : fieldType === 'date' ? (
                        <input
                          type="date"
                          value={fieldVal || ''}
                          onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-50 shadow-2xs ${
                            fieldError ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-300'
                          }`}
                        />
                      ) : (fieldType === 'phone' || field.id === 'f_core_phone' || (field.id && field.id.toLowerCase().includes('phone')) || (field.label && field.label.toLowerCase().includes('phone'))) ? (
                        <CountryPhoneInput
                          value={fieldVal || ''}
                          onChange={(val) => {
                            handleAnswerChange(field.id, val);
                            setPhone(val);
                          }}
                          placeholder={field.placeholder || '550 12 34 56'}
                          defaultCountry="DZ"
                          className="w-full"
                          inputClassName={fieldError ? 'border-rose-400' : ''}
                        />
                      ) : (
                        <input
                          type={fieldType === 'email' ? 'email' : 'text'}
                          value={fieldVal || ''}
                          onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                          placeholder={field.placeholder || `Enter ${(field.label || 'value').toLowerCase()}...`}
                          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-50 shadow-2xs ${
                            fieldError ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-300'
                          }`}
                        />
                      )}

                      {fieldError && (
                        <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                          <AlertCircle size={12} /> {fieldError}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {activeTab === 'badge' && (
            <div className="flex flex-col gap-6 animate-fade-in">

              <div className="bg-slate-50/90 border border-slate-250 rounded-2xl p-5 flex flex-col gap-3 shadow-2xs">
                <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Camera size={16} className="text-blue-600" />
                  <span>Attendee Badge Photo</span>
                </label>

                <FormImageUploader
                  value={avatar}
                  onChange={(imgUrl) => {
                    setAvatar(imgUrl);
                    handleAnswerChange('avatar', imgUrl);
                    handleAnswerChange('f_core_avatar', imgUrl);
                  }}
                  label="Upload Attendee Portrait"
                  placeholder="Upload high-res badge photo for lanyard printing"
                />
              </div>

              <div className="bg-slate-50/90 border border-slate-250 rounded-2xl p-5 flex flex-col gap-3 shadow-2xs">
                <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Check-in / Participation Status
                </label>

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setStatus('registered')}
                    className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      status === 'registered'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 size={16} className={status === 'registered' ? 'text-white' : 'text-slate-400'} />
                    <span className="text-xs font-bold">Registered</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('checked-in')}
                    className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      status === 'checked-in'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Check size={16} strokeWidth={3} className={status === 'checked-in' ? 'text-white' : 'text-slate-400'} />
                    <span className="text-xs font-bold">Checked In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('archived')}
                    className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      status === 'archived'
                        ? 'bg-slate-700 text-white border-slate-700 shadow-sm font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Trash2 size={16} className={status === 'archived' ? 'text-white' : 'text-slate-400'} />
                    <span className="text-xs font-bold">Archived</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50/90 border border-slate-250 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xs">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <QrIcon size={16} className="text-blue-600" />
                    <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Attendee Badge Code & QR
                    </label>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unique Badge Code</span>
                    <input
                      type="text"
                      value={badgeCode}
                      onChange={(e) => setBadgeCode(e.target.value.toUpperCase())}
                      placeholder="EZ-9482-ATT"
                      className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600 tracking-wider uppercase"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    This QR code can be scanned at registration desks and door kiosks to instantly verify and check in <strong className="text-slate-800">{name || 'the attendee'}</strong>.
                  </p>

                  <button
                    type="button"
                    onClick={handlePrintBadge}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Printer size={14} />
                    <span>Print Official A4 4-Fold Badge</span>
                  </button>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center shrink-0">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code" className="w-28 h-28 object-contain rounded-lg" />
                  ) : (
                    <div className="w-28 h-28 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                      <QrIcon size={32} />
                    </div>
                  )}
                  <span className="text-[10px] font-mono font-bold text-slate-600 mt-1.5 tracking-wider">
                    {badgeCode || 'EZ-PASS'}
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>

        <footer className="px-8 py-4 border-t border-slate-200 bg-white flex items-center justify-between select-none shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            {activeTab === 'form' ? (
              <button
                type="button"
                onClick={() => setActiveTab('badge')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Next: Badge & QR</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Back to Form</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>{attendee ? 'Update Attendee' : 'Register Attendee'}</span>
                </>
              )}
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}
