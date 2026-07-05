/**
 * Feature: `responsive: "dynamic"` (the default) — content-aware collapsing.
 * The menu's natural width is measured against the space the bar can give it;
 * condense first, collapse second. Panel-aware: if the widest submenu panel
 * cannot open un-crowded, fold to the drawer even though the bar would fit.
 * No CSS chunk (the condensed-bar rules live in the kernel stylesheet).
 */
import type { Navalone } from "../kernel/navalone";
import type { NavaloneFeature, NavaloneKernelApi } from "../kernel/registry";

// Sum of the menubar items' widths plus the inter-item gaps — the menu's
// intrinsic width, independent of the track it is currently squeezed into
// (the items never wrap), so it is comparable across condensed/full states.
function menuNeed(nv: Navalone): number {
    const kids = nv._menubar.children;
    let width = 0;
    for (let i = 0; i < kids.length; i++) {
        width += (kids[i] as HTMLElement).getBoundingClientRect().width;
    }
    if (kids.length > 1) {
        const cs = getComputedStyle(nv._menubar);
        const gap = parseFloat(cs.columnGap || cs.gap || "0") || 0;
        width += gap * (kids.length - 1);
    }
    return width;
}

// Cache the menu's natural widths (full + condensed) and the chrome width.
// Toggles the condensed class to read both, then restores the prior state.
// No-op when the menubar is not measurable (collapsed/hidden).
function measureNaturals(api: NavaloneKernelApi, nv: Navalone): void {
    const bar = nv._bar;
    const menubar = nv._menubar;
    if (!bar.clientWidth || menubar.offsetParent === null) {
        return;
    }
    const wasCondensed = nv.root.classList.contains("nv-condensed");
    nv.root.classList.remove("nv-condensed");
    nv._natFull = menuNeed(nv);
    // chrome = everything that isn't the menu track (logo, buttons, the bar's
    // outer gaps and horizontal padding); stable across condense toggles since
    // condensing only tightens the menubar itself.
    nv._chrome = bar.clientWidth - menubar.clientWidth;
    nv.root.classList.add("nv-condensed");
    nv._natCond = menuNeed(nv);
    if (!wasCondensed) {
        nv.root.classList.remove("nv-condensed");
    }
    measurePanels(api, nv);
}

// Cache the widest top-level submenu panel's natural width — the width it
// wants laid out *un-crowded*. Panels are `visibility: hidden` (not
// `display: none`), so they are laid out and measurable while closed. We
// temporarily lift the panel's viewport cap — and let each registered feature
// widen its own layout (mega grids un-wrap, the e-commerce rail uncaps) — read
// the width, then restore everything within this synchronous pass (no paint in
// between). Only panels that open straight from the bar count; nested flyouts
// have their own narrow fall-back.
function measurePanels(api: NavaloneKernelApi, nv: Navalone): void {
    const panels = nv._menubar.querySelectorAll<HTMLElement>(".nv-bar-li > .nv-panel");
    let max = 0;
    panels.forEach((panel) => {
        const restore: Array<() => void> = [];
        // Save a single inline style property and queue its exact restoration.
        const set = (el: HTMLElement, prop: string, val: string) => {
            const prev = el.style.getPropertyValue(prop);
            el.style.setProperty(prop, val);
            restore.push(() =>
                prev ? el.style.setProperty(prop, prev) : el.style.removeProperty(prop)
            );
        };
        // Lift the panel's viewport cap so it can grow to its content width.
        set(panel, "max-width", "none");
        api.registry.measurers.forEach((measure) => measure(panel, set));
        max = Math.max(max, panel.getBoundingClientRect().width);
        restore.forEach((fn) => fn());
    });
    nv._panelNeed = max;
}

function applyDynamic(api: NavaloneKernelApi, nv: Navalone): void {
    const barWidth = nv._bar.clientWidth;
    if (!barWidth) {
        return; // not laid out yet (or hidden) — keep the current state
    }
    // Keep the cached natural widths fresh whenever the bar is measurable
    // (desktop mode); in mobile mode the menubar is hidden, so reuse the
    // last good measurement to decide whether there is room to expand.
    if (nv._mode === "desktop") {
        measureNaturals(api, nv);
    }
    const available = barWidth - nv._chrome;
    let mode: "mobile" | "desktop";
    let condensed: boolean;
    if (nv._natFull <= available) {
        mode = "desktop";
        condensed = false;
    } else if (nv._natCond <= available) {
        mode = "desktop";
        condensed = true;
    } else {
        mode = "mobile";
        condensed = false;
    }
    // Panel-aware collapse: the bar fitting is necessary but not sufficient.
    // A tiny bar (e.g. one "Categories" item) easily fits a narrow screen, yet
    // its submenu panel may be far wider — staying on the desktop bar would
    // only show that panel clamped and crowded. So if the widest panel can't
    // open at its natural width (within the same 16px viewport gutter the
    // panel CSS reserves), fold to the drawer instead, where the same content
    // drills down comfortably.
    if (mode === "desktop" && nv._panelNeed > barWidth - 16) {
        mode = "mobile";
        condensed = false;
    }
    nv._setCondensed(condensed);
    nv._setMode(mode);
}

export const responsiveDynamic: NavaloneFeature = {
    id: "responsive-dynamic",
    label: "Content-aware (dynamic) collapse",
    group: "responsive",
    description: "Measure the menu and collapse exactly when it would overlap.",
    install(api) {
        return {
            responsive: {
                dynamic: (nv) => {
                    nv._applyDynamic = () => applyDynamic(api, nv);
                    // Measure while the bar is in its pristine desktop layout
                    // (no mode class added yet, so the menubar is measurable).
                    measureNaturals(api, nv);
                    // Default to desktop, then let the first measurement pass
                    // refine it. In a layout-less environment (jsdom)
                    // measurement is 0 and we simply stay on the desktop bar —
                    // matching the previous default-desktop behaviour.
                    nv._mode = "desktop";
                    nv.root.classList.add("nv-mode-desktop");
                    nv._applyDynamic();

                    if (typeof ResizeObserver === "function") {
                        nv._ro = new ResizeObserver(() => {
                            if (nv._dynTicking) {
                                return;
                            }
                            nv._dynTicking = true;
                            window.requestAnimationFrame(() => {
                                nv._dynTicking = false;
                                if (!nv._destroyed) {
                                    nv._applyDynamic();
                                }
                            });
                        });
                        nv._ro.observe(nv._bar);
                    }
                    // Re-measure once web fonts settle (they change the menu's
                    // real width).
                    if (document.fonts && document.fonts.ready) {
                        document.fonts.ready.then(() => {
                            if (!nv._destroyed) {
                                nv._applyDynamic();
                            }
                        });
                    }
                }
            }
        };
    }
};
