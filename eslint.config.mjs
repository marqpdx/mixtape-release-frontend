import tsParser from "@typescript-eslint/parser";
import typescript from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import next from "@next/eslint-plugin-next";
import accessibility from "./scripts/eslint-accessibility.mjs";

// Advisory audit across both apps and shared packages. Full app lint continues
// to use each app's existing Next.js config plus the same accessibility rules.
const config = [
  { ignores: ["**/.next/**", "**/node_modules/**", "**/next-env.d.ts", "**/public/**", "apps/mobile/**", "apps/markalanlilly/**"] },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    // Existing inline disable comments reference these plugins. Full checks
    // remain in the app configs; this entry point runs only the advisory audit.
    plugins: { "@typescript-eslint": typescript, "react-hooks": reactHooks, "@next/next": next },
    linterOptions: { reportUnusedDisableDirectives: false },
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  accessibility,
];

export default config;
