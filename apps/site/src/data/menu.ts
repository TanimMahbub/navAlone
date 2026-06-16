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
