# Backend Code Analysis - Django Authentication

**Date**: 2025-11-10
**Purpose**: Review existing backend code to identify what's essential for minimal auth + invitation flow

---

## Executive Summary

### ✅ What's Solid (Keep As-Is)
1. **Authentication system** (`accounts/api/`) - Rock solid JWT implementation
2. **CustomUser model** (`users/`) - Clean, well-designed
3. **Base models** (`fundamentals/bases.py`) - Useful timestamp/soft-delete pattern
4. **Settings** - Well-organized, JWT configured properly

### ⚠️ What Needs Decisions
1. **Profiles vs Members** - Overlap and confusion
2. **Invitation system** - Not found, needs to be built or identified
3. **Complex BaseContent model** - Heavy for initial auth, defer

### 🗑️ What to Defer/Remove for Phase 1
1. All the polymorphic sponsor stuff (BaseContent, BaseData)
2. CollectionItem, ClassificationUsage (tags/categories)
3. Asset management
4. Groups (unless required for invitation)
5. Most INSTALLED_APPS (see recommendations below)

---

## Detailed Analysis

### 1. Authentication (accounts app) ✅ KEEP

**Location**: `accounts/api/`

**What it does**:
- JWT authentication with httpOnly cookies
- Login, logout, token refresh
- Email OR username login support
- User registration (`/api/auth/signup`)
- Current user identity endpoint (`/api/auth/me`)

**Key Endpoints**:
```
POST /api/auth/token          → Login (returns JWT + refresh cookie)
POST /api/auth/token/refresh  → Refresh access token
POST /api/auth/logout         → Logout (blacklist token)
GET  /api/auth/me             → Get current user identity
POST /api/auth/signup         → Register new user
GET  /api/auth/check-username/<username> → Check availability
```

**Security Features**:
- httpOnly cookies for refresh tokens
- Token blacklist on logout (if enabled)
- Proper error handling (no 500s on missing users)
- CORS configured for localhost:3000, 3001, etc.

**Missing**:
- ⚠️ Port 3010 not in CORS_ALLOWED_ORIGINS! (Need to add)

**Recommendation**: ✅ **KEEP ENTIRELY** - This is production-ready

---

### 2. User Models ✅ KEEP (with minor tweaks)

#### CustomUser (`users/models.py`)
**Status**: ✅ Solid

**Features**:
- Extends AbstractUser (username, email, first/last name)
- UUID primary key
- ManyToMany roles (admin, steward, member)
- Helper: `has_role(*role_names)`
- Helper: `active_groups()` - returns groups user is member of

**Recommendation**: ✅ **KEEP** - Well-designed, clean

---

#### UserProfile (`profiles/models.py`)
**Status**: ⚠️ Review overlap with members

**Features**:
- OneToOne with User
- UUID primary key
- Slug (auto-generated from display_name or username)
- Avatar, background_image, bio (markdown + JSON)
- display_name, self_description, quick_intro
- Visibility controls (public vs members-only)
- Layout preferences (LayoutParent mixin)

**Issues**:
1. **Overlap with members app** - What's the difference?
2. **Heavy dependencies**: `identity.EmblemAvatar`, markdown rendering

**Recommendation**:
- ✅ **KEEP for Phase 1** but simplify:
  - Remove avatar FK (use string path for now)
  - Remove bio_json/markdown (defer rich text)
  - Keep: display_name, slug, quick_intro
  - Remove: visibility controls (make everything members-only by default)

---

#### Member App
**Status**: ⚠️ Empty/confused

**Current state**: `models.py` has only comments, no actual models

**Question**: What was this supposed to be vs. Profile?

**Recommendation**:
- 🗑️ **REMOVE members app entirely** for Phase 1
- Use User + Profile as the member concept
- Can revisit later if there's a real need

---

### 3. Fundamental Models

#### BaseModel (`fundamentals/bases.py`) ✅ KEEP
**What it is**: Abstract base with timestamps + soft delete

```python
class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
```

**Recommendation**: ✅ **KEEP** - Simple, useful, no dependencies

---

#### BaseData, BaseContent, BaseAsset 🗑️ DEFER
**What they are**: Complex polymorphic content models with:
- Slug generation logic
- Generic ForeignKeys for polymorphic sponsors (User, Group, etc.)
- Author tracking
- Tags, categories, attachments
- Published state

**Dependencies**:
- `assets.AssetUsage`
- `writing.models` (for provisional slug check)
- `core.constants.PROVISIONAL_SLUG_PREFIX`
- ContentTypes framework

**Recommendation**: 🗑️ **DEFER** - Too complex for Phase 1 (auth only)
- Keep only if you need content creation in Phase 1
- Likely this is for future features (writing, posts, etc.)

---

#### CollectionItem, ClassificationUsage 🗑️ DEFER
**What they are**: Generic relations for tagging and collections

**Recommendation**: 🗑️ **DEFER** - Not needed for auth

---

### 4. Settings Analysis

#### INSTALLED_APPS - Minimal Set

