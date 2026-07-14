<div align="center">

# Navalone

**A free, open-source responsive main-menu plugin.**

Desktop dropdowns, multi-level flyouts and mega menus that collapse into a
sliding mobile drawer — a free alternative to [mmenu.js](https://mmenujs.com/).

[**Website**](https://navalone.tanimmahbub.com) ·
[**Documentation**](https://navalone.tanimmahbub.com/docs/) ·
[**Studio**](https://navalone.tanimmahbub.com/studio/)

</div>

---

## Quick start

```sh
npm install navalone
```

```js
import { Navalone } from "navalone";
import "navalone/css";

new Navalone("#mm", {
    logo: "Navalone",
    items: [ /* your menu */ ]
});
```

Or drop it in with no build step:

```html
<link rel="stylesheet" href="https://unpkg.com/navalone/dist/navalone.css">
<script src="https://unpkg.com/navalone/dist/navalone.global.js"></script>
```

Full options, events, data contract and live editable examples are in the
[documentation](https://navalone.tanimmahbub.com/docs/).

## Highlights

- **One config, every screen** — a single `items` array drives the desktop bar and the off-canvas mobile drawer.
- **Dependency-free** — TypeScript core shipped as ESM, CJS and a minified IIFE, with types and plain CSS. SSR-safe.
- **Framework wrappers** — thin `@navalone/react`, `@navalone/vue` and `@navalone/angular` bindings over the same core.
- **Design it visually** — build and theme your menu in the [Studio](https://navalone.tanimmahbub.com/studio/), then export the config.

## License

[MIT](https://opensource.org/licenses/MIT) © Tanim Mahbub
