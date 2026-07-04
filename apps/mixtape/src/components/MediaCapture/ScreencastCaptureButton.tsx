"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  HStack,
  Input,
  Spinner,
  Text,
  Tabs,
  VStack,
} from "@chakra-ui/react";
import {
  IconPlayerRecord,
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
import { useMediaCapture } from "./MediaCaptureContext";

export function ScreencastCaptureButton({ groupSlug }: { groupSlug: string }) {
  const {
    pipelineState,
    statusData,
    errorMsg,
    title,
    setTitle,
    setGroupSlug,
    startRecording,
    uploadRecording,
    reset,
  } = useMediaCapture();

  useEffect(() => {
    setGroupSlug(groupSlug);
  }, [groupSlug, setGroupSlug]);

  const [open, setOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"record" | "upload">("record");

  const isProcessing =
    pipelineState === "uploading" || pipelineState === "processing";
  const isReady = pipelineState === "ready";
  const isRecordingActive =
    pipelineState === "recording" || pipelineState === "paused";

  const handleClose = useCallback(() => {
    if (!isRecordingActive && !isProcessing) {
      reset();
      setUploadFile(null);
    }
    setOpen(false);
  }, [isRecordingActive, isProcessing, reset]);

  const handleStart = useCallback(async () => {
    setOpen(false); // dismiss dialog so user can navigate freely
    await startRecording();
  }, [startRecording]);

  const handleUpload = useCallback(() => {
    uploadRecording(mode === "upload" ? uploadFile ?? undefined : undefined);
    setOpen(false);
  }, [uploadRecording, mode, uploadFile]);

  // If already recording/processing, button reopens dialog to show status
  const buttonLabel =
    isRecordingActive
      ? "Recording…"
      : isProcessing
      ? "Processing…"
      : isReady
      ? "Ready"
      : "Record";

  const canUploadFile = mode === "upload" && !!uploadFile && pipelineState === "idle";
  const canUploadRecording = mode === "record" && pipelineState === "stopped";

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        colorPalette={isRecordingActive ? "red" : "gray"}
        onClick={() => setOpen(true)}
        className="mc-record-btn"
      >
        <IconPlayerRecord size={14} />
        {buttonLabel}
      </Button>

      <DialogRoot
        open={open}
        onOpenChange={(e) => { if (!e.open) handleClose(); }}
      >
        <DialogContent maxW="460px" className="mc-dialog">
          <DialogHeader fontSize="md" fontWeight="semibold">
            Record Screencast
          </DialogHeader>
          <DialogCloseTrigger />

          <DialogBody>
            <VStack gap={4} align="stretch">
              {/* Title */}
              <Box>
                <Text fontSize="sm" mb={1} color="fg.muted">Title</Text>
                <Input
                  size="sm"
                  placeholder={`Screencast — ${new Date().toLocaleDateString()}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isProcessing || isReady}
                />
              </Box>

              {/* Mode tabs — only when idle/stopped */}
              {(pipelineState === "idle" || pipelineState === "stopped") && (
                <Tabs.Root
                  value={mode}
                  onValueChange={(v) => setMode(v.value as "record" | "upload")}
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
                        Click <strong>Start recording</strong> — your browser asks you to
                        choose a screen or window. A floating control appears on every page
                        so you can pause, resume, or stop from anywhere.
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
                    <Box>
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

              {/* Active recording — user is reminded the float control handles it */}
              {isRecordingActive && (
                <HStack gap={2} color="fg.muted">
                  <Box w={2} h={2} bg="red.500" borderRadius="full" />
                  <Text fontSize="sm">
                    Recording in progress — use the floating control at the bottom-right
                    to pause or stop.
                  </Text>
                </HStack>
              )}

              {/* Uploading / processing */}
              {isProcessing && (
                <HStack gap={2}>
                  <Spinner size="sm" />
                  <Text fontSize="sm" color="fg.muted">
                    {pipelineState === "uploading" ? "Uploading…" : "Transcribing — this may take a minute…"}
                  </Text>
                </HStack>
              )}

              {/* Ready */}
              {isReady && (
                <VStack gap={2} align="start">
                  <HStack gap={2} color="green.600">
                    <IconCheck size={16} />
                    <Text fontSize="sm" fontWeight="medium">Transcript ready</Text>
                  </HStack>
                  {statusData?.transcript?.raw_text && (
                    <Box bg="bg.subtle" borderRadius="md" p={3} maxH="120px" overflowY="auto" w="full">
                      <Text fontSize="xs" color="fg.muted" lineClamp={6}>
                        {statusData.transcript.raw_text}
                      </Text>
                    </Box>
                  )}
                  <Text fontSize="xs" color="fg.muted">
                    {statusData?.transcript?.stackroom_ingested_at
                      ? "Ingested into Stackroom."
                      : "Stackroom ingestion pending…"}
                  </Text>
                </VStack>
              )}

              {/* Error */}
              {pipelineState === "error" && (
                <HStack gap={2} color="red.500">
                  <IconAlertTriangle size={16} />
                  <Text fontSize="sm">{errorMsg || "An error occurred."}</Text>
                </HStack>
              )}
            </VStack>
          </DialogBody>

          <DialogFooter>
            <HStack gap={2} justify="flex-end">
              {pipelineState === "idle" && mode === "record" && (
                <Button size="sm" colorPalette="red" onClick={handleStart}>
                  <IconPlayerRecord size={14} />
                  Start recording
                </Button>
              )}

              {(canUploadFile || canUploadRecording) && (
                <Button size="sm" colorPalette="green" onClick={handleUpload}>
                  <IconUpload size={14} />
                  Upload &amp; transcribe
                </Button>
              )}

              {(isReady || pipelineState === "error") && (
                <Button size="sm" variant="outline" onClick={() => { reset(); setUploadFile(null); }}>
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
