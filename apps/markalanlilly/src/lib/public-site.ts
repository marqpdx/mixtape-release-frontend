import {
  fetchPublicMemberProfile,
  fetchPublicSiteWriting,
  fetchPublicSiteWritingPiece,
  type PublicMemberProfile,
  type PublicSiteWritingParams,
  type PublicSiteWritingResponse,
  type PublicWritingPiece,
} from "@mixtape/api/clients/public/publicApi";

import { siteConfig } from "@/site.config";

type LoadResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export async function loadCatalog(
  filters: Omit<PublicSiteWritingParams, "owner" | "groups"> = {}
): Promise<LoadResult<PublicSiteWritingResponse>> {
  try {
    const data = await fetchPublicSiteWriting({
      owner: siteConfig.owner,
      groups: [...siteConfig.groups],
      limit: 100,
      ...filters,
    });
    return { data, error: null };
  } catch {
    return {
      data: null,
      error: "The writing catalog is unavailable right now. Please try again shortly.",
    };
  }
}

export async function loadProfile(): Promise<LoadResult<PublicMemberProfile>> {
  try {
    return {
      data: await fetchPublicMemberProfile(siteConfig.owner),
      error: null,
    };
  } catch {
    return {
      data: null,
      error: "The profile is unavailable right now. Please try again shortly.",
    };
  }
}

export async function loadWritingPiece(
  pieceId: string
): Promise<LoadResult<PublicWritingPiece>> {
  try {
    return {
      data: await fetchPublicSiteWritingPiece(pieceId, {
        owner: siteConfig.owner,
        groups: [...siteConfig.groups],
      }),
      error: null,
    };
  } catch {
    return {
      data: null,
      error: "This piece could not be found or is not publicly available.",
    };
  }
}

export function formatPublishedDate(value: string | null, compact = false) {
  if (!value) return "Undated";
  return new Intl.DateTimeFormat("en-US", {
    day: compact ? "2-digit" : "numeric",
    month: compact ? "short" : "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
