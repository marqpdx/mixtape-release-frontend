# Testing Plans: Authentication & Permissions

## Recommended Test Distribution for Permissions

| Test Type | Count | Location | Purpose |
|-----------|-------|----------|---------|
| **Backend Unit Tests** | 50+ | `mixtape-release-core/app/groups/tests/test_permissions.py` | Test PermissionService logic: role mappings, permission computation, can_user_perform_action |
| **Backend Integration Tests** | 20-30 | `mixtape-release-core/app/accounts/tests/test_auth_endpoints.py` | Test auth endpoints return correct permissions, refresh endpoint works, DRF permission classes protect views |
| **Frontend Unit Tests** | 10 | `mixtape-release-frontend/src/lib/auth/__tests__/usePermissions.test.ts` | Test usePermissions hook: can(), canInGroup(), legacy methods |
| **E2E Critical Paths** | 5-10 | `mixtape-release-frontend/tests/e2e/auth-permissions.spec.ts` | Test complete user flows: login receives permissions, UI responds to permissions, role-based access works |

---

## Why This Approach?

### Test Pyramid Philosophy
This distribution follows the testing pyramid principle:
- **Wide base (Unit tests)**: Fast, isolated, comprehensive coverage of business logic
- **Middle layer (Integration tests)**: Verify components work together (API + DB + permissions)
- **Narrow top (E2E tests)**: Validate critical user journeys end-to-end

### Specific to Permissions Layer
**Backend-heavy testing** is appropriate because:
- Permission computation is backend business logic (PermissionService)
- Security-critical code requires thorough validation
- Backend tests are faster than E2E tests
- Permission bugs can have serious security implications

**Selective E2E testing** focuses on:
- Critical paths users actually follow (login → dashboard → group actions)
- UI responding correctly to permission states
- Role-based access control working across the full stack

---

## Best practice:

**Run different test suites at different stages of development:**

1. **During active development** - Run relevant unit tests frequently
   - Fast feedback loop (< 1 second per test)
   - Catch logic errors immediately
   - Use `yarn test:local` or backend `pytest -k test_permissions`

2. **Before committing** - Run integration tests for changed modules
   - Verify your changes work with database and API
   - Takes 5-30 seconds depending on scope
   - Prevents broken commits

3. **In CI/CD pipeline** - Run full unit + integration suite on every commit
   - Automated validation before merge
   - Typically 1-3 minutes
   - Gate for pull requests

4. **Pre-deployment** - Run critical E2E paths
   - Validate key user flows work end-to-end
   - Takes 2-5 minutes
   - Final safety check before production

5. **Nightly builds** - Run comprehensive E2E suite
   - Full browser testing across scenarios
   - Takes 10-30 minutes
   - Catch edge cases and integration issues

This staged approach balances **speed** (fast unit tests during development) with **confidence** (comprehensive E2E tests before deployment).

---

## Test Coverage Goals

- **Backend PermissionService**: 95%+ line coverage
- **Auth endpoints**: 90%+ coverage (login, /auth/me, refresh)
- **Frontend permission hooks**: 85%+ coverage
- **E2E critical paths**: 100% of role-based user flows

---

## Continuous Improvement

As the permissions system evolves through Phase 2 (semantic decorators) and Phase 3 (tree-based system), update tests to:
- Validate YAML decorator parsing
- Test tree traversal and inheritance
- Verify cache invalidation logic
- Ensure backward compatibility with Phase 1 role-based permissions

---

## Running Tests: Manual & CI/CD

### Backend Tests (Django/pytest)

#### Running Backend Unit Tests

**Location**: `mixtape-release-core/app/groups/test_permissions.py`

```bash
# From mixtape-release-core directory

# Run all permission unit tests
python manage.py test groups.test_permissions

# Or using pytest (if configured)
pytest app/groups/test_permissions.py

# Run specific test case
python manage.py test groups.test_permissions.PermissionServiceTestCase.test_admin_role_permissions

# Run with verbose output
python manage.py test groups.test_permissions -v 2

# Run with coverage
coverage run --source='.' manage.py test groups.test_permissions
coverage report
```

#### Running Backend Integration Tests

**Location**: `mixtape-release-core/app/accounts/tests/test_auth_endpoints.py`

```bash
# Run all auth endpoint integration tests
python manage.py test accounts.tests.test_auth_endpoints

# Run specific test case
python manage.py test accounts.tests.test_auth_endpoints.AuthEndpointsPermissionsTestCase

# Run all tests in accounts app
python manage.py test accounts
```

#### Running All Backend Tests

```bash
# Run entire backend test suite
python manage.py test

# With coverage
coverage run --source='.' manage.py test
coverage report
coverage html  # Generate HTML report in htmlcov/
```

---

### Frontend Tests (Playwright E2E)

#### Running E2E Tests Locally

**Location**: `mixtape-release-frontend/tests/auth/auth-permissions.spec.ts`

```bash
# From mixtape-release-frontend directory

# Run all E2E tests (headless - default)
yarn test

# Run only auth-permissions tests
yarn test tests/auth/auth-permissions.spec.ts

# Run with UI (interactive mode)
yarn test:ui

# Run in headed mode (see browser)
yarn test:headed tests/auth/auth-permissions.spec.ts

# Run in debug mode (step through)
yarn test:debug tests/auth/auth-permissions.spec.ts

# Run specific test by name
yarn test -g "should receive permissions data after successful login"

# Run using the local test script (sets up test database)
yarn test:local
```

