// packages/core/src/theme/theme-selector.tsx
"use client";

import * as React from "react";
import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  Popover,
  IconButton,
  Grid,
  Separator,
} from "@chakra-ui/react";
import { useTheme } from "./theme-context";
import type { FontScale, ThemeColors } from "./theme-context";

interface ColorSwatchProps {
  colors: ThemeColors | null | undefined;
  name: string;
  isActive: boolean;
  onClick: () => void;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({
  colors,
  name,
  isActive,
  onClick,
}) => {
  if (!colors) {
    return null;
  }

  return (
    <Box
      onClick={onClick}
      cursor="pointer"
      p={3}
      rounded="md"
      border="2px solid"
      borderColor={isActive ? "theme.accent" : "theme.border"}
      bg="theme.surface"
      _hover={{ transform: "translateY(-1px)", shadow: "md" }}
      transition="all 0.2s"
    >
      <VStack gap={2}>
        <HStack gap={1}>
          <Box
            w={3}
            h={3}
            rounded="sm"
            bg={colors.bg || "gray.100"}
            border="1px solid"
            borderColor="theme.border"
          />
          <Box
            w={3}
            h={3}
            rounded="sm"
            bg={colors.surface || "white"}
            border="1px solid"
            borderColor="theme.border"
          />
          <Box w={3} h={3} rounded="sm" bg={colors.accent || "gray.500"} />
        </HStack>
        <Text
          fontSize="xs"
          fontWeight={isActive ? "bold" : "medium"}
          color="theme.text"
          textAlign="center"
          lineHeight="tight"
        >
          {name}
        </Text>
      </VStack>
    </Box>
  );
};

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

const PaletteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="13.5" cy="6.5" r=".5" />
    <circle cx="17.5" cy="10.5" r=".5" />
    <circle cx="8.5" cy="7.5" r=".5" />
    <circle cx="6.5" cy="12.5" r=".5" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

export const ThemeSelector: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const themeContext = useTheme();

  if (!themeContext) {
    return (
      <HStack gap={2}>
        <IconButton aria-label="Toggle color mode" variant="ghost" color="gray.600">
          <MoonIcon />
        </IconButton>
        <Button variant="ghost" color="gray.600" fontSize="sm" loading>
          Loading...
        </Button>
      </HStack>
    );
  }

  const {
    currentTheme,
    colorMode,
    contrastMode,
    fontScale,
    setTheme,
    toggleColorMode,
    setContrastMode,
    setFontScale,
    availableThemes,
  } = themeContext;

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <HStack gap={2}>
      <IconButton
        aria-label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}
        onClick={toggleColorMode}
        variant="ghost"
        color="theme.text"
        _hover={{ bg: "theme.border" }}
        transition="all 0.2s"
      >
        {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
      </IconButton>

      <Popover.Root open={isOpen} onOpenChange={({ open }) => setIsOpen(open)}>
        <Popover.Trigger asChild>
          <Button
            variant="ghost"
            color="theme.text"
            _hover={{ bg: "theme.border" }}
            fontSize="sm"
            gap={2}
          >
            <PaletteIcon />
            <Text display={{ base: "none", md: "block" }}>
              {currentTheme?.name || "Gallery Minimal"}
            </Text>
          </Button>
        </Popover.Trigger>

        <Popover.Positioner>
          <Popover.Content
            bg="theme.surface"
            borderColor="theme.border"
            maxW="340px"
            shadow="xl"
            zIndex={9999}
          >
            <Popover.Body p={4}>
              <VStack gap={4} align="stretch">
                <Text fontSize="sm" fontWeight="semibold" color="theme.text">
                  Choose Your Theme
                </Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                  {availableThemes?.map((theme) => {
                    const themeColors = theme?.[colorMode];
                    if (!themeColors) return null;

                    return (
                      <ColorSwatch
                        key={theme.id}
                        colors={themeColors}
                        name={theme.name}
                        isActive={theme.id === currentTheme?.id}
                        onClick={() => handleThemeSelect(theme.id)}
                      />
                    );
                  })}
                </Grid>

                <Separator />

                <VStack gap={3} align="stretch">
                  <Text fontSize="sm" fontWeight="semibold" color="theme.text">
                    Accessibility
                  </Text>

                  <Box>
                    <Text fontSize="xs" fontWeight="medium" color="theme.text" mb={2}>
                      Contrast
                    </Text>
                    <HStack gap={2}>
                      <Button
                        size="sm"
                        variant={contrastMode === "normal" ? "solid" : "outline"}
                        onClick={() => setContrastMode("normal")}
                        flex={1}
                      >
                        Normal
                      </Button>
                      <Button
                        size="sm"
                        variant={contrastMode === "high" ? "solid" : "outline"}
                        onClick={() => setContrastMode("high")}
                        flex={1}
                      >
                        High
                      </Button>
                    </HStack>
                  </Box>

                  <Box>
                    <Text fontSize="xs" fontWeight="medium" color="theme.text" mb={2}>
                      Text Size
                    </Text>
                    <HStack gap={1}>
                      {[0.875, 1, 1.125, 1.25, 1.5].map((scale) => (
                        <Button
                          key={scale}
                          size="xs"
                          variant={fontScale === scale ? "solid" : "outline"}
                          onClick={() => setFontScale(scale as FontScale)}
                          flex={1}
                          fontSize={
                            scale === 0.875 ? "xs" : scale === 1.5 ? "md" : "sm"
                          }
                        >
                          {scale === 0.875
                            ? "S"
                            : scale === 1
                            ? "M"
                            : scale === 1.125
                            ? "L"
                            : scale === 1.25
                            ? "XL"
                            : "XXL"}
                        </Button>
                      ))}
                    </HStack>
                  </Box>
                </VStack>

                <Text fontSize="xs" color="theme.textSecondary" textAlign="center">
                  Changes apply instantly and are saved for your next visit
                </Text>
              </VStack>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Root>
    </HStack>
  );
};
