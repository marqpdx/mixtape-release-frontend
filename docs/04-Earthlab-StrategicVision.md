# 🎨 EarthLab Frontend Architecture
## Course Builder UI Implementation Guide

**Status:** Core Reference Document
**Version:** 1.0
**Last Updated:** November 7, 2025
**Audience:** Frontend Engineers, Product Teams

---

## Quick Reference: What Gets Built

**Week 1:** Vertical tree view + detail panel + autosave
**Week 2:** Drag-drop + inline editing + block preview
**Week 3:** Horizontal tree view + expand-all/collapse-all
**Week 4:** Block library + delete flows + polish

---

## Core UI Philosophy

**Locked Design Decisions:**

1. ✅ **Two tree views** (vertical default, horizontal explorer)
2. ✅ **Inline editing** (double-click title, blur to save)
3. ✅ **Autosave** (blur + 2s idle + drag-complete)
4. ✅ **Detail panel** (breadcrumb nav, context-aware editing)
5. ✅ **Drag-drop** (reorder or move between containers)
6. ✅ **Block library** (This Group + Community tabs)
7. ✅ **Smart deletion** (no cascades, blocks preserved)

---

## Architecture Overview

```
CourseDetailsWorkArea (orchestrator)
├─ useModules(courseId) [React Query]
├─ useSelectedEntity [Context: which entity in focus?]
│
├─ ViewToggle [Vertical | Horizontal]
│
├─ Vertical View (drill-down tree)
│  └─ TreeView
│     └─ TreeNode (recursive, expandable, editable)
│
├─ Horizontal View (explorer, cards)
│  └─ HorizontalTreeView (breadcrumb + level view)
│
└─ DetailPanel (modal-like right sidebar)
   ├─ Breadcrumb (clickable navigation)
   └─ Dynamic content based on entity type
      ├─ ModuleEditPanel
      ├─ LessonEditPanel
      └─ BlockEditPanel (with Tiptap editor)
```

---

## State Management

### React Query (Server State)

```typescript
// Hooks layer - data fetching
export const useModules = (courseId: string) => {
  return useQuery({
    queryKey: ['modules', courseId],
    queryFn: () => moduleApi.getModules(courseId),
    staleTime: 30_000,  // 30 seconds
  });
};

export const useLessons = (moduleId: string) => {
  return useQuery({
    queryKey: ['lessons', moduleId],
    queryFn: () => lessonApi.getLessons(moduleId),
    staleTime: 30_000,
  });
};

export const useBlocks = (lessonId: string) => {
  return useQuery({
    queryKey: ['blocks', lessonId],
    queryFn: () => blockApi.getBlocks(lessonId),
    staleTime: 30_000,
  });
};

// Mutations - autosave with optimistic updates
export const useUpdateModule = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => moduleApi.updateModule(data),
    onMutate: async (data) => {
      const previous = queryClient.getQueryData(['modules', courseId]);
      queryClient.setQueryData(['modules', courseId], (old) =>
        old.map(m => m.id === data.id ? { ...m, ...data } : m)
      );
      return { previous };
    },
    onError: (err, data, context) => {
      queryClient.setQueryData(['modules', courseId], context?.previous);
      toast.error(`Failed to save: ${err.message}`);
    },
  });
};
```

### Context (UI State)

```typescript
interface CourseEditorContextType {
  selectedEntity: SelectedEntity;  // Which entity in detail panel?
  setSelectedEntity: (entity: SelectedEntity) => void;

  viewMode: 'vertical' | 'horizontal';  // Which tree view?
  setViewMode: (mode: 'vertical' | 'horizontal') => void;

  expandedIds: Set<string>;  // Which tree nodes expanded?
  toggleExpanded: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  isDragging: boolean;  // For visual feedback
}
```

---

## Component Structure

### File Organization