#### Viewing Test Reports

```bash
# After running tests, view HTML report
yarn test:report
```

---

### Frontend Unit Tests (React Testing Library)

**Location**: `mixtape-release-frontend/src/lib/auth/__tests__/usePermissions.test.ts`

**Note**: These tests require setting up Jest/Vitest. To enable:

```bash
# 1. Install dependencies
yarn add -D vitest @testing-library/react @testing-library/react-hooks @testing-library/jest-dom jsdom

# 2. Create vitest.config.ts
# (See frontend unit test file for configuration details)

# 3. Add script to package.json
# "test:unit": "vitest"

# 4. Run unit tests
yarn test:unit

# Watch mode (re-run on file changes)
yarn test:unit --watch

# With coverage
yarn test:unit --coverage
```

---

## CI/CD Integration

### 1. **Every Commit** (Fast Validation - ~1-3 minutes)

Run fast unit and integration tests to catch obvious errors.

```yaml
# Example GitHub Actions workflow
name: Fast Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd mixtape-release-core
          pip install -r requirements.txt
      - name: Run backend unit tests
        run: |
          cd mixtape-release-core
          python manage.py test groups.test_permissions
      - name: Run backend integration tests
        run: |
          cd mixtape-release-core
          python manage.py test accounts.tests.test_auth_endpoints
```

### 2. **Pre-Merge / Pull Request** (Medium Validation - ~3-5 minutes)

Run all backend tests + critical E2E paths.

```yaml
name: Pull Request Tests

on: [pull_request]

jobs:
  full-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run all backend tests
        run: |
          cd mixtape-release-core
          python manage.py test

  critical-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Playwright
        run: |
          cd mixtape-release-frontend
          yarn install
          npx playwright install --with-deps
      - name: Run critical E2E tests
        run: |
          cd mixtape-release-frontend
          yarn test tests/auth/auth-permissions.spec.ts
```

### 3. **Pre-Deployment** (Full Validation - ~5-10 minutes)

Run comprehensive E2E suite before deploying to production.

```yaml
name: Pre-Deployment Tests

on:
  workflow_dispatch:  # Manual trigger
  push:
    branches: [main, production]

jobs:
  comprehensive-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run full E2E suite
        run: |
          cd mixtape-release-frontend
          yarn install
          npx playwright install --with-deps
          yarn test  # All E2E tests
      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: mixtape-release-frontend/playwright-report/
```

### 4. **Nightly Builds** (Comprehensive - ~15-30 minutes)

Run everything: backend tests, frontend unit tests, full E2E suite.

```yaml
name: Nightly Comprehensive Tests

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily

jobs:
  all-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Backend tests with coverage
      - name: Backend tests + coverage
        run: |
          cd mixtape-release-core
          coverage run --source='.' manage.py test
          coverage report
          coverage xml

      # Frontend unit tests (when set up)
      - name: Frontend unit tests
        run: |
          cd mixtape-release-frontend
          yarn test:unit --coverage || echo "Unit tests not yet configured"

      # Full E2E suite
      - name: Full E2E suite
        run: |
          cd mixtape-release-frontend
          yarn test

      # Upload coverage reports
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./mixtape-release-core/coverage.xml
```

---

## Local Development Workflow

### Quick Feedback Loop (< 5 seconds)

```bash
# While actively developing permissions logic
cd mixtape-release-core
python manage.py test groups.test_permissions.PermissionServiceTestCase.test_admin_role_permissions -v 2
```

### Pre-Commit Check (~30 seconds)

```bash
# Before committing changes
cd mixtape-release-core
python manage.py test groups.test_permissions accounts.tests.test_auth_endpoints
```

### Full Local Validation (~2-3 minutes)

```bash
# Before pushing to remote
# 1. Backend tests
cd mixtape-release-core
python manage.py test

# 2. Critical E2E paths
cd ../mixtape-release-frontend
yarn test tests/auth/auth-permissions.spec.ts
```

---

## Test Debugging Tips

### Backend Tests

```bash
# Add breakpoint in test using pdb
import pdb; pdb.set_trace()

# Run single test with pdb
python manage.py test groups.test_permissions.PermissionServiceTestCase.test_admin_role_permissions

# Print verbose output
python manage.py test groups.test_permissions -v 2

# Keep test database for inspection
python manage.py test --keepdb
```

### E2E Tests

```bash
# Debug mode (pause before each action)
yarn test:debug tests/auth/auth-permissions.spec.ts

# Headed mode (see browser)
yarn test:headed tests/auth/auth-permissions.spec.ts

# UI mode (interactive)
yarn test:ui

# Generate trace for debugging
yarn test --trace on
```

---

## Performance Monitoring

Track test execution times to catch slow tests:

```bash
# Backend - show slowest tests
python manage.py test --timing

# Playwright - show test duration
yarn test --reporter=list
```

**Target times**:
- Backend unit test: < 100ms each
- Backend integration test: < 500ms each
- E2E test: < 30 seconds each

If tests exceed these targets, investigate and optimize.
