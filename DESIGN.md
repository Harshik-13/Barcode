---
name: 8Hour Workspace
description: Workspace attendance and work-session tracking for a college startup incubator
colors:
  primary: "#2563eb"
  primary-dark: "#1d4ed8"
  surface: "#ffffff"
  background: "#f9fafb"
  text-primary: "#111827"
  text-secondary: "#6b7280"
  border: "#e5e7eb"
  error: "#ef4444"
  success: "#10b981"
  warning: "#f59e0b"
  awaiting-summary: "#f97316"
  archived: "#9ca3af"
  hover-tint: "#eff6ff"
  unread-border: "#bfdbfe"
  alert-error-bg: "#fef2f2"
  alert-error-border: "#fecaca"
  alert-error-text: "#dc2626"
  pending-bg: "#fffbeb"
  pending-border: "#fde68a"
  pending-text: "#92400e"
  row-divider: "#f3f4f6"
  badge-bg: "#f3f4f6"
typography:
  display:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
  xxxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
    typography: "{typography.body}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "20px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "6px"
    padding: "6px 14px"
    typography: "{typography.label}"
  nav-link-active:
    backgroundColor: "{colors.hover-tint}"
    textColor: "{colors.primary}"
---

# Design System: 8Hour Workspace

## Overview

**Creative North Star: "The Studio Logbook"**

The interface is a studio's daily logbook: every arrival, departure, and work session is a written record that must be legible at a glance and trusted without question. Surfaces are flat and factual — white cards on a quiet gray workbench, separated by hairline borders rather than shadows. The system is **crisp and confident**: type is dense and precise, tables carry the detail work, and one blue action ("Decision Blue") appears only where a decision is being made. Nothing is decorative; everything in the visual field is either the record, a status, or an action.

The design language is deliberately utilitarian in the way a well-kept logbook is: uniform, consistent, and calm, so that faculty scanning at the door and students checking their day both read the same record the same way. Components are **sturdy and unambiguous** — borders are never shy, states never subtle to the point of ambiguity, and the active state of any control is always visually decided.

**Key Characteristics:**
- Flat surfaces with 1px hairline borders; shadows reserved for truly raised things (dialogs, overlays)
- One blue accent used for actions and active states only
- Dense, precise tables as the primary information surface
- Status communicated by tinted chips (10% tint background + full-strength text color)
- System UI font stack; hierarchy by weight and size, not novelty

## Colors

Decision Blue anchors a palette that is otherwise monochromatic neutral — a restrained, workmanlike character with colored status signals.

