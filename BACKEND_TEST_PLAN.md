# Backend Test Plan for Collections with Folders & Drag-and-Drop

**Date:** 2026-01-09
**Feature:** Collection Items with Folder Hierarchy and Reordering
**Backend Components:** LibraryItem model, Collection API endpoints

---

## Overview

This test plan covers the backend implementation of:
1. **Folder support** in LibraryItem model (is_folder, parent_id, title)
2. **Hierarchical nesting** (parent-child relationships, max 3 levels)
3. **Reorder API endpoint** (POST `/api/collections/{id}/items/reorder/`)
4. **Model validation** (Django clean() method constraints)

---

## 1. Model Validation Tests

### 1.1 Folder Creation (is_folder=True)

**Test Case:** Create a folder without content
```python
folder = LibraryItem.objects.create(
    library=test_library,
    is_folder=True,
    title="Section 1: Introduction",
    content_type=None,
    content_object_id=None,
    order_index=0
)
```

**Expected Result:**
- ✅ Folder created successfully
- ✅ `is_folder=True`
- ✅ `content_type=None` and `content_object_id=None`
- ✅ `title="Section 1: Introduction"`

---

### 1.2 Folder Cannot Have Content

**Test Case:** Attempt to create a folder with content
```python
folder = LibraryItem.objects.create(
    library=test_library,
    is_folder=True,
    title="Bad Folder",
    content_type=source_file_ct,
    content_object_id=some_file_id,
    order_index=0
)
```

**Expected Result:**
- ❌ ValidationError: "Folders (is_folder=True) cannot have content_type or content_object_id."

---

### 1.3 Non-Folder Must Have Content

**Test Case:** Attempt to create a non-folder without content
```python
item = LibraryItem.objects.create(
    library=test_library,
    is_folder=False,
    content_type=None,
    content_object_id=None,
    order_index=0
)
```

**Expected Result:**
- ❌ ValidationError: "Non-folder items must have both content_type and content_object_id."

---

### 1.4 Max Nesting Depth (3 Levels)

**Test Case:** Create 4 levels of nesting
```python
# Level 1 (root)
folder1 = LibraryItem.objects.create(
    library=test_library,
    is_folder=True,
    title="Level 1",
    parent=None,
    order_index=0
)

# Level 2
folder2 = LibraryItem.objects.create(
    library=test_library,
    is_folder=True,
    title="Level 2",
    parent=folder1,
    order_index=0
)

# Level 3
folder3 = LibraryItem.objects.create(
    library=test_library,
    is_folder=True,
    title="Level 3",
    parent=folder2,
    order_index=0
)

# Level 4 (should fail)
folder4 = LibraryItem.objects.create(
    library=test_library,
    is_folder=True,
    title="Level 4",
    parent=folder3,
    order_index=0
)
```

**Expected Result:**
- ✅ Folders 1, 2, 3 created successfully
- ❌ Folder 4 raises ValidationError: "Maximum nesting depth is 3 levels (root → section → subsection)."

---

### 1.5 Cannot Nest Under Non-Folder

**Test Case:** Attempt to nest item under a file (non-folder)
```python
file_item = LibraryItem.objects.create(
    library=test_library,
    is_folder=False,
    content_type=source_file_ct,
    content_object_id=file.id,
    order_index=0
)

nested_item = LibraryItem.objects.create(
    library=test_library,
    is_folder=False,
    content_type=source_file_ct,
    content_object_id=another_file.id,
    parent=file_item,  # Parent is NOT a folder
    order_index=0
)
```

**Expected Result:**
- ❌ ValidationError: "Items can only be nested under folders."

---

## 2. Reorder API Endpoint Tests

**Base URL:** `POST /api/collections/{collection_id}/items/reorder/`

### 2.1 Simple Reordering (No Parent Change)

