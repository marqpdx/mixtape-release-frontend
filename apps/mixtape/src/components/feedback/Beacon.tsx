// apps/mixtape/src/components/feedback/Beacon.tsx

"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  HStack,
  IconButton,
  Image,
  Input,
  Portal,
  Popover,
  RadioGroup,
  SimpleGrid,
  Spinner,
  Tabs,
  Text,
  Textarea,
  VStack,
  chakra,
} from "@chakra-ui/react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import {
  MediaCaptureProvider,
  useMediaCapture,
} from "@/components/MediaCapture/MediaCaptureContext";
import { useFeedbackVoiceRecorder } from "@/hooks/useFeedbackVoiceRecorder";

interface BeaconProps {
  beaconKey: string;
  title: string;
  body?: string;
  areaLabel: string;
  workArea?: string;
  featureContext?: string;
  position?: "inline" | "corner";
  size?: "sm" | "md";
}

interface ImageAttachment {
  attachmentId: string;
  previewUrl: string;
  fileName: string;
}

const DISMISS_DAYS = 30;

// ── Screencast tab ────────────────────────────────────────────────────────────
// Separate component so useMediaCapture() is called inside MediaCaptureProvider.
function ScreencastTab({
  onCaptureReady,
}: {
  onCaptureReady: (captureId: string) => void;
}) {
  const {
    pipelineState,
    captureId,
    errorMsg,
    elapsed,
    startRecording,
    stopRecording,
    uploadRecording,
    reset,
  } = useMediaCapture();

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Notify parent when ready
  const notifiedRef = useRef(false);
  if (pipelineState === "ready" && captureId && !notifiedRef.current) {
    notifiedRef.current = true;
    onCaptureReady(captureId);
  }

  return (
    <VStack align="stretch" gap={3}>
      {pipelineState === "idle" && (
        <>
          <Text fontSize="sm" color="gray.500">
            Record your screen and attach it to this feedback.
          </Text>
          <Button size="sm" onClick={startRecording}>
            Start recording
          </Button>
        </>
      )}

      {pipelineState === "recording" && (
        <HStack>
          <Spinner size="xs" color="red.400" />
          <Text fontSize="sm" color="red.500" fontVariantNumeric="tabular-nums">
            Recording {fmt(elapsed)}
          </Text>
          <Button size="xs" variant="outline" onClick={stopRecording}>
            Stop
          </Button>
        </HStack>
      )}

      {pipelineState === "stopped" && (
        <HStack>
          <Text fontSize="sm">Recording complete.</Text>
          <Button size="xs" onClick={() => uploadRecording()}>
            Upload
          </Button>
          <Button size="xs" variant="ghost" onClick={reset}>
            Discard
          </Button>
        </HStack>
      )}

      {pipelineState === "uploading" && (
        <HStack>
          <Spinner size="xs" />
          <Text fontSize="sm" color="gray.500">Uploading…</Text>
        </HStack>
      )}

      {pipelineState === "processing" && (
        <HStack>
          <Spinner size="xs" />
          <Text fontSize="sm" color="gray.500">Processing…</Text>
        </HStack>
      )}

      {pipelineState === "ready" && (
        <HStack>
          <Text fontSize="sm" color="green.600">Screencast attached.</Text>
          <Button size="xs" variant="ghost" onClick={() => { notifiedRef.current = false; reset(); onCaptureReady(""); }}>
            Remove
          </Button>
        </HStack>
      )}

      {pipelineState === "error" && (
        <Text fontSize="sm" color="red.500">{errorMsg || "Recording failed."}</Text>
      )}
    </VStack>
  );
}

