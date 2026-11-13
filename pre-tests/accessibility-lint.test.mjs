import assert from "node:assert/strict";
import { test } from "node:test";
import { RuleTester } from "eslint";
import jsxA11y from "eslint-plugin-jsx-a11y";
import accessibility, { rawColors } from "../scripts/eslint-accessibility.mjs";
import noRawColors from "../scripts/eslint-rules/no-raw-colors.mjs";

const tester = new RuleTester({
  languageOptions: { ecmaVersion: "latest", sourceType: "module", parserOptions: { ecmaFeatures: { jsx: true } } },
});
tester.run("no-raw-colors", noRawColors, {
  valid: [
    '<Text color="theme.text" />',
    '<Text color="fg.error" />',
    '<Box bg="var(--theme-bg)" border="1px solid" />',
    '<Icon fill="currentColor" stroke="none" />',
    '<Box bg="transparent" style={{ color: "inherit" }} />',
    '<Box title="#fff" id="gray.500" fontSize="14px" />',
    '<Box _hover={{ bg: "theme.surface" }} />',
    'const palette = { color: "#fff" };',
    '<Box bg={dynamicColor} />',
  ],
  invalid: [
    { code: '<Text color="gray.500" />', errors: [{ messageId: "rawColor" }] },
    { code: '<Box bg="#aabbccdd" />', errors: [{ messageId: "rawColor" }] },
    { code: '<Icon color="red" />', errors: [{ messageId: "rawColor" }] },
    { code: '<Box _hover={{ bg: "blue.100" }} />', errors: [{ messageId: "rawColor" }] },
    { code: '<div style={{ color: "rgb(1, 2, 3)", width: "10px" }} />', errors: [{ messageId: "rawColor" }] },
    { code: '<Box color={dark ? "gray.100" : "gray.900"} />', errors: [{ messageId: "rawColor" }, { messageId: "rawColor" }] },
    { code: '<Box bg={{ base: "#fff", md: "theme.bg" }} />', errors: [{ messageId: "rawColor" }] },
    { code: '<Box border={`1px solid #abc`} />', errors: [{ messageId: "rawColor" }] },
    { code: '<Box style={{ "&:hover": { color: "gray.600" } }} />', errors: [{ messageId: "rawColor" }] },
  ],
});

test("recommended accessibility and raw-color rules stay advisory", () => {
  for (const [name, original] of Object.entries(jsxA11y.configs.recommended.rules)) {
    const setting = accessibility.rules[name];
    const severity = Array.isArray(original) ? original[0] : original;
    assert.equal(Array.isArray(setting) ? setting[0] : setting, severity === "off" || severity === 0 ? "off" : "warn", name);
  }
  assert.equal(accessibility.rules["mixtape/no-raw-colors"], undefined);
  assert.equal(accessibility.plugins.mixtape, undefined);
  assert.equal(rawColors.rules["mixtape/no-raw-colors"], "warn");
});
