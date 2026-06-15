import "navalone/css";
import "./styles.css";
import {
    dataContract,
    eventsReference,
    gettingStarted,
    methodsReference,
    optionsReference,
    wrappersReference
} from "./content";
import { createLiveExample } from "./live-example";
import { createPlayground } from "./playground";
import {
    dropdownConfig,
    dropdownLgConfig,
    fullConfig,
    megaConfig,
    nestedConfig
} from "./data";

const NAV = [
    { href: "#getting-started", label: "Getting started" },
    { href: "#data-contract", label: "Data contract" },
    { href: "#options", label: "Options" },
    { href: "#methods", label: "Methods" },
    { href: "#events", label: "Events" },
    { href: "#example-dropdown", label: "Example: dropdown" },
    { href: "#example-dropdown-lg", label: "Example: dropdown-lg" },
    { href: "#example-nested", label: "Example: nested flyout" },
    { href: "#example-mega", label: "Example: mega" },
    { href: "#example-drawer", label: "Example: mobile drawer" },
    { href: "#theming-playground", label: "Theming playground" },
    { href: "#wrappers", label: "Framework wrappers" }
];

const app = document.querySelector<HTMLElement>("#app")!;

app.innerHTML = `
    <header class="topbar">
        <a class="brand" href="#getting-started">Navalone <span>docs</span></a>
        <nav class="topbar-links" aria-label="External">
            <a href="https://www.npmjs.com/package/navalone">npm</a>
            <a href="https://github.com/">GitHub</a>
        </nav>
        <button class="nav-toggle" aria-expanded="false" aria-controls="sidebar">Menu</button>
    </header>
    <div class="layout">
        <aside class="sidebar" id="sidebar">
            <nav aria-label="Documentation sections">
                <ul>${NAV.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join("")}</ul>
            </nav>
        </aside>
        <main id="content" class="content" tabindex="-1">
            <div class="hero">
                <h1>Navalone</h1>
                <p>A free, open-source responsive main-menu plugin. Desktop dropdowns,
                multi-level menus and mega menus that collapse into a sliding mobile drawer —
                one data model, every framework.</p>
            </div>
            ${gettingStarted}
            ${dataContract}
            ${optionsReference}
            ${methodsReference}
            ${eventsReference}
            <h2 id="examples">Live examples <a class="anchor" href="#examples" aria-label="Link">#</a></h2>
            <p>Every example below is editable — change the JSON and the menu rebuilds.</p>
            <div data-examples></div>
            ${wrappersReference}
            <footer class="docs-footer">
                <p>MIT licensed · A free alternative to mmenu.js · Built with the same core the
                wrappers use.</p>
            </footer>
        </main>
    </div>
`;

const examples = app.querySelector<HTMLElement>("[data-examples]")!;

examples.append(
    createLiveExample({
        id: "example-dropdown",
        title: "Dropdown",
        description:
            "The simplest submenu. Set submenu.display to \"dropdown\" for a compact list.",
        config: dropdownConfig,
        actions: [{ label: "Open", run: (m) => m.openSubmenu("company") }]
    }),
    createLiveExample({
        id: "example-dropdown-lg",
        title: "Dropdown (large)",
        description: "A wider dropdown with thumbnails and descriptions.",
        config: dropdownLgConfig,
        actions: [{ label: "Open", run: (m) => m.openSubmenu("products") }]
    }),
    createLiveExample({
        id: "example-nested",
        title: "Nested flyout",
        description: "Any item with its own submenu opens a side flyout — at arbitrary depth.",
        config: nestedConfig,
        actions: [
            { label: "Open products", run: (m) => m.openSubmenu("products") },
            { label: "Open devtools", run: (m) => m.openSubmenu("devtools") }
        ]
    }),
    createLiveExample({
        id: "example-mega",
        title: "Mega menu",
        description: "Columns with headings. Flattens to grouped panels on mobile.",
        config: megaConfig,
        actions: [{ label: "Open", run: (m) => m.openSubmenu("resources") }]
    }),
    createLiveExample({
        id: "example-drawer",
        title: "Mobile drawer",
        description:
            "The same model collapses to an off-canvas drill-down. Open it directly with open() (works at any width), or narrow the window below the 960px breakpoint.",
        config: fullConfig,
        actions: [
            { label: "Open drawer", run: (m) => m.open() },
            { label: "Close drawer", run: (m) => m.close() }
        ],
        note: "On a real mobile viewport the hamburger appears automatically."
    }),
    createPlayground()
);

/* ----------------------------- Page chrome ------------------------------ */

// Mobile sidebar toggle.
const toggle = app.querySelector<HTMLButtonElement>(".nav-toggle")!;
const sidebar = app.querySelector<HTMLElement>("#sidebar")!;
toggle.addEventListener("click", () => {
    const open = sidebar.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
});
sidebar.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).tagName === "A") {
        sidebar.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
    }
});

// Highlight the active section in the sidebar as it scrolls into view.
const links = new Map<string, HTMLAnchorElement>();
sidebar.querySelectorAll<HTMLAnchorElement>("a").forEach((a) => {
    links.set(a.getAttribute("href")!.slice(1), a);
});
const observer = new IntersectionObserver(
    (entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                links.forEach((a) => a.classList.remove("is-active"));
                links.get(entry.target.id)?.classList.add("is-active");
            }
        }
    },
    { rootMargin: "-20% 0px -70% 0px" }
);
app.querySelectorAll("section[id], h2[id]").forEach((el) => observer.observe(el));
