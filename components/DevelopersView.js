"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Code2, Terminal, Key, Webhook, Layers, Copy, Check, ExternalLink, 
  Play, Plus, Trash2, ShieldCheck, Sparkles, RefreshCw, Send, CheckCircle2, 
  AlertCircle, ChevronRight, HelpCircle, Eye, Sliders, Smartphone, Laptop, 
  Monitor, Palette, FileCode2, ArrowUpRight, Lock, Globe, Cpu, Database, 
  Activity, Info, X
} from "lucide-react";
import { useLanguage } from "../lib/i18n";
import SearchableSelect from "./SearchableSelect";
import { 
  fetchEventApiKeys, createEventApiKey, deleteEventApiKey,
  fetchEventWebhooks, saveEventWebhook, deleteEventWebhook
} from "../lib/db";

const PRESET_COLORS = [
  { name: "Blue", hex: "#2563eb" },
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Purple", hex: "#7c3aed" },
  { name: "Emerald", hex: "#059669" },
  { name: "Amber", hex: "#d97706" },
  { name: "Rose", hex: "#e11d48" },
  { name: "Slate", hex: "#0f172a" },
];

export default function DevelopersView({
  state = {},
  onSwitchView,
  onOpenModal,
}) {
  const { t, lang, isRTL } = useLanguage();
  const {
    eventDetails = {},
    tickets = [],
    attendees = [],
    pending = [],
    activeEventId,
    currentUser
  } = state;

  const currentEventId = activeEventId || eventDetails?.id || "cf12bb94-0cfb-4e0c-a96c-482a5c4e9021";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://eventzone.io";

  // Sub-Navigation Tabs
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "embed_builder" | "api_keys" | "rest_docs" | "webhooks" | "logs"

  // 1. Embed Builder State
  const [embedTheme, setEmbedTheme] = useState("light"); // "light" | "dark"
  const [embedColor, setEmbedColor] = useState("#2563eb");
  const [customHex, setCustomHex] = useState("#2563eb");
  const [selectedTicketFilter, setSelectedTicketFilter] = useState("all");
  const [hideHeader, setHideHeader] = useState(false);
  const [embedLang, setEmbedLang] = useState("en");
  const [embedSnippetType, setEmbedSnippetType] = useState("iframe"); // "iframe" | "script" | "react" | "wordpress" | "link"
  const [previewDevice, setPreviewDevice] = useState("desktop"); // "desktop" | "mobile"
  const [copiedKey, setCopiedKey] = useState(null);

  // 2. API Keys State
  const [apiKeys, setApiKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [isNewKeyModalOpen, setIsNewKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState("read_write");
  const [recentlyCreatedKey, setRecentlyCreatedKey] = useState(null);

  // 3. REST Playground State
  const [selectedEndpoint, setSelectedEndpoint] = useState("get_tickets"); // "get_tickets" | "register_attendee" | "get_attendees"
  const [codeLanguage, setCodeLanguage] = useState("curl"); // "curl" | "javascript" | "python" | "php" | "nodejs"
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundResponse, setPlaygroundResponse] = useState(null);
  const [playgroundPayload, setPlaygroundPayload] = useState({
    name: "Alex Vance",
    email: "alex.vance@example.com",
    phone: "+213 555 12 34 56",
    company: "Vance Tech Labs",
    jobTitle: "Chief Technology Officer",
    ticketType: tickets[0]?.name || "Standard Attendee Pass",
    referralCode: "PROMO2026",
    answers: {
      dietary_requirements: "None",
      tshirt_size: "L"
    }
  });

  // 4. Webhooks State
  const [webhooks, setWebhooks] = useState([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(true);
  const [isNewWebhookModalOpen, setIsNewWebhookModalOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [selectedWebhookEvents, setSelectedWebhookEvents] = useState(["registration.created", "registration.pending"]);
  const [testingWebhookId, setTestingWebhookId] = useState(null);
  const [webhookTestResult, setWebhookTestResult] = useState(null);

  // 5. Activity Logs State
  const [selectedLogPayload, setSelectedLogPayload] = useState(null);

  // Initial Load
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingKeys(true);
        setLoadingWebhooks(true);
        const [keys, whs] = await Promise.all([
          fetchEventApiKeys(currentEventId),
          fetchEventWebhooks(currentEventId)
        ]);
        setApiKeys(keys || []);
        setWebhooks(whs || []);
      } catch (e) {
        console.warn("Error loading developer data:", e);
      } finally {
        setLoadingKeys(false);
        setLoadingWebhooks(false);
      }
    }
    loadData();
  }, [currentEventId]);

  // Copy helper
  const handleCopy = (text, keyId) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Embed URL generation
  const embedUrl = useMemo(() => {
    const params = new URLSearchParams({
      eventId: currentEventId,
      theme: embedTheme,
      primaryColor: embedColor,
      hideHeader: hideHeader ? "true" : "false",
      lang: embedLang,
    });
    if (selectedTicketFilter && selectedTicketFilter !== "all") {
      params.set("ticketId", selectedTicketFilter);
    }
    return `${origin}/embed/tickets?${params.toString()}`;
  }, [currentEventId, embedTheme, embedColor, hideHeader, embedLang, selectedTicketFilter, origin]);

  // Code snippets for Embed Builder
  const embedSnippets = useMemo(() => {
    return {
      iframe: `<!-- Eventzone Tickets Responsive Embed Widget -->
<iframe 
  src="${embedUrl}" 
  width="100%" 
  height="650" 
  frameborder="0" 
  style="border: none; border-radius: 24px; overflow: hidden; width: 100%; min-height: 550px;"
  title="${eventDetails?.title || 'Eventzone'} Tickets"
  allow="clipboard-write"
></iframe>`,

      script: `<!-- 1. Place the container wherever you want the ticket forms to render -->
<div 
  id="eventzone-tickets-widget" 
  data-event-id="${currentEventId}" 
  data-theme="${embedTheme}" 
  data-color="${embedColor}" 
  data-hide-header="${hideHeader}"
  ${selectedTicketFilter !== "all" ? `data-ticket-id="${selectedTicketFilter}"` : ""}
></div>

<!-- 2. Drop-in Eventzone widget library -->
<script src="${origin}/embed.js" async></script>`,

      react: `// React / Next.js Ticket Widget Component
import React, { useEffect, useRef } from "react";

export default function EventzoneTicketWidget() {
  const iframeRef = useRef(null);

  useEffect(() => {
    function handleMessage(event) {
      if (event.data?.type === "EVENTZONE_RESIZE" && iframeRef.current) {
        iframeRef.current.style.height = event.data.height + "px";
      }
      if (event.data?.type === "EVENTZONE_REGISTRATION_SUCCESS") {
        console.log("New registration completed:", event.data.data);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src="${embedUrl}"
      width="100%"
      height="650"
      style={{ border: "none", borderRadius: "24px", overflow: "hidden", minHeight: "550px" }}
      title="Eventzone Tickets"
    />
  );
}`,

      wordpress: `<!-- WordPress / Webflow Custom HTML Block -->
<div class="eventzone-embed-container" style="max-width: 720px; margin: 0 auto;">
  <iframe 
    src="${embedUrl}" 
    width="100%" 
    height="650" 
    frameborder="0" 
    style="border: none; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); width: 100%; min-height: 550px;"
    title="Eventzone Registration"
  ></iframe>
</div>`,

      link: embedUrl,
    };
  }, [embedUrl, currentEventId, embedTheme, embedColor, hideHeader, selectedTicketFilter, origin, eventDetails]);

  // Generate API Key
  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const created = await createEventApiKey(currentEventId, newKeyName, newKeyPermissions);
      setApiKeys((prev) => [created, ...prev]);
      setRecentlyCreatedKey(created);
      setNewKeyName("");
      setIsNewKeyModalOpen(false);
    } catch (err) {
      alert("Failed to generate API Key: " + err.message);
    }
  };

  // Revoke API Key
  const handleDeleteKey = async (id) => {
    if (confirm("Are you sure you want to revoke this API Key? Any external sites using this key will immediately lose access.")) {
      await deleteEventApiKey(id, currentEventId);
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
    }
  };

  // Save Webhook
  const handleCreateWebhook = async () => {
    if (!newWebhookUrl.trim()) return;
    try {
      const created = await saveEventWebhook(currentEventId, {
        url: newWebhookUrl.trim(),
        events: selectedWebhookEvents,
        isActive: true,
      });
      setWebhooks((prev) => [created, ...prev.filter((w) => w.id !== created.id)]);
      setNewWebhookUrl("");
      setIsNewWebhookModalOpen(false);
    } catch (err) {
      alert("Failed to register webhook: " + err.message);
    }
  };

  // Delete Webhook
  const handleDeleteWebhook = async (id) => {
    if (confirm("Remove this webhook endpoint?")) {
      await deleteEventWebhook(id, currentEventId);
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    }
  };

  // Test Webhook Ping
  const handleTestWebhook = async (wh) => {
    setTestingWebhookId(wh.id);
    setWebhookTestResult(null);
    try {
      const res = await fetch(`/api/events/${currentEventId}/webhooks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: wh.url }),
      });
      const data = await res.json();
      setWebhookTestResult({ id: wh.id, ...data });
    } catch (e) {
      setWebhookTestResult({ id: wh.id, success: false, error: e.message });
    } finally {
      setTestingWebhookId(null);
    }
  };

  // Interactive REST Request Runner
  const handleRunPlaygroundRequest = async () => {
    setPlaygroundLoading(true);
    setPlaygroundResponse(null);
    const startTime = Date.now();

    try {
      if (selectedEndpoint === "get_tickets") {
        const res = await fetch(`/api/events/${currentEventId}/tickets`);
        const data = await res.json();
        setPlaygroundResponse({
          status: res.status,
          statusText: res.statusText || "OK",
          durationMs: Date.now() - startTime,
          data: data,
        });
      } else if (selectedEndpoint === "register_attendee") {
        const res = await fetch(`/api/events/${currentEventId}/tickets/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...playgroundPayload,
            source: "rest_api_playground",
          }),
        });
        const data = await res.json();
        setPlaygroundResponse({
          status: res.status,
          statusText: res.statusText || (res.ok ? "Created" : "Error"),
          durationMs: Date.now() - startTime,
          data: data,
        });
      } else if (selectedEndpoint === "get_attendees") {
        const res = await fetch(`/api/events/${currentEventId}/attendees`);
        const data = await res.json();
        setPlaygroundResponse({
          status: res.status,
          statusText: res.statusText || "OK",
          durationMs: Date.now() - startTime,
          data: data,
        });
      }
    } catch (err) {
      setPlaygroundResponse({
        status: 500,
        statusText: "Client Exception",
        durationMs: Date.now() - startTime,
        data: { error: err.message },
      });
    } finally {
      setPlaygroundLoading(false);
    }
  };

  // REST Code Generation
  const restCodeSnippets = useMemo(() => {
    const apiKeyHeader = apiKeys[0]?.key || "ez_live_YOUR_API_KEY";

    if (selectedEndpoint === "get_tickets") {
      const url = `${origin}/api/events/${currentEventId}/tickets`;
      return {
        curl: `curl -X GET "${url}" \\
  -H "Accept: application/json"`,
        javascript: `// Fetch available tickets and pricing
fetch("${url}")
  .then(res => res.json())
  .then(data => {
    console.log("Available tickets:", data.tickets);
  });`,
        python: `import requests

url = "${url}"
response = requests.get(url)
data = response.json()

print(data["tickets"])`,
        php: `<?php
$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL => "${url}",
  CURLOPT_RETURNTRANSFER => true,
]);
$response = curl_exec($curl);
curl_close($curl);
$data = json_decode($response, true);
print_r($data["tickets"]);
?>`,
        nodejs: `const axios = require("axios");

async function getTickets() {
  const { data } = await axios.get("${url}");
  console.log("Tickets:", data.tickets);
}
getTickets();`,
      };
    }

    if (selectedEndpoint === "register_attendee") {
      const url = `${origin}/api/events/${currentEventId}/tickets/register`;
      const bodyJson = JSON.stringify(playgroundPayload, null, 2);
      return {
        curl: `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKeyHeader}" \\
  -d '${JSON.stringify(playgroundPayload)}'`,
        javascript: `// Register attendee into Eventzone
const response = await fetch("${url}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "${apiKeyHeader}"
  },
  body: JSON.stringify(${bodyJson})
});

const result = await response.json();
console.log("Registration Badge Code:", result.badge?.code);`,
        python: `import requests

url = "${url}"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "${apiKeyHeader}"
}
payload = ${JSON.stringify(playgroundPayload, null, 4)}

response = requests.post(url, json=payload, headers=headers)
print("Badge Code:", response.json().get("badge", {}).get("code"))`,
        php: `<?php
$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL => "${url}",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => '${JSON.stringify(playgroundPayload)}',
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json',
    'x-api-key: ${apiKeyHeader}'
  ]
]);
$response = curl_exec($curl);
curl_close($curl);
echo $response;
?>`,
        nodejs: `const axios = require("axios");

async function registerAttendee() {
  const response = await axios.post("${url}", ${bodyJson}, {
    headers: { "x-api-key": "${apiKeyHeader}" }
  });
  console.log("Attendee Created:", response.data.attendee);
}
registerAttendee();`,
      };
    }

    if (selectedEndpoint === "get_attendees") {
      const url = `${origin}/api/events/${currentEventId}/attendees`;
      return {
        curl: `curl -X GET "${url}" \\
  -H "x-api-key: ${apiKeyHeader}"`,
        javascript: `fetch("${url}", {
  headers: { "x-api-key": "${apiKeyHeader}" }
})
  .then(res => res.json())
  .then(data => console.log("Attendees list:", data.attendees));`,
        python: `import requests

url = "${url}"
headers = { "x-api-key": "${apiKeyHeader}" }
response = requests.get(url, headers=headers)
print("Total Attendees:", response.json()["count"])`,
        php: `<?php
$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL => "${url}",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ['x-api-key: ${apiKeyHeader}']
]);
$response = curl_exec($curl);
curl_close($curl);
echo $response;
?>`,
        nodejs: `const axios = require("axios");

async function fetchAttendees() {
  const { data } = await axios.get("${url}", {
    headers: { "x-api-key": "${apiKeyHeader}" }
  });
  console.log("Count:", data.count);
}
fetchAttendees();`,
      };
    }

    return { curl: "", javascript: "", python: "", php: "", nodejs: "" };
  }, [selectedEndpoint, currentEventId, playgroundPayload, apiKeys, origin]);

  // External Registrations Log
  const externalRegistrations = useMemo(() => {
    const combined = [
      ...attendees.map((a) => ({
        id: a.id,
        name: a.name || `${a.first_name || ""} ${a.last_name || ""}`.trim() || "Attendee",
        email: a.email,
        ticketType: a.ticketType || a.ticket_type || "Standard Pass",
        status: "registered",
        date: a.registeredAt || a.registered_at || new Date().toISOString(),
        source: a.source || (a.phone ? "Embed / API" : "Web Platform"),
        raw: a,
      })),
      ...pending.map((p) => ({
        id: p.id,
        name: p.name || "Pending Applicant",
        email: p.email,
        ticketType: p.ticketType || "Application",
        status: "pending",
        date: p.date || p.created_at || new Date().toISOString(),
        source: "Embed / API",
        raw: p,
      })),
    ];
    return combined.slice(0, 25);
  }, [attendees, pending]);

  // Options for ticket dropdown using SearchableSelect
  const ticketOptions = useMemo(() => {
    const base = [{ value: "all", label: "All Active Ticket Tiers" }];
    const tierOpts = tickets.map((t) => ({
      value: t.id,
      label: `${t.name} (${Number(t.price || 0) === 0 ? "Free" : `${Number(t.price).toLocaleString()} DZD`})`,
    }));
    return [...base, ...tierOpts];
  }, [tickets]);

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-12 font-sans select-none animate-fade-in">
      {/* 1. Header Banner */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
              <Code2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Developers & Tickets API
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  CORS Enabled
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Embed interactive ticket checkout forms on external websites or ingest attendee registrations directly via REST API.
              </p>
            </div>
          </div>
        </div>

        {/* Quick event ID pill */}
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex flex-col text-left px-2">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Target Event ID</span>
            <span className="text-xs font-mono font-bold text-slate-800 truncate max-w-[170px]">{currentEventId}</span>
          </div>
          <button
            onClick={() => handleCopy(currentEventId, "eventId")}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Copy Event ID"
          >
            {copiedKey === "eventId" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          </button>
        </div>
      </header>

      {/* 2. Sub-Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-0">
        {[
          { id: "overview", label: "Quickstart & Overview", icon: Sparkles },
          { id: "embed_builder", label: "Embed Widget Builder", icon: Layers, badge: "Popular" },
          { id: "api_keys", label: "API Keys", icon: Key, badge: apiKeys.length },
          { id: "rest_docs", label: "REST API & Playground", icon: Terminal },
          { id: "webhooks", label: "Webhooks", icon: Webhook, badge: webhooks.length },
          { id: "logs", label: "Live Ingestion Logs", icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-blue-600 text-blue-600 font-extrabold bg-blue-50/50 rounded-t-2xl"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Icon size={15} className={isActive ? "text-blue-600" : "text-slate-400"} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: QUICKSTART & OVERVIEW */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-fade-in">
          {/* 3-Step Flow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                  1
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Choose Integration Mode</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Use our responsive <strong>Iframe Widget</strong>, drop-in <strong>JavaScript Library</strong>, or integrate custom forms via <strong>REST API</strong>.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("embed_builder")}
                className="mt-4 flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                <span>Launch Embed Builder</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-sm">
                  2
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Embed on Your Website</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Copy and paste the snippet onto Webflow, WordPress, Wix, React, or custom HTML. The form automatically matches your brand colors.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("embed_builder")}
                className="mt-4 flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:underline cursor-pointer"
              >
                <span>Generate Embed Code</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
                  3
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Real-Time Ingestion</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Attendees register on your website and instantly appear in Eventzone with verifiable QR badges, capacity tracking, and email passes.
                </p>
              </div>
              <button
                onClick={() => onSwitchView && onSwitchView("attendees")}
                className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                <span>View All Attendees ({attendees.length})</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Quick API Endpoints Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Live API Endpoints</h3>
                <p className="text-xs text-slate-500">Publicly accessible endpoints ready for external frontend and server integrations.</p>
              </div>
              <button
                onClick={() => setActiveTab("rest_docs")}
                className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Open API Tester
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-150 rounded-2xl overflow-hidden">
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-700">GET</span>
                  <span className="font-mono text-xs font-bold text-slate-800">/api/events/{currentEventId}/tickets</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">Fetch active ticket tiers, prices, capacity, & questionnaires</span>
              </div>

              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-blue-100 text-blue-700">POST</span>
                  <span className="font-mono text-xs font-bold text-slate-800">/api/events/{currentEventId}/tickets/register</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">Submit attendee registration & generate digital QR badge</span>
              </div>

              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-100 text-purple-700">GET</span>
                  <span className="font-mono text-xs font-bold text-slate-800">/embed/tickets?eventId={currentEventId}</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">Standalone checkout widget page for iframes & popups</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: EMBED BUILDER & LIVE PREVIEW */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "embed_builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          {/* Controls Configurator (Left 5 Cols) */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Embed Configurator</h3>
              <p className="text-xs text-slate-500">Customize the look, colors, and behavior of your ticket registration form.</p>
            </div>

            {/* Theme Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Color Theme</span>
                <span className="text-[10px] font-semibold text-slate-400 capitalize">{embedTheme} Mode</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEmbedTheme("light")}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    embedTheme === "light" ? "bg-blue-50 border-blue-500 text-blue-700 shadow-2xs" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <SunIcon size={14} />
                  <span>Light Theme</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEmbedTheme("dark")}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    embedTheme === "dark" ? "bg-slate-900 border-slate-900 text-white shadow-2xs" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <MoonIcon size={14} />
                  <span>Dark Theme</span>
                </button>
              </div>
            </div>

            {/* Primary Accent Color */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Brand Accent Color</span>
                <span className="font-mono text-[10px] font-bold text-slate-500">{embedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2 items-center">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => {
                      setEmbedColor(c.hex);
                      setCustomHex(c.hex);
                    }}
                    className={`w-7 h-7 rounded-xl transition-transform cursor-pointer relative ${
                      embedColor === c.hex ? "scale-115 ring-2 ring-offset-2 ring-slate-400" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {embedColor === c.hex && <Check size={13} className="text-white mx-auto" />}
                  </button>
                ))}
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    setEmbedColor(e.target.value);
                  }}
                  className="w-7 h-7 rounded-xl cursor-pointer border border-slate-200 bg-transparent p-0 overflow-hidden"
                  title="Custom Hex Picker"
                />
              </div>
            </div>

            {/* Ticket Tier Filter (SearchableSelect) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Pre-Select Ticket Tier</label>
              <SearchableSelect
                value={selectedTicketFilter}
                onChange={(val) => setSelectedTicketFilter(val)}
                options={ticketOptions}
                placeholder="All Active Tickets"
              />
              <p className="text-[10px] text-slate-400">Selecting a specific tier automatically skips the tier selector and opens its direct form.</p>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2 border-t border-slate-150">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Hide Event Header Banner</span>
                  <span className="text-[10px] text-slate-400">Useful when embedding directly inside your existing event landing page.</span>
                </div>
                <input
                  type="checkbox"
                  checked={hideHeader}
                  onChange={(e) => setHideHeader(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-md cursor-pointer"
                />
              </div>
            </div>

            {/* Code Snippet Tabs */}
            <div className="space-y-2 pt-2 border-t border-slate-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">Generated Integration Code</label>
                <div className="flex items-center gap-1">
                  {["iframe", "script", "react", "wordpress"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEmbedSnippetType(st)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold capitalize transition-colors cursor-pointer ${
                        embedSnippetType === st ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                  {embedSnippets[embedSnippetType]}
                </pre>
                <button
                  type="button"
                  onClick={() => handleCopy(embedSnippets[embedSnippetType], "embedCode")}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer backdrop-blur-md"
                >
                  {copiedKey === "embedCode" ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2">
                <a
                  href={embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Open Standalone Embed Page</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>

          {/* Live Interactive Preview (Right 7 Cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-4 border-slate-150">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">Live Preview</h3>
              </div>

              {/* Device switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    previewDevice === "desktop" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Desktop View"
                >
                  <Laptop size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    previewDevice === "mobile" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Mobile View"
                >
                  <Smartphone size={15} />
                </button>
              </div>
            </div>

            {/* Preview Frame Container */}
            <div className={`mx-auto transition-all p-4 rounded-3xl bg-slate-100/70 border border-slate-200/80 ${
              previewDevice === "mobile" ? "max-w-sm" : "w-full"
            }`}>
              <div className="rounded-2xl overflow-hidden shadow-sm bg-white">
                <iframe
                  key={`${embedUrl}-${embedTheme}-${embedColor}`}
                  src={embedUrl}
                  className="w-full min-h-[520px] border-0"
                  title="Live Ticket Form Preview"
                />
              </div>
            </div>

            <p className="text-[11px] text-center text-slate-400 font-medium">
              💡 This is a live preview. Submissions made here will register attendees directly into your event dashboard.
            </p>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: API KEYS & AUTHENTICATION */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "api_keys" && (
        <div className="space-y-6 animate-fade-in">
          {/* Top action card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Event API Keys</h3>
              <p className="text-xs text-slate-500 max-w-xl">
                API Keys allow your backend servers or applications to query attendees, submit batch registrations, and verify tickets securely.
              </p>
            </div>
            <button
              onClick={() => setIsNewKeyModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus size={15} />
              <span>Generate New API Key</span>
            </button>
          </div>

          {/* Recently Created Key Alert Modal */}
          {recentlyCreatedKey && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-3 animate-slide-down">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>API Key Generated Successfully</span>
                </div>
                <button
                  onClick={() => setRecentlyCreatedKey(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-xs text-emerald-700">
                Please copy your API key now. For your security, you will not be able to see this full key again.
              </p>
              <div className="flex items-center gap-2 p-2.5 bg-white rounded-2xl border border-emerald-200 font-mono text-xs text-slate-900">
                <span className="flex-1 truncate select-all">{recentlyCreatedKey.key}</span>
                <button
                  onClick={() => handleCopy(recentlyCreatedKey.key, "newKey")}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === "newKey" ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === "newKey" ? "Copied!" : "Copy Full Key"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Keys Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Active Keys</span>
              <span className="text-xs font-bold text-slate-400">{apiKeys.length} generated</span>
            </div>

            {loadingKeys ? (
              <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading API keys...</div>
            ) : apiKeys.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Key size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-700">No API Keys Generated Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Public GET endpoints do not require an API key, but generating one allows secure backend access.
                </p>
                <button
                  onClick={() => setIsNewKeyModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Create Your First Key
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-150">
                {apiKeys.map((k) => (
                  <div key={k.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">{k.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                        <span>{k.keyPrefix || `${k.key?.substring(0, 12)}...`}</span>
                        <button
                          onClick={() => handleCopy(k.key || k.keyPrefix, k.id)}
                          className="text-slate-400 hover:text-blue-600 cursor-pointer"
                          title="Copy Key Token"
                        >
                          {copiedKey === k.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                      <span>Created: {k.createdAt ? new Date(k.createdAt).toLocaleDateString() : "Recently"}</span>
                      <button
                        onClick={() => handleDeleteKey(k.id)}
                        className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Revoke Key"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: REST API REFERENCE & INTERACTIVE PLAYGROUND */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "rest_docs" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          {/* Endpoint Selector & Code (Left 6 Cols) */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">REST API Explorer</h3>
                <p className="text-xs text-slate-500">Test API requests directly with live data from this event.</p>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {["curl", "javascript", "python", "nodejs"].map((langId) => (
                  <button
                    key={langId}
                    type="button"
                    onClick={() => setCodeLanguage(langId)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      codeLanguage === langId ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {langId === "javascript" ? "JS" : langId === "nodejs" ? "Node" : langId}
                  </button>
                ))}
              </div>
            </div>

            {/* Endpoint Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedEndpoint("get_tickets")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedEndpoint === "get_tickets" ? "bg-blue-50 border-blue-500 text-blue-700 shadow-2xs" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 inline-block mb-1">GET</span>
                <span className="text-xs font-bold block truncate">Fetch Tickets</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEndpoint("register_attendee")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedEndpoint === "register_attendee" ? "bg-blue-50 border-blue-500 text-blue-700 shadow-2xs" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 text-blue-700 inline-block mb-1">POST</span>
                <span className="text-xs font-bold block truncate">Register Attendee</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEndpoint("get_attendees")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedEndpoint === "get_attendees" ? "bg-blue-50 border-blue-500 text-blue-700 shadow-2xs" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-purple-100 text-purple-700 inline-block mb-1">GET</span>
                <span className="text-xs font-bold block truncate">Query Attendees</span>
              </button>
            </div>

            {/* Editable Payload for POST */}
            {selectedEndpoint === "register_attendee" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800">Sample Registration Payload (JSON)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400">Full Name</span>
                    <input
                      type="text"
                      value={playgroundPayload.name}
                      onChange={(e) => setPlaygroundPayload((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400">Email</span>
                    <input
                      type="email"
                      value={playgroundPayload.email}
                      onChange={(e) => setPlaygroundPayload((p) => ({ ...p, email: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Code Snippet Box */}
            <div className="relative">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-64 border border-slate-800">
                {restCodeSnippets[codeLanguage]}
              </pre>
              <button
                type="button"
                onClick={() => handleCopy(restCodeSnippets[codeLanguage], "restSnippet")}
                className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer backdrop-blur-md"
              >
                {copiedKey === "restSnippet" ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Execute Button */}
            <button
              type="button"
              disabled={playgroundLoading}
              onClick={handleRunPlaygroundRequest}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {playgroundLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Executing Request...</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>Execute Test Request</span>
                </>
              )}
            </button>
          </div>

          {/* Response Inspector (Right 6 Cols) */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-4 border-slate-150">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">API Response</h3>
              </div>

              {playgroundResponse && (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                      playgroundResponse.status >= 200 && playgroundResponse.status < 300
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {playgroundResponse.status} {playgroundResponse.statusText}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{playgroundResponse.durationMs}ms</span>
                </div>
              )}
            </div>

            {!playgroundResponse ? (
              <div className="p-16 text-center space-y-2 text-slate-400">
                <Play size={28} className="mx-auto opacity-30" />
                <p className="text-xs font-semibold">Click &ldquo;Execute Test Request&rdquo; to send a live call.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[460px] border border-slate-800 leading-relaxed">
                  {JSON.stringify(playgroundResponse.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: WEBHOOKS */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "webhooks" && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Action Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Webhook Subscriptions</h3>
              <p className="text-xs text-slate-500 max-w-xl">
                Configure HTTP POST endpoints to receive instant notifications when attendees register, require approval, or check in.
              </p>
            </div>
            <button
              onClick={() => setIsNewWebhookModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus size={15} />
              <span>Add Webhook Endpoint</span>
            </button>
          </div>

          {/* Webhook Test Result Notice */}
          {webhookTestResult && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold animate-slide-down ${
              webhookTestResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
            }`}>
              <div className="flex items-center gap-2">
                {webhookTestResult.success ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
                <span>{webhookTestResult.message || (webhookTestResult.success ? "Test ping delivered successfully!" : webhookTestResult.error)}</span>
              </div>
              <button
                onClick={() => setWebhookTestResult(null)}
                className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Webhooks List */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Registered Endpoints</span>
              <span className="text-xs font-bold text-slate-400">{webhooks.length} configured</span>
            </div>

            {loadingWebhooks ? (
              <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading webhooks...</div>
            ) : webhooks.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Webhook size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-700">No Webhook Endpoints Configured</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Add an endpoint URL (e.g. from Zapier, Make.com, or your server) to receive real-time payload alerts.
                </p>
                <button
                  onClick={() => setIsNewWebhookModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Add Webhook URL
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-150">
                {webhooks.map((w) => (
                  <div key={w.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-slate-900">{w.url}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(w.events || []).map((ev, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-600">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={testingWebhookId === w.id}
                        onClick={() => handleTestWebhook(w)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {testingWebhookId === w.id ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            <span>Testing...</span>
                          </>
                        ) : (
                          <>
                            <Send size={12} />
                            <span>Test Ping</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteWebhook(w.id)}
                        className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Webhook"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 6: LIVE INGESTION ACTIVITY LOGS */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "logs" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Ingested Registrations</h3>
              <p className="text-xs text-slate-500">Live stream of attendee entries received via Embed Widgets and the Public REST API.</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Real-time Feed</span>
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            {externalRegistrations.length === 0 ? (
              <div className="p-12 text-center space-y-2 text-slate-400">
                <Activity size={28} className="mx-auto opacity-30" />
                <p className="text-xs font-bold text-slate-600">No Registrations Recorded Yet</p>
                <p className="text-xs">Use the Embed Builder or API Playground to submit a test ticket pass.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-4 pl-6">Attendee</th>
                      <th className="p-4">Ticket Tier</th>
                      <th className="p-4">Source</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Time</th>
                      <th className="p-4 pr-6 text-right">Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                    {externalRegistrations.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="font-extrabold text-slate-900">{item.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{item.email}</div>
                        </td>
                        <td className="p-4 font-bold text-blue-600">{item.ticketType}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {item.source}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              item.status === "registered"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 text-[11px]">
                          {item.date ? new Date(item.date).toLocaleString() : "Recently"}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLogPayload(item.raw)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Inspect JSON
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: CREATE API KEY */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {isNewKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                  <Key size={18} />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Generate Event API Key</h3>
              </div>
              <button
                onClick={() => setIsNewKeyModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Key Name / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Website Ticket Embed"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Access Permissions</label>
                <SearchableSelect
                  value={newKeyPermissions}
                  onChange={(v) => setNewKeyPermissions(v)}
                  options={[
                    { value: "read_write", label: "Read & Write (Tickets, Registrations, Attendees)" },
                    { value: "read_only", label: "Read-Only (Tickets & Public Schedules)" },
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsNewKeyModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newKeyName.trim()}
                onClick={handleCreateApiKey}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                Generate Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD WEBHOOK */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {isNewWebhookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                  <Webhook size={18} />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Add Webhook Endpoint</h3>
              </div>
              <button
                onClick={() => setIsNewWebhookModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Endpoint URL (HTTPS)</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.yourdomain.com/webhooks/eventzone"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Trigger Events</label>
                <div className="space-y-2">
                  {[
                    { id: "registration.created", label: "registration.created (Approved & Instant)" },
                    { id: "registration.pending", label: "registration.pending (Requires Review)" },
                    { id: "attendee.checked_in", label: "attendee.checked_in (On-site Scan)" },
                  ].map((ev) => (
                    <label key={ev.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedWebhookEvents.includes(ev.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWebhookEvents((prev) => [...prev, ev.id]);
                          } else {
                            setSelectedWebhookEvents((prev) => prev.filter((x) => x !== ev.id));
                          }
                        }}
                        className="rounded text-blue-600"
                      />
                      <span>{ev.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsNewWebhookModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newWebhookUrl.trim()}
                onClick={handleCreateWebhook}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                Register Webhook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: INSPECT RAW JSON PAYLOAD */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {selectedLogPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b pb-3 border-slate-150">
              <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900">
                <FileCode2 size={18} className="text-blue-600" />
                <span>Raw Attendee Ingestion Payload</span>
              </div>
              <button
                onClick={() => setSelectedLogPayload(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-96 border border-slate-800 leading-relaxed">
              {JSON.stringify(selectedLogPayload, null, 2)}
            </pre>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLogPayload(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SunIcon(props) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon(props) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