**Request:**
```json
POST /api/collections/abc123/items/reorder/
{
  "items": [
    {
      "id": "item-1",
      "order_index": 0
    },
    {
      "id": "item-2",
      "order_index": 1
    },
    {
      "id": "item-3",
      "order_index": 2
    }
  ]
}
```

**Expected Result:**
- ✅ 200 OK
- ✅ Items reordered by order_index
- ✅ Parent relationships unchanged

**Verification:**
```python
items = LibraryItem.objects.filter(library=collection).order_by('order_index')
assert items[0].id == "item-1"
assert items[1].id == "item-2"
assert items[2].id == "item-3"
```

---

### 2.2 Nesting Item Under Folder

**Request:**
```json
POST /api/collections/abc123/items/reorder/
{
  "items": [
    {
      "id": "file-1",
      "order_index": 0,
      "parent_id": "folder-1"  // Move into folder
    }
  ]
}
```

**Expected Result:**
- ✅ 200 OK
- ✅ `file-1.parent_id = folder-1`
- ✅ `file-1.order_index = 0`

**Verification:**
```python
file_item = LibraryItem.objects.get(id="file-1")
assert file_item.parent_id == "folder-1"
assert file_item.order_index == 0
```

---

### 2.3 Moving Item to Root (parent_id=null)

**Request:**
```json
POST /api/collections/abc123/items/reorder/
{
  "items": [
    {
      "id": "file-1",
      "order_index": 0,
      "parent_id": null  // Move to root
    }
  ]
}
```

**Expected Result:**
- ✅ 200 OK
- ✅ `file-1.parent_id = None`
- ✅ `file-1.order_index = 0`

---

### 2.4 Attempting to Nest Under Non-Folder

**Request:**
```json
POST /api/collections/abc123/items/reorder/
{
  "items": [
    {
      "id": "file-1",
      "order_index": 0,
      "parent_id": "file-2"  // file-2 is NOT a folder
    }
  ]
}
```

**Expected Result:**
- ❌ 400 Bad Request
- ❌ Error: "Cannot nest under non-folder item {parent_id}"

---

### 2.5 Exceeding Max Depth via API

**Setup:**
- folder-1 (root)
- folder-2 (child of folder-1)
- folder-3 (child of folder-2)

**Request:** Attempt to nest folder-4 under folder-3 (would be level 4)
```json
POST /api/collections/abc123/items/reorder/
{
  "items": [
    {
      "id": "folder-4",
      "order_index": 0,
      "parent_id": "folder-3"
    }
  ]
}
```

**Expected Result:**
- ❌ 400 Bad Request
- ❌ Validation error: "Maximum nesting depth is 3 levels"

---

### 2.6 Parent Not Found

**Request:**
```json
POST /api/collections/abc123/items/reorder/
{
  "items": [
    {
      "id": "file-1",
      "order_index": 0,
      "parent_id": "nonexistent-id"
    }
  ]
}
```

**Expected Result:**
- ❌ 404 Not Found
- ❌ Error: "Parent item {parent_id} not found"

---

### 2.7 Invalid Item ID

**Request:**
```json
POST /api/collections/abc123/items/reorder/
{
  "items": [
    {
      "id": "nonexistent-item",
      "order_index": 0
    }
  ]
}
```

**Expected Result:**
- ❌ 404 Not Found or 400 Bad Request
- ❌ Error: Item not found

---

## 3. Folder Creation API Tests

**Base URL:** `POST /api/collections/{collection_id}/items/`

### 3.1 Create Folder (Backend May Need Update)

**Note:** Current serializer (`LibraryItemCreateSerializer`) only accepts `'source_file'` or `'writing_piece'`. This test may require backend changes to support `content_type='folder'`.

**Request:**
```json
POST /api/collections/abc123/items/
{
  "content_type": "folder",
  "is_folder": true,
  "title": "Section 1: Introduction",
  "order_index": 0,
  "notes": "This section introduces the main concepts."
}
```

