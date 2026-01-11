// apps/mixtape/src/components/groups/themes/ThemeWorkArea.tsx

"use client";

import React from "react";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Dialog,
  HStack,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { themes, type Theme } from "@/theme/themes";
import { useColorMode } from "@components/ui/color-mode";
import {
  createGroupThemeId,
  removeGroupTheme,
  upsertGroupTheme,
} from "@/lib/themes/groupThemeSettings";
import { useGroupThemeSettings } from "@mixtape/api/hooks/appearance";

interface ThemeWorkAreaProps {
  groupId: string | number;
  groupSlug: string;
  groupTitle: string;
}

interface ThemeRowProps {
  theme: Theme;
  isVisible: boolean;
  onVisibilityChange: (themeId: string, isVisible: boolean) => void;
  colorMode: "light" | "dark";
  badgeLabel: string;
  onDuplicate?: (theme: Theme) => void;
  onEdit?: (theme: Theme) => void;
  onDelete?: (theme: Theme) => void;
}

function ThemeRow({
  theme,
  isVisible,
  onVisibilityChange,
  colorMode,
  badgeLabel,
  onDuplicate,
  onEdit,
  onDelete,
}: ThemeRowProps) {
  const palette = theme[colorMode];
  const swatchBgSecondary = palette.bgSecondary ?? palette.surface;

  return (
    <Box
      border="1px solid"
      borderColor="theme.border"
      bg="theme.surface"
      borderRadius="md"
      p={4}
    >
      <HStack justify="space-between" align="start" gap={6}>
        <VStack align="start" gap={1}>
          <HStack gap={2}>
            <Text fontWeight="semibold">{theme.name}</Text>
            <Badge size="sm" variant="subtle">
              {badgeLabel}
            </Badge>
          </HStack>
          <Text fontSize="sm" color="theme.textSecondary">
            {theme.id}
          </Text>
          <HStack gap={2} pt={2}>
            <ColorSwatch label="Bg" color={palette.bg} />
            <ColorSwatch label="Bg 2" color={swatchBgSecondary} />
            <ColorSwatch label="Surface" color={palette.surface} />
            <ColorSwatch label="Accent" color={palette.accent} />
          </HStack>
          <HStack gap={2} pt={3}>
            {onDuplicate && (
              <Button size="xs" variant="outline" onClick={() => onDuplicate(theme)}>
                Duplicate
              </Button>
            )}
            {onEdit && (
              <Button size="xs" variant="outline" onClick={() => onEdit(theme)}>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                size="xs"
                variant="ghost"
                colorScheme="red"
                onClick={() => onDelete(theme)}
              >
                Remove
              </Button>
            )}
          </HStack>
        </VStack>

        <Checkbox.Root
          checked={isVisible}
          onCheckedChange={({ checked }) =>
            onVisibilityChange(theme.id, checked === true)
          }
        >
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          <Checkbox.Label>Visible</Checkbox.Label>
        </Checkbox.Root>
      </HStack>
    </Box>
  );
}

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <VStack gap={1} align="center">
      <Box
        w={6}
        h={6}
        borderRadius="sm"
        bg={color}
        border="1px solid"
        borderColor="theme.border"
      />
      <Text fontSize="xs" color="theme.textSecondary">
        {label}
      </Text>
    </VStack>
  );
}

type ThemeColorsRequired = Required<Pick<
  Theme["light"],
  "bg" | "bgSecondary" | "surface" | "accent" | "text" | "textSecondary" | "border"
>>;

interface ThemeDraft {
  id: string;
  name: string;
  light: ThemeColorsRequired;
  dark: ThemeColorsRequired;
}

type ThemeScheme = "mono" | "complementary" | "triadic";

function normalizeThemeColors(colors: Theme["light"]): ThemeColorsRequired {
  return {
    bg: colors.bg,
    bgSecondary: colors.bgSecondary ?? colors.surface,
    surface: colors.surface,
    accent: colors.accent,
    text: colors.text,
    textSecondary: colors.textSecondary,
    border: colors.border,
  };
}

