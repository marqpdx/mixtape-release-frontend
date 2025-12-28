// src/theme/semantic-tokens.ts

export const semanticTokens = {
  colors: {
    "prose.body":   { default: "gray.800", _dark: "gray.200" },
    "prose.muted":  { default: "gray.700", _dark: "gray.300" },
    "prose.subtle": { default: "gray.600", _dark: "gray.400" },
    "prose.border": { default: "gray.200", _dark: "gray.700" },
    "prose.rule":   { default: "gray.200", _dark: "gray.700" }, // for <hr>
    "prose.codeBg": { default: "gray.100", _dark: "gray.800" },
    "prose.codeFg": { default: "gray.900", _dark: "gray.100" },
    // Optional accent hook (wire to your palette)
    "prose.link":   { default: "accent.600", _dark: "accent.300" },
  },
};
