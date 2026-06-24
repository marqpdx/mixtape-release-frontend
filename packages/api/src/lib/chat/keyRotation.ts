// packages/api/src/lib/chat/keyRotation.ts
//
// LW-C4 — key rotation. Mints a fresh conversation key and redistributes it
// to every active device with a registered public key, except an optionally
// excluded device (the one being revoked). The server never sees the
// plaintext key — rotation, like initial key distribution, can only happen
// client-side.
//
// This does not provide forward secrecy (Phase D): devices that already
// cached an older key version can still decrypt the history it covers.
// Rotation's payoff is forward-looking — a removed device stops receiving
// new key bundles, so it cannot read anything sent after it lost access.

import { generateConversationKey, importPublicKey, wrapKeyForDevice } from "@mixtape/core/crypto/primitives";
import { storeConversationKeyVersion } from "@mixtape/core/crypto/keyStore";
import type { PostKeyBundleItem, DeviceSession, ParticipantDevice } from "@mixtape/core/types/chatTypes";
import { fetchMyDevices, fetchConversationDevices, postConversationKeyBundles, fetchConversations } from "../../clients/chat/chatApi";

export async function rotateConversationKey(
  slug: string,
  excludeDeviceId?: string
): Promise<{ key: CryptoKey; version: number }> {
  const newKey = await generateConversationKey();

  const [myDevices, otherGroups] = await Promise.all([
    fetchMyDevices(),
    fetchConversationDevices(slug),
  ]);

  const candidates: (DeviceSession | ParticipantDevice)[] = [
    ...myDevices,
    ...otherGroups.flatMap((g) => g.devices),
  ];

  const bundles: PostKeyBundleItem[] = [];
  for (const device of candidates) {
    if (!device.is_active || !device.public_key) continue;
    if (excludeDeviceId && device.device_id === excludeDeviceId) continue;

    const recipientPubKey = await importPublicKey(device.public_key);
    const wrapped = await wrapKeyForDevice(recipientPubKey, newKey);
    bundles.push({
      device_id: device.device_id,
      encrypted_key: wrapped.encryptedKey,
      nonce: wrapped.nonce,
      ephemeral_public_key: wrapped.ephemeralPublicKey,
    });
  }

  if (bundles.length === 0) {
    throw new Error(`No active devices with registered keys to rotate to for conversation ${slug}.`);
  }

  const result = await postConversationKeyBundles(slug, bundles);
  await storeConversationKeyVersion(slug, newKey, result.key_version);
  return { key: newKey, version: result.key_version };
}

// Rotates every Private/Ephemeral conversation the current user participates
// in, excluding one device (used after a self-device revocation so the
// revoked device loses access to anything sent from this point forward).
// Best-effort per conversation — one failure doesn't block the rest.
export async function rotateAllMyConversationKeys(excludeDeviceId: string): Promise<void> {
  const conversations = await fetchConversations();
  const targets = conversations.filter((c) => c.trust_profile !== "standard");

  await Promise.all(
    targets.map((c) =>
      rotateConversationKey(c.slug, excludeDeviceId).catch((err) => {
        console.error(`[E2E] Failed to rotate key for conversation ${c.slug} after device revocation:`, err);
      })
    )
  );
}
