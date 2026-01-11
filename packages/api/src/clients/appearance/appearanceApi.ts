// src/clients/appearance/appearanceApi.ts

import { axiosInstance } from "../../lib/axiosInstance";
import type { ThemeDefinition } from "@mixtape/core";

export interface GroupThemeSettingsResponse {
  group_id: string;
  group_slug: string;
  hidden_theme_ids: string[];
  group_themes: ThemeDefinition[];
}

export interface UpdateGroupThemeSettingsPayload {
  hidden_theme_ids?: string[];
  group_themes?: ThemeDefinition[];
}

export async function fetchGroupThemeSettings(groupSlug: string): Promise<GroupThemeSettingsResponse> {
  const response = await axiosInstance.get<GroupThemeSettingsResponse>(
    `/api/appearance/groups/${groupSlug}/themes`
  );
  return response.data;
}

export async function updateGroupThemeSettings(
  groupSlug: string,
  payload: UpdateGroupThemeSettingsPayload
): Promise<GroupThemeSettingsResponse> {
  const response = await axiosInstance.patch<GroupThemeSettingsResponse>(
    `/api/appearance/groups/${groupSlug}/themes`,
    payload
  );
  return response.data;
}
