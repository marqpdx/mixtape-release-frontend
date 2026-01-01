// src/components/editor/ProgressiveWritingToolbar.tsx

import React, { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Badge,
  IconButton,
  Drawer,
} from "@chakra-ui/react";
import { Divider } from "@components/common/Divider";

interface ToolbarAction {
  id: string;
  icon: string;
  label: string;
  action: () => void;
  disabled?: boolean;
  loading?: boolean;
  badge?: string;
  badgeColor?: string;
}

interface ToolbarSection {
  title: string;
  actions: ToolbarAction[];
}

interface ProgressiveWritingToolbarProps {
  // Text editing actions
  onPolish?: () => void;
  onTighten?: () => void;
  onExpand?: () => void;

  // Content generation
  onSummary?: () => void;
  summaryReady?: boolean;
  summaryLoading?: boolean;

  // Research agents (placeholder for future)
  onResearch?: () => void;
  onFactCheck?: () => void;

  // Utilities
  onSave?: () => void;
  onClear?: () => void;
  onSettings?: () => void;

  // Status
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  isEditing?: boolean;
}

const Tooltip = ({ content, children }: { content: string; children: React.ReactNode }) => (
  <Box position="relative" display="inline-block">
    {children}
    <Box
      position="absolute"
      left="50%"
      bottom="100%"
      transform="translateX(-50%)"
      mb={2}
      px={2}
      py={1}
      bg="gray.800"
      color="white"
      fontSize="xs"
      borderRadius="md"
      whiteSpace="nowrap"
      opacity={0}
      pointerEvents="none"
      transition="opacity 0.2s"
      zIndex={1000}
      _groupHover={{ opacity: 1 }}
    >
      {content}
      <Box
        position="absolute"
        top="100%"
        left="50%"
        transform="translateX(-50%)"
        width={0}
        height={0}
        borderLeft="4px solid transparent"
        borderRight="4px solid transparent"
        borderTop="4px solid gray.800"
      />
    </Box>
  </Box>
);

const ToolbarButton = ({ action }: { action: ToolbarAction }) => (
  <Button
    key={action.id}
    variant="ghost"
    size="sm"
    width="100%"
    justifyContent="flex-start"
    onClick={action.action}
    disabled={action.disabled}
    loading={action.loading}
    position="relative"
    _hover={{
      bg: "gray.50",
      transform: "translateX(2px)",
    }}
    transition="all 0.2s"
  >
    <HStack width="100%" justify="space-between">
      <HStack gap={2}>
        <Text fontSize="lg">{action.icon}</Text>
        <Text fontSize="sm" fontWeight="medium">
          {action.label}
        </Text>
      </HStack>
      {action.badge && (
        <Badge
          size="sm"
          colorScheme={action.badgeColor || "blue"}
          variant="subtle"
        >
          {action.badge}
        </Badge>
      )}
    </HStack>
  </Button>
);

