import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/apiAuth";

// Global in-memory cache to ensure cross-browser real-time consistency
if (!global._eventzoneConnectionsStore) {
  global._eventzoneConnectionsStore = new Map();
}

function getEventConnections(eventId) {
  if (!global._eventzoneConnectionsStore.has(eventId)) {
    global._eventzoneConnectionsStore.set(eventId, []);
  }
  return global._eventzoneConnectionsStore.get(eventId);
}

function setEventConnections(eventId, list) {
  global._eventzoneConnectionsStore.set(eventId, list);
}

function cleanEmail(e) {
  return String(e || "").trim().toLowerCase();
}

export async function GET(request, { params }) {
  const { id: eventId } = await params;
  const { searchParams } = new URL(request.url);
  const email = cleanEmail(searchParams.get("email"));
  const userId = searchParams.get("userId") || "";

  if (!email && !userId) {
    return NextResponse.json({ connections: [], pendingSent: [], pendingReceived: [] });
  }

  const memoryList = getEventConnections(eventId);

  // Sync with Supabase connections table if available
  try {
    const supabase = getServiceSupabase();
    const { data: dbData, error } = await supabase
      .from("connections")
      .select("*")
      .eq("event_id", eventId);

    if (!error && Array.isArray(dbData)) {
      dbData.forEach((row) => {
        let meta = {};
        if (row.notes && row.notes.startsWith("{")) {
          try { meta = JSON.parse(row.notes); } catch (e) {}
        }
        const existingIdx = memoryList.findIndex((m) => m.id === row.id);
        const item = {
          id: row.id,
          event_id: eventId,
          sender_id: meta.sender_id || row.user_id || null,
          sender_email: cleanEmail(meta.sender_email || (row.source === "incoming" ? row.email : "")),
          sender_name: meta.sender_name || row.name || "Delegate",
          sender_avatar: meta.sender_avatar || row.avatar_url || "",
          sender_company: meta.sender_company || row.company || "",
          sender_title: meta.sender_title || row.title || "",
          recipient_id: meta.recipient_id || row.connected_user_id || null,
          recipient_email: cleanEmail(meta.recipient_email || row.email || ""),
          recipient_name: meta.recipient_name || row.name || "Delegate",
          recipient_avatar: meta.recipient_avatar || row.avatar_url || "",
          recipient_company: meta.recipient_company || row.company || "",
          recipient_title: meta.recipient_title || row.title || "",
          status: meta.status || row.pipeline_stage || "accepted",
          notes: meta.notes || (row.notes && !row.notes.startsWith("{") ? row.notes : ""),
          created_at: row.created_at || new Date().toISOString(),
          updated_at: meta.updated_at || row.created_at || new Date().toISOString(),
        };

        if (existingIdx >= 0) {
          memoryList[existingIdx] = { ...item, ...memoryList[existingIdx] };
        } else {
          memoryList.push(item);
        }
      });
      setEventConnections(eventId, memoryList);
    }
  } catch (err) {
    // Non-fatal, use memory store
  }

  // Filter relevant records for this user
  const relevant = memoryList.filter((item) => {
    const sEmail = cleanEmail(item.sender_email);
    const rEmail = cleanEmail(item.recipient_email);
    const sId = String(item.sender_id || "");
    const rId = String(item.recipient_id || "");

    return (
      (email && (sEmail === email || rEmail === email)) ||
      (userId && (sId === userId || rId === userId))
    );
  });

  const connections = [];
  const pendingSent = [];
  const pendingReceived = [];

  relevant.forEach((item) => {
    const isSender = (email && cleanEmail(item.sender_email) === email) || (userId && String(item.sender_id) === userId);

    if (item.status === "accepted") {
      // Format the partner's profile
      connections.push({
        id: item.id,
        connectionId: item.id,
        status: "accepted",
        email: isSender ? item.recipient_email : item.sender_email,
        name: isSender ? item.recipient_name : item.sender_name,
        avatar: isSender ? item.recipient_avatar : item.sender_avatar,
        company: isSender ? item.recipient_company : item.sender_company,
        jobTitle: isSender ? item.recipient_title : item.sender_title,
        notes: item.notes,
        created_at: item.created_at,
        partnerId: isSender ? item.recipient_id : item.sender_id,
      });
    } else if (item.status === "pending") {
      if (isSender) {
        pendingSent.push(item);
      } else {
        pendingReceived.push(item);
      }
    }
  });

  return NextResponse.json({
    connections,
    pendingSent,
    pendingReceived,
  });
}

