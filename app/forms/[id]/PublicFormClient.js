"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  Star,
  Sparkles,
  Globe,
  Calendar,
  Building2,
  ShieldCheck,
  Check,
  Loader2,
  RefreshCw,
  Store,
  FileText
} from "lucide-react";
import CountryPhoneInput from "../../../components/CountryPhoneInput";
import { CountrySelect, CitySelect } from "../../../components/LocationInputs";
import SearchableSelect from "../../../components/SearchableSelect";
import FormImageUploader from "../../../components/FormImageUploader";
import FormFileUploader from "../../../components/FormFileUploader";
import { getFormSections, getLocalizedPresetOption } from "../../../lib/formPresets";
import { submitFormResponse, fetchFormById, generateUuid } from "../../../lib/db";
import { useLanguage } from "../../../lib/i18n";

export default function PublicFormClient({
  formId,
  initialForm = null,
  initialEvent = null
}) {
  const { t, lang, setLang, isRTL, languages } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [event, setEvent] = useState(initialEvent);
  const [isLoading, setIsLoading] = useState(!initialForm);
  const [isNotFound, setIsNotFound] = useState(false);

  // Form answer state
  const [answers, setAnswers] = useState({});
  const [otherTexts, setOtherTexts] = useState({});
  const [sectionIdx, setSectionIdx] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const formTopRef = useRef(null);

  // Fallback hydration from Supabase / localStorage on mount if initialForm was null
  useEffect(() => {
    if (form) return;
    if (!formId) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function loadForm() {
      setIsLoading(true);
      try {
        const fetched = await fetchFormById(formId);
        if (!isMounted) return;
        if (fetched) {
          setForm(fetched);
          setIsNotFound(false);
        } else {
          // Check localStorage as last resort
          if (typeof window !== "undefined") {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.startsWith("eventzone_cache_forms_") || key.startsWith("forms_"))) {
                try {
                  const list = JSON.parse(localStorage.getItem(key) || "[]");
                  const match = list.find(f => f.id === formId);
                  if (match) {
                    setForm(match);
                    setIsNotFound(false);
                    return;
                  }
                } catch (e) {}
              }
            }
          }
          setIsNotFound(true);
        }
      } catch (err) {
        console.warn("Public form client load error:", err);
        setIsNotFound(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadForm();
    return () => { isMounted = false; };
  }, [formId, form]);

  // Split form fields into sections
  const sections = useMemo(() => {
    if (!form || !Array.isArray(form.fields)) return [];
    return getFormSections(form.fields);
  }, [form]);

  const totalSections = sections.length;
  const currentSection = sections[sectionIdx] || { fields: [] };
  const isFirstSection = sectionIdx === 0;
  const isLastSection = totalSections <= 1 || sectionIdx === totalSections - 1;

  // "Other" option helpers
  const isOtherOption = (opt) => {
    if (!opt || typeof opt !== "string") return false;
    const clean = opt.trim().toLowerCase();
    return clean === "other" || clean.startsWith("other") || clean === "autre" || clean.startsWith("autre") || clean === "أخرى" || clean.startsWith("أخرى");
  };

  const isOtherValue = (val) => {
    if (!val || typeof val !== "string") return false;
    const clean = val.trim().toLowerCase();
    return clean === "other" || clean.startsWith("other:") || clean.startsWith("other (") || clean === "autre" || clean.startsWith("autre:") || clean === "أخرى" || clean.startsWith("أخرى:");
  };

  const getOtherText = (fieldId, val) => {
    if (otherTexts[fieldId] !== undefined) return otherTexts[fieldId];
    if (typeof val === "string") {
      if (val.toLowerCase().startsWith("other:")) return val.slice(6).trim();
      if (val.toLowerCase().startsWith("autre:")) return val.slice(6).trim();
      if (val.startsWith("أخرى:")) return val.slice(5).trim();
    }
    return "";
  };

  const handleFieldChange = (fieldId, value) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleSelectChange = (fieldId, selectedOpt) => {
    if (isOtherOption(selectedOpt)) {
      const existingText = otherTexts[fieldId] || "";
      const fullVal = existingText.trim() ? `Other: ${existingText.trim()}` : "Other";
      handleFieldChange(fieldId, fullVal);
    } else {
      handleFieldChange(fieldId, selectedOpt);
    }
  };

  const handleSelectOtherText = (fieldId, text) => {
    setOtherTexts(prev => ({ ...prev, [fieldId]: text }));
    const fullVal = text.trim() ? `Other: ${text.trim()}` : "Other";
    handleFieldChange(fieldId, fullVal);
  };

  const handleRadioChange = (fieldId, opt) => {
    if (isOtherOption(opt)) {
      const existingText = otherTexts[fieldId] || "";
      const fullVal = existingText.trim() ? `Other: ${existingText.trim()}` : "Other";
      handleFieldChange(fieldId, fullVal);
    } else {
      handleFieldChange(fieldId, opt);
    }
  };

  const handleCheckboxToggle = (fieldId, opt, isChecked) => {
    const current = answers[fieldId] || [];
    let next;
    if (isChecked) {
      if (isOtherOption(opt)) {
        const existingText = otherTexts[`${fieldId}__other`] || "";
        const fullVal = existingText.trim() ? `Other: ${existingText.trim()}` : opt;
        const withoutOther = current.filter(v => !isOtherValue(v));
        next = [...withoutOther, fullVal];
      } else {
        next = [...current, opt];
      }
    } else {
      if (isOtherOption(opt)) {
        next = current.filter(v => !isOtherValue(v));
      } else {
        next = current.filter(v => v !== opt);
      }
    }
    handleFieldChange(fieldId, next);
  };

  const handleCheckboxOtherText = (fieldId, opt, text) => {
    setOtherTexts(prev => ({ ...prev, [`${fieldId}__other`]: text }));
    const current = answers[fieldId] || [];
    const withoutOther = current.filter(v => !isOtherValue(v));
    const fullVal = text.trim() ? `Other: ${text.trim()}` : (opt || "Other");
    handleFieldChange(fieldId, [...withoutOther, fullVal]);
  };

  // Section Validation
  const validateCurrentSection = () => {
    const currentFields = (currentSection.fields || []).filter(f => f.type !== "section");
    const newErrors = {};

    currentFields.forEach(field => {
      const val = answers[field.id];
      const isRequired = field.required || ["f_core_name", "f_core_email", "f_core_phone"].includes(field.id);

      if (isRequired) {
        if (val === undefined || val === null || val === "") {
          newErrors[field.id] = t("forms.fieldRequiredError", "This field is required.");
        } else if (Array.isArray(val) && val.length === 0) {
          newErrors[field.id] = t("forms.fieldRequiredError", "This field is required.");
        } else if (field.id === "f_core_email" || field.type === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (typeof val === "string" && !emailRegex.test(val.trim())) {
            newErrors[field.id] = t("forms.invalidEmailError", "Please enter a valid email address.");
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextSection = () => {
    if (!validateCurrentSection()) {
      // Scroll to first error
      const firstErrorField = document.querySelector("[data-form-error='true']");
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setSectionIdx(prev => Math.min(totalSections - 1, prev + 1));
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePrevSection = () => {
    setSectionIdx(prev => Math.max(0, prev - 1));
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCurrentSection()) {
      const firstErrorField = document.querySelector("[data-form-error='true']");
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const respondentName = answers["f_core_name"] || answers["name"] || "Respondent";
      const respondentEmail = answers["f_core_email"] || answers["email"] || "";
      const targetEventId = form.eventId || form.event_id || event?.id || null;

      const payload = {
        id: generateUuid(),
        formId: form.id,
        eventId: targetEventId,
        respondentName,
        respondentEmail,
        ticketTier: (form.ticketId && form.ticketId !== "none" && form.ticketId !== "all")
          ? form.ticketId
          : "Standalone Form",
        answers: answers,
        createdAt: new Date().toISOString()
      };

      await submitFormResponse(payload, targetEventId);

      setIsSubmitted(true);
      if (formTopRef.current) {
        formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (err) {
      console.error("Failed to submit form response:", err);
      setSubmitError(t("forms.submitErrorMessage", "Could not submit response. Please check your network connection and try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setAnswers({});
    setOtherTexts({});
    setErrors({});
    setSectionIdx(0);
    setIsSubmitted(false);
    setSubmitError("");
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-blue-600 animate-spin" />
          <span className="text-xs font-bold text-slate-500">
            {t("forms.loadingForm", "Loading form...")}
          </span>
        </div>
      </div>
    );
  }

  // Not Found / Closed State
  if (isNotFound || !form) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xl flex flex-col items-center gap-4 animate-scale-up">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {t("forms.formNotFoundTitle", "Form Not Available")}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {t("forms.formNotFoundDesc", "This form does not exist, has been removed, or is no longer accepting public submissions.")}
          </p>
          <Link
            href="/"
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
          >
            <span>{t("common.backToHome", "Return to Eventzone")}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 py-8 sm:py-12 px-4 sm:px-6 flex flex-col items-center justify-start">
      {/* Scroll anchor */}
      <div ref={formTopRef} />

      {/* Top Bar: Brand + Language Selector */}
      <div className="w-full max-w-2xl mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 group cursor-pointer"
          title="Eventzone"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
            E
          </div>
          <span className="text-base font-extrabold text-slate-900 tracking-tight">
            Eventzone
          </span>
        </Link>

        {/* Language Switcher */}
        {languages && Array.isArray(languages) && languages.length > 0 && (
          <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-full p-1 shadow-2xs">
            {languages.map((l) => {
              const active = lang === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {l.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="w-full max-w-2xl">
        {isSubmitted ? (
          /* ================================================================= */
          /* SUCCESS SCREEN                                                    */
          /* ================================================================= */
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col items-center text-center gap-6 animate-scale-up">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">
                {t("forms.responseRecordedTitle", "Response Recorded!")}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                {form.settings?.successMessage ||
                  t("forms.defaultSuccessMessage", "Thank you! Your response has been securely submitted and recorded.")}
              </p>
            </div>

            {/* Event pill tag if linked */}
            {event?.title && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold">
                <Calendar size={13} className="text-blue-600" />
                <span className="truncate max-w-xs">{event.title}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleResetForm}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} className="text-blue-600" />
                <span>{t("forms.submitAnotherResponse", "Submit another response")}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* FORM FILLING INTERFACE                                            */
          /* ================================================================= */
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
            noValidate
          >
            {/* Header Card */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-4 text-start rtl:text-right text-left">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {event?.title ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-bold">
                    <Calendar size={12} />
                    <span className="truncate max-w-[260px]">{event.title}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                    <FileText size={12} />
                    <span>{t("forms.standaloneFormTag", "Public Form")}</span>
                  </span>
                )}

                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  <span>{t("forms.secureSubmission", "Secure & Verified")}</span>
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {form.title || t("forms.untitledForm", "Untitled Form")}
                </h1>
                {form.description && (
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 whitespace-pre-line leading-relaxed">
                    {form.description}
                  </p>
                )}
              </div>

              {/* Multi-Section Progress Bar & Steps */}
              {totalSections > 1 && (
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>
                      {t("forms.sectionStepIndicator", "Section")} {sectionIdx + 1} {t("common.of", "of")} {totalSections}
                      {currentSection.title ? `: ${currentSection.title}` : ""}
                    </span>
                    <span className="text-blue-600">
                      {Math.round(((sectionIdx + 1) / totalSections) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${((sectionIdx + 1) / totalSections) * 100}%` }}
                    />
                  </div>
                  {currentSection.description && (
                    <p className="text-xs text-slate-500 mt-1">
                      {currentSection.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Error Banner */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-semibold text-red-700 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Current Section Fields */}
            <div className="flex flex-col gap-4">
              {(currentSection.fields || [])
                .filter(field => field.type !== "section")
                .map((field) => {
                  const fieldError = errors[field.id];
                  const isRequired = field.required || ["f_core_name", "f_core_email", "f_core_phone"].includes(field.id);
                  const fieldValue = answers[field.id];

                  return (
                    <div
                      key={field.id}
                      data-form-error={fieldError ? "true" : "false"}
                      className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col gap-3 transition-all text-start rtl:text-right text-left ${
                        fieldError
                          ? "border-red-300 ring-2 ring-red-100"
                          : "border-slate-200/90 hover:border-slate-300"
                      }`}
                    >
                      {/* Field Label & Help Text */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800">
                          {field.label}
                          {isRequired && (
                            <span className="text-red-500 ms-1 font-black">*</span>
                          )}
                        </label>
                        {field.helpText && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {field.helpText}
                          </p>
                        )}
                      </div>

                      {/* Phone Input */}
                      {(field.id === "f_core_phone" || field.type === "phone") && (
                        <CountryPhoneInput
                          value={fieldValue || ""}
                          onChange={(val) => handleFieldChange(field.id, val)}
                          placeholder={field.placeholder || t("forms.enterPhoneNumber", "Enter phone number...")}
                          required={isRequired}
                        />
                      )}

                      {/* Country Select */}
                      {field.type === "country" && (
                        <CountrySelect
                          value={fieldValue || ""}
                          onChange={(val) => handleFieldChange(field.id, val)}
                          placeholder={field.placeholder || t("forms.selectCountryPlaceholder", "Select your country...")}
                          required={isRequired}
                        />
                      )}

                      {/* Dynamic City Select */}
                      {field.type === "city" && (
                        <CitySelect
                          value={fieldValue || ""}
                          country={
                            answers["f_country"] ||
                            answers["country"] ||
                            Object.entries(answers).find(([k]) => k.toLowerCase().includes("country"))?.[1] ||
                            ""
                          }
                          onChange={(val) => handleFieldChange(field.id, val)}
                          placeholder={field.placeholder || t("forms.selectCityPlaceholder", "Select or enter your city...")}
                          required={isRequired}
                        />
                      )}

                      {/* Image / Photo Uploader */}
                      {field.type === "picture" && (
                        <FormImageUploader
                          value={fieldValue || ""}
                          onChange={(val) => handleFieldChange(field.id, val)}
                          placeholder={field.placeholder || t("forms.uploadPhotoPlaceholder", "Upload your photo from phone or computer")}
                          required={isRequired}
                        />
                      )}

                      {/* File Uploaders (PDF, Word, Excel, CSV, PPTX, generic file) */}
                      {["pdf", "word", "excel", "csv", "pptx", "file"].includes(field.type) && (
                        <FormFileUploader
                          fileType={field.type}
                          value={fieldValue || ""}
                          onChange={(val) => handleFieldChange(field.id, val)}
                          placeholder={field.placeholder || ""}
                          required={isRequired}
                        />
                      )}

                      {/* Standard Text Inputs (Text, Number, Date, Email) */}
                      {["text", "number", "email", "date"].includes(field.type) &&
                        field.id !== "f_core_phone" && (
                          <input
                            type={field.type}
                            value={fieldValue || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder || ""}
                            required={isRequired}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400"
                          />
                        )}

                      {/* Paragraph Textarea */}
                      {field.type === "textarea" && (
                        <textarea
                          rows={4}
                          value={fieldValue || ""}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder || ""}
                          required={isRequired}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs sm:text-sm font-medium text-slate-900 outline-none transition-all resize-none placeholder:text-slate-400"
                        />
                      )}

                      {/* Dropdown Select (SearchableSelect) */}
                      {field.type === "select" && (
                        <div className="flex flex-col gap-2">
                          <SearchableSelect
                            value={
                              isOtherValue(fieldValue)
                                ? ((field.options || []).find(o => isOtherOption(o)) || "Other")
                                : (fieldValue || "")
                            }
                            onChange={(val) => handleSelectChange(field.id, val)}
                            options={(field.options || []).map(opt => ({
                              value: opt,
                              label: getLocalizedPresetOption(opt, t)
                            }))}
                            placeholder={field.placeholder || t("forms.selectOptionPlaceholder", "Select an option...")}
                            searchPlaceholder={t("forms.searchChoicesPlaceholder", "Search choices...")}
                            required={isRequired}
                          />
                          {isOtherValue(fieldValue) && (
                            <div className="animate-fade-in flex items-center gap-2 p-2.5 bg-blue-50/60 border border-blue-200 rounded-xl">
                              <input
                                type="text"
                                required={isRequired}
                                value={getOtherText(field.id, fieldValue)}
                                onChange={(e) => handleSelectOtherText(field.id, e.target.value)}
                                placeholder={t("forms.pleaseSpecifyOther", "Please specify...")}
                                className="w-full px-3 py-2 bg-white border border-blue-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-slate-900 outline-none shadow-2xs placeholder:text-slate-400"
                                autoFocus
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Radio Single Choice */}
                      {field.type === "radio" && (
                        <div className="flex flex-col gap-2.5 mt-1">
                          {(field.options || []).map((opt, i) => {
                            const isOtherOpt = isOtherOption(opt);
                            const isChecked = isOtherOpt
                              ? isOtherValue(fieldValue)
                              : fieldValue === opt;

                            return (
                              <div key={i} className="flex flex-col gap-1.5">
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name={`form_field_${field.id}`}
                                    value={opt}
                                    checked={isChecked}
                                    onChange={() => handleRadioChange(field.id, opt)}
                                    className="text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                                  />
                                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                                    {getLocalizedPresetOption(opt, t)}
                                  </span>
                                </label>
                                {isOtherOpt && isChecked && (
                                  <div className="ms-7 animate-fade-in">
                                    <input
                                      type="text"
                                      required={isRequired}
                                      value={getOtherText(field.id, fieldValue)}
                                      onChange={(e) => handleSelectOtherText(field.id, e.target.value)}
                                      placeholder={t("forms.pleaseSpecifyOther", "Please specify...")}
                                      className="w-full px-3 py-2 bg-white border border-blue-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-slate-900 outline-none shadow-2xs placeholder:text-slate-400"
                                      autoFocus
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Checkbox Multiple Choice */}
                      {field.type === "checkbox" && (
                        <div className="flex flex-col gap-2.5 mt-1">
                          {(field.options || []).map((opt, i) => {
                            const currentVals = answers[field.id] || [];
                            const isOtherOpt = isOtherOption(opt);
                            const isChecked = isOtherOpt
                              ? currentVals.some(x => isOtherValue(x))
                              : currentVals.includes(opt);

                            const otherItem = isOtherOpt ? currentVals.find(x => isOtherValue(x)) : null;

                            return (
                              <div key={i} className="flex flex-col gap-1.5">
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => handleCheckboxToggle(field.id, opt, e.target.checked)}
                                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                                  />
                                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                                    {getLocalizedPresetOption(opt, t)}
                                  </span>
                                </label>
                                {isOtherOpt && isChecked && (
                                  <div className="ms-7 animate-fade-in">
                                    <input
                                      type="text"
                                      value={
                                        otherTexts[`${field.id}__other`] ||
                                        (otherItem && isOtherValue(otherItem) && otherItem.startsWith("Other: ")
                                          ? otherItem.slice(7)
                                          : "")
                                      }
                                      onChange={(e) => handleCheckboxOtherText(field.id, opt, e.target.value)}
                                      placeholder={t("forms.pleaseSpecifyOther", "Please specify...")}
                                      className="w-full px-3 py-2 bg-white border border-blue-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-slate-900 outline-none shadow-2xs placeholder:text-slate-400"
                                      autoFocus
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 5-Star Rating */}
                      {field.type === "rating" && (
                        <div className="flex items-center gap-2 mt-1">
                          {[1, 2, 3, 4, 5].map(star => {
                            const currentRating = fieldValue || 0;
                            const isSelected = star <= currentRating;
                            return (
                              <button
                                type="button"
                                key={star}
                                onClick={() => handleFieldChange(field.id, star)}
                                className="p-1.5 transition-transform hover:scale-125 cursor-pointer"
                              >
                                <Star
                                  size={30}
                                  className={
                                    isSelected
                                      ? "text-amber-500 fill-amber-500"
                                      : "text-slate-300 hover:text-amber-400"
                                  }
                                />
                              </button>
                            );
                          })}
                          {fieldValue && (
                            <span className="text-xs font-bold text-amber-600 ms-2">
                              <bdi dir="ltr">{fieldValue} / 5</bdi> ⭐
                            </span>
                          )}
                        </div>
                      )}

                      {/* NPS Scale 0 to 10 */}
                      {field.type === "nps" && (
                        <div className="flex flex-col gap-1.5 mt-1">
                          <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => {
                              const isSelected = fieldValue === score;
                              return (
                                <button
                                  type="button"
                                  key={score}
                                  onClick={() => handleFieldChange(field.id, score)}
                                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105"
                                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  {score}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex justify-between text-[11px] font-bold text-slate-400 px-1">
                            <span>{t("forms.notLikely", "Not Likely")}</span>
                            <span>{t("forms.extremelyLikely", "Extremely Likely")}</span>
                          </div>
                        </div>
                      )}

                      {/* Switch */}
                      {field.type === "switch" && (
                        <label className="flex items-center gap-3 cursor-pointer mt-1">
                          <input
                            type="checkbox"
                            checked={fieldValue ?? field.defaultValue ?? false}
                            onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 relative"></div>
                          <span className="text-xs sm:text-sm font-semibold text-slate-700">
                            {fieldValue ? t("forms.yesConsented", "Yes, consented") : t("forms.no", "No")}
                          </span>
                        </label>
                      )}

                      {/* Booth Selection */}
                      {field.type === "booth_selection" && (
                        <div className="flex items-center gap-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
                          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Store size={18} />
                          </div>
                          <input
                            type="text"
                            value={fieldValue || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder || t("forms.enterBoothNumber", "Enter stand or booth preference / number...")}
                            className="w-full bg-white px-3.5 py-2 border border-blue-200 rounded-xl text-xs font-semibold text-slate-900 outline-none"
                          />
                        </div>
                      )}

                      {/* Validation Error Message */}
                      {fieldError && (
                        <span className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-0.5">
                          <AlertCircle size={13} />
                          <span>{fieldError}</span>
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Navigation & Submit Action Bar */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm flex items-center justify-between gap-4">
              <div>
                {!isFirstSection ? (
                  <button
                    type="button"
                    onClick={handlePrevSection}
                    className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs sm:text-sm shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft size={15} />
                    <span>{t("common.back", "Back")}</span>
                  </button>
                ) : (
                  <div />
                )}
              </div>

              <div>
                {!isLastSection ? (
                  <button
                    type="button"
                    onClick={handleNextSection}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>{t("common.next", "Next")}</span>
                    <ArrowRight size={15} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-7 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>{t("forms.submitting", "Submitting...")}</span>
                      </>
                    ) : (
                      <>
                        <span>{form.settings?.submitButtonText || t("forms.defaultSubmitBtnText", "Submit Response")}</span>
                        <Send size={15} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <span>Powered by</span>
          <Link href="/" className="font-extrabold text-slate-600 hover:text-blue-600 transition-colors">
            Eventzone
          </Link>
          <span>— All Rights Reserved</span>
        </div>
      </div>
    </div>
  );
}