```
src/components/earthlab/
├─ CourseDetailsWorkArea.tsx         [Entry point]
├─ Toolbar.tsx                       [View toggle, expand/collapse]
├─ TreeView.tsx                      [Vertical tree renderer]
├─ TreeNode.tsx                      [Recursive node, inline edit]
├─ HorizontalTreeView.tsx            [Explorer mode]
├─ DetailPanel.tsx                   [Modal wrapper]
├─ ModuleEditPanel.tsx               [Module details]
├─ LessonEditPanel.tsx               [Lesson details]
├─ BlockEditPanel.tsx                [Block details + Tiptap]
├─ TiptapEditor.tsx                  [Rich text wrapper]
├─ BlockTypeSelector.tsx             [Block type chooser]
├─ ExpandCollapseToggle.tsx          [Expand all / collapse all]
├─ BlockLibraryTab.tsx               [Sponsor tabs]
├─ BlockLibraryList.tsx              [Searchable library]
│
├─ context/
│  └─ CourseEditorContext.tsx        [UI state provider]
│
├─ hooks/
│  ├─ useModules.ts                  [React Query]
│  ├─ useLessons.ts
│  ├─ useBlocks.ts
│  ├─ useBlockLibrary.ts
│  ├─ useUpdateModule.ts             [Mutations]
│  ├─ useUpdateLesson.ts
│  ├─ useUpdateBlock.ts
│  ├─ useAutosave.ts                 [Autosave logic]
│  └─ useDragDrop.ts                 [@dnd-kit integration]
│
├─ api/
│  ├─ moduleApi.ts
│  ├─ lessonApi.ts
│  ├─ blockApi.ts
│  └─ blockLibraryApi.ts
│
└─ types/
   └─ earthlab.ts                    [TypeScript interfaces]
```

---

## Tree View Renderers

### Vertical Tree (Default, Drill-Down)

**Purpose:** Hierarchical view with expand/collapse

**Example UI:**
```
📚 Course: Regenerative Living
├─ 📦 Module 1: Soil (draft)
│  ├─ 📄 Lesson 1.1 (published) ✅
│  │  ├─ 📝 Objectives (draft)
│  │  ├─ 📚 Reading (published)
│  │  └─ ✏️ Exercise (published)
│  └─ 📄 Lesson 1.2 (draft)
└─ 📦 Module 2: Composting (published) ✅
```

**Interactions:**
- Click expand icon → toggle children
- Double-click title → inline edit
- Drag → reorder or move
- Right-click → context menu (delete, duplicate, publish)

**TreeNode.tsx Pattern:**
```typescript
const TreeNode: React.FC<TreeNodeProps> = ({
  entity, level, onSelect, onExpand, isExpanded
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(entity.title);

  const handleDoubleClick = () => setIsEditing(true);

  const handleSave = async () => {
    if (editValue !== entity.title) {
      await updateMutation.mutate({ ...entity, title: editValue });
    }
    setIsEditing(false);
  };

  return (
    <Box pl={level * 4}>
      <HStack>
        {/* Expand icon */}
        {entity.children?.length > 0 && (
          <IconButton
            size="sm"
            icon={isExpanded ? <ChevronDown /> : <ChevronRight />}
            onClick={() => onExpand(entity.id)}
          />
        )}

        {/* Title (editable) */}
        {isEditing ? (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setIsEditing(false);
            }}
          />
        ) : (
          <Text
            onDoubleClick={handleDoubleClick}
            cursor="pointer"
            _hover={{ bg: 'gray.100' }}
          >
            {entity.title}
          </Text>
        )}

        {/* Status badge */}
        <Badge>{entity.status}</Badge>

        {/* Actions menu */}
        <Menu>
          <MenuButton as={IconButton} icon={<More />} size="sm" />
          <MenuList>
            <MenuItem onClick={() => onSelect(entity)}>Edit</MenuItem>
            <MenuItem onClick={() => duplicate(entity)}>Duplicate</MenuItem>
            <MenuItem onClick={() => publish(entity)}>Publish</MenuItem>
            <MenuItem color="red.500" onClick={() => delete(entity)}>Delete</MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      {/* Children (if expanded) */}
      {isExpanded && entity.children?.map((child) => (
        <TreeNode
          key={child.id}
          entity={child}
          level={level + 1}
          onSelect={onSelect}
          onExpand={onExpand}
          isExpanded={expandedIds.has(child.id)}
        />
      ))}
    </Box>
  );
};
```

### Horizontal Tree (Explorer Mode)

**Purpose:** Wide, breadcrumb-based navigation

