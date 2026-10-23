import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ShuttleResultOut } from '@mixtape/api/clients/shuttle/contract';

// One account-scoped active session, containing identifiers only, never transcripts.
export interface ShuttleSession {
  seedId: string;
  requestId: string;
  weaveId?: string;
  publishAttempted?: boolean;
  result?: ShuttleResultOut;
}
const key = (username: string) => `mixtape.mobile.shuttleSession.${username}`;
export async function readShuttleSession(username: string): Promise<ShuttleSession | null> {
  const raw = await AsyncStorage.getItem(key(username));
  if (!raw) return null;
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || !('seedId' in value) || !('requestId' in value)
    || typeof value.seedId !== 'string' || typeof value.requestId !== 'string') {
    throw new Error('Invalid saved Shuttle session');
  }
  return value as ShuttleSession;
}
export async function saveShuttleSession(username: string, value: ShuttleSession): Promise<void> {
  await AsyncStorage.setItem(key(username), JSON.stringify(value));
}
export async function clearShuttleSession(username: string): Promise<void> {
  await AsyncStorage.removeItem(key(username));
}
