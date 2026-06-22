// packages/core/src/crypto/keyStore.ts
//
// IndexedDB persistence for Livewire E2E keys (ADR-0046 Phase C).
// The crypto/ module owns serialization — nothing outside reads/writes these stores directly.
//
// DB: "livewire-keys" v1
//   "device-keypair"   — keyed by "v1"; stores CryptoKeyPair (structured-cloneable)
//   "conversation-keys" — keyed by slug; stores { slug, key, version }

const DB_NAME = "livewire-keys";
const DB_VERSION = 1;
const DEVICE_STORE = "device-keypair";
const CONV_STORE = "conversation-keys";
const DEVICE_KEY = "v1";

interface ConvKeyRecord {
  slug: string;
  key: CryptoKey;
  version: number;
}

function _openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DEVICE_STORE)) {
        db.createObjectStore(DEVICE_STORE);
      }
      if (!db.objectStoreNames.contains(CONV_STORE)) {
        db.createObjectStore(CONV_STORE, { keyPath: "slug" });
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

// ─── Conversation keys ────────────────────────────────────────────────────────

export async function storeConversationKey(
  slug: string,
  key: CryptoKey,
  version: number
): Promise<void> {
  const db = await _openDb();
  await _put(db, CONV_STORE, { slug, key, version } satisfies ConvKeyRecord);
}

export async function getConversationKey(
  slug: string
): Promise<{ key: CryptoKey; version: number } | null> {
  const db = await _openDb();
  const record = await _get<ConvKeyRecord>(db, CONV_STORE, slug);
  if (!record) return null;
  return { key: record.key, version: record.version };
}
