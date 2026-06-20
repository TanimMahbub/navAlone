import type { NavaloneItem, NavaloneOptions } from "navalone";
import { thumbIcon } from "./icons";

const logo = { text: "Acme", href: "#" };

/** A small dropdown — the simplest submenu. */
export const dropdownConfig: NavaloneOptions = {
    logo,
    items: [
        {
            label: "Company",
            submenu: {
                id: "company",
                display: "dropdown",
                items: [
                    { label: "About", href: "#about" },
                    { label: "Careers", href: "#careers", badge: "5" },
                    { label: "Contact", href: "#contact" }
                ]
            }
        },
        { label: "Pricing", href: "#pricing" }
    ]
};

/** A large dropdown with thumbnails + descriptions. */
export const dropdownLgConfig: NavaloneOptions = {
    logo,
    items: [
        {
            label: "Products",
            submenu: {
                id: "products",
                display: "dropdown-lg",
                items: [
                    {
                        label: "Analytics",
                        image: thumbIcon("chart"),
                        description: "Dashboards & reports"
                    },
                    {
                        label: "Automation",
                        image: thumbIcon("settings", "#10b981"),
                        description: "Workflows that run themselves"
                    }
                ]
            }
        },
        { label: "Pricing", href: "#pricing" }
    ]
};