function createDraftFromTheme(theme: Theme): ThemeDraft {
  return {
    id: theme.id,
    name: theme.name,
    light: normalizeThemeColors(theme.light),
    dark: normalizeThemeColors(theme.dark),
  };
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number) {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2;
    } else {
      h = (rNorm - gNorm) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(h: number, s: number, l: number) {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function shiftHue(h: number, degrees: number) {
  return (h + degrees + 360) % 360;
}

function buildPaletteFromAccent(accentHex: string, scheme: ThemeScheme) {
  const accentRgb = hexToRgb(accentHex) ?? { r: 80, g: 120, b: 160 };
  const accentHsl = rgbToHsl(accentRgb.r, accentRgb.g, accentRgb.b);
  const secondaryHue =
    scheme === "complementary"
      ? shiftHue(accentHsl.h, 180)
      : scheme === "triadic"
      ? shiftHue(accentHsl.h, 120)
      : accentHsl.h;

  const bgLightRgb = hslToRgb(accentHsl.h, 10, 96);
  const bgSecondaryLightRgb = hslToRgb(secondaryHue, 12, 92);
  const surfaceLightRgb = hslToRgb(accentHsl.h, 6, 100);
  const textLightRgb = hslToRgb(accentHsl.h, 15, 14);
  const textSecondaryLightRgb = hslToRgb(accentHsl.h, 12, 35);
  const borderLightRgb = hslToRgb(accentHsl.h, 8, 85);

  const bgDarkRgb = hslToRgb(accentHsl.h, 18, 12);
  const bgSecondaryDarkRgb = hslToRgb(secondaryHue, 18, 18);
  const surfaceDarkRgb = hslToRgb(accentHsl.h, 16, 18);
  const textDarkRgb = hslToRgb(accentHsl.h, 15, 92);
  const textSecondaryDarkRgb = hslToRgb(accentHsl.h, 12, 70);
  const borderDarkRgb = hslToRgb(accentHsl.h, 12, 30);

  const bgLight = rgbToHex(bgLightRgb.r, bgLightRgb.g, bgLightRgb.b);
  const bgSecondaryLight = rgbToHex(
    bgSecondaryLightRgb.r,
    bgSecondaryLightRgb.g,
    bgSecondaryLightRgb.b
  );
  const surfaceLight = rgbToHex(surfaceLightRgb.r, surfaceLightRgb.g, surfaceLightRgb.b);
  const textLight = rgbToHex(textLightRgb.r, textLightRgb.g, textLightRgb.b);
  const textSecondaryLight = rgbToHex(
    textSecondaryLightRgb.r,
    textSecondaryLightRgb.g,
    textSecondaryLightRgb.b
  );
  const borderLight = rgbToHex(borderLightRgb.r, borderLightRgb.g, borderLightRgb.b);

  const bgDark = rgbToHex(bgDarkRgb.r, bgDarkRgb.g, bgDarkRgb.b);
  const bgSecondaryDark = rgbToHex(
    bgSecondaryDarkRgb.r,
    bgSecondaryDarkRgb.g,
    bgSecondaryDarkRgb.b
  );
  const surfaceDark = rgbToHex(surfaceDarkRgb.r, surfaceDarkRgb.g, surfaceDarkRgb.b);
  const textDark = rgbToHex(textDarkRgb.r, textDarkRgb.g, textDarkRgb.b);
  const textSecondaryDark = rgbToHex(
    textSecondaryDarkRgb.r,
    textSecondaryDarkRgb.g,
    textSecondaryDarkRgb.b
  );
  const borderDark = rgbToHex(borderDarkRgb.r, borderDarkRgb.g, borderDarkRgb.b);

  return {
    light: {
      bg: bgLight,
      bgSecondary: bgSecondaryLight,
      surface: surfaceLight,
      accent: accentHex.toUpperCase(),
      text: textLight,
      textSecondary: textSecondaryLight,
      border: borderLight,
    },
    dark: {
      bg: bgDark,
      bgSecondary: bgSecondaryDark,
      surface: surfaceDark,
      accent: accentHex.toUpperCase(),
      text: textDark,
      textSecondary: textSecondaryDark,
      border: borderDark,
    },
  };
}

function makePalette(accentHex: string, scheme: ThemeScheme): ThemeDraft {
  const slug =
    scheme === "mono" ? "Custom" : scheme === "complementary" ? "Complementary" : "Triadic";
  const id = `generated-${Date.now().toString(36)}`;
  const palette = buildPaletteFromAccent(accentHex, scheme);
  return {
    id,
    name: `Generated ${slug}`,
    light: palette.light,
    dark: palette.dark,
  };
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <HStack align="center" gap={4} w="full" flexWrap="wrap">
      <Text
        fontSize="sm"
        fontWeight="medium"
        color="theme.textSecondary"
        minW={{ base: "140px", md: "180px" }}
      >
        {label}
      </Text>
      <HStack gap={3}>
        <Input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          w="56px"
          h="40px"
          p={1}
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          fontSize="sm"
          maxLength={7}
          w="120px"
        />
      </HStack>
    </HStack>
  );
}

export default function ThemeWorkArea({
  groupId,
  groupSlug,
  groupTitle,
}: ThemeWorkAreaProps) {
  const { colorMode } = useColorMode();
  const { data, isLoading, updateSettings, isUpdating } = useGroupThemeSettings(
    groupSlug
  );
  const [settings, setSettings] = React.useState(() => ({
    hiddenThemeIds: [] as string[],
    groupThemes: [] as Theme[],
  }));
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<ThemeDraft | null>(null);
  const [editingThemeId, setEditingThemeId] = React.useState<string | null>(null);
  const [generatorAccent, setGeneratorAccent] = React.useState("#3B82F6");
  const [generatorScheme, setGeneratorScheme] = React.useState<ThemeScheme>("mono");
  const [isExtractingImage, setIsExtractingImage] = React.useState(false);
  const generatorPreview = React.useMemo(
    () => buildPaletteFromAccent(generatorAccent, generatorScheme),
    [generatorAccent, generatorScheme]
  );

  React.useEffect(() => {
    if (!data) return;
    setSettings({
      hiddenThemeIds: data.hidden_theme_ids || [],
      groupThemes: data.group_themes || [],
    });
  }, [data]);

  const openCreateDialog = React.useCallback(
    (baseTheme?: Theme) => {
      const sourceTheme = baseTheme ?? themes[0];
      if (!sourceTheme) return;
      const draftTheme = createDraftFromTheme(sourceTheme);
      const newName = baseTheme ? `${sourceTheme.name} (Group)` : "New Group Theme";
      const themeId = createGroupThemeId(groupId, newName);
      setDraft({ ...draftTheme, name: newName, id: themeId });
      setEditingThemeId(null);
      setEditorOpen(true);
    },
    [groupId]
  );

  const handleGenerateTheme = React.useCallback(() => {
    const draftTheme = makePalette(generatorAccent, generatorScheme);
    const themeId = createGroupThemeId(groupId, draftTheme.name);
    setDraft({
      ...draftTheme,
      id: themeId,
      name: draftTheme.name,
    });
    setEditingThemeId(null);
    setEditorOpen(true);
  }, [generatorAccent, generatorScheme, groupId]);

  const handleImageUpload = React.useCallback(
    async (file: File | null) => {
      if (!file) return;
      setIsExtractingImage(true);
      try {
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const size = 24;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(bitmap, 0, 0, size, size);
        const { data: pixels } = ctx.getImageData(0, 0, size, size);
        let rTotal = 0;
        let gTotal = 0;
        let bTotal = 0;
        let count = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          const alpha = pixels[i + 3];
          if (alpha < 100) continue;
          rTotal += pixels[i];
          gTotal += pixels[i + 1];
          bTotal += pixels[i + 2];
          count += 1;
        }
        if (count > 0) {
          const accentHex = rgbToHex(
            Math.round(rTotal / count),
            Math.round(gTotal / count),
            Math.round(bTotal / count)
          );
          setGeneratorAccent(accentHex);
        }
      } finally {
        setIsExtractingImage(false);
      }
    },
    [setGeneratorAccent]
  );

  const openEditDialog = React.useCallback((theme: Theme) => {
    setDraft(createDraftFromTheme(theme));
    setEditingThemeId(theme.id);
    setEditorOpen(true);
  }, []);

  const updateDraftField = (
    mode: "light" | "dark",
    field: keyof ThemeColorsRequired,
    value: string
  ) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [mode]: {
          ...prev[mode],
          [field]: value,
        },
      };
    });
  };

  const hiddenThemeIds = settings.hiddenThemeIds;
  const groupThemes = settings.groupThemes;

  const persistSettings = React.useCallback(
    async (nextSettings: { hiddenThemeIds: string[]; groupThemes: Theme[] }) => {
      await updateSettings({
        hidden_theme_ids: nextSettings.hiddenThemeIds,
        group_themes: nextSettings.groupThemes,
      });
    },
    [updateSettings]
  );

  return (
    <VStack align="stretch" gap={6}>
      <HStack justify="space-between" align="start" gap={4}>
        <Box>
          <Heading size="lg" mb={2}>
            Theme Library
          </Heading>
          <Text color="theme.textSecondary">
            Control which palettes are visible to members of {groupTitle}.
          </Text>
        </Box>
        <Button
          size="sm"
          variant="solid"
          onClick={() => openCreateDialog()}
          loading={isUpdating}
        >
          Create Theme
        </Button>
      </HStack>

      <Box
        border="1px solid"
        borderColor="theme.border"
        borderRadius="lg"
        p={4}
        bg="theme.bgSecondary"
      >
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
            <Box>
              <Text fontWeight="semibold">Generate a palette</Text>
              <Text fontSize="sm" color="theme.textSecondary">
                Start with an accent color, then let Mixtape propose a full theme.
              </Text>
            </Box>
            <Button
              size="sm"
              variant="solid"
              onClick={handleGenerateTheme}
              loading={isUpdating}
            >
              Generate Theme
            </Button>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <VStack align="start" gap={2}>
              <Text fontSize="sm" fontWeight="medium" color="theme.textSecondary">
                Primary Accent
              </Text>
              <HStack gap={3}>
                <Input
                  type="color"
                  value={generatorAccent}
                  onChange={(event) => setGeneratorAccent(event.target.value)}
                  w="56px"
                  h="40px"
                  p={1}
                />
                <Input
                  value={generatorAccent}
                  onChange={(event) => setGeneratorAccent(event.target.value)}
                  fontSize="sm"
                  maxLength={7}
                  w="120px"
                />
              </HStack>
            </VStack>

            <VStack align="start" gap={2}>
              <Text fontSize="sm" fontWeight="medium" color="theme.textSecondary">
                Scheme
              </Text>
              <HStack w="full" gap={2}>
                {(["mono", "complementary", "triadic"] as ThemeScheme[]).map((scheme) => (
                  <Button
                    key={scheme}
                    size="sm"
                    variant={generatorScheme === scheme ? "solid" : "outline"}
                    onClick={() => setGeneratorScheme(scheme)}
                    flex={1}
                  >
                    {scheme === "mono"
                      ? "Mono"
                      : scheme === "complementary"
                      ? "Complement"
                      : "Triadic"}
                  </Button>
                ))}
              </HStack>
            </VStack>

            <VStack align="start" gap={2}>
              <Text fontSize="sm" fontWeight="medium" color="theme.textSecondary">
                Image Seed
              </Text>
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => handleImageUpload(event.target.files?.[0] || null)}
                size="sm"
                disabled={isExtractingImage}
              />
              {isExtractingImage && (
                <Text fontSize="xs" color="theme.textSecondary">
                  Extracting colors...
                </Text>
              )}
            </VStack>
          </SimpleGrid>

          <HStack gap={3} align="center">
            <Text fontSize="xs" color="theme.textSecondary" minW="110px">
              Preview ({colorMode === "light" ? "Light" : "Dark"})
            </Text>
            <HStack gap={2}>
              <Box
                w={5}
                h={5}
                borderRadius="sm"
                bg={generatorPreview[colorMode].bg}
                border="1px solid"
                borderColor="theme.border"
              />
              <Box
                w={5}
                h={5}
                borderRadius="sm"
                bg={generatorPreview[colorMode].bgSecondary}
                border="1px solid"
                borderColor="theme.border"
              />
              <Box
                w={5}
                h={5}
                borderRadius="sm"
                bg={generatorPreview[colorMode].surface}
                border="1px solid"
                borderColor="theme.border"
              />
              <Box w={5} h={5} borderRadius="sm" bg={generatorPreview[colorMode].accent} />
            </HStack>
          </HStack>
        </VStack>
      </Box>

      {isLoading && (
        <Text color="theme.textSecondary" fontSize="sm">
          Loading theme settings...
        </Text>
      )}

      <VStack align="stretch" gap={4}>
        <Heading size="md">System Themes</Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          {themes.map((theme) => (
            <ThemeRow
              key={theme.id}
              theme={theme}
              colorMode={colorMode}
              isVisible={!hiddenThemeIds.includes(theme.id)}
              onVisibilityChange={async (themeId, isVisible) => {
                const nextHidden = new Set(hiddenThemeIds);
                if (isVisible) {
                  nextHidden.delete(themeId);
                } else {
                  nextHidden.add(themeId);
                }
                const nextSettings = {
                  hiddenThemeIds: Array.from(nextHidden),
                  groupThemes,
                };
                setSettings(nextSettings);
                await persistSettings(nextSettings);
              }}
              badgeLabel="System"
              onDuplicate={openCreateDialog}
            />
          ))}
        </SimpleGrid>
      </VStack>

      <VStack align="stretch" gap={4}>
        <Heading size="md">Group Themes</Heading>
        {groupThemes.length === 0 ? (
          <Box
            border="1px dashed"
            borderColor="theme.border"
            borderRadius="md"
            p={4}
            bg="theme.bgSecondary"
          >
            <Text fontWeight="semibold">No group themes yet</Text>
            <Text fontSize="sm" color="theme.textSecondary">
              Create a theme to add group-specific palettes.
            </Text>
          </Box>
        ) : (
          <Stack gap={3}>
            {groupThemes.map((theme) => (
              <ThemeRow
                key={theme.id}
                theme={theme}
                colorMode={colorMode}
                isVisible={!hiddenThemeIds.includes(theme.id)}
                onVisibilityChange={async (themeId, isVisible) => {
                  const nextHidden = new Set(hiddenThemeIds);
                  if (isVisible) {
                    nextHidden.delete(themeId);
                  } else {
                    nextHidden.add(themeId);
                  }
                  const nextSettings = {
                    hiddenThemeIds: Array.from(nextHidden),
                    groupThemes,
                  };
                  setSettings(nextSettings);
                  await persistSettings(nextSettings);
                }}
                badgeLabel="Group"
                onEdit={openEditDialog}
                onDelete={async (theme) => {
                  const nextSettings = removeGroupTheme(
                    {
                      hiddenThemeIds,
                      groupThemes,
                    },
                    theme.id
                  );
                  setSettings(nextSettings);
                  await persistSettings(nextSettings);
                }}
              />
            ))}
          </Stack>
        )}
      </VStack>

      <Text fontSize="sm" color="theme.textSecondary">
        Hidden themes are only hidden for this group and do not affect other groups.
      </Text>

      <Dialog.Root open={editorOpen} onOpenChange={({ open }: { open: boolean }) => setEditorOpen(open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="860px" bg="theme.surface" borderColor="theme.border">
            <Dialog.Header>
              <Dialog.Title>{editingThemeId ? "Edit Theme" : "Create Theme"}</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              {draft && (
                <VStack align="stretch" gap={6}>
                  <Box>
                    <Text fontSize="sm" color="theme.textSecondary" mb={2}>
                      Name
                    </Text>
                    <Input
                      value={draft.name}
                      onChange={(event) =>
                        setDraft((prev) =>
                          prev ? { ...prev, name: event.target.value } : prev
                        )
                      }
                    />
                  </Box>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                    <Box>
                      <Heading size="sm" mb={3}>
                        Light Mode
                      </Heading>
                      <VStack align="stretch" gap={4}>
                        <ColorField
                          label="Background"
                          value={draft.light.bg}
                          onChange={(value) => updateDraftField("light", "bg", value)}
                        />
                        <ColorField
                          label="Background Secondary"
                          value={draft.light.bgSecondary}
                          onChange={(value) => updateDraftField("light", "bgSecondary", value)}
                        />
                        <ColorField
                          label="Surface"
                          value={draft.light.surface}
                          onChange={(value) => updateDraftField("light", "surface", value)}
                        />
                        <ColorField
                          label="Accent"
                          value={draft.light.accent}
                          onChange={(value) => updateDraftField("light", "accent", value)}
                        />
                        <ColorField
                          label="Text"
                          value={draft.light.text}
                          onChange={(value) => updateDraftField("light", "text", value)}
                        />
                        <ColorField
                          label="Text Secondary"
                          value={draft.light.textSecondary}
                          onChange={(value) => updateDraftField("light", "textSecondary", value)}
                        />
                        <ColorField
                          label="Border"
                          value={draft.light.border}
                          onChange={(value) => updateDraftField("light", "border", value)}
                        />
                      </VStack>
                    </Box>

                    <Box>
                      <Heading size="sm" mb={3}>
                        Dark Mode
                      </Heading>
                      <VStack align="stretch" gap={4}>
                        <ColorField
                          label="Background"
                          value={draft.dark.bg}
                          onChange={(value) => updateDraftField("dark", "bg", value)}
                        />
                        <ColorField
                          label="Background Secondary"
                          value={draft.dark.bgSecondary}
                          onChange={(value) => updateDraftField("dark", "bgSecondary", value)}
                        />
                        <ColorField
                          label="Surface"
                          value={draft.dark.surface}
                          onChange={(value) => updateDraftField("dark", "surface", value)}
                        />
                        <ColorField
                          label="Accent"
                          value={draft.dark.accent}
                          onChange={(value) => updateDraftField("dark", "accent", value)}
                        />
                        <ColorField
                          label="Text"
                          value={draft.dark.text}
                          onChange={(value) => updateDraftField("dark", "text", value)}
                        />
                        <ColorField
                          label="Text Secondary"
                          value={draft.dark.textSecondary}
                          onChange={(value) => updateDraftField("dark", "textSecondary", value)}
                        />
                        <ColorField
                          label="Border"
                          value={draft.dark.border}
                          onChange={(value) => updateDraftField("dark", "border", value)}
                        />
                      </VStack>
                    </Box>
                  </SimpleGrid>
                </VStack>
              )}
            </Dialog.Body>
            <Dialog.Footer gap={3} justifyContent="flex-end">
              <Button variant="ghost" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="solid"
                onClick={async () => {
                  if (!draft) return;
                  const nextTheme: Theme = {
                    id: draft.id,
                    name: draft.name.trim() || "Untitled Theme",
                    light: { ...draft.light },
                    dark: { ...draft.dark },
                  };
                  const nextSettings = upsertGroupTheme(
                    {
                      hiddenThemeIds,
                      groupThemes,
                    },
                    nextTheme
                  );
                  setSettings(nextSettings);
                  await persistSettings(nextSettings);
                  setEditorOpen(false);
                }}
                disabled={!draft?.name.trim() || isUpdating}
                loading={isUpdating}
              >
                Save Theme
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </VStack>
  );
}
