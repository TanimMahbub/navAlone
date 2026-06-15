import { describe, it, expect } from "vitest";
import { mount } from "./fixtures";

describe("desktop submenu rendering", () => {
    it("renders a plain dropdown", () => {
        const { root } = mount();
        expect(root.querySelector(".nv-menubar .nv-dropdown")).not.toBeNull();
    });

    it("renders a large dropdown with rich rows (thumb + description)", () => {
        const { root } = mount();
        const lg = root.querySelector(".nv-dropdown-lg")!;
        const firstRow = lg.querySelector(".nv-d-item")!;
        expect(firstRow.querySelector(".nv-thumb")).not.toBeNull();
        expect(firstRow.querySelector(".nv-desc")?.textContent).toBe("Dashboards");
        expect(lg.querySelector(".nv-badge")?.textContent).toBe("New");
    });

    it("renders a mega menu with columns and headings", () => {
        const { root } = mount();
        const mega = root.querySelector(".nv-mega")!;
        const cols = mega.querySelectorAll(".nv-col");
        expect(cols.length).toBe(2);
        expect(mega.querySelector(".nv-col-head")?.textContent).toBe("Learn");
    });

    it("builds nested flyouts at arbitrary depth", () => {
        const { root } = mount();
        // Developer Tools -> Command Line = two nested flyout panels
        expect(root.querySelectorAll(".nv-flyout").length).toBe(2);
    });

    it("dims a disabled bar item", () => {
        const { root } = mount();
        const items = root.querySelectorAll<HTMLElement>(".nv-menubar > li > .nv-bar-item");
        const enterprise = items[items.length - 1];
        expect(enterprise.classList.contains("is-disabled")).toBe(true);
        expect(enterprise.getAttribute("aria-disabled")).toBe("true");
    });
});

describe("mobile drawer rendering", () => {
    it("hosts the drill-down inside .nv-panels", () => {
        const { root } = mount();
        expect(root.querySelector(".nv-drawer .nv-panels")).not.toBeNull();
        expect(root.querySelectorAll(".nv-panels .menu-level").length).toBe(6);
    });

    it("flattens mega columns to group headings on mobile", () => {
        const { root } = mount();
        const panel = root.querySelector("#resources-menu")!;
        expect(panel.querySelectorAll(".nv-group").length).toBe(2);
        expect(panel.querySelectorAll(".menu-item").length).toBe(3);
    });

    it("gives every sub-panel a header with a back button", () => {
        const { root } = mount();
        const sub = root.querySelector("#company-menu")!;
        expect(sub.querySelector(".menu-header .back-button")).not.toBeNull();
        expect(sub.querySelector(".menu-header .menu-title")).not.toBeNull();
    });
});

describe("accessibility wiring", () => {
    it("exposes a menubar and a modal drawer", () => {
        const { root, menu } = mount();
        expect(root.querySelector(".nv-menubar")?.getAttribute("role")).toBe("menubar");
        const drawer = root.querySelector(".nv-drawer")!;
        expect(drawer.getAttribute("role")).toBe("dialog");
        expect(drawer.getAttribute("aria-modal")).toBe("true");
        // hamburger controls the drawer by id
        const hamburger = root.querySelector(".nv-hamburger")!;
        expect(hamburger.getAttribute("aria-controls")).toBe(menu._drawer.id);
    });

    it("starts in desktop mode and marks the root panel active", () => {
        const { root } = mount();
        expect(root.classList.contains("nv-mode-desktop")).toBe(true);
        expect(root.querySelector(".menu-level.level-1")?.classList.contains("active-menu")).toBe(
            true
        );
    });

    it("makes only the first bar item tabbable (roving tabindex)", () => {
        const { root } = mount();
        const items = root.querySelectorAll<HTMLElement>(".nv-menubar > li > .nv-bar-item");
        expect(items[0].tabIndex).toBe(0);
        expect(items[1].tabIndex).toBe(-1);
    });
});
