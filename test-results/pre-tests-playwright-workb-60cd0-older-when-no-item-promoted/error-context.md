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
  - generic [ref=e14] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e15]:
      - img [ref=e16]
    - generic [ref=e19]:
      - button "Open issues overlay" [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e22]: "1"
          - generic [ref=e23]: "2"
        - generic [ref=e24]:
          - text: Issue
          - generic [ref=e25]: s
      - button "Collapse issues badge" [ref=e26]:
        - img [ref=e27]
  - alert [ref=e29]
  - region "bottom-end Notifications alt+T"
```