**Example UI:**
```
Regenerative Living > Soil Health >

┌──────────────────────────────┐
│ 📄 Lesson 1.1: Introduction  │
│ By Jane Smith | published ✅ │
│ Summary: Learn about soil    │
│ ▼ Blocks (3)               │
│  • Learning Objectives      │
│  • Reading (Ch. 3)          │
│  • Exercise (Design system) │
└──────────────────────────────┘
```

**HorizontalTreeView.tsx Pattern:**
```typescript
const HorizontalTreeView: React.FC<Props> = ({ course, selectedEntity }) => {
  const { module_id, lesson_id } = selectedEntity.breadcrumb;

  if (lesson_id) return <BlocksList lessonId={lesson_id} />;
  if (module_id) return <LessonsList moduleId={module_id} />;
  return <ModulesList courseId={course.id} />;
};

const ModulesList: React.FC<{ courseId: string }> = ({ courseId }) => {
  const { data: modules } = useModules(courseId);

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
      {modules?.map((module) => (
        <Card key={module.id} cursor="pointer">
          <Card.Root>
            <Card.Body>
              <HStack justify="space-between" mb={2}>
                <Heading size="md">{module.title}</Heading>
                <Badge>{module.status}</Badge>
              </HStack>
              <Text color="gray.600" mb={4}>{module.description}</Text>
              <Text fontSize="sm">{module.lessons?.length || 0} lessons</Text>
            </Card.Body>
          </Card.Root>
        </Card>
      ))}
    </SimpleGrid>
  );
};
```

---

## Autosave Strategy

### Three Triggers

**1. Blur (Immediate)**
- Trigger: User leaves input field
- Use: Inline title edits, summary fields
- Show: Inline spinner while saving

**2. Idle (2 Second Debounce)**
- Trigger: User stops typing
- Use: Tiptap editor content
- Show: Subtle checkmark when complete

**3. Drag-Complete (Immediate)**
- Trigger: Drop operation completes
- Use: Reordering or moving items
- Show: Optimistic UI update (instant)

### Implementation

```typescript
export const useAutosave = (
  callback: (value: string) => Promise<void>,
  delay: number = 2000
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const save = useCallback((value: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      setSaveError(null);

      try {
        await callback(value);
      } catch (error) {
        setSaveError(error.message);
      } finally {
        setIsSaving(false);
      }
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { save, isSaving, saveError };
};

// Usage
const [content, setContent] = useState(block.content);
const { save, isSaving } = useAutosave(
  (value) => blockApi.updateBlock(block.id, { content: value }),
  2000
);

const handleContentChange = (value: string) => {
  setContent(value);
  save(value);
};
```

---

## Key Interactions

### 1. Drag-Drop (Reorder & Move)

**Reorder within container:**
```
User drags Lesson 2 above Lesson 1 (same module)
  ↓
Calculate new order: [L2: 1, L1: 2]
  ↓
Optimistic UI update (immediate)
  ↓
API POST /modules/{id}/lessons/reorder/
  ↓
If error, UI reverts + toast
```

**Move between containers:**
```
User drags Lesson 1 from Module A to Module B
  ↓
API POST /modules/{oldId}/lessons/{lessonId}/move/
  with payload: { module_id: newModuleId, order: 3 }
  ↓
Backend validates + updates both module orders
  ↓
Cache invalidates two queries (both modules)
```

### 2. Breadcrumb Navigation

```
User in BlockEditPanel (course > module > lesson > block)
  ↓
Breadcrumb: "Living > Soil > Intro > Objectives"
  ↓
User clicks "Soil"
  ↓
Context updates selectedEntity to Module
  ↓
DetailPanel re-renders with ModuleEditPanel
  ↓
All without leaving detail panel
```

### 3. Publishing Workflow

```
User clicks "Publish"
  ↓
Frontend validates (has required blocks? has content?)
  ↓
If invalid: Show error toast, stay in draft
  ↓
If valid: API POST /publish
  ├─ Backend sets: status='published', published_at=now()
  ├─ Cache updates
  └─ Success toast + badge changes
```

---

## Block Library Integration

### Two-Tab Structure

**Tab 1: This Group** (sponsor == current group)
**Tab 2: Community** (sponsor == default/community group)
**Checkbox: Show All** (include archived + private)

### Add Block from Library

