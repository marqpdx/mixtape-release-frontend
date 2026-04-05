"use client";

import NextLink from "next/link";
import {
  Box,
  Button,
  Drawer,
  HStack,
  Link,
  Stack,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import type { DrawerRootProps } from "@chakra-ui/react";
import { Prose } from "@components/ui/prose";
import { HelpArticleSidebar } from "./HelpArticleSidebar";
import { useHelp } from "./useHelp";

export function HelpDrawer() {
  const {
    activeEntries,
    activeHelpKey,
    closeDrawer,
    isDrawerOpen,
    setActiveHelpKey,
  } = useHelp();
  const placement: DrawerRootProps["placement"] =
    useBreakpointValue({ base: "bottom", md: "end" }) ?? "end";
  const activeEntry =
    activeEntries.find((entry) => entry.key === activeHelpKey) ?? activeEntries[0] ?? null;

  return (
    <Drawer.Root open={isDrawerOpen} onOpenChange={(details) => !details.open && closeDrawer()} placement={placement} size="lg">
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content bg="bg">
          <Drawer.CloseTrigger />
          <Drawer.Header borderBottomWidth="1px" borderColor="border">
            <Stack gap={3}>
              <Text fontSize="sm" color="fg.muted" letterSpacing="0.18em" textTransform="uppercase">
                Help
              </Text>
              {activeEntries.length > 1 ? (
                <HStack gap={2} wrap="wrap" pr={8}>
                  {activeEntries.map((entry) => (
                    <Button
                      key={entry.key}
                      size="xs"
                      variant={entry.key === activeEntry?.key ? "solid" : "outline"}
                      onClick={() => setActiveHelpKey(entry.key)}
                    >
                      {entry.title}
                    </Button>
                  ))}
                </HStack>
              ) : null}
            </Stack>
          </Drawer.Header>
          <Drawer.Body>
            {activeEntry ? (
              <Stack gap={6}>
                <Stack gap={2}>
                  <Text fontSize="2xl" fontWeight="semibold" color="fg">
                    {activeEntry.title}
                  </Text>
                  {activeEntry.excerpt ? (
                    <Text fontSize="sm" color="fg.muted">
                      {activeEntry.excerpt}
                    </Text>
                  ) : null}
                  <Link asChild fontSize="sm" color="fg" textDecoration="underline" textUnderlineOffset="3px">
                    <NextLink href={`/help/${activeEntry.slug}`} onClick={closeDrawer}>
                      Open full help page
                    </NextLink>
                  </Link>
                </Stack>

                <Box display={{ base: "block", lg: "flex" }} gap={8}>
                  <Box display={{ base: "none", lg: "block" }} flex="0 0 220px">
                    <HelpArticleSidebar
                      headings={activeEntry.headings}
                      metadataLabel="SUBSYSTEM"
                      metadataValue={activeEntry.subsystem}
                    />
                  </Box>

                  <Box flex="1" minW={0}>
                    <Prose maxW="none" intent="article" dangerouslySetInnerHTML={{ __html: activeEntry.html }} />
                  </Box>
                </Box>
              </Stack>
            ) : (
              <Stack gap={3}>
                <Text fontSize="lg" fontWeight="semibold" color="fg">
                  Browse help
                </Text>
                <Text color="fg.muted">
                  We could not resolve a context-specific help article here yet.
                </Text>
                <Link asChild color="fg" textDecoration="underline" textUnderlineOffset="3px">
                  <NextLink href="/help" onClick={closeDrawer}>
                    Open the Help Hub
                  </NextLink>
                </Link>
              </Stack>
            )}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}
