"use client";

import {
  Accordion,
  Badge,
  Box,
  HStack,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";
import { useColorModeValue } from "@components/ui/color-mode";
import { useOrientation, useStewardship } from "@hooks/console/useConsole";

function SidebarSection({
  value,
  label,
  count,
  colorPalette,
  children,
}: {
  value: string;
  label: string;
  count: number;
  colorPalette?: string;
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

export function ConsoleSidebar() {
  const { data: orientation, isLoading: orientationLoading } = useOrientation();
  const { data: stewardship, isLoading: stewardshipLoading } = useStewardship();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.750");

  const initiatives = orientation?.initiatives ?? [];
  const reminders = stewardship?.overdue_reminders ?? [];

  const isLoading = orientationLoading || stewardshipLoading;

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
            {initiatives.map((ini) => (
              <Link key={ini.id} href="/aperture">
                <HStack
                  bg={cardBg}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="md"
                  px={3}
                  py={2}
                  _hover={{ bg: hoverBg }}
                  cursor="pointer"
                  justify="space-between"
                >
                  <Text fontSize="sm" flex={1} lineClamp={1}>
                    {ini.title}
                  </Text>
                  <Badge size="sm" colorPalette="green" variant="subtle">
                    {ini.status}
                  </Badge>
                </HStack>
              </Link>
            ))}
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
      <SidebarSection value="letsFix" label="Let's Fix's" count={0}>
        <EmptyNote text="Hub items coming from mobile." />
      </SidebarSection>

      {/* We Need More's */}
      <SidebarSection value="weNeedMore" label="We Need More's" count={0}>
        <EmptyNote text="Hub items coming from mobile." />
      </SidebarSection>
    </Accordion.Root>
  );
}
