# Mixtape Color System Overview

This document explains how color works today in Mixtape and Crossroads, how to create and manage themes, and how we can evolve the system into a user-facing feature. It is written for a mixed tech + business audience with a specific section for designers.

---

## 1) Executive Summary

Mixtape uses a lightweight theme system built on a small set of color tokens. Themes are defined in `apps/mixtape/src/theme/themes.ts` and can be switched between light/dark modes with optional high-contrast variants. The active theme is applied by a shared `ThemeProvider` that writes CSS custom properties (e.g. `--theme-bg`, `--theme-bg-secondary`, `--theme-accent`) to `:root` and the `body`. Components read those values using Chakra tokens like `theme.bg`, `theme.bgSecondary`, `theme.surface`, and `theme.text`.

The system works, but color usage is inconsistent across the UI. Some areas (like the left nav in admin layouts) still use hard-coded colors. This causes light/dark mode to appear incomplete. The immediate fix is to move those areas to the theme tokens so that changes to a theme propagate everywhere.

Longer-term, we can create a member/group feature that lets users create and manage their own theme palettes, with controls for visibility and defaults per group.

---

## 2) How The System Works Today (Technical Detail)

### 2.1 Theme Data

Themes are defined as objects with the following structure:

- `id`
- `name`
- `light` colors
- `dark` colors
- optional `lightHighContrast` and `darkHighContrast`

Each color set includes these properties:

- `bg`: primary background
- `bgSecondary`: secondary background (for sidebars / nav columns)
- `surface`: card/panel background
- `accent`: primary accent / brand color
- `text`: primary text
- `textSecondary`: secondary text
- `border`: border / divider color

Source of truth (today):
- `packages/ui-tokens/src/themes.ts`

App-level re-exports (for convenience):
- `apps/mixtape/src/theme/themes.ts`
- `apps/crossroads/src/theme/themes.ts`

### 2.2 Runtime Theme Application

The runtime theme is applied by:
- `ThemeProvider` (shared code in `@mixtape/core`)
- `ColorModeProvider` (based on `next-themes`)

When the theme or color mode changes, the provider writes CSS custom properties to `:root`:

- `--theme-bg`
- `--theme-bg-secondary`
- `--theme-surface`
- `--theme-accent`
- `--theme-text`
- `--theme-text-secondary`
- `--theme-border`

It also updates `body` styles for background and text color.

### 2.3 Chakra Integration

Chakra theme tokens (e.g. `theme.bg`, `theme.surface`) map to these CSS variables in `apps/mixtape/src/theme/theme.ts`. This allows Chakra components to use semantic tokens:

- `bg="theme.bg"`
- `color="theme.text"`
- `borderColor="theme.border"`

### 2.4 Color Mode (Light/Dark)

Color mode is managed by `next-themes`. The `ColorModeProvider` should wrap the whole app (it now does). The `ThemeSelector` and `useColorMode` toggle between `light` and `dark` modes.

### 2.5 Theme Selection UI

The Theme Selector:
- allows switching the active theme
- supports high-contrast and font scale
- relies on `ThemeContext` for values and setters

It currently lives in `@mixtape/core` and is consumed by both apps.

---

## 3) Where Things Break Down

The biggest issue is **partial adoption of theme tokens**. Many parts of the UI still use fixed colors such as `#ffffff` or `#27272a`. These values never change when the user switches themes, which leads to inconsistent appearance. Two common offenders:

- admin left navs / sidebars (e.g. in `DashboardLayout.tsx`)
- global background wrappers that use fixed colors or default Chakra colors

The system can only work if all backgrounds, borders, and text colors refer to theme tokens or CSS variables.

**Recommended fix:** replace hard-coded colors with `theme.bg`, `theme.surface`, `theme.text`, and `theme.border` (or `useColorModeValue` where appropriate).

---

## 4) Designer Notes

Designers can safely create new palettes by defining these seven colors for light and dark:

- `bg` (page background)
- `bgSecondary` (secondary background, e.g. sidebar or nav column)
- `surface` (card/panel background)
- `accent` (primary brand color)
- `text` (primary text)
- `textSecondary` (secondary text)
- `border` (divider/border color)

Optional: high-contrast variants for accessibility.

**Design recommendation:** treat `bg` as the large, quiet canvas; `surface` should be a subtle lift from `bg`; `accent` should be bold but used sparingly for calls-to-action and key highlights.

New themes can be added by copying an existing entry in:
- `apps/mixtape/src/theme/themes.ts`

---

## 5) Making Themes a Member/Group Feature (Product Plan)

### 5.1 Goals

