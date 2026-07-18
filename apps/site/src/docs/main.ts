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
    accordionConfig,
    dropdownConfig,
    dropdownLgConfig,
    footerButtonsConfig,
    fullConfig,
    megaConfig,
    megaTabsConfig,
    nestedConfig,
    positionFixedConfig,
    positionSmartConfig,
    positionStickyConfig,
    responsiveDynamicConfig,
    responsiveStaticConfig
} from "./data";

const NAV: { href: string; label: string; group?: boolean }[] = [
    { href: "#getting-started", label: "Getting started" },
    { href: "#data-contract", label: "Data contract" },
    { href: "#pure-html", label: "Pure HTML setup" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#options", label: "Options" },
    { href: "#methods", label: "Methods" },
    { href: "#events", label: "Events" },
    { href: "#examples-layouts", label: "Submenu layouts", group: true },
    { href: "#example-dropdown", label: "Dropdown" },
    { href: "#example-dropdown-lg", label: "Dropdown (large)" },
    { href: "#example-nested", label: "Nested flyout" },
    { href: "#example-mega", label: "Mega menu" },
    { href: "#example-mega-tabs", label: "E-commerce mega" },
    { href: "#examples-mobile", label: "Mobile behaviour", group: true },
    { href: "#example-drawer", label: "Mobile drawer" },
    { href: "#example-accordion", label: "Mobile accordion" },
    { href: "#example-footer-buttons", label: "Footer buttons" },
    { href: "#examples-positioning", label: "Bar positioning", group: true },
    { href: "#example-position-fixed", label: "Fixed (default)" },
    { href: "#example-position-sticky", label: "Sticky" },
    { href: "#example-position-smart", label: "Smart (auto-hide)" },
    { href: "#examples-responsive", label: "Responsive collapsing", group: true },
    { href: "#example-responsive-dynamic", label: "Dynamic (default)" },
    { href: "#example-responsive-static", label: "Static breakpoints" },
    { href: "#theming-playground", label: "Theming playground" },
    { href: "#wrappers", label: "Framework wrappers" }
];

const app = document.querySelector<HTMLElement>("#app")!;

app.innerHTML = `
    <header class="topbar">
        <div class="topbar-inner">
            <a class="brand" href="#getting-started">Navalone <span>docs</span></a>
            <nav class="topbar-links" aria-label="External">
                <a href="/">Home</a>
                <a href="https://www.npmjs.com/package/navalone">npm</a>
                <a href="https://github.com/TanimMahbub/navAlone">GitHub</a>
            </nav>
            <button class="nav-toggle" aria-expanded="false" aria-controls="sidebar">Menu</button>
        </div>
    </header>
    <div class="layout">
        <aside class="sidebar" id="sidebar">
            <nav aria-label="Documentation sections">
                <ul>${NAV.map((n) => `<li${n.group ? ' class="nav-group"' : ""}><a href="${n.href}">${n.label}</a></li>`).join("")}</ul>
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

// A labelled divider that introduces a group of related examples, so the
// options are easy to scan by what they control (layout / mobile / position).
function exampleCategory(id: string, title: string, blurb: string): HTMLElement {
    const el = document.createElement("div");
    el.className = "example-category";
    el.id = id;
    el.innerHTML = `
        <h3 class="example-category-title">${title}
            <a class="anchor" href="#${id}" aria-label="Link to ${title}">#</a></h3>
        <p class="example-category-blurb">${blurb}</p>`;
    return el;
}

examples.append(
    exampleCategory(
        "examples-layouts",
        "Desktop submenu layouts",
        "How a submenu presents on the desktop bar — set per submenu with display."
    ),
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
        id: "example-mega-tabs",
        title: "E-commerce mega menu",
        description:
            "Set submenu.display to \"mega-tabs\" for a category rail that switches the content panes on the right — built for big catalogue navs. Each category is an item whose own submenu (a mega grid) fills its pane; hover or arrow-key through the categories. On mobile the same data drills down: tap a category, its columns flatten to grouped rows.",
        config: megaTabsConfig,
        actions: [{ label: "Open", method: "openSubmenu", args: ["shop"] }]
    }),
    exampleCategory(
        "examples-mobile",
        "Mobile behaviour",
        "How the menu collapses below the breakpoint and how submenus behave in the drawer."
    ),
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
        id: "example-accordion",
        title: "Mobile accordion",
        description:
            "Set mobileMenu: \"accordion\" and submenus expand inline on the same screen instead of sliding to a new panel — tap a row and its children unfold beneath it (nested submenus nest as accordions). The default is \"drilldown\" (the sliding panels shown above).",
        config: accordionConfig,
        actions: [
            { label: "Open drawer", method: "open" },
            { label: "Close drawer", method: "close" }
        ],
        note: "Pick the Tablet or Mobile preset, then Open drawer and tap a row with a chevron — it expands in place instead of sliding."
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
    exampleCategory(
        "examples-positioning",
        "Bar positioning",
        "Where the bar lives as the page scrolls — set with the position option. Scroll inside each preview to see the difference."
    ),
    createLiveExample({
        id: "example-position-fixed",
        title: "Fixed (default)",
        description:
            "position: \"fixed\" pins the bar to the top of the page from the start, so it stays on top however far you scroll. Scroll the preview — the bar stays put.",
        config: positionFixedConfig,
        tallPreview: true,
        note: "The default. In your own page, reserve room for it (e.g. padding-top on the body) so content isn't hidden behind the bar."
    }),
    createLiveExample({
        id: "example-position-sticky",
        title: "Sticky (below a top header)",
        description:
            "position: \"sticky\" leaves the bar in normal flow — here below a header strip with phone / email / social — and pins it to the top only once you scroll to it.",
        config: positionStickyConfig,
        tallPreview: true,
        note: "Place the menu after your top header in the markup; it scrolls away with the header, then sticks to the top."
    }),
    createLiveExample({
        id: "example-position-smart",
        title: "Smart (auto-hide on scroll)",
        description:
            "position: \"smart\" behaves like sticky, but after you scroll down it slides up out of view, and reappears the instant you scroll back up. Scroll the preview down a bit, then up.",
        config: positionSmartConfig,
        tallPreview: true,
        note: "Ideal for long pages — it maximises reading space while keeping the nav one upward scroll away."
    }),
    exampleCategory(
        "examples-responsive",
        "Responsive collapsing",
        "How the bar decides to fold — measured against its own content (dynamic) or fixed pixel breakpoints (static). Set with the responsive option."
    ),
    createLiveExample({
        id: "example-responsive-dynamic",
        title: "Dynamic (default)",
        description:
            "responsive: \"dynamic\" measures the center menu and folds it exactly when it would overlap the logo/buttons — no breakpoint to guess. Drag the handle slowly: the menu first condenses (smaller font, tighter spacing), then collapses to the hamburger.",
        config: responsiveDynamicConfig,
        note: "Try adding or removing items in the JSON — the fold points shift to match the content, at any screen size."
    }),
    createLiveExample({
        id: "example-responsive-static",
        title: "Static breakpoints",
        description:
            "responsive: \"static\" uses fixed widths instead. Here breakpoint: 400 collapses to the drawer and condenseBreakpoint: 540 tightens the bar first. Resize the preview past each width to see the steps. (On a real full-width site you'd usually pick larger values.)",
        config: responsiveStaticConfig,
        note: "Use static when you want the fold to happen at exact, predictable widths regardless of how much menu content there is."
    }),
    createPlayground()
);

// Syntax-highlight every static code sample and add copy buttons.
enhanceCodeBlocks(app);

// Options reference: switch the category tabs (and support arrow-key navigation).
const optTabs = app.querySelector<HTMLElement>("[data-opt-tabs]");
if (optTabs) {
    const tabs = [...optTabs.querySelectorAll<HTMLButtonElement>(".opt-tab")];
    const select = (tab: HTMLButtonElement) => {
        const id = tab.dataset.optTab!;
        tabs.forEach((t) => {
            const active = t === tab;
            t.classList.toggle("is-active", active);
            t.setAttribute("aria-selected", String(active));
            t.tabIndex = active ? 0 : -1;
        });
        optTabs.querySelectorAll<HTMLElement>(".opt-panel").forEach((p) => {
            const active = p.dataset.optPanel === id;
            p.classList.toggle("is-active", active);
            p.hidden = !active;
        });
    };
    optTabs.addEventListener("click", (e) => {
        const tab = (e.target as HTMLElement).closest<HTMLButtonElement>(".opt-tab");
        if (tab) select(tab);
    });
    optTabs.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
        if (i < 0) return;
        const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        select(next);
        next.focus();
        e.preventDefault();
    });
}

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
app.querySelectorAll("section[id], h2[id], .example-category[id]").forEach((el) =>
    observer.observe(el)
);
