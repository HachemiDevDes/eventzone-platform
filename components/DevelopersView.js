"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Code2, Terminal, Key, Webhook, Layers, Copy, Check, ExternalLink, 
  Play, Plus, Trash2, ShieldCheck, Sparkles, RefreshCw, Send, CheckCircle2, 
  AlertCircle, ChevronRight, HelpCircle, Eye, Sliders, Smartphone, Laptop, 
  Monitor, Palette, Pipette, FileCode2, ArrowUpRight, Lock, Globe, Cpu, Database, 
  Activity, Info, X, Search, Ticket, Package, AlertTriangle, ArrowRight
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

const EMBED_FRAMEWORKS = [
  { id: "iframe", label: "Iframe" },
  { id: "script", label: "Script" },
  { id: "react", label: "React / Next.js" },
  { id: "vue", label: "Vue / Nuxt" },
  { id: "angular", label: "Angular" },
  { id: "svelte", label: "Svelte" },
  { id: "wordpress", label: "WordPress" },
  { id: "shopify", label: "Shopify" },
  { id: "flutter", label: "Flutter" },
  { id: "react_native", label: "React Native" },
];

const REST_LANGUAGES = [
  { id: "curl", label: "cURL" },
  { id: "javascript", label: "JavaScript" },
  { id: "nodejs", label: "Node.js" },
  { id: "python", label: "Python" },
  { id: "php", label: "PHP" },
  { id: "go", label: "Go" },
  { id: "csharp", label: "C# / .NET" },
  { id: "java", label: "Java" },
  { id: "ruby", label: "Ruby" },
  { id: "rust", label: "Rust" },
  { id: "dart", label: "Dart" },
  { id: "swift", label: "Swift" },
  { id: "kotlin", label: "Kotlin" },
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
  const [searchQuery, setSearchQuery] = useState("");

  // Direct Ticket Form Selection (Each ticket has its own direct form & API)
  const [selectedTicketId, setSelectedTicketId] = useState(() => tickets[0]?.id || "");

  // Update selected ticket if tickets list changes and none selected
  useEffect(() => {
    if (tickets.length > 0 && (!selectedTicketId || !tickets.some(t => t.id === selectedTicketId))) {
      setSelectedTicketId(tickets[0].id);
    }
  }, [tickets, selectedTicketId]);

  const currentSelectedTicket = useMemo(() => {
    return tickets.find(t => t.id === selectedTicketId) || tickets[0] || null;
  }, [tickets, selectedTicketId]);

  // 1. Embed Builder State
  const [embedTheme, setEmbedTheme] = useState("light"); // "light" | "dark"
  const [embedColor, setEmbedColor] = useState("#2563eb");
  const [customHex, setCustomHex] = useState("#2563eb");
  const [hideHeader, setHideHeader] = useState(false);
  const [embedLang, setEmbedLang] = useState("en");
  const [embedSnippetType, setEmbedSnippetType] = useState("iframe");
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
  const [selectedEndpoint, setSelectedEndpoint] = useState("register_attendee"); // "register_attendee" | "get_tickets" | "get_attendees"
  const [codeLanguage, setCodeLanguage] = useState("curl");
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundResponse, setPlaygroundResponse] = useState(null);
  const [playgroundPayload, setPlaygroundPayload] = useState({
    name: "Alex Vance",
    email: "alex.vance@example.com",
    phone: "+213 555 12 34 56",
    company: "Vance Tech Labs",
    jobTitle: "Lead Software Architect",
    ticketType: currentSelectedTicket?.name || "General Admission",
    ticketId: currentSelectedTicket?.id || undefined,
    referralCode: "PROMO2026",
    answers: {
      dietary_requirements: "None",
      tshirt_size: "L"
    }
  });

  // Sync playground payload when selected ticket changes
  useEffect(() => {
    if (currentSelectedTicket) {
      setPlaygroundPayload(prev => ({
        ...prev,
        ticketType: currentSelectedTicket.name,
        ticketId: currentSelectedTicket.id,
      }));
    }
  }, [currentSelectedTicket]);

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

  // Direct Ticket Form URL generation
  const directTicketEmbedUrl = useMemo(() => {
    const params = new URLSearchParams({
      eventId: currentEventId,
      theme: embedTheme,
      primaryColor: embedColor,
      hideHeader: hideHeader ? "true" : "false",
      lang: embedLang,
    });
    if (selectedTicketId) {
      params.set("ticketId", selectedTicketId);
    }
    return `${origin}/embed/tickets?${params.toString()}`;
  }, [currentEventId, selectedTicketId, embedTheme, embedColor, hideHeader, embedLang, origin]);

  // Direct Code snippets for Selected Ticket Form across Multiple Frameworks
  const embedSnippets = useMemo(() => {
    const ticketName = currentSelectedTicket?.name || "Event Ticket";

    return {
      iframe: `<!-- Eventzone Direct Ticket Form Embed (${ticketName}) -->
<iframe 
  src="${directTicketEmbedUrl}" 
  width="100%" 
  height="600" 
  frameborder="0" 
  style="border: none; border-radius: 24px; overflow: hidden; width: 100%; min-height: 520px;"
  title="${ticketName} Registration"
  allow="clipboard-write"
></iframe>`,

      script: `<!-- 1. Container for ${ticketName} registration form -->
<div 
  id="eventzone-tickets-widget" 
  data-event-id="${currentEventId}" 
  ${selectedTicketId ? `data-ticket-id="${selectedTicketId}"` : ""}
  data-theme="${embedTheme}" 
  data-color="${embedColor}" 
  data-hide-header="${hideHeader}"
></div>

<!-- 2. Drop-in Eventzone widget script -->
<script src="${origin}/embed.js" async></script>`,

      react: `// React / Next.js Component (${ticketName})
import React, { useEffect, useRef } from "react";

export default function TicketRegistrationWidget() {
  const iframeRef = useRef(null);

  useEffect(() => {
    function handleMessage(event) {
      if (event.data?.type === "EVENTZONE_RESIZE" && iframeRef.current) {
        iframeRef.current.style.height = event.data.height + "px";
      }
      if (event.data?.type === "EVENTZONE_REGISTRATION_SUCCESS") {
        console.log("Registration Success:", event.data.data);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src="${directTicketEmbedUrl}"
      width="100%"
      height="600"
      style={{ border: "none", borderRadius: "24px", overflow: "hidden", minHeight: "520px" }}
      title="${ticketName} Registration"
    />
  );
}`,

      vue: `<!-- Vue 3 / Nuxt 3 Component (${ticketName}) -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const iframeRef = ref(null);

function handleMessage(event) {
  if (event.data?.type === 'EVENTZONE_RESIZE' && iframeRef.value) {
    iframeRef.value.style.height = event.data.height + 'px';
  }
  if (event.data?.type === 'EVENTZONE_REGISTRATION_SUCCESS') {
    console.log('Registration received:', event.data.data);
  }
}

onMounted(() => window.addEventListener('message', handleMessage));
onUnmounted(() => window.removeEventListener('message', handleMessage));
</script>

<template>
  <div class="eventzone-ticket-widget">
    <iframe
      ref="iframeRef"
      src="${directTicketEmbedUrl}"
      width="100%"
      height="600"
      style="border: none; border-radius: 24px; overflow: hidden; width: 100%; min-height: 520px;"
      title="${ticketName} Registration"
    />
  </div>
</template>`,

      angular: `// Angular Component (${ticketName})
import { Component, HostListener } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-ticket-widget',
  template: \`
    <iframe 
      [src]="embedUrl" 
      width="100%" 
      [style.height.px]="frameHeight" 
      frameborder="0"
      style="border: none; border-radius: 24px; overflow: hidden; width: 100%; min-height: 520px;"
      title="${ticketName} Registration"
    ></iframe>
  \`
})
export class TicketWidgetComponent {
  frameHeight = 600;
  embedUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl('${directTicketEmbedUrl}');
  }

  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent) {
    if (event.data?.type === 'EVENTZONE_RESIZE') {
      this.frameHeight = event.data.height;
    }
  }
}`,

      svelte: `<!-- Svelte / SvelteKit Component (${ticketName}) -->
<script>
  import { onMount } from 'svelte';
  let iframeElement;

  onMount(() => {
    function handleMessage(event) {
      if (event.data?.type === 'EVENTZONE_RESIZE' && iframeElement) {
        iframeElement.style.height = event.data.height + 'px';
      }
      if (event.data?.type === 'EVENTZONE_REGISTRATION_SUCCESS') {
        console.log('Registration complete:', event.data.data);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  });
</script>

<iframe
  bind:this={iframeElement}
  src="${directTicketEmbedUrl}"
  width="100%"
  height="600"
  style="border: none; border-radius: 24px; overflow: hidden; width: 100%; min-height: 520px;"
  title="${ticketName} Registration"
/>`,

      wordpress: `<!-- WordPress / Webflow Custom HTML Block (${ticketName}) -->
<div class="eventzone-ticket-form-wrapper" style="max-width: 680px; margin: 0 auto;">
  <iframe 
    src="${directTicketEmbedUrl}" 
    width="100%" 
    height="600" 
    frameborder="0" 
    style="border: none; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); width: 100%; min-height: 520px;"
    title="${ticketName} Registration"
  ></iframe>
</div>`,

      shopify: `<!-- Shopify Liquid Section/Snippet: eventzone-ticket-form.liquid -->
<div class="eventzone-shopify-wrapper page-width" style="max-width: 720px; margin: 2rem auto;">
  <iframe 
    src="${directTicketEmbedUrl}" 
    width="100%" 
    height="600" 
    frameborder="0" 
    style="border: none; border-radius: 24px; width: 100%; min-height: 520px;"
    title="${ticketName} Registration"
  ></iframe>
</div>`,

      flutter: `// Flutter Mobile WebView Screen (${ticketName})
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class TicketRegistrationScreen extends StatefulWidget {
  const TicketRegistrationScreen({super.key});

  @override
  State<TicketRegistrationScreen> createState() => _TicketRegistrationScreenState();
}

class _TicketRegistrationScreenState extends State<TicketRegistrationScreen> {
  late final WebViewController controller;

  @override
  void initState() {
    super.initState();
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(Uri.parse('${directTicketEmbedUrl}'));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('${ticketName} Registration')),
      body: WebViewWidget(controller: controller),
    );
  }
}`,

      react_native: `// React Native Component (${ticketName})
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function TicketRegistration() {
  return (
    <View style={styles.container}>
      <WebView 
        source={{ uri: '${directTicketEmbedUrl}' }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  webview: { flex: 1 },
});`,
    };
  }, [directTicketEmbedUrl, currentEventId, selectedTicketId, embedTheme, embedColor, hideHeader, origin, currentSelectedTicket]);

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
      alert(t("dev.errGenerateKey", "Failed to generate API Key: ") + err.message);
    }
  };

  // Revoke API Key
  const handleDeleteKey = async (id) => {
    if (confirm(t("dev.confirmRevokeKey", "Are you sure you want to revoke this API Key? Any external sites using this key will immediately lose access."))) {
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
      alert(t("dev.errRegisterWebhook", "Failed to register webhook: ") + err.message);
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
      if (selectedEndpoint === "register_attendee") {
        const res = await fetch(`/api/events/${currentEventId}/tickets/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...playgroundPayload,
            ticketId: currentSelectedTicket?.id || selectedTicketId,
            ticketType: currentSelectedTicket?.name || playgroundPayload.ticketType,
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
      } else if (selectedEndpoint === "get_tickets") {
        const res = await fetch(`/api/events/${currentEventId}/tickets`);
        const data = await res.json();
        setPlaygroundResponse({
          status: res.status,
          statusText: res.statusText || "OK",
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

  // REST Code Generation across Multiple Backend Languages
  const restCodeSnippets = useMemo(() => {
    const apiKeyHeader = apiKeys[0]?.key || "ez_live_YOUR_API_KEY";
    const ticketName = currentSelectedTicket?.name || "Standard Pass";
    const targetTicketId = currentSelectedTicket?.id || "ticket-uuid";

    if (selectedEndpoint === "register_attendee") {
      const url = `${origin}/api/events/${currentEventId}/tickets/register`;
      const currentPayload = {
        ...playgroundPayload,
        ticketType: ticketName,
        ticketId: targetTicketId
      };
      const bodyJson = JSON.stringify(currentPayload, null, 2);

      return {
        curl: `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKeyHeader}" \\
  -d '${JSON.stringify(currentPayload)}'`,

        javascript: `// Modern JS Fetch (${ticketName})
const response = await fetch("${url}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "${apiKeyHeader}"
  },
  body: JSON.stringify(${bodyJson})
});

const result = await response.json();
console.log("Badge Code:", result.badge?.code);`,

        nodejs: `// Node.js Axios (${ticketName})
const axios = require("axios");

async function registerAttendee() {
  const { data } = await axios.post("${url}", ${bodyJson}, {
    headers: { "x-api-key": "${apiKeyHeader}" }
  });
  console.log("Attendee Registered:", data.attendee);
}
registerAttendee();`,

        python: `# Python Requests (${ticketName})
import requests

url = "${url}"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "${apiKeyHeader}"
}
payload = ${JSON.stringify(currentPayload, null, 4)}

