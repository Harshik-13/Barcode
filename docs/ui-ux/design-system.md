# Design System

---

## Typography Hierarchy

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 24px | Bold (700) | Screen titles |
| H2 | 20px | Semi-bold (600) | Section headers |
| H3 | 16px | Semi-bold (600) | Card titles, dialog headers |
| Body | 14px | Regular (400) | Primary reading text |
| Body Small | 12px | Regular (400) | Secondary text, metadata |
| Caption | 11px | Regular (400) | Timestamps, helper text |
| Label | 14px | Medium (500) | Form labels, nav items |
| Button | 14px | Medium (500) | Button text |
| Stat | 32px | Bold (700) | Dashboard numeric metrics |

**Line height:** 1.5x for body, 1.2x for headings
**Font family:** System font stack (Inter or system-ui)

---

## Spacing System

Base unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Tight spacing (icon gaps) |
| space-2 | 8px | Element padding (buttons) |
| space-3 | 12px | Related items (card content) |
| space-4 | 16px | Standard padding (card edges) |
| space-5 | 20px | Section spacing |
| space-6 | 24px | Card spacing between sections |
| space-8 | 32px | Screen edge padding |
| space-10 | 40px | Major sections |

**Rules:**
- Use spacing tokens, never arbitrary values
- Consistent spacing between form fields (16px)
- Consistent padding inside cards (16px)
- Consistent spacing between cards (12px)

---

## Grid System

| Breakpoint | Columns | Gutter | Margin | Target |
|------------|---------|--------|--------|--------|
| < 640px | 4 | 12px | 16px | Mobile |
| 640-1024px | 8 | 16px | 24px | Tablet |
| > 1024px | 12 | 20px | 32px | Desktop |

**Layout rules:**
- Content max-width: 1200px
- Centered layout with auto margins on desktop
- Full-width layout on mobile
- Dashboard widgets use 2-column grid on desktop, single on mobile

---

## Color Roles

| Role | Light Theme | Dark Theme (future) | Usage |
|------|-------------|---------------------|-------|
| Primary | Blue (#2563EB) | Blue (#3B82F6) | Primary buttons, links, active tabs |
| Surface | White (#FFFFFF) | Gray (#1F2937) | Cards, backgrounds |
| Background | Gray-50 (#F9FAFB) | Gray-900 (#111827) | Page background |
| Text Primary | Gray-900 (#111827) | Gray-50 (#F9FAFB) | Headings, body text |
| Text Secondary | Gray-500 (#6B7280) | Gray-400 (#9CA3AF) | Labels, metadata |
| Border | Gray-200 (#E5E7EB) | Gray-700 (#374151) | Card borders, dividers |
| Error | Red (#EF4444) | Red (#F87171) | Validation errors, destructive actions |
| Success | Green (#10B981) | Green (#34D399) | Success states |
| Warning | Orange (#F59E0B) | Orange (#FBBF24) | Warning messages |
| Info | Blue (#3B82F6) | Blue (#60A5FA) | Informational messages |

**Status colors:**
| Status | Color |
|--------|-------|
| ENROLLED / ACTIVE | Green |
| CREATED / AWAITING_SUMMARY | Blue |
| COMPLETED | Indigo |
| SUSPENDED / WARNING | Orange |
| DEPARTED / ARCHIVED | Gray |
| Error / Blocked | Red |

---

## Elevation

| Level | Shadow | Usage |
|-------|--------|-------|
| 0 | None | Page background |
| 1 | 0px 1px 3px rgba(0,0,0,0.1) | Cards in lists |
| 2 | 0px 4px 6px rgba(0,0,0,0.1) | Dialogs, dropdowns |
| 3 | 0px 10px 15px rgba(0,0,0,0.1) | Modals, toasts |

**Rules:**
- Cards use elevation-1 by default
- Dialogs and dropdowns use elevation-2
- Modals and toasts use elevation-3
- No shadows on flat surfaces (background, headers)

---

## Borders

| Token | Value | Usage |
|-------|-------|-------|
| border-radius-sm | 4px | Small elements (badges) |
| border-radius-md | 8px | Cards, inputs, buttons |
| border-radius-lg | 12px | Dialogs, modals |
| border-radius-full | 999px | Avatars, pills |

| Token | Value | Usage |
|-------|-------|-------|
| border-width | 1px | Card borders, input borders |
| border-width-active | 2px | Focused inputs |

**Rules:**
- Inputs have a 1px border in default state
- Inputs have a 2px primary-colored border in focus state
- Cards have a 1px border at bottom in list views

---

## Icons

| Category | Icon | Usage |
|----------|------|-------|
| Navigation | home, scanner, users, settings, logout | Tab and sidebar items |
| Actions | plus, edit, trash, search, filter, x | Action buttons |
| Status | check, x-circle, alert-triangle, info | Status indicators |
| Notifications | bell, bell-off, mail | Notification UI |
| Sessions | clock, calendar, play, stop-square | Session actions |
| Objects | camera, barcode, chart-bar, file-text | Feature indicators |

**Rules:**
- Use outlined icons for navigation and actions
- Use filled icons for active states
- Icons are 20x20px in navigation, 16x16px inline
- All icons must have accessible labels (aria-label)

---

## Motion Principles

| Principle | Application |
|-----------|-------------|
| Fast | UI transitions: 150-200ms |
| Responsive | Immediate feedback on tap (50ms press effect) |
| Subtle | No decorative animations |
| Purposeful | Animation only for state changes (loading, transitions) |
| Reduced motion | Respect prefers-reduced-motion media query |

**Transition defaults:**
- Fade in: 200ms ease
- Slide in: 250ms ease-out
- Scale (press): 100ms ease

---

## Consistency Rules

1. **One design language.** All screens use the same typography, spacing, color, and elevation tokens. No per-screen exceptions.
2. **Predictable layout.** Similar screens share similar layouts. List screens share the same structure, detail screens share the same structure.
3. **Consistent action placement.** Primary actions are always at the bottom-right or bottom-center. Back is always top-left.
4. **Consistent form patterns.** All forms use the same label position (top), error position (below input), and button placement (bottom).
5. **Status colors are global.** ENROLLED green on the student list is the same green as ACTIVE on a session card.
6. **No branding in V1.** No custom fonts, no brand illustrations, no logo animation. Use system fonts and simple SVG icons.
7. **Accessible by default.** All design decisions must pass WCAG 2.1 AA contrast requirements. No color-only information conveyance.
