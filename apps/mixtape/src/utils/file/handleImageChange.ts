// src/utils/file/handleImageChange.tx

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

interface HandleImageChangeProps {
  event: React.ChangeEvent<HTMLInputElement>;
  fileName: string;
  entity: "user" | "group",
  entityId: string | number
}

export const handleImageChange = async ({
  event,
  fileName,
  entity,
  entityId,
}: HandleImageChangeProps): Promise<string | null> => {
  const file = event.target.files?.[0];
  if (!file) {
    console.error("[handleImageChange] No file selected");
    return null;
  }

  const payload: any = {
    fileName,
    contentType: file.type,
    visibility: "public",
  };

  if (entity === "group" && entityId) {
    payload.groupId = entityId;
  }

  console.log("[handleImageChange] 📂 payload...", payload);

  try {
    console.log("[handleImageChange] 📂 Fetching presigned URL...");

    // 🔄 Step 1: Ask Django for a presigned upload URL
    const presignResponse = await axiosInstance.post(`/api/authz/r2/generate-presigned-url`, payload);

    const { uploadUrl, publicUrl } = presignResponse.data;

    console.log("[handleImageChange] ✅ Presigned URL received:", uploadUrl);
    console.log("[handleImageChange] 📂 File name:", fileName);
    console.log("[handleImageChange] 📂 File type:", file.type);
    console.log("[handleImageChange] 📂 presignResponse.data:", presignResponse.data);
    console.log("[handleImageChange] 🔄 Uploading to R2:", fileName);

    // 🔄 Step 2: Upload the file using the presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with status ${uploadResponse.status}`);
    }

    console.log("[handleImageChange] ✅ Upload successful:", publicUrl);
    return publicUrl;
  } catch (err) {
    console.error("[handleImageChange] 🚫 Upload failed", err);
    return null;
  }
};
