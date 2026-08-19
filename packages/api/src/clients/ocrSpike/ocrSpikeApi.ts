import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export type OcrPrivacySensitivity = "low" | "medium" | "complete";
export type OcrArtifactStatus = "uploaded" | "preparing" | "recognizing" | "ready_for_review" | "complete" | "failed";
export type OcrProvider = "local" | "cloud";
export type OcrOutcome = "accepted_local" | "corrected_local" | "accepted_cloud" | "corrected_cloud" | "unreadable" | "skipped";
export type OcrCorrectionEffort = "none" | "minor" | "heavy" | "not_worth_it";
export type OcrScreen = "upload" | "processing" | "curation" | "complete";

export interface OcrSpikeArtifact {
  artifact_id: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  page_count: number | null;
  privacy_sensitivity: OcrPrivacySensitivity;
  status: OcrArtifactStatus;
  error_message: string;
  created_at: string;
  updated_at: string;
}

export interface OcrSpikeAttempt {
  attempt_id: string;
  provider: OcrProvider;
  engine_name: string;
  raw_text: string;
  confidence_summary: { overall?: number; low_confidence_region_count?: number };
  processing_time_ms: number | null;
  status: "processing" | "complete" | "failed";
  error_message: string;
  created_at: string;
  updated_at: string;
}

export interface OcrSpikeEvaluation {
  evaluation_id: string;
  selected_attempt_id: string | null;
  final_text: string;
  outcome: OcrOutcome;
  quality_rating: number | null;
  correction_effort: OcrCorrectionEffort | "";
  search_summary: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface OcrSpikePage {
  page_id: string;
  page_number: number;
  image_url: string;
  image_content_type: string;
  width: number | null;
  height: number | null;
  preparation_status: string;
  attempts: OcrSpikeAttempt[];
  evaluation?: OcrSpikeEvaluation | null;
}

export async function listOcrSpikeArtifacts(): Promise<OcrSpikeArtifact[]> {
  const response = await axiosInstance.get<OcrSpikeArtifact[]>("/api/spikes/ocr/artifacts/");
  return response.data;
}

export async function createOcrSpikeArtifact(file: File, privacy: OcrPrivacySensitivity): Promise<OcrSpikeArtifact> {
  const form = new FormData();
  form.append("file", file);
  form.append("privacy_sensitivity", privacy);
  const response = await axiosInstance.post<OcrSpikeArtifact>("/api/spikes/ocr/artifacts/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function fetchOcrSpikeArtifact(artifactId: string): Promise<OcrSpikeArtifact> {
  const response = await axiosInstance.get<OcrSpikeArtifact>(`/api/spikes/ocr/artifacts/${artifactId}/`);
  return response.data;
}

export async function runLocalOcr(artifactId: string): Promise<OcrSpikeArtifact> {
  const response = await axiosInstance.post<OcrSpikeArtifact>(`/api/spikes/ocr/artifacts/${artifactId}/run-local/`);
  return response.data;
}

export async function fetchOcrSpikePages(artifactId: string): Promise<OcrSpikePage[]> {
  const response = await axiosInstance.get<{ pages: OcrSpikePage[] }>(`/api/spikes/ocr/artifacts/${artifactId}/pages/`);
  return response.data.pages;
}

export async function fetchOcrSpikePageFile(pageId: string): Promise<Blob> {
  const response = await axiosInstance.get<Blob>(`/api/spikes/ocr/pages/${pageId}/file/`, {
    responseType: "blob",
  });
  return response.data;
}

export async function runCloudOcr(pageId: string): Promise<{ page_id: string; status: string }> {
  const response = await axiosInstance.post<{ page_id: string; status: string }>(`/api/spikes/ocr/pages/${pageId}/cloud-recognize/`);
  return response.data;
}

export async function saveOcrEvaluation(pageId: string, data: {
  selected_attempt_id?: string | null;
  final_text?: string;
  outcome: OcrOutcome;
  quality_rating?: number | null;
  correction_effort?: OcrCorrectionEffort | "";
  search_summary?: string;
  notes?: string;
}): Promise<OcrSpikeEvaluation> {
  const response = await axiosInstance.post<OcrSpikeEvaluation>(`/api/spikes/ocr/pages/${pageId}/evaluation/`, data);
  return response.data;
}

export async function saveOcrFeedback(data: {
  artifact_id?: string | null;
  page_id?: string | null;
  screen: OcrScreen;
  note: string;
}): Promise<{ feedback_note_id: string; created_at: string }> {
  const response = await axiosInstance.post<{ feedback_note_id: string; created_at: string }>("/api/spikes/ocr/feedback/", data);
  return response.data;
}
