# Mixtape Permissions: Developer Implementation Guide

**Version:** 1.0  
**Audience:** Development Team  
**Status:** Ready for Implementation

---

## Quick Reference

**What we're building:** Hybrid permission system with decorators + direct permissions

**Key components:**
- `PermissionTree` - Hierarchical permission structure (YAML → in-memory)
- `DecoratorRegistry` - Permission bundles (YAML → in-memory)
- `PermissionService` - Computation engine (combines YAML + DB)
- React hooks - Frontend permission checks (cached from login)

**Phasing strategy:** Start broad, add granularity incrementally

---

## Phase 1: Foundation (Week 1-2)

### Goal
Basic permission service that works end-to-end with simple role-based checks.

---

### 1.1 Database Schema Updates

**File:** `apps/groups/models.py`

```python
from django.db import models
from fundamentals.bases import BaseModel

class Group(BaseModel):
    # ... existing fields ...
    
    # NEW: Decorator assignments
    decorators = models.JSONField(
        default=list, 
        blank=True,
        help_text="Semantic capability bundles (e.g., 'education_hub', 'event_venue')"
    )
    
    # NEW: Direct permission grants (Phase 4)
    additional_permissions = models.JSONField(
        default=list,
        blank=True,
        help_text="Direct permission grants for edge cases"
    )


class GroupMember(BaseModel):
    # ... existing fields ...
    
    # EXISTING: Keep role field
    role = models.CharField(
        max_length=32,
        choices=[
            ('steward', 'Steward'),
            ('coordinator', 'Coordinator'),
            ('member', 'Member'),
        ],
        default='member'
    )
    
    # NEW: Member-level decorators
    decorators = models.JSONField(
        default=list,
        blank=True,
        help_text="Member-specific capability bundles (e.g., 'moderator', 'course_designer')"
    )
    
    # NEW: Direct permission grants (Phase 4)
    additional_permissions = models.JSONField(
        default=list,
        blank=True,
        help_text="One-off permission grants"
    )
```

**Migration:**
```bash
python manage.py makemigrations groups
python manage.py migrate
```

---

### 1.2 Permission Service (Simple Version)

**File:** `apps/fundamentals/services/permission_service.py`

```python
"""
Permission computation service.
Single source of truth for both auth endpoints and DRF permission classes.
"""

from django.apps import apps
from apps.groups.models import GroupMember


class PermissionService:
    """
    Computes user permissions from group memberships and roles.
    
    Phase 1: Simple role-based permissions (no tree, no decorators yet)
    Phase 2: Will add PermissionTree and DecoratorRegistry
    """
    
    # Phase 1: Hard-coded role permissions (will move to YAML in Phase 2)
    ROLE_PERMISSIONS = {
        'steward': [
            'manage_group',
            'create_course',
            'edit_course',
            'publish_course',
            'invite_members',
            'manage_members',
        ],
        'coordinator': [
            'create_course',
            'edit_course',
            'publish_course',
        ],
        'member': [
            'view_content',
            'enroll_in_courses',
        ]
    }
    
    @classmethod
    def compute_user_permissions(cls, user):
        """
        Compute all permissions for a user across all their group memberships.
        
        Returns:
            dict: {
                'granted': [...],      # What was explicitly granted
                'effective': [...],    # Full set (will include children in Phase 2)
                'groups': {...}        # Per-group breakdown
            }
        """
        if not user.is_authenticated:
            return {
                'granted': [],
                'effective': [],
                'groups': {}
            }
        
        permissions = set()
        groups_detail = {}
        
        # Get all memberships
        memberships = GroupMember.objects.filter(
            user=user
        ).select_related('group')
        
        for membership in memberships:
            group = membership.group
            role = membership.role
            
            # Get role permissions
            role_perms = cls.ROLE_PERMISSIONS.get(role, [])
            permissions.update(role_perms)
            
            # Store per-group details
            groups_detail[group.slug] = {
                'role': role,
                'permissions': role_perms,
                'decorators': group.decorators,  # Empty in Phase 1
            }
        
        permission_list = list(permissions)
        
        return {
            'granted': permission_list,
            'effective': permission_list,  # Same for now, will differ in Phase 2
            'groups': groups_detail
        }
    
    @classmethod
    def can_user_perform_action(cls, user, required_permission, context=None):
        """
        Check if user has a specific permission.
        
        Args:
            user: User instance
            required_permission: String like 'create_course'
            context: Optional dict with 'group' for group-scoped checks
        
        Returns:
            bool: True if user has permission
        """
        perms = cls.compute_user_permissions(user)
        return required_permission in perms['effective']
```

---

### 1.3 Auth Integration

**File:** `apps/accounts/api/views.py`

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from apps.fundamentals.services.permission_service import PermissionService
from apps.accounts.api.serializers import UserSerializer


