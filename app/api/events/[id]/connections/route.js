import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/apiAuth";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Global in-memory cache to ensure instant intra-process consistency
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

function isValidUuid(str) {
  if (!str || typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
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

export async function GET(request, { params }) {
  const { id: eventId } = await params;
  const { searchParams } = new URL(request.url);
  const email = cleanEmail(searchParams.get("email"));
  const userId = searchParams.get("userId") || "";

  if (!email && !userId) {
    return NextResponse.json(
      { connections: [], pendingSent: [], pendingReceived: [] },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" } }
    );
  }

  const memoryList = getEventConnections(eventId);
  const allRecordsMap = new Map();

  // 1. Sync from Supabase database (central source of truth across all serverless containers)
  try {
    const supabase = getServiceSupabase();
    const eventUuid = await resolveEventUuid(supabase, eventId);

    let query = supabase.from("connections").select("*");
    if (eventUuid) {
      query = query.eq("event_id", eventUuid);
    } else if (email) {
      query = query.or(`email.ilike.${email},notes.ilike.%${email}%`);
    }

    const { data: dbData, error } = await query;

    if (!error && Array.isArray(dbData)) {
      dbData.forEach((row) => {
        let meta = {};
        if (row.notes && row.notes.startsWith("{")) {
          try { meta = JSON.parse(row.notes); } catch (e) {}
        }

        const sEmail = cleanEmail(meta.sender_email || (Array.isArray(row.tags) && row.tags[0]) || (row.source === "incoming" ? row.email : ""));
        const rEmail = cleanEmail(meta.recipient_email || (Array.isArray(row.tags) && row.tags[1]) || row.email || "");
        const sName = meta.sender_name || (row.source === "incoming" ? row.name : "Delegate");
        const rName = meta.recipient_name || row.name || "Delegate";
        const sAvatar = meta.sender_avatar || "";
        const rAvatar = meta.recipient_avatar || row.avatar_url || "";
        const sCompany = meta.sender_company || "";
        const rCompany = meta.recipient_company || row.company || "";
        const sTitle = meta.sender_title || "";
        const rTitle = meta.recipient_title || row.title || "";

        let normalizedStatus = "pending";
        const rawStatus = (row.status || row.pipeline_stage || meta.status || "").toLowerCase();
        if (rawStatus === "accepted" || rawStatus === "connected") {
          normalizedStatus = "accepted";
        } else if (rawStatus === "declined" || rawStatus === "rejected") {
          normalizedStatus = "declined";
        } else {
          normalizedStatus = "pending";
        }

        const item = {
          id: row.id,
          event_id: row.event_id || eventId,
          sender_id: meta.sender_id || row.user_id || null,
          sender_email: sEmail,
          sender_name: sName,
          sender_avatar: sAvatar,
          sender_company: sCompany,
          sender_title: sTitle,
          recipient_id: meta.recipient_id || row.connected_user_id || null,
          recipient_email: rEmail,
          recipient_name: rName,
          recipient_avatar: rAvatar,
          recipient_company: rCompany,
          recipient_title: rTitle,
          status: normalizedStatus,
          notes: meta.notes || (row.notes && !row.notes.startsWith("{") ? row.notes : ""),
          created_at: row.created_at || new Date().toISOString(),
          updated_at: meta.updated_at || row.created_at || new Date().toISOString(),
        };

        allRecordsMap.set(row.id, item);
      });
    }
  } catch (err) {
    console.warn("Error syncing connections from Supabase:", err);
  }

  // 2. Merge any in-memory records (in case database replication is slightly delayed)
  memoryList.forEach((m) => {
    if (!allRecordsMap.has(m.id)) {
      allRecordsMap.set(m.id, m);
    } else {
      // Supabase is authoritative for canonical database status
      const fromDb = allRecordsMap.get(m.id);
      allRecordsMap.set(m.id, { ...m, ...fromDb });
    }
  });

  const combinedList = Array.from(allRecordsMap.values());
  setEventConnections(eventId, combinedList);

  // 3. Filter relevant records for this specific user
  const relevant = combinedList.filter((item) => {
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

  return NextResponse.json(
    { connections, pendingSent, pendingReceived },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" } }
  );
}

export async function POST(request, { params }) {
  const { id: eventId } = await params;

  try {
    const body = await request.json();
    const { action, sender, recipient, connectionId, notes } = body;
    const memoryList = getEventConnections(eventId);
    const supabase = getServiceSupabase();
    const eventUuid = await resolveEventUuid(supabase, eventId);

    if (action === "send") {
      if (!sender?.email || !recipient?.email) {
        return NextResponse.json({ error: "Sender and recipient required." }, { status: 400 });
      }

      const senderEmail = cleanEmail(sender.email);
      const recipientEmail = cleanEmail(recipient.email);

      // Check if already exists in either direction in memory
      let existing = memoryList.find(
        (m) =>
          (cleanEmail(m.sender_email) === senderEmail && cleanEmail(m.recipient_email) === recipientEmail) ||
          (cleanEmail(m.sender_email) === recipientEmail && cleanEmail(m.recipient_email) === senderEmail)
      );

      // Also check in Supabase to avoid duplicates across containers
      if (!existing) {
        try {
          let query = supabase.from("connections").select("*");
          if (eventUuid) query = query.eq("event_id", eventUuid);
          const { data: dbData } = await query;
          if (Array.isArray(dbData)) {
            for (const row of dbData) {
              let meta = {};
              if (row.notes && row.notes.startsWith("{")) {
                try { meta = JSON.parse(row.notes); } catch (e) {}
              }
              const sE = cleanEmail(meta.sender_email || (Array.isArray(row.tags) && row.tags[0]) || (row.source === "incoming" ? row.email : ""));
              const rE = cleanEmail(meta.recipient_email || (Array.isArray(row.tags) && row.tags[1]) || row.email || "");
              if ((sE === senderEmail && rE === recipientEmail) || (sE === recipientEmail && rE === senderEmail)) {
                let normalizedStatus = "pending";
                const rawStatus = (row.status || row.pipeline_stage || meta.status || "").toLowerCase();
                if (rawStatus === "accepted" || rawStatus === "connected") {
                  normalizedStatus = "accepted";
                } else if (rawStatus === "declined" || rawStatus === "rejected") {
                  normalizedStatus = "declined";
                }
                existing = {
                  id: row.id,
                  event_id: row.event_id || eventId,
                  sender_id: meta.sender_id || row.user_id || null,
                  sender_email: sE,
                  sender_name: meta.sender_name || row.name || "Delegate",
                  sender_avatar: meta.sender_avatar || row.avatar_url || "",
                  sender_company: meta.sender_company || row.company || "",
                  sender_title: meta.sender_title || row.title || "",
                  recipient_id: meta.recipient_id || row.connected_user_id || null,
                  recipient_email: rE,
                  recipient_name: meta.recipient_name || row.name || "Delegate",
                  recipient_avatar: meta.recipient_avatar || row.avatar_url || "",
                  recipient_company: meta.recipient_company || row.company || "",
                  recipient_title: meta.recipient_title || row.title || "",
                  status: normalizedStatus,
                  notes: meta.notes || (row.notes && !row.notes.startsWith("{") ? row.notes : ""),
                  created_at: row.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                break;
              }
            }
          }
        } catch (e) {}
      }

      if (existing) {
        if (existing.status === "declined") {
          existing.status = "pending";
          existing.sender_email = senderEmail;
          existing.recipient_email = recipientEmail;
          existing.notes = notes || "";
          existing.updated_at = new Date().toISOString();

          try {
            await supabase
              .from("connections")
              .update({
                status: "pending",
                pipeline_stage: "pending",
                notes: JSON.stringify(existing),
              })
              .eq("id", existing.id);
          } catch (e) {}
        }
        return NextResponse.json(
          { success: true, connection: existing },
          { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
        );
      }

      // Generate a strict, valid UUID v4 for PostgreSQL
      const newId = crypto.randomUUID();
      const newRecord = {
        id: newId,
        event_id: eventUuid || eventId,
        sender_id: isValidUuid(sender.id) ? sender.id : null,
        sender_email: senderEmail,
        sender_name: sender.name || sender.fullName || "Delegate",
        sender_avatar: sender.avatar || sender.image || "",
        sender_company: sender.company || sender.companyName || "",
        sender_title: sender.jobTitle || sender.title || "",
        recipient_id: isValidUuid(recipient.id) ? recipient.id : null,
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

      // Persist to Supabase database (with UUID validation for Postgres)
      try {
        const rowData = {
          id: newId,
          user_id: isValidUuid(sender.id) ? sender.id : null,
          connected_user_id: isValidUuid(recipient.id) ? recipient.id : null,
          event_id: eventUuid || null,
          name: recipient.name || "Delegate",
          email: recipientEmail,
          company: recipient.company || recipient.companyName || "",
          title: recipient.jobTitle || recipient.title || "",
          avatar_url: recipient.avatar || recipient.image || "",
          status: "pending",
          pipeline_stage: "pending",
          source: "attendee_portal",
          tags: [senderEmail, recipientEmail],
          notes: JSON.stringify(newRecord),
          created_at: newRecord.created_at,
        };

        const { error: insertErr } = await supabase.from("connections").insert(rowData);
        if (insertErr) {
          console.error("Supabase connections insert error:", insertErr);
        }
      } catch (e) {
        console.error("Supabase connections insert exception:", e);
      }

      return NextResponse.json(
        { success: true, connection: newRecord },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    if (action === "accept") {
      let record = memoryList.find((m) => m.id === connectionId);

      if (!record) {
        try {
          const { data: dbData } = await supabase.from("connections").select("*").eq("id", connectionId).maybeSingle();
          if (dbData) {
            let meta = {};
            if (dbData.notes && dbData.notes.startsWith("{")) {
              try { meta = JSON.parse(dbData.notes); } catch (e) {}
            }
            record = {
              id: dbData.id,
              event_id: dbData.event_id || eventId,
              sender_id: meta.sender_id || dbData.user_id || null,
              sender_email: cleanEmail(meta.sender_email || (Array.isArray(dbData.tags) && dbData.tags[0]) || (dbData.source === "incoming" ? dbData.email : "")),
              sender_name: meta.sender_name || (dbData.source === "incoming" ? dbData.name : "Delegate"),
              sender_avatar: meta.sender_avatar || dbData.avatar_url || "",
              sender_company: meta.sender_company || dbData.company || "",
              sender_title: meta.sender_title || dbData.title || "",
              recipient_id: meta.recipient_id || dbData.connected_user_id || null,
              recipient_email: cleanEmail(meta.recipient_email || (Array.isArray(dbData.tags) && dbData.tags[1]) || dbData.email || ""),
              recipient_name: meta.recipient_name || dbData.name || "Delegate",
              recipient_avatar: meta.recipient_avatar || dbData.avatar_url || "",
              recipient_company: meta.recipient_company || dbData.company || "",
              recipient_title: meta.recipient_title || dbData.title || "",
              status: "accepted",
              notes: meta.notes || "",
              created_at: dbData.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            memoryList.push(record);
          }
        } catch (e) {}
      }

      if (record) {
        record.status = "accepted";
        record.updated_at = new Date().toISOString();
        setEventConnections(eventId, memoryList);
      }

      // Update in Supabase
      try {
        await supabase
          .from("connections")
          .update({
            pipeline_stage: "accepted",
            status: "accepted",
            notes: record ? JSON.stringify(record) : undefined,
          })
          .eq("id", connectionId);
      } catch (e) {
        console.warn("Supabase accept update error:", e);
      }

      return NextResponse.json(
        { success: true, connection: record || { id: connectionId, status: "accepted" } },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    if (action === "decline") {
      let record = memoryList.find((m) => m.id === connectionId);

      if (!record) {
        try {
          const { data: dbData } = await supabase.from("connections").select("*").eq("id", connectionId).maybeSingle();
          if (dbData) {
            let meta = {};
            if (dbData.notes && dbData.notes.startsWith("{")) {
              try { meta = JSON.parse(dbData.notes); } catch (e) {}
            }
            record = {
              id: dbData.id,
              event_id: dbData.event_id || eventId,
              sender_id: meta.sender_id || dbData.user_id || null,
              sender_email: cleanEmail(meta.sender_email || (Array.isArray(dbData.tags) && dbData.tags[0]) || (dbData.source === "incoming" ? dbData.email : "")),
              sender_name: meta.sender_name || (dbData.source === "incoming" ? dbData.name : "Delegate"),
              sender_avatar: meta.sender_avatar || dbData.avatar_url || "",
              sender_company: meta.sender_company || dbData.company || "",
              sender_title: meta.sender_title || dbData.title || "",
              recipient_id: meta.recipient_id || dbData.connected_user_id || null,
              recipient_email: cleanEmail(meta.recipient_email || (Array.isArray(dbData.tags) && dbData.tags[1]) || dbData.email || ""),
              recipient_name: meta.recipient_name || dbData.name || "Delegate",
              recipient_avatar: meta.recipient_avatar || dbData.avatar_url || "",
              recipient_company: meta.recipient_company || dbData.company || "",
              recipient_title: meta.recipient_title || dbData.title || "",
              status: "declined",
              notes: meta.notes || "",
              created_at: dbData.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            memoryList.push(record);
          }
        } catch (e) {}
      }

      if (record) {
        record.status = "declined";
        record.updated_at = new Date().toISOString();
        setEventConnections(eventId, memoryList);
      }

      try {
        await supabase
          .from("connections")
          .update({
            pipeline_stage: "declined",
            status: "declined",
            notes: record ? JSON.stringify(record) : undefined,
          })
          .eq("id", connectionId);
      } catch (e) {
        console.warn("Supabase decline update error:", e);
      }

      return NextResponse.json(
        { success: true, connection: record || { id: connectionId, status: "declined" } },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Connections API error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
