"use client";

import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAtriumInitiativeLog } from "@mixtape/api/hooks/atrium";
import type { AtriumSession } from "@mixtape/core/types/atriumTypes";

interface AtriumInitiativeLogPanelProps {
  session: AtriumSession;
  defaultExpanded?: boolean;
}

type ViewMode = "all" | "user" | "claude";

// Markdown bubble styles — raw CSS for css prop (Chakra v3)
const mdBubbleCss = {
  fontSize: "1rem",
  lineHeight: "1.65",
  "& p": { marginBottom: "0.5rem" },
  "& p:last-child": { marginBottom: 0 },
  "& h1": { fontSize: "1.125rem", fontWeight: "700", marginTop: "0.75rem", marginBottom: "0.25rem" },
  "& h2": { fontSize: "1rem", fontWeight: "700", marginTop: "0.75rem", marginBottom: "0.25rem" },
  "& h3, & h4": { fontSize: "1rem", fontWeight: "600", marginTop: "0.75rem", marginBottom: "0.25rem" },
  "& h1:first-child, & h2:first-child, & h3:first-child": { marginTop: 0 },
  "& ul, & ol": { paddingLeft: "1.25rem", marginBottom: "0.5rem" },
  "& li": { marginBottom: "0.25rem" },
  "& code": { fontFamily: "monospace", fontSize: "0.875rem", padding: "0 3px", borderRadius: "3px", opacity: 0.85 },
  "& pre": { fontFamily: "monospace", fontSize: "0.875rem", padding: "0.5rem", borderRadius: "6px", overflowX: "auto", marginBottom: "0.5rem", opacity: 0.9 },
  "& blockquote": { borderLeft: "3px solid currentColor", paddingLeft: "0.75rem", opacity: 0.75, fontStyle: "italic", marginBottom: "0.5rem" },
  "& strong": { fontWeight: "700" },
  "& em": { fontStyle: "italic" },
  "& a": { textDecoration: "underline", opacity: 0.85 },
};

