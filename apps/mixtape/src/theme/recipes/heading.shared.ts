// src/theme/recipes/heading.shared.ts

export type HeadingLevels = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export const sharedHeadingConfig = {
  base: {
    fontWeight: "700",
    color: "text.primary",
    lineHeight: "1.2",
    textTransform: "none",
  },
  variants: {
    level: {
      h1: {
        fontSize: { base: "2.25rem", md: "3rem" },
      },
      h2: {
        fontSize: { base: "1.875rem", md: "2.25rem" },
      },
      h3: {
        fontSize: { base: "1.5rem", md: "1.875rem" },
      },
      h4: {
        fontSize: { base: "1.25rem", md: "1.5rem" },
      },
      h5: {
        fontSize: { base: "1.125rem", md: "1.25rem" },
      },
      h6: {
        fontSize: { base: "1rem", md: "1.125rem" },
      },
    },
    visual: {
      default: {
        color: "text.primary",
      },
      brand: {
        color: "brand.main1",
      },
      subtle: {
        color: "gray.600",
      },
    },
  },
  defaultVariants: {
    level: "h2" as "h2",
    visual: "default" as "default",
  },
};
