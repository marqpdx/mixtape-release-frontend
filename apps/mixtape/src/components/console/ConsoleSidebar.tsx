// apps/mixtape/src/components/console/ConsoleSidebar.tsx

"use client";

import {
  Accordion,
  Badge,
  Box,
  Button,
  Checkbox,
  HStack,
  Input,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useHubCaptures, useOrientation, usePromoteCaptures, useResolveCapture, useStewardship } from "@hooks/console/useConsole";
import type { WorkTableContext } from "@components/worktable/types";

function SidebarSection({
  value,
  label,
  count,
  colorPalette,
  headerAction,
  children,
}: {
  value: string;
  label: string;
  count: number;
  colorPalette?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Accordion.Item value={value}>
      <Accordion.ItemTrigger>
        <HStack flex={1} gap={2}>
          <Text fontSize="sm" fontWeight="semibold">
            {label}
          </Text>
          {count > 0 && (
            <Badge size="sm" colorPalette={colorPalette ?? "gray"} variant="subtle">
              {count}
            </Badge>
          )}
          {headerAction && (
            <Box ml="auto" onClick={(e) => e.stopPropagation()}>
              {headerAction}
            </Box>
          )}
        </HStack>
        <Accordion.ItemIndicator />
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <Box pt={2} pb={1}>
          {children}
        </Box>
      </Accordion.ItemContent>
    </Accordion.Item>
  );
}

function EmptyNote({ text }: { text: string }) {
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  return (
    <Text fontSize="sm" color={mutedColor}>
      {text}
    </Text>
  );
}

