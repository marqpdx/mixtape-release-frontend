# Mixtape Permissions Architecture
## Hierarchical, Decorator-Based Permission System with Natural Language

**Version:** 1.0  
**Audience:** CTOs, Technical Leadership, System Architects  
**Status:** Design Complete, Implementation Phased

---

## Executive Summary

Mixtape implements a **hybrid permission system** that balances ease of administration with granular control. The system uses **decorators** (semantic capability bundles like "Education Hub" or "Event Venue") as the primary mechanism, with support for direct permission assignment for edge cases.

**Key Features:**
- **Natural language descriptions** - Permissions are human-readable, not cryptic codes
- **Hierarchical inheritance** - Broad permissions automatically grant specific ones
- **Progressive disclosure** - Simple UI for admins, detailed controls for power users
- **Decorator-based** - Semantic bundles (90% of use cases) with direct permission escape hatch (10%)
- **YAML + Database hybrid** - Structure in code, assignments in database

**Performance:**
- Permission computation: <200ms on login
- Frontend checks: Instant (no API calls)
- Backend validation: Always enforced (never trusts frontend)

---

## Core Architecture

### Three-Layer System

```
┌─────────────────────────────────────────┐
│  LAYER 1: PERMISSION VOCABULARY         │
│  (What actions exist in Mixtape)        │
│                                         │
│  Source: permission_tree.yaml           │
│  Examples: create_course, edit_article  │
└─────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│  LAYER 2: DECORATOR BUNDLES             │
│  (Contextual permission groupings)      │
│                                         │
│  Source: decorators/*.yaml              │
│  Examples: education_hub, moderator     │
└─────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│  LAYER 3: ASSIGNMENTS                   │
│  (Who has what, runtime state)          │
│                                         │
│  Source: PostgreSQL                     │
│  Examples: Group has education_hub      │
└─────────────────────────────────────────┘
```

### Data Flow

1. **System startup:** Load YAML files into in-memory registries
2. **User login:** Compute permissions from DB assignments + YAML definitions
3. **Frontend:** Cache permissions for instant UI decisions
4. **API calls:** Backend re-validates using same permission service

---

## Permission Hierarchy

Permissions are organized in a **tree structure** with automatic inheritance:

```
administer_group (Root - full control)
├── manage_group_content
│   ├── manage_writing
│   │   ├── create_article
│   │   ├── edit_article
│   │   ├── publish_article
│   │   └── archive_article
│   ├── manage_courses
│   │   ├── create_course
│   │   ├── edit_course
│   │   ├── manage_enrollments
│   │   └── publish_course
│   └── manage_events
│       ├── create_event
│       └── manage_rsvps
├── manage_group_members
│   ├── invite_members
│   ├── remove_members
│   └── change_roles
└── manage_group_settings
    └── edit_group_profile
```

**Inheritance Rule:** Granting `manage_writing` automatically grants all child permissions (`create_article`, `edit_article`, `publish_article`, `archive_article`).

**Benefits:**
- Admins can work at high level ("manage content") or low level ("only edit articles")
- No need to manually track which permissions belong together
- New features slot into existing hierarchy
- Self-documenting structure

---

## Decorators: Semantic Permission Bundles

**Decorators** are named collections of permissions that represent a **semantic capability** or **role**.

### Two Types:

**1. Group Decorators** - What a group can do
```yaml
education_hub:
  display_name: "Education Hub"
  description: "Offer courses and learning experiences"
  
  permissions:
    steward:
      - manage_courses
      - manage_writing
    coordinator:
      - manage_courses
    member:
      - enroll_in_courses
```

**2. Member Decorators** - Additional capabilities for specific members
```yaml
course_designer:
  display_name: "Course Designer"
  permissions:
    - create_course
    - edit_course
```

### Why Decorators?

**Without decorators (permission sprawl):**
```
Group settings: [✓] create_course [✓] edit_course [✓] publish_course 
                [✓] create_module [✓] edit_module [✓] create_lesson
                [✓] edit_lesson [✓] manage_enrollments [✓] invite_learners
                ... (50+ checkboxes)
```

