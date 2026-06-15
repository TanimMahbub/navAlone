import { Navalone } from "../src";
import type { NavaloneItem, NavaloneOptions } from "../src";

/** The example menu: a dropdown, a dropdown-lg with a 2-level flyout, a mega
 * menu with columns, a plain link and a disabled item. */
export const sampleItems: NavaloneItem[] = [
    {
        label: "Company",
        submenu: {
            id: "company-menu",
            display: "dropdown",
            items: [
                { label: "About us", href: "#about" },
                { label: "Careers", href: "#careers", badge: "5" },
                { label: "Press", href: "#press" }
            ]
        }
    },
    {
        label: "Products",
        submenu: {
            id: "products-menu",
            display: "dropdown-lg",
            items: [
                { label: "Analytics", image: "a.png", description: "Dashboards" },
                {
                    label: "Developer Tools",
                    image: "d.png",
                    description: "APIs, SDKs and CLI",
                    badge: "New",
                    submenu: {
                        id: "devtools-menu",
                        display: "dropdown",
                        items: [
                            { label: "REST API", href: "#api" },
                            {
                                label: "Command Line",
                                submenu: {
                                    id: "cli-menu",
                                    display: "dropdown",
                                    items: [
                                        { label: "Install", href: "#cli-install" },
                                        { label: "Commands", href: "#cli-commands" }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        }
    },
    {
        label: "Resources",
        submenu: {
            id: "resources-menu",
            display: "mega",
            columns: [
                {
                    heading: "Learn",
                    items: [
                        { label: "Documentation", image: "doc.png", description: "Guides" },
                        { label: "Tutorials", image: "tut.png", description: "Lessons" }
                    ]
                },
                {
                    heading: "Community",
                    items: [{ label: "Blog", image: "blog.png", description: "News", badge: "New" }]
                }
            ]
        }
    },
    { label: "Pricing", href: "#pricing" },
    { label: "Enterprise", href: "#enterprise", disabled: true }
];

export function sampleOptions(extra: NavaloneOptions = {}): NavaloneOptions {
    return {
        logo: { text: "Navalone", href: "#" },
        rightButtons: [
            { label: "Log in", href: "#login" },
            { label: "Sign up", href: "#signup", variant: "primary" }
        ],
        items: sampleItems,
        ...extra
    };
}

export interface Mounted {
    root: HTMLElement;
    menu: Navalone;
}

/** Create a root, attach it to the document and instantiate Navalone. */
export function mount(options: NavaloneOptions = sampleOptions()): Mounted {
    const root = document.createElement("menu");
    root.className = "mm";
    document.body.appendChild(root);
    const menu = new Navalone(root, options);
    return { root, menu };
}

/** Mount from declarative markup (no `items` option). */
export function mountDeclarative(html: string, options: NavaloneOptions = {}): Mounted {
    const root = document.createElement("menu");
    root.className = "mm";
    root.innerHTML = html;
    document.body.appendChild(root);
    const menu = new Navalone(root, options);
    return { root, menu };
}