**Expected Result (After Backend Update):**
- ✅ 201 Created
- ✅ Folder created with `is_folder=true`
- ✅ `content_type=None` and `content_object_id=None`
- ✅ `title="Section 1: Introduction"`

**Current Behavior (Before Backend Update):**
- ❌ 400 Bad Request (serializer rejects 'folder')

---

## 4. Edge Cases & Security Tests

### 4.1 Circular Reference Prevention

**Test Case:** Attempt to make a folder its own parent
```python
folder = LibraryItem.objects.create(
    library=test_library,
    is_folder=True,
    title="Circular Folder",
    order_index=0
)

# Attempt to set as its own parent
folder.parent = folder
folder.save()
```

**Expected Result:**
- ❌ ValidationError or IntegrityError (depends on DB constraints)

---

### 4.2 Cross-Collection Parent

**Test Case:** Attempt to set parent from different collection
```python
folder_in_collection_a = LibraryItem.objects.create(
    library=collection_a,
    is_folder=True,
    title="Folder A",
    order_index=0
)

item_in_collection_b = LibraryItem.objects.create(
    library=collection_b,
    is_folder=False,
    content_type=source_file_ct,
    content_object_id=file.id,
    parent=folder_in_collection_a,  # Parent from different collection
    order_index=0
)
```

**Expected Result:**
- ❌ ValidationError or Business logic error
- Items cannot have parents from different collections

---

### 4.3 Authorization

**Test Case:** User without permissions attempts to reorder items
```
POST /api/collections/abc123/items/reorder/
Authorization: Bearer <unauthorized-token>
{
  "items": [...]
}
```

**Expected Result:**
- ❌ 403 Forbidden
- User must have edit permissions on the collection

---

### 4.4 Reorder Items Across Collections

**Test Case:** Attempt to reorder items from multiple collections
```json
POST /api/collections/abc123/items/reorder/
{
  "items": [
    {
      "id": "item-from-collection-abc",
      "order_index": 0
    },
    {
      "id": "item-from-collection-xyz",
      "order_index": 1
    }
  ]
}
```

**Expected Result:**
- ❌ 400 Bad Request or 404 Not Found
- Items must belong to the same collection

---

## 5. Performance Tests

### 5.1 Bulk Reorder Performance

**Test Case:** Reorder 100 items at once
```json
POST /api/collections/abc123/items/reorder/
{
  "items": [
    {"id": "item-1", "order_index": 0},
    {"id": "item-2", "order_index": 1},
    // ... 98 more items
  ]
}
```

**Expected Result:**
- ✅ 200 OK
- ✅ Completes in < 2 seconds
- ✅ All items reordered correctly
- ✅ Transaction atomicity (all or nothing)

---

### 5.2 Deep Nesting Query Performance

**Test Case:** Fetch all items in a deeply nested structure
```python
# 3 levels deep, 10 folders, 50 files
collection = Library.objects.get(id=test_id)
items = collection.items.select_related('parent').all()
```

**Expected Result:**
- ✅ Query executes efficiently (use `.select_related('parent')`)
- ✅ N+1 queries avoided
- ✅ Response time < 500ms for 100 items

---

## 6. Data Integrity Tests

### 6.1 Transaction Rollback on Partial Failure

**Test Case:** Reorder 5 items, where item #3 has invalid parent
```json
POST /api/collections/abc123/items/reorder/
{
  "items": [
    {"id": "item-1", "order_index": 0},
    {"id": "item-2", "order_index": 1},
    {"id": "item-3", "order_index": 2, "parent_id": "invalid"},
    {"id": "item-4", "order_index": 3},
    {"id": "item-5", "order_index": 4}
  ]
}
```

**Expected Result:**
- ❌ 400 Bad Request
- ✅ **ALL** items remain in original order (transaction rolled back)
- ✅ No partial updates applied

---

### 6.2 Orphaned Items After Parent Deletion

