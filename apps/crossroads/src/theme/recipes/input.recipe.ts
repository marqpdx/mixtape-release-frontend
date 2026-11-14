// Crossroads controls share the approved semantic roles, including high contrast.

import { chakra, defineRecipe } from "@chakra-ui/react";

// Shared with textarea; keep single-line sizing out of the multiline recipe.
export const controlColors = {
  bg: "theme.surface",
  color: "theme.text",
  borderColor: "ui.borderControl",
  "--focus-color": "colors.ui.borderControl",
  "--error-color": "colors.status.danger.fg",
  focusRingColor: "ui.borderControl",
  focusRingWidth: "3px",
  _placeholder: { color: "theme.textPlaceholder", opacity: 1 },
  _focusVisible: {
    focusRingColor: "ui.borderControl",
    outline: "3px solid",
    outlineColor: "ui.borderControl",
    outlineOffset: "2px",
    _invalid: { outlineColor: "status.danger.fg", focusRingColor: "status.danger.fg" },
  },
  _invalid: {
    borderColor: "status.danger.fg",
    borderBottomColor: "status.danger.fg",
    focusRingColor: "status.danger.fg",
  },
};

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
    ...controlColors,
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
        focusVisibleRing: "outside",
        focusRingColor: "ui.borderControl",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "ui.borderControl",
        bg: "theme.surface",
      },
      filled: {
        focusVisibleRing: "outside",
        focusRingColor: "ui.borderControl",
        bg: "ui.surfaceSubtle",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "ui.borderControl",
        _hover: {
          bg: "theme.surface",
        },
      },
      subtle: {
        focusVisibleRing: "outside",
        focusRingColor: "ui.borderControl",
        bg: "ui.surfaceSubtle",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "ui.borderControl",
        _hover: { bg: "theme.surface" },
      },
      flushed: {
        focusVisibleRing: "outside",
        focusRingColor: "ui.borderControl",
        bg: "transparent",
        borderRadius: "0",
        px: "0",
        borderTopWidth: "0",
        borderLeftWidth: "0",
        borderRightWidth: "0",
        borderBottomWidth: "2px",
        borderBottomStyle: "solid",
        borderBottomColor: "ui.borderControl",
        borderColor: "ui.borderControl",
      },
      ghost: {
        focusVisibleRing: "outside",
        focusRingColor: "ui.borderControl",
        bg: "transparent",
        border: "none",
        _hover: {
          bg: "ui.surfaceSubtle",
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
