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
      - textbox "Username or Email" [ref=e15]
      - generic [ref=e16]:
        - textbox "Password" [ref=e17]
        - button "Show password" [ref=e19] [cursor=pointer]:
          - img [ref=e20]
      - button "Sign In" [ref=e23] [cursor=pointer]
      - generic [ref=e24]:
        - generic [ref=e25] [cursor=pointer]: Forgot password?
        - generic [ref=e26] [cursor=pointer]: Sign up
  - region "bottom-end Notifications alt+T"
```