import type { NavaloneOptions } from "navalone";
import { thumbIcon } from "./icons";

/** The live menu used in the hero — exercises dropdown, mega and a nested flyout. */
export const heroMenu: NavaloneOptions = {
    logo: { text: "Navalone", href: "#" },
    rightButtons: [
        { label: "Docs", href: "#" },
        { label: "Get started", href: "#", variant: "primary" }
    ],
    items: [
        {
            // The e-commerce mega ("mega-tabs"): a category rail switching content
            // panes — the same data drills down in the mobile drawer.
            label: "Shop",
            submenu: {
                id: "shop",
                display: "mega-tabs",
                items: [
                    {
                        label: "Electronics",
                        image: thumbIcon("monitor", "#22d3ee"),
                        submenu: {
                            id: "cat-electronics",
                            display: "mega",
                            columns: [
                                {
                                    heading: "Computers",
                                    items: [
                                        { label: "Laptops", href: "#" },
                                        { label: "Desktops", href: "#" },
                                        { label: "Monitors", href: "#" }
                                    ]
                                },
                                {
                                    heading: "Mobile",
                                    items: [
                                        { label: "Phones", href: "#" },
                                        { label: "Tablets", href: "#" },
                                        { label: "Wearables", href: "#", badge: "New" }
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        label: "Fashion",
                        image: thumbIcon("bag", "#ec4899"),
                        submenu: {
                            id: "cat-fashion",
                            display: "mega",
                            columns: [
                                {
                                    heading: "Men",
                                    items: [
                                        { label: "Shirts", href: "#" },
                                        { label: "Shoes", href: "#" },
                                        { label: "Watches", href: "#" }
                                    ]
                                },
                                {
                                    heading: "Women",
                                    items: [
                                        { label: "Dresses", href: "#" },
                                        { label: "Bags", href: "#" },
                                        { label: "Jewelry", href: "#" }
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        label: "Home & Garden",
                        image: thumbIcon("home", "#10b981"),
                        submenu: {
                            id: "cat-home",
                            display: "mega",
                            columns: [
                                {
                                    heading: "Living",
                                    items: [
                                        { label: "Furniture", href: "#" },
                                        { label: "Lighting", href: "#" },
                                        { label: "Decor", href: "#" }
                                    ]
                                },
                                {
                                    heading: "Outdoor",
                                    items: [
                                        { label: "Plants", href: "#" },
                                        { label: "Grills", href: "#" },
                                        { label: "Tools", href: "#" }
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        label: "Books & Media",
                        image: thumbIcon("book", "#f59e0b"),
                        submenu: {
                            id: "cat-books",
                            display: "mega",
                            columns: [
                                {
                                    heading: "Books",
                                    items: [
                                        { label: "Fiction", href: "#" },
                                        { label: "Non-fiction", href: "#" },
                                        { label: "Kids", href: "#" }
                                    ]
                                },
                                {
                                    heading: "Media",
                                    items: [
                                        { label: "Movies", href: "#" },
                                        { label: "Music", href: "#" },
                                        { label: "Games", href: "#" }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            label: "Product",
            submenu: {
                id: "product",
                display: "dropdown-lg",
                items: [
                    { label: "Overview", image: thumbIcon("zap", "#6366f1"), description: "The whole tour" },
                    {
                        label: "Integrations",
                        image: thumbIcon("settings", "#22d3ee"),
                        description: "Connect everything",
                        submenu: {
                            id: "integrations",
                            display: "dropdown",
                            items: [
                                { label: "Slack", href: "#" },
                                { label: "GitHub", href: "#" },
                                { label: "Figma", href: "#" }
                            ]
                        }
                    }
                ]
            }
        },
        {
            label: "Solutions",
            submenu: {
                id: "solutions",
                display: "mega",
                columns: [
                    {
                        heading: "By team",
                        items: [
                            { label: "Engineering", image: thumbIcon("code", "#6366f1"), description: "Ship faster" },
                            { label: "Design", image: thumbIcon("edit", "#ec4899"), description: "Stay in flow" }
                        ]
                    },
                    {
                        heading: "By size",
                        items: [
                            { label: "Startups", image: thumbIcon("rocket", "#f59e0b"), description: "Move quick" },
                            { label: "Enterprise", image: thumbIcon("building", "#10b981"), description: "Scale safely" }
                        ]
                    }
                ]
            }
        },
        { label: "Pricing", href: "#" },
        { label: "Blog", href: "#" }
    ]
};
