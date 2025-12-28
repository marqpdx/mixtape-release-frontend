// src/theme/recipes/input.recipe.ts - Updated with new semantic tokens

import { chakra, defineRecipe } from "@chakra-ui/react";

export const inputRecipe = defineRecipe({
  base: {
    width: "100%",
    minWidth: 0,
    outline: 0,
    position: "relative",
    appearance: "none",
    transitionProperty: "common",
    transitionDuration: "normal",
    paddingInline: "0.5em !important",
    // Use new semantic tokens
    bg: "bg.input",
    borderColor: "border.input",
    color: "text.primary",
    _placeholder: {
      color: "text.secondary",
    },
    _disabled: {
      opacity: 0.4,
      cursor: "not-allowed",
    },
  },
  variants: {
    size: {
      lg: {
        fontSize: "lg",
        px: "4",
        h: "12",
        borderRadius: "md"
      },
      md: {
        fontSize: "md",
        px: "3",
        h: "10",
        borderRadius: "md",
      },
      sm: {
        fontSize: "sm",
        px: "3",
        h: "8",
        borderRadius: "sm"
      },
      xs: {
        fontSize: "xs",
        px: "2",
        h: "6",
        borderRadius: "sm"
      },
    },
    variant: {
      outline: {
        border: "1px solid",
        borderColor: "border.default",
        bg: "bg.surface",
        _hover: {
          borderColor: "theme.accent",
        },
        _focus: {
          borderColor: "theme.accent",
          boxShadow: "0 0 0 1px var(--theme-accent)",
        },
      },
      filled: {
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
      flushed: {
        bg: "transparent",
        borderRadius: "0",
        px: "0",
        borderTop: "0",
        borderLeft: "0",
        borderRight: "0",
        borderBottom: "2px solid",
        borderColor: "border.default",
        _focus: {
          borderColor: "theme.accent",
          boxShadow: "0 1px 0 0 var(--theme-accent)",
        },
      },
      ghost: {
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
  defaultVariants: {
    size: "md",
    variant: "outline",
  },
});

export const Input = chakra("input", inputRecipe);
