// src/hooks/editor/useAutoSaveProfileBio.ts

// import { TipTapDoc } from "content/dispatchTypes";
import { TipTapDoc } from "@mixtape/core/types/dispatchTypes";
import { useGenericAutoSave } from "./useGenericAutoSave";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";

type Props = {
  userId: string;
  getContent: () => TipTapDoc;
};

export function useAutoSaveProfileBio({ userId, getContent }: Props) {
  return useGenericAutoSave<TipTapDoc>({
    getContent,
    debounceMs: 5000,
    onSave: async (content) => {
      await axiosInstance.patch(`/api/profiles/${userId}`, {
        bio_json: content,
      });
    },
    isValid: (content) => {
      return content?.type === "doc" && Array.isArray(content.content);
    },
  });
}
