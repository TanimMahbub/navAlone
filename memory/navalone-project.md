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
landing page — DONE 2026-06-16.

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

**After Phase 4 (2026-06-16):** built the ecosystem on top of `packages/core` with NO logic
duplication — wrappers/apps all consume the local `navalone` workspace package; behaviour lives
only in the core. **Confirmed with owner before scaffolding:** React 19 + Vue 3.5 + Angular 19;
docs = custom Vite SPA; landing site = Astro + GSAP. **Thin framework wrappers** (each: own
`package.json` with framework + `navalone` as peerDeps, types RE-EXPORTED from core so shapes
track the `.d.ts`, SSR-safe, tree-shakeable, example + Vitest tests):
- `@navalone/react` (`packages/react`, tsup→ESM/CJS+d.ts): `forwardRef` component, props =
  `NavaloneOptions` + className/style/id, imperative `NavaloneHandle` ref (open/close/toggle/
  navigateTo/back/openSubmenu/closeSubmenu/closeAll/destroy/instance). Instance built in an
  effect keyed on `JSON.stringify(options)` (drops fn callbacks → callback-identity changes
  don't rebuild); stable wrapper callbacks read latest handler from a ref. 5 tests.
- `@navalone/vue` (`packages/vue`, tsup): render-function `defineComponent` (no SFC compiler
  needed for the lib build); props mirror data options via `PropType<...>` from core, events
  re-emitted (navigate/back/open/close/submenuopen/submenuclose), methods `expose`d; rebuilds
  on a `JSON.stringify` watch. 4 tests.
- `@navalone/angular` (`packages/angular`, **ng-packagr** → FESM+types): standalone component
  `<navalone-menu>`, `@Input()`s mirror options, `@Output()`s for events; drawer/back methods
  named `openDrawer`/`closeDrawer`/`goBack` to avoid clashing with `open`/`close`/`back`
  outputs; builds in `ngAfterViewInit`. **type:"module"** so the ESM-only Analog vitest config
  loads. Tests via Vitest + `@analogjs/vite-plugin-angular` + TestBed (needs `@angular/build`
  for the plugin's `/private` entry, and a `tsconfig.spec.json`/`example/tsconfig.app.json`
  passed via `angular({ tsconfig })`). 4 tests. **Gotcha:** the lightweight Analog Vite plugin
  only compiles Angular in serve/test mode — a bare `vite build` of the example emits an empty
  bundle, so the Angular example is dev-server-only (no `example:build`).
**Root pnpm override `typescript: 5.8.3`** — Angular 19.2 compiler/ng-packagr peer is TS <5.9,
but `^5.7.2` was hoisting to 5.9.x. **Apps:** `apps/docs` (Vite SPA importing core: getting
started, API ref, live EDITABLE examples per submenu type via a JSON textarea that
re-instantiates, + a theming playground mutating `--nv-*` on a live instance) and `apps/site`
(Astro 5 + GSAP awwwards landing: live hero menu island, free-vs-mmenu.js comparison, code
snippets, CTAs; GSAP intro + ScrollTrigger reveals, both gated on prefers-reduced-motion).
Root scripts wired: build/build:packages/build:apps/test (all topological via `pnpm -r`),
dev:docs/dev:site, example:react/vue/angular. **Verification gotcha (important):** Chrome
`--headless --dump-dom` + `--virtual-time-budget` HANGS over `http://` (never sees a live
origin's network as idle) though it works over `file://` — so `scripts/verify-phase4.mjs`
drives Chrome via the **DevTools Protocol** instead (Node 24 global fetch+WebSocket; launch
with `--remote-debugging-port`, /json/list → page ws, navigate, wait, read DOM +
`Page.captureScreenshot`, taskkill /T). Also: Vite dev binds `localhost`=IPv6 on Windows, set
`server.host:"127.0.0.1"` for the Angular example. **Verified:** all 6 projects build clean
from install; 51 unit tests pass (core 38 / react 5 / vue 4 / angular 4); core e2e 13/13 real
Chrome; verify-phase4 confirms React/Vue/docs/site render in real Chrome + screenshots, and
the Angular example verified via its dev server (mounts the core `.nv-bar`). Wrapper behaviour
(render / submenu-open / drawer-open / events-fire / destroy-on-unmount) covered by the
per-wrapper tests on the real wrapper code. See [[verify-in-browser-headless-chrome]].

**Phase 5 — owner-driven landing-page fixes (2026-06-16, all verified in real Chrome via CDP):**
The owner had been testing **the landing site (`pnpm dev:site`)** the whole time (not
index.html/docs), which reframed every complaint as an `apps/site` issue.
- **THE drawer bug finally root-caused & fixed** — see [[drawer-blank-panel-rootcause]]
  (focus-triggered horizontal scroll on `.nv-panels`, NOT DOM/data). Fix in core
  `a11y.ts` (focus `{preventScroll:true}`) + `drawer.ts` `setActive` (reset
  `scrollLeft/scrollTop=0`). Applies to ALL surfaces (all consume core `dist`).
- **Hero redesigned**: removed the "two menus stacked" mess (a desktop browser frame +
  a phone iframe). Now ONE Tailwind-style **resizable preview**: `Hero.astro` has a frame
  with a right-edge drag handle + Desktop/Tablet/Mobile presets + live px readout, hosting
  a new page `apps/site/src/pages/demo/responsive.astro` (one Navalone, `breakpoint:820`,
  `width:"86%"`) that collapses desktop→mobile live as the frame resizes. (`demo/phone.astro`
  now unused but left in place.)
- **Code blocks → Atom Material**: site `CodeShowcase.astro` Shiki theme night-owl →
  `material-theme-palenight` (card bg `#292d3e`).
- **Emoji→SVG everywhere**: apps were already SVG; swapped the remaining emoji thumbnails
  in root `index.html` to an inline Feather-style icon set.
- **Docs merged into the site at `/docs` (ONE server)** — owner chose "merge into Astro".
  Ported the docs modules into `apps/site/src/docs/` (content/live-example/playground/data/
  code/icons/main/styles) + a standalone `apps/site/src/pages/docs/index.astro` (`#app` +
  client `import "../../docs/main.ts"`). Docs code highlighting switched from hljs
  atom-one-dark to a custom `apps/site/src/styles/hljs-material.css` (palenight) to match.
  `highlight.js` added to site deps. `pnpm dev:site` now serves `/` AND `/docs`. The
  standalone `apps/docs` app still exists (not yet deleted — duplicate source of truth;
  safe to remove later once references in root scripts + verify-phase4 are updated).
  Verified: site builds 4 routes; `/docs` renders 6 live menus + 7 material-highlighted
  blocks; responsive demo collapses + drill-down paints (`scrollLeft:0`); 51 tests pass.
  Repro/verify scripts: `scripts/repro-drawer.mjs`, `verify-responsive.mjs`, `shot-site.mjs`,
  `shot-docs.mjs`.

**Landing-demo fix (2026-06-16):** owner reported "multi-level menu not working when it
collapses." Reproduced in real Chrome (drill via clicks AND programmatic navigateTo, 4 levels
deep) — the **core drill-down is NOT broken**. Root cause was the **`apps/site` hero demo**:
it ran ONE desktop-width Navalone with an "open the mobile drawer" button calling `menu.open()`,
but `.nv-mode-desktop .nv-drawer { display:none }` means the drawer never shows above the
breakpoint — so on a desktop screen the collapsed/multi-level experience was simply invisible
(looked "broken" + "no height to check responsive"). Fix: a NEW standalone page
`apps/site/src/pages/demo/phone.astro` mounts the core menu with `breakpoint: 99999` (forces
mobile mode) + `width:"100%"`, auto-`open()`s the drawer, and re-opens on `navalone:close` so
it's never empty; `transform: translateZ(0)` on its `<html>/<body>` makes the
`position:fixed` drawer/backdrop a contained block. `Hero.astro` now embeds it via an
`<iframe src="/demo/phone/">` inside a CSS phone mockup, beside the live desktop browser frame
— "one model, two presentations" shown live, and the multi-level drawer is genuinely
interactive on the page. Also: **code snippets now syntax-highlighted** via Astro's built-in
Shiki `<Code lang theme="night-owl">` (was a flat single-colour `<pre>`); `CodeShowcase.astro`
cards got editor chrome (traffic-light dots + filename + lang). Removed the dead
`#hero-open-drawer` button/handler. **Screenshot gotcha:** the site's GSAP intro/ScrollTrigger
leave `.hero-el`/`.reveal` at opacity:0 in headless capture — screenshot with Chrome
`--force-prefers-reduced-motion` (the JS skips GSAP under reduced-motion, leaving natural
opacity). `--headless=new --screenshot` captures only the viewport from the top (hash-scroll
doesn't take); for lower sections make the window tall enough to capture the full page, then
crop. See [[verify-in-browser-headless-chrome]].

**Landing-demo fix round 2 (2026-06-16) — the REAL drawer bug + docs polish:** owner still saw
the collapsed multi-level menu "slide into nothing — just header and footer" when narrowing the
browser. Definitively reproduced by driving real Chrome over the **DevTools Protocol** (Node 24
global fetch+WebSocket; `Emulation.setDeviceMetricsOverride` to actually resize desktop→mobile,
then click hamburger + a `.menu-item[data-target]`). Probe returned `activeRows:2` (DOM fine)
but `stageTransform:"matrix(1,0,0,1,0,0)"` and **`drawerTop:630`** instead of 0. Root cause:
**GSAP's intro leaves an inline `transform` on `.hero-stage`** (it's both `.hero-el` and the
scale-`from` target), and a transformed ancestor becomes the containing block for
`position:fixed`, so the `#hero-menu` drawer was positioned/clipped relative to the small stage
(~630px down, off-screen) — the drill panels slid in correctly but rendered outside the
viewport. Fix: add **`clearProps`** to the Hero GSAP tweens (`clearProps:"transform,opacity"` on
the `.hero-el` tween, `clearProps:"transform"` on the `.hero-stage` scale) so no transform
lingers; CDP re-probe confirmed `stageTransform:"none"`, `drawerTop:0`, full-height drawer.
**Lesson:** never leave a GSAP/CSS transform on any ancestor of a Navalone root that can open
its `position:fixed` drawer. **Docs polish (`apps/docs`, a Vite SPA — no Astro `<Code>`):** added
`highlight.js` (registered subset typescript/xml/bash + `atom-one-dark` theme) — new
`src/code.ts` `enhanceCodeBlocks()` highlights every static `<pre><code>` and wraps it with a
hover copy-to-clipboard button; called once from `main.ts` after render. New `src/icons.ts` =
a Feather/Lucide-style inline-SVG icon set (`svgIcon` for UI markup, `thumbIcon` for coloured-
tile menu-thumbnail data-URIs); replaced ALL emoji/glyph thumbnails in `src/data.ts`
(⚙📚🎓✍💬📈 → settings/book/award/edit/message/trending) and the `Run ▶` button glyph in
`live-example.ts` with an SVG `play` icon. Same emoji→SVG swap done in the site hero menu data
(`apps/site/src/data/menu.ts` + new `apps/site/src/data/icons.ts`: ✦⚙</>✎🚀🏢 →
zap/settings/code/edit/rocket/building). Verified icons render via a standalone HTML grid
screenshot, copy buttons (7) + highlighting via CDP. See [[verify-in-browser-headless-chrome]].

**Positioning + GSAP-removal pass (2026-06-17, owner-driven):** TWO standing decisions that
change future copy/build work on `apps/site` (landing + the merged `/docs`):
- **GSAP is GONE from the site/docs** (the plugin never used it). `apps/site` `Hero.astro`
  intro → vanilla **Web Animations API** stagger; `index.astro` `.reveal` scroll-reveal →
  vanilla **IntersectionObserver**. Hidden start-states are gated behind a `.reveal-ready`
  class added synchronously in `Layout.astro` `<head>` (motion-allowed only) so no-JS /
  reduced-motion show everything — and the old "GSAP leaves transform on `.hero-stage`"
  containing-block bug can't recur. `gsap` dep removed from `apps/site/package.json`.
- **DROP the mmenu.js framing entirely** — owner wants NO mention of mmenu.js anywhere in
  the landing/docs copy. New positioning is built on the NAME: "Nav" + "Alone" = **one nav,
  alone, is enough for every screen** — no separate desktop vs mobile nav, no hand-rolling
  dropdown/multi-level/mega-menu logic. The Features comparison table was reframed from
  "Navalone vs mmenu.js" to **"Doing it by hand" vs "With Navalone"**. (Note: root
  `package.json` + READMEs still say "alternative to mmenu.js" — those are plugin/repo
  metadata, left untouched this pass; revisit if owner wants them scrubbed too.)
- **Bar positioning option (`position`, added 2026-06-17, owner-driven):** new core option
`position: "fixed" | "sticky" | "smart" | "static"`, **default `"fixed"`** (changed the bar
from the old in-flow default — pins to the top of the page from the start). `"sticky"` =
`position:sticky;top:0` (starts in flow, e.g. below a top header strip, pins when scrolled
to); `"smart"` = sticky + auto-hide (scroll down hides, scroll up reveals); `"static"` =
old in-flow, never pinned. Applied as a `nv-pos-<value>` class on the root in `_applyOptions`.
**Two non-obvious gotchas:** (1) positioning is applied to the ROOT but the smart auto-hide
`transform: translateY(-100%)` is on the **`.nv-bar`** (a sibling of the drawer), never the
root — a transformed root becomes the containing block for the `position:fixed` drawer/backdrop
and breaks them (same class of bug as [[drawer-blank-panel-rootcause]]). (2) smart watches the
nearest scroll parent (`findScrollParent` in `dom.ts`, falls back to `window`); rAF-throttled,
guarded so it never hides while the drawer is open. React inherits `position` via
`extends NavaloneOptions`; Vue/Angular wrappers had to list it explicitly (they enumerate props
— and still omit `mobileMenu`/`rightButtonsFooter`, a pre-existing gap). Docs (apps/site
`/docs` only — the owner uses that, apps/docs is the deprecated dup): added 3 positioning live
examples (fixed/sticky/smart) + grouped the Options table AND the live examples by category
(Content/Layout & positioning/Behaviour/Appearance/Callbacks). The shared preview iframe
`demo/preview.astro` reads `config.position` and swaps in a tall faux page (so there's room to
scroll) + a faux top header for sticky/smart; **it must use `overflow-x: clip` (not `hidden`)
in positioning mode** — `hidden` forces overflow-y to auto and makes the body its own scroll
container, which breaks `position:sticky`. apps/docs `.preview-surface` got a defensive
`contain: layout` so the now-fixed-by-default inline previews don't escape their card. Verified
all 3 modes in real Chrome via `scripts/verify-positioning.mjs` (CDP, scroll the iframe, assert
barTop/nv-hidden) — 10/10 checks; 64 unit tests pass (core 51, +4 positioning).

**Responsive mode option (`responsive`, added 2026-06-18, owner-driven):** new core
option `responsive: "dynamic" | "static"`, **default `"dynamic"`** (changed the collapse
mechanism from the old breakpoint-only one). Fixes "Live Example previews don't collapse even
when the center menu overlaps the logo/right buttons" — the old default was matchMedia at a
fixed `breakpoint`, so a content-heavy bar at a width above the breakpoint overlapped without
folding. **Dynamic** = content-aware via `ResizeObserver` on `.nv-bar`: measures the menu's
intrinsic width (sum of `.nv-menubar` children `getBoundingClientRect().width` + inter-item
gaps — independent of the squeezed track since items `white-space:nowrap`) and compares to
`barWidth - _chrome` where `_chrome = bar.clientWidth - menubar.clientWidth` (logo + buttons +
bar gaps/padding, stable across condense). Three states picked from cached naturals
(`_natFull`/`_natCond`/`_chrome`, refreshed each desktop pass; cache lets it decide even while
mobile, where the menubar is `display:none` and unmeasurable): full → **condensed**
(`nv-condensed` class tightens ONLY the menubar — `--nv-condensed-item-font-size`/`-bar-item-padding`/`-bar-gap`/`-bar-item-gap`, logo/buttons untouched so `_chrome` stays constant)
→ **mobile** (collapse to drawer). No flapping since thresholds are cached constants, not
state-dependent. **Static** = the old matchMedia path, now also supporting an optional
`condenseBreakpoint` (px, above `breakpoint`) for a condense step. Refactor: the old
`_onModeChange` body became `_setMode(mode)` (shared by both paths; drops condense + remeasures
drawer on the way to mobile, collapses open drawer on the way to desktop); `_initStatic`/
`_applyStatic` + `_initDynamic`/`_applyDynamic`/`_measureNaturals`/`_menuNeed`/`_setCondensed`
are the new methods; `destroy()` disconnects the RO. **Gotchas:** (1) with `position:"fixed"`
(default) the bar spans the viewport, so dynamic measures against the viewport (correct) — to
test against a *container* width use `position:"static"`. (2) jsdom has no layout/RO: test
setup gained a no-op `ResizeObserver` stub and a width-aware `matchMedia` mock
(`setWidth(px)` + `setViewport(bool)`, parses `max-width`); `sampleOptions()` now forces
`responsive:"static"` so the matchMedia-based mode tests stay deterministic, dynamic logic is
unit-tested by stubbing `clientWidth`/naturals (`test/dynamic.test.ts`, +6 → core 57). (3) the
docs preview iframe is narrow (~591px) and shows a vertical scrollbar that shaves ~20px off
`clientWidth`, folding ~20px earlier than a clean page — the "Responsive collapsing" demo
configs (`apps/site/src/docs/data.ts` `responsiveDynamicConfig`/`responsiveStaticConfig`) use 3
short items + 1 button and static `breakpoint:400`/`condenseBreakpoint:540` so all three steps
show within the preview range. Wrappers: React inherits via `extends NavaloneOptions`;
Vue/Angular got explicit `responsive`+`condenseBreakpoint` props/inputs. Docs (apps/site
`/docs`): options table rows + a new "Responsive collapsing" example category (dynamic +
static). The hero `demo/responsive.astro` dropped its explicit `breakpoint:820` to showcase the
dynamic default. apps/docs (deprecated dup) left untouched. Verified in real Chrome:
`scripts/verify-dynamic-responsive.mjs` (sweep a container full→condensed→collapsed) +
`scripts/verify-docs-responsive.mjs` (both docs examples step correctly); positioning +
live-examples + responsive-hero verifiers still pass (live-examples assertion updated — the
content-heavy drawer example now correctly collapses at the narrow Desktop preset).

**Theme = Material Dark, accent teal `#80cbc4`.** Stray indigo/blue (`#6366f1`, `#3a7afe`,
  `rgba(99,102,241,…)`) were replaced with teal: hero preset buttons, the hero preview
  box-shadow (now dark `rgba(8,12,14,.75)`), and the `demo/responsive.astro` chrome + its
  Navalone `theme` tokens (`--nv-action-primary-bg`/`focus-color`/`badge-bg`). Docs live
  EXAMPLES were deliberately left on their default light palette (owner's call). Body/muted
  text + table cells brightened (`--text` #c4dae3, `--muted` #93acb8) for more "shine".
