// Crossroads common buttons use the approved semantic roles in every mode.

import { chakra, defineRecipe } from "@chakra-ui/react";

export const buttonRecipe = defineRecipe({
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "medium",
    borderRadius: "md",
    transition: "all 0.2s ease-in-out",
    cursor: "pointer",
    focusVisibleRing: "outside",
    focusRingWidth: "3px",
    _focusVisible: {
      focusRingColor: "ui.borderControl",
      outlineOffset: "2px",
    },
    _disabled: {
      opacity: 0.4,
      cursor: "not-allowed",
    },
  },
  variants: {
    variant: {
      // Keep the checked accent/text pair, without fading it on hover.
      solid: {
        bg: "theme.accent",
        color: "theme.accentText",
        borderColor: "ui.borderControl",
        _hover: {
          bg: "theme.accent",
          opacity: 1,
          transform: "translateY(-1px)",
          boxShadow: "ui.shadowRaised",
        },
        _expanded: { bg: "theme.accent", color: "theme.accentText" },
        _active: { transform: "translateY(0)" },
      },

      // Accent colours are not guaranteed to be readable text on the canvas.
      outline: {
        borderWidth: "1px",
        borderColor: "ui.borderControl",
        color: "theme.text",
        bg: "transparent",
        _hover: {
          bg: "ui.surfaceSubtle",
          color: "theme.text",
          transform: "translateY(-1px)",
          boxShadow: "ui.shadowRaised",
        },
        _expanded: { bg: "ui.surfaceSubtle", color: "theme.text" },
        _active: { transform: "translateY(0)" },
      },

      ghost: {
        bg: "transparent",
        color: "theme.text",
        _hover: {
          bg: "ui.surfaceSubtle",
          transform: "translateY(-1px)",
        },
        _expanded: { bg: "ui.surfaceSubtle", color: "theme.text" },
        _active: { transform: "translateY(0)" },
      },

      subtle: {
        bg: "ui.surfaceSubtle",
        color: "theme.text",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "ui.borderControl",
        _hover: {
          bg: "theme.surface",
          transform: "translateY(-1px)",
          boxShadow: "ui.shadowRaised",
        },
        _expanded: { bg: "theme.surface", color: "theme.text" },
        _active: { transform: "translateY(0)" },
      },

      // LEGACY: Keep existing variants for backward compatibility
      solidMain1: {
        bg: "brandMain1.600",
        color: "white",
        _hover: {
          bg: "brandMain1.500",
          transform: "translateY(-1px)",
          boxShadow: "md",
        },
        _dark: {
          bg: "brandMain1.300",
          color: "gray.900",
          _hover: { bg: "brandMain1.400" },
        },
      },

      solidCenter: {
        bg: "brandCenter.500",
        color: "white",
        _hover: {
          bg: "brandCenter.600",
          transform: "translateY(-1px)",
          boxShadow: "md",
        },
        _dark: {
          bg: "brandCenter.300",
          color: "gray.900",
          _hover: { bg: "brandCenter.400" },
        },
      },

      outlineMain1: {
        borderWidth: "1px",
        borderColor: "brandMain1.500",
        color: "brandMain1.700",
        bg: "transparent",
        _hover: {
          bg: "brandMain1.50",
          transform: "translateY(-1px)",
        },
        _dark: {
          borderColor: "brandMain1.300",
          color: "brandMain1.300",
          _hover: { bg: "brandMain1.900" },
        },
      },
    },

    size: {
      xs: {
        px: "2",
        py: "1",
        fontSize: "xs",
        minH: "6",
      },
      sm: {
        px: "3",
        py: "1.5",
        fontSize: "sm",
        minH: "8",
      },
      md: {
        px: "4",
        py: "2",
        fontSize: "md",
        minH: "10",
      },
      lg: {
        px: "6",
        py: "3",
        fontSize: "lg",
        minH: "12",
      },
      xl: {
        px: "8",
        py: "4",
        fontSize: "xl",
        minH: "14",
      },
    },

        colorScheme: {
      // Override with specific color schemes when needed
      red: {
        "&[data-variant=solid]": {
          bg: "red.500",
          color: "white",
          _hover: { bg: "red.600" },
        },
        "&[data-variant=outline]": {
          borderColor: "red.500",
          color: "red.500",
          _hover: { bg: "red.500", color: "white" },
        },
        "&[data-variant=ghost]": {
          color: "red.500",
          _hover: { bg: "red.50" },
        },
      },
      green: {
        "&[data-variant=solid]": {
          bg: "green.500",
          color: "white",
          _hover: { bg: "green.600" },
        },
        "&[data-variant=outline]": {
          borderColor: "green.500",
          color: "green.500",
          _hover: { bg: "green.500", color: "white" },
        },
        "&[data-variant=ghost]": {
          color: "green.500",
          _hover: { bg: "green.50" },
        },
      },

      // NEW: blue, purple, yellow
      blue: {
        "&[data-variant=solid]": {
          bg: "blue.500",
          color: "white",
          _hover: { bg: "blue.600" },
        },
        "&[data-variant=outline]": {
          borderColor: "blue.500",
          color: "blue.500",
          _hover: { bg: "blue.500", color: "white" },
        },
        "&[data-variant=ghost]": {
          color: "blue.500",
          _hover: { bg: "blue.50" },
        },
      },
      purple: {
        "&[data-variant=solid]": {
          bg: "purple.500",
          color: "white",
          _hover: { bg: "purple.600" },
        },
        "&[data-variant=outline]": {
          borderColor: "purple.500",
          color: "purple.500",
          _hover: { bg: "purple.500", color: "white" },
        },
        "&[data-variant=ghost]": {
          color: "purple.500",
          _hover: { bg: "purple.50" },
        },
      },
      yellow: {
        "&[data-variant=solid]": {
          bg: "yellow.500",
          color: "black",
          _hover: { bg: "yellow.600" },
        },
        "&[data-variant=outline]": {
          borderColor: "yellow.500",
          color: "yellow.700",
          _hover: { bg: "yellow.500", color: "black" },
        },
        "&[data-variant=ghost]": {
          color: "yellow.700",
          _hover: { bg: "yellow.50" },
        },
      },
      gray: {
        "&[data-variant=solid]": {
          bg: "gray.500",
          color: "black",
          _hover: { bg: "gray.600" },
        },
        "&[data-variant=outline]": {
          borderColor: "gray.500",
          color: "gray.700",
          _hover: { bg: "gray.500", color: "black" },
        },
        "&[data-variant=ghost]": {
          color: "gray.700",
          _hover: { bg: "gray.50" },
        },
      },
    },

  },

  defaultVariants: {
    variant: "solid", // Now defaults to dynamic theme color instead of green
    size: "md",
  },
});

export const Button = chakra("button", buttonRecipe);

