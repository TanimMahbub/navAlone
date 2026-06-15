/** Static reference sections (getting started + API tables + wrapper usage). */

export const gettingStarted = /* html */ `
<section id="getting-started">
    <h2>Getting started <a class="anchor" href="#getting-started" aria-label="Link">#</a></h2>
    <p>Navalone is a free, open-source responsive main-menu plugin — desktop dropdowns,
    multi-level menus and mega menus that collapse into a sliding mobile drawer. It ships as
    compiled JS + CSS + types, so plain-HTML and framework apps use the same core.</p>

    <h3>npm</h3>
    <pre><code>npm install navalone</code></pre>
    <pre><code>import { Navalone } from "navalone";
import "navalone/css";

const menu = new Navalone("#menu", {
    logo: { text: "Acme", href: "/" },
    items: [
        { label: "Pricing", href: "/pricing" },
        {
            label: "Products",
            submenu: {
                id: "products",
                display: "mega",
                columns: [{ heading: "Apps", items: [{ label: "Analytics", href: "/a" }] }]
            }
        }
    ]
});</code></pre>

    <h3>&lt;script&gt; / CDN — no build step</h3>
    <p>Load the global build from unpkg or jsDelivr; it assigns <code>window.Navalone</code>.</p>
    <pre><code>&lt;link rel="stylesheet" href="https://unpkg.com/navalone/dist/navalone.css"&gt;
&lt;menu id="menu"&gt;&lt;/menu&gt;
&lt;script src="https://unpkg.com/navalone/dist/navalone.global.js"&gt;&lt;/script&gt;
&lt;script&gt;
    new Navalone("#menu", { logo: "Acme", items: [{ label: "Pricing", href: "/pricing" }] });
&lt;/script&gt;</code></pre>
</section>
`;

export const dataContract = /* html */ `
<section id="data-contract">
    <h2>Data contract <a class="anchor" href="#data-contract" aria-label="Link">#</a></h2>
    <p>One <code>items</code> model drives both the desktop bar and the mobile drawer — no
    duplicated markup. A single <code>NavaloneItem</code>:</p>
    <pre><code>interface NavaloneItem {
    label?: string;
    href?: string;          // renders the row as a link
    linkTarget?: string;    // e.g. "_blank"
    target?: string;        // id of a declarative panel to drill into (mobile)
    submenu?: NavaloneSubmenu;
    icon?: string;          // glyph/emoji when there is no image
    image?: string;         // thumbnail URL
    imageAlt?: string;
    description?: string;   // secondary line
    badge?: string;         // small pill, e.g. "New"
    disabled?: boolean;
}

interface NavaloneSubmenu {
    id?: string;
    title?: string;
    display?: "dropdown" | "dropdown-lg" | "mega";  // desktop presentation
    items?: NavaloneItem[];     // dropdowns / flyouts
    columns?: { heading?: string; items?: NavaloneItem[] }[];  // mega menus
}</code></pre>
    <p>On desktop, <code>display</code> chooses the presentation; any item with its own
    <code>submenu</code> becomes a nested flyout at arbitrary depth. On mobile the same data
    collapses to the drill-down drawer (mega columns flatten to grouped panels).</p>
</section>
`;

export const optionsReference = /* html */ `
<section id="options">
    <h2>Options <a class="anchor" href="#options" aria-label="Link">#</a></h2>
    <p>Pass as the second argument: <code>new Navalone(target, options)</code>. Every field is
    optional.</p>
    <div class="table-wrap">
    <table>
        <thead><tr><th>Option</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
            <tr><td><code>items</code></td><td>NavaloneItem[]</td><td><code>null</code></td><td>The menu model. Falls back to declarative markup when omitted.</td></tr>
            <tr><td><code>logo</code></td><td>string | object</td><td><code>null</code></td><td>Brand text or <code>{ text, img, alt, href }</code>.</td></tr>
            <tr><td><code>rightButtons</code></td><td>NavaloneButton[]</td><td><code>null</code></td><td>Action buttons on the right of the bar / drawer footer.</td></tr>
            <tr><td><code>showRightButtons</code></td><td>boolean</td><td><code>true</code></td><td>Toggle the right-side action area.</td></tr>
            <tr><td><code>width</code></td><td>string | number</td><td><code>null</code></td><td>Drawer width (sets <code>--nv-width</code>).</td></tr>
            <tr><td><code>animationDuration</code></td><td>string | number</td><td><code>null</code></td><td>Transition duration (sets <code>--nv-duration</code>).</td></tr>
            <tr><td><code>theme</code></td><td>Record&lt;string,string&gt;</td><td><code>null</code></td><td>Map of <code>--nv-*</code> tokens applied inline to the root.</td></tr>
            <tr><td><code>title</code></td><td>boolean | fn</td><td><code>true</code></td><td>Drawer panel title: derive from trigger or format it.</td></tr>
            <tr><td><code>showThumbnails</code></td><td>boolean</td><td><code>true</code></td><td>Render item images as row thumbnails on mobile.</td></tr>
            <tr><td><code>breakpoint</code></td><td>number</td><td><code>960</code></td><td>Max width (px) at which the bar collapses to the drawer.</td></tr>
            <tr><td><code>menuAlign</code></td><td>"left" | "center" | "right"</td><td><code>"center"</code></td><td>Alignment of the center menu in the bar.</td></tr>
            <tr><td><code>openOn</code></td><td>"hover" | "click"</td><td><code>"hover"</code></td><td>How desktop dropdowns open.</td></tr>
            <tr><td><code>drawerSide</code></td><td>"left" | "right"</td><td><code>"left"</code></td><td>Side the mobile drawer slides from.</td></tr>
            <tr><td><code>drawerLabel</code></td><td>string</td><td><code>"Menu"</code></td><td>Accessible label for the drawer dialog.</td></tr>
            <tr><td><code>rootId</code></td><td>string</td><td><code>null</code></td><td>Explicit id for the generated root (a11y wiring).</td></tr>
            <tr><td><code>on*</code></td><td>function</td><td><code>null</code></td><td>Callbacks — see Events below.</td></tr>
        </tbody>
    </table>
    </div>
</section>
`;

