/**
 * Studio code generation: turns the option-panel state into
 *   - the list of feature chunks to bundle,
 *   - a sample `items` config covering exactly the selected submenu flavors,
 *   - `app.js` (a `new Navalone(...)` call with only non-default options),
 *   - `index.html` (a minimal offline-ready page),
 *   - the iframe preview document (the SAME composed bundle + app.js, inlined).
 */

export interface StudioState {
    flavors: Set<string>;
    responsive: "dynamic" | "static";
    breakpoint: number;
    drawer: "drilldown" | "accordion";
    drawerSide: "left" | "right";
    openOn: "hover" | "click";
    position: "fixed" | "sticky" | "smart" | "static";
    menuAlign: "left" | "center" | "right";
    logo: boolean;
    rightButtons: boolean;
}

export const defaultState: StudioState = {
    flavors: new Set(["dropdown", "dropdown-lg", "mega"]),
    responsive: "dynamic",
    breakpoint: 960,
    drawer: "drilldown",
    drawerSide: "left",
    openOn: "hover",
    position: "fixed",
    menuAlign: "center",
    logo: true,
    rightButtons: true
};

/** The chunk ids this state needs (before manifest-dep resolution). */
export function selectedFeatureIds(state: StudioState): string[] {
    const ids = [...state.flavors];
    // The sample config nests flyout submenus as plain dropdown lists, so
    // selecting the flyout flavor pulls the dropdown chunk in with it.
    if (state.flavors.has("flyout") && !state.flavors.has("dropdown")) {
        ids.push("dropdown");
    }
    ids.push("drawer-" + state.drawer);
    ids.push("responsive-" + state.responsive);
    if (state.position === "smart") {
        ids.push("position-smart");
    }
    return ids;
}

/* ----------------------------- Sample items ------------------------------ */

type Obj = Record<string, unknown>;

function dropdownItem(state: StudioState): Obj {
    const items: Obj[] = [
        { label: "About us", href: "#about" },
        { label: "Careers", href: "#careers", badge: "5" },
        { label: "Press", href: "#press" }
    ];
    // Without dropdown-lg, the flyout sample nests here instead.
    if (state.flavors.has("flyout") && !state.flavors.has("dropdown-lg")) {
        items.push(flyoutItem());
    }
    return {
        label: "Company",
        submenu: { id: "company", display: "dropdown", items }
    };
}

function flyoutItem(): Obj {
    return {
        label: "Developer Tools",
        icon: "🛠️",
        description: "APIs, SDKs and the CLI",
        submenu: {
            id: "devtools",
            display: "dropdown",
            items: [
                { label: "REST API", href: "#api" },
                {
                    label: "Command Line",
                    submenu: {
                        id: "cli",
                        display: "dropdown",
                        items: [
                            { label: "Install", href: "#cli-install" },
                            { label: "Commands", href: "#cli-commands" }
                        ]
                    }
                }
            ]
        }
    };
}

function dropdownLgItem(state: StudioState): Obj {
    const items: Obj[] = [
        { label: "Analytics", icon: "📊", description: "Dashboards & reports", href: "#analytics" },
        { label: "Automation", icon: "⚡", description: "Workflows without code", badge: "New", href: "#automation" }
    ];
    if (state.flavors.has("flyout")) {
        items.push(flyoutItem());
    }
    return {
        label: "Products",
        submenu: { id: "products", display: "dropdown-lg", items }
    };
}

function megaItem(): Obj {
    return {
        label: "Resources",
        submenu: {
            id: "resources",
            display: "mega",
            columns: [
                {
                    heading: "Learn",
                    items: [
                        { label: "Documentation", icon: "📚", description: "Guides & API reference", href: "#docs" },
                        { label: "Tutorials", icon: "🎓", description: "Step-by-step lessons", href: "#tutorials" }
                    ]
                },
                {
                    heading: "Community",
                    items: [
                        { label: "Blog", icon: "✍️", description: "News & articles", badge: "New", href: "#blog" },
                        { label: "Forum", icon: "💬", description: "Ask the community", href: "#forum" }
                    ]
                },
                {
                    heading: "Support",
                    items: [
                        { label: "Help center", icon: "🛟", description: "FAQs & contact", href: "#help" },
                        { label: "Status", icon: "📈", description: "Uptime & incidents", href: "#status" }
                    ]
                }
            ]
        }
    };
}

