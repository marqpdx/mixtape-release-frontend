import jsxA11y from "eslint-plugin-jsx-a11y";
import noRawColors from "./eslint-rules/no-raw-colors.mjs";

// Keep this pass advisory, including rules already enabled by Next's preset.
const accessibility = {
  files: ["**/*.{js,jsx,ts,tsx}"],
  plugins: {
    "jsx-a11y": jsxA11y,
  },
  rules: {
    ...Object.fromEntries(
      Object.entries(jsxA11y.configs.recommended.rules).map(([name, value]) => [
        name,
        Array.isArray(value)
          ? [value[0] === "off" || value[0] === 0 ? "off" : "warn", ...value.slice(1)]
          : value === "off" || value === 0 ? "off" : "warn",
      ]),
    ),
  },
};

export const rawColors = {
  files: accessibility.files,
  plugins: { "mixtape": { rules: { "no-raw-colors": noRawColors } } },
  rules: { "mixtape/no-raw-colors": "warn" },
};

export default accessibility;
