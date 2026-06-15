import type { NavaloneItem } from "../src/index";

export function thumb(label: string): string {
    const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">' +
        '<rect width="64" height="64" rx="10" fill="#10b981"/>' +
        `<text x="32" y="42" font-size="28" text-anchor="middle" fill="#fff">${label}</text></svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

export const demoItems: NavaloneItem[] = [
    {
        label: "Company",
        submenu: {
            id: "company",
            display: "dropdown",
            items: [
                { label: "About", href: "#about" },
                { label: "Careers", href: "#careers", badge: "5" }
            ]
        }
    },
    {
        label: "Products",
        submenu: {
            id: "products",
            display: "dropdown-lg",
            items: [
                { label: "Analytics", image: thumb("A"), description: "Dashboards" },
                {
                    label: "Developer Tools",
                    image: thumb("D"),
                    description: "APIs & SDKs",
                    submenu: {
                        id: "devtools",
                        display: "dropdown",
                        items: [{ label: "REST API", href: "#rest" }]
                    }
                }
            ]
        }
    },
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
                    items: [{ label: "Blog", image: thumb("✍"), description: "News", badge: "New" }]
                }
            ]
        }
    },
    { label: "Pricing", href: "#pricing" }
];
