// SH-11 publication transport. Shape schemas and shared barrels are unchanged.
import { axiosInstance } from '../../lib/axiosInstance';
import type { ShuttleConfirmIn, ShuttlePacketOut, ShuttleResultOut } from './contract';

export async function buildShuttlePacket(weaveId: string): Promise<ShuttlePacketOut> {
  return (await axiosInstance.post<ShuttlePacketOut>(`/api/shuttle/weaves/${weaveId}/build-packet/`)).data;
}

export async function confirmShuttlePacket(confirmation: ShuttleConfirmIn): Promise<ShuttleResultOut> {
  // Suppress even the shared interceptor's 401 replay for this non-idempotent call.
  // A response loss is an unknown outcome, never permission to send again.
  const config = { timeout: 30000, _retry: true };
  return (await axiosInstance.post<ShuttleResultOut>(
    `/api/shuttle/weaves/${confirmation.action_run_id}/confirm/`, confirmation, config,
  )).data;
}

export async function keepShuttleInNotebook(weaveId: string): Promise<void> {
  await axiosInstance.post(`/api/shuttle/weaves/${weaveId}/keep-in-notebook/`);
}