### Primary
- **Decision Blue** (#2563eb): The action color. Primary buttons, active nav links, links, focus outlines. Used sparingly: if a screen shows more blue than white, the composition is wrong.
- **Decision Blue Dark** (#1d4ed8): Primary button hover state and pressed emphasis.

### Neutral
- **Workbench Gray** (#f9fafb): Page background — the neutral work surface everything sits on.
- **Sheet White** (#ffffff): Card, header, and input surfaces.
- **Logbook Ink** (#111827): Primary text — titles and strong values.
- **Logbook Gray** (#6b7280): Secondary text, table headers, inactive nav, icons.
- **Hairline Gray** (#e5e7eb): Borders — cards, inputs, header underline, outline buttons, table header rule.
- **Row Divider** (#f3f4f6): Inner table row separators.
- **Badge Gray** (#f3f4f6): Role badges and passive tags.

### Status
- **Live Green** (#10b981): Active sessions, success.
- **Pending Amber** (#f59e0b): Created/awaiting states that need attention.
- **Summary Orange** (#f97316): Awaiting-summary sessions, streak accents.
- **Done Gray** (#6b7280): Completed sessions.
- **Archived Ash** (#9ca3af): Archived sessions, empty-placeholder text.
- **Error Red** (#ef4444): Errors, destructive attention, unread badges. Paired with `alert-error-bg` (#fef2f2) and `alert-error-border` (#fecaca) in alert boxes; text at full strength (#dc2626).
- **Pending Wash** (#fffbeb) / **Pending Border** (#fde68a) / **Pending Ink** (#92400e): The pending-summary callout card.

### Named Rules
**The Decision Blue Rule.** Blue is for decisions only — buttons, links, and the active nav state. Status, data, and structure are never rendered in blue. Its rarity is what makes a screen scannable.

**The One-Tint Chip Rule.** Status chips use the status color at 10% tint (e.g. `#10b98120`) as background with the full-strength color as text. Never invert, never use gradient chips.

## Typography

**Display Font:** system-ui, -apple-system, sans-serif
**Body Font:** same system stack — one family, differentiated by weight, size, and color.
**Label/Mono Font:** none; timestamps and durations use the same stack.

**Character:** A precise, neutral technical voice. The stack is the platform's own UI type — nothing exotic, nothing decorative. Hierarchy is communicated through weight and color (Logbook Ink vs. Logbook Gray) more than size.

### Hierarchy
- **Display** (700, 24px, 1.3): Page titles — the login heading "8Hour Workspace", top-level screen titles.
- **Title** (600, 18px, 1.3): Card headings — "Current Session", "Pending Summaries", section titles in cards.
- **Body** (400, 14px, 1.5): Default form and table text; on mobile, body base is 15px with inputs forced to 16px to prevent iOS zoom.
- **Label** (500, 13px, 1.4): Form field labels, table headers, status chips, small buttons. Table headers additionally render in Logbook Gray.
- **Header brand** (700, 15px): The "8Hour" wordmark in the top bar.

### Named Rules
**The Weight-Over-Size Rule.** Within cards, hierarchy changes via font weight and color first (600 vs 400, Ink vs Gray); font size stays within the 13–18px band. Only page-level titles jump to 24px.

## Layout

The layout is a dense operational grid built for rapid scanning. Content sits in a flexible main area padded at 24px (12px on mobile). Cards are full-width blocks stacked vertically, or arranged in auto-fill grids (`minmax(150px, 1fr)` for stat cards, `minmax(320px, 1fr)` for dashboard panels). Two-column arrangements use a 2fr/1fr split for primary/auxiliary content, collapsing to a single column under 769px.

Data lives in horizontally scrollable tables (`.resp-table-wrap`) that preserve their column structure on mobile. Breakpoints: **480px** (small mobile), **768px** (mobile: hamburger nav, stacked layouts, 44px touch targets), **1024px** (tablet grid compaction). Spacing rhythm follows the 4px scale (4/8/12/16/20/24/32) and tightens one notch on mobile (24→16, 20→14).

## Elevation & Depth

The system is **flat by doctrine**. Depth is conveyed by tonal layering — white sheets on Workbench Gray with hairline borders between them — not by shadows. A single faint ambient shadow (`0 1px 3px rgba(0,0,0,0.1)`) appears on the centered login card; it is the only shadow in the system. Modals, dialogs, and the mobile nav overlay assert their elevation through a scrim (`rgba(0,0,0,0.3)`) plus full-surface fill, not drop shadows.

### Named Rules
**The Hairline Over Shadow Rule.** Separation is achieved with 1px borders (`#e5e7eb`) and tonal contrast. When in doubt, add a hairline — do not add a shadow.

## Shapes

The form language is small-radius and functional. Corners are modest: 4px for buttons, inputs, chips, and badges; 8px for cards and the login sheet; 6px for nav links; 12px reserved for large containers. The only fully round shape is the unread-count badge (999px pill). Inputs and buttons are square-shouldered — the silhouette reads "tool", not "toy".

## Components

### Buttons
- **Shape:** Gently squared (4px radius), no shadow.
- **Primary:** Decision Blue background, white text, padding 10px 16px (full-width in forms), weight 500, 14px.
- **Hover / Focus:** Hover deepens to Decision Blue Dark (#1d4ed8); focus shows a 2px Decision Blue outline with 2px offset; disabled drops opacity to 0.7.
- **Outline:** Sheet White background, 1px Hairline Gray border, padding 6px 12px — the quiet counterpart for "View All", pagination, and dismiss actions.

### Chips
- **Style:** Status chips use the One-Tint Chip Rule — 10% tint background, full-strength colored text, 4px radius, 12–13px weight 500, padding 2px 8px. The role badge in the header is Badge Gray (#f3f4f6) with Logbook Gray text.
- **State:** Chips are informational; they never toggle.

### Cards / Containers
- **Corner Style:** 8px radius.
- **Background:** Sheet White on Workbench Gray.
- **Shadow Strategy:** None at rest (Hairline Over Shadow Rule); the login card alone carries the ambient shadow.
- **Border:** 1px Hairline Gray.
- **Internal Padding:** 20px; section cards stack with a 20px gutter (12px on mobile).

### Inputs / Fields
- **Style:** Sheet White background, 1px Hairline Gray border, 4px radius, padding 8px 12px, 14px type.
- **Focus:** 2px Decision Blue outline, 2px offset (global rule for inputs and buttons).
- **Error / Disabled:** Error swaps the border to Error Red with an inline 12px message; labels sit above fields at 14px weight 500. Touch targets on mobile are ≥44px.

### Navigation
- **Style:** A 56px Sheet White top bar with a 1px Hairline Gray underline. Links are 14px weight 500 in Logbook Gray, padded 6px 14px, radius 6px.
- **States:** Active = Hover Tint background (#eff6ff) + Decision Blue text; hover = background shift. On mobile the links collapse into a full-screen white sheet with hamburger toggle, a 0.3-alpha scrim, and 44px touch rows.

### Status Callouts
- **Error alert:** `alert-error-bg` (#fef2f2) fill, `alert-error-border` (#fecaca) 1px border, `alert-error-text` (#dc2626) 14px text, 4px radius, padding 12px.
- **Pending summary card:** `pending-bg` (#fffbeb) fill with `pending-border` (#fde68a) 1px border and `pending-text` (#92400e) guidance copy — amber signals "your attention is required" while blue never does.

### Tables
- **Style:** The workhorse. 14px cells (13px in compact views), header row in Logbook Gray at weight 500, 1px Hairline Gray rule under headers, Row Divider (#f3f4f6) between rows, 8px 12px cell padding. Status renders as a One-Tint chip in a dedicated column. Clickable rows hint with a secondary "View" affordance in Decision Blue.

## Do's and Don'ts

### Do:
- **Do** keep blue for decisions: one primary action per view, active nav state, links, focus rings.
- **Do** use the One-Tint Chip Rule for every status — tinted background, full-strength text.
- **Do** separate surfaces with 1px hairlines before considering shadows.
- **Do** keep table density: 13–14px type, 8px 12px cells, horizontal scroll on mobile rather than squished columns.
- **Do** keep card title hierarchy at 18px/600 with body text at 14px.

### Don't:
- **Don't** add gradients, drop shadows to cards, or decorative color blocks — the system is flat and tonal.
- **Don't** render status or data in Decision Blue; blue communicates action, never state.
- **Don't** use radius above 8px for controls and cards (12px only for large containers).
- **Don't** introduce a second typeface or decorative font; hierarchy is weight-and-color driven.
- **Don't** exceed one unread/badge accent (Error Red pill) plus one status chip family per card — the logbook stays quiet so it stays legible.
