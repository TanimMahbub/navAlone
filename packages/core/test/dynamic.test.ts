/**
 * Dynamic (content-aware) responsive mode. jsdom has no layout engine, so the
 * decision logic is driven by stubbing the cached natural widths and the bar's
 * measured width, then asserting the full → condensed → collapsed transitions.
 */
import { describe, it, expect } from "vitest";
import { Navalone } from "../src";
import { mount, sampleOptions } from "./fixtures";
import { setWidth } from "./setup";

/** Pin a fake measured bar width and the cached natural widths, then re-decide. */
function drive(
    menu: ReturnType<typeof mount>["menu"],
    barWidth: number,
    nat: { full: number; cond: number; chrome: number }
): void {
    Object.defineProperty(menu._bar, "clientWidth", {
        value: barWidth,
        configurable: true
    });
    menu._natFull = nat.full;
    menu._natCond = nat.cond;
    menu._chrome = nat.chrome;
    menu._applyDynamic();
}

describe("responsive: dynamic", () => {
    it("is the default mode", () => {
        expect(Navalone.defaults.responsive).toBe("dynamic");
    });

    it("starts on the desktop bar in a layout-less environment", () => {
        const { root } = mount(sampleOptions({ responsive: "dynamic" }));
        expect(root.classList.contains("nv-mode-desktop")).toBe(true);
        expect(root.classList.contains("nv-condensed")).toBe(false);
    });

    it("condenses, then collapses, as the available width shrinks", () => {
        const { root, menu } = mount(sampleOptions({ responsive: "dynamic" }));
        const nat = { full: 300, cond: 200, chrome: 100 };

        // Plenty of room (available 400 ≥ 300): full desktop bar.
        drive(menu, 500, nat);
        expect(root.classList.contains("nv-mode-desktop")).toBe(true);
        expect(root.classList.contains("nv-condensed")).toBe(false);

        // Tight (available 280: < full 300, ≥ condensed 200): condensed bar.
        drive(menu, 380, nat);
        expect(root.classList.contains("nv-mode-desktop")).toBe(true);
        expect(root.classList.contains("nv-condensed")).toBe(true);

        // Too tight even condensed (available 150 < 200): collapse to the drawer.
        drive(menu, 250, nat);
        expect(root.classList.contains("nv-mode-mobile")).toBe(true);
        expect(root.classList.contains("nv-condensed")).toBe(false);
    });

    it("expands back to the desktop bar when the width grows again", () => {
        const { root, menu } = mount(sampleOptions({ responsive: "dynamic" }));
        const nat = { full: 300, cond: 200, chrome: 100 };

        drive(menu, 250, nat); // collapsed
        expect(root.classList.contains("nv-mode-mobile")).toBe(true);

        drive(menu, 600, nat); // grown wide again
        expect(root.classList.contains("nv-mode-desktop")).toBe(true);
        expect(root.classList.contains("nv-condensed")).toBe(false);
    });

    it("collapses when a submenu panel is too wide to open, even if the bar fits", () => {
        const { root, menu } = mount(sampleOptions({ responsive: "dynamic" }));
        // Tiny bar (think one "Categories" item) that fits any screen, fronting a
        // much wider mega/mega-tabs panel.
        const nat = { full: 90, cond: 70, chrome: 40 };
        menu._panelNeed = 600;

        // Bar fits with room to spare (available 360 ≥ 90), but the 600px panel
        // can't open within 480 − 16: fold to the drawer rather than crowd it.
        drive(menu, 480, nat);
        expect(root.classList.contains("nv-mode-mobile")).toBe(true);

        // Wide enough for the panel too (600 ≤ 700 − 16): back to the desktop bar.
        drive(menu, 700, nat);
        expect(root.classList.contains("nv-mode-desktop")).toBe(true);
    });

    it("ignores the matchMedia breakpoint (no static listener wired)", () => {
        const { root } = mount(sampleOptions({ responsive: "dynamic", breakpoint: 960 }));
        setWidth(0); // would force mobile under the static breakpoint
        // Dynamic mode never listens to matchMedia, so the bar stays as decided.
        expect(root.classList.contains("nv-mode-desktop")).toBe(true);
    });
});

describe("responsive: static condenseBreakpoint", () => {
    it("condenses between condenseBreakpoint and breakpoint, then collapses", () => {
        const { root } = mount(
            sampleOptions({ responsive: "static", breakpoint: 600, condenseBreakpoint: 900 })
        );

        setWidth(1000); // above both: full bar
        expect(root.classList.contains("nv-mode-desktop")).toBe(true);
        expect(root.classList.contains("nv-condensed")).toBe(false);

        setWidth(800); // ≤ 900, > 600: condensed desktop bar
        expect(root.classList.contains("nv-mode-desktop")).toBe(true);
        expect(root.classList.contains("nv-condensed")).toBe(true);

        setWidth(500); // ≤ 600: collapsed, condense dropped
        expect(root.classList.contains("nv-mode-mobile")).toBe(true);
        expect(root.classList.contains("nv-condensed")).toBe(false);
    });
});
