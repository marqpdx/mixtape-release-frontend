// src/components/ui/prose.tsx
"use client"

import { chakra } from "@chakra-ui/react"

export const Prose = chakra("div", {
  base: {
    color: "fg.muted",
    maxWidth: "65ch",
    fontSize: "sm",
    lineHeight: 1.75,

    "& > *": { marginBlock: "1.1em" },

    "& p": { marginBlock: "1em" },

    "& h1, h2, h3, h4": {
      color: "fg",
      fontWeight: 600,
      letterSpacing: "-0.01em",
      lineHeight: 1.25,
      marginBlockStart: "1.6em",
      marginBlockEnd: "0.6em",
    },
    "& h1": {
      fontSize: { base: "2xl", md: "3xl", lg: "4xl" },
      marginBlockStart: 0,
      lineHeight: 1.2,
      letterSpacing: "-0.02em",
    },
    "& h2": {
      fontSize: { base: "xl", md: "2xl", lg: "3xl" },
      lineHeight: 1.3,
    },
    "& h3": {
      fontSize: { base: "lg", md: "xl", lg: "2xl" },
      lineHeight: 1.35,
    },
    "& h4": { fontSize: { base: "md", md: "lg", lg: "xl" }, lineHeight: 1.4 },

    "& a": {
      color: "fg",
      textDecoration: "underline",
      textUnderlineOffset: "3px",
      textDecorationThickness: "1px",
      textDecorationColor: "border.muted",
      fontWeight: 500,
      _hover: { textDecorationThickness: "2px" },
    },

    "& strong": { fontWeight: 600 },
    "& a strong": { color: "inherit" },

    "& img": { marginBlock: "1.6em", borderRadius: "lg", boxShadow: "inset" },
    "& picture, & video": { marginBlock: "1.6em" },
    "& picture > img": { marginBlock: 0 },

    "& kbd": {
      fontSize: "0.85em",
      borderRadius: "xs",
      paddingBlock: "0.15em",
      paddingInline: "0.35em",
      fontFamily: "inherit",
      color: "fg.muted",
      "--shadow": "colors.border",
      boxShadow: "0 0 0 1px var(--shadow), 0 1px 0 1px var(--shadow)",
    },

    "& code": {
      fontSize: "0.925em",
      letterSpacing: "-0.01em",
      borderRadius: "md",
      borderWidth: "1px",
      padding: "0.2em 0.4em",
    },
    "& pre": {
      backgroundColor: "bg.subtle",
      marginBlock: "1.6em",
      borderRadius: "md",
      fontSize: "0.9em",
      padding: "0.75em 1em",
      overflowX: "auto",
      fontWeight: 400,
      "& code": { fontSize: "inherit", letterSpacing: "inherit", borderWidth: 0, padding: 0, background: "transparent" },
    },
    "& h2 code": { fontSize: "0.9em" },
    "& h3 code": { fontSize: "0.85em" },

    "& ol, & ul": { marginBlock: "1em", paddingInlineStart: "1.5em" },
    "& li": { marginBlock: "0.35em" },
    "& ol > li": {
      paddingInlineStart: "0.4em",
      listStyleType: "decimal",
      "&::marker": { color: "fg.muted" },
    },
    "& ul > li": {
      paddingInlineStart: "0.4em",
      listStyleType: "disc",
      "&::marker": { color: "fg.muted" },
    },
    "& > ul > li p": { marginBlock: "0.5em" },
    "& > ul > li > p:first-of-type, & > ol > li > p:first-of-type": { marginBlockStart: "1em" },
    "& > ul > li > p:last-of-type,  & > ol > li > p:last-of-type":  { marginBlockEnd: "1em" },
    "& ul ul, ul ol, ol ul, ol ol": { marginBlock: "0.5em" },

    "& dl": { marginBlock: "1em" },
    "& dt": { fontWeight: 600, marginBlockStart: "1em" },
    "& dd": { marginBlockStart: "0.285em", paddingInlineStart: "1.5em" },

    "& blockquote": {
      marginBlock: "1.3em",
      paddingInline: "1.2em",
      borderInlineStartWidth: "0.25em",
      borderColor: "border",
      fontStyle: "italic",
    },

    "& hr": { marginBlock: "2em", borderColor: "border" },
    "& :is(h1,h2,h3,h4,h5,hr) + *": { marginBlockStart: 0 },

    "& table": {
      width: "100%",
      tableLayout: "auto",
      textAlign: "start",
      lineHeight: 1.5,
      marginBlock: "2em",
    },
    "& thead": { borderBottomWidth: "1px", color: "fg" },
    "& tbody tr": { borderBottomWidth: "1px", borderBottomColor: "border" },
    "& thead th": {
      paddingInline: "1em",
      paddingBlockEnd: "0.65em",
      fontWeight: "medium",
      textAlign: "start",
    },
    "& thead th:first-of-type": { paddingInlineStart: 0 },
    "& thead th:last-of-type":  { paddingInlineEnd: 0 },
    "& tbody td, tfoot td": { padding: "0.65em 1em" },
    "& tbody td:first-of-type, tfoot td:first-of-type": { paddingInlineStart: 0 },
    "& tbody td:last-of-type,  tfoot td:last-of-type":  { paddingInlineEnd: 0 },

    "& figure": { marginBlock: "1.625em" },
    "& figure > *": { marginBlock: 0 },
    "& figcaption": { fontSize: "0.85em", lineHeight: 1.25, marginTop: "0.85em", color: "fg.muted" },
  },

  variants: {
    size: {
      md: { fontSize: "sm", lineHeight: 1.75 },
      lg: { fontSize: "md", lineHeight: 1.85 },
    },
    intent: {
      default: {},
      article: { fontSize: "md", lineHeight: 1.85 },
      compact: { fontSize: "sm", lineHeight: 1.6 },
    },
  },

  defaultVariants: {
    size: "md",
    intent: "default",
  },
})
