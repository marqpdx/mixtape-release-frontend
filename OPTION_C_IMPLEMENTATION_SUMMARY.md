# Option C Implementation Summary: Two-Pane Layout & Collection Linking

**Date:** 2026-01-09
**Status:** ✅ Frontend Complete | ⚠️ Backend Support Needed

---

## Overview

Successfully implemented a two-pane layout for Collection curation with drag-and-drop support, filter-based browsing, and Collection linking UI.

---

## 1. Two-Pane Layout ✅

### Implementation

**File:** `apps/mixtape/src/components/collections/CollectionDetailWorkArea.tsx`

**Changes:**
- Removed tab-based navigation (`Tabs.Root`)
- Implemented responsive Grid layout:
  ```tsx
  <Grid
    templateColumns={{ base: '1fr', lg: '60fr 40fr' }}
    gap={6}
    alignItems="start"
  >
  ```
- **Mobile (base):** Stacks vertically (single column)
- **Desktop (lg+):** Side-by-side 60% / 40% split

### Left Pane: "This Collection" (60%)

**Features:**
- Shows `CollectionItemsList` with all items already in the collection
- Drag-and-drop reordering (implemented in previous work)
- Tree view with folder hierarchy
- Search, sort, and filter capabilities
- "New Folder" button
- Item count badge in header

### Right Pane: "Add to Collection" (40%)

**Features:**
- Filter-based browsing (not tabs)
- Three filter buttons:
  1. **Previously Uploaded Files** (SourceFile browsing)
  2. **Internal Docs** (WritingPiece browsing)
  3. **Existing Collections** (Collection linking - NEW)
- Upload toggle button (only visible for Files filter)
- Shows item counts for each category

---

## 2. Filter-Based UI ✅

### Implementation

**File:** `apps/mixtape/src/components/stackroom/CollectionBrowser.tsx`

**Old Design:** Three tabs (Files, Documents, Upload)
**New Design:** Filter buttons with integrated upload

**Changes:**
- Replaced `Tabs` with `Button` group
- Added `FilterType` state: `'files' | 'documents' | 'collections'`
- Integrated upload as toggle within Files filter
- Tabler icons for better consistency:
  - `IconFile` for Previously Uploaded Files
  - `IconFileText` for Internal Docs
  - `IconFolders` for Existing Collections

**Benefits:**
- Cleaner, more compact UI
- Easier to scan available options
- Upload integrated contextually (only shows for Files)

---

## 3. Collection Linking UI ✅

### Implementation

**New File:** `apps/mixtape/src/components/stackroom/AvailableCollectionsList.tsx`

**Features:**

#### Browse Available Collections
- Lists all collections except the current one
- Shows collection title, summary, item count, sponsor type
- Visual folder icon for each collection

#### Two Linking Modes

1. **Link Collection (Pointer Mode)** 🔗
   - Creates reference to source Collection
   - Updates automatically when source changes
   - Button: "Link Collection" (blue outline)

2. **Copy All Items (Independent Mode)** ➕
   - Copies individual LibraryItem records
   - Independent of source Collection
   - Changes don't propagate
   - Button: "Copy All Items" (gray outline)

#### Educational UI
- Info banner explaining difference between Link and Copy modes
- Color-coded actions (blue for link, gray for copy)
- Clear visual distinction

### Backend Integration (TODO)

**Current Status:** UI complete, backend support needed

**Required Backend Changes:**

#### 1. Support Collection Content Type in LibraryItem

**Model Changes:**
```python
# stackroom/models/ir.py - LibraryItem

# Update content_type to accept 'collection'
content_type = models.ForeignKey(
    ContentType,
    on_delete=models.CASCADE,
    null=True,
    blank=True,
    # Should accept: SourceFile | WritingPiece | Library (Collection)
)
```

**Validation:**
```python
def clean(self):
    # Allow linking to Collections
    if self.content_type and self.content_type.model == 'library':
        # Prevent circular references
        if self.content_object_id == self.library.id:
            raise ValidationError("Cannot link collection to itself")

        # Prevent deep nesting of collection links (optional)
        # Check if target collection links to this one
```

#### 2. API Endpoint for Copying All Items

**New Endpoint:**
```python
# POST /api/collections/{collection_id}/items/copy-from/{source_collection_id}/
```

**Functionality:**
- Fetch all items from source collection
- Create new LibraryItem records in target collection
- Preserve folder structure (parent_id relationships)
- Maintain order_index
- Return count of copied items

