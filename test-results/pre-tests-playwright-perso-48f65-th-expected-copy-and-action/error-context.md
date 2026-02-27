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
  - button "Open Next.js Dev Tools" [ref=e10] [cursor=pointer]:
    - img [ref=e11]
  - alert [ref=e14]
  - region "bottom-end Notifications alt+T"
  - generic [ref=e19]:
    - generic [ref=e20]:
      - heading "Sign in to Crossroads" [level=2] [ref=e21]
      - paragraph [ref=e22]: Welcome back
    - generic [ref=e24]:
      - textbox "Username or Email" [ref=e25]
      - generic [ref=e26]:
        - textbox "Password" [ref=e27]
        - button "Show password" [ref=e29] [cursor=pointer]:
          - img [ref=e30]
      - button "Sign In" [ref=e33] [cursor=pointer]
      - generic [ref=e34]:
        - generic [ref=e35] [cursor=pointer]: Forgot password?
        - generic [ref=e36] [cursor=pointer]: Sign up
```