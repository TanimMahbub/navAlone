---
name: navalone-project
description: What the mobileAppLike_menu project is becoming — name, goals, architecture, and phased roadmap
metadata:
  type: project
---

The repo at `f:\WORK\JS\mobileAppLike_menu` is being built into **Navalone** — a free,
open-source responsive main-menu plugin, positioned as an alternative to the paid mmenu.js
(https://mmenujs.com/). Name chosen 2026-06-15 (nav + Avalon); npm `navalone` is available,
`.com` taken, `.dev`/`.io`/`.app` likely free (`.dev` or `.io` preferred).

**Product vision:** a responsive menu system with a desktop bar `[logo] [center menu] [right
buttons]` that collapses to an off-canvas mobile drawer containing a sliding drill-down
submenu. Options to exclude the right side, put the menu on the right, configurable
collapse breakpoint, theming, drawer side, etc. "Most user/developer-friendly" is the goal.

**Desktop submenu modes (added 2026-06-15):** desktop must support multiple submenu
presentations — simple dropdown (small and large variants), multi-level/nested dropdowns,
and mega menus with columns. Items can carry thumbnails/images, descriptions, and badges,
which render in desktop dropdowns/mega menus. The SAME item data collapses to the mobile
drill-down (image optionally shown as a row thumbnail; mega-menu columns flatten to
panels). Implication: the data/markup contract must carry image/description/group/column
and a per-submenu display-mode hint from the start, even though Phase 1 only renders mobile.

**Confirmed architecture decisions:**
- Vanilla **TypeScript** core (framework-agnostic), shipped as compiled JS + CSS + `.d.ts`
  so plain-HTML/Jekyll/SSG consumers use it via `<script>` with no build step. TS is
  authoring-only; invisible to vanilla consumers.
- Thin React / Vue / Angular wrappers call into the core (no logic duplication).
- **Monorepo**: `packages/core`, `packages/{react,vue,angular}`, `apps/docs`,
  `apps/site` (awwwards-style landing page, likely Astro/Next + GSAP). Docs/site import
  the local core package; each app deploys independently. Not separate repos.
- Tooling deferred: stay plain JS/CSS through Phases 1–2 so `index.html` runs build-free;
  introduce TS + bundler (tsup/Vite) when extracting `packages/core` in Phase 3.

**Roadmap:** Phase 0 = fix mobile load-animation bug (DONE 2026-06-15). Phase 1 =
refactor prototype into a configurable vanilla **`Navalone`** plugin (options API, methods,
events, a11y) — still plain JS — DONE 2026-06-15. Phase 2 = responsive desktop bar +
dropdown/dropdown-lg/nested-flyout/mega rendering + off-canvas drawer — DONE 2026-06-15.
Phase 3 = monorepo + TS + build — DONE 2026-06-16. Phase 4 = framework wrappers, docs,
landing page.

**Branding done (2026-06-15):** project files renamed to Navalone — `package.json` created
(name "navalone", MIT, keywords), `README.md` rewritten with roadmap, `index.html`
title/meta updated. NOT done (manual, owner-only): rename the folder `mobileAppLike_menu`
on disk and the GitHub remote repo name. OG image URLs still point to the old
`mobileapplike-menu.onrender.com` deployment.

**Current code (after Phase 2):** `app.js` exposes a `Navalone` class (UMD: `window.Navalone`
+ `module.exports`, no auto-run). `new Navalone(el|selector, options)`. It is now
**model-driven**: builds ONE normalised `items` model (from `options.items` OR by parsing
declarative `.menu-level`/`.menu-item`/`data-target` markup, plus `[data-nv-logo]` /
`[data-nv-actions]`) and renders BOTH a desktop bar and a mobile off-canvas drawer from it —
no duplication. Component DOM built into the root: `.nv-bar` (`.nv-hamburger` + `.nv-logo` +
`.nv-menubar role=menubar` + `.nv-actions`), `.nv-backdrop`, and `.nv-drawer` (role=dialog,
aria-modal; contains drawer head with logo+close, the `.nv-panels` drill-down host, and a
drawer-footer `.nv-actions--drawer`). The Phase-1 sliding drill-down now lives inside
`.nv-panels` (which carries `--mmHeight`/height animation/`.no-transition`), NOT the root.
Desktop submenu `display` → `nv-dropdown` | `nv-dropdown-lg` | `nv-mega` (columns) panels;
any item with its own `submenu` builds a `.nv-flyout` side panel (arbitrary depth). Desktop
panels are edge-aware (top-level clamp X via JS in `_positionPanel`; flyouts add `.nv-flip-x`
/ shift `top`). Desktop open/close tracked in `this._openPanels` with trigger↔panel refs
(`_nvPanel`/`_nvTrigger`/`_nvParentPanel`); `this._desktopPanels` maps `submenu.id`→panel for
`openSubmenu(id)`. `matchMedia('(max-width:breakpoint)')` switches modes (classes
`nv-mode-desktop`/`nv-mode-mobile`), listener removed in destroy. Options added: `breakpoint`
(960), `menuAlign`, `openOn` (hover|click), `drawerSide`, `logo`, `rightButtons`,
`showRightButtons`, `drawerLabel`, `onOpen/onClose/onSubmenuOpen/onSubmenuClose` (Phase-1
options all preserved). Methods added: `toggle`, `openSubmenu/closeSubmenu/closeAll`
(`open/close` now drive the drawer; `navigateTo/back/destroy` preserved). Events added:
`navalone:open/close/submenuopen/submenuclose` (+ navigate/back). `app.css` fully `--nv-*`
tokenized (added bar/panel/action/drawer tokens). **Gotcha fixed:** the visibility
transition on `.nv-panel`/`.menu-level` made computed `visibility` stay `hidden`
synchronously after adding `is-open`/`active-menu`, so programmatic focus into a just-opened
panel failed — fixed with the classic `transition: visibility 0s linear <dur>` (instant on
open, delayed on close). Verified 81 headless-Chrome assertions + desktop/mobile screenshots.
Load-animation fix preserved exactly (now on `.nv-panels`). See
[[verify-in-browser-headless-chrome]].

**After Phase 3 (2026-06-16):** the plain-JS prototype is GONE — root `app.js`/`app.css`
deleted; the canonical source is now TypeScript in `packages/core/src/`. Repo is a **pnpm
workspace** (`pnpm-workspace.yaml`: `packages/*`, `apps/*`; root `package.json` private,
`packageManager: pnpm@9.15.9`). pnpm is NOT globally installed on this machine — use
`COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm@9 <cmd>`, or install shims without admin via
`corepack enable --install-directory <userdir> pnpm`. `packages/core` is the publishable
`navalone` package. **TS split (single class, identical public API, zero behaviour change):**
`navalone.ts` (the class: state + constructor + `_init`/`_build`/`_applyOptions`/`_emit` +
event handlers as arrow fields + public methods that delegate), and concern modules of
free functions taking the instance as first arg — `desktop.ts`, `drawer.ts`, `model.ts`,
`render.ts` (shared `fillRow`/`buildLogo`/`buildActions`), `a11y.ts` (pure focus/key
helpers), `dom.ts` (`uid`/`toCssLength`/`durationMs`/`escapeId`), `types.ts` (all public
types + `declare global` HTMLElement `_nvPanel/_nvTrigger/_nvParentPanel` augmentation).
Modules `import type { Navalone }` (type-only, no runtime cycle); instance fields are public
underscore-named (not TS-`private`) so modules can touch them. `navalone.css` is the CSS
copied byte-for-byte from the old `app.css`. **Build = tsup** (`tsup.config.ts`, two configs):
ESM `dist/index.mjs` + CJS `dist/index.cjs` + `dist/index.d.ts`/`.d.cts`, and a minified
IIFE `dist/navalone.global.js` (entry `src/global.ts` assigns `window.Navalone`); CSS copied
to `dist/` by `scripts/copy-css.mjs` (build = `tsup && node scripts/copy-css.mjs`). package
`exports` map + `main`/`module`/`types`/`unpkg`/`jsdelivr`/`style`/`sideEffects`/`files`;
`"navalone"` exports named `Navalone` + default. Root `index.html` and
`packages/core/example/index.html` consume `dist/` build-free. **Tests:** Vitest (jsdom,
`test/setup.ts` polyfills rAF + a controllable `matchMedia`) — 38 assertions across
model/render/behavior/keyboard; plus `test/e2e/run-browser.mjs` driving the installed Chrome
against the BUILT `dist` — 13 assertions incl. edge-clamp + the visibility-gotcha focus check
+ desktop/mobile screenshots. `pnpm test` = vitest; `pnpm test:e2e` = the Chrome harness.
ESLint flat config + Prettier (4-space JS/TS, tab CSS) tuned to existing style; `tsc --noEmit`
strict passes. Still manual/owner-only: on-disk folder rename, GitHub remote, OG image URLs.