**Test Case:** Delete a folder that contains items
```python
folder = LibraryItem.objects.get(id="folder-1")
# folder-1 has children: file-1, file-2

folder.delete()
```

**Expected Result:**
- ✅ Folder deleted
- ✅ Children also deleted (CASCADE behavior) OR
- ✅ Children moved to root (`parent_id=None`)
- ⚠️ **Decide on desired behavior:**
  - Option A: CASCADE delete (children deleted too)
  - Option B: SET_NULL (children become root-level)

**Current Implementation:** CASCADE (children deleted)

---

## 7. Database Constraints Tests

### 7.1 Unique Constraint (If Applicable)

**Test Case:** Attempt to create duplicate item at same position
```python
# Unique constraint: (library, parent, content_type, content_object_id, order_index)
item1 = LibraryItem.objects.create(
    library=test_library,
    is_folder=False,
    content_type=source_file_ct,
    content_object_id=file.id,
    parent=None,
    order_index=0
)

# Attempt duplicate
item2 = LibraryItem.objects.create(
    library=test_library,
    is_folder=False,
    content_type=source_file_ct,
    content_object_id=file.id,
    parent=None,
    order_index=0
)
```

**Expected Result:**
- ❌ IntegrityError (unique constraint violated)

**Note:** Constraint only enforced for non-folders (`condition=Q(is_folder=False)`)

---

## 8. Frontend Integration Tests

### 8.1 Drag-and-Drop Flow

**User Action:**
1. User drags "file-2" from position 2 to position 0
2. Frontend sends reorder request

**Backend Verification:**
- ✅ All items have updated order_index
- ✅ Frontend refetch shows correct order

---

### 8.2 Folder Expansion/Collapse

**User Action:**
1. User expands folder (frontend-only state)
2. User drags item into folder
3. Frontend sends reorder with `parent_id=folder-id`

**Backend Verification:**
- ✅ Item's `parent_id` updated correctly
- ✅ Folder hierarchy maintained

---

## 9. Recommended Test Tools

### Django Unit Tests
```python
# app/stackroom/tests/test_library_item_validation.py
from django.test import TestCase
from stackroom.models import LibraryItem, Library

class LibraryItemValidationTests(TestCase):
    def test_folder_cannot_have_content(self):
        # ... test implementation
        pass
```

### Django REST Framework API Tests
```python
# app/stackroom/tests/test_collection_api.py
from rest_framework.test import APITestCase

class CollectionReorderAPITests(APITestCase):
    def test_reorder_items(self):
        response = self.client.post(
            f'/api/collections/{self.collection.id}/items/reorder/',
            data={'items': [...]},
            format='json'
        )
        self.assertEqual(response.status_code, 200)
```

### Manual Testing with cURL
```bash
# Reorder items
curl -X POST http://localhost:8000/api/collections/abc123/items/reorder/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"id": "item-1", "order_index": 0},
      {"id": "item-2", "order_index": 1}
    ]
  }'
```

---

## 10. Known Issues / TODO

1. **Folder Creation API:** Backend serializer needs updating to accept `content_type='folder'`
   - Current: Only accepts 'source_file' | 'writing_piece'
   - Needed: Support for creating folders without content_id

2. **Frontend Type Casting:** Frontend uses `as any` when creating folders
   - Fix: Update TypeScript types and backend API to properly handle folders

3. **Circular Reference Check:** Add explicit check to prevent folder from becoming its own ancestor

---

## Test Execution Checklist

- [ ] All model validation tests pass
- [ ] All API endpoint tests pass
- [ ] Edge cases handled correctly
- [ ] Performance benchmarks met
- [ ] Transaction rollback works correctly
- [ ] Authorization enforced
- [ ] Database constraints respected
- [ ] Frontend integration tested
- [ ] Documentation updated

---

**Prepared by:** Claude Code
**Review with:** Backend Team, QA Team
**Next Steps:** Execute tests, fix any failures, update backend for folder creation support
