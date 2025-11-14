# Phase 1 Backend Changes - Summary

**Date**: 2025-11-10
**Status**: ✅ Code changes complete, ready for testing

---

## Overview

Simplified Django backend to minimal authentication + member profiles setup. Removed 20+ apps, streamlined models, created clean Member API.

---

## Changes Made

### 1. ✅ Simplified UserProfile Model

**File**: `mixtape-release-core/profiles/models.py`

**Changes**:
- Removed: `LayoutParent`, bio_json, bio_markdown, visibility controls, avatar FK
- Kept: Minimal fields for Phase 1
- Now inherits from `BaseModel` only (timestamps + soft delete)

**New fields**:
```python
class UserProfile(BaseModel):
    id (UUID)
    user (OneToOneField to CustomUser)
    slug (SlugField, auto-generated)
    display_name (CharField, max 48)
    quick_intro (TextField, max 300, optional)
    avatar_url (CharField, placeholder for Phase 2)

    # Inherited from BaseModel:
    created_at, updated_at, deleted_at
```

**Slug generation**: Auto-generates from `display_name` or `username`, handles uniqueness

---

### 2. ✅ Created Member API

**Files**:
- `profiles/api/serializers.py` - MemberSerializer (combines User + Profile)
- `profiles/api/views.py` - MemberListView, MemberDetailView
- `profiles/api/urls.py` - `/api/members/` routes

**Member API Concept**:
- "Member" is the public-facing identity (User + Profile combined)
- Frontend calls `/api/members/<slug>` to get full member data
- Serializer combines fields from both User and Profile models

**Endpoints**:
```
GET /api/members/              → List all members
GET /api/members/<slug>/       → Get member by slug
```

**Example Response**:
```json
{
  "id": "uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_active": true,
  "date_joined": "2025-11-10T12:00:00Z",
  "roles": ["member"],
  "slug": "john-doe",
  "display_name": "John Doe",
  "quick_intro": "Developer and musician",
  "avatar_url": "",
  "created_at": "2025-11-10T12:00:00Z",
  "updated_at": "2025-11-10T14:30:00Z"
}
```

---

### 3. ✅ Minimal INSTALLED_APPS

**File**: `mixtape-release-core/mixtape/settings/base.py`

**Before**: 30+ apps
**After**: 11 apps

**Kept**:
```python
INSTALLED_APPS = [
    # Django core (6 apps)
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party (3 apps)
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',

    # Local (4 apps)
    'accounts',      # Authentication
    'users',         # CustomUser, Role
    'profiles',      # UserProfile, Member API
    'fundamentals',  # BaseModel
]
```

**Removed** (deferred to later phases):
- ai, chat, writing, activity, almanac
- groups, assets, identity
- classifications, contact, content, contexts
- dispatch, earthlab, lantern, library
- threadworks, utils, members (deleted)

---

### 4. ✅ Added Port 3010 to CORS

**File**: `mixtape-release-core/mixtape/settings/base.py`

**Added**:
```python
CORS_ALLOWED_ORIGINS = [
    # ... existing ports ...
    "http://localhost:3010",    # ← NEW
    "http://127.0.0.1:3010",    # ← NEW
]
```

---

### 5. ✅ Deleted Members App

**Action**: Removed `mixtape-release-core/members/` directory entirely

**Reason**: App was empty (no models), confused with profiles. Using User + Profile pattern instead.

---

### 6. ✅ Minimal URL Configuration

**File**: `mixtape-release-core/mixtape/urls.py`

**Before**: 20+ route includes
**After**: 2 route includes (+ admin)

**Active routes**:
```python
# Authentication
path('api/auth/', include('accounts.api.auth_urls'))
  → /api/auth/token (login)
  → /api/auth/token/refresh
  → /api/auth/logout
  → /api/auth/me (current user)
  → /api/auth/signup

# Members
path('api/members/', include('profiles.api.urls'))
  → /api/members/ (list)
  → /api/members/<slug> (detail)
```

**Commented out**: All other endpoints (groups, ai, chat, writing, etc.)

---

## Authentication Endpoints (Unchanged - Already Solid)

These were already production-ready, no changes needed:

### Login
```
POST /api/auth/token
Body: { "identifier": "user@email.com", "password": "..." }
Response: {
  "access": "eyJ...",
  "access_expires": 1234567890,
  "refresh": "eyJ...",
  "refresh_expires": 1234567890,
  "user": { "id": "...", "username": "...", "email": "..." }
}
```
- Sets httpOnly cookie with refresh token
- Accepts email OR username
- Returns user object + tokens

