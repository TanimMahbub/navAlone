# @navalone/react

React wrapper for [Navalone](https://www.npmjs.com/package/navalone) — a free,
open-source responsive main-menu plugin (a free alternative to mmenu.js).

This is a **thin adapter** over the framework-agnostic core: it mounts the core
on mount and calls `destroy()` on unmount. No menu behaviour is re-implemented —
all options, methods and events come straight from `navalone`.

- **SSR-safe** — the core is never instantiated at import time (only inside an
  effect), and importing the package never touches `window`.
- **Tree-shakeable** — `react`, `react-dom` and `navalone` are peerDependencies.

## Install

```bash
npm install @navalone/react navalone
# peerDeps: react, react-dom
```

## Usage

```tsx
import { useRef } from "react";
import { Navalone, type NavaloneHandle } from "@navalone/react";
import "navalone/css";

export function Header() {
    const menu = useRef<NavaloneHandle>(null);

    return (
        <Navalone
            ref={menu}
            logo={{ text: "Acme", href: "/" }}
            items={[
                {
                    label: "Products",
                    submenu: {
                        id: "products",
                        display: "mega",
                        columns: [{ heading: "Apps", items: [{ label: "Analytics", href: "/a" }] }]
                    }
                },
                { label: "Pricing", href: "/pricing" }
            ]}
            rightButtons={[{ label: "Sign up", href: "/signup", variant: "primary" }]}
            onSubmenuOpen={(detail) => console.log("opened", detail.id)}
        />
    );
}
```

### Props

Every [`NavaloneOptions`](https://www.npmjs.com/package/navalone) field is a prop
(`items`, `logo`, `rightButtons`, `width`, `theme`, `breakpoint`, `menuAlign`,
`openOn`, `drawerSide`, … and the `on*` callbacks), plus `className`, `style` and
`id` for the host element. Types are re-exported from the core, so the prop shape
always matches `navalone`'s `.d.ts`.

### Imperative ref

`ref` exposes the core's public methods via a `NavaloneHandle`:

```tsx
menu.current?.open();
menu.current?.openSubmenu("products");
menu.current?.closeAll();
menu.current?.instance; // the underlying Navalone instance, or null
```

`open` · `close` · `toggle` · `navigateTo` · `back` · `openSubmenu` ·
`closeSubmenu` · `closeAll` · `destroy` · `instance`.

## Example

```bash
pnpm --filter @navalone/react example
```

## License

MIT