/** A nested flyout — a submenu inside a submenu, any depth. */
export const nestedConfig: NavaloneOptions = {
    logo,
    items: [
        {
            label: "Products",
            submenu: {
                id: "products",
                display: "dropdown-lg",
                items: [
                    { label: "Analytics", image: thumbIcon("chart"), description: "Dashboards" },
                    {
                        label: "Developer Tools",
                        image: thumbIcon("code", "#f59e0b"),
                        description: "APIs and SDKs",
                        submenu: {
                            id: "devtools",
                            display: "dropdown",
                            items: [
                                { label: "REST API", href: "#rest" },
                                { label: "GraphQL", href: "#graphql" },
                                {
                                    label: "Webhooks",
                                    submenu: {
                                        id: "webhooks",
                                        display: "dropdown",
                                        items: [
                                            { label: "Events", href: "#events" },
                                            { label: "Retries", href: "#retries" }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        { label: "Pricing", href: "#pricing" }
    ]
};

/** A mega menu — columns with headings. Flattens to grouped panels on mobile. */
export const megaConfig: NavaloneOptions = {
    logo,
    items: [
        {
            label: "Resources",
            submenu: {
                id: "resources",
                display: "mega",
                columns: [
                    {
                        heading: "Learn",
                        items: [
                            { label: "Docs", image: thumbIcon("book"), description: "Guides" },
                            { label: "Tutorials", image: thumbIcon("award", "#22d3ee"), description: "Lessons" }
                        ]
                    },
                    {
                        heading: "Community",
                        items: [
                            {
                                label: "Blog",
                                image: thumbIcon("edit", "#ec4899"),
                                description: "News",
                                badge: "New"
                            },
                            { label: "Forum", image: thumbIcon("message", "#06b6d4"), description: "Q&A" }
                        ]
                    },
                    {
                        heading: "Support",
                        items: [
                            { label: "Status", image: thumbIcon("trending", "#10b981"), description: "Uptime" }
                        ]
                    }
                ]
            }
        },
        { label: "Pricing", href: "#pricing" }
    ]
};

/** An e-commerce mega ("mega-tabs"): a category rail that switches the content
 *  panes on the right. Each category is an item whose own submenu (a mega grid)
 *  fills the pane; on mobile the same data drills down category → groups. */
export const megaTabsConfig: NavaloneOptions = {
    logo,
    items: [
        {
            label: "Categories",
            submenu: {
                id: "shop",
                display: "mega-tabs",
                items: [
                    {
                        label: "Electronics",
                        image: thumbIcon("settings", "#22d3ee"),
                        submenu: {
                            id: "cat-electronics",
                            display: "mega",
                            columns: [
                                {
                                    heading: "Computers",
                                    items: [
                                        { label: "Laptops", href: "#laptops" },
                                        { label: "Desktops", href: "#desktops" },
                                        { label: "Monitors", href: "#monitors" }
                                    ]
                                },
                                {
                                    heading: "Mobile",
                                    items: [
                                        { label: "Phones", href: "#phones" },
                                        { label: "Tablets", href: "#tablets" },
                                        { label: "Wearables", href: "#wearables", badge: "New" }
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        label: "Fashion",
                        image: thumbIcon("edit", "#ec4899"),
                        submenu: {
                            id: "cat-fashion",
                            display: "mega",
                            columns: [
                                {
                                    heading: "Men",
                                    items: [
                                        { label: "Shirts", href: "#shirts" },
                                        { label: "Shoes", href: "#shoes" },
                                        { label: "Watches", href: "#watches" }
                                    ]
                                },
                                {
                                    heading: "Women",
                                    items: [
                                        { label: "Dresses", href: "#dresses" },
                                        { label: "Bags", href: "#bags" },
                                        { label: "Jewelry", href: "#jewelry" }
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        label: "Home & Garden",
                        image: thumbIcon("chart", "#10b981"),
                        submenu: {
                            id: "cat-home",
                            display: "mega",
                            columns: [
                                {
                                    heading: "Living",
                                    items: [
                                        { label: "Furniture", href: "#furniture" },
                                        { label: "Lighting", href: "#lighting" },
                                        { label: "Decor", href: "#decor" }
                                    ]
                                },
                                {
                                    heading: "Outdoor",
                                    items: [
                                        { label: "Plants", href: "#plants" },
                                        { label: "Grills", href: "#grills" },
                                        { label: "Tools", href: "#tools" }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        },
        { label: "Deals", href: "#deals" }
    ]
};

/** The full menu used for the drawer + theming examples. */
export const fullItems: NavaloneItem[] = [
    ...(megaConfig.items as NavaloneItem[]).slice(0, 1),
    ...(nestedConfig.items as NavaloneItem[]).slice(0, 1),
    { label: "Pricing", href: "#pricing" },
    { label: "Enterprise", href: "#enterprise", disabled: true }
];

export const fullConfig: NavaloneOptions = {
    logo: { text: "Acme", href: "#" },
    rightButtons: [
        { label: "Log in", href: "#login" },
        { label: "Sign up", href: "#signup", variant: "primary" }
    ],
    items: fullItems
};

/** Mobile drawer with inline accordion submenus instead of the sliding drill-down. */
export const accordionConfig: NavaloneOptions = {
    logo: { text: "Acme", href: "#" },
    mobileMenu: "accordion",
    rightButtons: [
        { label: "Log in", href: "#login" },
        { label: "Sign up", href: "#signup", variant: "primary" }
    ],
    items: fullItems
};

/** Right-side buttons that drop into the drawer footer on small screens. */
export const footerButtonsConfig: NavaloneOptions = {
    logo: { text: "Acme", href: "#" },
    rightButtonsFooter: true,
    rightButtons: [
        { label: "Log in", href: "#login" },
        { label: "Sign up", href: "#signup", variant: "primary" }
    ],
    items: fullItems
};

/* ------------------------------ Positioning ------------------------------ */

/** Pinned to the top of the page from the start — the default. */
export const positionFixedConfig: NavaloneOptions = {
    position: "fixed",
    logo: { text: "Acme", href: "#" },
    rightButtons: [{ label: "Sign up", href: "#signup", variant: "primary" }],
    items: fullItems
};

/** Sits below a top info header and pins to the top once you scroll to it. */
export const positionStickyConfig: NavaloneOptions = {
    ...positionFixedConfig,
    position: "sticky"
};

/** Sticky, but hides on scroll-down and reappears the moment you scroll up. */
export const positionSmartConfig: NavaloneOptions = {
    ...positionFixedConfig,
    position: "smart"
};

/* ------------------------------ Responsive ------------------------------- */

/** A handful of top-level items so the condense → collapse steps are visible as
 *  you drag the (narrow) preview frame narrower. */
const busyItems: NavaloneItem[] = [
    { label: "Products", href: "#products" },
    { label: "Pricing", href: "#pricing" },
    { label: "Company", href: "#company" }
];

/** Dynamic (default): the menu is measured and folds exactly when it would
 *  overlap the logo/buttons — condensing first, then collapsing. */
export const responsiveDynamicConfig: NavaloneOptions = {
    logo: { text: "Acme", href: "#" },
    responsive: "dynamic",
    rightButtons: [{ label: "Sign up", href: "#signup", variant: "primary" }],
    items: busyItems
};

/** Static: classic pixel breakpoints — condense at 540, collapse at 400.
 *  (Kept inside the preview's width range so both steps are easy to see; on a
 *  real full-width page you'd typically use larger values.) */
export const responsiveStaticConfig: NavaloneOptions = {
    logo: { text: "Acme", href: "#" },
    responsive: "static",
    breakpoint: 400,
    condenseBreakpoint: 540,
    rightButtons: [{ label: "Sign up", href: "#signup", variant: "primary" }],
    items: busyItems
};
