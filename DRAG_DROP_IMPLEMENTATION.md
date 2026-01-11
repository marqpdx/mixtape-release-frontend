# Drag-and-Drop Implementation for Collections

## Status: Backend Complete ✓ | Frontend Ready to Implement

## Overview

Collections need drag-and-drop support for:
1. **Reordering items** - Change order_index within same parent
2. **Nesting items** - Move items into/out of folders (change parent_id)
3. **Creating hierarchy** - Up to 3 levels (root → section → subsection)

## Backend API ✓ Complete

### Endpoint
`POST /api/collections/{collection_id}/items/reorder/`

### Request Format
```json
{
  "items": [
    {
      "id": "uuid-1",
      "order_index": 0,
      "parent_id": null  // Optional: null = root, uuid = nest under folder
    },
    {
      "id": "uuid-2",
      "order_index": 1,
      "parent_id": "folder-uuid"  // Nest under a folder
    }
  ]
}
```

### Validation
- ✓ Parent must be a folder (is_folder=True)
- ✓ Max depth: 3 levels
- ✓ Cannot nest under non-folder items
- ✓ Model validation runs on save (LibraryItem.clean())

### Frontend Types ✓ Updated
- `LibraryItem` now includes:
  - `is_folder: boolean`
  - `title: string` (for folders)
  - `parent_id: string | null`
- `LibraryItemReorderRequest` supports optional `parent_id`

## Frontend Implementation (To Do)

### 1. Install Drag-and-Drop Library

**Recommended: @dnd-kit/core** (modern, accessible, tree-friendly)

```bash
cd REDACTED-LOCAL-PATH/mixtape-release-frontend
yarn add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Why @dnd-kit?**
- Excellent nested list support
- Built-in accessibility (keyboard nav)
- Smooth animations
- Small bundle size
- Well-maintained

**Alternatives considered:**
- react-beautiful-dnd (deprecated)
- react-dnd (complex API, larger bundle)

### 2. Component Architecture

```
CollectionItemsList (container)
├─ DndContext (@dnd-kit provider)
├─ SortableContext (handles sorting logic)
└─ CollectionItemCard (draggable items)
   ├─ Drag Handle (IconGripVertical)
   ├─ Content (file/doc info)
   └─ Actions (edit, remove, etc.)
```

### 3. Implementation Steps

#### Step A: Add Drag Handles to CollectionItemCard

```tsx
// CollectionItemCard.tsx
import { IconGripVertical } from '@tabler/icons-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function CollectionItemCard({ item, ... }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card.Root ref={setNodeRef} style={style}>
      <Card.Body>
        <HStack>
          {/* Drag Handle */}
          <Box
            {...attributes}
            {...listeners}
            cursor="grab"
            color="gray.400"
            _hover={{ color: "gray.600" }}
          >
            <IconGripVertical size={20} />
          </Box>

          {/* Rest of card content */}
          {renderContent()}
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}
```

#### Step B: Make CollectionItemsList Draggable

```tsx
// CollectionItemsList.tsx
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';

export function CollectionItemsList({ collectionId }) {
  const { items, refetch } = useCollectionItems(collectionId);
  const reorderMutation = useReorderLibraryItems();

  // Configure sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Find items
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);

    // Optimistically update UI
    const newItems = arrayMove(items, oldIndex, newIndex);

    // Update order_index for all affected items
    const updates = newItems.map((item, index) => ({
      id: item.id,
      order_index: index,
      // parent_id remains unchanged for simple reorder
    }));

    try {
      await reorderMutation.mutateAsync({
        collectionId,
        data: { items: updates },
      });
      refetch();
    } catch (error) {
      console.error('Reorder failed:', error);
      // Revert optimistic update
      refetch();
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(i => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map(item => (
          <CollectionItemCard
            key={item.id}
            item={item}
            {...otherProps}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

#### Step C: Add Nesting Support (Advanced)

For nesting, detect when dragging over a folder:

```tsx
const handleDragOver = (event) => {
  const { active, over } = event;

  if (!over) return;

  const activeItem = items.find(i => i.id === active.id);
  const overItem = items.find(i => i.id === over.id);

  // If dragging over a folder, show visual feedback
  if (overItem?.is_folder) {
    // Highlight folder as drop target
    setDropTargetId(overItem.id);
  }
};

const handleDragEnd = async (event) => {
  const { active, over } = event;

  if (!over) return;

  const activeItem = items.find(i => i.id === active.id);
  const overItem = items.find(i => i.id === over.id);

  let newParentId = activeItem.parent_id;
  let newOrderIndex = activeItem.order_index;

  // Check if dropped on a folder
  if (overItem.is_folder) {
    // Nest under this folder
    newParentId = overItem.id;
    newOrderIndex = 0;  // Place at start of folder
  } else {
    // Reorder at same level
    newParentId = overItem.parent_id;
    // Calculate new order_index...
  }

  // Validate depth before sending
  const depth = calculateDepth(items, newParentId);
  if (depth > 3) {
    toast.error('Maximum nesting depth (3 levels) exceeded');
    return;
  }

  // Update via API
  await reorderMutation.mutateAsync({
    collectionId,
    data: {
      items: [{
        id: active.id,
        order_index: newOrderIndex,
        parent_id: newParentId,
      }]
    },
  });
};
```

#### Step D: Tree View for Nested Items

Display hierarchy with indentation:

```tsx
function renderItemTree(items: LibraryItem[], parentId: string | null = null, depth = 0) {
  const childItems = items.filter(i => i.parent_id === parentId);

  return childItems.map(item => (
    <Box key={item.id} pl={depth * 4}>
      <CollectionItemCard item={item} />

      {/* Render children recursively */}
      {item.is_folder && renderItemTree(items, item.id, depth + 1)}
    </Box>
  ));
}
```

### 4. Folder Creation UI

Add "New Folder" button in CollectionItemsList:

```tsx
<Button
  size="sm"
  variant="ghost"
  onClick={handleCreateFolder}
>
  <IconFolderPlus size={16} />
  New Folder
</Button>
```

API call:
```tsx
const createFolderMutation = useCreateLibraryItem();

const handleCreateFolder = async () => {
  await createFolderMutation.mutateAsync({
    collectionId,
    data: {
      content_type: 'folder',  // Special type for folders
      is_folder: true,
      title: 'New Folder',
      order_index: items.length,
    },
  });
  refetch();
};
```

## Testing Checklist

- [ ] Install @dnd-kit packages
- [ ] Add drag handles to items
- [ ] Basic drag-to-reorder works
- [ ] Order persists after refresh
- [ ] Folders display with folder icon
- [ ] Can create new folders
- [ ] Can drag items into folders
- [ ] Can drag items out of folders (to root)
- [ ] Max depth (3 levels) enforced
- [ ] Cannot nest under non-folders
- [ ] Keyboard navigation works (accessibility)
- [ ] Visual feedback during drag
- [ ] Works on mobile (touch)

## Future Enhancements

- Drag-to-expand collapsed folders
- Bulk select + drag multiple items
- Undo/redo for reordering
- Folder templates (e.g., "Week 1" structure)
- Copy entire folder structure to another collection
