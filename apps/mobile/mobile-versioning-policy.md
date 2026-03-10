# Mobile Versioning Policy

Mixtape mobile uses two version layers:

1. User-facing version (`version` in Expo config), following semantic versioning:
   - patch = bug fixes / polish
   - minor = visible feature additions
   - major = substantial product or UX change

2. Developer-facing build version:
   - managed remotely by EAS
   - incremented for release builds as needed for store submission

Rules:
- development builds do not require a user-facing version change
- preview builds only require a user-facing version change when serving as a release candidate
- production releases require an intentional user-facing version update and matching release notes