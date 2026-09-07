"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Box, Text, VStack } from "@chakra-ui/react";
import { Tooltip } from "@components/ui/tooltip";
import { useColorModeValue } from "@components/ui/color-mode";

type SurfaceDef = {
  id: string;
  label: string;
  icon: string;
  href: string;
};

function buildSurfaces(groupSlug: string): SurfaceDef[] {
  return [
    { id: "reception", label: "Reception", icon: "↓", href: `/groups/${groupSlug}/reception` },
    { id: "workshop", label: "Workshop", icon: "⊞", href: `/groups/${groupSlug}/workshop` },
    { id: "atrium", label: "Atrium", icon: "◈", href: `/groups/${groupSlug}/atrium` },
    { id: "catalyst", label: "Catalyst", icon: "⦿", href: `/groups/${groupSlug}/catalyst` },
  ];
}

export function GroupSurfaceLeftRail({ groupSlug, dimmed = false }: { groupSlug: string; dimmed?: boolean }) {
  const pathname = usePathname();
  const surfaces = buildSurfaces(groupSlug);

  const railBg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const activeItemBg = useColorModeValue("indigo.50", "gray.800");
  const activeItemBorder = useColorModeValue("indigo.400", "indigo.500");
  const activeIconColor = useColorModeValue("indigo.600", "indigo.400");
  const activeLabel = useColorModeValue("indigo.700", "indigo.300");
  const hoverBg = useColorModeValue("gray.50", "gray.800");

  return (
    <Box
      className="gsr-root"
      as="nav"
      w={dimmed ? "56px" : { base: "56px", md: "168px" }}
      minH="100%"
      bg={railBg}
      borderRight="1px solid"
      borderColor={borderColor}
      flexShrink={0}
      py={4}
    >
      <VStack className="gsr-items" gap={1} align="stretch" px={2}>
        {surfaces.map((surface) => {
          const isActive = pathname?.endsWith(`/groups/${groupSlug}/${surface.id}`);
          return (
            <Tooltip
              key={surface.id}
              content={surface.label}
              positioning={{ placement: "right" }}
              showArrow
              openDelay={400}
              disabled={{ base: false, md: true } as unknown as boolean}
            >
              <Box
                className={`gsr-item gsr-item-${surface.id}`}
                asChild
                display="flex"
                alignItems="center"
                gap={3}
                px={3}
                py="10px"
                borderRadius="md"
                borderLeft="3px solid"
                borderLeftColor={isActive ? activeItemBorder : "transparent"}
                bg={isActive ? activeItemBg : "transparent"}
                _hover={{ bg: isActive ? activeItemBg : hoverBg, textDecoration: "none" }}
                transition="background 0.12s"
              >
                <NextLink href={surface.href}>
                  <Text
                    className="gsr-item-icon"
                    fontSize="lg"
                    lineHeight="1"
                    color={isActive ? activeIconColor : labelColor}
                    flexShrink={0}
                  >
                    {surface.icon}
                  </Text>
                  <Text
                    className="gsr-item-label"
                    display={dimmed ? "none" : { base: "none", md: "block" }}
                    fontSize="xs"
                    fontWeight={isActive ? "600" : "400"}
                    color={isActive ? activeLabel : labelColor}
                    letterSpacing="0.01em"
                  >
                    {surface.label}
                  </Text>
                </NextLink>
              </Box>
            </Tooltip>
          );
        })}
      </VStack>
    </Box>
  );
}