export default function ProgressiveWritingToolbar({
  onPolish = () => console.log("Polish"),
  onTighten = () => console.log("Tighten"),
  onExpand = () => console.log("Expand"),
  onSummary = () => console.log("Summary"),
  summaryReady = false,
  summaryLoading = false,
  onResearch = () => console.log("Research - Coming Soon!"),
  onFactCheck = () => console.log("Fact Check - Coming Soon!"),
  onSave = () => console.log("Save"),
  onClear = () => console.log("Clear"),
  onSettings = () => console.log("Settings"),
  saveStatus = 'idle',
  isEditing = false,
}: ProgressiveWritingToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Create toolbar sections
  const sections: ToolbarSection[] = [
    {
      title: "Text Editing",
      actions: [
        {
          id: "polish",
          icon: "✨",
          label: "Polish",
          action: onPolish,
          disabled: isEditing,
        },
        {
          id: "tighten",
          icon: "🔧",
          label: "Tighten",
          action: onTighten,
          disabled: isEditing,
        },
        {
          id: "expand",
          icon: "📈",
          label: "Expand",
          action: onExpand,
          disabled: isEditing,
        },
      ],
    },
    {
      title: "Content Generation",
      actions: [
        {
          id: "summary",
          icon: "📝",
          label: "Summary",
          action: onSummary,
          loading: summaryLoading,
          badge: summaryReady ? "Ready" : undefined,
          badgeColor: summaryReady ? "green" : undefined,
        },
      ],
    },
    {
      title: "Research & Verification",
      actions: [
        {
          id: "research",
          icon: "🔍",
          label: "Research",
          action: onResearch,
          disabled: true,
          badge: "Soon",
          badgeColor: "purple",
        },
        {
          id: "factcheck",
          icon: "✅",
          label: "Fact Check",
          action: onFactCheck,
          disabled: true,
          badge: "Soon",
          badgeColor: "purple",
        },
      ],
    },
    {
      title: "Utilities",
      actions: [
        {
          id: "save",
          icon: "💾",
          label: "Save",
          action: onSave,
          loading: saveStatus === 'saving',
          badge: saveStatus === 'saved' ? "Saved" : saveStatus === 'error' ? "Error" : undefined,
          badgeColor: saveStatus === 'saved' ? "green" : saveStatus === 'error' ? "red" : undefined,
        },
        {
          id: "clear",
          icon: "🧹",
          label: "Clear",
          action: onClear,
        },
        {
          id: "settings",
          icon: "⚙️",
          label: "Settings",
          action: onSettings,
        },
      ],
    },
  ];

  return (
    <>
      {/* Collapsed Trigger - Always visible, dimmed when closed */}
      <Box
        position="absolute"
        className="progressive-toolbar-trigger"
        top="4"
        // right="4"
        right={-10}
        zIndex={9999}
        opacity={isExpanded ? 0 : 0.8}  // Increased from 0.3 for debugging
        // bg="red.200"  // Temporary debug background
        border="2px solid gray"  // Temporary debug border
        _hover={{ opacity: isExpanded ? 0 : 0.8 }}
        transition="all 0.3s ease"
        pointerEvents={isExpanded ? "none" : "auto"}
      >
        <VStack gap={1} align="center">
          <Tooltip content="Open editing tools">
            <Box role="group">
              <IconButton
                aria-label="Open toolbar"
                size="sm"
                variant="ghost"
                bg="white"
                shadow="md"
                borderRadius="lg"
                _hover={{ bg: "gray.50", shadow: "lg" }}
                onClick={() => setIsExpanded(true)}
              >
                <Text fontSize="lg">🔧</Text>
              </IconButton>
            </Box>
          </Tooltip>

          {/* Placeholder dots to show there's more */}
          {[...Array(6)].map((_, i) => (
            <Box
              key={i}
              width="2"
              height="2"
              bg="gray.300"
              borderRadius="full"
              opacity={0.5}
            />
          ))}
        </VStack>
      </Box>

      {/* Expanded Drawer */}
      <Drawer.Root
        open={isExpanded}
        onOpenChange={({ open }: { open: boolean }) => setIsExpanded(open)}
        placement="end"
        size="sm"
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content
            bg="white"
            borderLeftRadius="2xl"
            shadow="2xl"
            borderLeft="1px solid"
            borderColor="gray.200"
          >
            {/* Header with open indicator */}
            <Drawer.Header py={4} borderBottom="1px solid" borderColor="gray.100">
              <VStack gap={2} align="stretch">
                <HStack justify="center">
                  <Text fontSize="lg">🔧</Text>
                  <Text fontSize="sm" fontWeight="bold" color="gray.700">
                    Editing Mode
                  </Text>
                </HStack>
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  AI-powered writing tools
                </Text>
              </VStack>
            </Drawer.Header>

            {/* Main toolbar content */}
            <Drawer.Body py={4} px={3}>
              <VStack gap={4} align="stretch">
                {sections.map((section, sectionIndex) => (
                  <Box key={section.title}>
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="gray.500"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      mb={2}
                    >
                      {section.title}
                    </Text>

                    <VStack gap={1} align="stretch">
                      {section.actions.map((action) => (
                        <ToolbarButton key={action.id} action={action} />
                      ))}
                    </VStack>

                    {sectionIndex < sections.length - 1 && (
                      <Box mt={3} opacity={0.3}>
                        <Divider />
                      </Box>
                    )}
                  </Box>
                ))}
              </VStack>
            </Drawer.Body>

            {/* Footer with close button */}
            <Drawer.Footer
              py={4}
              borderTop="1px solid"
              borderColor="gray.100"
              bg="gray.50"
            >
              <VStack gap={2} width="100%">
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  Close to return to writing mode
                </Text>
                <Button
                  variant="ghost"
                  size="sm"
                  width="100%"
                  onClick={() => setIsExpanded(false)}
                  _hover={{ bg: "gray.100" }}
                >
                  <HStack gap={2}>
                    <Text fontSize="lg">✕</Text>
                    <Text fontSize="sm" fontWeight="medium">
                      Back to Writing
                    </Text>
                  </HStack>
                </Button>
              </VStack>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </>
  );
}