response = requests.post(url, json=payload, headers=headers)
print("Badge Code:", response.json().get("badge", {}).get("code"))`,

        php: `<?php
// PHP cURL (${ticketName})
$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL => "${url}",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => '${JSON.stringify(currentPayload)}',
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json',
    'x-api-key: ${apiKeyHeader}'
  ]
]);
$response = curl_exec($curl);
curl_close($curl);
echo $response;
?>`,

        go: `// Go (Golang) (${ticketName})
package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "${url}"
	payload := []byte(\`${JSON.stringify(currentPayload)}\`)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", "${apiKeyHeader}")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}`,

        csharp: `// C# .NET HttpClient (${ticketName})
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

class Program {
    static async Task Main() {
        var client = new HttpClient();
        client.DefaultRequestHeaders.Add("x-api-key", "${apiKeyHeader}");

        var json = @"${JSON.stringify(currentPayload)}";
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync("${url}", content);
        var result = await response.Content.ReadAsStringAsync();
        Console.WriteLine(result);
    }
}`,

        java: `// Java 11+ HttpClient (${ticketName})
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        String json = """
        ${JSON.stringify(currentPayload, null, 8)}
        """;

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("${url}"))
            .header("Content-Type", "application/json")
            .header("x-api-key", "${apiKeyHeader}")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.body());
    }
}`,

        ruby: `# Ruby Net::HTTP (${ticketName})
require 'net/http'
require 'uri'
require 'json'

uri = URI.parse("${url}")
request = Net::HTTP::Post.new(uri)
request.content_type = "application/json"
request["x-api-key"] = "${apiKeyHeader}"
request.body = JSON.dump(${JSON.stringify(currentPayload, null, 2)})

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts response.body`,

        rust: `// Rust Reqwest (${ticketName})
use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std.error::Error>> {
    let client = reqwest::Client::new();
    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert("x-api-key", HeaderValue::from_static("${apiKeyHeader}"));

    let payload = json!(${JSON.stringify(currentPayload, null, 4)});

    let res = client.post("${url}")
        .headers(headers)
        .json(&payload)
        .send()
        .await?
        .text()
        .await?;

    println!("{}", res);
    Ok(())
}`,

        dart: `// Dart / Flutter HTTP (${ticketName})
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> registerAttendee() async {
  final url = Uri.parse('${url}');
  final response = await http.post(
    url,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': '${apiKeyHeader}',
    },
    body: jsonEncode(${JSON.stringify(currentPayload, null, 2)}),
  );

  print('Status: \${response.statusCode}');
  print('Body: \${response.body}');
}`,

        swift: `// Swift URLSession (${ticketName})
import Foundation

let url = URL(string: "${url}")!
var request = URLRequest(url: url)
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
request.setValue("${apiKeyHeader}", forHTTPHeaderField: "x-api-key")

let jsonPayload: [String: Any] = [
    "name": "${currentPayload.name}",
    "email": "${currentPayload.email}",
    "ticketType": "${currentPayload.ticketType}",
    "ticketId": "${currentPayload.ticketId}"
]
request.httpBody = try? JSONSerialization.data(withJSONObject: jsonPayload)

let task = URLSession.shared.dataTask(with: request) { data, response, error in
    if let data = data, let str = String(data: data, encoding: .utf8) {
        print(str)
    }
}
task.resume()`,

        kotlin: `// Kotlin OkHttp (${ticketName})
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

fun main() {
    val client = OkHttpClient()
    val mediaType = "application/json; charset=utf-8".toMediaType()
    val json = """${JSON.stringify(currentPayload)}"""
    val body = json.toRequestBody(mediaType)

    val request = Request.Builder()
        .url("${url}")
        .post(body)
        .addHeader("Content-Type", "application/json")
        .addHeader("x-api-key", "${apiKeyHeader}")
        .build()

    client.newCall(request).execute().use { response ->
        println(response.body?.string())
    }
}`,
      };
    }

    if (selectedEndpoint === "get_tickets") {
      const url = `${origin}/api/events/${currentEventId}/tickets`;
      return {
        curl: `curl -X GET "${url}" \\
  -H "Accept: application/json"`,
        javascript: `fetch("${url}")
  .then(res => res.json())
  .then(data => console.log(data.tickets));`,
        nodejs: `const axios = require("axios");
const { data } = await axios.get("${url}");
console.log(data.tickets);`,
        python: `import requests
response = requests.get("${url}")
print(response.json()["tickets"])`,
        php: `<?php
$res = file_get_contents("${url}");
print_r(json_decode($res, true)["tickets"]);
?>`,
        go: `package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	resp, _ := http.Get("${url}")
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}`,
        csharp: `using System;
using System.Net.Http;
using System.Threading.Tasks;

class Program {
    static async Task Main() {
        var client = new HttpClient();
        var res = await client.GetStringAsync("${url}");
        Console.WriteLine(res);
    }
}`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest req = HttpRequest.newBuilder().uri(URI.create("${url}")).GET().build();
        HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println(res.body());
    }
}`,
        ruby: `require 'net/http'
