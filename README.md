# Navalone

A free, open-source **responsive main-menu plugin** — desktop dropdowns, multi-level menus
and mega menus that collapse to a sliding mobile drawer. A free alternative to
[mmenu.js](https://mmenujs.com/).

> **Status:** active development. A single `items` config now drives a responsive desktop
> bar (dropdowns, large dropdowns, nested flyouts and mega menus) that collapses to an
> off-canvas mobile drawer with the sliding drill-down. See the roadmap below.

## Roadmap

- **Phase 0 — done:** mobile sliding drill-down menu (load-animation bug fixed).
- **Phase 1 — done:** configurable vanilla `Navalone` plugin (options API, methods, events,
  accessibility) with a data contract ready for desktop metadata.
- **Phase 2 — done:** responsive desktop bar (logo / center menu / right buttons) with
  dropdown, dropdown-lg, multi-level flyout and mega-menu rendering (thumbnails,
  descriptions, badges), plus a true off-canvas drawer below the breakpoint.
- **Phase 3 — done:** TypeScript core extracted into a pnpm monorepo (`packages/core`),
  built with tsup to ESM + CJS + a minified IIFE/UMD + `.d.ts`, with the CSS shipped
  alongside. The plain-JS prototype is gone; vanilla `<script>` usage is unchanged.
- **Phase 4 — done:** thin React / Vue / Angular wrappers (`@navalone/{react,vue,angular}`),
  a documentation site with live editable examples + a theming playground (`apps/docs`), and
  an Astro + GSAP landing page (`apps/site`). All consume the local `packages/core` — no
  behaviour is duplicated.

## Install

Navalone is dependency-free. Authored in TypeScript, shipped as compiled JS + CSS + types —
**no build step is required to consume it.**

```sh
npm install navalone   # or pnpm add navalone / yarn add navalone
```

…or use it straight from a CDN with no build step at all:

```html
<link rel="stylesheet" href="https://unpkg.com/navalone/dist/navalone.css">
<script src="https://unpkg.com/navalone/dist/navalone.global.js"></script>
```

### Usage — bundler / npm

```js
import { Navalone } from "navalone";
import "navalone/css"; // or "navalone/navalone.css", or copy dist/navalone.css yourself

const menu = new Navalone("#mm", {
    logo: { text: "Navalone", href: "/" },
    rightButtons: [
        { label: "Log in", href: "/login" },
        { label: "Sign up", href: "/signup", variant: "primary" }
    ],
    items: [ /* see the data contract below */ ],
    theme: { "--nv-bar-bg": "#fff", "--nv-action-primary-bg": "#3a7afe" }
});
```

The package ships ESM (`dist/index.mjs`), CJS (`dist/index.cjs`), full `.d.ts` types and a
minified IIFE (`dist/navalone.global.js`). The `exports` map routes bundlers/Node to the
right format automatically; `"navalone"` exports both a named `Navalone` and a default
export. Importing the package never touches `window`, so it is **SSR-safe**. The CSS is a
plain stylesheet (`style`/`exports["./css"]`) — it is never forced through a bundler, so
vanilla users can link it directly. The package marks CSS as side-effectful for correct
tree-shaking.

### Usage — build-free `<script>` / Jekyll / any SSG

```html
<link rel="stylesheet" href="navalone.css">

<menu class="mm" id="mm"></menu>

<script src="navalone.global.js"></script>
<script>
    const menu = new Navalone("#mm", { logo: "Navalone", items: [ /* ... */ ] });
</script>
```

The IIFE bundle assigns `window.Navalone`, with no auto-running side effects.
`new Navalone(target, options)` accepts a CSS selector string or an element. A runnable demo
lives in [`packages/core/example/index.html`](packages/core/example/index.html).

Above the `breakpoint` it renders a horizontal desktop bar; below it, the bar collapses to
a hamburger that opens an off-canvas drawer containing the sliding drill-down. **Both views
are driven by the same `items` data** — there is no markup or config duplication.

### The desktop bar

The bar has three regions: `[logo] [center menu] [right buttons]`.

```js
new Navalone("#mm", {
    logo: { text: "Navalone", href: "/" },   // or { img: "logo.svg", alt: "Navalone", href: "/" }
    menuAlign: "center",                       // "left" | "center" | "right"
    rightButtons: [                            // CTAs on the right (at every screen size)
        { label: "Log in",  href: "/login" },
        { label: "Sign up", href: "/signup", variant: "primary", icon: "→" }
    ],
    items: [ /* the center menu — same items used by the mobile drawer */ ]
});
```

Each submenu's `display` hint chooses the desktop presentation:

| `display`       | Desktop rendering                                                          |
| --------------- | -------------------------------------------------------------------------- |
| `"dropdown"`    | Simple vertical list panel anchored under its trigger.                     |
| `"dropdown-lg"` | Wider panel that surfaces each item's `image`/`icon`, `description`, `badge`. |
| `"mega"`        | Wide, multi-column panel built from `columns: [{ heading, items }]`.       |
| *(nested)*      | Any item with its own `submenu` opens as a side **flyout** (arbitrary depth). |

Panels are **edge-aware**: top-level panels clamp horizontally to stay within the viewport,
and flyouts flip to the other side / shift up when they would overflow.

`rightButtons` fields: `label`, `href` (renders a link), `icon`, `variant` (`"primary"` for a
filled CTA), `linkTarget`. Set `showRightButtons: false` to hide the region entirely. By
default the buttons stay on the right of the bar at every screen size; set
`rightButtonsFooter: true` to collapse them into the drawer footer on medium/small screens.

### The data contract

The same contract powers both authoring styles and is **forward-compatible with the
upcoming desktop bar**: items carry desktop-only metadata (thumbnails, descriptions,
badges, submenu display modes, mega-menu columns) that the mobile renderer uses where it
makes sense and otherwise ignores gracefully.

**1. Config-driven items array** — the plugin renders the panels for you:

```js
new Navalone("#mm", {
    items: [
        {
            label: "Add-ons and themes",
            image: "addons.png",            // thumbnail shown in the row
            imageAlt: "Add-ons",
            description: "Extensions & themes", // desktop metadata (rendered on mobile too)
            badge: "New",
            submenu: {
                id: "addons-menu",
                display: "mega",            // "dropdown" | "dropdown-lg" | "mega" (desktop hint)
                columns: [                  // mega columns flatten to a drill-down on mobile
                    { heading: "Extensions", items: [ { label: "Ad Blocker" } ] },
                    { heading: "Themes",     items: [ { label: "Dark Night" } ] }
                ]
            }
        },
        { label: "History", icon: "🕘", submenu: { id: "history-menu", items: [ /* ... */ ] } },
        { label: "Passwords", href: "#passwords" },
        { label: "Sync (signed out)", disabled: true }
    ]
});
```

Item fields:

| Field         | Type            | Notes                                                            |
| ------------- | --------------- | ---------------------------------------------------------------- |
| `label`       | string          | Row text (required).                                             |
| `href`        | string          | Renders the row as a link (when it has no submenu/target).       |
| `linkTarget`  | string          | `target` attribute for link rows (e.g. `"_blank"`).              |
| `target`      | string          | Id of an existing panel to drill into.                           |
| `submenu`     | object          | Nested panel — see below. Auto-generates an id if omitted.       |
| `icon`        | string          | Glyph/emoji shown when there is no `image`.                      |
| `image`       | string          | Thumbnail URL shown in the row (mobile, when `showThumbnails`).  |
| `imageAlt`    | string          | Alt text for the thumbnail.                                      |
| `description` | string          | Secondary line (desktop metadata, also rendered on mobile).      |
| `badge`       | string          | Small pill, e.g. a count or `"New"`.                             |
| `disabled`    | boolean         | Non-interactive, dimmed.                                         |

Submenu fields: `id`, `title`, `display` (`"dropdown" | "dropdown-lg" | "mega"`, a desktop
hint), and either `items` (array) or `columns` (array of `{ heading, items }` for mega
menus, which flatten into a single drill-down panel with group headings on mobile).

**2. Declarative markup** — author the panels by hand; the existing attribute names keep
working and the new optional `data-*` fields are picked up automatically:

```html
<menu class="mm" id="mm">
    <div class="menu-level level-1" id="main-menu">
        <ul>
            <!-- existing contract still works -->
            <li><button class="menu-item" data-target="history-menu">History →</button></li>
            <!-- new optional metadata -->
            <li>
                <button class="menu-item" data-target="addons-menu" data-submenu="mega"
                        data-image="addons.png" data-description="Extensions & themes"
                        data-badge="New">Add-ons and themes</button>
            </li>
        </ul>
    </div>
    <div class="menu-level level-2" id="history-menu">
        <div class="menu-header">
            <button class="back-button">← Back</button>
            <span class="menu-title"></span>
        </div>
        <ul>
            <li class="nv-group">Recent</li> <!-- mega column heading, flattened -->
            <li><button>Search history</button></li>
        </ul>
    </div>
</menu>
```

Recognised attributes/classes: `.menu-level`, `.menu-item`, `.back-button`, `data-target`,
and the new `data-submenu`, `data-columns`, `data-image`, `data-image-alt`, `data-icon`,
`data-description`, `data-badge`, plus `.nv-group` for column headings. A `[data-nv-logo]`
element (text or an `<img>`, optionally an `<a href>`) becomes the logo, and any links/buttons
inside a `[data-nv-actions]` container (with optional `data-variant`) become the right
buttons. Both are parsed into the same model that drives the desktop bar and mobile drawer.

### Options

| Option              | Default     | Description                                                                 |
| ------------------- | ----------- | --------------------------------------------------------------------------- |
| `width`             | `"320px"`   | Menu width. Number → px. Sets the `--nv-width` custom property.             |
| `animationDuration` | `300`       | Number → ms. Wired to CSS via `--nv-duration` (not duplicated in rules).    |
| `theme`             | `null`      | Map of CSS custom properties applied to the root, e.g. `{ "--nv-header-bg": "#222" }`. |
| `items`             | `null`      | Config-driven items array. When omitted, existing declarative markup is used. |
| `rootId`            | `null`      | Id for the generated top-level panel (config mode).                         |
| `title`             | `true`      | Sub-panel title behavior: `true` derives it from the triggering item, `false` keeps the static title, or pass a function `({ label, panelId, trigger }) => string`. |
| `showThumbnails`    | `true`      | Render an item's `image` thumbnail in its row on mobile.                    |
| `breakpoint`        | `960`       | px. At/below this width the bar collapses to the hamburger + off-canvas drawer (via `matchMedia`). |
| `menuAlign`         | `"center"`  | Desktop center-menu alignment: `"left"`, `"center"` or `"right"`.          |
| `openOn`            | `"hover"`   | Desktop submenu trigger: `"hover"` (click also works) or `"click"`.        |
| `drawerSide`        | `"left"`    | Side the mobile drawer slides in from: `"left"` or `"right"`.              |
| `mobileMenu`        | `"drilldown"` | How submenus behave in the mobile drawer: `"drilldown"` (tap slides to a new panel, with a back button) or `"accordion"` (tap expands the submenu inline on the same screen). |
| `logo`              | `null`      | `string`, or `{ text \| img, alt, href }`.                                 |
| `rightButtons`      | `null`      | Array of `{ label, href, icon, variant, linkTarget }` CTAs.                |
| `showRightButtons`  | `true`      | Toggle the right CTA region (bar + drawer footer).                         |
| `rightButtonsFooter`| `false`     | `false` keeps the right buttons on the bar at every size; `true` collapses them into the drawer footer on medium/small screens. |
| `drawerLabel`       | `"Menu"`    | `aria-label` for the drawer dialog.                                        |
| `onNavigate`        | `null`      | Callback `(detail) => void` when drilling into a mobile panel.             |
| `onBack`            | `null`      | Callback `(detail) => void` when going back.                               |
| `onOpen` / `onClose`| `null`      | Callbacks when the drawer opens / closes.                                  |
| `onSubmenuOpen` / `onSubmenuClose` | `null` | Callbacks when a desktop submenu opens / closes.                  |

All visual theming is driven by CSS custom properties on the root element — colors, sizes,
radius, shadow, fonts and durations. Override them via the `theme` option or in your own
CSS. See the `:root` block in [`packages/core/src/navalone.css`](packages/core/src/navalone.css)
for the full list: mobile (`--nv-header-bg`,
`--nv-badge-bg`, `--nv-thumb-size`, …), desktop bar (`--nv-bar-bg`, `--nv-bar-height`,
`--nv-hover-bg`, …), panels (`--nv-panel-shadow`, `--nv-dropdown-width`, `--nv-mega-col-width`,
…), CTAs (`--nv-action-primary-bg`, …) and drawer (`--nv-backdrop-bg`, `--nv-drawer-head-bg`, …).

### Methods

| Method               | Description                                                          |
| -------------------- | -------------------------------------------------------------------- |
| `open()`             | Open the off-canvas drawer (animated) and reset to the top-level panel. |
| `close()`            | Close the drawer.                                                    |
| `toggle()`           | Open or close the drawer.                                            |
| `navigateTo(id)`     | Drill into the mobile panel with the given id.                       |
| `back()`             | Return to the previous mobile panel.                                 |
| `openSubmenu(id)`    | Open a desktop submenu by its `submenu.id`.                          |
| `closeSubmenu(id)`   | Close a desktop submenu (and any descendants) by its `submenu.id`.   |
| `closeAll()`         | Close all open desktop submenus.                                     |
| `destroy()`          | Remove all listeners (including the `matchMedia` listener) and revert the DOM, inline styles and classes for both views. |

### Events

Alongside the callbacks, Navalone dispatches bubbling DOM `CustomEvent`s on the root element:

| Event                  | Callback         | `detail`                       |
| ---------------------- | ---------------- | ------------------------------ |
| `navalone:navigate`    | `onNavigate`     | `{ from, to, trigger }`        |
| `navalone:back`        | `onBack`         | `{ from, to }`                 |
| `navalone:open`        | `onOpen`         | `{}` (drawer opened)           |
| `navalone:close`       | `onClose`        | `{}` (drawer closed)           |
| `navalone:submenuopen` | `onSubmenuOpen`  | `{ id, trigger, panel }`       |
| `navalone:submenuclose`| `onSubmenuClose` | `{ id, panel }`                |

```js
document.querySelector("#mm").addEventListener("navalone:submenuopen", (e) => {
    console.log("opened", e.detail.id);
});
```

### Responsive behavior

A `matchMedia('(max-width: <breakpoint>px)')` query switches between the two views and is
cleaned up by `destroy()`. Growing back to desktop collapses any open drawer; shrinking to
mobile re-measures the drill-down height without animating from a stale value.

The mobile drawer is a true off-canvas panel: it slides in from `drawerSide`, dims the page
with a backdrop, locks body scroll, traps focus while open, and closes on the backdrop, the
close button or **Escape** (returning focus to the hamburger).

Inside the drawer, `mobileMenu` chooses how submenus open. The default `"drilldown"` is the
app-style sliding drill-down (tap a row to slide to the next panel, with a back button).
`"accordion"` instead expands each submenu **inline on the same screen** — tapping a row
reveals its children below it (and nested submenus open as nested accordions); there is no
sliding and no back button. Both modes are driven by the same `items` model.

### Accessibility & keyboard

- **Mobile drill-down:** panels use `role="menu"` / items `role="menuitem"`; inactive panels
  are `aria-hidden` and `inert`. Enter/Space activate, **Escape** goes back (or closes the
  drawer at the top level), **Up/Down** move focus within the active panel. Focus moves into a
  panel on entry and back to the triggering item on return.
- **Desktop bar:** `role="menubar"` with `role="menuitem"` triggers (`aria-haspopup` /
  `aria-expanded`) and `role="menu"` panels. **Left/Right** move along the bar; **Down** /
  **Enter** / **Space** open a submenu and move focus into it; **Up/Down** move within a panel;
  **Right** opens a nested flyout; **Left** / **Escape** close back up and return focus to the
  trigger. Submenus also open on hover (or click, per `openOn`) and close on outside-click,
  blur and Escape.
- **Drawer:** `role="dialog"` + `aria-modal`, focus trapped while open, hamburger exposes
  `aria-expanded`.

## Framework wrappers

Thin adapters over the same core — each instantiates `Navalone` on mount and calls
`destroy()` on unmount, with **no behaviour re-implemented**. They are **SSR-safe** (the core
is never touched at import time) and **tree-shakeable**; the framework and `navalone` are
`peerDependencies`. Option, method and event types are re-exported from the core, so the
wrapper shapes always track the core's `.d.ts`.

### React — [`@navalone/react`](packages/react)

```tsx
import { useRef } from "react";
import { Navalone, type NavaloneHandle } from "@navalone/react";
import "navalone/css";

const menu = useRef<NavaloneHandle>(null);
<Navalone ref={menu} items={items} logo="Acme" onSubmenuOpen={(d) => console.log(d.id)} />;
// menu.current?.openSubmenu("products")  ·  open/close/toggle/navigateTo/back/closeAll/destroy
```

### Vue 3 — [`@navalone/vue`](packages/vue)

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Navalone } from "@navalone/vue";
import "navalone/css";
const menu = ref();
</script>

