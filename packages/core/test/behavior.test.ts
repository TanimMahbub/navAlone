import { describe, it, expect, vi } from "vitest";
import { mount, sampleOptions } from "./fixtures";
import { setViewport } from "./setup";

describe("off-canvas drawer", () => {
    it("open/close toggles state, classes, backdrop and aria", () => {
        const { root, menu } = mount();
        menu.open();
        expect(menu._drawerOpen).toBe(true);
        expect(root.classList.contains("nv-open")).toBe(true);
        expect(menu._backdrop.hidden).toBe(false);
        expect(root.querySelector(".nv-hamburger")?.getAttribute("aria-expanded")).toBe("true");

        menu.close();
        expect(menu._drawerOpen).toBe(false);
        expect(root.classList.contains("nv-open")).toBe(false);
    });

    it("toggle() flips the drawer", () => {
        const { menu } = mount();
        menu.toggle();
        expect(menu._drawerOpen).toBe(true);
        menu.toggle();
        expect(menu._drawerOpen).toBe(false);
    });

    it("locks body scroll only in mobile mode", () => {
        const { menu } = mount();
        setViewport(true);
        menu.open();
        expect(document.body.classList.contains("nv-scroll-lock")).toBe(true);
        menu.close();
        expect(document.body.classList.contains("nv-scroll-lock")).toBe(false);
    });

    it("fires navalone:open / navalone:close and the callbacks", () => {
        const onOpen = vi.fn();
        const onClose = vi.fn();
        const { root, menu } = mount(sampleOptions({ onOpen, onClose }));
        const evtOpen = vi.fn();
        root.addEventListener("navalone:open", evtOpen);
        menu.open();
        menu.close();
        expect(onOpen).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(evtOpen).toHaveBeenCalledTimes(1);
    });
});

describe("mobile drill-down navigation", () => {
    it("navigateTo / back move the active panel and stack", () => {
        const { root, menu } = mount();
        const ok = menu.navigateTo("company-menu");
        expect(ok).toBe(true);
        expect(menu._stack).toEqual([root.querySelector(".level-1")!.id, "company-menu"]);
        expect(root.querySelector("#company-menu")?.classList.contains("active-menu")).toBe(true);

        expect(menu.back()).toBe(true);
        expect(menu._stack.length).toBe(1);
        expect(root.querySelector(".level-1")?.classList.contains("active-menu")).toBe(true);
    });

    it("emits navigate and back events", () => {
        const onNavigate = vi.fn();
        const onBack = vi.fn();
        const { menu } = mount(sampleOptions({ onNavigate, onBack }));
        menu.navigateTo("company-menu");
        menu.back();
        expect(onNavigate).toHaveBeenCalledTimes(1);
        expect(onBack).toHaveBeenCalledTimes(1);
    });
});

describe("desktop submenus", () => {
    it("openSubmenu / closeSubmenu toggle is-open and track open panels", () => {
        const { menu } = mount();
        menu.openSubmenu("company-menu");
        const panel = menu._desktopPanels["company-menu"];
        expect(panel.classList.contains("is-open")).toBe(true);
        expect(menu._openPanels).toContain(panel);

        menu.closeSubmenu("company-menu");
        expect(panel.classList.contains("is-open")).toBe(false);
        expect(menu._openPanels).not.toContain(panel);
    });

    it("emits submenuopen / submenuclose", () => {
        const onSubmenuOpen = vi.fn();
        const onSubmenuClose = vi.fn();
        const { menu } = mount(sampleOptions({ onSubmenuOpen, onSubmenuClose }));
        menu.openSubmenu("company-menu");
        menu.closeSubmenu("company-menu");
        expect(onSubmenuOpen).toHaveBeenCalledTimes(1);
        expect(onSubmenuClose).toHaveBeenCalledTimes(1);
    });

    it("closeAll cascades nested flyouts closed", () => {
        const { menu } = mount();
        menu.openSubmenu("products-menu");
        menu.openSubmenu("devtools-menu");
        expect(menu._openPanels.length).toBe(2);
        menu.closeAll();
        expect(menu._openPanels.length).toBe(0);
    });
});

describe("responsive mode switching", () => {
    it("switches classes on the matchMedia change", () => {
        const { root } = mount();
        expect(root.classList.contains("nv-mode-desktop")).toBe(true);
        setViewport(true);
        expect(root.classList.contains("nv-mode-mobile")).toBe(true);
        expect(root.classList.contains("nv-mode-desktop")).toBe(false);
    });

    it("collapses an open drawer when growing back to desktop", () => {
        const { root, menu } = mount();
        setViewport(true);
        menu.open();
        expect(menu._drawerOpen).toBe(true);
        setViewport(false);
        expect(menu._drawerOpen).toBe(false);
        expect(root.classList.contains("nv-open")).toBe(false);
    });
});

describe("destroy()", () => {
    it("reverts the DOM, classes and removes listeners (incl. matchMedia)", () => {
        const { root, menu } = mount();
        menu.openSubmenu("company-menu");
        menu.destroy();

        expect(menu._destroyed).toBe(true);
        expect(root.innerHTML).toBe("");
        expect(root.className).toBe("mm");

        // matchMedia listener was removed: a mode change is now a no-op.
        setViewport(true);
        expect(root.className).toBe("mm");

        // click listeners were removed: re-instantiating is not required and
        // clicking does nothing.
        root.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(root.className).toBe("mm");
    });
});