function megaTabsItem(): Obj {
    return {
        label: "Shop",
        submenu: {
            id: "shop",
            display: "mega-tabs",
            items: [
                {
                    label: "Electronics",
                    icon: "🔌",
                    submenu: {
                        id: "electronics",
                        display: "mega",
                        columns: [
                            {
                                heading: "Computers",
                                items: [
                                    { label: "Laptops", icon: "💻", description: "Thin & light to pro", href: "#laptops" },
                                    { label: "Monitors", icon: "🖥️", description: "4K, ultrawide, portable", href: "#monitors" }
                                ]
                            },
                            {
                                heading: "Audio",
                                items: [
                                    { label: "Headphones", icon: "🎧", description: "Noise-cancelling picks", badge: "Sale", href: "#headphones" },
                                    { label: "Speakers", icon: "🔊", description: "Room-filling sound", href: "#speakers" }
                                ]
                            }
                        ]
                    }
                },
                {
                    label: "Fashion",
                    icon: "👟",
                    submenu: {
                        id: "fashion",
                        display: "mega",
                        columns: [
                            {
                                heading: "Featured",
                                items: [
                                    { label: "Sneakers", icon: "👟", description: "New season drops", badge: "Hot", href: "#sneakers" },
                                    { label: "Outerwear", icon: "🧥", description: "Rain or shine", href: "#outerwear" }
                                ]
                            }
                        ]
                    }
                },
                {
                    label: "Gift cards",
                    href: "#gift-cards",
                    icon: "🎁"
                }
            ]
        }
    };
}

export function sampleItems(state: StudioState): Obj[] {
    const items: Obj[] = [];
    if (state.flavors.has("dropdown")) {
        items.push(dropdownItem(state));
    }
    if (state.flavors.has("dropdown-lg")) {
        items.push(dropdownLgItem(state));
    } else if (state.flavors.has("flyout") && !state.flavors.has("dropdown")) {
        // Flyout alone: give it a dropdown host (its chunk is auto-included).
        items.push(dropdownItem(state));
    }
    if (state.flavors.has("mega")) {
        items.push(megaItem());
    }
    if (state.flavors.has("mega-tabs")) {
        items.push(megaTabsItem());
    }
    items.push({ label: "Pricing", href: "#pricing" });
    if (items.length < 3) {
        items.push({ label: "Customers", href: "#customers" });
        items.push({ label: "Contact", href: "#contact" });
    }
    return items;
}

/* ------------------------------ app.js ----------------------------------- */

/** JSON → JS: unquote identifier keys, indent with 4 spaces. */
function toJs(value: unknown, indent: string): string {
    const json = JSON.stringify(value, null, 4) || "null";
    return json
        .replace(/"([A-Za-z_$][A-Za-z0-9_$]*)":/g, "$1:")
        .split("\n")
        .join("\n" + indent);
}

export function generateAppJs(state: StudioState): string {
    const options: Obj = {};
    if (state.logo) {
        options.logo = { text: "Acme", href: "#" };
    }
    if (state.rightButtons) {
        options.rightButtons = [
            { label: "Log in", href: "#login" },
            { label: "Sign up", href: "#signup", variant: "primary" }
        ];
    }
    if (state.responsive !== "dynamic") {
        options.responsive = state.responsive;
    }
    if (state.responsive === "static" && state.breakpoint !== 960) {
        options.breakpoint = state.breakpoint;
    }
    if (state.position !== "fixed") {
        options.position = state.position;
    }
    if (state.menuAlign !== "center") {
        options.menuAlign = state.menuAlign;
    }
    if (state.openOn !== "hover") {
        options.openOn = state.openOn;
    }
    if (state.drawer !== "drilldown") {
        options.mobileMenu = state.drawer;
    }
    if (state.drawerSide !== "left") {
        options.drawerSide = state.drawerSide;
    }
    options.items = sampleItems(state);

    return (
        "// Your composed Navalone nav — navalone.custom.js registers only the\n" +
        "// features you selected in Studio.\n" +
        'new Navalone("#menu", ' +
        toJs(options, "") +
        ");\n"
    );
}

/* ----------------------------- index.html -------------------------------- */

const DEMO_BODY = `    <main class="demo-page">
        <h1>Your nav, standing alone.</h1>
        <p>
            This page runs the exact bundle you composed in Navalone Studio —
            only the features you picked, not a byte more. Resize the window
            to watch the bar collapse into the drawer.
        </p>
        <p>Scroll to check the bar's position behaviour.</p>
    </main>`;

const DEMO_STYLE = `        .demo-page {
            max-width: 720px;
            margin: 0 auto;
            padding: 120px 24px 60vh;
        }
        .demo-page h1 { margin-bottom: 12px; }
        .demo-page p { margin-bottom: 12px; color: #555; }`;

export function generateIndexHtml(state: StudioState): string {
    void state;
    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Navalone nav</title>
    <link rel="stylesheet" href="navalone.custom.css">
    <style>
${DEMO_STYLE}
    </style>
</head>
<body>
    <menu class="mm" id="menu"></menu>
${DEMO_BODY}
    <script src="navalone.custom.js"></script>
    <script src="app.js"></script>
</body>
</html>
`;
}

/** The preview document: index.html with the bundle + app.js inlined. */
export function generatePreviewHtml(state: StudioState, js: string, css: string): string {
    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <style>
${css}
    </style>
    <style>
${DEMO_STYLE}
        body { background: #fff; }
    </style>
</head>
<body>
    <menu class="mm" id="menu"></menu>
${DEMO_BODY}
    <script>
${js}
    </script>
    <script>
${generateAppJs(state)}
    </script>
</body>
</html>
`;
}
