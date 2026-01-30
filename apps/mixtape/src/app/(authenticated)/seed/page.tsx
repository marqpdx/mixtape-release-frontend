// apps/mixtape/src/app/(authenticated)/seed/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
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
import { IconSend } from "@tabler/icons-react";
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
  const { seeds, loading } = useSeedList(20, refreshToken);

  const handleChange = (value: string) => {
    setText(value);
    schedule({ body_text: value });
  };

  const handleSelectSeed = (id: string, bodyText: string) => {
    setText(bodyText);
    attachExistingSeed(id, bodyText);
  };

  const handleSend = async () => {
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
                    {seed.body_text && seed.body_text.length > 169
                      ? `${seed.body_text.slice(0, 169)}…`
                      : seed.body_text || "Untitled"}
                  </Text>
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
          />
          <HStack justify="space-between" flex="0 0 auto">
            <IconButton aria-label="Voice note (coming soon)" size="sm" variant="ghost" disabled>
              Voice note
            </IconButton>
            <Text color="fg.muted" fontSize="xs">
              Autosaves as you type
            </Text>
            <IconButton
              aria-label="Send seed"
              size="sm"
              variant="solid"
              onClick={handleSend}
              disabled={text.trim().length === 0}
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
