# Mixtape Testing - Quick Start Guide

**Last Updated:** 2025-11-13
**Status:** Ready to Use

---

## 🚀 Quick Start (TL;DR)

```bash
# Install Playwright (first time only)
yarn install
npx playwright install

# Run all tests before pushing to GitHub
yarn test:local
```

**That's it!** If tests pass, you're safe to push.

---

## 📋 Prerequisites Checklist

Before running tests, ensure:

- [ ] **Backend running**: `cd ../mixtape-release-core/app && python manage.py runserver 127.0.0.1:8010`
- [ ] **Frontend running**: `yarn dev` (should be on 127.0.0.1:3010)
- [ ] **Test users exist**: `cd ../mixtape-release-core/app && python manage.py create_test_users`
- [ ] **Playwright installed**: `npx playwright install`

**Note:** `yarn test:local` automatically checks for test users and creates them if missing!

---

## 🎯 Common Commands

```bash
# Run all tests (headless, fast)
yarn test:local

# Watch tests run in browser
yarn test:local headed

# Interactive test runner (best for debugging)
yarn test:local ui

# Step through tests line by line
yarn test:local debug

# Run only auth tests
yarn test:local auth

# Run only invite flow tests
yarn test:local invite

# View last test report
yarn test:report
```

---

## 🧪 What Gets Tested

### Authentication (tests/auth/)
- ✅ Login with email/username
- ✅ Registration with validation
- ✅ Logout and session cleanup
- ✅ Token refresh (15 min access, 7 day refresh)

### Invite Flows (tests/invite-flows/)
- ✅ Existing group member (prevents duplicates)
- ✅ Non-member email invite (full activation flow)
- ✅ Site member @username invite (autocomplete)

---

## 🚨 If Tests Fail

1. **Read the error message** - It tells you exactly what failed
2. **Run in UI mode**: `yarn test:local ui`
3. **Watch what happens** - You'll see the browser and can spot the issue
4. **Fix the code** (not the test!)
5. **Run again**: `yarn test:local`

---

## 📚 Full Documentation

- **Detailed testing guide**: `tests/README-tests.md`
- **Deployment integration**: `../docs/deployment/04-testing-integration.md`
- **CI/CD workflow**: `../.github/workflows/deploy-backend.yml`

---

## 🎓 Testing Philosophy (Emily's Perspective)

**Why we test:**
- Catch bugs before users do
- Confidence to ship faster
- Document expected behavior
- Prevent regressions

**When to test:**
- ✅ Before every git push (local)
- ✅ Automatically on push (CI/CD)
- ✅ Before manual deployment approval
- ✅ After deployment (health check)

**What to test:**
- ✅ Critical user flows (auth, invites)
- ✅ Happy paths (things that should work)
- ✅ Error cases (things that should fail gracefully)
- ❌ Implementation details (internal code structure)

---

## ⚡ Pro Tips

1. **Use data-testid** in your components:
   ```tsx
   <button data-testid="login-button">Login</button>
   ```

2. **Run tests before pushing**:
   ```bash
   yarn test:local && git push
   ```

3. **Debug with UI mode** - It's like a superpower:
   ```bash
   yarn test:local ui
   ```

4. **Keep tests fast** - Slow tests = ignored tests

5. **One test, one concern** - Easy to debug when it fails

---

## 🤝 Need Help?

- **Tests failing locally?** Check `tests/README-tests.md`
- **Tests failing in CI?** Check GitHub Actions logs
- **Writing new tests?** See test templates in `tests/README-tests.md`
- **Questions?** Ask Emily (or review the docs)

---

**Remember:** Tests are not a chore. They're **confidence**.

Run `yarn test:local` before every push! 🚀

**- Emily Chen, CTO**
