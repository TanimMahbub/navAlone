import "navalone/css";
import "./styles.css";
import {
    dataContract,
    eventsReference,
    gettingStarted,
    methodsReference,
    optionsReference,
    pureHtmlSetup,
    wrappersReference
} from "./content";
import { createLiveExample } from "./live-example";
import { createHtmlExample } from "./html-example";
import { createPlayground } from "./playground";
import { enhanceCodeBlocks } from "./code";
import {
    dropdownConfig,
    dropdownLgConfig,
    footerButtonsConfig,
    fullConfig,
    megaConfig,
    nestedConfig
} from "./data";

const NAV = [
    { href: "#getting-started", label: "Getting started" },
    { href: "#data-contract", label: "Data contract" },
    { href: "#pure-html", label: "Pure HTML setup" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#options", label: "Options" },
    { href: "#methods", label: "Methods" },
    { href: "#events", label: "Events" },
    { href: "#example-dropdown", label: "Example: dropdown" },
    { href: "#example-dropdown-lg", label: "Example: dropdown-lg" },
    { href: "#example-nested", label: "Example: nested flyout" },
    { href: "#example-mega", label: "Example: mega" },
    { href: "#example-drawer", label: "Example: mobile drawer" },
    { href: "#example-footer-buttons", label: "Example: footer buttons" },
    { href: "#theming-playground", label: "Theming playground" },
    { href: "#wrappers", label: "Framework wrappers" }
];

const app = document.querySelector<HTMLElement>("#app")!;

app.innerHTML = `
    <header class="topbar">
        <a class="brand" href="#getting-started">Navalone <span>docs</span></a>
        <nav class="topbar-links" aria-label="External">
            <a href="/">Home</a>
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
                <p>One navigation that stands alone across every screen. Define your menu once —
                desktop dropdowns, mega menus and nested flyouts fold into a sliding mobile
                drawer. One data model, every framework, free and open source.</p>
            </div>
            ${gettingStarted}
            ${dataContract}
            ${pureHtmlSetup}
            <div data-how-it-works></div>
            ${optionsReference}
            ${methodsReference}
            ${eventsReference}
            <h2 id="examples">Live examples <a class="anchor" href="#examples" aria-label="Link">#</a></h2>
            <p>Every example below is editable — change the JSON and the menu rebuilds.</p>
            <div data-examples></div>
            ${wrappersReference}
            <footer class="docs-footer">
                <p>MIT licensed · One nav for every screen · Built with the same core the
                wrappers use.</p>
            </footer>
        </main>
    </div>
`;

// The "How it works" pure-HTML example sits right under its reference section.
app.querySelector<HTMLElement>("[data-how-it-works]")!.replaceWith(createHtmlExample());

const examples = app.querySelector<HTMLElement>("[data-examples]")!;

examples.append(
    createLiveExample({
        id: "example-dropdown",
        title: "Dropdown",
        description:
            "The simplest submenu. Set submenu.display to \"dropdown\" for a compact list.",
        config: dropdownConfig,
        actions: [{ label: "Open", method: "openSubmenu", args: ["company"] }]
    }),
    createLiveExample({
        id: "example-dropdown-lg",
        title: "Dropdown (large)",
        description: "A wider dropdown with thumbnails and descriptions.",
        config: dropdownLgConfig,
        actions: [{ label: "Open", method: "openSubmenu", args: ["products"] }]
    }),
    createLiveExample({
        id: "example-nested",
        title: "Nested flyout",
        description: "Any item with its own submenu opens a side flyout — at arbitrary depth.",
        config: nestedConfig,
        actions: [
            { label: "Open products", method: "openSubmenu", args: ["products"] },
            { label: "Open devtools", method: "openSubmenu", args: ["devtools"] }
        ]
    }),
    createLiveExample({
        id: "example-mega",
        title: "Mega menu",
        description: "Columns with headings. Flattens to grouped panels on mobile.",
        config: megaConfig,
        actions: [{ label: "Open", method: "openSubmenu", args: ["resources"] }]
    }),
    createLiveExample({
        id: "example-drawer",
        title: "Mobile drawer",
        description:
            "The same model collapses to an off-canvas drill-down. Pick the Mobile preset (or drag the handle narrow) to get the hamburger, then open it directly with open().",
        config: fullConfig,
        actions: [
            { label: "Open drawer", method: "open" },
            { label: "Close drawer", method: "close" }
        ],
        note: "Switch the preset to Tablet or Mobile and the bar collapses to the hamburger automatically."
    }),
    createLiveExample({
        id: "example-footer-buttons",
        title: "Buttons in the drawer footer",
        description:
            "By default the right-side buttons stay on the bar at every width. Set rightButtonsFooter: true and they collapse into the drawer footer on medium/small screens instead.",
        config: footerButtonsConfig,
        actions: [{ label: "Open drawer", method: "open" }],
        note: "Pick the Tablet or Mobile preset, then Open drawer — Log in / Sign up sit at the bottom of the drawer. Set rightButtonsFooter back to false and they stay on the bar."
    }),
    createPlayground()
);

// Syntax-highlight every static code sample and add copy buttons.
enhanceCodeBlocks(app);

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
