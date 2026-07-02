"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
  Tabs,
} from "@chakra-ui/react";
import {
  IconPlayerRecord,
  IconPlayerStop,
  IconUpload,
  IconCheck,
  IconAlertTriangle,
  IconScreenshot,
  IconFile,
} from "@tabler/icons-react";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from "@components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

type PipelineState =
  | "idle"
  | "recording"
  | "stopped"
  | "uploading"
  | "processing"
  | "ready"
  | "error";

interface CaptureStatusResponse {
  capture_id: string;
  status: string;
  transcript?: {
    id: string;
    raw_text: string;
    stackroom_ingested_at: string | null;
  };
}

function useElapsedTimer(active: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!active) { setElapsed(0); return; }
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function ScreencastCaptureButton({ groupSlug }: { groupSlug: string }) {
  void groupSlug;

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"record" | "upload">("record");
  const [pipelineState, setPipelineState] = useState<PipelineState>("idle");
  const [title, setTitle] = useState("");
  const [captureId, setCaptureId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);
  const timer = useElapsedTimer(pipelineState === "recording");

  const { data: statusData } = useQuery<CaptureStatusResponse>({
    queryKey: ["media-capture-status", captureId],
    queryFn: () =>
      axiosInstance
        .get<CaptureStatusResponse>(`/api/media-capture/${captureId}/`)
        .then((r) => r.data),
    enabled: !!captureId && pipelineState === "processing",
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "ready" || s === "failed" ? false : 3000;
    },
  });

  useEffect(() => {
    if (!statusData) return;
    if (statusData.status === "ready") setPipelineState("ready");
    if (statusData.status === "failed") {
      setErrorMsg("Transcription failed on the server.");
      setPipelineState("error");
    }
  }, [statusData]);

  const resetDialog = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    recordedBlobRef.current = null;
    setPipelineState("idle");
    setTitle("");
    setCaptureId(null);
    setErrorMsg("");
    setUploadFile(null);
    setMode("record");
  }, []);

  const handleClose = useCallback(() => {
    resetDialog();
    setOpen(false);
  }, [resetDialog]);

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
        // mic optional — screencast still usable for audio-via-system
      }

      const tracks = [
        ...displayStream.getTracks(),
        ...(micStream?.getTracks() ?? []),
      ];
      const combined = new MediaStream(tracks);

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";

      const recorder = new MediaRecorder(combined, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        tracks.forEach((t) => t.stop());
        recordedBlobRef.current = new Blob(chunksRef.current, { type: mimeType });
        setPipelineState("stopped");
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setPipelineState("recording");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not start recording.");
      setPipelineState("error");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const handleUpload = useCallback(async () => {
    const file =
      mode === "record"
        ? recordedBlobRef.current
          ? new File(
              [recordedBlobRef.current],
              `screencast-${Date.now()}.webm`,
              { type: recordedBlobRef.current.type }
            )
          : null
        : uploadFile;

    if (!file) return;

    const form = new FormData();
    form.append("file", file);
    form.append("title", title || `Screencast — ${new Date().toLocaleDateString()}`);
    form.append("source_type", "screencast");

    setPipelineState("uploading");
    try {
      const res = await axiosInstance.post<{ capture_id: string; status: string }>(
        "/api/media-capture/upload/",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setCaptureId(res.data.capture_id);
      setPipelineState("processing");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Upload failed.";
      setErrorMsg(msg);
      setPipelineState("error");
    }
  }, [mode, uploadFile, title]);

  const isReady = pipelineState === "ready";
  const isProcessing = pipelineState === "processing" || pipelineState === "uploading";
  const canUpload =
    (mode === "record" && pipelineState === "stopped") ||
    (mode === "upload" && !!uploadFile && pipelineState === "idle");

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        colorPalette="red"
        onClick={() => setOpen(true)}
        className="mc-record-btn"
      >
        <IconPlayerRecord size={14} />
        Record
      </Button>

      <DialogRoot open={open} onOpenChange={(e) => { if (!e.open) handleClose(); }}>
        <DialogContent maxW="480px" className="mc-dialog">
          <DialogHeader fontSize="md" fontWeight="semibold">
            Record Screencast
          </DialogHeader>
          <DialogCloseTrigger />

          <DialogBody>
            <VStack gap={4} align="stretch">
              {/* Title */}
              <Box className="mc-title-row">
                <Text fontSize="sm" mb={1} color="fg.muted">Title</Text>
                <Input
                  size="sm"
                  placeholder={`Screencast — ${new Date().toLocaleDateString()}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isProcessing || isReady}
                />
              </Box>

              {/* Mode tabs — only when idle/stopped/upload */}
              {!isProcessing && !isReady && pipelineState !== "recording" && (
                <Tabs.Root
                  value={mode}
                  onValueChange={(v) => setMode(v.value as "record" | "upload")}
                  className="mc-mode-tabs"
                >
                  <Tabs.List>
                    <Tabs.Trigger value="record">
                      <IconScreenshot size={14} />
                      Record screen
                    </Tabs.Trigger>
                    <Tabs.Trigger value="upload">
                      <IconFile size={14} />
                      Upload file
                    </Tabs.Trigger>
                    <Tabs.Indicator />
                  </Tabs.List>

                  <Tabs.Content value="record" pt={3}>
                    {pipelineState === "idle" && (
                      <Text fontSize="sm" color="fg.muted">
                        Click <strong>Start recording</strong> — your browser will ask you to
                        choose a screen or window to capture. Microphone is requested separately
                        for narration.
                      </Text>
                    )}
                    {pipelineState === "stopped" && (
                      <HStack gap={2} color="green.600">
                        <IconCheck size={16} />
                        <Text fontSize="sm">Recording captured — ready to upload.</Text>
                      </HStack>
                    )}
                  </Tabs.Content>

                  <Tabs.Content value="upload" pt={3}>
                    <Box className="mc-file-row">
                      <input
                        type="file"
                        accept="audio/*,video/*"
                        style={{ display: "none" }}
                        id="mc-file-input"
                        onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                      />
                      <label htmlFor="mc-file-input">
                        <Button size="sm" variant="outline" asChild>
                          <span>
                            <IconUpload size={14} />
                            Choose file
                          </span>
                        </Button>
                      </label>
                      {uploadFile && (
                        <Text fontSize="xs" color="fg.muted" mt={1}>
                          {uploadFile.name}
                        </Text>
                      )}
                    </Box>
                  </Tabs.Content>
                </Tabs.Root>
              )}

              {/* Recording active */}
              {pipelineState === "recording" && (
                <HStack gap={3} className="mc-recording-row">
                  <Box w={2} h={2} bg="red.500" borderRadius="full" animation="pulse 1s infinite" />
                  <Text fontSize="sm" fontVariantNumeric="tabular-nums">
                    Recording — {timer}
                  </Text>
                </HStack>
              )}

              {/* Processing / uploading */}
              {isProcessing && (
                <HStack gap={3} className="mc-processing-row">
                  <Spinner size="sm" />
                  <Text fontSize="sm" color="fg.muted">
                    {pipelineState === "uploading"
                      ? "Uploading…"
                      : "Transcribing — this may take a minute…"}
                  </Text>
                </HStack>
              )}

              {/* Ready */}
              {isReady && (
                <VStack gap={2} align="start" className="mc-ready-row">
                  <HStack gap={2} color="green.600">
                    <IconCheck size={16} />
                    <Text fontSize="sm" fontWeight="medium">Transcript ready</Text>
                  </HStack>
                  {statusData?.transcript?.raw_text && (
                    <Box
                      bg="bg.subtle"
                      borderRadius="md"
                      p={3}
                      maxH="120px"
                      overflowY="auto"
                      w="full"
                    >
                      <Text fontSize="xs" color="fg.muted" lineClamp={6}>
                        {statusData.transcript.raw_text}
                      </Text>
                    </Box>
                  )}
                  {statusData?.transcript?.stackroom_ingested_at ? (
                    <Text fontSize="xs" color="fg.muted">Ingested into Stackroom.</Text>
                  ) : (
                    <Text fontSize="xs" color="fg.muted">Stackroom ingestion pending…</Text>
                  )}
                </VStack>
              )}

              {/* Error */}
              {pipelineState === "error" && (
                <HStack gap={2} color="red.500" className="mc-error-row">
                  <IconAlertTriangle size={16} />
                  <Text fontSize="sm">{errorMsg || "An error occurred."}</Text>
                </HStack>
              )}
            </VStack>
          </DialogBody>

          <DialogFooter className="mc-footer">
            <HStack gap={2} w="full" justify="flex-end">
              {pipelineState === "idle" && mode === "record" && (
                <Button size="sm" colorPalette="red" onClick={startRecording}>
                  <IconPlayerRecord size={14} />
                  Start recording
                </Button>
              )}

              {pipelineState === "recording" && (
                <Button size="sm" colorPalette="orange" onClick={stopRecording}>
                  <IconPlayerStop size={14} />
                  Stop recording
                </Button>
              )}

              {canUpload && (
                <Button size="sm" colorPalette="green" onClick={handleUpload}>
                  <IconUpload size={14} />
                  Upload &amp; transcribe
                </Button>
              )}

              {(isReady || pipelineState === "error") && (
                <Button size="sm" variant="outline" onClick={resetDialog}>
                  Record another
                </Button>
              )}

              <Button size="sm" variant="ghost" onClick={handleClose}>
                {isReady ? "Close" : "Cancel"}
              </Button>
            </HStack>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
}
