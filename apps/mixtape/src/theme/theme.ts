// /src/theme/theme.ts - Updated with proper 3-color system and dynamic theming

import {
  createSystem,
  defineConfig,
  defaultConfig,
} from "@chakra-ui/react";

import { inputRecipe } from "./recipes/input.recipe";
import { buttonRecipe } from "./recipes/button.recipe";
import { selectSlotRecipe } from "./recipes/select.recipe";
import { defineTextStyles } from "@chakra-ui/react"
import { headingFrontRecipe } from "./recipes/heading-front.recipe";
import { headingAdminRecipe } from "./recipes/heading-admin.recipe";

export const textStyles = defineTextStyles({
  // Body text variants
  body: {
    description: "Default body text",
    value: {
      fontFamily: "body",
      fontWeight: "400",
      fontSize: "16px",
      lineHeight: "1.6",
    },
  },
  bodyLarge: {
    description: "Larger body text for emphasis",
    value: {
      fontFamily: "body",
      fontWeight: "400",
      fontSize: "18px",
      lineHeight: "1.6",
    },
  },
  bodySmall: {
    description: "Smaller body text",
    value: {
      fontFamily: "body",
      fontWeight: "400",
      fontSize: "14px",
      lineHeight: "1.5",
    },
  },

  // UI text
  label: {
    description: "Form labels and UI labels",
    value: {
      fontFamily: "body",
      fontWeight: "500",
      fontSize: "14px",
      lineHeight: "1.4",
      letterSpacing: "0.01em",
    },
  },
  caption: {
    description: "Captions and helper text",
    value: {
      fontFamily: "body",
      fontWeight: "400",
      fontSize: "12px",
      lineHeight: "1.4",
      color: "text.secondary",
    },
  },
  overline: {
    description: "Overline text (all caps, small)",
    value: {
      fontFamily: "body",
      fontWeight: "600",
      fontSize: "11px",
      lineHeight: "1.3",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
  },

  // Interactive text
  link: {
    description: "Inline links",
    value: {
      fontFamily: "body",
      fontWeight: "500",
      color: "theme.accent",
      textDecoration: "underline",
      textDecorationColor: "theme.accent",
    },
  },

  // Display text (large, impactful)
  display1: {
    description: "Largest display text (hero)",
    value: {
      fontFamily: "heading",
      fontWeight: "600",
      fontSize: { base: "48px", md: "72px", lg: "96px" },
      lineHeight: "1.1",
      letterSpacing: "-0.02em",
    },
  },
  display2: {
    description: "Secondary display text",
    value: {
      fontFamily: "heading",
      fontWeight: "600",
      fontSize: { base: "36px", md: "56px", lg: "72px" },
      lineHeight: "1.15",
      letterSpacing: "-0.015em",
    },
  },

  // Code/mono
  code: {
    description: "Inline code snippets",
    value: {
      fontFamily: "mono",
      fontWeight: "400",
      fontSize: "0.9em",
    },
  },
});

export const config = defineConfig({
  globalCss: {
    "*:focus-visible": {
      outline: "3px solid",
      outlineColor: "focus.ring",
      outlineOffset: "2px",
      borderRadius: "2px",
    },
    "*:focus:not(:focus-visible)": {
      outline: "none",
    },
  },
  theme: {
    textStyles,
    tokens: {
      fonts: {
        body: { value: "var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, sans-serif" },
        heading: { value: "var(--font-dm-serif), Georgia, 'Times New Roman', serif" },
        serifBody: { value: "var(--font-source-serif), 'Source Serif 4', Georgia, 'Times New Roman', serif" },
        headingAdmin: { value: "'Joan', -apple-system, BlinkMacSystemFont, sans-serif" },
        mono: { value: "Menlo, Monaco, 'Courier New', monospace" },
      },
      colors: {
        // Core 3-color system for light/dark modes
        background: {
          // Light mode: 3 levels
          light: { value: "#FBF9F9" },        // Main background
          lightCard: { value: "#fefefe" },     // Card/surface background
          lightBorder: { value: "#f5f3f3" },  // Subtle borders/dividers

          // Dark mode: 3 levels
          dark: { value: "#2A3B47" },         // Main background
          darkCard: { value: "#1f2d36" },     // Card/surface background
          darkBorder: { value: "#151e24" },   // Subtle borders/dividers
        },

        text: {
          light: { value: "#1A202C" },
          lightSecondary: { value: "#4A5568" },
          dark: { value: "#FBF9F9" },
          darkSecondary: { value: "#CBD5E0" },
        },

        // Fixed brand colors (fallbacks)
        brand: {
          main1: { value: "#AEE239" },
          center: { value: "#6D9BAA" },
          main3: { value: "#966C49" },
        },

        // Brand color scales (for fallbacks)
        brandMain1: {
          50: { value: "#f4fadc" },
          100: { value: "#e5f4b0" },
          200: { value: "#d3ec7e" },
          300: { value: "#c0e54d" },
          400: { value: "#addd24" },
          500: { value: "#94c40b" },
          600: { value: "#739800" },
          700: { value: "#526c00" },
          800: { value: "#323f00" },
          900: { value: "#111400" },
        },

        brandCenter: {
          50: { value: "#e4f0f3" },
          100: { value: "#c3dfe5" },
          200: { value: "#a1cdd7" },
          300: { value: "#7fbbca" },
          400: { value: "#5ea9bd" },
          500: { value: "#448fa3" },
          600: { value: "#336e81" },
          700: { value: "#224c5e" },
          800: { value: "#102b3b" },
          900: { value: "#00101a" },
        },

        brandMain3: {
          50: { value: "#f7eee9" },
          100: { value: "#e5d0ba" },
          200: { value: "#d2b28c" },
          300: { value: "#c0945e" },
          400: { value: "#ae7631" },
          500: { value: "#945c17" },
          600: { value: "#744811" },
          700: { value: "#54340c" },
          800: { value: "#341f06" },
          900: { value: "#150b00" },
        },

        // Legacy compatibility
        gray: {
          50: { value: "#F5F3EB" },
          60: { value: "#3e31a1" },
          900: { value: "#2B2E3D" },
        },

        // Dynamic theme colors - updated via CSS custom properties by your ThemeContext
        userTheme: {
          bg: { value: "var(--theme-bg, #F7FAFC)" },
          bgSecondary: { value: "var(--theme-bg-secondary, #F1F3F6)" },
          bgSubtle: { value: "var(--theme-bg-subtle, #EAEDF1)" },
          surface: { value: "var(--theme-surface, #FFFFFF)" },
          border: { value: "var(--theme-border, #E2E8F0)" },
          accent: { value: "var(--theme-accent, #38A169)" },
          text: { value: "var(--theme-text, #2D3748)" },
          textSecondary: { value: "var(--theme-text-secondary, #4A5568)" },
        },
      },
    },
    semanticTokens: {
      colors: {
        // Main backgrounds using 3-color system
        "bg.canvas": {
          value: {
            base: "{colors.background.light}",
            _dark: "{colors.background.dark}",
          },
        },
        "bg.surface": {
          value: {
            base: "{colors.background.lightCard}",
            _dark: "{colors.background.darkCard}",
          },
        },
        "bg.subtle": {
          value: {
            base: "{colors.background.lightBorder}",
            _dark: "{colors.background.darkBorder}",
          },
        },

        // Text colors
        "text.primary": {
          value: {
            base: "{colors.text.light}",
            _dark: "{colors.text.dark}",
          },
        },
        "text.secondary": {
          value: {
            base: "{colors.text.lightSecondary}",
            _dark: "{colors.text.darkSecondary}",
          },
        },

        // Border colors
        "border.default": {
          value: {
            base: "{colors.background.lightBorder}",
            _dark: "{colors.background.darkBorder}",
          },
        },
        "border.emphasis": {
          value: {
            base: "{colors.text.lightSecondary}",
            _dark: "{colors.text.darkSecondary}",
          },
        },

        // Input-specific colors
        "bg.input": {
          value: {
            base: "{colors.background.lightCard}",
            _dark: "{colors.background.darkCard}",
          },
        },
        "border.input": {
          value: {
            base: "{colors.background.lightBorder}",
            _dark: "{colors.background.darkBorder}",
          },
        },

        // Dynamic theme colors (for user-selected themes)
        "theme.bg": {
          value: "{colors.userTheme.bg}",
        },
        "theme.bgSecondary": {
          value: "{colors.userTheme.bgSecondary}",
        },
        "theme.bgSubtle": {
          value: "{colors.userTheme.bgSubtle}",
        },
        "theme.surface": {
          value: "{colors.userTheme.surface}",
        },
        "theme.border": {
          value: "{colors.userTheme.border}",
        },
        "theme.accent": {
          value: "{colors.userTheme.accent}",
        },
        "theme.text": {
          value: "{colors.userTheme.text}",
        },
        "theme.textSecondary": {
          value: "{colors.userTheme.textSecondary}",
        },

        // Focus indicators (accessible)
        "focus.ring": {
          value: {
            base: "{colors.userTheme.accent}",
            _dark: "{colors.userTheme.accent}",
          },
        },
        "focus.ringOffset": {
          value: {
            base: "{colors.userTheme.bg}",
            _dark: "{colors.userTheme.bg}",
          },
        },

        // Legacy semantic tokens (keep for backward compatibility)
        "border.borderBox": {
          value: {
            base: "{colors.background.lightBorder}",
            _dark: "{colors.background.darkBorder}",
          },
        },
      },
    },
    recipes: {
      input: inputRecipe,
      button: buttonRecipe,
      select: selectSlotRecipe,
      headingFront: headingFrontRecipe,
      headingAdmin: headingAdminRecipe,
    },
  },
});

export const system = createSystem(defaultConfig, config, {
  cssVarsRoot: ":root",
});
