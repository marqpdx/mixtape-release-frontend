// src/hooks/useEntityImageUpload.ts

/**
 * @deprecated Use `useImageUpload` from `@hooks/useAssets` instead.
 *
 * This is a backward-compatibility wrapper around the new sponsor-agnostic assets API.
 * It will be removed in a future version.
 *
 * Migration example:
 * ```ts
 * // Old (deprecated)
 * const { handleImageChange, pending } = useEntityImageUpload('group', groupId, setValue);
 *
 * // New
 * import { useImageUpload } from '@hooks/useAssets';
 * const { handleImageChange, pending } = useImageUpload({
 *   sponsorType: 'group',
 *   sponsorId: groupId,
 *   setValue
 * });
 * ```
 */

import { UseFormSetValue, FieldValues } from "react-hook-form";
import { useImageUpload } from "./useAssets";
import type { SponsorType } from "@mixtape/api/clients/assets/assetsApi";

export function useEntityImageUpload<TFormData extends FieldValues = FieldValues>(
  entityType: "user" | "group",
  entityId: string,
  setValue: UseFormSetValue<TFormData>
) {
  // Map old entity types to new sponsor types
  const sponsorType: SponsorType = entityType === 'user' ? 'member' : 'group';

  // Delegate to the new hook
  return useImageUpload({
    sponsorType,
    sponsorId: entityId,
    setValue,
  });
}
