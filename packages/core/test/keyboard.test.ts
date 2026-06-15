import { describe, it, expect } from "vitest";
import { mount } from "./fixtures";
import { setViewport } from "./setup";

function key(el: Element, k: string): void {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
}

describe("desktop keyboard", () => {
    it("Left/Right rove along the bar", () => {
        const { root } = mount();
        const items = root.querySelectorAll<HTMLElement>(".nv-menubar > li > .nv-bar-item");
        items[0].focus();
        key(items[0], "ArrowRight");
        expect(document.activeElement).toBe(items[1]);
        expect(items[1].tabIndex).toBe(0);
        expect(items[0].tabIndex).toBe(-1);
        key(items[1], "ArrowLeft");
        expect(document.activeElement).toBe(items[0]);
    });

    it("Enter opens a submenu and moves focus into it", () => {
        const { root } = mount();
        const company = root.querySelector<HTMLElement>(".nv-menubar > li > .nv-bar-item")!;
        company.focus();
        key(company, "Enter");
        const panel = root.querySelector(".nv-dropdown")!;
        expect(panel.classList.contains("is-open")).toBe(true);
        expect(document.activeElement).toBe(panel.querySelector(".nv-d-item"));
    });

    it("Down/Up rove within a panel", () => {
        const { root } = mount();
        const company = root.querySelector<HTMLElement>(".nv-menubar > li > .nv-bar-item")!;
        company.focus();
        key(company, "ArrowDown");
        const rows = root.querySelectorAll<HTMLElement>(".nv-dropdown .nv-d-item");
        expect(document.activeElement).toBe(rows[0]);
        key(rows[0], "ArrowDown");
        expect(document.activeElement).toBe(rows[1]);
    });

    it("Right opens a nested flyout", () => {
        const { menu, root } = mount();
        const products = root.querySelectorAll<HTMLElement>(".nv-menubar > li > .nv-bar-item")[1];
        products.focus();
        key(products, "ArrowDown"); // open products dropdown-lg, focus first row
        // walk to the "Developer Tools" row (it owns a flyout)
        const rows = menu._desktopPanels["products-menu"].querySelectorAll<HTMLElement>(
            ":scope > ul > li > .nv-d-item"
        );
        const devTools = Array.from(rows).find((r) => r._nvPanel)!;
        devTools.focus();
        key(devTools, "ArrowRight");
        expect(menu._desktopPanels["devtools-menu"].classList.contains("is-open")).toBe(true);
    });

    it("Escape closes the panel and returns focus to the trigger", () => {
        const { root } = mount();
        const company = root.querySelector<HTMLElement>(".nv-menubar > li > .nv-bar-item")!;
        company.focus();
        key(company, "Enter");
        const panel = root.querySelector(".nv-dropdown")!;
        const firstRow = panel.querySelector<HTMLElement>(".nv-d-item")!;
        key(firstRow, "Escape");
        expect(panel.classList.contains("is-open")).toBe(false);
        expect(document.activeElement).toBe(company);
    });
});

describe("drawer keyboard", () => {
    it("Escape goes back, then closes at the root", () => {
        const { root, menu } = mount();
        setViewport(true);
        menu.open();
        menu.navigateTo("company-menu");
        expect(menu._stack.length).toBe(2);

        key(root, "Escape"); // back
        expect(menu._stack.length).toBe(1);

        key(root, "Escape"); // close
        expect(menu._drawerOpen).toBe(false);
    });

    it("Up/Down move focus within the active drawer panel", () => {
        const { root, menu } = mount();
        setViewport(true);
        menu.open();
        key(root, "ArrowDown");
        const firstItem = root.querySelector<HTMLElement>(".menu-level.active-menu .menu-item");
        expect(document.activeElement).toBe(firstItem);
    });
});
