// src/lib/assets/assetsApi.ts

// import { axiosInstance } from "src/lib/axiosInstance";

// import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { axiosInstance } from '../../lib/axiosInstance';

export type SponsorType = 'group' | 'member';
export type ImageRole = 'profile_image' | 'background_image' | 'avatar';

export interface UploadImageParams {
  sponsorType: SponsorType;
  sponsorId: string;
  role: ImageRole;
  file: File;
}

export interface UploadImageResponse {
  path: string;   // S3 key - store this in DB
  url: string;    // Presigned URL for immediate display
  bytes: number;
  elapsed: number;
}

/**
 * Upload an image to the sponsor-agnostic endpoint.
 *
 * @example
 * ```ts
 * const result = await uploadImage({
 *   sponsorType: 'group',
 *   sponsorId: group.id,
 *   role: 'profile_image',
 *   file: selectedFile
 * });
 * // Store result.path in your database
 * // Display result.url immediately
 * ```
 */
export async function uploadImage({
  sponsorType,
  sponsorId,
  role,
  file,
}: UploadImageParams): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post<UploadImageResponse>(
    `/api/assets/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      params: {
        sponsor_type: sponsorType,
        sponsor_id: sponsorId,
        role,
      },
    }
  );

  return response.data;
}
