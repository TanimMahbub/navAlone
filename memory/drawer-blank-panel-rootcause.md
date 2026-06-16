---
name: drawer-blank-panel-rootcause
description: The REAL cause of Navalone's "second level slides in empty" mobile drawer bug — focus-triggered horizontal scroll, not DOM/data
metadata:
  type: project
---

The long-standing "mobile drill-down second level is empty / slides into nothing
(just header + footer)" bug in Navalone was **NOT** a DOM, data, or transform-logic
problem — which is why every prior attempt that verified DOM presence ("activeRows:2",
items present, visibility:visible, opacity:1) wrongly declared it fixed.

**Real root cause (found 2026-06-16, verified via CDP at 420px in real Chrome):**
`navigateTo` → `focusPanel(target)` calls `.focus()` on a row inside the *incoming*
panel while that panel is still transformed off-screen at `translateX(+100%)`. The
browser auto-scrolls the nearest scroll container (`.nv-panels`, which has
`overflow-x:hidden` + `overflow-y:auto`) horizontally to bring the focused row into
view. `overflow-x:hidden` clips the scrollbar but does **not** prevent programmatic
scroll. The container ends up with `scrollLeft = 320` (one panel width); the active
panel then has `transform: translateX(0)` yet `getBoundingClientRect().left === -320`
— shoved a full width off-screen left, so the body looks blank while the DOM is perfect.

**Fix (two parts, both in packages/core/src):**
1. `a11y.ts` `focusPanel`: focus with `{ preventScroll: true }` (both the preferred
   and first-row branches) — the slide is purely transform-driven, focus must never
   move the container.
2. `drawer.ts` `setActive`: defensively reset `nv._panelHost.scrollLeft = 0` and
   `scrollTop = 0` on every activation (fresh panel starts at its top; a stray
   horizontal scroll can never blank the panel again).

**Diagnostic that nails it:** in the drilled state, compare the active panel's computed
`transform` (identity) against its `getBoundingClientRect().left` and the host's
`scrollLeft`. If `scrollLeft !== 0`, this bug is back. Verified fix: `host.scrollLeft:0`,
panel paints (repro script `scripts/repro-drawer.mjs`, shot `repro-drawer-level2.png`).
All 38 core unit tests still pass. See [[navalone-project]], [[verify-in-browser-headless-chrome]].
