"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  HStack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";

// ── Types ─────────────────────────────────────────────────────────────────────

type CaptureSignal = "act" | "hold" | "explicit-hold" | "explicit-dispatch" | null;
type CaptureState = "tray" | "queue" | "backlogged" | "routed";
type HandoffDestination = "atrium" | "workshop" | "catalyst";

type CaptureItem = {
  id: string;
  text: string;
  signal: CaptureSignal;
  capturedAt: Date;
  state: CaptureState;
  destination?: HandoffDestination;
};

// ── Grist grammar parser ───────────────────────────────────────────────────────

function parseGristSignal(text: string): CaptureSignal {
  const t = text.trim();
  if (/\/go\b/.test(t)) return "explicit-dispatch";
  if (/\/wait\b/.test(t)) return "explicit-hold";
  if (t.endsWith(".")) return "act";
  if (t.endsWith("…") || t.endsWith("...")) return "hold";
  return null;
}

function stripGristSignal(text: string): string {
  return text
    .trim()
    .replace(/\/go\b/, "")
    .replace(/\/wait\b/, "")
    .replace(/[.…]+$/, "")
    .trim();
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function GristHint({ text }: { text: string }) {
  const signal = parseGristSignal(text);
  const hintColor = useColorModeValue("indigo.500", "indigo.400");
  const mutedColor = useColorModeValue("gray.400", "gray.500");

  const hints: Record<NonNullable<CaptureSignal>, string> = {
    act: "· will act now",
    hold: "· will hold",
    "explicit-hold": "· held (/wait)",
    "explicit-dispatch": "· dispatching (/go)",
  };

  if (!signal || !text.trim()) return null;
  return (
    <Text fontSize="xs" color={signal === "hold" || signal === "explicit-hold" ? mutedColor : hintColor}>
      {hints[signal]}
    </Text>
  );
}

function TrayItem({
  item,
  groupSlug,
  onEnter,
  onPlace,
  onDelegate,
}: {
  item: CaptureItem;
  groupSlug: string;
  onEnter: (id: string, dest: HandoffDestination) => void;
  onPlace: (id: string) => void;
  onDelegate: (id: string) => void;
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const mutedColor = useColorModeValue("gray.400", "gray.500");
  const [showDestPicker, setShowDestPicker] = useState(false);

  const destinations: { id: HandoffDestination; label: string; icon: string }[] = [
    { id: "atrium", label: "Atrium", icon: "◈" },
    { id: "workshop", label: "Workshop", icon: "⊞" },
    { id: "catalyst", label: "Catalyst", icon: "⦿" },
  ];

  return (
    <Box
      className="rec-tray-item"
      bg={cardBg}
      border="1px solid"
      borderColor={cardBorder}
      borderRadius="md"
      p={4}
    >
      <Text className="rec-tray-text" fontSize="sm" color={textColor} mb={3}>
        {item.text}
      </Text>
      {!showDestPicker ? (
        <HStack className="rec-tray-actions" gap={2} flexWrap="wrap">
          <Button
            size="xs"
            variant="outline"
            onClick={() => setShowDestPicker(true)}
          >
            Enter →
          </Button>
          <Button
            size="xs"
            variant="ghost"
            color={mutedColor}
            onClick={() => onPlace(item.id)}
          >
            Place
          </Button>
          <Button
            size="xs"
            variant="ghost"
            color={mutedColor}
            onClick={() => onDelegate(item.id)}
          >
            Delegate
          </Button>
        </HStack>
      ) : (
        <HStack className="rec-tray-dest-picker" gap={2} flexWrap="wrap">
          <Text fontSize="xs" color={mutedColor}>Enter →</Text>
          {destinations.map((d) => (
            <Button
              key={d.id}
              size="xs"
              variant="outline"
              onClick={() => {
                setShowDestPicker(false);
                onEnter(item.id, d.id);
              }}
            >
              {d.icon} {d.label}
            </Button>
          ))}
          <Button
            size="xs"
            variant="ghost"
            color={mutedColor}
            onClick={() => setShowDestPicker(false)}
          >
            ✕
          </Button>
        </HStack>
      )}
    </Box>
  );
}

function QueueItem({ item, onRoute }: { item: CaptureItem; onRoute: (id: string) => void }) {
  const cardBg = useColorModeValue("gray.50", "gray.850");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const mutedColor = useColorModeValue("gray.400", "gray.500");
  const backlogColor = useColorModeValue("amber.600", "amber.400");

  const ageMs = Date.now() - item.capturedAt.getTime();
  const isBacklogged = item.state === "backlogged" || ageMs > 48 * 60 * 60 * 1000;

  return (
    <HStack
      className="rec-queue-item"
      bg={cardBg}
      border="1px solid"
      borderColor={cardBorder}
      borderRadius="md"
      px={4}
      py={3}
      justify="space-between"
    >
      <Text fontSize="sm" color={textColor} flex="1" mr={4}>{item.text}</Text>
      <HStack gap={2} flexShrink={0}>
        {isBacklogged && (
          <Text fontSize="xs" color={backlogColor}>backlogged</Text>
        )}
        <Button size="xs" variant="ghost" color={mutedColor} onClick={() => onRoute(item.id)}>
          Route
        </Button>
      </HStack>
    </HStack>
  );
}

function OrientationSection() {
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.100", "gray.700");
  const emptyColor = useColorModeValue("gray.300", "gray.600");

  const panels = [
    { label: "Recent · Active", empty: "No recent activity" },
    { label: "Remindful", empty: "Nothing unresolved" },
    { label: "Due · Approaching", empty: "Nothing approaching" },
  ];

  return (
    <Box className="rec-orientation">
      <Text
        fontSize="xs"
        fontWeight="600"
        letterSpacing="0.1em"
        textTransform="uppercase"
        color={labelColor}
        mb={3}
      >
        Orientation
      </Text>
      <HStack className="rec-orientation-panels" gap={3} align="start" flexWrap={{ base: "wrap", md: "nowrap" }}>
        {panels.map((panel) => (
          <Box
            key={panel.label}
            className="rec-orientation-panel"
            flex="1"
            minW={{ base: "100%", md: "0" }}
            bg={cardBg}
            border="1px solid"
            borderColor={cardBorder}
            borderRadius="md"
            p={4}
          >
            <Text fontSize="xs" fontWeight="600" color={labelColor} mb={2}>
              {panel.label}
            </Text>
            <Text fontSize="xs" color={emptyColor}>{panel.empty}</Text>
          </Box>
        ))}
      </HStack>
    </Box>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ReceptionSurface({ groupSlug }: { groupSlug: string }) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [tray, setTray] = useState<CaptureItem[]>([]);
  const [queue, setQueue] = useState<CaptureItem[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const bg = useColorModeValue("gray.50", "gray.950");
  const inputBg = useColorModeValue("white", "gray.900");
  const inputBorder = useColorModeValue("gray.300", "gray.600");
  const inputFocusBorder = useColorModeValue("indigo.400", "indigo.500");
  const placeholderColor = useColorModeValue("gray.400", "gray.500");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const sectionDivider = useColorModeValue("gray.200", "gray.700");

  function submitCapture() {
    const text = inputValue.trim();
    if (!text) return;

    const signal = parseGristSignal(text);
    const cleanText = stripGristSignal(text) || text;

    const item: CaptureItem = {
      id: crypto.randomUUID(),
      text: cleanText,
      signal,
      capturedAt: new Date(),
      state: signal === "hold" || signal === "explicit-hold" ? "queue" : "tray",
    };

    if (item.state === "queue") {
      setQueue((q) => [item, ...q]);
    } else {
      setTray((t) => [item, ...t]);
    }

    setInputValue("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitCapture();
    }
  }

  function handleEnter(id: string, dest: HandoffDestination) {
    setTray((t) => t.filter((i) => i.id !== id));
    router.push(`/app/groups/${groupSlug}/${dest}`);
  }

  function handlePlace(id: string) {
    setTray((t) => t.filter((i) => i.id !== id));
  }

  function handleDelegate(id: string) {
    setTray((t) => t.filter((i) => i.id !== id));
  }

  function handleQueueRoute(id: string) {
    const item = queue.find((i) => i.id === id);
    if (!item) return;
    setQueue((q) => q.filter((i) => i.id !== id));
    setTray((t) => [{ ...item, state: "tray" }, ...t]);
  }

  return (
    <Box className="rec-surface" bg={bg} flex="1" px={{ base: 5, md: 8 }} py={6}>
      <VStack className="rec-surface-inner" gap={8} align="stretch" maxW="680px">

        {/* Capture input — top of surface, per ADR */}
        <Box className="rec-capture">
          <Textarea
            ref={textareaRef}
            className="rec-capture-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What needs your attention?"
            rows={3}
            resize="none"
            bg={inputBg}
            border="1px solid"
            borderColor={inputBorder}
            borderRadius="md"
            fontSize="sm"
            color={useColorModeValue("gray.800", "gray.100")}
            _placeholder={{ color: placeholderColor }}
            _focus={{ borderColor: inputFocusBorder, boxShadow: "none", outline: "none" }}
            mb={2}
          />
          <HStack justify="space-between" align="center">
            <GristHint text={inputValue} />
            <HStack gap={2}>
              <Text fontSize="xs" color={placeholderColor}>↵ capture</Text>
              <Button
                size="xs"
                colorPalette="indigo"
                variant="solid"
                onClick={submitCapture}
                disabled={!inputValue.trim()}
              >
                Capture
              </Button>
            </HStack>
          </HStack>
        </Box>

        {/* Tray */}
        {tray.length > 0 && (
          <Box className="rec-tray">
            <Text
              fontSize="xs"
              fontWeight="600"
              letterSpacing="0.1em"
              textTransform="uppercase"
              color={labelColor}
              mb={3}
            >
              Tray
            </Text>
            <VStack gap={2} align="stretch">
              {tray.map((item) => (
                <TrayItem
                  key={item.id}
                  item={item}
                  groupSlug={groupSlug}
                  onEnter={handleEnter}
                  onPlace={handlePlace}
                  onDelegate={handleDelegate}
                />
              ))}
            </VStack>
          </Box>
        )}

        {/* Queue */}
        {queue.length > 0 && (
          <Box className="rec-queue">
            <Text
              fontSize="xs"
              fontWeight="600"
              letterSpacing="0.1em"
              textTransform="uppercase"
              color={labelColor}
              mb={3}
            >
              Queue
            </Text>
            <VStack gap={2} align="stretch">
              {queue.map((item) => (
                <QueueItem key={item.id} item={item} onRoute={handleQueueRoute} />
              ))}
            </VStack>
          </Box>
        )}

        {/* Divider before orientation */}
        {(tray.length > 0 || queue.length > 0) && (
          <Box h="1px" bg={sectionDivider} />
        )}

        {/* Orientation */}
        <OrientationSection />

      </VStack>
    </Box>
  );
}