```
User clicks "Add block from library"
  ↓
Modal opens BlockLibraryTabs
  ↓
User searches, finds block
  ↓
User clicks "Add"
  ↓
API POST /block-library/{blockId}/add-to-lesson/
  with payload: { lesson_id, order: next }
  ↓
Backend creates NEW copy (same sponsor)
  ↓
New block appears in lesson
  ↓
Success toast
```

### Donate Block to Community

```
User in BlockEditPanel
  ↓
Clicks "Donate to Community"
  ↓
Confirmation modal
  ↓
API POST /blocks/{blockId}/donate/
  ↓
Backend:
  - sponsor_id = community_group
  - original_author_id = user
  ↓
Block now in "Community" tab
  ↓
Success toast: "Block donated!"
```

---

## Deletion Patterns

### Delete Module (Smart Reassignment)

```
User: "Delete 'Soil Health'?"
  ↓
Modal: "3 lessons will be orphaned."
  ↓
Options:
  • "Move to another module" [default]
  • "Delete everything"
  ↓
User selects reassignment target
  ↓
API DELETE /modules/{id}
  with payload: { reassign_lessons_to: moduleId }
  ↓
Backend moves all lessons
  ↓
Success toast
```

### Delete Lesson (Blocks Preserved)

```
User: "Delete 'Introduction'?"
  ↓
Modal: "3 blocks will be preserved in library."
  ↓
User confirms
  ↓
API DELETE /modules/{id}/lessons/{id}
  ↓
Backend: deletes lesson, preserves blocks
  ↓
Success toast: "3 blocks preserved"
```

---

## Error Handling

### Toast Patterns

**Success:**
```
✅ "Module created"
✅ "Lesson autosaved"
✅ "Block deleted. 3 blocks preserved."
```

**Error:**
```
⚠️ "Cannot publish: Module needs ≥1 published lesson"
⚠️ "Network error. Retry?"
⚠️ "Conflict: Another user edited this lesson"
```

### Optimistic Updates with Conflict Handling

```typescript
onSuccess: (response) => {
  // If server returned different value, warn user
  if (response.title !== data.title) {
    toast.warning(
      `Lesson title changed: "${response.title}" (another user edited it)`
    );
  }
  // Update cache with server value
  queryClient.setQueryData([...], (old) =>
    old.map(i => i.id === response.id ? response : i)
  );
},
```

---

## Performance Optimization

### Query Caching
```
staleTime: 30s (modules, lessons, blocks)
staleTime: 60s (library - users tolerate staleness)
```

### Component Memoization
```typescript
const TreeNode = React.memo(
  ({ entity, ...props }) => { /* ... */ },
  (prev, next) => {
    // Re-render only if entity or expanded changed
    return (
      prev.entity.updated_at === next.entity.updated_at &&
      prev.isExpanded === next.isExpanded
    );
  }
);
```

### Virtualization (Phase 2+)
For 100+ modules, use `@tanstack/react-virtual` to render only visible nodes.

---

## Data Types

```typescript
interface Lesson {
  id: string;
  module_id: string;
  title: string;
  summary: string;
  content?: string;              // Tiptap JSON (optional)
  blocks?: LessonBlock[];        // Structured (optional)
  order: number;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
}

interface LessonBlock {
  id: string;
  lesson_id: string;
  title: string;
  block_type: 'objectives' | 'reading' | 'exercise' | 'notes';
  content: string;                // Tiptap JSON
  order: number;
  status: 'draft' | 'published' | 'archived';
  sponsor_id: string;
  sponsor_type: 'group' | 'member';
  original_author_id?: string;     // If donated
  preview_text?: string;           // First 80 chars
}

interface SelectedEntity {
  type: 'course' | 'module' | 'lesson' | 'block' | null;
  id: string | null;
  breadcrumb: {
    course_id: string;
    module_id?: string;
    lesson_id?: string;
    block_id?: string;
  };
}
```

---

## Implementation Timeline

**Week 1:** Vertical tree + detail panel + autosave
**Week 2:** Drag-drop + inline editing + block preview
**Week 3:** Horizontal tree + expand/collapse
**Week 4:** Block library + delete flows + polish

---

## Index References

- **Data Model:** See `SKILL_02_Data_Model.md`
- **Strategic Vision:** See `SKILL_04_Strategic_Vision.md`
- **Methodology:** See `SKILL_01_Methodology.md`

---

**Status:** ✅ Ready for implementation
**Next:** Start Week 1 with vertical tree view