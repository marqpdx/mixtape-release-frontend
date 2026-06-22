// src/lib/writing/uploadWritingImage.ts

import { axiosInstance, buildApiUrl } from "@mixtape/api/lib/axiosInstance";

export interface UploadWritingImageResult {
  /** StoredFile UUID */
  id: string;
  /** Stable serve URL to embed in body_json (never expires; presigns per request) */
  serveUrl: string;
}

/**
 * Upload an inline image for a writing piece.
 *
 * POSTs the file to /api/writing/pieces/{pieceId}/upload-image and returns the
 * stable serve URL. The serve URL is what gets stored in the editor's body_json
 * — it 302-redirects to a freshly presigned Stash URL on each request, so it
 * never goes stale the way a directly-stored presigned URL would.
 */
export async function uploadWritingImage(
  pieceId: string,
  file: File
): Promise<UploadWritingImageResult> {
  const form = new FormData();
  form.append("image", file);

  const res = await axiosInstance.post(
    `/api/writing/pieces/${pieceId}/upload-image`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  // serve_url is a relative path; make it absolute so <img> src resolves to the
  // backend origin rather than the Next.js dev server.
  const serveUrl = buildApiUrl(res.data.serve_url);
  return { id: res.data.id, serveUrl };
}
