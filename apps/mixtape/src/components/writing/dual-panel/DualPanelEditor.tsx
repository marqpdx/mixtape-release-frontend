"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  HStack,
  Textarea,
  Input,
  IconButton,
  Button,
} from "@chakra-ui/react";
import { IconArrowRight, IconPlus, IconTrash, IconCheck } from "@tabler/icons-react";

interface Section {
  id: string;
  heading: string;
  body: string;
}

interface Sponsor {
  type: "group" | "member";
  slug: string;
  displayName?: string;
}

interface DualPanelEditorProps {
  sponsor: Sponsor;
}

function makeId(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function newSection(heading = ""): Section {
  return { id: makeId(), heading, body: "" };
}

const DEFAULT_LEFT: Section[] = [{ id: "s-intro", heading: "Intro", body: "" }];

function loadState(key: string): { left: Section[]; right: Section[] } | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function DualPanelEditor({ sponsor }: DualPanelEditorProps) {
  const storageKey = `mx:dual-panel:${sponsor.type}:${sponsor.slug}`;

  const [left, setLeft] = useState<Section[]>(() => {
    const saved = loadState(storageKey);
    return saved?.left ?? DEFAULT_LEFT;
  });

  const [right, setRight] = useState<Section[]>(() => {
    const saved = loadState(storageKey);
    return saved?.right ?? [];
  });

  const [transferredIds, setTransferredIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ left, right }));
    } catch {}
  }, [left, right, storageKey]);

  const updateLeft = useCallback((id: string, patch: Partial<Section>) => {
    setLeft(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

  const updateRight = useCallback((id: string, patch: Partial<Section>) => {
    setRight(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

  const transfer = useCallback((section: Section) => {
    const norm = section.heading.toLowerCase().trim();
    setRight(prev => {
      const idx = norm ? prev.findIndex(s => s.heading.toLowerCase().trim() === norm) : -1;
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          body: next[idx].body
            ? `${next[idx].body}\n\n${section.body}`
            : section.body,
        };
        return next;
      }
      return [
        ...prev,
        { id: `r-${section.id}`, heading: section.heading, body: section.body },
      ];
    });
    setTransferredIds(prev => new Set([...prev, section.id]));
  }, []);

  return (
    <Flex className="dpe-root" minH="75vh" w="100%" align="stretch">
      {/* Draft panel */}
      <Box
        className="dpe-left"
        flex="1"
        borderRightWidth="1px"
        borderColor="border.muted"
        overflowY="auto"
      >
        <PanelHeader label="Draft" />
        <Box p={3}>
          {left.map(section => (
            <LeftSection
              key={section.id}
              section={section}
              transferred={transferredIds.has(section.id)}
              onUpdate={patch => updateLeft(section.id, patch)}
              onTransfer={() => transfer(section)}
              onRemove={() => setLeft(prev => prev.filter(s => s.id !== section.id))}
            />
          ))}
          <Button
            size="xs"
            variant="ghost"
            mt={1}
            onClick={() => setLeft(prev => [...prev, newSection()])}
          >
            <IconPlus size={12} />
            <Text ml={1}>Add section</Text>
          </Button>
        </Box>
      </Box>

      {/* Dispatch panel */}
      <Box className="dpe-right" flex="1" overflowY="auto">
        <PanelHeader label="Dispatch" />
        <Box p={3}>
          {right.length === 0 && (
            <Text
              fontSize="sm"
              color="fg.muted"
              fontStyle="italic"
              mb={4}
            >
              Use the → buttons on the Draft side to transfer sections here.
            </Text>
          )}
          {right.map(section => (
            <RightSection
              key={section.id}
              section={section}
              onUpdate={patch => updateRight(section.id, patch)}
              onRemove={() => setRight(prev => prev.filter(s => s.id !== section.id))}
            />
          ))}
          <Button
            size="xs"
            variant="ghost"
            mt={1}
            onClick={() => setRight(prev => [...prev, newSection()])}
          >
            <IconPlus size={12} />
            <Text ml={1}>Add section</Text>
          </Button>
        </Box>
      </Box>
    </Flex>
  );
}

function PanelHeader({ label }: { label: string }) {
  return (
    <Box
      className="dpe-panel-header"
      px={4}
      py={2}
      borderBottomWidth="1px"
      borderColor="border.muted"
      bg="bg.subtle"
      position="sticky"
      top={0}
      zIndex={1}
    >
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wider"
      >
        {label}
      </Text>
    </Box>
  );
}

interface LeftSectionProps {
  section: Section;
  transferred: boolean;
  onUpdate: (patch: Partial<Section>) => void;
  onTransfer: () => void;
  onRemove: () => void;
}

function LeftSection({ section, transferred, onUpdate, onTransfer, onRemove }: LeftSectionProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      className="dpe-section-left"
      position="relative"
      borderWidth="1px"
      borderColor={transferred ? "green.300" : "border.muted"}
      borderRadius="md"
      mb={3}
      overflow="hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <HStack
        px={3}
        py={1.5}
        bg="bg.subtle"
        borderBottomWidth="1px"
        borderColor="border.muted"
        gap={1}
      >
        <Input
          value={section.heading}
          onChange={e => onUpdate({ heading: e.target.value })}
          placeholder="Section heading…"
          size="xs"
          border="none"
          fontWeight="medium"
          flex={1}
          _focus={{ boxShadow: "none", outline: "none" }}
        />
        {transferred && (
          <Box color="green.500" flexShrink={0}>
            <IconCheck size={12} />
          </Box>
        )}
        {hovered && (
          <>
            <IconButton
              aria-label="Transfer to dispatch"
              size="xs"
              variant="ghost"
              colorPalette="blue"
              onClick={onTransfer}
            >
              <IconArrowRight size={14} />
            </IconButton>
            <IconButton
              aria-label="Remove section"
              size="xs"
              variant="ghost"
              colorPalette="gray"
              onClick={onRemove}
            >
              <IconTrash size={14} />
            </IconButton>
          </>
        )}
      </HStack>
      <Textarea
        value={section.body}
        onChange={e => onUpdate({ body: e.target.value })}
        placeholder="Write here…"
        size="sm"
        p={3}
        minH="80px"
        resize="vertical"
        border="none"
        _focus={{ outline: "none", boxShadow: "none" }}
      />
    </Box>
  );
}

interface RightSectionProps {
  section: Section;
  onUpdate: (patch: Partial<Section>) => void;
  onRemove: () => void;
}

function RightSection({ section, onUpdate, onRemove }: RightSectionProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      className="dpe-section-right"
      position="relative"
      borderWidth="1px"
      borderColor="border.muted"
      borderRadius="md"
      mb={3}
      overflow="hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <HStack
        px={3}
        py={1.5}
        bg="bg.subtle"
        borderBottomWidth="1px"
        borderColor="border.muted"
        gap={1}
      >
        <Input
          value={section.heading}
          onChange={e => onUpdate({ heading: e.target.value })}
          placeholder="Section heading…"
          size="xs"
          border="none"
          fontWeight="medium"
          flex={1}
          _focus={{ boxShadow: "none", outline: "none" }}
        />
        {hovered && (
          <IconButton
            aria-label="Remove section"
            size="xs"
            variant="ghost"
            colorPalette="gray"
            onClick={onRemove}
          >
            <IconTrash size={14} />
          </IconButton>
        )}
      </HStack>
      <Textarea
        value={section.body}
        onChange={e => onUpdate({ body: e.target.value })}
        placeholder="Write here…"
        size="sm"
        p={3}
        minH="80px"
        resize="vertical"
        border="none"
        _focus={{ outline: "none", boxShadow: "none" }}
      />
    </Box>
  );
}
