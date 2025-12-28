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
  - generic [ref=e9]:
    - generic [ref=e10]:
      - heading "Sign in to Crossroads" [level=2] [ref=e11]
      - paragraph [ref=e12]: Welcome back
    - generic [ref=e14]:
      - textbox "Username or Email" [ref=e15]: admin@mixtape.com
      - textbox "Password" [ref=e16]: testpassword123
      - button "Sign In" [ref=e17] [cursor=pointer]
      - generic [ref=e18]:
        - generic [ref=e19] [cursor=pointer]: Forgot password?
        - generic [ref=e20] [cursor=pointer]: Sign up
  - generic [ref=e25] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e26]:
      - img [ref=e27]
    - generic [ref=e30]:
      - button "Open issues overlay" [ref=e31]:
        - generic [ref=e32]:
          - generic [ref=e33]: "0"
          - generic [ref=e34]: "1"
        - generic [ref=e35]: Issue
      - button "Collapse issues badge" [ref=e36]:
        - img [ref=e37]
  - alert [ref=e39]
  - region "bottom-end Notifications alt+T"
```