export async function POST(request, { params }) {
  const { id: eventId } = await params;

  try {
    const body = await request.json();
    const { action, sender, recipient, connectionId, notes } = body;
    const memoryList = getEventConnections(eventId);

    if (action === "send") {
      if (!sender?.email || !recipient?.email) {
        return NextResponse.json({ error: "Sender and recipient required." }, { status: 400 });
      }

      const senderEmail = cleanEmail(sender.email);
      const recipientEmail = cleanEmail(recipient.email);

      // Check if already exists in either direction
      const existing = memoryList.find(
        (m) =>
          (cleanEmail(m.sender_email) === senderEmail && cleanEmail(m.recipient_email) === recipientEmail) ||
          (cleanEmail(m.sender_email) === recipientEmail && cleanEmail(m.recipient_email) === senderEmail)
      );

      if (existing) {
        if (existing.status === "declined") {
          // Re-open request
          existing.status = "pending";
          existing.sender_email = senderEmail;
          existing.recipient_email = recipientEmail;
          existing.notes = notes || "";
          existing.updated_at = new Date().toISOString();
        }
        return NextResponse.json({ success: true, connection: existing });
      }

      const newId = `conn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newRecord = {
        id: newId,
        event_id: eventId,
        sender_id: sender.id || null,
        sender_email: senderEmail,
        sender_name: sender.name || sender.fullName || "Delegate",
        sender_avatar: sender.avatar || sender.image || "",
        sender_company: sender.company || sender.companyName || "",
        sender_title: sender.jobTitle || sender.title || "",
        recipient_id: recipient.id || null,
        recipient_email: recipientEmail,
        recipient_name: recipient.name || recipient.fullName || "Delegate",
        recipient_avatar: recipient.avatar || recipient.image || "",
        recipient_company: recipient.company || recipient.companyName || "",
        recipient_title: recipient.jobTitle || recipient.title || "",
        status: "pending",
        notes: notes || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      memoryList.push(newRecord);
      setEventConnections(eventId, memoryList);

      // Persist to Supabase if available
      try {
        const supabase = getServiceSupabase();
        await supabase.from("connections").upsert({
          id: newId,
          user_id: sender.id || null,
          connected_user_id: recipient.id || null,
          event_id: eventId,
          name: recipient.name || "Delegate",
          email: recipientEmail,
          company: recipient.company || "",
          title: recipient.jobTitle || "",
          avatar_url: recipient.avatar || "",
          pipeline_stage: "pending",
          notes: JSON.stringify(newRecord),
          created_at: newRecord.created_at,
        });
      } catch (e) {}

      return NextResponse.json({ success: true, connection: newRecord });
    }

    if (action === "accept") {
      let record = memoryList.find((m) => m.id === connectionId);
      if (!record) {
        try {
          const supabase = getServiceSupabase();
          const { data: dbData } = await supabase.from("connections").select("*").eq("id", connectionId).maybeSingle();
          if (dbData) {
            let meta = {};
            if (dbData.notes && dbData.notes.startsWith("{")) {
              try { meta = JSON.parse(dbData.notes); } catch (e) {}
            }
            record = {
              id: dbData.id,
              event_id: eventId,
              sender_id: meta.sender_id || dbData.user_id || null,
              sender_email: cleanEmail(meta.sender_email || (dbData.source === "incoming" ? dbData.email : "")),
              sender_name: meta.sender_name || dbData.name || "Delegate",
              sender_avatar: meta.sender_avatar || dbData.avatar_url || "",
              sender_company: meta.sender_company || dbData.company || "",
              sender_title: meta.sender_title || dbData.title || "",
              recipient_id: meta.recipient_id || dbData.connected_user_id || null,
              recipient_email: cleanEmail(meta.recipient_email || dbData.email || ""),
              recipient_name: meta.recipient_name || dbData.name || "Delegate",
              recipient_avatar: meta.recipient_avatar || dbData.avatar_url || "",
              recipient_company: meta.recipient_company || dbData.company || "",
              recipient_title: meta.recipient_title || dbData.title || "",
              status: "pending",
              notes: meta.notes || "",
              created_at: dbData.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            memoryList.push(record);
          }
        } catch (e) {}
      }

      if (!record) {
        return NextResponse.json({ error: "Connection request not found." }, { status: 404 });
      }

      record.status = "accepted";
      record.updated_at = new Date().toISOString();
      setEventConnections(eventId, memoryList);

      // Persist to Supabase
      try {
        const supabase = getServiceSupabase();
        await supabase
          .from("connections")
          .update({
            pipeline_stage: "accepted",
            notes: JSON.stringify(record),
          })
          .eq("id", connectionId);
      } catch (e) {}

      return NextResponse.json({ success: true, connection: record });
    }

    if (action === "decline") {
      let record = memoryList.find((m) => m.id === connectionId);
      if (!record) {
        try {
          const supabase = getServiceSupabase();
          const { data: dbData } = await supabase.from("connections").select("*").eq("id", connectionId).maybeSingle();
          if (dbData) {
            let meta = {};
            if (dbData.notes && dbData.notes.startsWith("{")) {
              try { meta = JSON.parse(dbData.notes); } catch (e) {}
            }
            record = {
              id: dbData.id,
              event_id: eventId,
              sender_id: meta.sender_id || dbData.user_id || null,
              sender_email: cleanEmail(meta.sender_email || (dbData.source === "incoming" ? dbData.email : "")),
              sender_name: meta.sender_name || dbData.name || "Delegate",
              sender_avatar: meta.sender_avatar || dbData.avatar_url || "",
              sender_company: meta.sender_company || dbData.company || "",
              sender_title: meta.sender_title || dbData.title || "",
              recipient_id: meta.recipient_id || dbData.connected_user_id || null,
              recipient_email: cleanEmail(meta.recipient_email || dbData.email || ""),
              recipient_name: meta.recipient_name || dbData.name || "Delegate",
              recipient_avatar: meta.recipient_avatar || dbData.avatar_url || "",
              recipient_company: meta.recipient_company || dbData.company || "",
              recipient_title: meta.recipient_title || dbData.title || "",
              status: "pending",
              notes: meta.notes || "",
              created_at: dbData.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            memoryList.push(record);
          }
        } catch (e) {}
      }

      if (!record) {
        return NextResponse.json({ error: "Connection request not found." }, { status: 404 });
      }

      record.status = "declined";
      record.updated_at = new Date().toISOString();
      setEventConnections(eventId, memoryList);

      try {
        const supabase = getServiceSupabase();
        await supabase
          .from("connections")
          .update({
            pipeline_stage: "declined",
            notes: JSON.stringify(record),
          })
          .eq("id", connectionId);
      } catch (e) {}

      return NextResponse.json({ success: true, connection: record });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Connections API error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
