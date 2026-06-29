// packages/core/src/crypto/primitives.ts
//
// Thin WebCrypto wrapper for Livewire E2E encryption (ADR-0046 Phase C).
// All callers work through this module — nothing outside here touches WebCrypto
// or CryptoKey objects directly, keeping the implementation swappable.
//
// Protocol: ECIES — ephemeral ECDH P-256 + HKDF-SHA256 + AES-GCM 256.
// Each key bundle is independently wrapped with a fresh ephemeral key pair;
// the creator's identity is not exposed to recipients.

export const E2E_PREFIX = "e2e:";

// ─── Key generation ──────────────────────────────────────────────────────────

export async function generateDeviceKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    false, // private key stays non-extractable
    ["deriveBits"]
  ) as Promise<CryptoKeyPair>;
}

export async function generateConversationKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // must be extractable to wrap for distribution
    ["encrypt", "decrypt"]
  );
}

// ─── Key serialization ───────────────────────────────────────────────────────

export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey("jwk", publicKey);
  return JSON.stringify(jwk);
}

export async function importPublicKey(jwkString: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    JSON.parse(jwkString) as JsonWebKey,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [] // ECDH public keys carry no usages
  );
}

// ─── Key wrapping (ECIES) ────────────────────────────────────────────────────

export interface WrappedKey {
  encryptedKey: string;       // base64 AES-GCM ciphertext of raw conversation key
  nonce: string;              // base64 AES-GCM IV
  ephemeralPublicKey: string; // JWK of the ephemeral ECDH key — recipient needs this to unwrap
}

export async function wrapKeyForDevice(
  recipientPublicKey: CryptoKey,
  conversationKey: CryptoKey
): Promise<WrappedKey> {
  // Fresh ephemeral ECDH pair — used once, never stored
  const ephemeral = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true, // public key must be extractable to include in bundle
    ["deriveBits"]
  ) as CryptoKeyPair;

  const wrappingKey = await _deriveWrappingKey(ephemeral.privateKey, recipientPublicKey, "encrypt");

  const rawConvKey = await crypto.subtle.exportKey("raw", conversationKey);
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const encryptedKeyBytes = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    wrappingKey,
    rawConvKey
  );

  return {
    encryptedKey: _toBase64(encryptedKeyBytes),
    nonce: _toBase64(nonce),
    ephemeralPublicKey: await exportPublicKey(ephemeral.publicKey),
  };
}

export async function unwrapConversationKey(
  recipientPrivateKey: CryptoKey,
  ephemeralPublicKeyJwk: string,
  encryptedKey: string,
  nonce: string
): Promise<CryptoKey> {
  const ephemeralPublicKey = await importPublicKey(ephemeralPublicKeyJwk);
  const unwrappingKey = await _deriveWrappingKey(recipientPrivateKey, ephemeralPublicKey, "decrypt");

  const rawConvKey = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: _fromBase64(nonce) },
    unwrappingKey,
    _fromBase64(encryptedKey)
  );

  return crypto.subtle.importKey(
    "raw",
    rawConvKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// ─── Message encryption ───────────────────────────────────────────────────────
//
// Format: "e2e:<version>:<iv_b64>:<ciphertext_b64>" — the server stores this
// opaque string. <version> is the ConversationKeyBundle.key_version that
// encrypted it (LW-C4), so a client can pick the right key after a rotation.
// Legacy messages with no version segment ("e2e:<iv>:<ciphertext>") predate
// LW-C4 and are always version 1.

export async function encryptMessage(
  key: CryptoKey,
  plaintext: string,
  version: number = 1
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return `${E2E_PREFIX}${version}:${_toBase64(iv)}:${_toBase64(ciphertext)}`;
}

// Returns the key_version that encrypted an e2e: message, or 1 for legacy
// (pre-LW-C4) messages and non-E2E text alike. Callers use this to resolve
// the matching key before calling decryptMessage.
export function parseE2EVersion(encoded: string): number {
  if (!encoded.startsWith(E2E_PREFIX)) return 1;
  const parts = encoded.slice(E2E_PREFIX.length).split(":");
  if (parts.length === 3) {
    const version = parseInt(parts[0], 10);
    return Number.isFinite(version) ? version : 1;
  }
  return 1; // legacy "e2e:<iv>:<ciphertext>" format
}

// Returns plaintext. If the value is not E2E-prefixed, returns it unchanged
// (Standard conversation or server-side encrypted — caller handles appropriately).
// `key` must already be the version returned by parseE2EVersion(encoded).
export async function decryptMessage(key: CryptoKey, encoded: string): Promise<string> {
  if (!encoded.startsWith(E2E_PREFIX)) return encoded;
  const parts = encoded.slice(E2E_PREFIX.length).split(":");
  let ivB64: string;
  let ciphertextB64: string;
  if (parts.length === 3) {
    [, ivB64, ciphertextB64] = parts;
  } else if (parts.length === 2) {
    [ivB64, ciphertextB64] = parts; // legacy, pre-LW-C4
  } else {
    throw new Error("Malformed E2E message");
  }
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: _fromBase64(ivB64) },
    key,
    _fromBase64(ciphertextB64)
  );
  return new TextDecoder().decode(plaintext);
}

// ─── Attachment (blob) encryption ────────────────────────────────────────────
//
// Same AES-GCM 256 conversation key as message text, applied to raw binary
// data (e.g. voice recordings). The IV travels alongside the ciphertext blob
// as a separate field — unlike encryptMessage, it can't be prefixed onto the
// payload without corrupting the binary container the server stores it as.

export interface EncryptedBlob {
  ciphertext: Blob;
  iv: string; // base64
}

export async function encryptBlob(key: CryptoKey, blob: Blob): Promise<EncryptedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plainBytes = await blob.arrayBuffer();
  const cipherBytes = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plainBytes);
  return {
    ciphertext: new Blob([cipherBytes], { type: "application/octet-stream" }),
    iv: _toBase64(iv),
  };
}

export async function decryptBlob(key: CryptoKey, ciphertext: Blob, iv: string): Promise<Blob> {
  const cipherBytes = await ciphertext.arrayBuffer();
  const plainBytes = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: _fromBase64(iv) },
    key,
    cipherBytes
  );
  return new Blob([plainBytes]);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function _deriveWrappingKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  usage: "encrypt" | "decrypt"
): Promise<CryptoKey> {
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: publicKey },
    privateKey,
    256
  );
  const hkdfKey = await crypto.subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(16),
      info: new TextEncoder().encode("livewire-conv-key-v1"),
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    [usage]
  );
}

function _toBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  // F-004 (LW-D3): spread operator hits V8's ~65k argument limit for large buffers.
  // Chunked loop handles voice blobs up to MAX_VOICE_BYTES (10 MB) without throwing.
  let binary = "";
  const chunkSize = 32768;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function _fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>;
}
