import { describe, it, expect } from "vitest";
import { Navalone } from "../src";
import type { NavaloneOptions } from "../src";

/** A small e-commerce mega ("mega-tabs"): two categories, each a mega grid. */
const megaTabsOptions: NavaloneOptions = {
    logo: { text: "Shop", href: "#" },
    responsive: "static",
    items: [
        {
            label: "Categories",
            submenu: {
                id: "shop",
                display: "mega-tabs",
                items: [
                    {
                        label: "Electronics",
                        image: "e.png",
                        submenu: {
                            id: "cat-electronics",
                            display: "mega",
                            columns: [
                                {
                                    heading: "Computers",
                                    items: [
                                        { label: "Laptops", href: "#laptops" },
                                        { label: "Monitors", href: "#monitors" }
                                    ]
                                },
                                {
                                    heading: "Mobile",
                                    items: [{ label: "Phones", href: "#phones" }]
                                }
                            ]
                        }
                    },
                    {
                        label: "Fashion",
                        image: "f.png",
                        submenu: {
                            id: "cat-fashion",
                            display: "mega",
                            columns: [
                                {
                                    heading: "Men",
                                    items: [{ label: "Shoes", href: "#shoes" }]
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

function mountMegaTabs(): { root: HTMLElement; menu: Navalone } {
    const root = document.createElement("menu");
    root.className = "mm";
    document.body.appendChild(root);
    const menu = new Navalone(root, megaTabsOptions);
    return { root, menu };
}

describe("e-commerce mega (mega-tabs) — desktop", () => {
    it("renders a category rail and one content pane per category", () => {
        const { root } = mountMegaTabs();
        const panel = root.querySelector(".nv-menubar .nv-mega-tabs")!;
        expect(panel).not.toBeNull();
        expect(panel.querySelectorAll(".nv-mt-nav .nv-mt-cat").length).toBe(2);
        expect(panel.querySelectorAll(".nv-mt-panes .nv-mt-pane").length).toBe(2);
    });

    it("marks the first category and its pane active by default", () => {
        const { root } = mountMegaTabs();
        const cats = root.querySelectorAll<HTMLElement>(".nv-mt-cat");
        const panes = root.querySelectorAll<HTMLElement>(".nv-mt-pane");
        expect(cats[0].classList.contains("is-active")).toBe(true);
        expect(cats[0].getAttribute("aria-selected")).toBe("true");
        expect(cats[0].tabIndex).toBe(0);
        expect(cats[1].classList.contains("is-active")).toBe(false);
        expect(cats[1].tabIndex).toBe(-1);
        expect(panes[0].classList.contains("is-active")).toBe(true);
        expect(panes[1].classList.contains("is-active")).toBe(false);
    });

    it("fills each pane with the category's mega grid (columns + headings)", () => {
        const { root } = mountMegaTabs();
        const firstPane = root.querySelector(".nv-mt-pane")!;
        const grid = firstPane.querySelector(".nv-mega.nv-mt-grid")!;
        expect(grid).not.toBeNull();
        expect(grid.querySelectorAll(".nv-col").length).toBe(2);
        expect(grid.querySelector(".nv-col-head")?.textContent).toBe("Computers");
    });

    it("switches the active pane when a category is clicked", () => {
        const { root } = mountMegaTabs();
        const cats = root.querySelectorAll<HTMLElement>(".nv-mt-cat");
        const panes = root.querySelectorAll<HTMLElement>(".nv-mt-pane");
        cats[1].click();
        expect(cats[1].classList.contains("is-active")).toBe(true);
        expect(cats[0].classList.contains("is-active")).toBe(false);
        expect(panes[1].classList.contains("is-active")).toBe(true);
        expect(panes[0].classList.contains("is-active")).toBe(false);
    });
});

describe("e-commerce mega (mega-tabs) — mobile", () => {
    it("drills down: categories list, then each category's columns flatten to groups", () => {
        const { root } = mountMegaTabs();
        // The mega-tabs submenu becomes a normal drill-down panel of categories.
        const shop = root.querySelector("#shop")!;
        expect(shop).not.toBeNull();
        expect(shop.querySelectorAll(":scope > ul > li > .menu-item").length).toBe(2);
        // Each category drills into its own mega panel, flattened to group headings.
        const electronics = root.querySelector("#cat-electronics")!;
        expect(electronics.querySelectorAll(".nv-group").length).toBe(2);
        expect(electronics.querySelectorAll(".menu-item").length).toBe(3);
    });
});
