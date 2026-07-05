/**
 * Feature: `responsive: "static"` — classic breakpoint-driven collapsing via
 * matchMedia: collapse at `breakpoint`, optionally condense at
 * `condenseBreakpoint` first. No CSS chunk (the condensed-bar rules live in
 * the kernel stylesheet).
 */
import type { Navalone } from "../kernel/navalone";
import type { NavaloneFeature } from "../kernel/registry";

function applyStatic(nv: Navalone): void {
    const mobile = nv._mql.matches;
    // Condense only while still on the desktop bar and only between the two
    // thresholds (`condenseBreakpoint` must sit above `breakpoint`).
    const condensed = !mobile && !!nv._condenseMql && nv._condenseMql.matches;
    nv._setCondensed(condensed);
    nv._setMode(mobile ? "mobile" : "desktop");
}

export const responsiveStatic: NavaloneFeature = {
    id: "responsive-static",
    label: "Breakpoint (static) collapse",
    group: "responsive",
    description: "Collapse to the drawer at a fixed pixel breakpoint.",
    install() {
        return {
            responsive: {
                static: (nv) => {
                    nv._mql = window.matchMedia(
                        "(max-width: " + nv.options.breakpoint + "px)"
                    );
                    const onChange = () => applyStatic(nv);
                    nv._listen(nv._mql, "change", onChange);
                    const cb = nv.options.condenseBreakpoint;
                    if (cb != null) {
                        nv._condenseMql = window.matchMedia("(max-width: " + cb + "px)");
                        nv._listen(nv._condenseMql, "change", onChange);
                    }
                    applyStatic(nv);
                }
            }
        };
    }
};
