// src/utils/file/uploadEntityImage

import { axiosInstance } from "@providers/auth-provider/axiosInstance";

export async function uploadEntityImage({
  entityType,
  entityId,
  imageType,
  file,
}: {
  entityType: string;
  entityId: string;
  imageType: string;
  file: File;
}): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axiosInstance.post(
    `/api/assets/entity-image/${entityType}/${entityId}/${imageType}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data.url;
}
