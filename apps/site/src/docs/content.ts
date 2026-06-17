/** Static reference sections (getting started + API tables + wrapper usage). */

export const gettingStarted = /* html */ `
<section id="getting-started">
    <h2>Getting started <a class="anchor" href="#getting-started" aria-label="Link">#</a></h2>
    <p>Navalone is a free, open-source navigation that stands alone across every screen — one
    menu model gives you desktop dropdowns, mega menus and nested flyouts that fold into a
    sliding mobile drawer. There's no second nav to build. It ships as compiled JS + CSS +
    types, so plain-HTML and framework apps use the same core.</p>

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
    <p>One <code>items</code> model is the whole nav — it drives the desktop bar and the mobile
    drawer alike, with no duplicated markup to keep in sync. A single <code>NavaloneItem</code>:</p>
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

export const pureHtmlSetup = /* html */ `
<section id="pure-html">
    <h2>Pure HTML setup <a class="anchor" href="#pure-html" aria-label="Link">#</a></h2>
    <p>Nav, alone, is enough — even without a framework or a build step. Author the menu as plain
    markup and call <code>new Navalone()</code> with <strong>no <code>items</code></strong>. The
    core parses your <code>.menu-level</code> markup into the very same model the config produces,
    then stands up the desktop bar and the mobile drawer from it. A static HTML/CSS/JS page gets
    the identical menu the framework wrappers do — dropdowns, multi-level flyouts and mega menus
    included.</p>

    <h3>The markup</h3>
    <p>Each menu is a <code>.menu-level</code> panel with a <code>&lt;ul&gt;</code>. The
    <code>.level-1</code> panel is the bar; a trigger's <code>data-target</code> opens the panel
    whose <code>id</code> matches it — that pair is the whole wiring. A <code>data-submenu="mega"</code>
    panel splits into columns at every <code>.nv-group</code> heading.</p>
    <pre><code class="language-xml">&lt;menu class="mm" id="mm"&gt;
    &lt;!-- Brand: text, or wrap an &lt;img&gt;. An href makes it a link. --&gt;
    &lt;a data-nv-logo href="/"&gt;Navalone&lt;/a&gt;

    &lt;!-- Right-side actions. data-variant="primary" highlights a button. --&gt;
    &lt;div data-nv-actions&gt;
        &lt;a href="/login"&gt;Log in&lt;/a&gt;
        &lt;a href="/signup" data-variant="primary"&gt;Sign up&lt;/a&gt;
    &lt;/div&gt;

    &lt;!-- TOP BAR: the .level-1 panel's &lt;ul&gt; becomes the menu bar. --&gt;
    &lt;div class="menu-level level-1" id="main-menu"&gt;
        &lt;ul&gt;
            &lt;li&gt;&lt;a href="/pricing"&gt;Pricing&lt;/a&gt;&lt;/li&gt;
            &lt;!-- data-target points at the id= of the panel it opens. --&gt;
            &lt;li&gt;&lt;button data-target="company"&gt;Company&lt;/button&gt;&lt;/li&gt;
            &lt;li&gt;&lt;button data-target="products"&gt;Products&lt;/button&gt;&lt;/li&gt;
            &lt;li&gt;&lt;button data-target="resources"&gt;Resources&lt;/button&gt;&lt;/li&gt;
        &lt;/ul&gt;
    &lt;/div&gt;

    &lt;!-- A plain dropdown. id="company" pairs with data-target="company". --&gt;
    &lt;div class="menu-level" id="company" data-submenu="dropdown"&gt;
        &lt;ul&gt;
            &lt;li&gt;&lt;a href="/about"&gt;About us&lt;/a&gt;&lt;/li&gt;
            &lt;li&gt;&lt;a href="/careers" data-badge="5"&gt;Careers&lt;/a&gt;&lt;/li&gt;
            &lt;li&gt;&lt;a href="/press"&gt;Press&lt;/a&gt;&lt;/li&gt;
        &lt;/ul&gt;
    &lt;/div&gt;

    &lt;!-- A large dropdown with a NESTED, multi-level flyout. --&gt;
    &lt;div class="menu-level" id="products" data-submenu="dropdown-lg"&gt;
        &lt;ul&gt;
            &lt;li&gt;&lt;a href="/analytics" data-description="Dashboards and reports"&gt;Analytics&lt;/a&gt;&lt;/li&gt;
            &lt;!-- This row drills deeper: another data-target ↔ id pair. --&gt;
            &lt;li&gt;
                &lt;button data-target="devtools" data-badge="New"
                        data-description="APIs, SDKs and CLI"&gt;Developer Tools&lt;/button&gt;
            &lt;/li&gt;
        &lt;/ul&gt;
    &lt;/div&gt;

    &lt;!-- The deeper flyout the row above opens. --&gt;
    &lt;div class="menu-level" id="devtools" data-submenu="dropdown"&gt;
        &lt;ul&gt;
            &lt;li&gt;&lt;a href="/rest-api"&gt;REST API&lt;/a&gt;&lt;/li&gt;
            &lt;li&gt;&lt;a href="/js-sdk"&gt;JavaScript SDK&lt;/a&gt;&lt;/li&gt;
            &lt;li&gt;&lt;a href="/cli"&gt;Command Line&lt;/a&gt;&lt;/li&gt;
        &lt;/ul&gt;
    &lt;/div&gt;

    &lt;!-- A MEGA menu. Each .nv-group opens a column; the rows after it fill it. --&gt;
    &lt;div class="menu-level" id="resources" data-submenu="mega"&gt;
        &lt;ul&gt;
            &lt;li class="nv-group"&gt;Learn&lt;/li&gt;
            &lt;li&gt;&lt;a href="/docs" data-description="Guides and references"&gt;Documentation&lt;/a&gt;&lt;/li&gt;
            &lt;li&gt;&lt;a href="/tutorials" data-description="Step-by-step lessons"&gt;Tutorials&lt;/a&gt;&lt;/li&gt;

            &lt;li class="nv-group"&gt;Community&lt;/li&gt;
            &lt;li&gt;&lt;a href="/blog" data-badge="New" data-description="News and deep dives"&gt;Blog&lt;/a&gt;&lt;/li&gt;
            &lt;li&gt;&lt;a href="/forum" data-description="Ask and answer"&gt;Forum&lt;/a&gt;&lt;/li&gt;

            &lt;li class="nv-group"&gt;Support&lt;/li&gt;
            &lt;li&gt;&lt;a href="/help" data-description="Troubleshooting"&gt;Help Center&lt;/a&gt;&lt;/li&gt;
            &lt;li&gt;&lt;a href="/status" data-description="System uptime"&gt;Status&lt;/a&gt;&lt;/li&gt;
        &lt;/ul&gt;
    &lt;/div&gt;
