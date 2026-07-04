"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export type PipelineState =
  | "idle"
  | "recording"
  | "paused"
  | "stopped"
  | "uploading"
  | "processing"
  | "ready"
  | "error";

export interface CaptureStatusResponse {
  capture_id: string;
  status: string;
  title: string;
  transcript?: {
    id: string;
    raw_text: string;
    stackroom_ingested_at: string | null;
  };
}

interface MediaCaptureContextValue {
  pipelineState: PipelineState;
  captureId: string | null;
  statusData: CaptureStatusResponse | null;
  errorMsg: string;
  elapsed: number;
  title: string;
  groupSlug: string | null;
  setTitle: (t: string) => void;
  setGroupSlug: (slug: string) => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  uploadRecording: (file?: File) => Promise<void>;
  reset: () => void;
  recordedBlob: Blob | null;
}

const MediaCaptureContext = createContext<MediaCaptureContextValue | null>(null);

export function MediaCaptureProvider({ children }: { children: React.ReactNode }) {
  const [pipelineState, setPipelineState] = useState<PipelineState>("idle");
  const [captureId, setCaptureId] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<CaptureStatusResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [title, setTitle] = useState("");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [groupSlug, setGroupSlug] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tracksRef = useRef<MediaStreamTrack[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed timer during recording
  useEffect(() => {
    if (pipelineState !== "recording") return;
    setElapsed(0);
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [pipelineState]);

  // Status polling when processing
  useEffect(() => {
    if (pipelineState !== "processing" || !captureId) return;

    const poll = async () => {
      try {
        const res = await axiosInstance.get<CaptureStatusResponse>(
          `/api/media-capture/${captureId}`
        );
        setStatusData(res.data);
        if (res.data.status === "ready") {
          setPipelineState("ready");
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (res.data.status === "failed") {
          setErrorMsg("Transcription failed on the server.");
          setPipelineState("error");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // transient — keep polling
      }
    };

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pipelineState, captureId]);

  const startRecording = useCallback(async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        // mic optional
      }
      const tracks = [
        ...displayStream.getTracks(),
        ...(micStream?.getTracks() ?? []),
      ];
      tracksRef.current = tracks;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";

      const recorder = new MediaRecorder(new MediaStream(tracks), { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        tracksRef.current.forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        setPipelineState("stopped");
      };

      // Stop if the user ends the share via the browser's native "Stop sharing" button
      displayStream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      });

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setPipelineState("recording");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not start recording.");
      setPipelineState("error");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setPipelineState("paused");
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setPipelineState("recording");
    }
  }, []);

  const uploadRecording = useCallback(
    async (file?: File) => {
      const uploadFile =
        file ??
        (recordedBlob
          ? new File([recordedBlob], `screencast-${Date.now()}.webm`, {
              type: recordedBlob.type,
            })
          : null);

      if (!uploadFile) return;

      const form = new FormData();
      form.append("file", uploadFile);
      form.append(
        "title",
        title || `Screencast — ${new Date().toLocaleDateString()}`
      );
      form.append("source_type", "screencast");

      setPipelineState("uploading");
      try {
        const res = await axiosInstance.post<{ capture_id: string; status: string }>(
          "/api/media-capture/upload",
          form,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setCaptureId(res.data.capture_id);
        setPipelineState("processing");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Upload failed.");
        setPipelineState("error");
      }
    },
    [recordedBlob, title]
  );

  const reset = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    tracksRef.current.forEach((t) => t.stop());
    tracksRef.current = [];
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    if (pollRef.current) clearInterval(pollRef.current);
    setPipelineState("idle");
    setCaptureId(null);
    setStatusData(null);
    setErrorMsg("");
    setElapsed(0);
    setTitle("");
    setRecordedBlob(null);
  }, []);

  return (
    <MediaCaptureContext.Provider
      value={{
        pipelineState,
        captureId,
        statusData,
        errorMsg,
        elapsed,
        title,
        groupSlug,
        setTitle,
        setGroupSlug,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        uploadRecording,
        reset,
        recordedBlob,
      }}
    >
      {children}
    </MediaCaptureContext.Provider>
  );
}

export function useMediaCapture() {
  const ctx = useContext(MediaCaptureContext);
  if (!ctx) throw new Error("useMediaCapture must be used inside MediaCaptureProvider");
  return ctx;
}