export function AtriumInitiativeLogPanel({ session, defaultExpanded = false }: AtriumInitiativeLogPanelProps) {
  const { entries, isLoading } = useAtriumInitiativeLog(
    session.initiative_id ? session.id : null
  );
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const headerBg = useColorModeValue("gray.100", "gray.750");
  const tabActiveBg = useColorModeValue("white", "gray.700");
  const tabActiveColor = useColorModeValue("gray.900", "gray.100");
  const tabInactiveColor = useColorModeValue("gray.400", "gray.500");

  const userBubbleBg = useColorModeValue("blue.500", "blue.400");
  const userBubbleColor = "white";
  const claudeBubbleBg = useColorModeValue("gray.100", "gray.700");
  const claudeBubbleColor = useColorModeValue("gray.900", "gray.100");

  if (!session.initiative_id) return null;

  const proseEntries = entries.filter((e) => e.kind === "prose");
  const userEntries = proseEntries.filter(
    (e) => e.authored_by !== "claude" && e.authored_by !== "system"
  );
  const claudeEntries = proseEntries.filter((e) => e.authored_by === "claude");

  const visible =
    viewMode === "user" ? userEntries
    : viewMode === "claude" ? claudeEntries
    : proseEntries;

  const tabCount = { all: proseEntries.length, user: userEntries.length, claude: claudeEntries.length };

  const tabs: { key: ViewMode; label: string }[] = [
    { key: "all", label: "All" },
    { key: "user", label: "Mine" },
    { key: "claude", label: "Claude" },
  ];

  return (
    <Box borderTopWidth="1px" borderColor={borderColor} mt={2}>
      {/* Header */}
      <Flex
        px={4}
        py={2.5}
        align="center"
        gap={2}
        bg={headerBg}
        cursor="pointer"
        onClick={() => setExpanded((v) => !v)}
        userSelect="none"
      >
        <Text
          fontSize="sm"
          fontWeight="700"
          color={labelColor}
          textTransform="uppercase"
          letterSpacing="wider"
          flex={1}
        >
          {session.initiative_title ?? "Source log"} — {proseEntries.length} turns
        </Text>
        <Text fontSize="md" color={labelColor}>
          {expanded ? "▲ collapse" : "▼ expand"}
        </Text>
      </Flex>

      {expanded && (
        <>
          {/* View mode tabs */}
          <Flex px={4} py={2} gap={1} bg={headerBg} borderBottomWidth="1px" borderColor={borderColor}>
            {tabs.map((tab) => {
              const active = viewMode === tab.key;
              return (
                <Box
                  key={tab.key}
                  as="button"
                  px={3}
                  py={1}
                  borderRadius="md"
                  bg={active ? tabActiveBg : "transparent"}
                  color={active ? tabActiveColor : tabInactiveColor}
                  fontWeight={active ? "600" : "400"}
                  fontSize="sm"
                  borderWidth={active ? "1px" : "0"}
                  borderColor={borderColor}
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); setViewMode(tab.key); }}
                  _hover={{ color: tabActiveColor }}
                  transition="all 0.1s"
                >
                  {tab.label} · {tabCount[tab.key]}
                </Box>
              );
            })}
          </Flex>

          {/* Scrollable entry list */}
          <Box maxH="560px" overflowY="auto" px={4} py={3}>
            {isLoading && (
              <Text fontSize="md" color={labelColor} mb={3}>Loading…</Text>
            )}

            <Flex direction="column" gap={3}>
              {visible.map((entry) => {
                const isUser = entry.authored_by !== "claude" && entry.authored_by !== "system";

                return (
                  <Flex
                    key={entry.id}
                    direction="column"
                    align={isUser ? "flex-end" : "flex-start"}
                  >
                    {/* Author + timestamp */}
                    <Text
                      fontSize="xs"
                      fontWeight="600"
                      color={labelColor}
                      textTransform="uppercase"
                      letterSpacing="wider"
                      mb={0.5}
                      px={1}
                    >
                      {isUser ? entry.authored_by : "Claude"}
                      {entry.source_timestamp && (
                        <Text as="span" fontWeight="400" ml={2} textTransform="none">
                          {new Date(entry.source_timestamp).toLocaleDateString()}
                        </Text>
                      )}
                      {!!entry.ledger_data?.document_ref && (
                        <Text as="span" fontWeight="400" ml={2} opacity={0.6}>
                          ↗ doc
                        </Text>
                      )}
                    </Text>

                    {/* Document reference card */}
                    {entry.ledger_data?.document_ref ? (
                      <Box
                        maxW="75%"
                        borderWidth="1px"
                        borderColor={isUser ? userBubbleBg : borderColor}
                        borderRadius={isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px"}
                        px={4}
                        py={3}
                      >
                        <Text fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wider" mb={1}>
                          Document
                        </Text>
                        <Text fontSize="md" fontWeight="600" color={isUser ? userBubbleBg : claudeBubbleColor} lineHeight="1.3">
                          {entry.ledger_data.document_title as string}
                        </Text>
                        <Text fontSize="sm" color={labelColor} mt={1}>
                          {entry.ledger_data.document_ref as string}
                          {entry.ledger_data.char_count
                            ? ` · ${Math.round((entry.ledger_data.char_count as number) / 1000)}k chars`
                            : ""}
                        </Text>
                      </Box>
                    ) : (
                      /* Conversational bubble */
                      <Box
                        maxW="75%"
                        bg={isUser ? userBubbleBg : claudeBubbleBg}
                        color={isUser ? userBubbleColor : claudeBubbleColor}
                        borderRadius={isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px"}
                        px={4}
                        py={2.5}
                        css={mdBubbleCss}
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {entry.body}
                        </ReactMarkdown>
                      </Box>
                    )}
                  </Flex>
                );
              })}
            </Flex>
          </Box>
        </>
      )}

      {!expanded && proseEntries.length > 0 && (
        <Box px={4} py={2}>
          <Text fontSize="md" color={labelColor} fontStyle="italic">
            {proseEntries.length} turns · {userEntries.length} mine · {claudeEntries.length} Claude — expand to read
          </Text>
        </Box>
      )}
    </Box>
  );
}
