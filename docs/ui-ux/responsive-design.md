# Responsive Design

---

## Breakpoint Definitions

| Breakpoint | Width | Target Device | Layout |
|------------|-------|---------------|--------|
| Mobile | < 640px | Phones | Single column, bottom tabs |
| Tablet | 640px - 1024px | Tablets, small laptops | 2-column grid, bottom tabs |
| Desktop | > 1024px | Laptops, desktops | Multi-column, sidebar nav |
| Large | > 1440px | Wide monitors | Max-width 1200px centered |

---

## Layout Adaptation

### Navigation

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Top bar | Screen title + back + actions | Same | Same |
| Sidebar | Hidden (drawer menu) | Hidden (drawer menu) | Always visible |
| Bottom tab bar | Visible (4-5 tabs) | Visible (4-5 tabs) | Hidden |
| Breadcrumbs | Hidden | Hidden | Visible |

### Content

| Screen | Mobile | Tablet | Desktop |
|--------|--------|--------|---------|
| Dashboard | Single column stack | 2-column grid | 3-column grid (stat cards row) |
| Lists | Full-width cards | 2 cards per row | Full-width table |
| Detail | Full-width sections | Full-width sections | Side info panel |
| Forms | Full-width inputs | Narrow centered | Narrow centered (max 600px) |
| Scanner | Full-screen camera | Framed camera (70%) | Framed camera (50%) |
| Reports | Stacked metrics | 2-column metrics | 3-column metrics |

---

## Screen-Specific Behavior

### S1: Login
- Mobile: Full-screen form, no decoration
- Tablet: Centered card (400px max-width)
- Desktop: Centered card (400px max-width), centered vertically

### S3: Student Dashboard
- Mobile: Stacks vertically: active session → notifications → recent sessions
- Tablet: 2-column: left (active session + notifications), right (recent sessions)
- Desktop: 3-column: left (active session), center (recent sessions), right (notifications)

### S10: Faculty Dashboard
- Mobile: Stacks: occupancy bar → action buttons → recent scans
- Tablet: 2-row: stats row → 2-column (actions + scans)
- Desktop: 3-column: occupancy → actions → recent scans

### S11: Scanner
- Mobile: Camera takes full width above fold; mode toggle and format toggle below
- Tablet: Camera 70% width, centered; entry/exit mode and QR/Barcode format toggles below
- Desktop: Camera 50% width, centered; all controls to right side
- **QR Code mode:** Viewfinder shows a square scanning area (centered)
- **Barcode mode:** Viewfinder shows a horizontal rectangular scanning area (wider, shorter)
- Orientation: Landscape recommended for barcode scanning; portrait acceptable for QR codes

### S13: Manual Exit
- Mobile: Full-width single column form
- Tablet: Centered form card (500px max)
- Desktop: Centered form card (500px max)

### S17-S19: User Management
- Mobile: Card-based list (each user is a card)
- Tablet: Card list, 2 per row
- Desktop: Table view with rows and columns

### S21: Session Management
- Mobile: Card-based list with essential info
- Tablet: Compact card list with more columns
- Desktop: Full table with sortable columns

### S23: Activity Log
- Mobile: Truncated log entries (show only essential fields)
- Tablet: Compact entries with most fields
- Desktop: Full table with all columns

---

## PWA-Specific Responsive Behavior

### Install Prompt (S27)
- Mobile: Full-width banner at bottom of screen (drawer-style)
- Tablet: Inline banner within the navigation header (compact)
- Desktop: Inline banner in the sidebar header (compact, dismissible)
- The install prompt respects the device's display mode (standalone vs. browser)

### Service Worker / Offline
- Mobile: Offline fallback page uses minimal layout (centered message, retry button)
- Desktop: Same layout as mobile — no additional decorations
- Cached static assets load from service worker cache regardless of layout

### Bottom Navigation Tabs
- Mobile: 4 tabs (Dashboard, Scanner, Students, More with Reports/Profile)
- The active tab is visually highlighted
- Tabs shrink to icon-only at 360px width or narrower

---

## Orientation Changes

- **Mobile:** Application supports portrait and landscape. Scanner mode switches to landscape-optimized layout (camera takes top portion, controls in bottom panel). Barcode mode is optimized for landscape.
- **Tablet:** No layout change between orientations — use the same grid structure.
- **Orientation lock:** Scanner screen may prompt landscape orientation for better barcode scanning experience.

---

## Minimum Supported Screen Size

**320px × 568px** (iPhone SE / small Android)

At this size:
- Navigation is fully functional (bottom tabs scale down to icons only)
- Buttons remain tappable (minimum 44px height)
- Forms are scrollable within viewport
- Scanner viewfinder still fits within viewport (QR: centered square; Barcode: full-width strip)
- Text is not truncated due to layout constraints
- PWA install banner remains within viewport (bottom drawer style)
- Bottom tabs collapse to icon-only labels

---

## Responsive Rules

1. **Content priority on mobile.** Show the most important content first (active session, occupancy count). Secondary content scrolls below.
2. **No horizontal scroll.** Content must fit within viewport width. Horizontal scroll is only acceptable on data tables, which scroll the table body within a fixed container.
3. **Touch targets.** All interactive elements must be at least 44×44px on mobile (per WCAG).
4. **Forms adapt.** Form inputs are full-width on mobile, max-width 500px on desktop. Labels remain above inputs (not side-by-side).
5. **Images and icons scale.** The scanner viewfinder (QR or Barcode) scales proportionally with viewport. QR viewfinder is square; Barcode viewfinder is a horizontal strip.
6. **Progressive enhancement.** Desktop layout is the primary design. Mobile and tablet are adaptations, not separate designs.
7. **Testing breakpoints.** All breakpoints must be tested at the boundary (e.g., test at 639px and 641px).
8. **PWA display modes.** Test in both browser tab and standalone (installed) display modes. Standalone mode hides browser chrome — ensure navigation is self-contained.
