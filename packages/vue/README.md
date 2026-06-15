# @navalone/vue

Vue 3 wrapper for [Navalone](https://www.npmjs.com/package/navalone) — a free,
open-source responsive main-menu plugin (a free alternative to mmenu.js).

A **thin adapter** over the framework-agnostic core: it mounts the core on mount
and calls `destroy()` on unmount. No menu behaviour is re-implemented — props
mirror the core's options, the core's events are re-emitted, and the public
methods are `expose`d.

- **SSR-safe** — the core is only instantiated inside `onMounted` (client-only).
- **Tree-shakeable** — `vue` and `navalone` are peerDependencies.

## Install

```bash
npm install @navalone/vue navalone
# peerDep: vue
```

## Usage

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Navalone } from "@navalone/vue";
import "navalone/css";

const menu = ref<InstanceType<typeof Navalone> | null>(null);

const items = [
    { label: "Pricing", href: "/pricing" },
    {
        label: "Products",
        submenu: { id: "p", display: "dropdown", items: [{ label: "Analytics", href: "/a" }] }
    }
];
</script>

<template>
    <Navalone
        ref="menu"
        :items="items"
        :logo="{ text: 'Acme', href: '/' }"
        @submenuopen="(d) => console.log('opened', d.id)"
    />
    <button @click="menu?.openSubmenu('p')">Open</button>
</template>
```

### Props

Data options mirror [`NavaloneOptions`](https://www.npmjs.com/package/navalone):
`items`, `logo`, `right-buttons`, `show-right-buttons`, `width`,
`animation-duration`, `theme`, `root-id`, `title`, `show-thumbnails`,
`breakpoint`, `menu-align`, `open-on`, `drawer-side`, `drawer-label`. Types are
pulled from the core via `PropType`, so they always match its `.d.ts`.

### Events

The core's events are re-emitted (drop the `navalone:` prefix):
`navigate` · `back` · `open` · `close` · `submenuopen` · `submenuclose`.

### Exposed methods

Via a template `ref`: `open` · `close` · `toggle` · `navigateTo` · `back` ·
`openSubmenu` · `closeSubmenu` · `closeAll` · `destroy` · `instance`.

## Example

```bash
pnpm --filter @navalone/vue example
```

## License

MIT
