// packages/api/src/hooks/business/useBusiness.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as businessApi from "@mixtape/api/clients/business/businessApi";
import type { FixItemStatus, SupplyRequestStatus } from "@mixtape/api/clients/business/businessApi";

const businessKeys = {
  all: (slug: string) => ["business", slug] as const,
  suppliers: (slug: string) => ["business", slug, "suppliers"] as const,
  supplyRequests: (slug: string, status?: SupplyRequestStatus) =>
    ["business", slug, "supply-requests", status ?? "all"] as const,
  fixItems: (slug: string, status?: FixItemStatus | "all") =>
    ["business", slug, "fix-items", status ?? "open"] as const,
};

export function useSuppliers(groupSlug: string | null) {
  return useQuery({
    queryKey: businessKeys.suppliers(groupSlug ?? ""),
    queryFn: () => businessApi.fetchSuppliers(groupSlug!),
    enabled: !!groupSlug,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSupplyRequests(
  groupSlug: string | null,
  statusFilter?: SupplyRequestStatus,
) {
  return useQuery({
    queryKey: businessKeys.supplyRequests(groupSlug ?? "", statusFilter),
    queryFn: () => businessApi.fetchSupplyRequests(groupSlug!, statusFilter),
    enabled: !!groupSlug,
    staleTime: 60 * 1000,
  });
}

export function useFixItems(
  groupSlug: string | null,
  statusFilter?: FixItemStatus | "all",
) {
  return useQuery({
    queryKey: businessKeys.fixItems(groupSlug ?? "", statusFilter),
    queryFn: () => businessApi.fetchFixItems(groupSlug!, statusFilter),
    enabled: !!groupSlug,
    staleTime: 60 * 1000,
  });
}

export function useUpdateSupplyRequest(groupSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      status,
    }: {
      requestId: string;
      status: SupplyRequestStatus;
    }) => businessApi.updateSupplyRequest(groupSlug, requestId, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: businessKeys.supplyRequests(groupSlug) });
    },
  });
}

export function useUpdateFixItem(groupSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      fixItemId,
      status,
    }: {
      fixItemId: string;
      status: FixItemStatus;
    }) => businessApi.updateFixItem(groupSlug, fixItemId, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: businessKeys.fixItems(groupSlug) });
    },
  });
}