export const methodsReference = /* html */ `
<section id="methods">
    <h2>Methods <a class="anchor" href="#methods" aria-label="Link">#</a></h2>
    <div class="table-wrap">
    <table>
        <thead><tr><th>Method</th><th>Description</th></tr></thead>
        <tbody>
            <tr><td><code>open()</code></td><td>Open the mobile drawer.</td></tr>
            <tr><td><code>close()</code></td><td>Close the mobile drawer.</td></tr>
            <tr><td><code>toggle()</code></td><td>Toggle the drawer.</td></tr>
            <tr><td><code>navigateTo(panelId, trigger?)</code></td><td>Drill into a drawer panel.</td></tr>
            <tr><td><code>back()</code></td><td>Step back one drawer panel.</td></tr>
            <tr><td><code>openSubmenu(id)</code></td><td>Open a desktop submenu/flyout by its <code>submenu.id</code>.</td></tr>
            <tr><td><code>closeSubmenu(id)</code></td><td>Close a desktop submenu by id.</td></tr>
            <tr><td><code>closeAll()</code></td><td>Close every open desktop panel.</td></tr>
            <tr><td><code>destroy()</code></td><td>Tear down, remove listeners, and revert the root element.</td></tr>
        </tbody>
    </table>
    </div>
</section>
`;

export const eventsReference = /* html */ `
<section id="events">
    <h2>Events <a class="anchor" href="#events" aria-label="Link">#</a></h2>
    <p>Each event is dispatched on the root element as <code>navalone:&lt;type&gt;</code> (it
    bubbles) and is also delivered to the matching <code>on*</code> option callback.</p>
    <div class="table-wrap">
    <table>
        <thead><tr><th>DOM event</th><th>Callback</th><th><code>detail</code></th></tr></thead>
        <tbody>
            <tr><td><code>navalone:navigate</code></td><td><code>onNavigate</code></td><td>{ from, to, trigger }</td></tr>
            <tr><td><code>navalone:back</code></td><td><code>onBack</code></td><td>{ from, to }</td></tr>
            <tr><td><code>navalone:open</code></td><td><code>onOpen</code></td><td>{}</td></tr>
            <tr><td><code>navalone:close</code></td><td><code>onClose</code></td><td>{}</td></tr>
            <tr><td><code>navalone:submenuopen</code></td><td><code>onSubmenuOpen</code></td><td>{ id, trigger, panel }</td></tr>
            <tr><td><code>navalone:submenuclose</code></td><td><code>onSubmenuClose</code></td><td>{ id, panel }</td></tr>
        </tbody>
    </table>
    </div>
</section>
`;

export const wrappersReference = /* html */ `
<section id="wrappers">
    <h2>Framework wrappers <a class="anchor" href="#wrappers" aria-label="Link">#</a></h2>
    <p>Thin adapters over the same core — SSR-safe and tree-shakeable, with the framework and
    <code>navalone</code> as peerDependencies. Options, methods and events mirror the core.</p>

    <h3>React — <code>@navalone/react</code></h3>
    <pre><code>import { useRef } from "react";
import { Navalone, type NavaloneHandle } from "@navalone/react";
import "navalone/css";

const menu = useRef&lt;NavaloneHandle&gt;(null);
&lt;Navalone ref={menu} items={items} logo="Acme" onSubmenuOpen={(d) =&gt; console.log(d.id)} /&gt;
// menu.current?.openSubmenu("products")</code></pre>

    <h3>Vue 3 — <code>@navalone/vue</code></h3>
    <pre><code>&lt;script setup lang="ts"&gt;
import { ref } from "vue";
import { Navalone } from "@navalone/vue";
import "navalone/css";
const menu = ref();
&lt;/script&gt;

&lt;template&gt;
    &lt;Navalone ref="menu" :items="items" logo="Acme" @submenuopen="(d) =&gt; console.log(d.id)" /&gt;
&lt;/template&gt;</code></pre>

    <h3>Angular — <code>@navalone/angular</code></h3>
    <pre><code>import { NavaloneComponent } from "@navalone/angular";

@Component({
    standalone: true,
    imports: [NavaloneComponent],
    template: \`&lt;navalone-menu [items]="items" logo="Acme"
        (submenuopen)="onOpen($event)"&gt;&lt;/navalone-menu&gt;\`
})</code></pre>
</section>
`;