export function ConsoleSidebar({
  context = { kind: "personal" },
  onInitiativeSelect,
}: {
  context?: WorkTableContext;
  onInitiativeSelect?: (ctx: WorkTableContext) => void;
}) {
  const groupSlug = context.kind === "group" ? context.slug : undefined;
  const { data: orientation, isLoading: orientationLoading } = useOrientation();
  const { data: stewardship, isLoading: stewardshipLoading } = useStewardship();
  const { data: fixData, isLoading: fixLoading } = useHubCaptures("fix", groupSlug);
  const { data: needMoreData, isLoading: needMoreLoading } = useHubCaptures("need_more", groupSlug);
  const resolveCapture = useResolveCapture();
  const promoteCaptures = usePromoteCaptures();

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [promoteTitle, setPromoteTitle] = useState("");
  const [promoting, setPromoting] = useState(false);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.750");
  const mutedColor = useColorModeValue("gray.400", "gray.500");

  const allInitiatives = orientation?.initiatives ?? [];

  // Split: current-context initiatives vs recent-from-others
  const contextInitiatives = allInitiatives.filter((ini) => {
    if (context.kind === "personal") return ini.sponsor_type === "personal";
    if (context.kind === "group") return ini.sponsor_type === "group" && ini.sponsor_slug === context.slug;
    return false; // initiative context: none in "current"
  });
  const otherInitiatives = allInitiatives
    .filter((ini) => !contextInitiatives.includes(ini))
    .slice(0, 5);

  const initiatives = allInitiatives; // keep for count badge
  const reminders = stewardship?.overdue_reminders ?? [];
  const fixes = fixData?.captures ?? [];
  const needMores = needMoreData?.captures ?? [];

  const isLoading = orientationLoading || stewardshipLoading || fixLoading || needMoreLoading;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
    setPromoteTitle("");
    setPromoting(false);
  }

  async function handlePromote() {
    if (!promoteTitle.trim() || selectedIds.size === 0) return;
    await promoteCaptures.mutateAsync({ captureIds: [...selectedIds], targetTitle: promoteTitle.trim() });
    exitSelectMode();
  }

  if (isLoading) {
    return (
      <VStack gap={2} align="stretch">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} h="44px" borderRadius="md" />
        ))}
      </VStack>
    );
  }

  return (
    <Accordion.Root collapsible defaultValue={["initiatives", "reminders"]}>
      {/* Open Initiatives */}
      <SidebarSection value="initiatives" label="Open Initiatives" count={initiatives.length} colorPalette="green">
        {initiatives.length === 0 ? (
          <EmptyNote text="No active initiatives." />
        ) : (
          <VStack gap={1} align="stretch">
            {/* Current-context initiatives */}
            {contextInitiatives.map((ini) => (
              <HStack
                key={ini.id}
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="md"
                px={3}
                py={2}
                _hover={{ bg: hoverBg }}
                cursor="pointer"
                justify="space-between"
                onClick={() => onInitiativeSelect?.({
                  kind: "initiative",
                  id: ini.id,
                  title: ini.title,
                  sponsor: ini.sponsor_type,
                })}
              >
                <Text fontSize="sm" flex={1} lineClamp={1}>
                  {ini.title}
                </Text>
                <Badge size="sm" colorPalette="green" variant="subtle">
                  {ini.status}
                </Badge>
              </HStack>
            ))}

            {/* Divider + recent from other contexts */}
            {otherInitiatives.length > 0 && (
              <>
                {contextInitiatives.length > 0 && (
                  <Text fontSize="xs" color={mutedColor} px={1} py={0.5} letterSpacing="wide">
                    ─────
                  </Text>
                )}
                {otherInitiatives.map((ini) => (
                  <HStack
                    key={ini.id}
                    bg={cardBg}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="md"
                    px={3}
                    py={1.5}
                    _hover={{ bg: hoverBg }}
                    cursor="pointer"
                    justify="space-between"
                    opacity={0.65}
                    onClick={() => onInitiativeSelect?.({
                      kind: "initiative",
                      id: ini.id,
                      title: ini.title,
                      sponsor: ini.sponsor_type,
                    })}
                  >
                    <Text fontSize="xs" flex={1} lineClamp={1}>
                      {ini.title}
                    </Text>
                    <Text fontSize="xs" color={mutedColor}>
                      {ini.sponsor_type === "personal" ? "personal" : ini.sponsor_slug ?? "group"}
                    </Text>
                  </HStack>
                ))}
              </>
            )}

            {contextInitiatives.length === 0 && otherInitiatives.length === 0 && (
              <EmptyNote text="No active initiatives." />
            )}
          </VStack>
        )}
      </SidebarSection>

      {/* Remind Me's */}
      <SidebarSection value="reminders" label="Remind Me's" count={reminders.length} colorPalette="orange">
        {reminders.length === 0 ? (
          <EmptyNote text="No overdue reminders." />
        ) : (
          <VStack gap={1} align="stretch">
            {reminders.map((r) => (
              <HStack
                key={r.id}
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="md"
                px={3}
                py={2}
                justify="space-between"
              >
                <Text fontSize="sm" flex={1} lineClamp={1}>
                  {r.title || r.body || "(reminder)"}
                </Text>
                <Text fontSize="xs" color="red.400">
                  {r.days_overdue}d
                </Text>
              </HStack>
            ))}
          </VStack>
        )}
      </SidebarSection>

      {/* Let's Fix's */}
      <SidebarSection value="letsFix" label="Let's Fix's" count={fixes.length} colorPalette="red">
        {fixes.length === 0 ? (
          <EmptyNote text="No open fixes." />
        ) : (
          <VStack gap={1} align="stretch">
            {fixes.map((c) => (
              <HStack
                key={c.id}
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="md"
                px={3}
                py={2}
                justify="space-between"
              >
                <Text fontSize="sm" flex={1} lineClamp={2}>
                  {c.body}
                </Text>
                <Text
                  fontSize="xs"
                  color={mutedColor}
                  cursor="pointer"
                  _hover={{ color: "green.400" }}
                  onClick={() => resolveCapture.mutate(c.id)}
                  flexShrink={0}
                  ml={2}
                >
                  ✓
                </Text>
              </HStack>
            ))}
          </VStack>
        )}
      </SidebarSection>

      {/* We Need More's */}
      <SidebarSection
        value="weNeedMore"
        label="We Need More's"
        count={needMores.length}
        colorPalette="blue"
        headerAction={
          needMores.length > 0 ? (
            <Text
              fontSize="xs"
              color={selectMode ? "blue.400" : mutedColor}
              cursor="pointer"
              onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            >
              {selectMode ? "cancel" : "select"}
            </Text>
          ) : undefined
        }
      >
        {needMores.length === 0 ? (
          <EmptyNote text="No open needs." />
        ) : (
          <VStack gap={1} align="stretch">
            {needMores.map((c) => (
              <HStack
                key={c.id}
                bg={selectMode && selectedIds.has(c.id) ? hoverBg : cardBg}
                border="1px solid"
                borderColor={selectMode && selectedIds.has(c.id) ? "blue.300" : borderColor}
                borderRadius="md"
                px={3}
                py={2}
                justify="space-between"
                cursor={selectMode ? "pointer" : "default"}
                onClick={selectMode ? () => toggleSelect(c.id) : undefined}
              >
                {selectMode && (
                  <Checkbox.Root
                    checked={selectedIds.has(c.id)}
                    size="sm"
                    flexShrink={0}
                    mr={1}
                    pointerEvents="none"
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>
                )}
                <Text fontSize="sm" flex={1} lineClamp={2}>
                  {c.body}
                </Text>
                {!selectMode && (
                  <Text
                    fontSize="xs"
                    color={mutedColor}
                    cursor="pointer"
                    _hover={{ color: "green.400" }}
                    onClick={(e) => { e.stopPropagation(); resolveCapture.mutate(c.id); }}
                    flexShrink={0}
                    ml={2}
                  >
                    ✓
                  </Text>
                )}
              </HStack>
            ))}

            {selectMode && selectedIds.size > 0 && (
              <VStack gap={2} mt={2} align="stretch">
                {!promoting ? (
                  <Button
                    size="sm"
                    colorPalette="blue"
                    variant="subtle"
                    onClick={() => setPromoting(true)}
                  >
                    Promote {selectedIds.size} to List →
                  </Button>
                ) : (
                  <HStack gap={2}>
                    <Input
                      size="sm"
                      placeholder="List title…"
                      value={promoteTitle}
                      onChange={(e) => setPromoteTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handlePromote(); }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      colorPalette="blue"
                      loading={promoteCaptures.isPending}
                      disabled={!promoteTitle.trim()}
                      onClick={handlePromote}
                    >
                      Go
                    </Button>
                  </HStack>
                )}
              </VStack>
            )}
          </VStack>
        )}
      </SidebarSection>
    </Accordion.Root>
  );
}