**With decorators (semantic clarity):**
```
Group type: [✓] Education Hub
            "Can offer courses and learning experiences"
```

---

## Hybrid Approach: Decorators + Direct Permissions

While decorators handle 90% of cases, direct permissions provide flexibility for edge cases.

### Database Schema

```python
class Group(BaseModel):
    # Primary mechanism (90% of cases)
    decorators = JSONField(default=list)
    # e.g., ["education_hub", "event_venue"]
    
    # Edge cases (10%)
    additional_permissions = JSONField(default=list)
    # e.g., ["manage_seed_library"] - custom capability

class GroupMember(BaseModel):
    role = CharField()  # "steward", "coordinator", "member"
    
    # Member-level decorators
    decorators = JSONField(default=list)
    # e.g., ["moderator", "course_designer"]
    
    # One-off grants
    additional_permissions = JSONField(default=list)
    # e.g., ["approve_grants"] - temporary special access
```

### Use Cases for Direct Permissions

| Scenario | Solution |
|----------|----------|
| Standard group wants to teach courses | Assign `education_hub` decorator |
| Temporary grant while someone is on leave | Add to `additional_permissions` |
| Custom group-specific feature | Add to `additional_permissions` |
| Beta feature testing | Grant to specific users via `additional_permissions` |

---

## Natural Language Integration

Every permission and decorator includes human-readable descriptions:

**Permission Tree:**
```yaml
manage_writing:
  display_name: "Manage Writing"
  description: "Create and manage articles, posts, and written content"
  grants_text: "Can handle all writing tasks (create, edit, publish, archive)"
```

**Decorator:**
```yaml
education_hub:
  description: "This group can offer courses, modules, and learning experiences"
  rules:
    - "Stewards and coordinators can create educational content"
    - "All members can enroll in courses"
    - "Published courses are visible to the community"
```

**Frontend Display:**
```
Your Permissions in Regenerative PDX:

✅ Manage Courses
   "Can create, edit, publish courses, and manage enrollments"
   Includes: Create courses, Edit courses, Publish courses, 
             Manage enrollments (invite, remove, grade)
```

---

## Progressive Disclosure UI

Admins see appropriate level of detail based on their needs:

### Simple View (Default)
```
✅ Manage Content
   "Can create, edit, and publish all content"

☐ Manage Members
   "Can invite, remove, and manage member roles"
```

### Intermediate View (One click deeper)
```
✅ Manage Content
   ├─ ✅ Manage Writing
   │     "Can handle all writing tasks"
   ├─ ✅ Manage Courses
   └─ ☐ Manage Events
```

### Advanced View (Power users)
```
✅ Manage Content
   ├─ ✅ Manage Writing
   │     ├─ ✅ Create Articles (auto-granted)
   │     ├─ ✅ Edit Articles (auto-granted)
   │     ├─ ✅ Publish Articles (auto-granted)
   │     └─ ✅ Archive Articles (auto-granted)
   ├─ ✅ Manage Courses
   └─ ☐ Manage Events
```

**Philosophy:** Start simple, reveal complexity only when needed.

---

## Source of Truth: YAML vs Database

| Component | Source | Purpose | Who Changes |
|-----------|--------|---------|-------------|
| **Permission hierarchy** | `permission_tree.yaml` | Define all possible actions | Developers |
| **Decorator definitions** | `decorators/*.yaml` | Define semantic bundles | Developers |
| **Group decorators** | PostgreSQL | Which groups have which capabilities | Group admins |
| **Member roles** | PostgreSQL | User's role in group | Group admins |
| **Direct permissions** | PostgreSQL | Edge case grants | Group admins |

**Why YAML for structure?**
- Version controlled (git)
- Code review process
- Deployed with application
- Consistent across environments
- Can't be accidentally broken by users

**Why Database for assignments?**
- Changes without deployment
- Auditable (who changed what, when)
- Backed up with data
- Fast queries
- Group admins can manage

---

## Permission Computation

### Login Flow