class LoginView(APIView):
    """
    User login endpoint.
    Returns user data, tokens, AND permissions.
    """
    permission_classes = []
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if not user:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        # Compute permissions
        permissions = PermissionService.compute_user_permissions(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'permissions': permissions,  # NEW: Include permissions
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class PermissionsRefreshView(APIView):
    """
    Refresh permissions without re-authenticating.
    Call this when user's roles/decorators change.
    """
    
    def get(self, request):
        permissions = PermissionService.compute_user_permissions(request.user)
        return Response({'permissions': permissions})
```

---

### 1.4 DRF Permission Classes

**File:** `apps/earthlab/api/permissions.py`

```python
from rest_framework.permissions import BasePermission
from apps.fundamentals.services.permission_service import PermissionService


class HasPermission(BasePermission):
    """
    Base permission class using PermissionService.
    
    Usage in views:
        permission_classes = [HasPermission]
        required_permission = 'create_course'
    """
    
    def has_permission(self, request, view):
        # Get required permission from view
        required_perm = getattr(view, 'required_permission', None)
        
        if not required_perm:
            return True  # No permission required
        
        # Check using PermissionService
        return PermissionService.can_user_perform_action(
            request.user,
            required_perm,
            context={'group': getattr(view, 'group', None)}
        )


class CanCreateCourseInGroup(BasePermission):
    """
    Check if user can create courses in a specific group.
    """
    
    def has_permission(self, request, view):
        group_slug = view.kwargs.get('group_slug')
        
        # For now, just check if user has create_course permission
        # Phase 2 will check group-specific permissions
        return PermissionService.can_user_perform_action(
            request.user,
            'create_course'
        )
```

**Usage in views:**

```python
# apps/earthlab/api/views/group_views/course_group_views.py

from apps.earthlab.api.permissions import HasPermission

class GroupCourseListCreateView(generics.ListCreateAPIView):
    permission_classes = [HasPermission]
    required_permission = 'create_course'
    
    # ... rest of view ...
```

---

### 1.5 Frontend Permission Context

**File:** `lib/contexts/PermissionsContext.tsx`

```tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Permissions {
  granted: string[];
  effective: string[];
  groups: Record<string, {
    role: string;
    permissions: string[];
    decorators: string[];
  }>;
}

interface PermissionsContextValue {
  permissions: Permissions | null;
  can: (permission: string) => boolean;
  canInGroup: (permission: string, groupSlug: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user, permissions: authPermissions } = useAuth();
  
  const can = (permission: string): boolean => {
    if (!authPermissions) return false;
    return authPermissions.effective.includes(permission);
  };
  
  const canInGroup = (permission: string, groupSlug: string): boolean => {
    if (!authPermissions?.groups) return false;
    const groupPerms = authPermissions.groups[groupSlug];
    return groupPerms?.permissions.includes(permission) ?? false;
  };
  
  return (
    <PermissionsContext.Provider value={{ 
      permissions: authPermissions, 
      can, 
      canInGroup 
    }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
}
```

**File:** `lib/contexts/AuthContext.tsx` (Update existing)

```tsx
// Add permissions to auth state
interface AuthContextValue {
  user: User | null;
  permissions: Permissions | null;  // NEW
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshPermissions: () => Promise<void>;  // NEW
}

// In login function, store permissions from response
const login = async (credentials: LoginCredentials) => {
  const response = await api.post('/auth/login/', credentials);
  const { user, permissions, access, refresh } = response.data;
  
  setUser(user);
  setPermissions(permissions);  // NEW
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

// NEW: Refresh permissions
const refreshPermissions = async () => {
  const response = await api.get('/auth/permissions/refresh/');
  setPermissions(response.data.permissions);
};
```

---

### 1.6 Frontend Usage Examples

**Simple UI visibility:**

```tsx
import { usePermissions } from '@/lib/contexts/PermissionsContext';

export function CourseList() {
  const { can } = usePermissions();
  
  return (
    <VStack>
      {can('create_course') && (
        <Button onClick={openCreateModal}>
          Create Course
        </Button>
      )}
      
      {/* Course list */}
    </VStack>
  );
}
```

**Group-scoped check:**

```tsx
export function GroupCoursesPage({ groupSlug }: { groupSlug: string }) {
  const { canInGroup } = usePermissions();
  
  return (
    <Box>
      <Heading>Courses</Heading>
      
      {canInGroup('create_course', groupSlug) && (
        <Button>Create Course in This Group</Button>
      )}
    </Box>
  );
}
```

---

### Phase 1 Testing

**Test checklist:**
- [ ] User logs in, receives permission payload
- [ ] Frontend context stores permissions
- [ ] `can()` hook correctly shows/hides UI
- [ ] API calls still validate permissions (403 if denied)
- [ ] Permissions refresh when roles change

**Test users to create:**
```python
# In Django shell or fixture
from django.contrib.auth import get_user_model
from apps.groups.models import Group, GroupMember

User = get_user_model()

# Create test group
group = Group.objects.create(name="Test Group", slug="test-group")

# Create users with different roles
steward = User.objects.create_user(username="steward", password="test")
coordinator = User.objects.create_user(username="coordinator", password="test")
member = User.objects.create_user(username="member", password="test")

# Assign roles
GroupMember.objects.create(user=steward, group=group, role='steward')
GroupMember.objects.create(user=coordinator, group=group, role='coordinator')
GroupMember.objects.create(user=member, group=group, role='member')
```

**Test scenarios:**
1. Login as steward → Should have `create_course`, `manage_members`
2. Login as coordinator → Should have `create_course`, NOT `manage_members`
3. Login as member → Should only have `view_content`, `enroll_in_courses`

---

## Phase 2A: Permission Tree (Week 2-3)

### Goal
Add hierarchical permissions with automatic inheritance.

---

### 2A.1 Create Permission Tree YAML

**File:** `config/permissions/permission_tree.yaml`

```yaml
# Mixtape Permission Hierarchy
# Root permissions grant all children automatically

permissions:
  # ROOT LEVEL - Full admin access
  administer_group:
    display_name: "Administer Group"
    description: "Complete administrative access to this group"
    level: 0
    category: "admin"
    children:
      - manage_group_content
      - manage_group_members
      - manage_group_settings
    grants_text: "Full control over all group features and settings"
  
  # CATEGORY LEVEL - Major capability areas
  manage_group_content:
    display_name: "Manage Content"
    description: "Create and manage all content types"
    level: 1
    category: "content"
    parent: administer_group
    children:
      - manage_writing
      - manage_courses
      - manage_events
    grants_text: "Can create, edit, and publish all content types"
  
  manage_group_members:
    display_name: "Manage Members"
    description: "Invite, remove, and manage member roles"
    level: 1
    category: "members"
    parent: administer_group
    children:
      - invite_members
      - remove_members
      - change_member_roles
    grants_text: "Full member management capabilities"
  
  manage_group_settings:
    display_name: "Manage Settings"
    description: "Configure group settings and features"
    level: 1
    category: "settings"
    parent: administer_group
    children:
      - edit_group_profile
      - manage_decorators
    grants_text: "Can configure all group settings"
  
  # SUBCATEGORY LEVEL - Specific content types
  manage_courses:
    display_name: "Manage Courses"
    description: "Create and manage educational courses"
    level: 2
    category: "content"
    parent: manage_group_content
    children:
      - create_course
      - edit_course
      - publish_course
      - manage_enrollments
    grants_text: "Complete course management capabilities"
  
  manage_writing:
    display_name: "Manage Writing"
    description: "Create and manage articles and posts"
    level: 2
    category: "content"
    parent: manage_group_content
    children:
      - create_article
      - edit_article
      - publish_article
      - archive_article
    grants_text: "Can handle all writing tasks"
  
  manage_events:
    display_name: "Manage Events"
    description: "Create and manage events"
    level: 2
    category: "content"
    parent: manage_group_content
    children:
      - create_event
      - edit_event
      - manage_rsvps
    grants_text: "Complete event management capabilities"
  
  # LEAF LEVEL - Specific actions
  create_course:
    display_name: "Create Courses"
    description: "Create new courses"
    level: 3
    category: "content"
    parent: manage_courses
    grants_text: "Can create new courses"
  
  edit_course:
    display_name: "Edit Courses"
    description: "Edit existing courses"
    level: 3
    category: "content"
    parent: manage_courses
    grants_text: "Can edit courses"
  
  publish_course:
    display_name: "Publish Courses"
    description: "Publish courses to make them visible"
    level: 3
    category: "content"
    parent: manage_courses
    grants_text: "Can publish courses"
  
  manage_enrollments:
    display_name: "Manage Enrollments"
    description: "Manage course enrollments"
    level: 3
    category: "content"
    parent: manage_courses
    children:
      - invite_learners
      - remove_learners
      - grade_submissions
    grants_text: "Can manage course enrollments"
  
  # More leaf permissions...
  create_article:
    display_name: "Create Articles"
    description: "Create new articles"
    level: 3
    category: "content"
    parent: manage_writing
    grants_text: "Can create articles"
  
  edit_article:
    display_name: "Edit Articles"
    description: "Edit existing articles"
    level: 3
    category: "content"
    parent: manage_writing
    grants_text: "Can edit articles"
  
  publish_article:
    display_name: "Publish Articles"
    description: "Publish articles"
    level: 3
    category: "content"
    parent: manage_writing
    grants_text: "Can publish articles"
  
  # Member management permissions
  invite_members:
    display_name: "Invite Members"
    description: "Invite new members to the group"
    level: 3
    category: "members"
    parent: manage_group_members
    grants_text: "Can invite new members"
  
  remove_members:
    display_name: "Remove Members"
    description: "Remove members from the group"
    level: 3
    category: "members"
    parent: manage_group_members
    grants_text: "Can remove members"
  
  # Learner permissions (no parent - available to all)
  view_content:
    display_name: "View Content"
    description: "View published content"
    level: 3
    category: "content"
    grants_text: "Can view published content"
  
  enroll_in_courses:
    display_name: "Enroll in Courses"
    description: "Enroll in published courses"
    level: 3
    category: "content"
    grants_text: "Can enroll in courses"
```

---

### 2A.2 Permission Tree Class

**File:** `apps/fundamentals/permissions/tree.py`

```python
"""
Permission tree management.
Loads permission hierarchy from YAML and provides flattening/lookup.
"""

import yaml
from pathlib import Path
from django.conf import settings


class PermissionNode:
    """Single permission in the tree."""
    
    def __init__(self, name, config):
        self.name = name
        self.display_name = config['display_name']
        self.description = config['description']
        self.level = config['level']
        self.category = config['category']
        self.parent_name = config.get('parent')
        self.children_names = config.get('children', [])
        self.grants_text = config['grants_text']
        
        # Populated by PermissionTree
        self.parent = None
        self.children = []
    
    def get_all_descendants(self):
        """
        Recursively get all permissions granted by this node.
        Returns flattened list including self.
        """
        descendants = [self.name]
        for child in self.children:
            descendants.extend(child.get_all_descendants())
        return descendants
    
    def is_ancestor_of(self, permission_name):
        """Check if this permission grants another."""
        return permission_name in self.get_all_descendants()


class PermissionTree:
    """
    Loads and manages permission hierarchy.
    Singleton pattern - instantiated once on app startup.
    """
    
    def __init__(self):
        self.nodes = {}
        self._load_tree()
        self._build_relationships()
    
    def _load_tree(self):
        """Load from YAML file."""
        yaml_path = Path(settings.BASE_DIR) / 'config' / 'permissions' / 'permission_tree.yaml'
        
        with open(yaml_path, 'r') as f:
            data = yaml.safe_load(f)
        
        for name, config in data['permissions'].items():
            self.nodes[name] = PermissionNode(name, config)
    
    def _build_relationships(self):
        """Connect parent/child pointers."""
        for node in self.nodes.values():
            # Set parent
            if node.parent_name:
                parent = self.nodes.get(node.parent_name)
                if parent:
                    node.parent = parent
            
            # Set children
            for child_name in node.children_names:
                child = self.nodes.get(child_name)
                if child:
                    node.children.append(child)
    
    def flatten_permissions(self, granted_permissions):
        """
        Given list of granted permissions (at any level),
        return full set of effective permissions.
        
        Example:
            Input: ["manage_courses"]
            Output: ["manage_courses", "create_course", "edit_course", 
                     "publish_course", "manage_enrollments", "invite_learners", ...]
        """
        effective = set()
        
        for perm_name in granted_permissions:
            node = self.nodes.get(perm_name)
            if node:
                # Add this permission and all descendants
                effective.update(node.get_all_descendants())
        
        return list(effective)
    
    def has_permission(self, granted_permissions, required_permission):
        """
        Check if granted permissions include required one.
        Handles inheritance automatically.
        
        Example:
            granted = ["manage_courses"]
            required = "edit_course"
            Result: True (manage_courses includes edit_course)
        """
        flattened = self.flatten_permissions(granted_permissions)
        return required_permission in flattened
    
    def get_nodes_by_level(self, level):
        """Get all permissions at a specific level."""
        return [node for node in self.nodes.values() if node.level == level]
    
    def get_natural_language_grants(self, permission_name):
        """Get human-readable explanation."""
        node = self.nodes.get(permission_name)
        if not node:
            return ""
        
        if node.children:
            child_names = [child.display_name for child in node.children]
            return f"{node.grants_text}. Includes: {', '.join(child_names)}"
        else:
            return node.grants_text


# Singleton instance
_permission_tree = None

def get_permission_tree():
    """Get or create singleton instance."""
    global _permission_tree
    if _permission_tree is None:
        _permission_tree = PermissionTree()
    return _permission_tree
```

---

### 2A.3 Update Permission Service

**File:** `apps/fundamentals/services/permission_service.py` (Update)

```python
from apps.fundamentals.permissions.tree import get_permission_tree


class PermissionService:
    """
    Phase 2A: Now uses PermissionTree for flattening
    """
    
    # Update role permissions to use tree nodes
    ROLE_PERMISSIONS = {
        'steward': [
            'manage_group_content',    # High-level - grants all content perms
            'manage_group_members',    # High-level - grants all member perms
        ],
        'coordinator': [
            'manage_courses',          # Mid-level - just course management
            'manage_events',           # Mid-level - just event management
        ],
        'member': [
            'view_content',
            'enroll_in_courses',
        ]
    }
    
    @classmethod
    def compute_user_permissions(cls, user):
        if not user.is_authenticated:
            return {'granted': [], 'effective': [], 'groups': {}}
        
        permission_tree = get_permission_tree()
        granted_permissions = []
        groups_detail = {}
        
        memberships = GroupMember.objects.filter(
            user=user
        ).select_related('group')
        
        for membership in memberships:
            group = membership.group
            role = membership.role
            
            # Get role permissions
            role_perms = cls.ROLE_PERMISSIONS.get(role, [])
            granted_permissions.extend(role_perms)
            
            groups_detail[group.slug] = {
                'role': role,
                'granted': role_perms,
                'decorators': group.decorators,
            }
        
        # NEW: Flatten using permission tree
        effective_permissions = permission_tree.flatten_permissions(granted_permissions)
        
        return {
            'granted': list(set(granted_permissions)),
            'effective': effective_permissions,  # Now includes all children
            'groups': groups_detail
        }
    
    @classmethod
    def can_user_perform_action(cls, user, required_permission, context=None):
        """Now uses tree for checking."""
        permission_tree = get_permission_tree()
        perms = cls.compute_user_permissions(user)
        
        # Use tree's has_permission (handles inheritance)
        return permission_tree.has_permission(perms['granted'], required_permission)
```

---

### 2A.4 App Initialization

**File:** `apps/fundamentals/apps.py`

```python
from django.apps import AppConfig


class FundamentalsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.fundamentals'
    
    def ready(self):
        """Load permission tree on app startup."""
        from apps.fundamentals.permissions.tree import get_permission_tree
        
        # Load tree into memory
        get_permission_tree()
        print("✅ Permission tree loaded")
```

---

### Phase 2A Testing

**Test inheritance:**
```python
from apps.fundamentals.permissions.tree import get_permission_tree

tree = get_permission_tree()

# Test: Granting manage_courses should include create_course
granted = ["manage_courses"]
effective = tree.flatten_permissions(granted)

assert "manage_courses" in effective
assert "create_course" in effective
assert "edit_course" in effective
assert "publish_course" in effective
assert "manage_enrollments" in effective

# Test: Check permission with inheritance
assert tree.has_permission(["manage_courses"], "edit_course") == True
assert tree.has_permission(["create_course"], "manage_courses") == False
```

---

## Phase 2B: Decorators (Week 3-4)

### Goal
Add semantic permission bundles that reference the permission tree.

---

### 2B.1 Create Decorator YAML Files

**File:** `config/permissions/decorators/groups/education_hub.yaml`

```yaml
# Education Hub Decorator
# Groups that offer courses and learning experiences

name: education_hub
display_name: "Education Hub"
description: "This group can offer courses, modules, and learning experiences to members and the wider community."
icon: "book-open"
category: "learning"

# Permissions granted by role
permissions:
  steward:
    - manage_courses           # References permission_tree.yaml
    - manage_writing
    - invite_members
  
  coordinator:
    - manage_courses
    - create_article           # Can write but not manage all writing
  
  member:
    - enroll_in_courses
    - view_content

# UI features this decorator enables
ui_features:
  - course_catalog
  - enrollment_dashboard
  - learning_progress

# Natural language rules for display
rules:
  - "Stewards can create and manage all educational content"
  - "Coordinators can create and manage courses"
  - "All members can enroll in courses and view content"
```

**File:** `config/permissions/decorators/groups/event_venue.yaml`

```yaml
name: event_venue
display_name: "Event Venue"
description: "This group can host events and manage RSVPs."
icon: "calendar"
category: "events"

permissions:
  steward:
    - manage_events
    - invite_members
  
  coordinator:
    - manage_events
  
  member:
    - view_content

ui_features:
  - event_calendar
  - rsvp_management

rules:
  - "Stewards and coordinators can create and manage events"
  - "All members can RSVP to events"
```

**File:** `config/permissions/decorators/members/moderator.yaml`

```yaml
# Moderator Decorator (Member-level)
# Can moderate discussions across all groups

name: moderator
display_name: "Moderator"
description: "Can moderate discussions and content across groups"
icon: "shield"
category: "moderation"

# Member decorators don't have role-based permissions
permissions:
  - moderate_discussions
  - flag_content
  - review_reports

rules:
  - "Can moderate discussions in any group they're a member of"
  - "Can flag inappropriate content"
```

---

### 2B.2 Decorator Registry

**File:** `apps/fundamentals/permissions/registry.py`

```python
"""
Decorator registry.
Loads decorator definitions from YAML files.
"""

import yaml
from pathlib import Path
from django.conf import settings


class Decorator:
    """Single decorator definition."""
    
    def __init__(self, name, config, decorator_type='group'):
        self.name = name
        self.type = decorator_type  # 'group' or 'member'
        self.display_name = config['display_name']
        self.description = config['description']
        self.icon = config.get('icon')
        self.category = config.get('category')
        self.permissions = config['permissions']
        self.ui_features = config.get('ui_features', [])
        self.rules = config.get('rules', [])
    
    def get_permissions_for_role(self, role):
        """
        Get permissions for a specific role (group decorators).
        
        Args:
            role: String like 'steward', 'coordinator', 'member'
        
        Returns:
            List of permission names
        """
        if self.type != 'group':
            raise ValueError("get_permissions_for_role only works for group decorators")
        
        return self.permissions.get(role, [])
    
    def get_permissions(self):
        """
        Get all permissions (member decorators).
        
        Returns:
            List of permission names
        """
        if self.type != 'member':
            raise ValueError("get_permissions only works for member decorators")
        
        return self.permissions


class DecoratorRegistry:
    """
    Loads and manages decorator definitions.
    Singleton pattern - instantiated once on app startup.
    """
    
    def __init__(self):
        self.group_decorators = {}
        self.member_decorators = {}
        self._load_decorators()
    
    def _load_decorators(self):
        """Load from YAML files."""
        base_path = Path(settings.BASE_DIR) / 'config' / 'permissions' / 'decorators'
        
        # Load group decorators
        group_path = base_path / 'groups'
        if group_path.exists():
            for yaml_file in group_path.glob('*.yaml'):
                with open(yaml_file, 'r') as f:
                    config = yaml.safe_load(f)
                    name = config['name']
                    self.group_decorators[name] = Decorator(name, config, 'group')
        
        # Load member decorators
        member_path = base_path / 'members'
        if member_path.exists():
            for yaml_file in member_path.glob('*.yaml'):
                with open(yaml_file, 'r') as f:
                    config = yaml.safe_load(f)
                    name = config['name']
                    self.member_decorators[name] = Decorator(name, config, 'member')
    
    def get_decorator(self, name, decorator_type='group'):
        """Get decorator by name."""
        if decorator_type == 'group':
            return self.group_decorators.get(name)
        else:
            return self.member_decorators.get(name)
    
    def list_decorators(self, decorator_type='group'):
        """List all decorators of a type."""
        if decorator_type == 'group':
            return list(self.group_decorators.values())
        else:
            return list(self.member_decorators.values())


# Singleton instance
_decorator_registry = None

def get_decorator_registry():
    """Get or create singleton instance."""
    global _decorator_registry
    if _decorator_registry is None:
        _decorator_registry = DecoratorRegistry()
    return _decorator_registry
```

---

### 2B.3 Update Permission Service (Final)

**File:** `apps/fundamentals/services/permission_service.py` (Final version)

```python
from apps.fundamentals.permissions.tree import get_permission_tree
from apps.fundamentals.permissions.registry import get_decorator_registry


class PermissionService:
    """
    Phase 2B: Complete version with decorators + tree
    """
    
    @classmethod
    def compute_user_permissions(cls, user):
        if not user.is_authenticated:
            return {'granted': [], 'effective': [], 'groups': {}}
        
        permission_tree = get_permission_tree()
        decorator_registry = get_decorator_registry()
        
        granted_permissions = []
        groups_detail = {}
        
        memberships = GroupMember.objects.filter(
            user=user
        ).select_related('group')
        
        for membership in memberships:
            group = membership.group
            role = membership.role
            
            group_granted = []
            
            # 1. Get permissions from GROUP DECORATORS
            for decorator_name in group.decorators:
                decorator = decorator_registry.get_decorator(decorator_name, 'group')
                if decorator:
                    role_perms = decorator.get_permissions_for_role(role)
                    group_granted.extend(role_perms)
            
            # 2. Get permissions from MEMBER DECORATORS
            for decorator_name in membership.decorators:
                decorator = decorator_registry.get_decorator(decorator_name, 'member')
                if decorator:
                    member_perms = decorator.get_permissions()
                    group_granted.extend(member_perms)
            
            # Add to total
            granted_permissions.extend(group_granted)
            
            # Store group details
            groups_detail[group.slug] = {
                'role': role,
                'granted': list(set(group_granted)),
                'decorators': group.decorators,
                'member_decorators': membership.decorators,
            }
        
        # Flatten using permission tree
        effective_permissions = permission_tree.flatten_permissions(granted_permissions)
        
        return {
            'granted': list(set(granted_permissions)),
            'effective': effective_permissions,
            'groups': groups_detail
        }
```

---

### 2B.4 Update App Initialization

**File:** `apps/fundamentals/apps.py` (Update)

```python
def ready(self):
    """Load permission tree and decorators on app startup."""
    from apps.fundamentals.permissions.tree import get_permission_tree
    from apps.fundamentals.permissions.registry import get_decorator_registry
    
    get_permission_tree()
    get_decorator_registry()
    
    print("✅ Permission system loaded")
```

---

### Phase 2B Testing

**Test decorator assignment:**
```python
from apps.groups.models import Group, GroupMember
from apps.fundamentals.services.permission_service import PermissionService

# Assign decorator to group
group = Group.objects.get(slug="test-group")
group.decorators = ["education_hub"]
group.save()

# Get member
member = GroupMember.objects.get(user=coordinator_user, group=group)

# Compute permissions
perms = PermissionService.compute_user_permissions(coordinator_user)

# Verify: coordinator in education_hub should have manage_courses
assert "manage_courses" in perms['granted']
# And all children via flattening
assert "create_course" in perms['effective']
assert "edit_course" in perms['effective']
```

---

## Phase 3: Natural Language & UI (Week 5-6)

### Goal
Make permissions visible and understandable with progressive disclosure.

---

### 3.1 Enhanced Permission Payload

**Update auth view to include natural language:**

```python
# apps/accounts/api/views.py

class LoginView(APIView):
    def post(self, request):
        # ... authentication ...
        
        # Compute permissions
        base_perms = PermissionService.compute_user_permissions(user)
        
        # Enhance with natural language
        permission_tree = get_permission_tree()
        decorator_registry = get_decorator_registry()
        
        enhanced_perms = {
            **base_perms,
            'explanations': {},
            'group_rules': {}
        }
        
        # Add explanations for granted permissions
        for perm_name in base_perms['granted']:
            enhanced_perms['explanations'][perm_name] = \
                permission_tree.get_natural_language_grants(perm_name)
        
        # Add group rules
        for group_slug, details in base_perms['groups'].items():
            rules = []
            for decorator_name in details['decorators']:
                decorator = decorator_registry.get_decorator(decorator_name)
                if decorator:
                    rules.extend(decorator.rules)
            enhanced_perms['group_rules'][group_slug] = rules
        
        return Response({
            'user': UserSerializer(user).data,
            'permissions': enhanced_perms,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
```

---

### 3.2 Frontend Permission Hook (Enhanced)

**File:** `lib/hooks/usePermissions.ts`

```tsx
import { useAuth } from '@/lib/contexts/AuthContext';

export function usePermissions() {
  const { permissions } = useAuth();
  
  const can = (permission: string): boolean => {
    if (!permissions) return false;
    return permissions.effective.includes(permission);
  };
  
  const explainPermission = (permission: string): string => {
    if (!permissions?.explanations) return '';
    return permissions.explanations[permission] || '';
  };
  
  const getGroupRules = (groupSlug: string): string[] => {
    if (!permissions?.group_rules) return [];
    return permissions.group_rules[groupSlug] || [];
  };
  
  const hasDecorator = (decoratorName: string, groupSlug?: string): boolean => {
    if (!permissions?.groups) return false;
    
    if (groupSlug) {
      const group = permissions.groups[groupSlug];
      return group?.decorators.includes(decoratorName) ?? false;
    }
    
    // Check any group
    return Object.values(permissions.groups).some(
      group => group.decorators.includes(decoratorName)
    );
  };
  
  return {
    can,
    explainPermission,
    getGroupRules,
    hasDecorator,
    permissions
  };
}
```

---

### 3.3 UI Components

**File:** `components/permissions/PermissionTooltip.tsx`

```tsx
import { Tooltip } from '@chakra-ui/react';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface PermissionTooltipProps {
  permission: string;
  children: React.ReactNode;
}

export function PermissionTooltip({ permission, children }: PermissionTooltipProps) {
  const { explainPermission } = usePermissions();
  const explanation = explainPermission(permission);
  
  if (!explanation) return <>{children}</>;
  
  return (
    <Tooltip content={explanation} positioning={{ placement: 'top' }}>
      {children}
    </Tooltip>
  );
}
```

**Usage:**

```tsx
<PermissionTooltip permission="create_course">
  <Button>Create Course</Button>
</PermissionTooltip>

// Tooltip shows: "Can create new courses"
```

---

## Phase 4: Direct Permissions (Week 7-8)

### Goal
Add escape hatch for edge cases and one-off grants.

---

### 4.1 Update Permission Service

```python
# apps/fundamentals/services/permission_service.py

@classmethod
def compute_user_permissions(cls, user):
    # ... existing code ...
    
    for membership in memberships:
        group = membership.group
        role = membership.role
        
        group_granted = []
        
        # 1. Group decorators (existing)
        # 2. Member decorators (existing)
        
        # 3. NEW: Group direct permissions
        if group.additional_permissions:
            group_granted.extend(group.additional_permissions)
        
        # 4. NEW: Member direct permissions
        if membership.additional_permissions:
            group_granted.extend(membership.additional_permissions)
        
        # ... rest of code ...
```

---

### 4.2 Admin UI for Direct Permissions

**File:** `components/groups/GroupPermissionsSettings.tsx`

```tsx
import { Accordion } from '@chakra-ui/react';
import { PermissionTreeSelector } from '@/components/permissions/PermissionTreeSelector';

export function GroupPermissionsSettings({ group, onUpdate }) {
  return (
    <VStack align="stretch" gap={6}>
      {/* Primary: Decorators */}
      <Box>
        <Heading size="md" mb={4}>Group Type</Heading>
        <CheckboxGroup 
          value={group.decorators}
          onChange={decorators => onUpdate({ decorators })}
        >
          <Checkbox value="education_hub">
            <VStack align="start">
              <Text fontWeight="bold">Education Hub</Text>
              <Text fontSize="sm" color="gray.600">
                Offer courses and learning experiences
              </Text>
            </VStack>
          </Checkbox>
          
          <Checkbox value="event_venue">
            <VStack align="start">
              <Text fontWeight="bold">Event Venue</Text>
              <Text fontSize="sm" color="gray.600">
                Host events and manage RSVPs
              </Text>
            </VStack>
          </Checkbox>
        </CheckboxGroup>
      </Box>
      
      {/* Secondary: Advanced Permissions (collapsed) */}
      <Accordion.Root collapsible>
        <Accordion.Item value="advanced">
          <Accordion.ItemTrigger>
            <Text>Advanced: Additional Permissions</Text>
            <Badge colorScheme="orange">Edge cases only</Badge>
          </Accordion.ItemTrigger>
          
          <Accordion.ItemContent>
            <Text fontSize="sm" color="gray.600" mb={4}>
              Add individual permissions for special cases. 
              Most groups won't need this.
            </Text>
            
            <PermissionTreeSelector 
              value={group.additional_permissions}
              onChange={perms => onUpdate({ additional_permissions: perms })}
              viewMode="advanced"
            />
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>
    </VStack>
  );
}
```

---

## Testing Strategy

### Unit Tests

```python
# tests/test_permissions.py

from django.test import TestCase
from apps.fundamentals.services.permission_service import PermissionService
from apps.groups.models import Group, GroupMember

class PermissionServiceTests(TestCase):
    def test_decorator_permissions(self):
        """Test that decorators grant correct permissions."""
        group = Group.objects.create(
            name="Test Group",
            slug="test",
            decorators=["education_hub"]
        )
        
        user = User.objects.create_user(username="coordinator")
        membership = GroupMember.objects.create(
            user=user,
            group=group,
            role="coordinator"
        )
        
        perms = PermissionService.compute_user_permissions(user)
        
        # Coordinator in education_hub should have manage_courses
        self.assertIn("manage_courses", perms['granted'])
        # And all children via flattening
        self.assertIn("create_course", perms['effective'])
        self.assertIn("edit_course", perms['effective'])
    
    def test_direct_permissions(self):
        """Test additional_permissions override."""
        # ... test direct permission grants ...
```

---

## Deployment Checklist

**Phase 1:**
- [ ] Run migrations for new fields
- [ ] Deploy backend with PermissionService
- [ ] Deploy frontend with PermissionsContext
- [ ] Test with different roles

**Phase 2:**
- [ ] Add `config/permissions/` directory to repo
- [ ] Create permission_tree.yaml
- [ ] Create 3-5 decorator YAML files
- [ ] Deploy and verify tree loads
- [ ] Assign decorators to test groups

**Phase 3:**
- [ ] Update auth endpoints with natural language
- [ ] Deploy enhanced permission hooks
- [ ] Add tooltips to UI
- [ ] User testing for clarity

**Phase 4:**
- [ ] Add direct permission UI
- [ ] Document when to use direct vs decorators
- [ ] Train group admins

---

## Common Patterns

### Adding a New Permission

1. Add to `permission_tree.yaml`:
```yaml
new_permission:
  display_name: "New Permission"
  parent: some_parent
  level: 3
  grants_text: "Can do new thing"
```

2. Restart server (loads new tree)
3. Use in code: `can_user_perform_action(user, 'new_permission')`

### Adding a New Decorator

1. Create `config/permissions/decorators/groups/new_decorator.yaml`
2. Define permissions by role
3. Restart server
4. Assign to groups via admin/UI

### Checking Permissions in Views

```python
from apps.fundamentals.services.permission_service import PermissionService

class MyView(APIView):
    def post(self, request):
        if not PermissionService.can_user_perform_action(
            request.user, 
            'create_course'
        ):
            return Response(
                {'error': 'Permission denied'},
                status=403
            )
        # ... proceed ...
```

---

## FAQ

**Q: When should I use decorators vs direct permissions?**  
A: Use decorators for 90% of cases (semantic bundles). Use direct permissions for temporary grants, custom features, or beta testing.

**Q: Can I nest permissions more than 4 levels deep?**  
A: Technically yes, but keep it to 3-4 levels max for mental model simplicity.

**Q: How do I revoke a permission?**  
A: Phase 1-4 are additive only. Revocations planned for Phase 5.

**Q: Can groups define custom decorators?**  
A: Not in Phase 1-4. Custom decorators planned for Phase 5.

**Q: What happens if I change a decorator definition?**  
A: Next time users log in, they get new permissions. No data migration needed.

---

## Support & Resources

- **Permission Tree:** `config/permissions/permission_tree.yaml`
- **Decorators:** `config/permissions/decorators/`
- **Service:** `apps/fundamentals/services/permission_service.py`
- **Frontend Hook:** `lib/hooks/usePermissions.ts`

For questions, reach out to the team lead or check project docs.
