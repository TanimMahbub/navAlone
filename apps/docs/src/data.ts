import type { NavaloneItem, NavaloneOptions } from "navalone";

/** Inline SVG thumbnail so the docs need no image assets. */
export function thumb(label: string, color = "#6366f1"): string {
    const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">' +
        `<rect width="64" height="64" rx="10" fill="${color}"/>` +
        `<text x="32" y="42" font-size="26" text-anchor="middle" fill="#fff">${label}</text></svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

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
                        image: thumb("A"),
                        description: "Dashboards & reports"
                    },
                    {
                        label: "Automation",
                        image: thumb("⚙", "#10b981"),
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
                    { label: "Analytics", image: thumb("A"), description: "Dashboards" },
                    {
                        label: "Developer Tools",
                        image: thumb("D", "#f59e0b"),
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
                            { label: "Docs", image: thumb("📚"), description: "Guides" },
                            { label: "Tutorials", image: thumb("🎓"), description: "Lessons" }
                        ]
                    },
                    {
                        heading: "Community",
                        items: [
                            {
                                label: "Blog",
                                image: thumb("✍", "#ec4899"),
                                description: "News",
                                badge: "New"
                            },
                            { label: "Forum", image: thumb("💬", "#06b6d4"), description: "Q&A" }
                        ]
                    },
                    {
                        heading: "Support",
                        items: [
                            { label: "Status", image: thumb("📈", "#10b981"), description: "Uptime" }
                        ]
                    }
                ]
            }
        },
        { label: "Pricing", href: "#pricing" }
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