```python
def compute_user_permissions(user):
    permissions = set()
    
    for membership in user.group_memberships.all():
        group = membership.group
        
        # 1. Role permissions via group decorators
        for decorator_name in group.decorators:
            decorator = decorator_registry.get(decorator_name)
            role_perms = decorator.permissions[membership.role]
            flattened = permission_tree.flatten(role_perms)
            permissions.update(flattened)
        
        # 2. Member-level decorators
        for decorator_name in membership.decorators:
            decorator = decorator_registry.get(decorator_name, 'member')
            perms = decorator.permissions
            flattened = permission_tree.flatten(perms)
            permissions.update(flattened)
        
        # 3. Group direct permissions (edge cases)
        if group.additional_permissions:
            flattened = permission_tree.flatten(group.additional_permissions)
            permissions.update(flattened)
        
        # 4. Member direct permissions (one-offs)
        if membership.additional_permissions:
            flattened = permission_tree.flatten(membership.additional_permissions)
            permissions.update(flattened)
    
    return list(permissions)
```

### Permission Payload

Returned on login, cached in frontend:

```json
{
  "user": { "id": 123, "name": "ml" },
  "permissions": {
    "granted": ["manage_courses", "manage_writing"],
    "effective": [
      "manage_courses", "create_course", "edit_course", 
      "publish_course", "manage_enrollments", "invite_learners",
      "manage_writing", "create_article", "edit_article"
    ],
    "groups": {
      "regenerative-pdx": {
        "role": "steward",
        "decorators": ["education_hub"],
        "rules": [
          "Stewards and coordinators can create educational content",
          "All members can enroll in courses"
        ]
      }
    }
  }
}
```

---

## Security Model

**Defense in Depth:**

1. **Frontend (UX):** Hide/show UI based on cached permissions
   - No API calls needed for UI decisions
   - Instant response
   
2. **Backend (Enforcement):** Always re-validate permissions
   - Never trust frontend
   - Use same `PermissionService`
   - Return 403 if denied

**Example:**
```python
# DRF Permission Class
class CanCreateCourseInGroup(BasePermission):
    def has_permission(self, request, view):
        group_slug = view.kwargs['group_slug']
        user = request.user
        
        # Use SAME service as login endpoint
        perms = PermissionService.compute_user_permissions(user)
        return 'create_course' in perms['effective']
```

---

## Phased Implementation

### Phase 1: Foundation (Week 1-2)
**Goal:** Basic permission service working

- Database fields for decorators/permissions
- `PermissionService` with simple flattening
- Auth endpoints return permission payload
- Frontend context stores permissions
- DRF uses `PermissionService` for validation

**Deliverable:** User logs in, gets permissions, frontend shows/hides buttons

**Granularity:** Broad only - simple role-based checks

---

### Phase 2A: Permission Tree (Week 2-3)
**Goal:** Add hierarchical permissions

- `permission_tree.yaml` with 2-3 levels deep
- `PermissionTree` class for flattening
- Integration with `PermissionService`

**Deliverable:** Granting `manage_courses` automatically grants `create_course`, `edit_course`, etc.

**Granularity:** 3 levels - Root → Category → Leaf

---

### Phase 2B: Decorator System (Week 3-4)
**Goal:** Semantic bundles

- 3-5 core decorators (`education_hub`, `event_venue`, `publisher`)
- `DecoratorRegistry` loads from YAML
- UI for assigning decorators to groups

**Deliverable:** Group admin can assign "Education Hub" decorator, permissions auto-compute

**Granularity:** Broad bundles only (steward gets "manage_courses" not individual permissions)

---

### Phase 3: Natural Language & UI (Week 5-6)
**Goal:** Make permissions understandable

- Natural language descriptions in YAML
- Permission payload includes explanations
- Frontend tooltips/cards show what you can do
- Simple/Intermediate/Advanced view toggle

**Deliverable:** Hover over permission, see "As a steward in an Education Hub, you can create courses"

**Granularity:** Progressive disclosure - simple by default, advanced on demand

---

### Phase 4: Direct Permissions (Week 7-8)
**Goal:** Handle edge cases

