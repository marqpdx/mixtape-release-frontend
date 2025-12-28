
// ============================================================================

// src/theme/recipes/heading.recipe.ts - Unified heading recipe to replace your separate ones

import { defineRecipe, chakra } from "@chakra-ui/react";

export const headingRecipe = defineRecipe({
  base: {
    fontFamily: "heading",
    fontWeight: "bold",
    lineHeight: "1.2",
    color: "text.primary",
  },
  variants: {
    size: {
      "4xl": {
        fontSize: { base: "6xl", md: "7xl" },
        lineHeight: "1",
      },
      "3xl": {
        fontSize: { base: "5xl", md: "6xl" },
        lineHeight: "1",
      },
      "2xl": {
        fontSize: { base: "4xl", md: "5xl" },
        lineHeight: "1.1",
      },
      xl: {
        fontSize: { base: "3xl", md: "4xl" },
        lineHeight: "1.1",
      },
      lg: {
        fontSize: { base: "2xl", md: "3xl" },
        lineHeight: "1.2",
      },
      md: {
        fontSize: { base: "xl", md: "2xl" },
        lineHeight: "1.3",
      },
      sm: {
        fontSize: { base: "lg", md: "xl" },
        lineHeight: "1.3",
      },
      xs: {
        fontSize: { base: "md", md: "lg" },
        lineHeight: "1.4",
      },
    },
    variant: {
      // Front-facing headings (marketing, public pages)
      front: {
        color: "text.primary",
        textAlign: { base: "center", md: "left" },
      },
      // Admin/dashboard headings
      admin: {
        color: "text.primary",
        borderBottom: "1px solid",
        borderColor: "border.default",
        pb: "2",
        mb: "4",
      },
      // Accent headings using theme colors
      accent: {
        color: "theme.accent",
      },
      // Secondary headings
      secondary: {
        color: "text.secondary",
        fontWeight: "medium",
      },
    },
  },
  defaultVariants: {
    size: "lg",
    variant: "front",
  },
});

export const Heading = chakra("h2", headingRecipe);