&lt;/menu&gt;</code></pre>

    <h3>Activate it</h3>
    <p>One call, and the switch is simply leaving <code>items</code> out — that is what tells
    Navalone to read the markup instead of a config array.</p>
    <pre><code class="language-xml">&lt;script src="https://unpkg.com/navalone/dist/navalone.global.js"&gt;&lt;/script&gt;
&lt;script&gt;
    // No "items" option, so Navalone parses the markup above.
    const menu = new Navalone("#mm", { openOn: "hover", menuAlign: "center" });
&lt;/script&gt;</code></pre>
    <p>Everything else — the hamburger, the off-canvas drawer, panel headers, the
    <em>Back</em> buttons, ARIA wiring and animations — is generated for you. You author only the
    structure; wrapper classes and headers you don't see in the table below are rebuilt, so
    there's nothing extra to keep in sync.</p>

    <h3>Recognised hooks</h3>
    <div class="table-wrap">
    <table>
        <thead><tr><th>Hook</th><th>What it does</th></tr></thead>
        <tbody>
            <tr><td><code>.menu-level.level-1</code></td><td>The top bar. Its <code>&lt;ul&gt;</code> becomes the horizontal menu. (Plain <code>.menu-level</code> is used if no <code>.level-1</code> is found.)</td></tr>
            <tr><td><code>.menu-level</code> + <code>id</code></td><td>A submenu panel, located by its <code>id</code>.</td></tr>
            <tr><td><code>data-target</code> ↔ <code>id</code></td><td>The pairing: a trigger's <code>data-target</code> opens the <code>.menu-level</code> whose <code>id</code> matches. Nest to any depth.</td></tr>
            <tr><td><code>data-submenu</code></td><td>On a panel — its desktop shape: <code>"dropdown"</code> (default), <code>"dropdown-lg"</code> or <code>"mega"</code>.</td></tr>
            <tr><td><code>.nv-group</code></td><td>Inside a <code>mega</code> panel, a heading <code>&lt;li&gt;</code> that starts a new column.</td></tr>
            <tr><td><code>[data-nv-logo]</code></td><td>The brand — text, or an <code>&lt;img&gt;</code>; an <code>href</code> links it.</td></tr>
            <tr><td><code>[data-nv-actions]</code></td><td>Container whose <code>&lt;a&gt;</code>/<code>&lt;button&gt;</code> become right-side actions; <code>data-variant="primary"</code> highlights one.</td></tr>
            <tr><td><code>href</code> (on <code>&lt;a&gt;</code>)</td><td>Renders the row as a link; a <code>target</code> (e.g. <code>"_blank"</code>) carries over.</td></tr>
            <tr><td><code>data-label</code></td><td>Override the trigger text (otherwise the element's text is used).</td></tr>
            <tr><td><code>data-icon</code></td><td>Glyph/emoji shown when there's no image.</td></tr>
            <tr><td><code>data-image</code> / <code>data-image-alt</code></td><td>Row thumbnail (mobile) and its alt text.</td></tr>
            <tr><td><code>data-description</code></td><td>Secondary line under the label.</td></tr>
            <tr><td><code>data-badge</code></td><td>Small pill, e.g. <code>"New"</code>.</td></tr>
            <tr><td><code>disabled</code> / <code>aria-disabled</code></td><td>Dims and disables the row.</td></tr>
        </tbody>
    </table>
    </div>
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
            <tr><td><code>rightButtons</code></td><td>NavaloneButton[]</td><td><code>null</code></td><td>Action buttons on the right of the bar (and, with <code>rightButtonsFooter</code>, in the drawer footer on small screens).</td></tr>
            <tr><td><code>showRightButtons</code></td><td>boolean</td><td><code>true</code></td><td>Toggle the right-side action area.</td></tr>
            <tr><td><code>rightButtonsFooter</code></td><td>boolean</td><td><code>false</code></td><td>Keep the right-side buttons on the bar at every width (<code>false</code>), or collapse them into the drawer footer on medium/small screens (<code>true</code>).</td></tr>
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
