// src/components/icons/IconMap.tsx

"use client";

import { Box, useCollapsibleContext } from "@chakra-ui/react";
import { useColorMode } from "@components/ui/color-mode";
import {
  IconSun,
  IconMoon,
  IconMenu2,
  IconX,
  IconChevronDown,
  IconChevronRight,
  IconUsersGroup,
  IconCircle,
} from "@tabler/icons-react";

export const Icons = {
  theme: {
    light: IconSun,
    dark: IconMoon,
  },
  nav: {
    open: IconX,
    closed: IconMenu2,
  },
  chevron: {
    down: IconChevronDown,
    right: IconChevronRight,
  },
  group: {
    community: IconUsersGroup,
    circle: IconCircle,
  },
};

export function ColorModeIcon() {
  const { colorMode } = useColorMode();
  const Icon = Icons.theme[colorMode === "dark" ? "dark" : "light"];
  return <Icon size={20} />;
}

export function NavToggleIcon({ open }: { open: boolean }) {
  const Icon = Icons.nav[open ? "open" : "closed"];
  return <Icon size={20} />;
}


export function ChevronIcon() {
  const { open } = useCollapsibleContext(); // from Ark under Chakra
  return (
    <Box
      as={IconChevronDown}
      boxSize={5}
      transform={open ? "rotate(180deg)" : "rotate(0deg)"}
      transition="transform 0.2s"
    />
  );
}