**Current** (86 lines!):
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_filters',
    'corsheaders',
    'rest_framework',
    'storages',

    # Core
    'accounts', 'admin_api', 'api', 'core', 'assets', 'users',

    # Functionality
    'activity', 'almanac', 'ai', 'chat', 'classifications',
    'contact', 'content', 'contexts', 'dispatch', 'earthlab',
    'fundamentals', 'groups', 'identity', 'lantern', 'library',
    'members', 'profiles', 'threadworks', 'utils', 'writing',
]
```

**Recommended MINIMAL for Phase 1 (Auth + Profiles)**:
```python
INSTALLED_APPS = [
    # Django core
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',  # ⚠️ May be missing!

    # Local - MINIMAL
    'accounts',
    'users',
    'profiles',
    'fundamentals',  # For BaseModel
]
```

**What we're cutting** (can add back incrementally):
- ❌ storages (S3) - use local files or defer image uploads
- ❌ django_filters - not needed for auth
- ❌ All feature apps (ai, chat, writing, etc.)
- ❌ assets, identity - not needed for auth
- ❌ members - empty/confused
- ❌ groups - defer unless required for invitation

---

#### JWT Settings ✅ GOOD

```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=10),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    'SIGNING_KEY': ACCESS_TOKEN_SIGNING_KEY,
    "ALGORITHM": "HS256",
}

JWT_COOKIE_NAME = "refresh_token"
JWT_COOKIE_SECURE = False  # ✅ OK for dev
JWT_COOKIE_SAMESITE = "Lax"
```

**Recommendation**: ✅ **KEEP AS-IS**

---

#### CORS Settings ⚠️ NEEDS UPDATE

**Current**:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:4200",
    # ...
]
```

**Missing**: `http://localhost:3010` (our new frontend!)

**Recommendation**: ⚠️ **ADD PORT 3010**

---

### 5. Invitation System

**Status**: ❌ NOT FOUND

**Evidence**:
- Searched for "invite" / "invitation" in codebase
- Found references in `members/api/views.py` and `mixtape/urls.py`
- But no invitation model or app

**Questions**:
1. Is invitation code in another repo?
2. Is it planned but not built?
3. Is there email-based invitation?
4. Or is it "admin creates account + sends creds"?

**Recommendation**:
- 🔍 **CLARIFY** - Need to understand invitation flow
- Options:
  1. **Invite links**: Generate token, send email, user completes signup
  2. **Admin-created accounts**: Admin creates user, sends temp password
  3. **Self-signup with approval**: User requests access, admin approves
  4. **Code-based**: Invitation codes that can be used once

---

## Recommendations: Minimal Auth Setup

### Phase 1: Core Authentication ONLY

**Goal**: Login/logout with JWT, user profile display

**Keep**:
1. ✅ `accounts` app (all of it)
2. ✅ `users` app (CustomUser, Role models)
3. ✅ `profiles` app (simplified UserProfile)
4. ✅ `fundamentals` (BaseModel only)
5. ✅ JWT settings
6. ✅ CORS (add port 3010)

**Remove/Defer**:
1. ❌ `members` app (empty, confused)
2. ❌ All BaseContent/BaseData/polymorphic stuff
3. ❌ S3/storages (use placeholders for avatars)
4. ❌ All feature apps (ai, chat, writing, etc.)
5. ❌ Groups (unless needed for invitation)

**Simplify**:
1. ⚠️ UserProfile: Remove avatar FK, bio_json, visibility fields
2. ⚠️ INSTALLED_APPS: Cut down to 12-15 apps max

---

### Phase 2: Add Invitation System

**After Phase 1 works**, add:
1. Invitation model (token, email, expiry, used_at)
2. Invitation endpoints (create, validate, consume)
3. Email sending (invitation emails)
4. Signup flow (requires valid invitation)

---

## Critical Questions for You

### 1. Profiles vs Members
**Question**: What's the intended difference?
- Option A: Kill `members` app, use User + Profile
- Option B: Consolidate Profile into Members
- Option C: Keep both but clarify roles

**My recommendation**: Option A (User + Profile is clean)

---

### 2. Invitation Flow
**Question**: How does someone join?
- A. Email invitation with unique link/token?
- B. Admin creates account manually?
- C. Invitation codes (shareable)?
- D. Self-signup with approval queue?

**Impact**: This determines Phase 2 architecture

---

### 3. Minimal Profile Fields
**Question**: For Phase 1, what profile data do we NEED?
- Required: display_name, slug
- Nice to have: quick_intro, avatar (URL string)
- Defer: bio_markdown, visibility controls, layout preferences

**Confirm?**

---

### 4. Groups
**Question**: Are groups required for Phase 1?
- If "every member must be in a group" → Keep groups app
- If "groups are optional/later" → Defer groups app

**Impact**: Affects invitation flow (invite to group vs. platform)

---

### 5. S3/Asset Storage
**Question**: For Phase 1, how to handle avatars/images?
- A. Defer entirely (use placeholder URLs)
- B. Use local file storage (simpler)
- C. Keep S3 (more complex but production-ready)

**My recommendation**: Option A or B for Phase 1

---

## Next Steps

1. **Answer the 5 questions above**
2. **I'll create a pared-down backend config**:
   - Minimal INSTALLED_APPS
   - Simplified UserProfile model
   - Updated CORS for port 3010
3. **Document the invitation flow** (once decided)
4. **Update data model docs** with actual schemas
5. **Wire up frontend** to working backend endpoints

---

*This analysis is based on code review as of 2025-11-10*
*Backend location: `REDACTED-LOCAL-PATH/mixtape-release-core`*
