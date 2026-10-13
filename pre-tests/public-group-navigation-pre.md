# Public group navigation — active-link regression

## Scope

The public group mini-nav uses `SurfaceTransitionLink`. Clicking the active Home or Writing link previously covered the page while waiting for a pathname change that never occurred. Same-path navigation now bypasses the overlay, including query/fragment changes and equivalent trailing slashes. Cross-page transitions remain in place.

## Lightweight verification — 2026-10-12

- Scoped ESLint, Crossroads TypeScript and `git diff --check`: passed.
- Temporary Next.js fixture importing the actual `SurfaceTransitionProvider` and `SurfaceTransitionLink`; Chromium with real Next router/hooks: passed.
- Repeated active Home and Writing clicks, keyboard Enter, and query/fragment links never covered the page or blocked interaction.
- Home → Writing → Home completed and cleared the overlay. Reduced-motion navigation completed without an overlay. No browser runtime errors.
- Scratch runner: `/tmp/gp10-issue-check/transition-check.cjs`. Fixture routes: `/transition` and `/transition/other` on port 3016. This isolates navigation; it does not reproduce full production group content.
- Not deployed or checked live. After deployment, repeat the active-link and round-trip checks on `/groups/mindful-brilliance` and `/groups/mindful-brilliance/writing`.