require 'uri'
res = Net::HTTP.get(URI.parse("${url}"))
puts res`,
        rust: `#[tokio::main]
async fn main() -> Result<(), reqwest::Error> {
    let body = reqwest::get("${url}").await?.text().await?;
    println!("{}", body);
    Ok(())
}`,
        dart: `import 'package:http/http.dart' as http;
void main() async {
  final res = await http.get(Uri.parse('${url}'));
  print(res.body);
}`,
        swift: `import Foundation
let url = URL(string: "${url}")!
URLSession.shared.dataTask(with: url) { data, _, _ in
    if let data = data { print(String(data: data, encoding: .utf8)!) }
}.resume()`,
        kotlin: `import okhttp3.OkHttpClient
import okhttp3.Request
fun main() {
    val client = OkHttpClient()
    val request = Request.Builder().url("${url}").build()
    val response = client.newCall(request).execute()
    println(response.body?.string())
}`,
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
  .then(data => console.log(data.attendees));`,
        nodejs: `const axios = require("axios");
const { data } = await axios.get("${url}", {
  headers: { "x-api-key": "${apiKeyHeader}" }
});
console.log(data.attendees);`,
        python: `import requests
headers = { "x-api-key": "${apiKeyHeader}" }
res = requests.get("${url}", headers=headers)
print(res.json()["attendees"])`,
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
        go: `package main
import (
	"fmt"
	"io"
	"net/http"
)
func main() {
	req, _ := http.NewRequest("GET", "${url}", nil)
	req.Header.Set("x-api-key", "${apiKeyHeader}")
	resp, _ := (&http.Client{}).Do(req)
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}`,
        csharp: `using System;
using System.Net.Http;
using System.Threading.Tasks;
class Program {
    static async Task Main() {
        var client = new HttpClient();
        client.DefaultRequestHeaders.Add("x-api-key", "${apiKeyHeader}");
        var res = await client.GetStringAsync("${url}");
        Console.WriteLine(res);
    }
}`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
public class Main {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest req = HttpRequest.newBuilder().uri(URI.create("${url}")).header("x-api-key", "${apiKeyHeader}").GET().build();
        HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println(res.body());
    }
}`,
        ruby: `require 'net/http'
require 'uri'
uri = URI.parse("${url}")
req = Net::HTTP::Get.new(uri)
req['x-api-key'] = "${apiKeyHeader}"
res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body`,
        rust: `#[tokio::main]