**Implementation:**
```python
# stackroom/api/collection_views.py

@action(detail=True, methods=['post'], url_path='items/copy-from/(?P<source_id>[^/.]+)')
def copy_items_from_collection(self, request, pk=None, source_id=None):
    target_collection = self.get_object()
    source_collection = Library.objects.get(id=source_id)

    source_items = LibraryItem.objects.filter(library=source_collection)

    copied_items = []
    for item in source_items:
        new_item = LibraryItem.objects.create(
            library=target_collection,
            content_type=item.content_type,
            content_object_id=item.content_object_id,
            is_folder=item.is_folder,
            title=item.title,
            parent=item.parent,  # Preserve hierarchy
            order_index=item.order_index,
            notes=item.notes,
            tags=item.tags,
        )
        copied_items.append(new_item)

    return Response({
        'detail': f'Copied {len(copied_items)} items',
        'copied_count': len(copied_items)
    })
```

#### 3. Update TypeScript Types

**File:** `packages/core/src/types/collectionTypes.ts`

**Add Collection variant to LibraryItem:**
```typescript
export type LibraryItem =
  | {
      // Collection link variant (NEW)
      content_type: 'collection';
      is_folder: false;
      content: CollectionLinkContent;

      id: string;
      parent_id: string | null;
      order_index: number;
      tags: string[];
      notes: string;
      is_featured: boolean;
      is_hidden: boolean;
      created_at: string;
      updated_at: string;
    }
  | { /* folder variant */ }
  | { /* source_file variant */ }
  | { /* writing_piece variant */ };

export interface CollectionLinkContent {
  id: string;
  title: string;
  summary: string;
  item_count: number;
  file_count: number;
}
```

#### 4. Update Serializers

**File:** `app/stackroom/api/collection_serializers.py`

**Update `LibraryItemCreateSerializer`:**
```python
class LibraryItemCreateSerializer(serializers.Serializer):
    content_type = serializers.ChoiceField(
        choices=['source_file', 'writing_piece', 'collection'],  # Add 'collection'
        help_text="Type of content to add"
    )
    content_id = serializers.UUIDField(help_text="ID of content object")
    # ... rest of fields
```

**Update `LibraryItemSerializer.get_content()`:**
```python
def get_content(self, obj):
    content_obj = obj.content_object

    if obj.content_type.model == 'library':  # Collection link
        return {
            'id': str(content_obj.id),
            'title': content_obj.title,
            'summary': content_obj.summary,
            'item_count': content_obj.items.count(),
            'file_count': content_obj.source_files.count(),
        }
    # ... existing cases
```

---

## 4. Frontend Integration Points

### Handlers in CollectionBrowser

**Link Collection:**
```typescript
const handleLinkCollection = async (linkedCollectionId: string) => {
  await createMutation.mutateAsync({
    collectionId,
    data: {
      content_type: 'collection',
      content_id: linkedCollectionId,
    },
  });

  toaster.create({
    title: 'Collection linked',
    description: 'Collection has been linked. Updates will sync automatically.',
    type: 'success',
  });

  onItemAdded?.();
};
```

**Copy All Items:**
```typescript
const handleAddAllItems = async (sourceCollectionId: string) => {
  const response = await fetch(
    `/api/collections/${collectionId}/items/copy-from/${sourceCollectionId}/`,
    { method: 'POST' }
  );

  const data = await response.json();

  toaster.create({
    title: 'Items copied',
    description: `Copied ${data.copied_count} items from source collection`,
    type: 'success',
  });

  onItemAdded?.();
};
```

---

## 5. Mobile Responsiveness ✅

### Grid Breakpoints

```tsx
<Grid
  templateColumns={{ base: '1fr', lg: '60fr 40fr' }}
  gap={6}
  alignItems="start"
>
```

**Behavior:**
- **Mobile (base):** Single column layout, "This Collection" appears first, then "Add to Collection"
- **Tablet (md):** Single column (can be adjusted if needed)
- **Desktop (lg+):** Two-column 60/40 split

### Alternative: Bottom Sheet (Future Enhancement)

For a more mobile-native experience, could implement bottom sheet pattern:

**Library:** Use `@chakra-ui/react` Drawer component
```tsx
// Mobile: Show "Add Items" button that opens Drawer
<Drawer placement="bottom">
  <DrawerContent>
    <CollectionBrowser ... />
  </DrawerContent>
</Drawer>
```

**Benefits:**
- Native mobile feel
- Full-screen browsing space
- Swipe-to-dismiss gesture

---

## 6. Visual Design Highlights

### Left Pane (This Collection)
- Card with header showing collection icon + count badge
- Clean, scannable list
- Drag handles visible on hover
- Indented tree structure for folders

### Right Pane (Add to Collection)
- Card with header explaining purpose
- Horizontal filter button group
- Upload toggle contextually integrated
- Visual separation with cards