// ── Inner panel (all form state) ──────────────────────────────────────────────
function BeaconPanel({
  beaconKey,
  title,
  body,
  areaLabel,
  workArea,
  featureContext,
  onDismiss,
}: Omit<BeaconProps, "position" | "size"> & { onDismiss: () => void }) {
  const [tab, setTab] = useState("text");
  const [kind, setKind] = useState<"bug" | "request" | "idea">("idea");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [captureId, setCaptureId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const voice = useFeedbackVoiceRecorder();

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // When voice transcript is ready, populate message for review
  const prevReady = useRef(false);
  if (voice.recorderState === "ready" && !prevReady.current && voice.transcript) {
    prevReady.current = true;
    setMessage(voice.transcript);
  }
  if (voice.recorderState !== "ready") prevReady.current = false;

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";
    for (const file of files) {
      const previewUrl = URL.createObjectURL(file);
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await axiosInstance.post<{ attachment_id: string }>(
          "/api/feedback/upload-attachment",
          form,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        setAttachments((prev) => [
          ...prev,
          { attachmentId: res.data.attachment_id, previewUrl, fileName: file.name },
        ]);
      } catch {
        URL.revokeObjectURL(previewUrl);
      }
    }
  }, []);

  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments((prev) => {
      const item = prev.find((a) => a.attachmentId === attachmentId);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((a) => a.attachmentId !== attachmentId);
    });
  }, []);

  const canSubmit = message.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await axiosInstance.post("/api/feedback/items", {
        beacon_key: beaconKey,
        kind,
        message: message.trim(),
        page_url:
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : "",
        work_area: workArea ?? areaLabel,
        voice_file_id: voice.voiceUploadId ?? undefined,
        voice_transcript: voice.transcript || undefined,
        attachment_ids: attachments.map((a) => a.attachmentId),
        media_capture_id: captureId ?? undefined,
      });
      setSubmitted(true);
      setMessage("");
    } catch {
      // quiet fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Popover.Body>
      <VStack align="stretch" gap={4}>
        <HStack justify="space-between">
          <Text fontWeight="semibold">{title}</Text>
          <Button size="xs" variant="ghost" onClick={onDismiss}>
            Hide for 30 days
          </Button>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <VStack align="stretch" gap={2}>
            {body && (
              <Text fontSize="sm" color="gray.600" whiteSpace="pre-wrap">
                {body}
              </Text>
            )}
            {featureContext && (
              <Box p={3} bg="gray.50" borderRadius="md">
                <Text fontSize="xs" textTransform="uppercase" color="gray.500">
                  Feature Context
                </Text>
                <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
                  {featureContext}
                </Text>
              </Box>
            )}
          </VStack>

          {submitted ? (
            <VStack align="stretch" gap={2}>
              <Text fontWeight="medium">Thanks for the feedback.</Text>
              <Text fontSize="sm" color="gray.600">
                We'll review this as we refine {areaLabel}.
              </Text>
            </VStack>
          ) : (
            <VStack align="stretch" gap={3} className="bcn-form">
              <RadioGroup.Root
                value={kind}
                onValueChange={(d) => setKind(d.value as "bug" | "request" | "idea")}
              >
                <HStack gap={4}>
                  {(["bug", "request", "idea"] as const).map((value) => (
                    <RadioGroup.Item
                      key={value}
                      value={value}
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemIndicator />
                      <RadioGroup.ItemText textTransform="capitalize">{value}</RadioGroup.ItemText>
                    </RadioGroup.Item>
                  ))}
                </HStack>
              </RadioGroup.Root>

              <Tabs.Root
                value={tab}
                onValueChange={(d) => setTab(d.value)}
                size="sm"
                className="bcn-tabs"
              >
                <Tabs.List className="bcn-tabs-list">
                  <Tabs.Trigger value="text">Text</Tabs.Trigger>
                  <Tabs.Trigger value="voice">Voice</Tabs.Trigger>
                  <Tabs.Trigger value="images">Images</Tabs.Trigger>
                  <Tabs.Trigger value="screencast">Screencast</Tabs.Trigger>
                </Tabs.List>

                {/* ── Text tab ── */}
                <Tabs.Content value="text" className="bcn-tab-text">
                  <Textarea
                    mt={2}
                    rows={4}
                    placeholder="Share your thoughts…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </Tabs.Content>

                {/* ── Voice tab ── */}
                <Tabs.Content value="voice" className="bcn-tab-voice">
                  <VStack align="stretch" gap={2} mt={2}>
                    {voice.recorderState === "idle" && (
                      <Button size="sm" onClick={voice.startRecording}>
                        Start recording
                      </Button>
                    )}

                    {voice.recorderState === "recording" && (
                      <HStack>
                        <Spinner size="xs" color="red.400" />
                        <Text fontSize="sm" color="red.500" fontVariantNumeric="tabular-nums">
                          {fmt(voice.elapsed)}
                        </Text>
                        <Button size="xs" variant="outline" onClick={voice.stopRecording}>
                          Stop
                        </Button>
                      </HStack>
                    )}

                    {voice.recorderState === "stopped" && (
                      <HStack>
                        <Text fontSize="sm">Recording complete.</Text>
                        <Button size="xs" onClick={voice.uploadRecording}>
                          Transcribe
                        </Button>
                        <Button size="xs" variant="ghost" onClick={voice.reset}>
                          Discard
                        </Button>
                      </HStack>
                    )}

                    {(voice.recorderState === "uploading" || voice.recorderState === "transcribing") && (
                      <HStack>
                        <Spinner size="xs" />
                        <Text fontSize="sm" color="gray.500">
                          {voice.recorderState === "uploading" ? "Uploading…" : "Transcribing…"}
                        </Text>
                      </HStack>
                    )}

                    {voice.recorderState === "ready" && (
                      <>
                        <Text fontSize="xs" color="gray.500">
                          Review your transcript — edit before submitting.
                        </Text>
                        <Textarea
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                        />
                        <Button size="xs" variant="ghost" onClick={() => { voice.reset(); setMessage(""); }}>
                          Re-record
                        </Button>
                      </>
                    )}

                    {voice.recorderState === "error" && (
                      <Text fontSize="sm" color="red.500">
                        {voice.errorMsg || "Recording failed."}
                      </Text>
                    )}
                  </VStack>
                </Tabs.Content>

                {/* ── Images tab ── */}
                <Tabs.Content value="images" className="bcn-tab-images">
                  <VStack align="stretch" gap={2} mt={2}>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      display="none"
                      onChange={handleImageSelect}
                    />
                    <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      Add images
                    </Button>
                    {attachments.length > 0 && (
                      <SimpleGrid columns={3} gap={2}>
                        {attachments.map((a) => (
                          <Box key={a.attachmentId} position="relative">
                            <Image
                              src={a.previewUrl}
                              alt={a.fileName}
                              borderRadius="md"
                              objectFit="cover"
                              w="full"
                              h="56px"
                            />
                            <IconButton
                              aria-label="Remove"
                              size="2xs"
                              variant="solid"
                              position="absolute"
                              top="2px"
                              right="2px"
                              onClick={() => removeAttachment(a.attachmentId)}
                            >
                              ×
                            </IconButton>
                          </Box>
                        ))}
                      </SimpleGrid>
                    )}
                    {attachments.length > 0 && (
                      <Textarea
                        rows={2}
                        placeholder="Add a note about these images…"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    )}
                  </VStack>
                </Tabs.Content>

                {/* ── Screencast tab ── */}
                <Tabs.Content value="screencast" className="bcn-tab-screencast">
                  <Box mt={2}>
                    <ScreencastTab
                      onCaptureReady={(id) => setCaptureId(id || null)}
                    />
                  </Box>
                </Tabs.Content>
              </Tabs.Root>

              {/* Shared message field for Text tab when other tabs also have a note */}
              {tab === "screencast" && captureId && (
                <Textarea
                  rows={2}
                  placeholder="Add a note about this screencast…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              )}

              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!canSubmit}
                loading={submitting}
              >
                Send feedback
              </Button>
            </VStack>
          )}
        </SimpleGrid>
      </VStack>
    </Popover.Body>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
export function Beacon({
  beaconKey,
  title,
  body,
  areaLabel,
  workArea,
  featureContext,
  position = "inline",
  size = "sm",
}: BeaconProps) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isDismissed = useMemo(() => {
    if (typeof window === "undefined") return false;
    const raw = window.localStorage.getItem(`beacon_dismissed_${beaconKey}`);
    if (!raw) return false;
    const ts = Number(raw);
    if (!ts || Number.isNaN(ts)) return false;
    return Date.now() < ts + DISMISS_DAYS * 24 * 60 * 60 * 1000;
  }, [beaconKey]);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`beacon_dismissed_${beaconKey}`, String(Date.now()));
    }
    setDismissed(true);
    setOpen(false);
  };

  if (isDismissed || dismissed) return null;

  return (
    <Box position={position === "corner" ? "absolute" : "relative"} className="bcn-root">
      <Popover.Root open={open} onOpenChange={(d) => setOpen(d.open)}>
        <Popover.Trigger asChild>
          <IconButton size={size} variant="outline" aria-label="Share feedback">
            <BeaconIcon />
          </IconButton>
        </Popover.Trigger>

        <Portal>
          <Popover.Positioner>
            <Popover.Content borderRadius="lg" p={4} maxW="580px">
              <Popover.Arrow>
                <Popover.ArrowTip />
              </Popover.Arrow>
              <MediaCaptureProvider>
                <BeaconPanel
                  beaconKey={beaconKey}
                  title={title}
                  body={body}
                  areaLabel={areaLabel}
                  workArea={workArea}
                  featureContext={featureContext}
                  onDismiss={handleDismiss}
                />
              </MediaCaptureProvider>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </Box>
  );
}

function BeaconIcon() {
  const Svg = chakra("svg");
  return (
    <Svg viewBox="0 0 24 24" width="18px" height="18px" color="currentColor">
      <path d="M10 2h4v6h-4z" fill="currentColor" />
      <path d="M9 8h6c1.1 0 2 .9 2 2v2H7v-2c0-1.1.9-2 2-2z" fill="currentColor" />
      <path d="M11 12h2v3h-2z" fill="currentColor" />
      <path d="M12 15c-2.8 0-4 2.4-4 4.5V22h8v-2.5c0-2.1-1.2-4.5-4-4.5z" fill="currentColor" />
      <path d="M11 18h2v2h-2z" opacity=".22" fill="currentColor" />
    </Svg>
  );
}