- `additional_permissions` field on Group/GroupMember
- Advanced UI for direct permission assignment
- Permission tree selector component

**Deliverable:** Group admin can grant one-off permission without creating decorator

**Granularity:** Full tree available for direct assignment (but hidden in accordion)

---

### Phase 5: Advanced Features (Future)
**Optional enhancements:**

- Permission caching (Redis)
- Audit log (who granted what, when)
- WebSocket updates (live permission refresh)
- Custom decorators (group-defined)
- Permission revocations (`revoked_permissions` field)

**Granularity:** Complete control - grant/revoke at any level, with full audit trail

---

## Scalability Considerations

**Current Scale (Launch):**
- 100 groups
- 1,000 users
- 50 unique permissions
- 10 decorators

**Expected Growth (Year 1):**
- 1,000 groups
- 10,000 users
- 100 permissions
- 25 decorators

**Architecture supports:**
- In-memory registries (fast lookups, <10ms)
- Database-indexed queries (group memberships)
- Frontend caching (zero API calls for UI)
- Optional Redis caching for permission computation

**Bottleneck mitigation:**
- Decorator count: YAML-based, no DB queries
- Permission flattening: Pre-computed on login, cached
- Group membership queries: Indexed, select_related
- Future: Redis cache with invalidation on role/decorator change

---

## Migration & Versioning

**Adding new permissions:**
1. Add to `permission_tree.yaml`
2. Deploy (no data migration needed)
3. Optionally add to existing decorators
4. Groups automatically inherit if decorator updated

**Changing decorator definitions:**
1. Update `decorators/*.yaml`
2. Deploy
3. All groups with that decorator get new permissions on next login

**No breaking changes:** Additive only (Phase 1-4)

---

## Comparison with Alternatives

| Approach | Pros | Cons | Mixtape Choice |
|----------|------|------|----------------|
| **Django's built-in** | Easy, admin UI | No group-scoping, verbose | Not suitable |
| **django-guardian** | Object-level permissions | Extra tables, complexity | Too granular |
| **RBAC only** | Simple | Not flexible enough | ✅ Base layer |
| **ABAC (rules engine)** | Very flexible | Performance overhead | Too complex |
| **Decorator-based** | Semantic, scalable | Requires design upfront | ✅ Primary mechanism |
| **Hybrid (our approach)** | Best of all worlds | Slightly more complex | ✅ **Selected** |

---

## Success Metrics

**Phase 1-2:**
- ✅ Permission computation < 200ms
- ✅ Frontend checks are instant
- ✅ Backend always validates

**Phase 3:**
- ✅ Admins understand permissions without documentation
- ✅ "Permission denied" messages are helpful
- ✅ <5 support tickets about permission confusion

**Phase 4:**
- ✅ Group stewards can manage permissions without dev help
- ✅ Zero accidental permission escalations
- ✅ Audit trail for all changes

---

## Technical Stack

**Backend:**
- Django REST Framework
- PostgreSQL (JSONField for arrays)
- PyYAML (config loading)

**Frontend:**
- React 18+ with TypeScript
- Chakra UI v3
- React Context for permission state
- TanStack Query for caching

**Files:**
```
config/permissions/
├── permission_tree.yaml
└── decorators/
    ├── groups/
    │   ├── education_hub.yaml
    │   ├── event_venue.yaml
    │   └── publisher.yaml
    └── members/
        ├── moderator.yaml
        └── course_designer.yaml
```

---

## Conclusion

The Mixtape permission system provides a **scalable, maintainable, and user-friendly** approach to authorization. By combining semantic decorators with hierarchical permissions and natural language, we achieve:

- **Ease of use** - Admins work with meaningful concepts, not cryptic codes
- **Flexibility** - Handles common cases simply, edge cases comprehensively  
- **Maintainability** - Structure in code (versioned), state in database (auditable)
- **Performance** - Fast computation, instant frontend checks, always validated
- **Scalability** - Ready for growth from 100 to 10,000+ users

**Phased rollout** ensures we ship value early (broad permissions) while building toward comprehensive granularity over time.
