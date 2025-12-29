// ============================================================================

// src/theme/recipes/select.recipe.ts - Updated Select recipe

import { defineSlotRecipe } from "@chakra-ui/react";

export const selectSlotRecipe = defineSlotRecipe({
  slots: ["root", "trigger", "content", "item", "indicator"],
  base: {
    root: {
      width: "100%",
      position: "relative",
    },
    trigger: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      minWidth: 0,
      outline: 0,
      position: "relative",
      appearance: "none",
      transitionProperty: "common",
      transitionDuration: "normal",
      bg: "bg.surface",
      borderColor: "border.default",
      color: "text.primary",
      cursor: "pointer",
      _disabled: {
        opacity: 0.4,
        cursor: "not-allowed",
      },
      _placeholder: {
        color: "text.secondary",
      },
    },
    content: {
      bg: "bg.surface",
      borderColor: "border.default",
      borderWidth: "1px",
      borderRadius: "md",
      shadow: "lg",
      zIndex: "dropdown",
      minW: "200px",
      maxH: "256px",
      overflowY: "auto",
    },
    item: {
      display: "flex",
      alignItems: "center",
      px: "3",
      py: "2",
      fontSize: "sm",
      cursor: "pointer",
      color: "text.primary",
      _hover: {
        bg: "bg.subtle",
      },
      _selected: {
        bg: "theme.accent",
        color: "white",
      },
      _disabled: {
        opacity: 0.4,
        cursor: "not-allowed",
      },
    },
    indicator: {
      color: "text.secondary",
      fontSize: "sm",
    },
  },
  variants: {
    size: {
      sm: {
        trigger: {
          fontSize: "sm",
          px: "3",
          h: "8",
          borderRadius: "sm",
        },
      },
      md: {
        trigger: {
          fontSize: "md",
          px: "3",
          h: "10",
          borderRadius: "md",
        },
      },
      lg: {
        trigger: {
          fontSize: "lg",
          px: "4",
          h: "12",
          borderRadius: "md",
        },
      },
    },
    variant: {
      outline: {
        trigger: {
          border: "1px solid",
          borderColor: "border.default",
          _hover: {
            borderColor: "theme.accent",
          },
          _focus: {
            borderColor: "theme.accent",
            boxShadow: "0 0 0 1px var(--theme-accent)",
          },
        },
      },
      filled: {
        trigger: {
          bg: "bg.subtle",
          border: "1px solid",
          borderColor: "transparent",
          _hover: {
            bg: "bg.surface",
            borderColor: "border.emphasis",
          },
          _focus: {
            bg: "bg.surface",
            borderColor: "theme.accent",
            boxShadow: "0 0 0 1px var(--theme-accent)",
          },
        },
      },
      ghost: {
        trigger: {
          bg: "transparent",
          border: "none",
          _hover: {
            bg: "bg.subtle",
          },
          _focus: {
            bg: "bg.surface",
            boxShadow: "0 0 0 1px var(--theme-accent)",
          },
        },
      },
    },
  },
  defaultVariants: {
    size: "md",
    variant: "outline",
  },
});