### Refresh Token
```
POST /api/auth/token/refresh
(refresh token read from httpOnly cookie)
Response: { "access": "...", "access_expires": ..., "refresh": "..." }
```

### Logout
```
POST /api/auth/logout
Response: { "success": true, "detail": "Logged out successfully" }
```
- Blacklists refresh token
- Clears cookie

### Current User Identity
```
GET /api/auth/me
Headers: Authorization: Bearer <access_token>
Response: {
  "id": "...",
  "username": "...",
  "email": "...",
  "is_superuser": false,
  "is_staff": false,
  "roles": ["member"],
  "profile": { ... },
  "groups": []
}
```

---

## What's NOT Changed (Kept As-Is)

### Users App
- ✅ `CustomUser` model - untouched, solid
- ✅ `Role` model - untouched
- ✅ All auth logic in `accounts/` - untouched

### Fundamentals App
- ✅ `BaseModel` - untouched (timestamps, soft delete)
- ⚠️ `BaseData`, `BaseContent` - Still exist in code but not used (will use in Phase 4+)

### Settings
- ✅ JWT settings - untouched (10min access, 30day refresh)
- ✅ Cookie settings - untouched
- ✅ Database settings - untouched

---

## Next Steps: Testing

### 1. Run Migrations
```bash
cd mixtape-release-core
python manage.py makemigrations
python manage.py migrate
```

**Expected**: Should create new profile migrations for simplified model

### 2. Create Superuser
```bash
python manage.py createsuperuser
# Username: admin
# Email: admin@example.com
# Password: (your choice)
```

### 3. Create Profile for Superuser
```bash
python manage.py shell
```
```python
from users.models import CustomUser
from profiles.models import UserProfile

user = CustomUser.objects.get(username='admin')
profile = UserProfile.objects.create(
    user=user,
    display_name='Admin User',
    quick_intro='System administrator'
)
print(f"Created profile: {profile.slug}")
```

### 4. Test Endpoints Manually

**Start server**:
```bash
python manage.py runserver 8010
```

**Test login**:
```bash
curl -X POST http://localhost:8010/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"identifier": "admin", "password": "your_password"}'
```

**Test /auth/me** (copy access token from login response):
```bash
curl http://localhost:8010/api/auth/me \
  -H "Authorization: Bearer <access_token>"
```

**Test members list**:
```bash
curl http://localhost:8010/api/members/
```

**Test member detail**:
```bash
curl http://localhost:8010/api/members/admin-user
```

---

## Expected Issues & Solutions

### Issue 1: Missing dependencies after INSTALLED_APPS change
**Symptom**: Import errors for removed apps
**Solution**: Comment out any code that references removed apps

### Issue 2: Migration conflicts
**Symptom**: Migrations fail due to removed app dependencies
**Solution**: May need to fake migrations for removed apps:
```bash
python manage.py migrate <app_name> --fake
```

### Issue 3: Profile creation on signup
**Symptom**: New users created via `/api/auth/signup` don't get profiles
**Solution**: Add signal or update `UserCreateSerializer` to auto-create profile

---

## Data Model Changes Summary

### Before (Complex)
```
User (1) ←→ (1) Profile
              ↓
          - avatar (FK to EmblemAvatar)
          - bio_json (JSONField)
          - bio_markdown (TextField)
          - visibility controls
          - layout preferences
          - inherits from LayoutParent + BaseModel
```

### After (Simple)
```
User (1) ←→ (1) Profile
              ↓
          - display_name
          - quick_intro
          - avatar_url (string placeholder)
          - inherits from BaseModel only
```

---

## Files Modified

```
mixtape-release-core/
├── profiles/
│   ├── models.py                    ✏️  SIMPLIFIED
│   └── api/
│       ├── serializers.py           ✏️  REPLACED (MemberSerializer)
│       ├── views.py                 ✏️  REPLACED (Member views)
│       └── urls.py                  ✏️  REPLACED (Member routes)
├── mixtape/
│   ├── settings/base.py             ✏️  MODIFIED (INSTALLED_APPS, CORS)
│   └── urls.py                      ✏️  SIMPLIFIED (minimal routes)
└── members/                         ❌  DELETED
```

---

## Frontend Impact

Once backend is tested and working, frontend will call:

### Auth Flow
1. `POST /api/auth/token` → Get tokens
2. `GET /api/auth/me` → Get current user
3. Store access token in memory
4. Refresh token auto-handled via cookie

### Member Display
1. `GET /api/members/` → List all members
2. `GET /api/members/<slug>` → Show member profile
3. Later: `PATCH /api/members/<slug>` → Edit own profile (Phase 2)

---

*Last updated: 2025-11-10*
*Next: Test backend, then wire up frontend*
