import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/apiAuth";

// Global in-memory cache to ensure cross-browser real-time consistency
if (!global._eventzoneChatStore) {
  global._eventzoneChatStore = new Map();
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

async function checkIsConnected(eventId, email1, email2) {
  const e1 = cleanEmail(email1);
  const e2 = cleanEmail(email2);

  // 1. Check in-memory first
  if (global._eventzoneConnectionsStore) {
    const connections = global._eventzoneConnectionsStore.get(eventId) || [];
    const found = connections.some(
      (c) =>
        c.status === "accepted" &&
        ((cleanEmail(c.sender_email) === e1 && cleanEmail(c.recipient_email) === e2) ||
          (cleanEmail(c.sender_email) === e2 && cleanEmail(c.recipient_email) === e1))
    );
    if (found) return true;
  }

  // 2. Query Supabase if not found in memory
  try {
    const supabase = getServiceSupabase();
    const { data: dbData } = await supabase
      .from("connections")
      .select("*")
      .eq("event_id", eventId);

    if (Array.isArray(dbData)) {
      for (const row of dbData) {
        let meta = {};
        if (row.notes && row.notes.startsWith("{")) {
          try { meta = JSON.parse(row.notes); } catch (e) {}
        }
        const status = meta.status || row.pipeline_stage || "accepted";
        if (status !== "accepted") continue;

        const sEmail = cleanEmail(meta.sender_email || (row.source === "incoming" ? row.email : ""));
        const rEmail = cleanEmail(meta.recipient_email || row.email || "");

        if (
          (sEmail === e1 && rEmail === e2) ||
          (sEmail === e2 && rEmail === e1)
        ) {
          return true;
        }
      }
    }
  } catch (err) {}

  return false;
}

export async function GET(request, { params }) {
  const { id: eventId } = await params;
  const { searchParams } = new URL(request.url);
  const email = cleanEmail(searchParams.get("email"));
  const userId = searchParams.get("userId") || "";

  if (!email && !userId) {
    return NextResponse.json({ messages: [] });
  }

  const memoryList = getEventMessages(eventId);

  // Sync with Supabase messages table if available
  try {
    const supabase = getServiceSupabase();
    let query = supabase.from("messages").select("*").eq("event", eventId);
    const { data: dbData, error } = await query;

    if (!error && Array.isArray(dbData)) {
      dbData.forEach((row) => {
        let meta = {};
        if (row.content && row.content.startsWith("{") && row.content.includes('"content":')) {
          try { meta = JSON.parse(row.content); } catch (e) {}
        }
        const existingIdx = memoryList.findIndex((m) => m.id === row.id);
        const item = {
          id: row.id,
          event_id: eventId,
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

        if (existingIdx >= 0) {
          memoryList[existingIdx] = { ...item, ...memoryList[existingIdx] };
        } else {
          memoryList.push(item);
        }
      });
      setEventMessages(eventId, memoryList);
    }
  } catch (err) {
    // Non-fatal, use memory store
  }

  // Filter messages relevant to this user
  const userMessages = memoryList.filter((m) => {
    const sEmail = cleanEmail(m.sender_email);
    const rEmail = cleanEmail(m.recipient_email);
    const sId = String(m.sender_id || "");
    const rId = String(m.recipient_id || "");

    return (
      (email && (sEmail === email || rEmail === email)) ||
      (userId && (sId === userId || rId === userId))
    );
  });

  return NextResponse.json({ messages: userMessages });
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

    // =========================================================================
    // STRICT CONNECTION VERIFICATION GUARD:
    // Only delegates with an accepted connection can send 1-on-1 messages!
    // =========================================================================
    const isConnected = await checkIsConnected(eventId, senderEmail, recipientEmail);
    if (!isConnected) {
      return NextResponse.json(
        {
          error: "You can only message delegates you are connected with. Please send an invitation to connect first.",
          notConnected: true,
        },
        { status: 403 }
      );
    }

    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newMsg = {
      id: msgId,
      event_id: eventId,
      sender_id: sender.id || null,
      sender_email: senderEmail,
      sender_name: sender.name || sender.fullName || "Delegate",
      sender_avatar: sender.avatar || sender.image || "",
      recipient_id: recipient.id || null,
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

    // Persist to Supabase if available
    try {
      const supabase = getServiceSupabase();
      await supabase.from("messages").insert({
        id: msgId,
        sender_id: sender.id && sender.id.length === 36 ? sender.id : null,
        recipient_id: recipient.id && recipient.id.length === 36 ? recipient.id : null,
        content: JSON.stringify(newMsg),
        event: eventId,
        created_at: newMsg.created_at,
        is_read: false,
      });
    } catch (e) {}

    return NextResponse.json({ success: true, message: newMsg });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
