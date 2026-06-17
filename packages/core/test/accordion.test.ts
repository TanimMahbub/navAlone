import { describe, it, expect, vi } from "vitest";
import { mount, sampleOptions } from "./fixtures";

/** Click a row through the real delegated click path (root listener). */
function click(el: Element): void {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function trigger(root: HTMLElement, panelId: string): HTMLElement {
    return root.querySelector<HTMLElement>(`.menu-item[aria-controls="${panelId}"]`)!;
}

describe("mobile accordion mode", () => {
    it("renders a single inline panel — no sliding levels or back buttons", () => {
        const { root } = mount(sampleOptions({ mobileMenu: "accordion" }));
        expect(root.querySelector(".nv-panels")?.classList.contains("nv-acc")).toBe(true);
        // One root .menu-level only; submenus are inline .nv-acc-panel regions.
        expect(root.querySelectorAll(".menu-level").length).toBe(1);
        expect(root.querySelectorAll(".nv-acc-panel").length).toBeGreaterThan(0);
        // No drill-down chrome.
        expect(root.querySelector(".menu-header")).toBeNull();
        expect(root.querySelector(".back-button")).toBeNull();
    });

    it("submenu rows are collapsed (inert, aria-hidden) by default", () => {
        const { root } = mount(sampleOptions({ mobileMenu: "accordion" }));
        const t = trigger(root, "company-menu");
        const panel = root.querySelector<HTMLElement>("#company-menu")!;
        expect(t.getAttribute("aria-expanded")).toBe("false");
        expect(panel.getAttribute("aria-hidden")).toBe("true");
        expect(panel.inert).toBe(true);
    });

    it("clicking a trigger expands it, clicking again collapses it", () => {
        const { root } = mount(sampleOptions({ mobileMenu: "accordion" }));
        const t = trigger(root, "company-menu");
        const panel = root.querySelector<HTMLElement>("#company-menu")!;
        const li = t.closest(".nv-acc-li")!;

        click(t);
        expect(t.getAttribute("aria-expanded")).toBe("true");
        expect(li.classList.contains("is-open")).toBe(true);
        expect(panel.getAttribute("aria-hidden")).toBe("false");
        expect(panel.inert).toBe(false);

        click(t);
        expect(t.getAttribute("aria-expanded")).toBe("false");
        expect(li.classList.contains("is-open")).toBe(false);
        expect(panel.inert).toBe(true);
    });

    it("emits submenuopen / submenuclose with the panel id", () => {
        const onSubmenuOpen = vi.fn();
        const onSubmenuClose = vi.fn();
        const { root } = mount(
            sampleOptions({ mobileMenu: "accordion", onSubmenuOpen, onSubmenuClose })
        );
        const t = trigger(root, "company-menu");
        click(t);
        click(t);
        expect(onSubmenuOpen).toHaveBeenCalledTimes(1);
        expect(onSubmenuOpen.mock.calls[0][0].id).toBe("company-menu");
        expect(onSubmenuClose).toHaveBeenCalledTimes(1);
    });

    it("nests deeper accordions and flattens mega columns to groups", () => {
        const { root } = mount(sampleOptions({ mobileMenu: "accordion" }));
        // Nested submenu inside Products → Developer Tools → Command Line.
        expect(root.querySelector("#devtools-menu")).not.toBeNull();
        expect(root.querySelector("#cli-menu")).not.toBeNull();
        // A nested accordion panel lives inside its parent panel.
        const cli = root.querySelector("#cli-menu")!;
        expect(cli.closest("#devtools-menu")).not.toBeNull();
        // Mega columns become .nv-group headings inside the inline panel.
        const groups = root.querySelectorAll("#resources-menu .nv-group");
        expect(groups.length).toBe(2);
    });

    it("re-opening the drawer collapses any expanded accordions", () => {
        const { root, menu } = mount(sampleOptions({ mobileMenu: "accordion" }));
        const t = trigger(root, "company-menu");
        click(t);
        expect(t.getAttribute("aria-expanded")).toBe("true");
        menu.open();
        expect(t.getAttribute("aria-expanded")).toBe("false");
        expect(root.querySelector("#company-menu")?.getAttribute("aria-hidden")).toBe("true");
    });

    it("drill-down (default) is unaffected — it keeps back buttons", () => {
        const { root } = mount(sampleOptions());
        expect(root.querySelectorAll(".menu-level").length).toBeGreaterThan(1);
        expect(root.querySelector(".back-button")).not.toBeNull();
        expect(root.querySelector(".nv-acc-panel")).toBeNull();
    });
});
