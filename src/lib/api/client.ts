/**
 * PaaS Datastore Client
 *
 * Wraps the platform's Document Store API (/api/v1/db/{slug})
 * and SSE subscription endpoint for real-time updates.
 */

const PAAS_KEY = process.env.NEXT_PUBLIC_PAAS_KEY || "";
const PAAS_SLUG = process.env.NEXT_PUBLIC_PAAS_SLUG || "pyramid-ninja";

// Use same-origin proxy paths through the injector sidecar (/__rouic-db/)
// This avoids CORS issues and keeps API calls first-party.
// Falls back to the full platform URL for SSR or if proxy isn't available.
const isBrowser = typeof window !== "undefined";
const DB_URL = isBrowser
  ? `/__rouic-db/${PAAS_SLUG}`
  : `${process.env.NEXT_PUBLIC_PAAS_URL || "https://system.rouic.com"}/api/v1/db/${PAAS_SLUG}`;
const SUBSCRIBE_URL = isBrowser
  ? `/__rouic-db/${PAAS_SLUG}/subscribe`
  : `${process.env.NEXT_PUBLIC_PAAS_URL || "https://system.rouic.com"}/api/v1/db/${PAAS_SLUG}/subscribe`;

export interface ChangeEvent {
  type: "set" | "delete";
  collection: string;
  id: string;
  data?: Record<string, unknown>;
}

async function dbRequest(action: string, body: Record<string, unknown> = {}) {
  const res = await fetch(DB_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": PAAS_KEY,
    },
    body: JSON.stringify({ action, ...body }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `DB request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Document Operations ────────────────────────────────────────

export async function getDoc(
  collection: string,
  id: string
): Promise<Record<string, unknown> | null> {
  try {
    const res = await dbRequest("get", { collection, id });
    return res.data ?? null;
  } catch {
    return null;
  }
}

export async function setDoc(
  collection: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  await dbRequest("set", { collection, id, data });
}

export async function updateDoc(
  collection: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  await dbRequest("update", { collection, id, data });
}

export async function deleteDoc(
  collection: string,
  id: string
): Promise<void> {
  await dbRequest("delete", { collection, id });
}

export async function queryDocs(
  collection: string,
  where?: Record<string, unknown>
): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const res = await dbRequest("query", { collection, where });
  return res.documents ?? [];
}

export async function batchWrite(
  operations: Array<{
    type: "set" | "delete";
    collection: string;
    id: string;
    data?: Record<string, unknown>;
  }>
): Promise<void> {
  await dbRequest("batch", { operations });
}

// ─── Read-Modify-Write (for nested updates) ─────────────────────

/**
 * Atomic-ish read-modify-write. Fetches the current document,
 * applies a transform function, and writes the result back.
 * Used instead of dot-notation nested updates.
 */
export async function modifyDoc(
  collection: string,
  id: string,
  transform: (
    current: Record<string, unknown>
  ) => Record<string, unknown>
): Promise<void> {
  const current = (await getDoc(collection, id)) || {};
  const updated = transform(current);
  await setDoc(collection, id, updated);
}

// ─── Real-Time Subscriptions (SSE) ──────────────────────────────

/**
 * Subscribe to all changes in a collection via SSE.
 * Returns an unsubscribe function.
 */
export function subscribe(
  collection: string,
  callback: (event: ChangeEvent) => void
): () => void {
  const url = `${SUBSCRIBE_URL}?collection=${encodeURIComponent(collection)}&key=${encodeURIComponent(PAAS_KEY)}`;

  let es: EventSource | null = null;
  let closed = false;

  const connect = () => {
    if (closed) return;
    es = new EventSource(url);

    es.addEventListener("change", (e) => {
      try {
        const data = JSON.parse(e.data) as ChangeEvent;
        callback(data);
      } catch {
        // ignore parse errors
      }
    });

    es.addEventListener("connected", () => {
      console.log(`[paas] SSE connected: ${collection}`);
    });

    es.onerror = () => {
      // EventSource auto-reconnects, but log it
      console.warn(`[paas] SSE error on ${collection}, reconnecting...`);
    };
  };

  connect();

  return () => {
    closed = true;
    es?.close();
  };
}

/**
 * Subscribe to a specific document by ID within a collection.
 * Filters SSE events client-side.
 */
export function subscribeDoc(
  collection: string,
  docId: string,
  callback: (data: Record<string, unknown> | null) => void
): () => void {
  return subscribe(collection, (event) => {
    if (event.id === docId) {
      if (event.type === "delete") {
        callback(null);
      } else {
        callback((event.data as Record<string, unknown>) ?? null);
      }
    }
  });
}

/**
 * Subscribe to documents matching a prefix (for flattened sub-collections).
 * E.g., subscribe to all players in a game: subscribePrefix("players", "ABCDEF_", cb)
 */
export function subscribePrefix(
  collection: string,
  prefix: string,
  callback: (event: ChangeEvent) => void
): () => void {
  return subscribe(collection, (event) => {
    if (event.id.startsWith(prefix)) {
      callback(event);
    }
  });
}
