// apps/mixtape/src/app/(authenticated)/seed/page.tsx

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Flex,
  HStack,
  IconButton,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { Tooltip } from "@components/ui/tooltip";
import { IconMicrophone, IconPlayerPlay, IconPlayerStop, IconSend, IconUpload, IconX } from "@tabler/icons-react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { useSeedAutosave } from "@/lib/writing/useSeedAutosave";
import { useSeedList } from "@/lib/writing/useSeedList";
import { toaster } from "@mixtape/core/lib/toaster";

export default function SeedCapturePage() {
  const [text, setText] = useState("");
  const {
    schedule,
    savedTick,
    seedId,
    saveNow,
    resetSeed,
    attachExistingSeed,
  } = useSeedAutosave("", 1500);
  const refreshToken = useMemo(() => savedTick + (seedId ? 1 : 0), [savedTick, seedId]);
  const { seeds, loading } = useSeedList(20, refreshToken);
  const [seedItems, setSeedItems] = useState(seeds);
  const [recentSeedId, setRecentSeedId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [expandedAudioSeedId, setExpandedAudioSeedId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const pollingTimerRef = useRef<number | null>(null);
  const micIdleTimerRef = useRef<number | null>(null);
  const [isPreparingMic, setIsPreparingMic] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [bottomPad, setBottomPad] = useState(16);
  const [editingSeedId, setEditingSeedId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const editDebounceRef = useRef<number | null>(null);

  const handleChange = (value: string) => {
    setText(value);
    schedule({ body_text: value });
  };

  const handleSelectSeed = (id: string, bodyText: string) => {
    setText(bodyText);
    attachExistingSeed(id, bodyText);
  };

  const uploadVoiceBlob = async (blob: Blob) => {
    const form = new FormData();
    form.append("audio_file", blob, "seed-voice.webm");
    form.append("kind", "voice");
    form.append("source", "web");
    const res = await axiosInstance.post("/api/writing/seeds", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const newSeed = res.data;
    setSeedItems((prev) => {
      const next = prev.filter((seed) => seed.id !== newSeed.id);
      next.push(newSeed);
      return next;
    });
    setRecentSeedId(newSeed.id);
    window.setTimeout(() => {
      setRecentSeedId((current) => (current === newSeed.id ? null : current));
    }, 600);
  };

  const handleSend = async () => {
    if (voiceBlob) {
      await uploadVoiceBlob(voiceBlob);
      setVoiceBlob(null);
      setText("");
      resetSeed();
      schedule({ body_text: "" });
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;
    await saveNow(trimmed);
    setText("");
    resetSeed();
    schedule({ body_text: "" });
  };

  useEffect(() => {
    const { body } = document;
    body.classList.add("seed-page");
    return () => {
      body.classList.remove("seed-page");
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
      if (pollingTimerRef.current) {
        window.clearInterval(pollingTimerRef.current);
      }
      if (micIdleTimerRef.current) {
        window.clearTimeout(micIdleTimerRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent;
    const isFirefox = /Firefox/i.test(ua);
    const isChrome = /Chrome|Chromium|CriOS/i.test(ua);
    if (isFirefox) {
      setBottomPad(29);
    } else if (isChrome) {
      setBottomPad(36);
    } else {
      setBottomPad(32);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) return;
    let cancelled = false;
    const prewarmMic = async () => {
      try {
        setIsPreparingMic(true);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        mediaStreamRef.current = stream;
      } catch {
        // ignore; user can trigger via button
      } finally {
        if (!cancelled) setIsPreparingMic(false);
      }
    };
    void prewarmMic();
    return () => {
      cancelled = true;
    };
  }, []);

  const scheduleMicIdleShutdown = useCallback(() => {
    if (micIdleTimerRef.current) {
      window.clearTimeout(micIdleTimerRef.current);
    }
    micIdleTimerRef.current = window.setTimeout(() => {
      if (isRecording) return;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    }, 60000);
  }, [isRecording]);

  const ensureMicWarm = useCallback(async () => {
    if (isRecording || isPreparingMic) return;
    if (mediaStreamRef.current) {
      scheduleMicIdleShutdown();
      return;
    }
    try {
      setIsPreparingMic(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
    } catch {
      // ignore
    } finally {
      setIsPreparingMic(false);
      scheduleMicIdleShutdown();
    }
  }, [isRecording, isPreparingMic, scheduleMicIdleShutdown]);

  useEffect(() => {
    const events = ["pointerdown", "keydown", "touchstart"];
    const handler = () => {
      scheduleMicIdleShutdown();
      void ensureMicWarm();
    };
    events.forEach((event) => window.addEventListener(event, handler, { passive: true }));
    return () => {
      events.forEach((event) => window.removeEventListener(event, handler));
    };
  }, [ensureMicWarm, scheduleMicIdleShutdown]);

  useEffect(() => {
    const sorted = [...seeds].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    setSeedItems(sorted);
  }, [seeds]);

  useEffect(() => {
    const processingSeeds = seedItems.filter((seed) => seed.status === "processing");
    if (processingSeeds.length === 0) {
      if (pollingTimerRef.current) {
        window.clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
      return;
    }

    if (pollingTimerRef.current) {
      window.clearInterval(pollingTimerRef.current);
    }

    pollingTimerRef.current = window.setInterval(async () => {
      const updates = await Promise.all(
        processingSeeds.map(async (seed) => {
          try {
            const res = await axiosInstance.get(`/api/writing/seeds/${seed.id}`);
            return res.data;
          } catch {
            return null;
          }
        })
      );

      const updateMap = new Map(
        updates.filter(Boolean).map((seed) => [seed.id, seed])
      );

      if (updateMap.size === 0) return;

      setSeedItems((prev) => {
        let changed = false;
        const next = prev.map((seed) => {
          const updated = updateMap.get(seed.id);
          if (!updated) return seed;
          const hasChanged =
            updated.status !== seed.status ||
            updated.body_text !== seed.body_text ||
            updated.transcript_text !== seed.transcript_text ||
            updated.transcript_error !== seed.transcript_error ||
            updated.audio_url !== seed.audio_url;
          if (hasChanged) {
            changed = true;
            return { ...seed, ...updated };
          }
          return seed;
        });
        return changed ? next : prev;
      });
    }, 10000);

    return () => {
      if (pollingTimerRef.current) {
        window.clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [seedItems]);

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const needsStream = !mediaStreamRef.current;
      if (needsStream) setIsPreparingMic(true);
      const stream =
        mediaStreamRef.current || (await navigator.mediaDevices.getUserMedia({ audio: true }));
      mediaStreamRef.current = stream;
      setMicError(null);
      scheduleMicIdleShutdown();
      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "audio/mp4",
      ];
      const chosenMime =
        typeof MediaRecorder !== "undefined"
          ? mimeCandidates.find((type) => MediaRecorder.isTypeSupported(type))
          : undefined;

      const recorder = new MediaRecorder(stream, chosenMime ? { mimeType: chosenMime } : undefined);
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      if (!chunksRef.current.length) {
        toaster.error({
          title: "No audio captured",
          description: "We didn't receive any audio data. Please try again.",
        });
      } else {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size === 0) {
          toaster.error({
            title: "No audio captured",
            description: "The recording is empty. Please try again.",
          });
        } else {
          setVoiceBlob(blob);
          void uploadVoiceBlob(blob).then(() => {
            setVoiceBlob(null);
          });
        }
      }
      // Keep stream alive for faster subsequent recordings.
    };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      if (needsStream) setIsPreparingMic(false);
      setRecordingSeconds(0);
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      setIsPreparingMic(false);
      const err = error as { name?: string; message?: string } | undefined;
      let message = "Microphone permission blocked. Close any screen overlays and try again.";
      if (err?.name === "NotAllowedError") {
        message = "Microphone blocked. Check Android Settings → Apps → Chrome → Permissions → Microphone.";
      } else if (err?.name === "NotFoundError") {
        message = "No microphone found. Connect or enable a mic and try again.";
      } else if (err?.message) {
        message = err.message;
      }
      toaster.error({
        title: "Microphone unavailable",
        description: "Please allow microphone access and try again.",
      });
      setMicError(message);
    }
  };

  const saveInlineEdit = useCallback(
    async (id: string, textValue: string) => {
      try {
        await axiosInstance.patch(`/api/writing/seeds/${id}`, {
          body_text: textValue,
        });
        const refreshed = await axiosInstance.get(`/api/writing/seeds/${id}`);
        const updatedSeed = refreshed.data;
        setSeedItems((prev) =>
          prev.map((seed) => (seed.id === updatedSeed.id ? updatedSeed : seed))
        );
      } catch {
        toaster.error({
          title: "Could not save seed",
          description: "Please try again.",
        });
      }
    },
    [setSeedItems]
  );

  const startInlineEdit = useCallback(
    (seedId: string, seedText: string) => {
      if (editingSeedId && editingSeedId !== seedId) {
        void saveInlineEdit(editingSeedId, editingText);
      }
      setEditingSeedId(seedId);
      setEditingText(seedText);
    },
    [editingSeedId, editingText, saveInlineEdit]
  );

  useEffect(() => {
    if (!editingSeedId) return;
    if (editDebounceRef.current) {
      window.clearTimeout(editDebounceRef.current);
    }
    editDebounceRef.current = window.setTimeout(() => {
      void saveInlineEdit(editingSeedId, editingText);
    }, 3000);
    return () => {
      if (editDebounceRef.current) {
        window.clearTimeout(editDebounceRef.current);
      }
    };
  }, [editingSeedId, editingText, saveInlineEdit]);

  const stopRecording = () => {
    if (!isRecording) return;
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    scheduleMicIdleShutdown();
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const handleUploadFile = async (file: File) => {
    const form = new FormData();
    form.append("audio_file", file);
    form.append("kind", "voice");
    form.append("source", "web");
    await axiosInstance.post("/api/writing/seeds", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setText("");
    resetSeed();
    schedule({ body_text: "" });
  };

  return (
    <Flex
      direction="column"
      h="100vh"
      overflow="hidden"
      gap={4}
      pb={`calc(max(env(safe-area-inset-bottom), ${bottomPad}px))`}
    >
      <Box flex="0 0 60vh" h="60vh" overflowY="auto">
        <Stack gap={3}>
          {loading && <Text color="fg.muted">Loading seeds...</Text>}
          {!loading && seeds.length === 0 && <Text color="fg.muted">No seeds yet.</Text>}
      {!loading &&
        seedItems
          .slice()
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((seed) => (
              <Box
                key={seed.id}
                borderWidth="1px"
                borderColor="theme.border"
                borderRadius="md"
                p={3}
                cursor="pointer"
                onClick={() => startInlineEdit(seed.id, seed.body_text || "")}
                className={seed.id === recentSeedId ? "seed-fade-in" : undefined}
              >
                <Stack gap={2}>
                  <HStack gap={2} align="center" flexWrap="wrap">
                    <Text fontSize="xs" color="fg.muted">
                      {new Date(seed.updated_at).toLocaleString()}
                    </Text>
                    {seed.promoted_to && (
                      <Badge colorScheme="blue" fontSize="10px">
                        repurposed
                      </Badge>
                    )}
                    {seed.edited_after_transcription && (
                      <Tooltip content="Edited after transcription" portalled={false}>
                        <Badge bg="gray.500" color="white" fontSize="10px">
                          edited
                        </Badge>
                      </Tooltip>
                    )}
                  </HStack>
                  <HStack align="start" justify="space-between" gap={3}>
                    {editingSeedId === seed.id ? (
                      <Textarea
                        value={editingText}
                        onChange={(event) => setEditingText(event.target.value)}
                        onBlur={() => {
                          void saveInlineEdit(seed.id, editingText);
                          setEditingSeedId(null);
                        }}
                        resize="none"
                        fontSize="sm"
                        lineHeight="1.4"
                        minH="72px"
                        flex="1 1 auto"
                        autoFocus
                      />
                    ) : (
                      <Text
                        whiteSpace="pre-wrap"
                        lineClamp={3}
                        flex="1 1 auto"
                      >
                        {seed.kind === "voice" && seed.status === "processing" && (seed.body_text || "Transcribing voice note…")}
                        {seed.kind === "voice" && seed.status === "failed" && seed.transcript_error
                          ? seed.transcript_error
                          : null}
                        {(!seed.kind || seed.kind === "text" || seed.status === "ready") &&
                          (seed.body_text && seed.body_text.length > 169
                            ? `${seed.body_text.slice(0, 169)}…`
                            : seed.body_text || "Untitled")}
                      </Text>
                    )}
                    {seed.kind === "voice" && seed.audio_url && (
                      <Box flexShrink={0}>
                        {expandedAudioSeedId === seed.id ? (
                          <HStack gap={1}>
                            <Box
                              bg="gray.500"
                              borderRadius="md"
                              px={2}
                              py={1}
                              animation="seedAudioFade 140ms ease-out"
                            >
                              <audio
                                controls
                                src={seed.audio_url}
                                autoPlay
                                style={{ width: "150px", height: "22px" }}
                              />
                            </Box>
                            <IconButton
                              aria-label="Hide audio"
                              size="xs"
                              variant="ghost"
                              onClick={() => setExpandedAudioSeedId(null)}
                            >
                              <IconX size={14} />
                            </IconButton>
                          </HStack>
                        ) : (
                          <IconButton
                            aria-label="Play audio"
                            size="xs"
                            variant="solid"
                            bg="gray.500"
                            _hover={{ bg: "gray.600" }}
                            _active={{ bg: "gray.700" }}
                            minW="auto"
                            h="24px"
                            w="24px"
                            p={0}
                            onClick={() => setExpandedAudioSeedId(seed.id)}
                          >
                            <IconPlayerPlay size={14} />
                          </IconButton>
                        )}
                      </Box>
                    )}
                  </HStack>
                </Stack>
              </Box>
            ))}
        </Stack>
      </Box>

      <Box flex="0 0 35vh" h="35vh" borderTopWidth="1px" borderColor="theme.border" pt={3}>
        <Flex direction="column" h="100%" gap={2}>
          <Textarea
            value={text}
            onChange={(event) => handleChange(event.target.value)}
            placeholder="Capture a quick idea..."
            resize="none"
            flex="1 1 auto"
            disabled={!!voiceBlob}
          />
          {isPreparingMic && (
            <Text fontSize="xs" color="fg.muted">
              Starting microphone…
            </Text>
          )}
          {micError && (
            <Text fontSize="xs" color="fg.muted">
              {micError}
            </Text>
          )}
          {isRecording && (
            <Text fontSize="xs" color="fg.muted">
              Recording… {recordingSeconds}s
            </Text>
          )}
          <HStack
            justify="space-between"
            flex="0 0 auto"
            pb={`calc(max(env(safe-area-inset-bottom), ${bottomPad}px))`}
          >
            <HStack gap={2}>
              <IconButton
                aria-label={isRecording ? "Stop recording" : "Record voice note"}
                size="sm"
                variant={isRecording ? "solid" : "ghost"}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? <IconPlayerStop size={16} /> : <IconMicrophone size={16} />}
              </IconButton>
              <IconButton
                aria-label="Upload audio file"
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                <IconUpload size={16} />
              </IconButton>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                hidden
                onChange={(event) => {
                  const f = event.target.files?.[0];
                  if (f) void handleUploadFile(f);
                }}
              />
            </HStack>
            <Text color="fg.muted" fontSize="xs">
              Autosaves as you type
            </Text>
            <IconButton
              aria-label="Send seed"
              size="sm"
              variant="solid"
              onClick={handleSend}
              disabled={text.trim().length === 0 && !voiceBlob}
            >
              <IconSend size={16} />
            </IconButton>
          </HStack>
        </Flex>
      </Box>
      <style jsx global>{`
        body.seed-page footer {
          display: none !important;
        }
        body.seed-page main {
          height: 100vh !important;
          overflow: hidden !important;
          padding: 0 !important;
        }
        body.seed-page {
          overflow: hidden !important;
        }
        body.seed-page #main-content {
          height: 100vh !important;
          max-height: 100vh !important;
          overflow: hidden !important;
        }
        body.seed-page #main-content > * {
          height: 100% !important;
        }
        body.seed-page nav,
        body.seed-page header,
        body.seed-page .main-authenticated-layout > header,
        body.seed-page .main-authenticated-layout > nav {
          display: none !important;
        }
        .seed-fade-in {
          animation: seedFadeIn 220ms ease-out;
        }
        @keyframes seedAudioFade {
          from {
            opacity: 0;
            transform: translateY(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes seedFadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Flex>
  );
}
