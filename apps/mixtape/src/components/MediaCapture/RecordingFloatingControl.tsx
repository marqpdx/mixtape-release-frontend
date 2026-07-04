"use client";

import Link from "next/link";
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import {
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerStop,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMediaCapture } from "./MediaCaptureContext";

function formatTime(s: number) {
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function RecordingFloatingControl() {
  const queryClient = useQueryClient();
  const {
    pipelineState,
    elapsed,
    groupSlug,
    stopRecording,
    pauseRecording,
    resumeRecording,
    uploadRecording,
    reset,
    recordedBlob,
  } = useMediaCapture();

  const isActive =
    pipelineState === "recording" ||
    pipelineState === "paused" ||
    pipelineState === "stopped" ||
    pipelineState === "uploading" ||
    pipelineState === "processing" ||
    pipelineState === "ready";

  if (!isActive) return null;

  return (
    <Box
      className="mc-float"
      position="fixed"
      bottom={6}
      right={6}
      zIndex={9999}
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      shadow="lg"
      px={4}
      py={3}
      minW="220px"
    >
      <VStack gap={2} align="stretch">
        {/* Status line */}
        <HStack gap={2} justify="space-between">
          <HStack gap={2}>
            {(pipelineState === "recording") && (
              <Box
                w={2}
                h={2}
                bg="red.500"
                borderRadius="full"
                flexShrink={0}
                style={{ animation: "mc-pulse 1s ease-in-out infinite" }}
              />
            )}
            {pipelineState === "paused" && (
              <Box w={2} h={2} bg="orange.400" borderRadius="full" flexShrink={0} />
            )}
            <Text fontSize="sm" fontWeight="medium" fontVariantNumeric="tabular-nums">
              {pipelineState === "recording" && `Recording — ${formatTime(elapsed)}`}
              {pipelineState === "paused" && `Paused — ${formatTime(elapsed)}`}
              {pipelineState === "stopped" && "Recording ready"}
              {pipelineState === "uploading" && "Uploading…"}
              {pipelineState === "processing" && "Transcribing…"}
              {pipelineState === "ready" && groupSlug ? (
                <Link
                  href={`/groups/${groupSlug}/screencasts`}
                  style={{ textDecoration: "underline", color: "inherit" }}
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["media-captures"] });
                    reset();
                  }}
                >
                  Transcript ready
                </Link>
              ) : pipelineState === "ready" ? (
                "Transcript ready"
              ) : null}
            </Text>
          </HStack>

          {/* Dismiss only after completion */}
          {(pipelineState === "ready") && (
            <Button size="xs" variant="ghost" onClick={reset} aria-label="Dismiss">
              <IconX size={12} />
            </Button>
          )}
        </HStack>

        {/* Controls */}
        <HStack gap={2} justify="flex-end">
          {pipelineState === "recording" && (
            <>
              <Button size="xs" variant="outline" onClick={pauseRecording}>
                <IconPlayerPause size={13} />
                Pause
              </Button>
              <Button size="xs" colorPalette="red" onClick={stopRecording}>
                <IconPlayerStop size={13} />
                Stop
              </Button>
            </>
          )}

          {pipelineState === "paused" && (
            <>
              <Button size="xs" variant="outline" onClick={resumeRecording}>
                <IconPlayerPlay size={13} />
                Resume
              </Button>
              <Button size="xs" colorPalette="red" onClick={stopRecording}>
                <IconPlayerStop size={13} />
                Stop
              </Button>
            </>
          )}

          {pipelineState === "stopped" && recordedBlob && (
            <>
              <Button size="xs" variant="ghost" colorPalette="red" onClick={reset}>
                Discard
              </Button>
              <Button
                size="xs"
                colorPalette="green"
                onClick={() => uploadRecording()}
              >
                <IconUpload size={13} />
                Upload
              </Button>
            </>
          )}

          {(pipelineState === "uploading" || pipelineState === "processing") && (
            <Button size="xs" variant="ghost" colorPalette="red" onClick={reset}>
              Cancel
            </Button>
          )}
        </HStack>
      </VStack>

      <style>{`
        @keyframes mc-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </Box>
  );
}
