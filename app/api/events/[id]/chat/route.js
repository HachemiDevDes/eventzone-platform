import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/apiAuth";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Global in-memory cache to ensure instant intra-process consistency
if (!global._eventzoneChatStore) {
  global._eventzoneChatStore = new Map();
}
if (!global._eventzoneChatLastSync) {
  global._eventzoneChatLastSync = new Map();
}

function getEventMessages(eventId) {
  if (!global._eventzoneChatStore.has(eventId)) {
    global._eventzoneChatStore.set(eventId, []);
  }
  return global._eventzoneChatStore.get(eventId);
}

function setEventMessages(eventId, list) {
  global._eventzoneChatStore.set(eventId, list);
}

function cleanEmail(e) {
  return String(e || "").trim().toLowerCase();
}

function isValidUuid(str) {
  if (!str || typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
}

function toValidUuid(val, fallbackSeed = "") {
  if (val && typeof val === "string") {
    const trimmed = val.trim();
    if (isValidUuid(trimmed)) {
      return trimmed.toLowerCase();
    }
  }
  const input = String(val || fallbackSeed || crypto.randomUUID()).toLowerCase().trim();
  const hash = crypto.createHash("sha256").update(input).digest("hex");
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
}

async function resolveEventUuid(supabase, eventParam) {
  if (!eventParam) return null;
  if (isValidUuid(eventParam)) return eventParam;
  try {
    const { data } = await supabase
      .from("events")
      .select("id")
      .or(`slug.eq.${eventParam},id.eq.${eventParam}`)
      .maybeSingle();
    if (data?.id && isValidUuid(data.id)) return data.id;
  } catch (e) {}
  return null;
}

async function checkIsConnected(supabase, eventId, eventUuid, email1, email2) {
  const e1 = cleanEmail(email1);
  const e2 = cleanEmail(email2);
  if (!e1 || !e2) return false;

  // 1. Check in-memory store across both eventId and eventUuid
  if (global._eventzoneConnectionsStore) {
    const list1 = global._eventzoneConnectionsStore.get(eventId) || [];
    const list2 = eventUuid && eventUuid !== eventId ? (global._eventzoneConnectionsStore.get(eventUuid) || []) : [];
    const combined = [...list1, ...list2];
    const found = combined.some((c) => {
      const isAcc = c.status === "accepted" || c.status === "connected";
      const s = cleanEmail(c.sender_email);
      const r = cleanEmail(c.recipient_email);
      return isAcc && ((s === e1 && r === e2) || (s === e2 && r === e1));
    });
    if (found) return true;
  }

  // 2. Query Supabase database connections
  try {
    let query = supabase.from("connections").select("*");
    if (eventUuid) {
      query = query.eq("event_id", eventUuid);
    }
    const { data: dbData, error } = await query;
    if (!error && Array.isArray(dbData)) {
      for (const row of dbData) {
        let meta = {};
        if (row.notes && row.notes.startsWith("{")) {
          try { meta = JSON.parse(row.notes); } catch (e) {}
        }
        const rawStatus = (row.status || row.pipeline_stage || meta.status || "").toLowerCase();
        const isAcc = rawStatus === "accepted" || rawStatus === "connected";
        if (!isAcc) continue;

        const sEmail = cleanEmail(meta.sender_email || (Array.isArray(row.tags) && row.tags[0]) || (row.source === "incoming" ? row.email : ""));
        const rEmail = cleanEmail(meta.recipient_email || (Array.isArray(row.tags) && row.tags[1]) || row.email || "");

        if ((sEmail === e1 && rEmail === e2) || (sEmail === e2 && rEmail === e1)) {
          return true;
        }
      }
    }
  } catch (err) {
    console.warn("checkIsConnected Supabase check error:", err);
  }

  return false;
}

export async function GET(request, { params }) {
  const { id: eventId } = await params;
  const { searchParams } = new URL(request.url);
  const email = cleanEmail(searchParams.get("email"));
  const userId = searchParams.get("userId") || "";

  if (!email && !userId) {
    return NextResponse.json(
      { messages: [] },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" } }
    );
  }

  const memoryList = getEventMessages(eventId);
  const allMessagesMap = new Map();
  const supabase = getServiceSupabase();
  const eventUuid = await resolveEventUuid(supabase, eventId);

  // 1. Sync from Supabase messages database (Throttled to 15s to eliminate redundant database egress)
  const lastSync = global._eventzoneChatLastSync?.get(eventId);
  const shouldSyncDb = !lastSync || Date.now() - lastSync > 15000 || memoryList.length === 0;

  if (shouldSyncDb) {
    try {
      let query = supabase.from("messages").select("id, event_id, sender_id, recipient_id, content, created_at, is_read").order("created_at", { ascending: true });
      if (eventUuid) {
        query = query.or(`event_id.eq.${eventUuid},event_id.is.null`);
      }
      const { data: dbData, error } = await query;
      if (!error && Array.isArray(dbData)) {
        global._eventzoneChatLastSync?.set(eventId, Date.now());
        dbData.forEach((row) => {
          let meta = {};
          if (row.content && row.content.startsWith("{") && row.content.includes('"content":')) {
            try { meta = JSON.parse(row.content); } catch (e) {}
          }

          const item = {
            id: row.id,
            event_id: row.event_id || eventUuid || eventId,
            sender_id: row.sender_id || meta.sender_id || null,
            sender_email: cleanEmail(meta.sender_email || ""),
            sender_name: meta.sender_name || "Delegate",
            sender_avatar: meta.sender_avatar || "",
            recipient_id: row.recipient_id || meta.recipient_id || null,
            recipient_email: cleanEmail(meta.recipient_email || ""),
            recipient_name: meta.recipient_name || "Delegate",
            recipient_avatar: meta.recipient_avatar || "",
            content: meta.content || row.content || "",
            created_at: row.created_at || new Date().toISOString(),
            is_read: row.is_read || false,
          };

          allMessagesMap.set(row.id, item);
        });
      }
    } catch (err) {
      console.warn("Error syncing messages from Supabase:", err);
    }
  }

  // 2. Merge memory messages (authoritative database rows take precedence)
  memoryList.forEach((m) => {
    if (!allMessagesMap.has(m.id)) {
      allMessagesMap.set(m.id, m);
    } else {
      const fromDb = allMessagesMap.get(m.id);
      allMessagesMap.set(m.id, { ...m, ...fromDb });
    }
  });

  const combinedList = Array.from(allMessagesMap.values());
  setEventMessages(eventId, combinedList);

  // 3. Filter messages relevant to this user
  const userMessages = combinedList.filter((m) => {
    const sEmail = cleanEmail(m.sender_email);
    const rEmail = cleanEmail(m.recipient_email);
    const sId = String(m.sender_id || "");
    const rId = String(m.recipient_id || "");

    return (
      (email && (sEmail === email || rEmail === email)) ||
      (userId && (sId === userId || rId === userId))
    );
  });

  return NextResponse.json(
    { messages: userMessages },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" } }
  );
}

export async function POST(request, { params }) {
  const { id: eventId } = await params;

  try {
    const body = await request.json();
    const { sender, recipient, content } = body;

    if (!sender?.email || !recipient?.email || !content?.trim()) {
      return NextResponse.json(
        { error: "Sender, recipient, and message content are required." },
        { status: 400 }
      );
    }

    const senderEmail = cleanEmail(sender.email);
    const recipientEmail = cleanEmail(recipient.email);
    const supabase = getServiceSupabase();
    const eventUuid = await resolveEventUuid(supabase, eventId);

    // =========================================================================
    // STRICT CONNECTION VERIFICATION GUARD:
    // Only delegates with an accepted connection can send 1-on-1 messages!
    // =========================================================================
    const isConnected = await checkIsConnected(supabase, eventId, eventUuid, senderEmail, recipientEmail);
    if (!isConnected) {
      return NextResponse.json(
        {
          error: "You can only message delegates you are connected with. Please send an invitation to connect first.",
          notConnected: true,
        },
        { status: 403 }
      );
    }

    const msgId = crypto.randomUUID();
    const senderUuid = toValidUuid(sender.id, senderEmail);
    const recipientUuid = toValidUuid(recipient.id, recipientEmail);

    const newMsg = {
      id: msgId,
      event_id: eventUuid || eventId,
      sender_id: senderUuid,
      sender_email: senderEmail,
      sender_name: sender.name || sender.fullName || "Delegate",
      sender_avatar: sender.avatar || sender.image || "",
      recipient_id: recipientUuid,
      recipient_email: recipientEmail,
      recipient_name: recipient.name || recipient.fullName || "Delegate",
      recipient_avatar: recipient.avatar || recipient.image || "",
      content: content.trim(),
      created_at: new Date().toISOString(),
      is_read: false,
    };

    const memoryList = getEventMessages(eventId);
    memoryList.push(newMsg);
    setEventMessages(eventId, memoryList);

    // Persist to Supabase database (with UUIDs for Postgres)
    try {
      const { error: insertErr } = await supabase.from("messages").insert({
        id: msgId,
        event_id: eventUuid || null,
        sender_id: senderUuid,
        recipient_id: recipientUuid,
        content: JSON.stringify(newMsg),
        created_at: newMsg.created_at,
        is_read: false,
      });

      if (insertErr) {
        console.error("Supabase messages insert error:", insertErr);
      }
    } catch (e) {
      console.error("Supabase messages insert exception:", e);
    }

    global._eventzoneChatLastSync?.delete(eventId);

    return NextResponse.json(
      { success: true, message: newMsg },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
