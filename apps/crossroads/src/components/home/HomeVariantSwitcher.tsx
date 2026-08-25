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
        bg="rgba(255, 255, 255, 0.94)"
        border="1px solid"
        borderColor="rgba(26, 33, 56, 0.12)"
        borderRadius="full"
        boxShadow="lg"
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
              bg={isActive ? "#1A2138" : "transparent"}
              color={isActive ? "#FFFFFF" : "#1A2138"}
              _hover={{
                bg: isActive ? "#1A2138" : "rgba(26, 33, 56, 0.08)",
              }}
            >
              <Link as={NextLink} href={variant.href} aria-label={`Open homepage variant ${variant.label}`}>
                {variant.label}
              </Link>
            </Button>
          );
        })}
      </HStack>
    </Box>
  );
}
