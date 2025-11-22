# Reset Test Users (Fix UNIQUE Constraint Error)

## Problem

You're getting:
```
django.db.utils.IntegrityError: UNIQUE constraint failed: users_customuser.username
```

This means the test users already exist but with different emails or settings.

---

## Quick Fix: Delete and Recreate

```bash
cd ../mixtape-release-core/app
source ../env/bin/activate

# Delete existing test users
python manage.py shell << 'EOF'
from django.contrib.auth import get_user_model
User = get_user_model()

# Delete test users
for username in ['admin', 'existinguser', 'groupmember']:
    User.objects.filter(username=username).delete()
    print(f"Deleted: {username}")
EOF

# Recreate them with correct credentials
python manage.py create_test_users
```

---

## Or: Use Django Shell Interactively

```bash
cd ../mixtape-release-core/app
source ../env/bin/activate
python manage.py shell
```

Then in the shell:
```python
from django.contrib.auth import get_user_model
User = get_user_model()

# Delete test users
User.objects.filter(username='admin').delete()
User.objects.filter(username='existinguser').delete()
User.objects.filter(username='groupmember').delete()

# Exit shell
exit()
```

Then create fresh test users:
```bash
python manage.py create_test_users
```

---

## After Reset

Now run tests:
```bash
cd ../../mixtape-release-frontend
yarn test:local
```

Should work now! ✅

---

## Why This Happened

The `create_test_users` command tries to create users with specific usernames and emails. If a user with that username already exists (maybe created manually, or from bootstrap_mixtape), you get a UNIQUE constraint error.

The updated command now handles this gracefully by using `get_or_create` and updating existing users instead of failing.

---

## Permanent Fix

The command has been updated to:
- ✅ Get user if exists, create if doesn't
- ✅ Update email if changed
- ✅ Always update password to ensure it's correct
- ✅ Safe to run multiple times (idempotent)

So after you delete the old users once, you can run `create_test_users` as many times as you want!