- Users can select a theme for their profile.
- Groups can specify allowed themes (including custom ones).
- Groups can make a single theme mandatory (brand consistency).
- Users can create personal themes without overwriting defaults.
- Defaults remain immutable but can be hidden per group.

### 5.2 Data Model (Proposed)

**Theme definition**
- `id` (unique)
- `name`
- `palette` (light/dark + optional high-contrast)
- `ownerType`: `system | user | group`
- `ownerId`: `null | userId | groupId`
- `isArchived`: boolean
- `isVisible`: boolean (per owner context)

**Group theme settings**
- `allowedThemeIds`
- `defaultThemeId`
- `lockThemeSelection` (true when only one theme is allowed)

**User theme settings**
- `preferredThemeId`

### 5.2.1 Data Model (Expanded)

**Theme**
- `id` (uuid)
- `name`
- `description` (optional)
- `palette` (json)
  - `light`
    - `bg`, `bgSecondary`, `surface`, `accent`, `text`, `textSecondary`, `border`
  - `dark`
    - `bg`, `bgSecondary`, `surface`, `accent`, `text`, `textSecondary`, `border`
  - `lightHighContrast` (optional)
  - `darkHighContrast` (optional)
- `ownerType` (`system | user | group`)
- `ownerId` (nullable)
- `isArchived` (boolean)
- `createdAt`, `updatedAt`

**GroupThemeSettings**
- `groupId`
- `allowedThemeIds` (array)
- `defaultThemeId` (nullable)
- `lockThemeSelection` (boolean)
- `hiddenSystemThemeIds` (array)

**UserThemePreference**
- `userId`
- `preferredThemeId` (nullable)
- `groupOverrides` (map of `groupId -> themeId`, optional)

### 5.2.2 Access Rules (Suggested)

- System themes are read-only for all users.
- Group owners/admins can create and edit group themes.
- Users can create personal themes and optionally share to a group (pending admin approval).
- Users cannot delete system themes; they can hide them for their group.

### 5.3 UX / UI Concept

**Theme Library**
- Shows system themes + group themes + user themes
- System themes are read-only
- Group owner can hide system themes
- Users can duplicate a system theme into their own and customize

**Theme Editor**
- Seven core color fields
- Live preview
- Contrast warnings (optional)

**Group Settings**
- Toggle which themes are available
- Pick a default
- Lock selection to one or allow multiple

### 5.4 Rollout Phases

1) **Internal admin-only tool** to create/update themes
2) **Group admin UI** to select allowed themes and defaults
3) **Member UI** for personal theme preferences
4) **Theme Editor** for users and groups

### 5.5 API Design (Draft)

**Themes**
- `GET /themes?scope=system|group|user&groupId=...`
- `POST /themes` (create user/group theme)
- `PATCH /themes/:id` (owner only)
- `POST /themes/:id/duplicate` (clone system -> user/group)
- `POST /themes/:id/archive` (soft delete)

**Group Theme Settings**
- `GET /groups/:groupId/theme-settings`
- `PATCH /groups/:groupId/theme-settings`
  - `allowedThemeIds`
  - `defaultThemeId`
  - `lockThemeSelection`
  - `hiddenSystemThemeIds`

**User Preferences**
- `GET /users/me/theme-preferences`
- `PATCH /users/me/theme-preferences`
  - `preferredThemeId`
  - `groupOverrides`

---

## 6) Consolidation Strategy (Mixtape + Crossroads)

The core theme system already lives in `@mixtape/core`. The next step is to move theme definitions into a shared package, or into a new package that both apps import from.

Recommended approach:

1) Create a shared theme module (e.g. `packages/ui-tokens` or `packages/core/theme`) that exports:
   - `themes` (shared defaults)
   - theme types
2) Both apps import from this shared module.
3) Allow app-specific extensions by merging local theme arrays with the shared default list.

This allows Crossroads and Mixtape to share the same theme definitions while still supporting unique themes per app if desired.

---

## 7) Immediate Next Steps (Recommended)

1) Identify all hard-coded colors in layouts and sidebars and replace with theme tokens.
2) Create a quick theme audit page that shows every theme and all seven colors.
3) Define where custom themes will be stored (DB model + API).
4) Design a minimal Theme Editor UI using the six color fields.

---

## Appendix: Key Files

- `apps/mixtape/src/theme/themes.ts` (current theme definitions)
- `apps/crossroads/src/theme/themes.ts` (Crossroads themes)
- `packages/core/src/theme/theme-context.tsx` (shared ThemeProvider)
- `packages/core/src/theme/theme-selector.tsx` (shared ThemeSelector)
- `apps/mixtape/src/theme/theme.ts` (Chakra theme token mapping)
