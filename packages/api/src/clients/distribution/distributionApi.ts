// packages/api/src/clients/distribution/distributionApi.ts

import { axiosInstance } from '@mixtape/api/lib/axiosInstance'

export interface DistributionSource {
  id: string
  kind: string
  label: string
  tier_required: string
  config_schema: Record<string, unknown>
}

export interface SourceConfig {
  source_id: string
  config: Record<string, unknown>
}

export interface ShareRecordResult {
  source_id: string
  source_kind: string
  source_label: string
  status: 'success' | 'failed' | 'skipped'
  canonical_url: string
  channel_response: Record<string, unknown>
  failure_reason: string
}

export interface DistributeResponse {
  event_id: string
  status: string
  results: ShareRecordResult[]
}

export async function fetchDistributionSources(groupSlug?: string): Promise<DistributionSource[]> {
  const params = groupSlug ? { group: groupSlug } : {}
  const res = await axiosInstance.get('/api/distribution/sources', { params })
  return res.data.results ?? res.data
}

export async function distributePiece(
  pieceId: string,
  sources_config: SourceConfig[],
  scheduled_at?: string | null,
): Promise<DistributeResponse> {
  const res = await axiosInstance.post(`/api/distribution/pieces/${pieceId}/distribute`, {
    sources_config,
    ...(scheduled_at ? { scheduled_at } : {}),
  })
  return res.data
}

export async function cancelPublishEvent(
  pieceId: string,
  eventId: string,
): Promise<void> {
  await axiosInstance.delete(`/api/distribution/pieces/${pieceId}/publish-events/${eventId}`)
}

export async function fetchDistributionHistory(pieceId: string) {
  const res = await axiosInstance.get(`/api/distribution/pieces/${pieceId}/distribution-history`)
  return res.data
}
