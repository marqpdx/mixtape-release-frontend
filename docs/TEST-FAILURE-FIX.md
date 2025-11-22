# Fix: Test Failures - Missing Test Users

## Problem

Tests are failing with:
```
Error: expect(locator).toBeVisible() failed
Locator: locator('text=Login successful')
```

**Root cause:** Test users don't exist in the database yet!

---

## Quick Fix (Run This)

```bash
cd mixtape-release-frontend
./QUICK-FIX.sh
```

This will:
1. ✅ Create test users (admin@mixtape.com, etc.)
2. ✅ Verify health endpoint works
3. ✅ Verify test user can login
4. ✅ Install Playwright if needed

Then run:
```bash
yarn test:local
```

---

## Manual Fix (If script fails)

### Step 1: Create Test Users

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

### Step 2: Verify It Works

```bash
# Test login API
curl -X POST http://127.0.0.1:8010/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mixtape.com","password":"testpassword123"}'
```

Should return JSON with `access` and `refresh` tokens.

### Step 3: Run Tests

```bash
cd ../mixtape-release-frontend
yarn test:local
```

---

## What Was Created

**New Django Command:** `create_test_users`
- Location: `mixtape-release-core/app/mixtape/management/commands/create_test_users.py`
- Creates 3 predictable test users for E2E testing
- Safe to run multiple times (idempotent)

**Test Users:**
1. **admin@mixtape.com** - Superuser for most tests
2. **existinguser@mixtape.com** - Regular user for invite tests
3. **groupmember@mixtape.com** - Group member for invite tests

**Updated Test Script:** `scripts/test-local.sh`
- Now automatically checks for test users
- Creates them if missing
- More helpful error messages

---

## Why Tests Failed

Playwright tests try to login with `admin@mixtape.com` / `testpassword123`, but this user didn't exist yet in the database.

The tests are correct - we just needed to create the test data!

---

## Future: CI/CD Setup

In GitHub Actions, we'll run `create_test_users` automatically before E2E tests:

```yaml
- name: Create test users
  run: python manage.py create_test_users

- name: Run Playwright tests
  run: npx playwright test
```

Already built into `.github/workflows/deploy-backend.yml` (lines 100-105).

---

## Next Steps

1. Run `./QUICK-FIX.sh` (or manual steps above)
2. Run `yarn test:local`
3. Tests should pass! ✅

If tests still fail, use UI mode to debug:
```bash
yarn test:local ui
```

---

**TL;DR:** Run `./QUICK-FIX.sh` then `yarn test:local`. Tests will pass!
