# Group Edit Modes - Implementation Guide

## Overview

The group editing system now supports two distinct modes with a unified toolbar interface:

### Regular Mode
- Changes held in memory until "Save" is clicked
- Save writes directly to database
- Optional auto-save (every 3 seconds when enabled)

### Draft Mode
- Changes saved to browser localStorage
- Survives page refreshes
- "Publish Changes" to commit to database
- "Discard" to abandon draft and revert

## Components Created

### 1. `GroupEditToolbar.tsx`
Top-level toolbar that shows:
- Mode switcher (Regular/Draft)
- Action buttons (Save/Cancel or Save Draft/Publish/Discard)
- Auto-save checkbox
- Save status indicator

### 2. `useDraftManager.ts`
Hook that manages localStorage drafts:
- `saveDraft()` - Save to localStorage
- `clearDraft()` - Remove draft
- `getCurrentData()` - Get merged data (draft + original)
- `hasChanges` - Check if draft differs from saved

### 3. `GroupDetailWrapper.tsx` (Updated)
Main orchestrator that:
- Manages mode state
- Coordinates saves/publishes
- Handles auto-save timing
- Integrates toolbar with form

### 4. `GroupEditForm.tsx` (Simplified)
Pure form component that:
- Displays all fields
- Reports changes to parent via `onFieldChange`
- No longer handles save logic (toolbar does this)

## Usage

```typescript
// Basic usage
<GroupDetailWrapper slug="my-group" mode="edit" />

// With success callback
<GroupDetailWrapper
  slug="my-group"
  mode="edit"
  onSuccess={(group) => console.log('Saved!', group)}
/>

// Custom render (advanced)
<GroupDetailWrapper
  slug="my-group"
  renderComponent={(group) => <CustomComponent group={group} />}
/>
```

## User Workflows

### Quick Edit (Regular Mode)
1. User enters Regular Mode (default)
2. Edits fields
3. Clicks "Save" → Database updated
4. Done

### Auto-Save Edit (Regular Mode)
1. User enters Regular Mode
2. Checks "Auto-save" checkbox
3. Edits fields
4. Every 3 seconds → Database updated automatically
5. Status shows "Saved [time]"

### Draft Edit (Experimental)
1. User clicks "Draft Mode"
2. Edits multiple fields
3. Clicks "Save Draft" → localStorage updated
4. Can close browser, come back later
5. Draft automatically restored
6. Use role switcher to view public/member view
7. Return to Admin → Edit view to continue
8. When satisfied, clicks "Publish Changes" → Database updated
9. Draft cleared from localStorage

### Discard Changes
- In Regular Mode: "Cancel" button (with confirmation if dirty)
- In Draft Mode: "Discard" button (clears localStorage + reverts)

## localStorage Key Format

Drafts are stored with unique keys per group:
```
group_draft_{slug}
```

Example: `group_draft_earth-stewards`

## Integration with Role Switcher

The edit modes work seamlessly with your existing role switcher:
- Admin view shows edit interface
- Switch to Member/Public view to preview
- Switch back to Admin → remembers you were editing
- Draft persists across view switches

## Status Indicators

**Toolbar shows:**
- 🔵 "Saving..." (while save in progress)
- 🟠 "Unsaved changes" (dirty state)
- ✅ "Saved 2:35 PM" (last save time)
- ⚪ "No changes" (clean state)

## Mode Descriptions

**Regular Mode:**
> Changes are saved to database when you click Save (auto-saving every 3 seconds)

**Draft Mode:**
> Changes saved to browser storage. Use "Publish Changes" to save to database.

## API Calls

### Regular Mode Save
```typescript
PATCH /api/groups/{slug}
Body: { title: "New Title", ... }
```

### Draft Mode
```typescript
// Save Draft → No API call (localStorage only)

// Publish Changes → API call
PATCH /api/groups/{slug}
Body: { /* merged draft + pending changes */ }
```

## Technical Notes

- Form uses `react-hook-form` for validation
- Changes detected via `watch()` mechanism
- Parent receives changes via `onFieldChange` callback
- Auto-save has 3-second debounce
- Dirty state tracks any unsaved changes
- Mode switching prompts if unsaved changes exist

## Future Enhancements

- [ ] Server-side draft storage (instead of localStorage)
- [ ] Draft version history
- [ ] Multi-device draft sync
- [ ] Auto-save interval configuration
- [ ] Draft expiration/cleanup
- [ ] Conflict resolution if group changed elsewhere

## File Locations

```
src/
├── components/
│   └── groups/
│       ├── GroupEditToolbar.tsx     (NEW)
│       ├── GroupDetailWrapper.tsx   (UPDATED)
│       └── GroupEditForm.tsx        (UPDATED)
└── hooks/
    ├── useGroups.ts                 (UPDATED - mutations)
    └── useDraftManager.ts           (NEW)
```

---

✅ **Ready to use!** The implementation is complete and follows your exact specifications.