# Setup Test Data for E2E Testing

**Quick Fix:** Your tests are failing because test users don't exist yet!

---

## Quick Setup (Auto-creates test users)

```bash
cd mixtape-release-frontend
yarn test:local
```

The script will automatically detect missing test users and create them for you!

---

## Manual Setup (If automatic fails)

```bash
cd ../mixtape-release-core/app
source ../../env/bin/activate
python manage.py create_test_users
```

Expected output:
```
Creating test users for E2E testing...
✓ Created/updated: admin
✓ Created/updated: existinguser
✓ Created/updated: groupmember

✅ Test users ready for E2E testing!

Test credentials:
  Admin:    admin@mixtape.com / testpassword123
  Existing: existinguser@mixtape.com / userpassword123
  Member:   groupmember@mixtape.com / memberpassword123
```

---

## Verify Test Users Work

```bash
# Test login
curl -X POST http://127.0.0.1:8010/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mixtape.com","password":"testpassword123"}'
```

Should return access and refresh tokens.

---

## What This Command Does

**File:** `mixtape-release-core/app/mixtape/management/commands/create_test_users.py`

Creates 3 test users:

1. **admin@mixtape.com** (admin/testpassword123)
   - Superuser account
   - Used in most tests

2. **existinguser@mixtape.com** (existinguser/userpassword123)
   - Regular site member
   - Used in @username invite tests

3. **groupmember@mixtape.com** (groupmember/memberpassword123)
   - Member of test groups
   - Used in group invitation tests

All users have profiles created automatically.

---

## Now Run Tests

```bash
cd mixtape-release-frontend
yarn test:local
```

Tests should pass now! ✅

---

## If Tests Still Fail

Check:
1. ✅ Backend running on 127.0.0.1:8010
2. ✅ Frontend running on 127.0.0.1:3010
3. ✅ Test users exist (run create_test_users)
4. ✅ Health endpoint works: `curl http://127.0.0.1:8010/health/`

Debug with UI mode:
```bash
yarn test:local ui
```

Watch what's happening and see exactly where tests fail.
