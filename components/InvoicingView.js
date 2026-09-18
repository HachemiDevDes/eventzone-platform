/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import InvoicingDashboard from "./InvoicingDashboard";
import InvoicingEditor from "./InvoicingEditor";
import InvoicingProfileSettingsModal from "./InvoicingProfileSettingsModal";
import { 
  fetchInvoicingProfiles, 
  upsertInvoicingProfile, 
  fetchInvoices, 
  upsertInvoice, 
  deleteInvoice, 
  updateInvoiceStatus, 
  convertQuoteToInvoice, 
  duplicateInvoice, 
  fetchInvoicingClients,
  upsertInvoicingClient
} from "../lib/db";
import { DEFAULT_INVOICING_PROFILE } from "../lib/invoicingConstants";
import { Check, Copy, AlertCircle } from "lucide-react";

/**
 * InvoicingView
 * Primary Controller for the Invoicing & Quotes Module in Eventzone Platform.
 */
export default function InvoicingView({
  currentUser = null,
  activeEventId = null,
  eventDetails = null,
  onSwitchView,
}) {
  const [viewMode, setViewMode] = useState("dashboard"); // 'dashboard' | 'editor'
  const [editingDoc, setEditingDoc] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState("all");
  const [savedClients, setSavedClients] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const userId = currentUser?.id || null;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial Data Loading
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch profiles
      const loadedProfiles = await fetchInvoicingProfiles(userId);
      if (loadedProfiles && loadedProfiles.length > 0) {
        setProfiles(loadedProfiles);
      } else {
        // Provide default profile
        const def = {
          ...DEFAULT_INVOICING_PROFILE,
          user_id: userId,
          company_name: eventDetails?.organization || currentUser?.company_name || DEFAULT_INVOICING_PROFILE.company_name,
          manager_name: currentUser?.fullName || currentUser?.full_name || DEFAULT_INVOICING_PROFILE.manager_name,
          email: currentUser?.email || DEFAULT_INVOICING_PROFILE.email,
        };
        const savedDefault = await upsertInvoicingProfile(def);
        setProfiles([savedDefault]);
      }

      // Fetch documents (invoices, quotes, proformas)
      const loadedInvoices = await fetchInvoices({ 
        userId, 
        eventId: activeEventId 
      });
      setInvoices(loadedInvoices || []);

      // Fetch saved client address book
      const loadedClients = await fetchInvoicingClients(userId);
      setSavedClients(loadedClients || []);
    } catch (err) {
      console.error("Invoicing load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, activeEventId, eventDetails, currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Active Profile object
  const activeProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0] || DEFAULT_INVOICING_PROFILE;

  // 2. Document Creation & Editing
  const handleCreateNewDocument = (docType = "facture") => {
    const prof = activeProfile || DEFAULT_INVOICING_PROFILE;
    const prefix = docType === "devis"
      ? (prof.quote_prefix || "DEV-26-")
      : docType === "proforma"
      ? (prof.proforma_prefix || "PRO-26-")
      : (prof.invoice_prefix || "EZ-26-");

    const seq = String(Math.floor(Math.random() * 900) + 100).padStart(4, "0");

    const now = new Date();
    const issueDate = now.toISOString().split("T")[0];
    const dueDateObj = new Date(now);
    dueDateObj.setDate(dueDateObj.getDate() + (prof.default_payment_delay_days || 30));
    const dueDate = dueDateObj.toISOString().split("T")[0];

    const newDoc = {
      user_id: userId,
      event_id: activeEventId || null,
      profile_id: prof.id || null,
      profile_name: prof.name || "Eventzone",
      document_type: docType,
      document_number: `${prefix}${seq}`,
      status: "brouillon",
      issue_date: issueDate,
      due_date: dueDate,
      payment_terms_type: "30_jours",
      currency: prof.default_currency || "DZD",
      logo_url: prof.logo_url || "",

      // Issuer details snapshot
      emitter_company_name: prof.company_name || "SPASU Eventzone",
      emitter_manager_name: prof.manager_name || "Hachemi Mohamed",
      emitter_address: prof.address || "Lotissement Pons N° 80, 2ème étage, Bureau N° 16, Commune de Kouba, Wilaya d'Alger",
      emitter_email: prof.email || "contact@eventzone.pro",
      emitter_phone: prof.phone || "0781457511",
      emitter_nif: prof.nif || "002616124370413",
      emitter_rc: prof.rc || "26B1243704-00/16",
      emitter_nis: prof.nis || "002616124370413",
      emitter_article_imposition: prof.article_imposition || "1618480001",
      emitter_bank_details: {
        bank_name: prof.bank_name || "BNA",
        account_holder: prof.account_holder || prof.company_name || "SPASU Eventzone",
        account_number: prof.account_number || "",
        rib: prof.rib || "",
        iban: prof.iban || "",
        swift_bic: prof.swift_bic || "",
        bank_agency_address: prof.bank_agency_address || "",
      },

      client_name: "",
      client_contact_name: "",
      client_address: "",
      client_email: "",
      client_phone: "",
      client_nif: "",
      client_rc: "",

      line_items: [
        { id: `item-${Date.now()}`, description: "", quantity: 1, unit_price: 0, total_ht: 0 }
      ],

      subtotal_ht: 0,
      discount_type: "percentage",
      discount_value: 0,
      discount_amount: 0,
      tva_rate: prof.default_tva_rate || 19,
      tva_amount: 0,
      has_fiscal_stamp: false,
      fiscal_stamp_amount: 0,
      total_ttc: 0,
      amount_paid: 0,
      amount_words: "Zéro dinars algériens",

      show_signature_stamp: Boolean(prof.signature_url),
      signature_stamp_url: prof.signature_url || "",
      notes: prof.default_notes || "Merci pour votre confiance. Paiement par virement bancaire dans le délai convenu.",
    };

    setEditingDoc(newDoc);
    setViewMode("editor");
  };

  const handleEditDocument = (doc) => {
    setEditingDoc(doc);
    setViewMode("editor");
  };

  // 3. Document Save
  const handleSaveDocument = async (docData) => {
    const payload = {
      ...docData,
      user_id: userId || docData.user_id,
      event_id: activeEventId || docData.event_id || null,
      profile_id: activeProfile?.id || docData.profile_id || null,
      profile_name: activeProfile?.name || docData.profile_name || "Eventzone",
    };

    const saved = await upsertInvoice(payload);
    if (saved) {
      setInvoices(prev => {
        const idx = prev.findIndex(i => i.id === saved.id);
        if (idx >= 0) {
          const clone = [...prev];
          clone[idx] = saved;
          return clone;
        }
        return [saved, ...prev];
      });

      // Also save client to address book if new
      if (saved.client_name && !savedClients.some(c => c.company_name?.toLowerCase() === saved.client_name?.toLowerCase())) {
        const newClient = await upsertInvoicingClient({
          user_id: userId,
          company_name: saved.client_name,
          contact_name: saved.client_contact_name,
          address: saved.client_address,
          email: saved.client_email,
          phone: saved.client_phone,
          nif: saved.client_nif,
          rc: saved.client_rc,
        });
        if (newClient) setSavedClients(c => [newClient, ...c]);
      }

      setEditingDoc(saved);
      showToast("Document enregistré avec succès !");
    }
  };

  // 4. Status Change from Table Row
  const handleStatusChange = async (invoiceId, newStatus) => {
    const updated = await updateInvoiceStatus(invoiceId, newStatus);
    if (updated) {
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus } : inv));
      showToast(`Statut mis à jour : ${newStatus}`);
    }
  };

  // 5. Delete Document
  const handleDeleteDocument = async (invoiceId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.")) {
      return;
    }
    const success = await deleteInvoice(invoiceId);
    if (success) {
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      showToast("Document supprimé");
    }
  };

  // 6. Duplicate Document
  const handleDuplicateDocument = async (invoiceId) => {
    const copy = await duplicateInvoice(invoiceId);
    if (copy) {
      setInvoices(prev => [copy, ...prev]);
      showToast("Document dupliqué en Brouillon");
    }
  };

  // 7. Convert Devis/Proforma to Facture
  const handleConvertDocument = async (invoiceId) => {
    const invoice = await convertQuoteToInvoice(invoiceId);
    if (invoice) {
      setInvoices(prev => [invoice, ...prev]);
      showToast("Devis converti en Facture !");
    }
  };

  // 8. Save Profile Settings
  const handleSaveProfile = async (profileData) => {
    const saved = await upsertInvoicingProfile({
      ...profileData,
      user_id: userId,
    });
    if (saved) {
      setProfiles(prev => {
        const idx = prev.findIndex(p => p.id === saved.id);
        if (idx >= 0) {
          const clone = [...prev];
          clone[idx] = saved;
          return clone;
        }
        return [saved, ...prev];
      });
      showToast("Profil de facturation enregistré !");
    }
  };

  // 9. Copy Share Link
  const handleCopyShareLink = (doc) => {
    const token = doc.share_token || doc.id;
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/invoices/${doc.id || token}`
      : `/invoices/${doc.id || token}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast("Lien public copié dans le presse-papiers !");
    }
  };

  // 10. Download PDF
  const handleDownloadPdf = (doc) => {
    if (doc.id) {
      window.open(`/api/invoices/${doc.id}/pdf`, "_blank");
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-slide-in-right">
          <Check size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* View Switching */}
      {viewMode === "dashboard" ? (
        <InvoicingDashboard
          invoices={invoices}
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          onSelectProfile={setSelectedProfileId}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onCreateNewDocument={handleCreateNewDocument}
          onEditDocument={handleEditDocument}
          onDeleteDocument={handleDeleteDocument}
          onDuplicateDocument={handleDuplicateDocument}
          onConvertDocument={handleConvertDocument}
          onStatusChange={handleStatusChange}
          onCopyShareLink={handleCopyShareLink}
          onDownloadPdf={handleDownloadPdf}
        />
      ) : (
        <InvoicingEditor
          initialDocument={editingDoc}
          activeProfile={activeProfile}
          savedClients={savedClients}
          onBack={() => {
            setViewMode("dashboard");
            setEditingDoc(null);
          }}
          onSave={handleSaveDocument}
          onCopyShareLink={handleCopyShareLink}
          onDownloadPdf={handleDownloadPdf}
        />
      )}

      {/* Profile Settings Modal */}
      <InvoicingProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentProfile={activeProfile}
        onSaveProfile={handleSaveProfile}
        userId={userId}
      />
    </div>
  );
}