<template>
    <Navalone ref="menu" :items="items" logo="Acme" @submenuopen="(d) => console.log(d.id)" />
</template>
```

Props mirror the options; events are emitted (`navigate`, `back`, `open`, `close`,
`submenuopen`, `submenuclose`); methods are `expose`d via the template ref.

### Angular — [`@navalone/angular`](packages/angular)

```ts
import { NavaloneComponent } from "@navalone/angular";

@Component({
    standalone: true,
    imports: [NavaloneComponent],
    template: `<navalone-menu [items]="items" logo="Acme"
        (submenuopen)="onOpen($event)"></navalone-menu>`
})
export class HeaderComponent {}
```

`@Input()`s mirror the options; `@Output()`s surface the events; the drawer/back methods are
`openDrawer`/`closeDrawer`/`goBack` (to avoid clashing with the `open`/`close`/`back` outputs).

## Apps

- **[`apps/docs`](apps/docs)** — a static Vite SPA: getting started, full API reference, and
  **live, editable** examples of every submenu type plus a **theming playground** that mutates
  `--nv-*` tokens on a live instance. `pnpm dev:docs` / `pnpm --filter @navalone/docs build`.
- **[`apps/site`](apps/site)** — an awwwards-style **Astro + GSAP** landing page with a live
  interactive hero menu, feature highlights (free vs. mmenu.js), code snippets and CTAs.
  `pnpm dev:site` / `pnpm --filter @navalone/site build`.

Each package and app builds, tests and deploys independently.

## Monorepo & development

This repo is a **pnpm workspace**.

```
.
├── packages/
│   ├── core/              # the "navalone" package (TypeScript source → built dist/)
│   │   ├── src/           # navalone.ts · desktop.ts · drawer.ts · model.ts ·
│   │   │                  #   render.ts · a11y.ts · dom.ts · types.ts · navalone.css
│   │   ├── example/       # build-free demo consuming dist/
│   │   └── test/          # Vitest unit/behaviour/keyboard + test/e2e headless-Chrome
│   ├── react/             # @navalone/react  (tsup → ESM/CJS + d.ts, peerDeps react)
│   ├── vue/               # @navalone/vue    (tsup → ESM/CJS + d.ts, peerDeps vue)
│   └── angular/           # @navalone/angular (ng-packagr, peerDeps @angular/*)
├── apps/
│   ├── docs/              # Vite SPA — API reference, live examples, theming playground
│   └── site/              # Astro + GSAP landing page
├── scripts/verify-phase4.mjs  # headless-Chrome verification of the built apps/examples
├── index.html             # repo-root demo, also consumes packages/core/dist/
└── tsconfig.base.json · eslint.config.js · .prettierrc.json
```

Scripts (run from the repo root):

| Command                  | What it does                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| `pnpm install`           | Install workspace dependencies.                                     |
| `pnpm build`             | Build every package and app (topological order).                    |
| `pnpm build:packages`    | Build just `packages/*` (core + wrappers).                          |
| `pnpm build:apps`        | Build just `apps/*` (docs + site).                                  |
| `pnpm dev`               | Rebuild the core on change (tsup watch).                            |
| `pnpm dev:docs` / `dev:site` | Run the docs / landing-page dev servers.                       |
| `pnpm test`              | Run the Vitest suites across the workspace.                         |
| `pnpm test:e2e`          | Drive the installed headless Chrome against the built core `dist/`.² |
| `pnpm example:react` / `:vue` / `:angular` | Run a wrapper's usage example (Vite dev). |
| `pnpm lint` / `format`   | ESLint / Prettier (4-space JS/TS, tab CSS).                         |

> ¹ TypeScript is **authoring-only** — vanilla consumers get compiled JS + CSS + `.d.ts`.
> ² `test:e2e` needs Chrome; override its path with `CHROME_PATH`. After `pnpm build`, the
>   root `index.html` and `packages/core/example/index.html` work from `file://`.
> `node scripts/verify-phase4.mjs` rebuilds-independent: it serves the built apps/examples and
> drives headless Chrome (via the DevTools Protocol) to confirm each renders + screenshots them.

The build is done with [tsup](https://tsup.egoist.dev/) (esbuild + `rollup-plugin-dts`),
chosen over Vite lib mode for its first-class multi-format output (ESM + CJS + IIFE) and
bundled `.d.ts` generation from a single config, with no app/dev-server scaffolding.

## Background

Read **[this article](https://www.linkedin.com/pulse/mobile-app-look-alike-menu-sliding-submenu-easier-than-tanim-mahbub-xcudc/)**
for the original write-up of the sliding-submenu approach.