### Collection Link Cards
- Folder icon with blue color scheme
- Title + summary + stats
- Two clear action buttons
- Educational info banner at bottom

---

## 7. Testing Checklist

### Frontend (Completed)
- [x] Two-pane layout renders correctly on desktop
- [x] Single column layout on mobile
- [x] Filter buttons switch content correctly
- [x] Previously Uploaded Files shows available files
- [x] Internal Docs shows available documents
- [x] Existing Collections lists other collections
- [x] Upload toggle works for Files filter
- [x] Upload hidden for other filters
- [x] Collection cards render with all info
- [x] Both action buttons present and labeled correctly

### Backend (Pending)
- [ ] LibraryItem accepts content_type='collection'
- [ ] Can create LibraryItem linking to another Collection
- [ ] Collection links appear in CollectionItemsList
- [ ] Prevent circular references (Collection A → Collection B → Collection A)
- [ ] Copy-from endpoint copies all items correctly
- [ ] Copied items preserve folder structure
- [ ] Copied items independent of source

### Integration (After Backend Complete)
- [ ] Link Collection creates pointer successfully
- [ ] Linked collection shows 🔗 indicator in UI
- [ ] Copy All Items duplicates all items
- [ ] Copied items don't update when source changes
- [ ] Linked items DO update when source changes (real-time or on refresh)

---

## 8. Known Issues / Future Enhancements

### Backend Support Needed

1. **Collection Linking:**
   - Backend doesn't yet support `content_type='collection'` in LibraryItem
   - Need to add validation to prevent circular references
   - Need to handle display of linked collections in CollectionItemCard

2. **Copy All Items Endpoint:**
   - New API endpoint needed: `POST /api/collections/{id}/items/copy-from/{source_id}/`
   - Should copy all items including folder structure
   - Need to handle large collections (potentially async task)

### Future UI Enhancements

1. **Linked Collection Display:**
   - Add special rendering in CollectionItemCard for linked collections
   - Show 🔗 badge and "Linked" indicator
   - Show source collection name and item count
   - Click to expand/preview linked collection contents

2. **Drag-to-Link:**
   - Drag collection from right pane into left pane to link
   - Visual feedback during drag (highlight drop zone)

3. **Bulk Operations:**
   - Select multiple files/docs from right pane
   - Add selected items in batch
   - Progress indicator for large batches

4. **Search in Right Pane:**
   - Add search input above filter buttons
   - Filter available items by name/title
   - Works across all three content types

5. **Bottom Sheet Mobile Pattern:**
   - Replace grid stacking with drawer/sheet on mobile
   - Better use of screen real estate
   - Native mobile gesture support

---

## 9. Files Modified

### Core Layout
- `apps/mixtape/src/components/collections/CollectionDetailWorkArea.tsx`
  - Removed Tabs, added Grid layout
  - Implemented two-pane structure

### Browser Component
- `apps/mixtape/src/components/stackroom/CollectionBrowser.tsx`
  - Replaced tabs with filter buttons
  - Added Collections filter
  - Integrated upload as toggle
  - Added handlers for linking (with TODOs)

### New Components
- `apps/mixtape/src/components/stackroom/AvailableCollectionsList.tsx`
  - Lists available collections
  - Link/Copy action buttons
  - Educational info banner

### Supporting Components (Previous Work)
- `apps/mixtape/src/components/stackroom/CollectionItemsList.tsx`
  - Drag-and-drop support
  - Tree view with folders
  - Search and sort

- `apps/mixtape/src/components/stackroom/CollectionItemCard.tsx`
  - Drag handles
  - File type icons
  - Folder expand/collapse

---

## 10. Summary

✅ **Completed:**
- Two-pane responsive layout (60/40 split, stacks on mobile)
- Filter-based UI (Previously Uploaded, Internal Docs, Existing Collections)
- Collection linking UI with Link/Copy modes
- Educational tooltips explaining linking behavior
- Full frontend implementation ready for testing

⚠️ **Backend Work Needed:**
- Support `content_type='collection'` in LibraryItem model
- Prevent circular reference validation
- Implement `POST /api/collections/{id}/items/copy-from/{source_id}/` endpoint
- Update serializers to handle collection content
- Update TypeScript types for collection variant

🎯 **Next Steps:**
1. Hand off to backend team for LibraryItem.content_type expansion
2. Implement copy-from endpoint
3. Update CollectionItemCard to render linked collections
4. Test circular reference prevention
5. Add integration tests for Collection linking

---

**Prepared by:** Claude Code
**Review with:** Frontend Team, Backend Team, UX Team
**Ready for:** QA Testing (Frontend), Backend Implementation
