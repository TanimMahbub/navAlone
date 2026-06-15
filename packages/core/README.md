# navalone

A free, open-source **responsive main-menu plugin** — desktop dropdowns, multi-level menus
and mega menus that collapse to a sliding mobile drawer. A free alternative to
[mmenu.js](https://mmenujs.com/). One `items` model drives both a desktop bar and an
off-canvas mobile drawer; dependency-free, SSR-safe, fully themeable via `--nv-*` tokens.

## Install

```sh
npm install navalone
```

```js
import { Navalone } from "navalone";
import "navalone/css";

const menu = new Navalone("#mm", {
    logo: { text: "Navalone", href: "/" },
    items: [
        { label: "Company", submenu: { id: "company", display: "dropdown", items: [
            { label: "About", href: "/about" }
        ] } },
        { label: "Pricing", href: "/pricing" }
    ]
});
```

### Build-free `<script>` / CDN

```html
<link rel="stylesheet" href="https://unpkg.com/navalone/dist/navalone.css">
<script src="https://unpkg.com/navalone/dist/navalone.global.js"></script>
<script>
    const menu = new Navalone("#mm", { logo: "Navalone", items: [ /* ... */ ] });
</script>
```

The IIFE bundle assigns `window.Navalone`.

## Builds

| Field                 | File                          |
| --------------------- | ----------------------------- |
| `import` (ESM)        | `dist/index.mjs`              |
| `require` (CJS)       | `dist/index.cjs`              |
| `types`               | `dist/index.d.ts`             |
| `unpkg` / `jsdelivr`  | `dist/navalone.global.js`     |
| `style` / `./css`     | `dist/navalone.css`           |

Full API reference (options, methods, events, data contract, theming, accessibility) is in
the [repository README](https://github.com/tanim/navalone#readme).

MIT © Tanim Mahbub
