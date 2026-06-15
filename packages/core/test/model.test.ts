import { describe, it, expect } from "vitest";
import { mount, mountDeclarative } from "./fixtures";

describe("model — config driven", () => {
    it("renders one bar item per top-level item", () => {
        const { root } = mount();
        const items = root.querySelectorAll(".nv-menubar > li > .nv-bar-item");
        expect(items.length).toBe(5);
    });

    it("drives both views from one model (bar + drill-down panels)", () => {
        const { root } = mount();
        // root + company + products + devtools + cli + resources = 6 panels
        expect(root.querySelectorAll(".nv-panels .menu-level").length).toBe(6);
        expect(root.querySelectorAll(".nv-menubar .nv-panel").length).toBeGreaterThan(0);
    });

    it("renders logo and right-button CTAs", () => {
        const { root } = mount();
        const logo = root.querySelector(".nv-bar .nv-logo");
        expect(logo?.textContent).toBe("Navalone");
        const actions = root.querySelectorAll(".nv-bar .nv-actions .nv-action");
        expect(actions.length).toBe(2);
        expect(actions[1].classList.contains("nv-action--primary")).toBe(true);
    });
});

describe("model — declarative markup parsing", () => {
    const markup = `
        <a data-nv-logo href="/brand">Brand</a>
        <div data-nv-actions>
            <a href="/login">Log in</a>
            <button data-variant="primary">Sign up</button>
        </div>
        <div class="menu-level level-1" id="main">
            <ul>
                <li><button class="menu-item" data-target="sub1" data-submenu="dropdown">Company →</button></li>
                <li><a class="menu-item" href="#pricing">Pricing</a></li>
                <li><button class="menu-item" data-badge="b" disabled>Off</button></li>
            </ul>
        </div>
        <div class="menu-level level-2" id="sub1" data-title="Company">
            <div class="menu-header"><button class="back-button">← Back</button><span class="menu-title"></span></div>
            <ul><li><button class="menu-item">About</button></li></ul>
        </div>`;

    it("parses items from .menu-level markup", () => {
        const { root } = mountDeclarative(markup);
        const items = root.querySelectorAll(".nv-menubar > li > .nv-bar-item");
        expect(items.length).toBe(3);
        expect(items[0].textContent).toContain("Company");
    });

    it("parses a submenu trigger (aria-haspopup + desktop panel)", () => {
        const { root } = mountDeclarative(markup);
        const company = root.querySelector(".nv-menubar > li > .nv-bar-item")!;
        expect(company.getAttribute("aria-haspopup")).toBe("true");
        expect(root.querySelector(".nv-menubar .nv-dropdown")).not.toBeNull();
    });

    it("parses [data-nv-logo] and [data-nv-actions]", () => {
        const { root } = mountDeclarative(markup);
        const logo = root.querySelector(".nv-bar .nv-logo") as HTMLAnchorElement;
        expect(logo.textContent).toBe("Brand");
        expect(logo.getAttribute("href")).toBe("/brand");
        const actions = root.querySelectorAll(".nv-bar .nv-action");
        expect(actions.length).toBe(2);
        expect(actions[1].classList.contains("nv-action--primary")).toBe(true);
    });

    it("marks a disabled declarative item", () => {
        const { root } = mountDeclarative(markup);
        const disabled = root.querySelectorAll(".nv-menubar > li > .nv-bar-item")[2];
        expect(disabled.classList.contains("is-disabled")).toBe(true);
    });

    it("config option wins over declarative logo", () => {
        const { root } = mountDeclarative(markup, { logo: { text: "Override" } });
        expect(root.querySelector(".nv-bar .nv-logo")?.textContent).toBe("Override");
    });
});
