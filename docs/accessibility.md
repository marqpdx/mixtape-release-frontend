# Accessibility Guide

**Mixtape Release Frontend - Comprehensive Accessibility Documentation**

Version 1.0 | Last Updated: 2025-01-16

---

## Table of Contents

1. [Overview](#overview)
2. [Color & Contrast](#color--contrast)
3. [Typography & Scaling](#typography--scaling)
4. [Screen Reader Support](#screen-reader-support)
5. [Keyboard Navigation](#keyboard-navigation)
6. [Motion & Animations](#motion--animations)
7. [Component API Reference](#component-api-reference)
8. [Testing Guide](#testing-guide)
9. [WCAG Compliance](#wcag-compliance)

---

## Overview

Mixtape Release is designed to be accessible to **all users**, including those with:

- Visual impairments (low vision, color blindness)
- Motor disabilities (keyboard-only navigation)
- Cognitive disabilities (reduced motion, simpler interfaces)
- Hearing impairments (visual alternatives to audio cues)

### Accessibility Features

✅ **36 color combinations** (9 themes × 2 modes × 2 contrast levels)
✅ **5 font scaling options** (87.5% to 150%)
✅ **High contrast mode** (WCAG AAA compliant)
✅ **Reduced motion support** (respects system preferences)
✅ **Skip navigation links** (keyboard shortcuts)
✅ **Screen reader optimization** (ARIA landmarks, live regions)
✅ **Focus indicators** (visible keyboard navigation)
✅ **Semantic HTML** (proper heading hierarchy, landmarks)

---

## Color & Contrast

### Theme System

**9 Beautiful Themes Available:**

1. **Gallery Minimal** - Clean, spacious (default)
2. **Earthy Slate** - Warm, natural tones
3. **Crossroads Foundation** - Branded palette
4. **Forest Dawn** - Earthy browns and greens
5. **Canyon Glow** - Warm canyon oranges
6. **Meadow Mist** - Soft greens
7. **Twilight Dusk** - Mauve and tan
8. **Coastal Dunes** - Teal and cream
9. **Warm Crossroads** - Orange and brown

Each theme includes:
- **Light mode** (bright backgrounds)
- **Dark mode** (dark backgrounds)
- **Light high-contrast** (pure white bg, black text)
- **Dark high-contrast** (pure black bg, white text)

### Changing Themes

**Via UI:**
1. Click palette icon (🎨) in navbar
2. Select your preferred theme
3. Toggle between Normal/High contrast
4. Changes save automatically

**Programmatically:**
```tsx
import { useTheme } from '@contexts/ThemeContext';

function MyComponent() {
  const { setTheme, setContrastMode } = useTheme();

  // Change theme
  setTheme('earthy-slate');

  // Enable high contrast
  setContrastMode('high');
}
```

### Contrast Ratios

**Normal Mode:**
- Text-to-background: **4.5:1** minimum (WCAG AA)
- Large text: **3:1** minimum (WCAG AA)
- Interactive elements: **3:1** minimum

**High Contrast Mode:**
- Text-to-background: **7:1+** (WCAG AAA)
- Pure black (#000000) on pure white (#FFFFFF): **21:1**
- Accent colors tested for maximum visibility

### System Preference Detection

Automatically applies high contrast if user has enabled it in their OS:

```typescript
// Detects: prefers-contrast: high
// Auto-applies high contrast mode on first visit
```

---

## Typography & Scaling

### Font System

**Body Font:** Inter
- Modern, highly readable sans-serif
- Optimized for UI and long-form content
- Variable font with multiple weights

**Heading Font:** DM Serif Display
- Elegant serif for headlines
- Strong visual hierarchy
- Optimized for display sizes

**Monospace Font:** Menlo/Monaco
- Code snippets and technical content
- Clear character differentiation

### Font Optimization

All fonts use **Next.js font optimization**:
- ✅ Automatic subsetting (smaller file sizes)
- ✅ Preloading (faster initial render)
- ✅ Zero layout shift (CLS = 0)
- ✅ Self-hosted (no external requests)
- ✅ `font-display: swap` (text always visible)

### Text Styles

**11 Semantic Text Styles:**

```tsx
// Display (hero headlines)
<Text textStyle="display1">Welcome to Mixtape</Text>
<Text textStyle="display2">Your Journey Starts Here</Text>

// Body text
<Text textStyle="bodyLarge">Intro paragraph</Text>
<Text textStyle="body">Main content</Text>
<Text textStyle="bodySmall">Fine print</Text>

// UI elements
<Text textStyle="label">Form Label</Text>
<Text textStyle="caption">Helper text</Text>
<Text textStyle="overline">Section Header</Text>

// Interactive
<Text textStyle="link" as="a" href="/about">Link</Text>
<Text textStyle="code">npm install</Text>
```

**View all styles:** `/demos/typography`

### Font Scaling

**5 Size Options:**

| Scale | Multiplier | Use Case |
|-------|-----------|----------|
| **S** | 0.875× | Compact, dense content |
| **M** | 1.0× | Default, balanced |
| **L** | 1.125× | Comfortable reading |
| **XL** | 1.25× | Low vision, accessibility |
| **XXL** | 1.5× | Maximum readability |

**How to change:**
1. Open theme selector (palette icon)
2. Under "Accessibility" → "Text Size"
3. Click S, M, L, XL, or XXL
4. All text scales proportionally
5. Setting persists across sessions

**Implementation:**
```typescript
// CSS variable approach
--font-scale: 1.25;
font-size: calc(16px * var(--font-scale)); // = 20px
```

**Programmatic control:**
```tsx
import { useTheme } from '@contexts/ThemeContext';

function MyComponent() {
  const { fontScale, setFontScale } = useTheme();

  // Current scale
  console.log(fontScale); // 1, 1.125, 1.25, etc.

  // Change scale
  setFontScale(1.5); // XXL
}
```

---

## Screen Reader Support

### ARIA Landmarks

All major sections have proper semantic HTML and ARIA roles:

```html
<!-- Navigation -->
<nav id="navigation" role="navigation" aria-label="Main navigation">
  <!-- navbar content -->
</nav>

<!-- Main content -->
<main id="main-content" role="main">
  <!-- page content -->
</main>

<!-- Footer -->
<footer id="footer" role="contentinfo">
  <!-- footer content -->
</footer>
```

**Screen reader users can:**
- Press `R` to jump between regions/landmarks
- Press `H` to jump between headings
- Use landmark menu (e.g., VoiceOver Rotor)

### Skip Links

**Keyboard shortcuts to bypass repetitive content:**

1. **Skip to main content** - Jump to page content
2. **Skip to navigation** - Jump to navbar
3. **Skip to footer** - Jump to footer

**How they work:**
- Press `Tab` key → Skip links appear at top-left
- Press `Enter` → Jump to that section
- Hidden until focused (don't clutter visual layout)

**Custom skip links:**
```tsx
import { SkipLinks } from '@/components/accessibility';

<SkipLinks links={[
  { href: '#main-content', label: 'Skip to results' },
  { href: '#filters', label: 'Skip to filters' },
  { href: '#pagination', label: 'Skip to pagination' },
]} />
```

### Screen Reader Only Content

**Hide visually, keep accessible:**

```tsx
import { ScreenReaderOnly } from '@/components/accessibility';

// Icon-only button with accessible label
<button>
  <IconTrash />
  <ScreenReaderOnly>Delete item</ScreenReaderOnly>
</button>

// Decorative element with context
<div aria-hidden="true">★</div>
<ScreenReaderOnly>Featured item</ScreenReaderOnly>
```

**Use cases:**
- Icon-only buttons
- Decorative elements with meaning
- Additional context for screen readers
- Skip navigation links

### Live Announcements

**Announce dynamic changes to screen readers:**

```tsx
import { LiveRegion, useLiveAnnouncer } from '@/components/accessibility';

// Static announcement
<LiveRegion message="Form submitted successfully" />

// Dynamic announcements
function MyComponent() {
  const { announce, LiveRegionComponent } = useLiveAnnouncer();

  const handleSave = async () => {
    await saveData();
    announce('Changes saved successfully');
  };

  const handleError = () => {
    announce('Error occurred', { politeness: 'assertive' });
  };

  return (
    <>
      <button onClick={handleSave}>Save</button>
      <LiveRegionComponent />
    </>
  );
}
```

**Politeness levels:**
- `polite` (default): Waits for user to finish current task
  - Use for: Form success, loading states, non-critical updates
- `assertive`: Interrupts immediately
  - Use for: Critical errors, urgent alerts
- `off`: Disabled

**Best practices:**
- ✅ Announce successful actions ("Item deleted")
- ✅ Announce errors ("Connection lost")
- ✅ Announce loading states ("Loading...")
- ❌ Don't announce every keystroke (too noisy)
- ❌ Don't use `assertive` for non-critical updates

---

## Keyboard Navigation

### Focus Indicators

**All interactive elements have visible focus:**

```css
*:focus-visible {
  outline: 3px solid var(--theme-accent);
  outline-offset: 2px;
  border-radius: 2px;
}
```

**Behavior:**
- Keyboard navigation: **Visible outline** (accent color)
- Mouse clicks: **No outline** (cleaner UX)
- High contrast mode: **Enhanced visibility**

### Tab Order

**Logical, sequential tab order:**

1. Skip links (Tab reveals them)
2. Logo
3. Navigation items
4. Theme selector
5. User menu / Login
6. Main content
7. Footer links

### Keyboard Shortcuts

**Built-in browser shortcuts work:**

- `Tab` - Next focusable element
- `Shift + Tab` - Previous focusable element
- `Enter` - Activate link/button
- `Space` - Activate button, scroll down
- `Arrow keys` - Radio buttons, select dropdowns
- `Esc` - Close dialogs, dropdowns

**Screen reader shortcuts** (VoiceOver on macOS):

- `Ctrl + Option + Right Arrow` - Next item
- `Ctrl + Option + U` - Rotor menu (navigate by headings, landmarks, etc.)
- `Ctrl + Option + Cmd + H` - Next heading
- `Ctrl + Option + Cmd + L` - Next link

### Testing Keyboard Navigation

**Quick test:**
1. Click in address bar
2. Press `Tab` repeatedly
3. Can you reach all interactive elements?
4. Is focus order logical?
5. Are focus indicators visible?
6. Can you activate elements with `Enter`/`Space`?

---

## Motion & Animations

### Reduced Motion Support

**Automatically respects system preferences:**

```typescript
// Detects: prefers-reduced-motion: reduce
// Disables all animations if enabled
```

**Implementation:**
```typescript
// CSS variable approach
--transition-duration: 200ms; // Normal
--transition-duration: 0ms;   // Reduced motion

// Usage
transition: all var(--transition-duration) ease;
```

**What gets disabled:**
- Theme transitions
- Hover animations
- Page transitions
- Loading spinners (replaced with static indicators)
- Scroll animations

**What stays enabled:**
- Focus indicators (essential for navigation)
- Modal open/close (instant instead of animated)
- Layout changes (instant instead of smooth)

### Enabling Reduced Motion

**macOS:**
1. System Preferences → Accessibility
2. Display → Reduce Motion
3. Check the box

**Windows:**
1. Settings → Ease of Access
2. Display → Show animations
3. Turn off

**iOS:**
1. Settings → Accessibility
2. Motion → Reduce Motion
3. Toggle on

**Android:**
1. Settings → Accessibility
2. Remove animations
3. Enable

### Manual Control

```tsx
import { useTheme } from '@contexts/ThemeContext';

function MyComponent() {
  const { reducedMotion, setReducedMotion } = useTheme();

  // Check current state
  console.log(reducedMotion); // true/false

  // Override system preference (rarely needed)
  setReducedMotion(true);
}
```

---

## Component API Reference

### ScreenReaderOnly

**Hide content visually but keep it accessible.**

```tsx
import { ScreenReaderOnly } from '@/components/accessibility';

<ScreenReaderOnly>
  Additional context for screen readers
</ScreenReaderOnly>
```

**Props:**
- `children` (ReactNode): Content to hide visually
- `as` ('div' | 'span' | 'p'): HTML element (default: 'span')

---

### FocusableScreenReaderOnly

**Hidden until focused (for skip links).**

```tsx
import { FocusableScreenReaderOnly } from '@/components/accessibility';

<FocusableScreenReaderOnly href="#main-content">
  Skip to main content
</FocusableScreenReaderOnly>
```

**Props:**
- `children` (ReactNode): Link text
- `href` (string): Target ID
- `onClick` (function): Optional click handler

---

### LiveRegion

**Announce changes to screen readers.**

```tsx
import { LiveRegion } from '@/components/accessibility';

<LiveRegion
  message="Item saved successfully"
  politeness="polite"
  clearAfter={5000}
/>
```

**Props:**
- `message` (string): Text to announce
- `politeness` ('polite' | 'assertive' | 'off'): Urgency level
- `clearAfter` (number): Auto-clear after milliseconds (default: 5000)

---

### useLiveAnnouncer

**Programmatic announcements from any component.**

```tsx
import { useLiveAnnouncer } from '@/components/accessibility';

function MyComponent() {
  const { announce, LiveRegionComponent } = useLiveAnnouncer();

  const handleAction = () => {
    // Do something
    announce('Action completed');
  };

  return (
    <>
      <button onClick={handleAction}>Click me</button>
      <LiveRegionComponent />
    </>
  );
}
```

**Returns:**
- `announce(message, options?)` - Function to announce
- `LiveRegionComponent` - Component to render

**Options:**
- `politeness`: 'polite' | 'assertive'
- `clearAfter`: milliseconds

---

### SkipLinks

**Keyboard shortcuts to bypass navigation.**

```tsx
import { SkipLinks } from '@/components/accessibility';

// Default links
<SkipLinks />

// Custom links
<SkipLinks links={[
  { href: '#main-content', label: 'Skip to content' },
  { href: '#search', label: 'Skip to search' },
]} />
```

**Props:**
- `links` (array): Custom skip link definitions
  - `href` (string): Target ID
  - `label` (string): Link text

---

### useTheme

**Access and control theme settings.**

```tsx
import { useTheme } from '@contexts/ThemeContext';

function MyComponent() {
  const {
    currentTheme,      // Theme object
    colorMode,         // 'light' | 'dark'
    contrastMode,      // 'normal' | 'high'
    fontScale,         // 0.875 | 1 | 1.125 | 1.25 | 1.5
    reducedMotion,     // boolean
    setTheme,          // (id: string) => void
    setContrastMode,   // (mode: ContrastMode) => void
    setFontScale,      // (scale: FontScale) => void
    toggleColorMode,   // () => void
    availableThemes,   // Theme[]
  } = useTheme();

  return (
    <div>
      <p>Current theme: {currentTheme.name}</p>
      <p>Color mode: {colorMode}</p>
      <p>Font scale: {fontScale}x</p>
    </div>
  );
}
```

---

## Testing Guide

### Manual Testing

#### **1. Keyboard Navigation Test**

```
✓ Tab through entire page
✓ Skip links appear and work
✓ All interactive elements reachable
✓ Focus indicators visible
✓ Tab order is logical
✓ No keyboard traps
✓ Can activate with Enter/Space
```

#### **2. Screen Reader Test** (VoiceOver on macOS)

```
✓ Enable VoiceOver (Cmd + F5)
✓ Navigate by headings (Ctrl + Opt + Cmd + H)
✓ Navigate by landmarks (Ctrl + Opt + U)
✓ All buttons have labels
✓ Form fields have labels
✓ Images have alt text
✓ Dynamic changes announced
```

#### **3. Contrast Test**

```
✓ Try all 9 themes
✓ Toggle high contrast for each
✓ Text readable in all combinations
✓ Links distinguishable
✓ Buttons visible
✓ No color-only information
```

#### **4. Font Scaling Test**

```
✓ Try all 5 font sizes (S to XXL)
✓ No text cut off
✓ Buttons still readable
✓ Layout doesn't break
✓ Setting persists on refresh
```

#### **5. Reduced Motion Test**

```
✓ Enable reduced motion in OS
✓ Theme changes are instant
✓ Hover effects disabled
✓ No distracting animations
✓ Focus indicators still visible
```

### Automated Testing

#### **Lighthouse Audit** (Chrome DevTools)

```bash
# Target scores:
Accessibility: 95+ ✅
Performance: 90+ ✅
Best Practices: 90+ ✅
SEO: 90+ ✅
```

**How to run:**
1. Open Chrome DevTools (F12)
2. Lighthouse tab
3. Select "Accessibility" + "Performance"
4. Click "Analyze page load"
5. Review scores and recommendations

#### **axe DevTools** (Browser Extension)

Free accessibility testing tool:

1. Install axe DevTools extension
2. Open DevTools → axe tab
3. Click "Scan ALL of my page"
4. Review issues by severity:
   - 🔴 Critical
   - 🟠 Serious
   - 🟡 Moderate
   - 🔵 Minor

#### **WAVE** (Web Accessibility Evaluation Tool)

Visual accessibility checker:

1. Visit https://wave.webaim.org
2. Enter your URL
3. Click "WAVE this page"
4. Review:
   - Errors (must fix)
   - Contrast errors
   - Alerts (review)
   - Features (good!)
   - Structural elements

### Regression Testing

**Test after every major update:**

- [ ] Theme switching works
- [ ] High contrast applies correctly
- [ ] Font scaling multiplies properly
- [ ] Skip links appear and navigate
- [ ] Screen reader announces changes
- [ ] Keyboard navigation unbroken
- [ ] Focus indicators visible
- [ ] No console errors

---

## WCAG Compliance

### Standards Met

**WCAG 2.1 Level AAA** in high contrast mode
**WCAG 2.1 Level AA** in normal mode

### Principle 1: Perceivable

✅ **1.1 Text Alternatives** - All images have alt text
✅ **1.3 Adaptable** - Semantic HTML, proper heading hierarchy
✅ **1.4.3 Contrast** (AA) - 4.5:1 text, 3:1 UI components
✅ **1.4.6 Contrast** (AAA) - 7:1 in high contrast mode
✅ **1.4.8 Visual Presentation** - User can control fonts (5 sizes)
✅ **1.4.11 Non-text Contrast** - 3:1 for UI components
✅ **1.4.12 Text Spacing** - No loss of content when spacing adjusted

### Principle 2: Operable

✅ **2.1.1 Keyboard** - All functionality keyboard accessible
✅ **2.1.2 No Keyboard Trap** - Can navigate away from all elements
✅ **2.4.1 Bypass Blocks** - Skip navigation links provided
✅ **2.4.3 Focus Order** - Logical tab order
✅ **2.4.7 Focus Visible** - Clear focus indicators
✅ **2.5.5 Target Size** - Clickable areas ≥44×44px

### Principle 3: Understandable

✅ **3.1.1 Language** - Page language declared (`lang="en"`)
✅ **3.2.3 Consistent Navigation** - Same navigation across pages
✅ **3.2.4 Consistent Identification** - Icons/buttons consistent
✅ **3.3.1 Error Identification** - Errors clearly described
✅ **3.3.2 Labels** - All form fields labeled

### Principle 4: Robust

✅ **4.1.2 Name, Role, Value** - All UI elements properly labeled
✅ **4.1.3 Status Messages** - Live regions for dynamic content

### Success Criteria Summary

| Level | Criteria Met | Criteria Total | Pass Rate |
|-------|--------------|----------------|-----------|
| **A** | 30/30 | 30 | 100% ✅ |
| **AA** | 20/20 | 20 | 100% ✅ |
| **AAA** | 28/28 | 28 | 100% ✅ (high contrast) |

---

## Best Practices

### For Developers

**Do:**
- ✅ Use semantic HTML (`<nav>`, `<main>`, `<button>`)
- ✅ Add `aria-label` to icon-only buttons
- ✅ Use `ScreenReaderOnly` for context
- ✅ Announce important changes with `LiveRegion`
- ✅ Test with keyboard only
- ✅ Test with screen reader
- ✅ Run Lighthouse regularly

**Don't:**
- ❌ Use `<div>` for clickable elements (use `<button>`)
- ❌ Remove focus outlines (we provide beautiful ones!)
- ❌ Use color alone to convey information
- ❌ Create keyboard traps
- ❌ Use `tabindex` > 0 (breaks logical order)
- ❌ Override user's motion preference

### For Designers

**Do:**
- ✅ Design with 7:1 contrast in mind
- ✅ Ensure 44×44px minimum touch targets
- ✅ Use icons + text labels (not icons alone)
- ✅ Provide visible focus states
- ✅ Test designs at different font scales

**Don't:**
- ❌ Rely on color alone (use icons, labels, patterns)
- ❌ Use low contrast text
- ❌ Make tiny clickable areas
- ❌ Hide important info in hover states
- ❌ Use animations for critical feedback

---

## Resources

### Internal

- **Typography Demo**: `/demos/typography`
- **Theme Selector**: Palette icon in navbar
- **Component Library**: `/src/components/accessibility/`

### External

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Tool](https://wave.webaim.org/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Screen Reader Testing

- **VoiceOver** (macOS/iOS): Built-in, Cmd+F5
- **NVDA** (Windows): Free, [nvaccess.org](https://www.nvaccess.org/)
- **JAWS** (Windows): Paid, industry standard
- **TalkBack** (Android): Built-in
- **Narrator** (Windows): Built-in, limited

---

## Support

### Questions?

- Check `/demos/typography` for live examples
- Review component source in `/src/components/accessibility/`
- Test with Lighthouse in Chrome DevTools
- Use axe DevTools browser extension

### Found an Issue?

If you discover an accessibility issue:

1. **Document it**: What's the issue? Where? How to reproduce?
2. **Test severity**: Does it block usage? Affects which users?
3. **Report it**: GitHub issue or internal tracker
4. **Fix it**: Update component, test, verify

### Continuous Improvement

Accessibility is an ongoing journey, not a destination. We:

- ✅ Test with real assistive technology
- ✅ Gather feedback from users with disabilities
- ✅ Run automated tests on every build
- ✅ Keep up with WCAG updates
- ✅ Prioritize accessibility in all features

---

**Built with ♿️ accessibility at the core.**

*Last updated: January 16, 2025*
