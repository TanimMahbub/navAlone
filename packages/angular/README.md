# @navalone/angular

Angular wrapper for [Navalone](https://www.npmjs.com/package/navalone) — a free,
open-source responsive main-menu plugin (a free alternative to mmenu.js).

A **thin standalone component** over the framework-agnostic core: it mounts the
core on init and calls `destroy()` on destroy. No menu behaviour is
re-implemented — `@Input()`s mirror the core's options and `@Output()`s surface
its events.

- **SSR-safe** — the core is only instantiated in `ngAfterViewInit`.
- `navalone` and `@angular/{core,common}` are peerDependencies.

## Install

```bash
npm install @navalone/angular navalone
# peerDeps: @angular/core, @angular/common
```

## Usage

```ts
import { Component } from "@angular/core";
import { NavaloneComponent } from "@navalone/angular";

@Component({
    selector: "app-header",
    standalone: true,
    imports: [NavaloneComponent],
    template: `
        <navalone-menu
            #menu
            [items]="items"
            [logo]="{ text: 'Acme', href: '/' }"
            (submenuopen)="onOpen($event)"
        ></navalone-menu>
        <button (click)="menu.openSubmenu('products')">Open</button>
    `
})
export class HeaderComponent {
    items = [
        { label: "Pricing", href: "/pricing" },
        {
            label: "Products",
            submenu: { id: "products", display: "dropdown", items: [{ label: "Analytics", href: "/a" }] }
        }
    ];
    onOpen(detail: { id: string }) {
        console.log("opened", detail.id);
    }
}
```

Add the core stylesheet once (e.g. in `angular.json` `styles` or a global import):

```css
@import "navalone/css";
```

### Inputs

Mirror [`NavaloneOptions`](https://www.npmjs.com/package/navalone): `items`,
`logo`, `rightButtons`, `showRightButtons`, `width`, `animationDuration`, `theme`,
`rootId`, `title`, `showThumbnails`, `breakpoint`, `menuAlign`, `openOn`,
`drawerSide`, `drawerLabel`.

### Outputs

`navigate` · `back` · `open` · `close` · `submenuopen` · `submenuclose`.

### Methods (via a template ref)

`openDrawer` · `closeDrawer` · `toggle` · `navigateTo` · `goBack` ·
`openSubmenu` · `closeSubmenu` · `closeAll` · `destroy` · `core`.

> The drawer/back methods are named `openDrawer`/`closeDrawer`/`goBack` to avoid
> clashing with the `open`/`close`/`back` `@Output()` names on the component.

## Example

```bash
pnpm --filter @navalone/angular example
```

## License

MIT