async fn main() -> Result<(), reqwest::Error> {
    let client = reqwest::Client::new();
    let body = client.get("${url}").header("x-api-key", "${apiKeyHeader}").send().await?.text().await?;
    println!("{}", body);
    Ok(())
}`,
        dart: `import 'package:http/http.dart' as http;
void main() async {
  final res = await http.get(Uri.parse('${url}'), headers: {'x-api-key': '${apiKeyHeader}'});
  print(res.body);
}`,
        swift: `import Foundation
var req = URLRequest(url: URL(string: "${url}")!)
req.setValue("${apiKeyHeader}", forHTTPHeaderField: "x-api-key")
URLSession.shared.dataTask(with: req) { data, _, _ in
    if let data = data { print(String(data: data, encoding: .utf8)!) }
}.resume()`,
        kotlin: `import okhttp3.OkHttpClient
import okhttp3.Request
fun main() {
    val client = OkHttpClient()
    val request = Request.Builder().url("${url}").addHeader("x-api-key", "${apiKeyHeader}").build()
    val response = client.newCall(request).execute()
    println(response.body?.string())
}`,
      };
    }

    return {};
  }, [selectedEndpoint, currentEventId, apiKeys, playgroundPayload, origin, currentSelectedTicket]);

  // Combined external activity records
  const externalRegistrations = useMemo(() => {
    const fromAttendees = attendees.map((a) => ({
      id: a.id,
      name: a.name || `${a.firstName || ""} ${a.lastName || ""}`.trim() || a.email,
      email: a.email,
      ticketType: a.ticketType || a.tier || "General Admission",
      source: a.source || "Direct Form Embed",
      status: "registered",
      date: a.date || a.createdAt || new Date().toISOString(),
      raw: a,
    }));

    const fromPending = pending.map((p) => {
      let parsedNote = {};
      try {
        parsedNote = typeof p.note === "string" ? JSON.parse(p.note) : p.note || {};
      } catch (e) {
        parsedNote = { rawText: p.note };
      }
      return {
        id: p.id,
        name: p.name || p.email,
        email: p.email,
        ticketType: parsedNote.ticketType || "Pending Approval",
        source: parsedNote.source || "Direct Form Embed",
        status: "pending_review",
        date: p.date || new Date().toISOString(),
        raw: { ...p, parsedNote },
      };
    });

    return [...fromAttendees, ...fromPending].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [attendees, pending]);

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    if (!searchQuery.trim()) return externalRegistrations;
    const q = searchQuery.toLowerCase();
    return externalRegistrations.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.ticketType?.toLowerCase().includes(q) ||
        r.source?.toLowerCase().includes(q)
    );
  }, [externalRegistrations, searchQuery]);

  // Filtered API Keys
  const filteredApiKeys = useMemo(() => {
    if (!searchQuery.trim()) return apiKeys;
    const q = searchQuery.toLowerCase();
    return apiKeys.filter(
      (k) =>
        k.name?.toLowerCase().includes(q) ||
        k.keyPrefix?.toLowerCase().includes(q) ||
        k.permissions?.toLowerCase().includes(q)
    );
  }, [apiKeys, searchQuery]);

  // Filtered Webhooks
  const filteredWebhooks = useMemo(() => {
    if (!searchQuery.trim()) return webhooks;
    const q = searchQuery.toLowerCase();
    return webhooks.filter((w) => w.url?.toLowerCase().includes(q));
  }, [webhooks, searchQuery]);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-6 animate-fade-in text-slate-800 pb-16 w-full font-sans select-none">
      {/* ─────────────────────────────────────────────
          1. HEADER SECTION (Matches Logistics layout)
      ───────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {t("dev.title", "Developers & API Integrations")}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              {t("dev.corsActive", "CORS ACTIVE")}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {t("dev.subtitle", "Command center for public REST APIs, embeddable registration widgets, API keys, and real-time webhook ingestion.")}
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleCopy(currentEventId, "eventId")}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            {copiedKey === "eventId" ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span className="text-emerald-600 font-bold">{t("dev.eventIdCopied", "Event ID Copied")}</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>{t("dev.copyEventId", "Copy Event ID")}</span>
              </>
            )}
          </button>

          {activeTab === "embed_builder" && (
            <a
              href={directTicketEmbedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink size={14} />
              <span>{t("dev.openFormPage", "Open Form Page")}</span>
            </a>
          )}

          {activeTab === "api_keys" && (
            <button
              onClick={() => setIsNewKeyModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>{t("dev.generateKey", "Generate API Key")}</span>
            </button>
          )}

          {activeTab === "webhooks" && (
            <button
              onClick={() => setIsNewWebhookModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>{t("dev.addWebhook", "Add Webhook")}</span>
            </button>
          )}

          {activeTab === "rest_docs" && (
            <button
              onClick={handleRunPlaygroundRequest}
              disabled={playgroundLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Play size={15} />
              <span>{playgroundLoading ? t("dev.sendingBtn", "Sending...") : t("dev.testRegistrationApiBtn", "Test Registration API")}</span>
            </button>
          )}

          {activeTab !== "api_keys" && activeTab !== "webhooks" && activeTab !== "rest_docs" && (
            <button
              onClick={() => setIsNewKeyModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>{t("dev.generateKey", "Generate API Key")}</span>
            </button>
          )}
        </div>
      </header>

      {/* ─────────────────────────────────────────────
          2. EXECUTIVE KPI CARDS (Matches Logistics layout)
      ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Ticket Tiers */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("dev.publishedTicketTiersUpper", "Published Ticket Tiers")}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Ticket size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900"><bdi dir="ltr">{tickets.length}</bdi></div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-slate-500">
              <span className="text-blue-600 font-bold"><bdi dir="ltr">{tickets.filter(t => !t.isSoldOut).length}</bdi></span> {t("dev.activeTicketFormsReady", "active ticket forms ready")}
            </div>
          </div>
        </div>

        {/* Card 2: API Keys */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("dev.developerApiKeysUpper", "Developer API Keys")}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Key size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900"><bdi dir="ltr">{apiKeys.length}</bdi></div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-emerald-600">
              <CheckCircle2 size={12} className="shrink-0" />
              <span><bdi dir="ltr">{apiKeys.filter(k => k.is_active !== false).length}</bdi> {t("dev.activeCredentials", "active credentials")}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Webhooks */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("dev.activeWebhooksUpper", "Active Webhooks")}</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Webhook size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900"><bdi dir="ltr">{webhooks.length}</bdi></div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-indigo-600">
              {t("dev.realtimeDeliveryActive", "Real-time delivery active")}
            </div>
          </div>
        </div>

        {/* Card 4: Ingestion Health */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("dev.apiHealthIngestion", "API Health & Ingestion")}</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900"><bdi dir="ltr">100%</bdi></span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                {t("dev.onlineStatus", "Online")}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-150 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full w-full transition-all duration-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          3. SUB-MODULE TABS NAVIGATION (Matches Logistics tab strip)
      ───────────────────────────────────────────── */}
      <div className="flex items-center border-b border-slate-200 gap-1 overflow-x-auto">
        {[
          { id: "overview", label: t("dev.tabOverview", "Quickstart & Overview"), icon: Sparkles },
          { id: "embed_builder", label: t("dev.tabEmbed", "Embed Ticket Form"), icon: Layers, badge: t("dev.popularBadge", "Popular") },
          { id: "api_keys", label: t("dev.tabApiKeys", "API Keys"), icon: Key, badge: apiKeys.length },
          { id: "rest_docs", label: t("dev.tabRest", "REST API & Playground"), icon: Terminal },
          { id: "webhooks", label: t("dev.tabWebhooks", "Webhooks"), icon: Webhook, badge: webhooks.length },
          { id: "logs", label: t("dev.tabLogs", "Live Ingestion Logs"), icon: Activity, badge: attendees.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery("");
              }}
              className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none whitespace-nowrap ${
                isActive
                  ? "text-blue-600 font-black bg-blue-50/50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon size={14} className={isActive ? "text-blue-600" : "text-slate-400"} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : tab.badge === "Popular" || tab.badge === t("dev.popularBadge", "Popular")
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <bdi dir="ltr">{tab.badge}</bdi>
                </span>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────
          4. TAB CONTENTS
      ───────────────────────────────────────────── */}

      {/* TAB 1: QUICKSTART & OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          {/* Direct Ticket Forms Table / Directory */}
          <div className="bg-white rounded-3xl border border-slate-150 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{t("dev.directTicketFormWidgetsTitle", "Direct Ticket Form Widgets & APIs")}</h3>
                <p className="text-xs text-slate-500">{t("dev.directTicketFormWidgetsDesc", "Each ticket tier has its own direct form widget and dedicated registration API endpoint.")}</p>
              </div>
              <button
                onClick={() => onSwitchView ? onSwitchView("tickets") : (onOpenModal && onOpenModal("ticket"))}
                className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer self-start sm:self-center flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>{t("dev.manageTicketTiers", "Manage Ticket Tiers")}</span>
              </button>
            </div>

            {tickets.length === 0 ? (
              <div className="p-10 rounded-2xl border border-dashed border-slate-200 text-center space-y-3 bg-slate-50/50">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Ticket size={22} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">{t("dev.noTicketTiersTitle", "No Ticket Tiers Published Yet")}</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {t("dev.noTicketTiersDesc", "Create ticket tiers in the Tickets & Pricing module to generate direct checkout forms and endpoints.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSwitchView ? onSwitchView("tickets") : (onOpenModal && onOpenModal("ticket"))}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {t("dev.createFirstTicketBtn", "Create Your First Ticket")}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-150 rounded-2xl overflow-hidden">
                {tickets.map((t) => {
                  const isFree = !t.price || Number(t.price) === 0;
                  const ticketEmbedUrl = `${origin}/embed/tickets?eventId=${currentEventId}&ticketId=${t.id}`;
                  const ticketIframeCode = `<iframe src="${ticketEmbedUrl}" width="100%" height="600" frameborder="0" style="border:none;border-radius:24px;width:100%;min-height:520px;" title="${t.name} Registration"></iframe>`;

                  return (
                    <div key={t.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-extrabold text-slate-900">{t.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isFree ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {isFree ? t("dev.freePassBadge", "Free Pass") : `${Number(t.price).toLocaleString()} DZD`}
                          </span>
                          {t.requiresApproval && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              {t("dev.requiresApprovalBadge", "Requires Approval")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                          <span className="truncate max-w-md font-mono" dir="ltr">ID: {t.id}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(ticketIframeCode, `iframe-${t.id}`)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          {copiedKey === `iframe-${t.id}` ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          <span>{copiedKey === `iframe-${t.id}` ? t("dev.copied", "Copied!") : t("dev.copyEmbedCode", "Copy Embed Code")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTicketId(t.id);
                            setActiveTab("embed_builder");
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>{t("dev.customizePreviewForm", "Customize & Preview Form")}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3-Step Flow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                  1
                </div>
                <h3 className="text-base font-extrabold text-slate-900">{t("dev.cardDirectFormEmbedTitle", "Direct Form Embed")}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t("dev.cardDirectFormEmbedDesc", "Embed the registration form for any specific ticket directly on your custom pricing card or button.")}
                </p>
              </div>
              <button
                onClick={() => setActiveTab("embed_builder")}
                className="mt-4 flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                <span>{t("dev.launchFormCustomizer", "Launch Form Customizer")}</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-sm">
                  2
                </div>
                <h3 className="text-base font-extrabold text-slate-900">{t("dev.cardDirectTicketApiTitle", "Direct Ticket API")}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t("dev.cardDirectTicketApiDesc", "Use our REST endpoint to submit registrations for any specific ticket tier directly from your backend.")}
                </p>
              </div>
              <button
                onClick={() => setActiveTab("rest_docs")}
                className="mt-4 flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:underline cursor-pointer"
              >
                <span>{t("dev.openApiPlayground", "Open API Playground")}</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
                  3
                </div>
                <h3 className="text-base font-extrabold text-slate-900">{t("dev.cardInstantIngestionTitle", "Instant Ingestion")}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t("dev.cardInstantIngestionDesc", "Attendees receive instant digital QR badges, custom form questions are saved, and webhooks fire in real-time.")}
                </p>
              </div>
              <button
                onClick={() => onSwitchView && onSwitchView("attendees")}
                className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                <span>{t("dev.viewAttendeesLink", "View Attendees")} (<bdi dir="ltr">{attendees.length}</bdi>)</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMBED TICKET FORM BUILDER */}
      {activeTab === "embed_builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          {/* Controls Configurator (Left 5 Cols) */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-150 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">{t("dev.ticketFormConfiguratorTitle", "Ticket Form Configurator")}</h3>
              <p className="text-xs text-slate-500">{t("dev.ticketFormConfiguratorDesc", "Customize and embed the direct registration form for each specific ticket tier.")}</p>
            </div>

            {/* Select Target Ticket Tier */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>{t("dev.selectTargetTicketTier", "Select Target Ticket Tier")}</span>
                <span className="text-[10px] font-extrabold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {t("dev.directFormBadge", "DIRECT FORM")}
                </span>
              </label>

              {tickets.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-amber-900 block">{t("dev.noTicketsCreatedYet", "No tickets created yet")}</span>
                  <p className="text-[11px] text-amber-700">{t("dev.noTicketsCreatedDesc", "Please create ticket tiers first in Tickets & Pricing to configure form widgets.")}</p>
                  <button
                    type="button"
                    onClick={() => onSwitchView ? onSwitchView("tickets") : (onOpenModal && onOpenModal("ticket"))}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-[11px] cursor-pointer"
                  >
                    {t("dev.createTicketsBtn", "Create Tickets")}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {tickets.map((t) => {
                    const isSelected = selectedTicketId === t.id;
                    const isFree = !t.price || Number(t.price) === 0;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicketId(t.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 block leading-tight">{t.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">{t.id}</span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isFree ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {isFree ? t("dev.freeBadge", "Free") : `${Number(t.price).toLocaleString()} DZD`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Theme Picker */}
            <div className="space-y-2 pt-2 border-t border-slate-150">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>{t("dev.colorThemeLabel", "Color Theme")}</span>
                <span className="text-[10px] font-semibold text-slate-400 capitalize">{embedTheme === "light" ? t("dev.lightModeLabel", "Light Mode") : t("dev.darkModeLabel", "Dark Mode")}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEmbedTheme("light")}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    embedTheme === "light" ? "bg-blue-50 border-blue-500 text-blue-700 shadow-2xs" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <SunIcon />
                  <span>{t("dev.lightThemeBtn", "Light Theme")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEmbedTheme("dark")}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    embedTheme === "dark" ? "bg-slate-900 border-slate-900 text-white shadow-2xs" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <MoonIcon />
                  <span>{t("dev.darkThemeBtn", "Dark Theme")}</span>
                </button>
              </div>
            </div>

            {/* Accent Color Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>{t("dev.brandAccentColorLabel", "Brand Accent Color")}</span>
                <span className="text-[11px] font-mono text-slate-400">{embedColor}</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => {
                      setEmbedColor(c.hex);
                      setCustomHex(c.hex);
                    }}
                    style={{ backgroundColor: c.hex }}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-white transition-transform cursor-pointer ${
                      embedColor === c.hex ? "scale-110 ring-2 ring-offset-2 ring-blue-600 shadow-xs" : "hover:scale-105"
                    }`}
                  >
                    {embedColor === c.hex && <Check size={14} />}
                  </button>
                ))}
                <label
                  className={`w-7 h-7 rounded-xl flex items-center justify-center border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-2xs relative group ${
                    !PRESET_COLORS.some((c) => c.hex.toLowerCase() === embedColor.toLowerCase())
                      ? "ring-2 ring-offset-2 ring-blue-600 border-blue-500 text-blue-600"
                      : ""
                  }`}
                  title={t("dev.pickCustomColor", "Pick Custom Color")}
                >
                  <Pipette size={13} className="group-hover:scale-110 transition-transform" />
                  <input
                    type="color"
                    value={customHex}
                    onChange={(e) => {
                      setCustomHex(e.target.value);
                      setEmbedColor(e.target.value);
                    }}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </label>
              </div>
            </div>


            {/* Code Snippet Tabs with Multi-Framework Buttons */}
            <div className="space-y-2.5 pt-2 border-t border-slate-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">{t("dev.integrationFrameworkLabel", "Integration Framework")}</label>
                <span className="text-[10px] font-semibold text-slate-400">{t("dev.frameworksCount", "10+ Frameworks")}</span>
              </div>

              {/* Framework Pills Strip */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
                {EMBED_FRAMEWORKS.map((fw) => (
                  <button
                    key={fw.id}
                    type="button"
                    onClick={() => setEmbedSnippetType(fw.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      embedSnippetType === fw.id
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    {fw.label}
                  </button>
                ))}
              </div>

              <div className="relative mt-2">
                <pre dir="ltr" className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-mono text-left overflow-x-auto max-h-56 border border-slate-800 leading-relaxed">
                  {embedSnippets[embedSnippetType] || embedSnippets.iframe}
                </pre>
                <button
                  type="button"
                  onClick={() => handleCopy(embedSnippets[embedSnippetType] || embedSnippets.iframe, "embedCode")}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer backdrop-blur-md"
                >
                  {copiedKey === "embedCode" ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span>{t("dev.copied", "Copied!")}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>{t("dev.copySnippet", "Copy")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Live Interactive Preview (Right 7 Cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-4 border-slate-150">
              <h3 className="text-base font-extrabold text-slate-900">
                {t("dev.liveFormPreviewTitle", "Live Form Preview")} {currentSelectedTicket ? `(${currentSelectedTicket.name})` : ""}
              </h3>

              {/* Device switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    previewDevice === "desktop" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                  title={t("dev.desktopView", "Desktop View")}
                >
                  <Laptop size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    previewDevice === "mobile" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                  title={t("dev.mobileView", "Mobile View")}
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
                  key={`${directTicketEmbedUrl}-${selectedTicketId}-${embedTheme}-${embedColor}`}
                  src={directTicketEmbedUrl}
                  className="w-full min-h-[520px] border-0"
                  title="Direct Ticket Form Preview"
                />
              </div>
            </div>

            <p className="text-[11px] text-center text-slate-400 font-medium">
              💡 {t("dev.previewDisclaimer", "This preview shows the direct registration form for {ticket}. Submitting will register attendees immediately into your Eventzone platform.").replace("{ticket}", currentSelectedTicket?.name || "this ticket")}
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: API KEYS & AUTHENTICATION */}
      {activeTab === "api_keys" && (
        <div className="space-y-6 animate-fade-in">
          {/* Search bar & filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-3">
            <Search size={16} className="text-slate-400 shrink-0 ms-1" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("dev.searchApiKeysPlaceholder", "Search API keys by name, prefix, or permissions...")}
              className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Recently Created Key Alert Modal */}
          {recentlyCreatedKey && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-3 animate-slide-down">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>{t("dev.keyGeneratedSuccess", "API Key Generated Successfully")}</span>
                </div>
                <button
                  onClick={() => setRecentlyCreatedKey(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  {t("dev.dismissBtn", "Dismiss")}
                </button>
              </div>
              <p className="text-xs text-emerald-700">
                {t("dev.copyKeyWarning", "Please copy your API key now. For your security, you will not be able to see this full key again.")}
              </p>
              <div className="flex items-center gap-2 p-2.5 bg-white rounded-2xl border border-emerald-200 font-mono text-xs text-slate-900">
                <span className="flex-1 truncate select-all">{recentlyCreatedKey.key}</span>
                <button
                  onClick={() => handleCopy(recentlyCreatedKey.key, "newKey")}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === "newKey" ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === "newKey" ? t("dev.copied", "Copied!") : t("dev.copyFullKey", "Copy Full Key")}</span>
                </button>
              </div>
            </div>
          )}

          {/* Keys Table */}
          <div className="bg-white rounded-3xl border border-slate-150 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{t("dev.activeKeysSection", "ACTIVE KEYS")}</span>
              <span className="text-xs font-bold text-slate-400"><bdi dir="ltr">{filteredApiKeys.length}</bdi> {t("dev.keysLabel", "keys")}</span>
            </div>

            {loadingKeys ? (
              <div className="p-8 text-center text-slate-400 text-xs animate-pulse">{t("dev.loadingApiKeys", "Loading API keys...")}</div>
            ) : filteredApiKeys.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Key size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-700">{t("dev.noApiKeysFound", "No API Keys Found")}</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {t("dev.noApiKeysFoundDesc", "Public GET endpoints do not require an API key, but generating one allows secure backend access.")}
                </p>
                <button
                  onClick={() => setIsNewKeyModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  {t("dev.createYourFirstKey", "Create Your First Key")}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-150">
                {filteredApiKeys.map((k) => (
                  <div key={k.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">{k.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {t("dev.activeBadge", "Active")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                        <span>{k.keyPrefix || `${k.key?.substring(0, 12)}...`}</span>
                        <button
                          onClick={() => handleCopy(k.key || k.keyPrefix, k.id)}
                          className="text-slate-400 hover:text-blue-600 cursor-pointer"
                          title={t("dev.copyKeyToken", "Copy Key Token")}
                        >
                          {copiedKey === k.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                      <span>{t("dev.createdDate", "Created: {date}").replace("{date}", k.createdAt ? new Date(k.createdAt).toLocaleDateString(lang === "ar" ? "ar-DZ" : (lang === "fr" ? "fr-FR" : "en-US")) : t("dev.recentlyCreated", "Recently"))}</span>
                      <button
                        onClick={() => handleDeleteKey(k.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={t("dev.revokeKey", "Revoke Key")}
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

      {/* TAB 4: REST API & PLAYGROUND */}
      {activeTab === "rest_docs" && (
        <div className="space-y-6 animate-fade-in">
          {/* Target Ticket Selector for API */}
          {tickets.length > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-800 block">{t("dev.selectTicketTierForApi", "Select Ticket Tier for API Request")}</span>
                <span className="text-[11px] text-slate-500">{t("dev.selectTicketTierForApiDesc", "Each ticket tier has its own parameters (name, id, and price).")}</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto">
                {tickets.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      selectedTicketId === t.id
                        ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Endpoint selector strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: "register_attendee", method: "POST", path: "/tickets/register", label: t("dev.registerAttendeeEndpoint", "Register Attendee ({tier})").replace("{tier}", currentSelectedTicket?.name || "Direct Ticket") },
              { id: "get_tickets", method: "GET", path: "/tickets", label: t("dev.listActiveTicketsEndpoint", "List Active Tickets") },
              { id: "get_attendees", method: "GET", path: "/attendees", label: t("dev.queryAttendeesEndpoint", "Query Attendees") },
            ].map((ep) => (
              <button
                key={ep.id}
                type="button"
                onClick={() => {
                  setSelectedEndpoint(ep.id);
                  setPlaygroundResponse(null);
                }}
                className={`px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  selectedEndpoint === ep.id
                    ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                    ep.method === "GET" ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"
                  }`}
                >
                  {ep.method}
                </span>
                <span>{ep.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Code Snippets (7 Cols) */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-150 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{t("dev.codeExamplesTitle", "Code Examples")}</h3>
                  <p className="text-xs text-slate-500">{t("dev.codeExamplesSubtitle", "Ready-to-use backend snippets in 13+ languages.")}</p>
                </div>
              </div>

              {/* Language Switcher Strip */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
                {REST_LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setCodeLanguage(l.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      codeLanguage === l.id
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              <div className="relative mt-2">
                <pre dir="ltr" className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-mono text-left overflow-x-auto max-h-80 border border-slate-800 leading-relaxed">
                  {restCodeSnippets[codeLanguage] || restCodeSnippets.curl}
                </pre>
                <button
                  type="button"
                  onClick={() => handleCopy(restCodeSnippets[codeLanguage] || restCodeSnippets.curl, "restCode")}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer backdrop-blur-md"
                >
                  {copiedKey === "restCode" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedKey === "restCode" ? t("dev.copied", "Copied!") : t("dev.copySnippetBtn", "Copy")}</span>
                </button>
              </div>
            </div>

            {/* Right: Live Interactive Runner (5 Cols) */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-150 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{t("dev.apiPlaygroundTitle", "API Playground")}</h3>
                  <p className="text-xs text-slate-500">{t("dev.apiPlaygroundSubtitle", "Execute live requests directly against your event.")}</p>
                </div>
                <button
                  type="button"
                  onClick={handleRunPlaygroundRequest}
                  disabled={playgroundLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Play size={13} />
                  <span>{playgroundLoading ? t("dev.sendingBtn", "Sending...") : t("dev.executeBtn", "Execute")}</span>
                </button>
              </div>

              {/* Editable payload if POST */}
              {selectedEndpoint === "register_attendee" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{t("dev.requestBodyJson", "Request Body (JSON)")}</label>
                  <textarea
                    dir="ltr"
                    rows={6}
                    value={JSON.stringify(playgroundPayload, null, 2)}
                    onChange={(e) => {
                      try {
                        setPlaygroundPayload(JSON.parse(e.target.value));
                      } catch (err) {}
                    }}
                    className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 leading-relaxed"
                  />
                </div>
              )}

              {/* Response Viewer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">{t("dev.responsePayloadLabel", "Response Payload")}</label>
                  {playgroundResponse && (
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <span className={`px-2 py-0.5 rounded-md ${playgroundResponse.status < 300 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        HTTP {playgroundResponse.status}
                      </span>
                      <span className="text-slate-400">{playgroundResponse.durationMs}ms</span>
                    </div>
                  )}
                </div>

                <pre dir="ltr" className="p-3.5 bg-slate-900 text-emerald-400 rounded-2xl text-[11px] font-mono text-left overflow-x-auto max-h-64 border border-slate-800 leading-relaxed">
                  {playgroundLoading ? t("dev.sendingRequestPrompt", "Sending request...") : playgroundResponse ? JSON.stringify(playgroundResponse.data, null, 2) : t("dev.clickExecutePrompt", "// Click 'Execute' to send request")}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: WEBHOOKS */}
      {activeTab === "webhooks" && (
        <div className="space-y-6 animate-fade-in">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-3">
            <Search size={16} className="text-slate-400 shrink-0 ms-1" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("dev.searchWebhooksPlaceholder", "Search webhooks by URL or events...")}
              className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Webhook Test Alert */}
          {webhookTestResult && (
            <div className={`p-4 rounded-2xl border text-xs flex items-start justify-between gap-3 animate-slide-down ${
              webhookTestResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
            }`}>
              <div className="flex items-center gap-2">
                {webhookTestResult.success ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
                <span>{webhookTestResult.message || (webhookTestResult.success ? t("dev.testPingSuccess", "Test ping delivered successfully (HTTP 200 OK)") : t("dev.testPingFailed", "Test ping delivery failed"))}</span>
              </div>
              <button onClick={() => setWebhookTestResult(null)} className="font-bold hover:underline cursor-pointer">
                {t("dev.dismissBtn", "Dismiss")}
              </button>
            </div>
          )}

          {/* Webhooks List */}
          <div className="bg-white rounded-3xl border border-slate-150 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{t("dev.configuredEndpointsSection", "CONFIGURED WEBHOOK ENDPOINTS")}</span>
              <span className="text-xs font-bold text-slate-400"><bdi dir="ltr">{filteredWebhooks.length}</bdi> {t("dev.endpointsLabel", "endpoints")}</span>
            </div>

            {loadingWebhooks ? (
              <div className="p-8 text-center text-slate-400 text-xs animate-pulse">{t("dev.loadingWebhooks", "Loading webhooks...")}</div>
            ) : filteredWebhooks.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Webhook size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-700">{t("dev.noWebhooksConfigured", "No Webhook Endpoints Configured")}</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {t("dev.noWebhooksConfiguredDesc", "Subscribe to live registration and check-in events to sync attendees automatically to your CRM or custom backend.")}
                </p>
                <button
                  onClick={() => setIsNewWebhookModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  {t("dev.addYourFirstWebhook", "Add Your First Webhook")}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-150">
                {filteredWebhooks.map((wh) => (
                  <div key={wh.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 truncate max-w-md">{wh.url}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {t("dev.activeBadge", "Active")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(wh.events || ["registration.created"]).map((ev) => (
                          <span key={ev} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono font-medium">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestWebhook(wh)}
                        disabled={testingWebhookId === wh.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Send size={12} />
                        <span>{testingWebhookId === wh.id ? t("dev.pingingBtn", "Pinging...") : t("dev.testPingBtn", "Test Ping")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteWebhook(wh.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={t("dev.deleteWebhook", "Delete Webhook")}
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

      {/* TAB 6: LIVE INGESTION LOGS */}
      {activeTab === "logs" && (
        <div className="space-y-6 animate-fade-in">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-3">
            <Search size={16} className="text-slate-400 shrink-0 ms-1" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("dev.searchLogsPlaceholder", "Search incoming registrations by name, email, ticket tier, or source...")}
              className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-150 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{t("dev.realtimeRegistrationsSection", "REAL-TIME INGESTED REGISTRATIONS")}</span>
              <span className="text-xs font-bold text-slate-400"><bdi dir="ltr">{filteredRegistrations.length}</bdi> {t("dev.eventsLogged", "events logged")}</span>
            </div>

            {filteredRegistrations.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Activity size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-700">{t("dev.noRegistrationsIngested", "No Registrations Ingested Yet")}</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {t("dev.noRegistrationsIngestedDesc", "When attendees submit tickets via your embedded widget or API calls, their full JSON payloads will appear here in real-time.")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-slate-50 border-b border-slate-150 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="p-4 ps-6 text-start">{t("dev.colAttendee", "Attendee")}</th>
                      <th className="p-4 text-start">{t("dev.colTicketPass", "Ticket Pass")}</th>
                      <th className="p-4 text-start">{t("dev.colOriginSource", "Origin / Source")}</th>
                      <th className="p-4 text-start">{t("dev.colStatus", "Status")}</th>
                      <th className="p-4 text-start">{t("dev.colTimestamp", "Timestamp")}</th>
                      <th className="p-4 pe-6 text-end">{t("dev.colPayload", "Payload")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                    {filteredRegistrations.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4 ps-6 text-start">
                          <div className="font-extrabold text-slate-900">{item.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{item.email}</div>
                        </td>
                        <td className="p-4 font-bold text-blue-600 text-start">{item.ticketType}</td>
                        <td className="p-4 text-start">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {item.source === "Direct Form Embed" ? t("dev.originDirectForm", "Direct Form Embed") : item.source}
                          </span>
                        </td>
                        <td className="p-4 text-start">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              item.status === "registered"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {item.status === "registered" ? t("dev.statusRegistered", "registered") : item.status === "pending" ? t("dev.statusPending", "pending") : item.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 text-[11px] text-start">
                          <bdi dir="ltr">
                            {item.date
                              ? new Date(item.date).toLocaleString(lang === "fr" ? "fr-FR" : "en-US", {
                                  year: "numeric",
                                  month: "numeric",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })
                              : t("dev.recentlyCreated", "Recently")}
                          </bdi>
                        </td>
                        <td className="p-4 pe-6 text-end">
                          <button
                            type="button"
                            onClick={() => setSelectedLogPayload(item.raw)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            {t("dev.inspectJsonBtn", "Inspect JSON")}
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

      {/* ─────────────────────────────────────────────
          5. MODALS
      ───────────────────────────────────────────── */}

      {/* MODAL: CREATE API KEY */}
      {isNewKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                  <Key size={18} />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">{t("dev.modalCreateKeyTitle", "Generate Event API Key")}</h3>
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
                <label className="text-xs font-bold text-slate-700">{t("dev.keyNameLabel", "Key Name / Description")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("dev.keyNamePlaceholder", "e.g. Main Website Ticket Embed")}
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{t("dev.accessPermissionsLabel", "Access Permissions")}</label>
                <SearchableSelect
                  value={newKeyPermissions}
                  onChange={(v) => setNewKeyPermissions(v)}
                  options={[
                    { value: "read_write", label: t("dev.permReadWrite", "Read & Write (Tickets, Registrations, Attendees)") },
                    { value: "read_only", label: t("dev.permReadOnly", "Read-Only (Tickets & Public Schedules)") },
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
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                disabled={!newKeyName.trim()}
                onClick={handleCreateApiKey}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {t("dev.generateTokenBtn", "Generate Token")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD WEBHOOK */}
      {isNewWebhookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                  <Webhook size={18} />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">{t("dev.modalAddWebhookTitle", "Add Webhook Endpoint")}</h3>
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
                <label className="text-xs font-bold text-slate-700">{t("dev.endpointUrlLabel", "Endpoint URL (HTTPS)")}</label>
                <input
                  type="url"
                  required
                  placeholder={t("dev.endpointUrlPlaceholder", "https://api.yourdomain.com/webhooks/eventzone")}
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">{t("dev.triggerEventsLabel", "Trigger Events")}</label>
                <div className="space-y-2">
                  {[
                    { id: "registration.created", label: t("dev.eventRegCreated", "registration.created (Approved & Instant)") },
                    { id: "registration.pending", label: t("dev.eventRegPending", "registration.pending (Requires Review)") },
                    { id: "attendee.checked_in", label: t("dev.eventAttendeeCheckedIn", "attendee.checked_in (On-site Scan)") },
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
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                disabled={!newWebhookUrl.trim()}
                onClick={handleCreateWebhook}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {t("dev.registerWebhookBtn", "Register Webhook")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT RAW JSON PAYLOAD */}
      {selectedLogPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b pb-3 border-slate-150">
              <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900">
                <FileCode2 size={18} className="text-blue-600" />
                <span>{t("dev.modalRawPayloadTitle", "Raw Attendee Ingestion Payload")}</span>
              </div>
              <button
                onClick={() => setSelectedLogPayload(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <pre dir="ltr" className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-[11px] font-mono text-left overflow-x-auto max-h-96 border border-slate-800 leading-relaxed">
              {JSON.stringify(selectedLogPayload, null, 2)}
            </pre>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLogPayload(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {t("common.close", "Close")}
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
