"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toggleAttendeeCheckin, upsertAttendee, permanentDeleteAttendee, archiveAttendee, broadcastRealtimeChange } from "./db";
import { safeLocalStorageGet, safeLocalStorageSet } from "./supabase";

const QUEUE_PREFIX = "eventzone_offline_queue_";
const LISTENERS = new Set();

/**
 * Notify all active useOfflineSync hooks across the app when the queue changes
 */
function notifyQueueListeners(eventId) {
  LISTENERS.forEach((listener) => {
    try {
      listener(eventId);
    } catch (e) {
      console.warn("Queue listener error:", e);
    }
  });
}

/**
 * Retrieve current offline queue for a specific event from localStorage
 */
export function getOfflineQueue(eventId) {
  if (typeof window === "undefined" || !eventId) return [];
  try {
    const raw = localStorage.getItem(`${QUEUE_PREFIX}${eventId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Failed to read offline queue from localStorage:", e);
    return [];
  }
}

/**
 * Save offline queue for a specific event to localStorage
 */
export function saveOfflineQueue(eventId, queue) {
  if (typeof window === "undefined" || !eventId) return;
  try {
    localStorage.setItem(`${QUEUE_PREFIX}${eventId}`, JSON.stringify(queue));
    notifyQueueListeners(eventId);
  } catch (e) {
    console.warn("Failed to write offline queue to localStorage:", e);
  }
}

/**
 * Append an action to the offline FIFO queue
 */
export function enqueueOfflineAction(eventId, action) {
  if (!eventId || !action) return null;
  const currentQueue = getOfflineQueue(eventId);
  const targetEventId = eventId;

  const newAction = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventId: targetEventId,
    type: action.type, // 'checkin' | 'add_attendee' | 'bulk_checkin'
    payload: {
      ...(action.payload || {}),
      eventId: targetEventId,
      event_id: targetEventId,
    },
    attendeeId: action.attendeeId || action.payload?.id || null,
    timestamp: Date.now(),
    status: "pending",
    retryCount: 0,
  };

  // If this is an add_attendee action and an attendee with the same ID or email is already queued,
  // update the existing queue item's payload to avoid duplicate creations
  if (action.type === "add_attendee" && newAction.payload) {
    const existingIndex = currentQueue.findIndex(
      (item) => item.type === "add_attendee" && (
        (newAction.attendeeId && item.attendeeId === newAction.attendeeId) ||
        (item.payload?.email && newAction.payload?.email && item.payload.email.toLowerCase() === newAction.payload.email.toLowerCase())
      )
    );
    if (existingIndex !== -1) {
      currentQueue[existingIndex] = {
        ...currentQueue[existingIndex],
        payload: {
          ...currentQueue[existingIndex].payload,
          ...newAction.payload,
        },
        timestamp: Date.now(),
      };
      saveOfflineQueue(eventId, currentQueue);
      return currentQueue[existingIndex];
    }
  }

  // If this is a check-in toggle for an attendee who already has a pending check-in in the queue,
  // update the existing queue item's target state to avoid duplicate redundant network calls
  if (action.type === "checkin" && newAction.attendeeId) {
    // Also synchronize checkin status into any pending add_attendee action in the queue
    const pendingAddIdx = currentQueue.findIndex(
      (item) => item.type === "add_attendee" && (item.attendeeId === newAction.attendeeId || item.payload?.id === newAction.attendeeId)
    );
    if (pendingAddIdx !== -1) {
      currentQueue[pendingAddIdx].payload = {
        ...currentQueue[pendingAddIdx].payload,
        checkedIn: Boolean(action.payload?.checkedIn),
        checked_in: Boolean(action.payload?.checkedIn),
        status: action.payload?.checkedIn ? "checked_in" : "registered",
        checkedInAt: action.payload?.checkedIn ? (action.payload?.checkedInAt || new Date().toISOString()) : null,
      };
    }

    const existingIndex = currentQueue.findIndex(
      (item) => item.type === "checkin" && item.attendeeId === newAction.attendeeId
    );
    if (existingIndex !== -1) {
      currentQueue[existingIndex] = {
        ...currentQueue[existingIndex],
        payload: {
          ...currentQueue[existingIndex].payload,
          ...action.payload,
        },
        timestamp: Date.now(),
      };
      saveOfflineQueue(eventId, currentQueue);
      return currentQueue[existingIndex];
    }
  }

  const updatedQueue = [...currentQueue, newAction];
  saveOfflineQueue(eventId, updatedQueue);
  return newAction;
}

/**
 * Remove a completed action from the queue
 */
export function removeOfflineAction(eventId, actionId) {
  if (!eventId || !actionId) return;
  const currentQueue = getOfflineQueue(eventId);
  const updatedQueue = currentQueue.filter((item) => item.id !== actionId);
  saveOfflineQueue(eventId, updatedQueue);
}

/**
 * Quick ping to test actual internet connectivity (avoiding captive portal false-positives)
 */
export async function checkNetworkConnectivity() {
  if (typeof window === "undefined") return true;
  if (!navigator.onLine) return false;

  try {
    // Fast lightweight heartbeat request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch("/api/checkin/passcode", {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);
    return res !== null;
  } catch {
    return false;
  }
}

// Concurrency lock to prevent multiple simultaneous sync workers
const SYNC_IN_PROGRESS = new Map();

/**
 * Process pending queue in strict FIFO chronological order
 */
export async function processOfflineQueue(eventId, onProgress) {
  if (!eventId) return { success: true, processed: 0, remaining: 0 };
  if (SYNC_IN_PROGRESS.get(eventId)) {
    let waitCount = 0;
    while (SYNC_IN_PROGRESS.get(eventId) && waitCount < 10) {
      await new Promise((r) => setTimeout(r, 400));
      waitCount++;
    }
    return { success: true, inProgress: true, remaining: getOfflineQueue(eventId).length };
  }

  const isOnline = await checkNetworkConnectivity();
  if (!isOnline) {
    return { success: false, offline: true, remaining: getOfflineQueue(eventId).length };
  }

  SYNC_IN_PROGRESS.set(eventId, true);
  const queue = getOfflineQueue(eventId);
  let processedCount = 0;

  try {
    for (let i = 0; i < queue.length; i++) {
      const action = queue[i];
      if (!action || action.status === "completed") continue;

      try {
        if (action.type === "checkin") {
          const targetAttId = action.payload?.attendeeId || action.attendeeId;
          const isChecked = action.payload?.checkedIn;
          const res = await toggleAttendeeCheckin({
            eventId: action.eventId || eventId,
            attendeeId: targetAttId,
            checkedIn: isChecked,
            checkedInBy: action.payload?.checkedInBy || "Offline Queue Sync",
          });
          if (res && res.success === false) {
            throw new Error(res.error || "toggleAttendeeCheckin failed");
          }
          if (typeof window !== "undefined" && targetAttId) {
            try {
              const targetEvId = action.eventId || eventId;
              const cacheKey = `eventzone_cache_attendees_${targetEvId}`;
              const raw = localStorage.getItem(cacheKey);
              if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                  const idx = list.findIndex(a => a.id === targetAttId || a.badgeCode === targetAttId || a.badge_code === targetAttId);
                  if (idx !== -1) {
                    list[idx] = {
                      ...list[idx],
                      checkedIn: Boolean(isChecked),
                      checked_in: Boolean(isChecked),
                      status: isChecked ? "checked_in" : "registered",
                      checkedInAt: isChecked ? (action.payload?.checkedInAt || new Date().toISOString()) : null
                    };
                    localStorage.setItem(cacheKey, JSON.stringify(list));
                  }
                }
              }
            } catch (cErr) {
              console.warn("Cache update after checkin error:", cErr);
            }
          }
        } else if (action.type === "add_attendee") {
          const savedAttendee = await upsertAttendee(action.payload, action.eventId || eventId);
          if (savedAttendee?._syncFailed) {
            throw new Error(savedAttendee._error || "Database upsert failed for add_attendee");
          }
          // Server accepted attendee! Update local cache immediately
          if (typeof window !== "undefined" && savedAttendee) {
            try {
              const targetEvId = action.eventId || eventId;
              const cacheKey = `eventzone_cache_attendees_${targetEvId}`;
              const raw = localStorage.getItem(cacheKey);
              if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                  const targetOldId = action.attendeeId || action.payload?.id;
                  const idx = list.findIndex((a) =>
                    a.id === targetOldId ||
                    a.id === savedAttendee.id ||
                    (a.email && savedAttendee.email && a.email.toLowerCase() === savedAttendee.email.toLowerCase())
                  );
                  if (idx !== -1) {
                    list[idx] = { ...list[idx], ...savedAttendee, _syncFailed: false };
                  } else {
                    list.unshift(savedAttendee);
                  }
                  localStorage.setItem(cacheKey, JSON.stringify(list));
                }
              }
            } catch (cacheErr) {
              console.warn("Failed to update cache after add_attendee sync:", cacheErr);
            }
          }
        } else if (action.type === "bulk_checkin") {
          const attendeeIds = action.payload?.attendeeIds || [];
          const isChecked = action.payload?.checkedIn;
          for (const attId of attendeeIds) {
            const res = await toggleAttendeeCheckin({
              eventId: action.eventId || eventId,
              attendeeId: attId,
              checkedIn: isChecked,
              checkedInBy: action.payload?.checkedInBy || "Offline Queue Sync",
            });
            if (res && res.success === false) {
              throw new Error(res.error || `bulk toggleAttendeeCheckin failed for ${attId}`);
            }
          }
          if (typeof window !== "undefined" && attendeeIds.length > 0) {
            try {
              const targetEvId = action.eventId || eventId;
              const cacheKey = `eventzone_cache_attendees_${targetEvId}`;
              const raw = localStorage.getItem(cacheKey);
              if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                  const idSet = new Set(attendeeIds);
                  const updatedList = list.map(a => {
                    if (idSet.has(a.id) || idSet.has(a.badgeCode) || idSet.has(a.badge_code)) {
                      return {
                        ...a,
                        checkedIn: Boolean(isChecked),
                        checked_in: Boolean(isChecked),
                        status: isChecked ? "checked_in" : "registered",
                        checkedInAt: isChecked ? (action.payload?.checkedInAt || new Date().toISOString()) : null
                      };
                    }
                    return a;
                  });
                  localStorage.setItem(cacheKey, JSON.stringify(updatedList));
                }
              }
            } catch (cErr) {
              console.warn("Cache update after bulk_checkin error:", cErr);
            }
          }
        } else if (action.type === "delete_attendee") {
          const targetAttId = action.attendeeId || action.payload?.id;
          const targetEmail = action.payload?.email;
          const targetEvId = action.eventId || eventId;
          await permanentDeleteAttendee(targetAttId, targetEmail, targetEvId);
          if (typeof window !== "undefined") {
            try {
              const cacheKey = `eventzone_cache_attendees_${targetEvId}`;
              const raw = localStorage.getItem(cacheKey);
              if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                  const filtered = list.filter(a => a.id !== targetAttId && (!targetEmail || !a.email || a.email.toLowerCase() !== targetEmail.toLowerCase()));
                  localStorage.setItem(cacheKey, JSON.stringify(filtered));
                }
              }
            } catch (cErr) {
              console.warn("Cache update after delete_attendee error:", cErr);
            }
          }
        } else if (action.type === "archive_attendee") {
          const targetAttId = action.attendeeId || action.payload?.id;
          const targetEmail = action.payload?.email;
          const targetEvId = action.eventId || eventId;
          await archiveAttendee(targetAttId, targetEmail, targetEvId);
          if (typeof window !== "undefined") {
            try {
              const cacheKey = `eventzone_cache_attendees_${targetEvId}`;
              const raw = localStorage.getItem(cacheKey);
              if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                  const updated = list.map(a => {
                    if (a.id === targetAttId || (targetEmail && a.email && a.email.toLowerCase() === targetEmail.toLowerCase())) {
                      return { ...a, status: "archived", status_participation: "archived", isArchived: true };
                    }
                    return a;
                  });
                  localStorage.setItem(cacheKey, JSON.stringify(updated));
                }
              }
            } catch (cErr) {
              console.warn("Cache update after archive_attendee error:", cErr);
            }
          }
        }

        // Successfully synced -> remove from queue
        removeOfflineAction(eventId, action.id);
        const actionEvId = action.eventId || action.payload?.eventId || action.payload?.event_id;
        if (actionEvId && actionEvId !== eventId) {
          removeOfflineAction(actionEvId, action.id);
        }
        processedCount++;
        if (onProgress) onProgress(processedCount, queue.length);
      } catch (actionErr) {
        console.warn(`Offline action ${action.id} (${action.type}) sync failed:`, actionErr);
        // If network connectivity dropped mid-queue, pause execution and wait for next reconnect
        const stillConnected = await checkNetworkConnectivity();
        if (!stillConnected) {
          break;
        }
      }
    }
  } finally {
    SYNC_IN_PROGRESS.delete(eventId);
  }

  const remaining = getOfflineQueue(eventId).length;
  notifyQueueListeners(eventId);
  if (processedCount > 0) {
    try {
      broadcastRealtimeChange('ATTENDEES_SYNCED', { eventId, processed: processedCount }, eventId);
    } catch (bErr) {
      console.warn("Broadcast ATTENDEES_SYNCED error:", bErr);
    }
  }
  return { success: true, processed: processedCount, remaining };
}

/**
 * Process all offline queues across all events found in localStorage
 */
export async function processAllOfflineQueues(onProgress) {
  if (typeof window === "undefined") return { success: true, processed: 0 };
  const isOnline = await checkNetworkConnectivity();
  if (!isOnline) return { success: false, offline: true, processed: 0 };

  const eventIds = new Set();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(QUEUE_PREFIX)) {
        const eid = key.slice(QUEUE_PREFIX.length);
        if (eid) eventIds.add(eid);
      }
    }
  } catch (e) {
    console.warn("Failed to enumerate offline queues:", e);
  }

  let totalProcessed = 0;
  for (const eid of eventIds) {
    try {
      const res = await processOfflineQueue(eid, onProgress);
      if (res && res.processed) {
        totalProcessed += res.processed;
      }
    } catch (err) {
      console.warn(`Failed to process offline queue for ${eid}:`, err);
    }
  }
  return { success: true, processed: totalProcessed };
}

/**
 * Primary React hook for managing offline mode and auto-sync on the Attendees Dashboard
 */
export function useOfflineSync(eventId) {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });
  const [syncState, setSyncState] = useState("online"); // 'online' | 'offline' | 'syncing'
  const [queue, setQueue] = useState(() => getOfflineQueue(eventId));
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Sync ref to prevent state-stale closures
  const isSyncingRef = useRef(false);

  // Load and refresh queue state
  const refreshQueue = useCallback(() => {
    if (!eventId) return;
    const current = getOfflineQueue(eventId);
    setQueue(current);
  }, [eventId]);

  // Execute queue sync
  const syncNow = useCallback(async () => {
    if (!eventId || isSyncingRef.current) return;
    const currentQueue = getOfflineQueue(eventId);
    if (currentQueue.length === 0) {
      setSyncState(isOnline ? "online" : "offline");
      return;
    }

    isSyncingRef.current = true;
    setSyncState("syncing");

    try {
      const res = await processOfflineQueue(eventId);
      if (res.offline) {
        setIsOnline(false);
        setSyncState("offline");
      } else {
        setIsOnline(true);
        setSyncState(res.remaining > 0 ? "offline" : "online");
        setLastSyncTime(new Date());
      }
    } catch (e) {
      console.warn("syncNow error:", e);
      setSyncState("offline");
    } finally {
      isSyncingRef.current = false;
      refreshQueue();
    }
  }, [eventId, isOnline, refreshQueue]);

  // Register listener for cross-component queue updates
  useEffect(() => {
    refreshQueue();

    const listener = (targetEventId) => {
      if (targetEventId === eventId) {
        refreshQueue();
      }
    };
    LISTENERS.add(listener);
    return () => LISTENERS.delete(listener);
  }, [eventId, refreshQueue]);

  // Network online/offline event listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = async () => {
      const verified = await checkNetworkConnectivity();
      setIsOnline(verified);
      if (verified) {
        // Automatically push all offline queues as soon as internet returns
        processAllOfflineQueues().finally(() => {
          syncNow();
        });
      } else {
        setSyncState("offline");
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncState("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial connectivity verification
    checkNetworkConnectivity().then((online) => {
      setIsOnline(online);
      if (online) {
        processAllOfflineQueues().finally(() => {
          if (getOfflineQueue(eventId).length > 0) {
            syncNow();
          } else {
            setSyncState("online");
          }
        });
      } else {
        setSyncState("offline");
      }
    });

    // Periodic heartbeat loop (every 25 seconds) to catch silent connection changes or process queued items
    const interval = setInterval(async () => {
      const currentQueue = getOfflineQueue(eventId);
      if (currentQueue.length > 0 && !isSyncingRef.current) {
        const verified = await checkNetworkConnectivity();
        setIsOnline(verified);
        if (verified) {
          processAllOfflineQueues().finally(() => {
            syncNow();
          });
        }
      }
    }, 25000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [eventId, syncNow]);

  // Set of attendee IDs that currently have pending unsynced operations
  const pendingAttendeeIds = useMemo(() => {
    const set = new Set();
    queue.forEach((item) => {
      if (item.attendeeId) set.add(item.attendeeId);
      if (item.type === "bulk_checkin" && Array.isArray(item.payload?.attendeeIds)) {
        item.payload.attendeeIds.forEach((id) => set.add(id));
      }
    });
    return set;
  }, [queue]);

  // Helper to queue check-in action
  const queueCheckin = useCallback(
    (attendeeId, checkedIn, checkedInBy = "Organizer Console") => {
      if (!eventId || !attendeeId) return;
      enqueueOfflineAction(eventId, {
        type: "checkin",
        attendeeId,
        payload: { attendeeId, checkedIn, checkedInBy },
      });

      // Attempt immediate background sync if online
      if (navigator.onLine && !isSyncingRef.current) {
        syncNow();
      }
    },
    [eventId, syncNow]
  );

  // Helper to queue bulk check-in action
  const queueBulkCheckin = useCallback(
    (attendeeIds, checkedIn, checkedInBy = "Organizer Console") => {
      if (!eventId || !Array.isArray(attendeeIds) || attendeeIds.length === 0) return;
      enqueueOfflineAction(eventId, {
        type: "bulk_checkin",
        payload: { attendeeIds, checkedIn, checkedInBy },
      });

      if (navigator.onLine && !isSyncingRef.current) {
        syncNow();
      }
    },
    [eventId, syncNow]
  );

  // Helper to queue add attendee action
  const queueAddAttendee = useCallback(
    (attendeeData) => {
      if (!eventId || !attendeeData) return;
      enqueueOfflineAction(eventId, {
        type: "add_attendee",
        attendeeId: attendeeData.id,
        payload: attendeeData,
      });

      if (navigator.onLine && !isSyncingRef.current) {
        syncNow();
      }
    },
    [eventId, syncNow]
  );

  // Helper to queue delete attendee action
  const queueDeleteAttendee = useCallback(
    (attendeeId, email = null) => {
      if (!eventId || !attendeeId) return;
      enqueueOfflineAction(eventId, {
        type: "delete_attendee",
        attendeeId,
        payload: { id: attendeeId, email },
      });

      if (navigator.onLine && !isSyncingRef.current) {
        syncNow();
      }
    },
    [eventId, syncNow]
  );

  // Helper to queue archive attendee action
  const queueArchiveAttendee = useCallback(
    (attendeeId, email = null) => {
      if (!eventId || !attendeeId) return;
      enqueueOfflineAction(eventId, {
        type: "archive_attendee",
        attendeeId,
        payload: { id: attendeeId, email },
      });

      if (navigator.onLine && !isSyncingRef.current) {
        syncNow();
      }
    },
    [eventId, syncNow]
  );

  return {
    isOnline,
    syncState: isSyncingRef.current ? "syncing" : queue.length > 0 && !isOnline ? "offline" : queue.length > 0 ? "syncing" : "online",
    queue,
    pendingCount: queue.length,
    pendingAttendeeIds,
    lastSyncTime,
    syncNow,
    queueCheckin,
    queueBulkCheckin,
    queueAddAttendee,
    queueDeleteAttendee,
    queueArchiveAttendee,
  };
}
