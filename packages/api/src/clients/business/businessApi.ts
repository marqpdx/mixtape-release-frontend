// packages/api/src/clients/business/businessApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

// ============================================================================
// Types
// ============================================================================

export interface Supplier {
  id: string;
  name: string;
  contact_info: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type SupplyRequestStatus = "pending" | "ordered" | "received";

export interface SupplyRequest {
  id: string;
  item_name: string;
  quantity_note: string;
  supplier: string | null;
  supplier_name: string | null;
  status: SupplyRequestStatus;
  raw_input: string;
  created_at: string;
  updated_at: string;
}

export type FixItemStatus = "open" | "in_progress" | "resolved";

export interface FixItem {
  id: string;
  title: string;
  description: string;
  status: FixItemStatus;
  raw_input: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// API functions
// ============================================================================

export async function fetchSuppliers(groupSlug: string): Promise<Supplier[]> {
  const res = await axiosInstance.get<Supplier[]>(`/api/business/${groupSlug}/suppliers`);
  return res.data;
}

export async function fetchSupplyRequests(
  groupSlug: string,
  statusFilter?: SupplyRequestStatus,
): Promise<SupplyRequest[]> {
  const params = statusFilter ? { status: statusFilter } : {};
  const res = await axiosInstance.get<SupplyRequest[]>(
    `/api/business/${groupSlug}/supply-requests`,
    { params },
  );
  return res.data;
}

export async function updateSupplyRequest(
  groupSlug: string,
  requestId: string,
  patch: Partial<Pick<SupplyRequest, "status">>,
): Promise<SupplyRequest> {
  const res = await axiosInstance.patch<SupplyRequest>(
    `/api/business/${groupSlug}/supply-requests/${requestId}`,
    patch,
  );
  return res.data;
}

export async function fetchFixItems(
  groupSlug: string,
  statusFilter?: FixItemStatus | "all",
): Promise<FixItem[]> {
  const params = statusFilter ? { status: statusFilter } : {};
  const res = await axiosInstance.get<FixItem[]>(
    `/api/business/${groupSlug}/fix-items`,
    { params },
  );
  return res.data;
}

export async function updateFixItem(
  groupSlug: string,
  fixItemId: string,
  patch: Partial<Pick<FixItem, "status">>,
): Promise<FixItem> {
  const res = await axiosInstance.patch<FixItem>(
    `/api/business/${groupSlug}/fix-items/${fixItemId}`,
    patch,
  );
  return res.data;
}
