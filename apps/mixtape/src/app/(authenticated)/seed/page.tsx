// apps/mixtape/src/app/(authenticated)/seed/page.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { IconMicrophone, IconPlayerStop, IconSend, IconUpload } from "@tabler/icons-react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { useSeedAutosave } from "@/lib/writing/useSeedAutosave";
import { useSeedList } from "@/lib/writing/useSeedList";

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
  const { seeds, loading, refetch } = useSeedList(20, refreshToken);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (value: string) => {
    setText(value);
    schedule({ body_text: value });
  };

  const handleSelectSeed = (id: string, bodyText: string) => {
    setText(bodyText);
    attachExistingSeed(id, bodyText);
  };

  const handleSend = async () => {
    if (voiceBlob) {
      const form = new FormData();
      form.append("audio_file", voiceBlob, "seed-voice.webm");
      form.append("kind", "voice");
      form.append("source", "web");
      await axiosInstance.post("/api/writing/seeds", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (voiceUrl) {
        URL.revokeObjectURL(voiceUrl);
      }
      setVoiceBlob(null);
      setVoiceUrl(null);
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
    return () => body.classList.remove("seed-page");
  }, []);

  useEffect(() => {
    const hasProcessing = seeds.some((seed) => seed.status === "processing");
    if (!hasProcessing) return;
    const interval = window.setInterval(() => {
      void refetch();
    }, 7000);
    return () => window.clearInterval(interval);
  }, [seeds, refetch]);

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      setVoiceBlob(blob);
      const url = URL.createObjectURL(blob);
      setVoiceUrl(url);
      stream.getTracks().forEach((track) => track.stop());
    };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      // Permission denied or no mic available
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
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
    <Flex direction="column" h="100vh" overflow="hidden" gap={4}>
      <Box flex="0 0 60vh" h="60vh" overflowY="auto">
        <Stack gap={3}>
          {loading && <Text color="fg.muted">Loading seeds...</Text>}
          {!loading && seeds.length === 0 && <Text color="fg.muted">No seeds yet.</Text>}
          {!loading &&
            seeds.map((seed) => (
              <Box
                key={seed.id}
                borderWidth="1px"
                borderColor="theme.border"
                borderRadius="md"
                p={3}
                cursor="pointer"
                onClick={() => handleSelectSeed(seed.id, seed.body_text || "")}
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
                  </HStack>
                  <Text
                    whiteSpace="pre-wrap"
                    lineClamp={3}
                    className={seed.id === seedId ? "seed-fade-in" : undefined}
                  >
                    {seed.kind === "voice" && seed.status === "processing" && "Transcribing…"}
                    {seed.kind === "voice" && seed.status === "failed" && seed.transcript_error
                      ? seed.transcript_error
                      : null}
                    {(!seed.kind || seed.kind === "text" || seed.status === "ready") &&
                      (seed.body_text && seed.body_text.length > 169
                        ? `${seed.body_text.slice(0, 169)}…`
                        : seed.body_text || "Untitled")}
                  </Text>
                  {seed.kind === "voice" && seed.audio_url && (
                    <Box pt={1}>
                      <audio controls src={seed.audio_url} />
                    </Box>
                  )}
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
          {voiceUrl && (
            <Box>
              <audio controls src={voiceUrl} />
            </Box>
          )}
          <HStack justify="space-between" flex="0 0 auto">
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
