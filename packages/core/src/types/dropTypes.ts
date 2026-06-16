// packages/core/src/types/dropTypes.ts

export type DropWeight = 'pinned' | 'standard' | 'social';

export interface Drop {
  id: string;
  handle: string;
  content: string;
  weight: DropWeight;
  created_by_username: string | null;
  created_at: string;
  expires_at: string | null;
  is_archived: boolean;
  event_date: string | null;
  related_handle: string | null;
  almanac_event_id: string | null;
}

export interface DropCreateData {
  handle: string;
  content: string;
  weight?: DropWeight;
  event_date?: string | null;
  related_handle?: string;
  almanac_event_id?: string | null;
  expires_at?: string | null;
}
