"use client";

import NextLink from "next/link";
import { Box, Button, HStack, Link } from "@chakra-ui/react";

const HOME_VARIANTS = [
  { label: "0", href: "/" },
  { label: "1", href: "/page1" },
  { label: "2", href: "/page2" },
  { label: "3", href: "/page3" },
  { label: "4", href: "/page4" },
  { label: "5", href: "/page5" },
  { label: "6", href: "/page6" },
];

type HomeVariantSwitcherProps = {
  activeHref: string;
};

export default function HomeVariantSwitcher({ activeHref }: HomeVariantSwitcherProps) {
  return (
    <Box
      className="hmvs-root"
      position="fixed"
      right={{ base: "68px", md: "74px" }}
      bottom="18px"
      zIndex={1499}
    >
      <HStack
        className="hmvs-stack"
        gap="1"
        bg="theme.surface"
        color="theme.text"
        border="1px solid"
        borderColor="ui.borderSubtle"
        borderRadius="full"
        boxShadow="var(--ui-shadow-raised)"
        px="1.5"
        py="1.5"
        backdropFilter="blur(10px)"
      >
        {HOME_VARIANTS.map((variant) => {
          const isActive = variant.href === activeHref;
          return (
            <Button
              key={variant.href}
              asChild
              size="xs"
              minW="30px"
              h="30px"
              px="0"
              borderRadius="full"
              variant={isActive ? "solid" : "ghost"}
            >
              <Link
                color={isActive ? "theme.accentText" : "theme.text"}
                textDecoration="none"
                _hover={{ color: isActive ? "theme.accentText" : "theme.text" }}
                _focusVisible={{ outline: "3px solid", outlineColor: "ui.borderControl", outlineOffset: "2px" }}
                aria-current={isActive ? "page" : undefined}
                as={NextLink} href={variant.href} aria-label={`Open homepage variant ${variant.label}`}>
                {variant.label}
              </Link>
            </Button>
          );
        })}
      </HStack>
    </Box>
  );
}
