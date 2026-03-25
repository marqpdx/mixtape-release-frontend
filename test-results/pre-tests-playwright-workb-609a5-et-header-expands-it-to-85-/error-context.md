# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic:
    - link "Skip to main content" [ref=e2] [cursor=pointer]:
      - /url: "#main-content"
    - link "Skip to navigation" [ref=e3] [cursor=pointer]:
      - /url: "#navigation"
    - link "Skip to footer" [ref=e4] [cursor=pointer]:
      - /url: "#footer"
  - generic [ref=e6]:
    - heading "404" [level=1] [ref=e7]
    - heading "This page could not be found." [level=2] [ref=e9]
  - button "Open Next.js Dev Tools" [ref=e15] [cursor=pointer]:
    - img [ref=e16]
  - alert [ref=e19]
  - region "bottom-end Notifications alt+T"
```