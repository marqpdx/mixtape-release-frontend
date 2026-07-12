// apps/mixtape/src/hooks/useFeedbackVoiceRecorder.ts

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { getSocket } from "@/lib/socket";

export type VoiceRecorderState =
  | "idle"
  | "recording"
  | "stopped"
  | "uploading"
  | "transcribing"
  | "ready"
  | "error";

interface VoiceTranscribedPayload {
  voice_upload_id: string;
  transcript: string;
}

const POLL_SCHEDULE_MS = [3000, 6000, 10000, 16000, 24000];

async function pollVoiceStatus(
  voiceUploadId: string,
  isCancelled: () => boolean,
): Promise<string | undefined> {
  const startedAt = Date.now();
  for (let attempt = 0; ; attempt++) {
    if (isCancelled()) return undefined;
    try {
      const res = await axiosInstance.get<{ status: string; transcript: string }>(
        `/api/feedback/voice-status/${voiceUploadId}`,
      );
      if (res.data.status === "ready") return res.data.transcript;
    } catch {
      // transient — keep polling
    }
    if (Date.now() - startedAt >= 60_000) return undefined;
    const delay = POLL_SCHEDULE_MS[Math.min(attempt, POLL_SCHEDULE_MS.length - 1)];
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
  }
}

export function useFeedbackVoiceRecorder() {
  const [recorderState, setRecorderState] = useState<VoiceRecorderState>("idle");
  const [voiceUploadId, setVoiceUploadId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const pollCancelledRef = useRef(false);

  useEffect(() => {
    if (recorderState !== "recording") return;
    setElapsed(0);
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recorderState]);

  // WS listener — cancels poll loop when transcript arrives
  useEffect(() => {
    if (!voiceUploadId) return;
    const socket = getSocket();
    if (!socket) return;

    const handler = (payload: VoiceTranscribedPayload) => {
      if (payload.voice_upload_id !== voiceUploadId) return;
      pollCancelledRef.current = true;
      setTranscript(payload.transcript);
      setRecorderState("ready");
    };

    socket.on("feedback:voice_transcribed", handler);
    return () => { socket.off("feedback:voice_transcribed", handler); };
  }, [voiceUploadId]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setRecorderState("stopped");
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setRecorderState("recording");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Microphone access denied.");
      setRecorderState("error");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
  }, []);

  const uploadRecording = useCallback(async () => {
    const mimeType = chunksRef.current[0]?.type ?? "audio/webm";
    const blob = new Blob(chunksRef.current, { type: mimeType });
    if (!blob.size) return;

    const file = new File([blob], `feedback-voice-${Date.now()}.webm`, { type: mimeType });
    const form = new FormData();
    form.append("file", file);

    setRecorderState("uploading");
    try {
      const res = await axiosInstance.post<{ voice_upload_id: string; status: string }>(
        "/api/feedback/upload-voice",
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const uploadId = res.data.voice_upload_id;
      setVoiceUploadId(uploadId);
      setRecorderState("transcribing");

      pollCancelledRef.current = false;
      const result = await pollVoiceStatus(uploadId, () => pollCancelledRef.current);
      if (result !== undefined && !pollCancelledRef.current) {
        setTranscript(result);
        setRecorderState("ready");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed.");
      setRecorderState("error");
    }
  }, []);

  const reset = useCallback(() => {
    pollCancelledRef.current = true;
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    setRecorderState("idle");
    setVoiceUploadId(null);
    setTranscript("");
    setErrorMsg("");
    setElapsed(0);
  }, []);

  return {
    recorderState,
    voiceUploadId,
    transcript,
    setTranscript,
    errorMsg,
    elapsed,
    startRecording,
    stopRecording,
    uploadRecording,
    reset,
  };
}
