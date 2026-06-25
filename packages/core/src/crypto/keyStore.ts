// packages/core/src/crypto/keyStore.ts
//
// IndexedDB persistence for Livewire E2E keys (ADR-0046 Phase C/LW-C4).
// The crypto/ module owns serialization — nothing outside reads/writes these stores directly.
//
// DB: "livewire-keys" v2
//   "device-keypair"          — keyed by "v1"; stores CryptoKeyPair (structured-cloneable)
//   "conversation-key-versions" — keyed by [slug, version]; stores { slug, version, key }
//
// v1 stored a single "latest" key per slug (no rotation support). v2 keys every
// version a device has ever held, since rotation (LW-C4) means a device may need
// an old key to decrypt history alongside its current one. There is no pruning —
// see livewire-adr-status.md for the accepted growth tradeoff.

const DB_NAME = "livewire-keys";
const DB_VERSION = 2;
const DEVICE_STORE = "device-keypair";
const CONV_VERSIONS_STORE = "conversation-key-versions";
const CONV_VERSIONS_BY_SLUG_INDEX = "by_slug";
const DEVICE_KEY = "v1";

interface ConvKeyVersionRecord {
  slug: string;
  version: number;
  key: CryptoKey;
}

function _openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DEVICE_STORE)) {
        db.createObjectStore(DEVICE_STORE);
      }
      if (db.objectStoreNames.contains("conversation-keys")) {
        // v1 single-key-per-slug store, superseded by CONV_VERSIONS_STORE.
        // Cache only — safe to drop; clients re-fetch + re-cache from the server.
        db.deleteObjectStore("conversation-keys");
      }
      if (!db.objectStoreNames.contains(CONV_VERSIONS_STORE)) {
        const store = db.createObjectStore(CONV_VERSIONS_STORE, { keyPath: ["slug", "version"] });
        store.createIndex(CONV_VERSIONS_BY_SLUG_INDEX, "slug");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function _get<T>(db: IDBDatabase, store: string, key: IDBValidKey): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function _getAllBySlug(db: IDBDatabase, slug: string): Promise<ConvKeyVersionRecord[]> {
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(CONV_VERSIONS_STORE, "readonly")
      .objectStore(CONV_VERSIONS_STORE)
      .index(CONV_VERSIONS_BY_SLUG_INDEX)
      .getAll(slug);
    req.onsuccess = () => resolve((req.result as ConvKeyVersionRecord[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

function _put(db: IDBDatabase, store: string, value: unknown, key?: IDBValidKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = key !== undefined
      ? tx.objectStore(store).put(value, key)
      : tx.objectStore(store).put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── Device key pair ──────────────────────────────────────────────────────────

export async function storeDeviceKeyPair(pair: CryptoKeyPair): Promise<void> {
  const db = await _openDb();
  await _put(db, DEVICE_STORE, pair, DEVICE_KEY);
}

export async function getDeviceKeyPair(): Promise<CryptoKeyPair | null> {
  const db = await _openDb();
  return (await _get<CryptoKeyPair>(db, DEVICE_STORE, DEVICE_KEY)) ?? null;
}

// ─── Conversation keys (versioned, LW-C4) ─────────────────────────────────────

export async function storeConversationKeyVersion(
  slug: string,
  key: CryptoKey,
  version: number
): Promise<void> {
  const db = await _openDb();
  await _put(db, CONV_VERSIONS_STORE, { slug, version, key } satisfies ConvKeyVersionRecord);
}

export async function getConversationKeyVersion(
  slug: string,
  version: number
): Promise<CryptoKey | null> {
  const db = await _openDb();
  const record = await _get<ConvKeyVersionRecord>(db, CONV_VERSIONS_STORE, [slug, version]);
  return record?.key ?? null;
}

// Returns the highest-numbered cached version for a conversation, or null if
// nothing has been cached yet (caller should fetch from the server).
export async function getLatestCachedConversationKey(
  slug: string
): Promise<{ key: CryptoKey; version: number } | null> {
  const db = await _openDb();
  const records = await _getAllBySlug(db, slug);
  if (records.length === 0) return null;
  const latest = records.reduce((a, b) => (b.version > a.version ? b : a));
  return { key: latest.key, version: latest.version };
}

// LW-D2: removes a specific [slug, version] entry from the cache. Called when
// conversation_my_key?version=N returns 404 for an Ephemeral conversation,
// meaning the server has pruned that bundle and it will never be recoverable.
export async function evictConversationKeyVersion(
  slug: string,
  version: number
): Promise<void> {
  const db = await _openDb();
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(CONV_VERSIONS_STORE, "readwrite")
      .objectStore(CONV_VERSIONS_STORE)
      .delete([slug, version]);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Back-compat aliases for the pre-LW-C4 single-key API — both now operate on
// the latest cached version. Existing callers (e.g. conversation creation)
// keep working unchanged.
export const storeConversationKey = storeConversationKeyVersion;
export const getConversationKey = getLatestCachedConversationKey;
