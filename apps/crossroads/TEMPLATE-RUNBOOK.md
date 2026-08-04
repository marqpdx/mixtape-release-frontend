# Crossroads Page — Template Runbook

How to author a new layout template without a dev agent.

---

## What a Template Is

A layout template is a React component that receives the same set of props
(`TemplateProps`) and renders them in a different visual arrangement. Templates
do not own data fetching, auth, or the admin bar — all of that lives in
`CrossroadsPageClient.tsx`. A template only decides *how* to display what it
receives.

All four existing templates are in:
```
apps/crossroads/src/app/(main)/(site)/[slug]/templates/
```

---

## The Four Slots Available in Every Template

All ad hoc `PageComponent` records are stored with a named `slot`. Each template
decides which slots to render and where. The canonical slot names are:

| Slot | Meaning | Typical position |
|------|---------|-----------------|
| `about` | Additional "about us" content | Below quick_intro or description |
| `links` | Link blocks (useful links, resources) | Below description |
| `cta` | Call-to-action blocks | Above or below admission strip |
| `hero` | Content overlaid on the banner image | Inside the banner (Hero template only) |
| `extra` | Overflow / misc | Bottom of page |

To render a slot in your template:
```tsx
<SlotComponents
  components={components}
  slot="about"
  mutedColor={mutedColor}
  borderColor={borderColor}
/>
```

`SlotComponents` is a no-op if the slot has no components, so place it
anywhere — it won't leave whitespace gaps.

---

## Step-by-Step: Adding a New Template

### 1. Create the component file

Copy `StandardTemplate.tsx` as a starting point:

```
cp templates/StandardTemplate.tsx templates/MyTemplate.tsx
```

The file must:
- Start with `"use client";`
- Import from `./types` (the `TemplateProps` interface)
- Import from `./shared` (sub-components — see below)
- Export a single default function named `MyTemplate`

### 2. Implement the layout

Your component receives `TemplateProps`:

```ts
interface TemplateProps {
  group: PublicGroupDetail;       // Group DB fields (title, quick_intro, etc.)
  components: PageComponent[];    // Ad hoc content blocks
  admissionStatus: AdmissionStatus | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  isSteward: boolean;
  onStatusChange: (status: AdmissionStatus) => void;
}
```

Key fields on `group`:
- `group.title` — group name (may be empty for pre-signup groups, use `|| "Untitled Group"`)
- `group.quick_intro` — short tagline (optional)
- `group.description` — longer body (optional)
- `group.group_type` — "circle" | "community" | "coalition"
- `group.member_count` — integer
- `group.profile_image_url` — emblem/avatar image (nullable)
- `group.background_image_url` — banner image (nullable)
- `group.emblem` — `{ bg, fg, palette, image_url }` (nullable)
- `group.member_preview` — array of `{ username, display_name, avatar_url }`
- `group.child_groups` — array of `{ title, slug, group_type }`
- `group.parent_title` — `{ title, slug }` (nullable)
- `group.decorators` — string[] of decorator codes

### 3. Use the shared sub-components

Import from `./shared` — do not inline these; they must stay consistent across templates.

```tsx
import {
  GroupEmblem,        // circular emblem or profile image
  AdmissionStrip,     // join/request/member CTA
  MemberPreviewStrip, // overlapping avatar row
  ChildGroupsSection, // linked list of child groups
  DecoratorBadges,    // badge row from decorator codes
  SlotComponents,     // renders all PageComponents for a named slot
  PageComponentBlock, // renders a single PageComponent (text/image/link/callout)
} from "./shared";
```

`AdmissionStrip` requires these props — always pass all of them:
```tsx
<AdmissionStrip
  isAuthenticated={isAuthenticated}
  authLoading={authLoading}
  admissionStatus={admissionStatus}
  groupSlug={group.slug}
  groupTitle={group.title}
  mutedColor={mutedColor}
  ctaBg={ctaBg}
  ctaBorderColor={borderColor}
  onStatusChange={onStatusChange}
/>
```

### 4. className convention

Add `className` to every structural Box/HStack/VStack. Prefix = 3–4 chars of
the template name + `-` + semantic name. Example for a template called Mosaic:

```tsx
<Box className="cpt-mosaic-root">
  <Box className="cpt-mosaic-header">...</Box>
  <Box className="cpt-mosaic-body">...</Box>
</Box>
```

Skip `className` on leaf nodes (Text, Button, Badge, Icon).

### 5. Register the template

**Add the backend choice** in `groups/models/public_page.py`:

```python
class LayoutTemplate(models.TextChoices):
    STANDARD = "standard", "Standard"
    HERO = "hero", "Hero"
    FOCUS = "focus", "Focus"
    DIRECTORY = "directory", "Directory"
    MOSAIC = "mosaic", "Mosaic"   # ← add here
```

Run a migration:
```bash
python manage.py makemigrations groups --name="add_mosaic_template"
python manage.py migrate
```

**Add the frontend type** in `packages/api/src/clients/public/publicApi.ts`:

```ts
export type LayoutTemplate = "standard" | "hero" | "focus" | "directory" | "mosaic";
```

**Register in the router** in `CrossroadsPageClient.tsx`:

```ts
import MosaicTemplate from "./templates/MosaicTemplate";

const TEMPLATES = {
  standard: StandardTemplate,
  hero: HeroTemplate,
  focus: FocusTemplate,
  directory: DirectoryTemplate,
  mosaic: MosaicTemplate,   // ← add here
} as const;
```

**Add the label** in `AdminEditBar.tsx`:

```ts
const LAYOUT_LABELS: Record<LayoutTemplate, string> = {
  // ...
  mosaic: "Mosaic",
};
```

### 6. Done

The new template appears in the Steward's layout picker immediately after the
migration is applied. No other changes needed.

---

## What Templates Must NOT Do

- Fetch data from the API (no `fetch()`, no `axiosInstance` calls)
- Check auth or render the admin bar
- Conditionally render the admission strip based on content — it must always
  be reachable from every template
- Import or reference Codex, Catalyst, or Stackroom — templates are pure
  presentation components

---

## Testing a New Template

1. Set a group's `layout_template` to your new value via the Django admin or
   the Steward API: `PATCH /api/groups/<slug>/public-page/draft`
   with `{"layout_template": "mosaic"}`.
2. Publish the page.
3. View `crossroads.mixtape.com/<slug>` anonymously.
4. Check: quick_intro shows correctly with a null value; member_preview shows
   correctly with zero members; admission strip is visible.

---

*Maintained as a deliverable of CR-01B (layout template pattern). Update this
file when adding a new template type.*
