// components/writing/draft-room-v2/useCreateArtifact.ts
//
// Reusable artifact creation callback for stream authoring commands.
// Handles writingpiece, seed, event, course creation via existing APIs.

"use client";

import { useCallback } from "react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

interface SponsorConfig {
  type: "member";
  id: string;
  slug: string;
  displayName: string;
}

interface CreatedArtifact {
  id: string;
  contentTypeModel: string;
}

export function useCreateArtifact(sponsor: SponsorConfig) {
  const createArtifact = useCallback(
    async (type: string, title?: string): Promise<CreatedArtifact> => {
      const placeholderTitle = title || "Untitled";

      switch (type) {
        case "writingpiece": {
          const res = await axiosInstance.post("/api/workbench/drafts/", {
            sponsor_type: sponsor.type === "member" ? "user" : "group",
            sponsor_id: sponsor.id,
            content_profile: "default",
            title: placeholderTitle,
          });
          return { id: res.data.id, contentTypeModel: "writingpiece" };
        }
        case "seed": {
          const res = await axiosInstance.post("/api/writing/seeds", {
            body_text: placeholderTitle,
          });
          return { id: res.data.id, contentTypeModel: "seed" };
        }
        case "event": {
          const res = await axiosInstance.post("/api/almanac/events/", {
            event_type: "single",
            title: placeholderTitle,
            description: "",
            event_format: "in_person",
          });
          return { id: res.data.id, contentTypeModel: "event" };
        }
        case "course": {
          throw new Error("Course creation requires a group context");
        }
        default:
          throw new Error(`Unsupported artifact type: ${type}`);
      }
    },
    [sponsor]
  );

  return createArtifact;
}
