// src/hooks/useAssets.ts

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { UseFormSetValue, FieldValues, Path } from "react-hook-form";
import { toaster } from "@mixtape/core/lib/toaster";
import { uploadImage, SponsorType, ImageRole } from "@mixtape/api/clients/assets/assetsApi";

type ImageType = "profile" | "background";

const IMAGE_TYPE_TO_ROLE_MAP: Record<ImageType, ImageRole> = {
  profile: "profile_image",
  background: "background_image",
};

export interface UseImageUploadOptions<TFormData extends FieldValues = FieldValues> {
  sponsorType: SponsorType;
  sponsorId: string;
  setValue: UseFormSetValue<TFormData>;
}

/**
 * Hook for uploading images using the sponsor-agnostic assets API.
 *
 * @example
 * ```tsx
 * const { handleImageChange, pending } = useImageUpload({
 *   sponsorType: 'group',
 *   sponsorId: group.id,
 *   setValue: form.setValue
 * });
 *
 * <ImageUploadField
 *   imageType="profile"
 *   doHandleImageChange={handleImageChange}
 *   pending={pending.profile}
 *   {...form}
 * />
 * ```
 */
export function useImageUpload<TFormData extends FieldValues = FieldValues>({
  sponsorType,
  sponsorId,
  setValue,
}: UseImageUploadOptions<TFormData>) {
  const [pending, setPending] = useState<Record<ImageType, boolean>>({
    profile: false,
    background: false,
  });

  const [previewUrls, setPreviewUrls] = useState<
    Record<ImageType, string | undefined>
  >({
    profile: undefined,
    background: undefined,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadImage,
    onSuccess: (data, variables) => {
      // Extract image type from role (e.g., "profile_image" -> "profile")
      const imageType = variables.role.replace('_image', '') as ImageType;

      // ONLY store the S3 path (key) - URLs are computed on backend
      const pathFieldName = `${imageType}_image_path` as Path<TFormData>;
      setValue(pathFieldName, data.path as any);

      // Note: We used to store data.url in `${imageType}_image` field,
      // but that's deprecated. The backend now computes presigned URLs
      // on-demand via the `${imageType}_image_url` property.

      if (data.url) {
        setPreviewUrls((prev) => ({
          ...prev,
          [imageType]: data.url,
        }));
      }

      toaster.create({
        title: "Upload Successful",
        description: `${imageType === "profile" ? "Profile" : "Background"} image updated.`,
        type: "success",
        duration: 3000,
      });

      setPending((prev) => ({ ...prev, [imageType]: false }));
    },
    onError: (error, variables) => {
      const imageType = variables.role.replace('_image', '') as ImageType;

      console.error(`Failed to upload ${imageType} image:`, error);
      toaster.create({
        title: "Upload Failed",
        description: "Could not upload image. Please try again.",
        type: "error",
        duration: 5000,
      });

      setPending((prev) => ({ ...prev, [imageType]: false }));
    },
  });

  const handleImageChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>, imgType: ImageType) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toaster.create({
          title: "Invalid File Type",
          description: "Please upload a JPG, PNG, GIF, or WebP image.",
          type: "error",
          duration: 5000,
        });
        return;
      }

      // Validate file size (10MB max to match backend)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toaster.create({
          title: "File Too Large",
          description: "Please upload an image smaller than 10MB.",
          type: "error",
          duration: 5000,
        });
        return;
      }

      setPending((prev) => ({ ...prev, [imgType]: true }));

      uploadMutation.mutate({
        sponsorType,
        sponsorId,
        role: IMAGE_TYPE_TO_ROLE_MAP[imgType],
        file,
      });
    },
    [sponsorType, sponsorId, uploadMutation]
  );

  return {
    handleImageChange,
    pending,
    previewUrls,
    isUploading: uploadMutation.isPending,
  };
}
