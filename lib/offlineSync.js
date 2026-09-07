"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toggleAttendeeCheckin, upsertAttendee } from "./db";

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

  const newAction = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventId,
    type: action.type, // 'checkin' | 'add_attendee' | 'bulk_checkin'
    payload: action.payload,
    attendeeId: action.attendeeId || action.payload?.id || null,
    timestamp: Date.now(),
    status: "pending",
    retryCount: 0,
  };

  // If this is a check-in toggle for an attendee who already has a pending check-in in the queue,
  // update the existing queue item's target state to avoid duplicate redundant network calls
  if (action.type === "checkin" && newAction.attendeeId) {
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
    return { success: false, inProgress: true };
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
          const res = await toggleAttendeeCheckin({
            eventId: action.eventId || eventId,
            attendeeId: action.payload?.attendeeId || action.attendeeId,
            checkedIn: action.payload?.checkedIn,
            checkedInBy: action.payload?.checkedInBy || "Offline Queue Sync",
          });
          if (res && res.success === false) {
            throw new Error(res.error || "toggleAttendeeCheckin failed");
          }
        } else if (action.type === "add_attendee") {
          await upsertAttendee(action.payload, action.eventId || eventId);
        } else if (action.type === "bulk_checkin") {
          const attendeeIds = action.payload?.attendeeIds || [];
          for (const attId of attendeeIds) {
            const res = await toggleAttendeeCheckin({
              eventId: action.eventId || eventId,
              attendeeId: attId,
              checkedIn: action.payload?.checkedIn,
              checkedInBy: action.payload?.checkedInBy || "Offline Queue Sync",
            });
            if (res && res.success === false) {
              throw new Error(res.error || `bulk toggleAttendeeCheckin failed for ${attId}`);
            }
          }
        }

        // Successfully synced -> remove from queue
        removeOfflineAction(eventId, action.id);
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
  return { success: true, processed: processedCount, remaining };
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
        // Automatically push queue as soon as internet connectivity returns
        syncNow();
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
      if (online && getOfflineQueue(eventId).length > 0) {
        syncNow();
      } else {
        setSyncState(online ? "online" : "offline");
      }
    });

    // Periodic heartbeat loop (every 25 seconds) to catch silent connection changes or process queued items
    const interval = setInterval(async () => {
      const currentQueue = getOfflineQueue(eventId);
      if (currentQueue.length > 0 && !isSyncingRef.current) {
        const verified = await checkNetworkConnectivity();
        setIsOnline(verified);
        if (verified) {
          syncNow();
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
  };
}
