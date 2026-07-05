/**
 * Feature: `position: "smart"` — the auto-hide bar: hide when scrolling down
 * past it, reveal on any upward scroll. The transform is applied to the bar
 * (not the root) so the off-canvas drawer's fixed-positioning containing
 * block is never disturbed. Watches the nearest scroll container (window on a
 * normal page). CSS chunk: styles/position-smart.css.
 */
import type { Navalone } from "../kernel/navalone";
import type { NavaloneFeature } from "../kernel/registry";

/**
 * Nearest scrollable ancestor of `el`, or `window` when the page itself is the
 * scroller (the common case) — so the auto-hide works on a normal page AND
 * inside a scrolling container (e.g. the docs preview iframe).
 */
function findScrollParent(el: HTMLElement): HTMLElement | Window {
    let node: HTMLElement | null = el.parentElement;
    while (node && node !== document.body && node !== document.documentElement) {
        const oy = getComputedStyle(node).overflowY;
        if (oy === "auto" || oy === "scroll" || oy === "overlay") {
            return node;
        }
        node = node.parentElement;
    }
    return window;
}

/** Current vertical scroll offset of a `window`-or-element scroll source. */
function scrollTopOf(target: HTMLElement | Window): number {
    return target === window
        ? window.scrollY || document.documentElement.scrollTop || 0
        : (target as HTMLElement).scrollTop;
}

function updateSmart(nv: Navalone): void {
    // Never hide while the drawer is open (the hamburger lives in the bar).
    if (nv._drawerOpen) {
        nv.root.classList.remove("nv-hidden");
        return;
    }
    const y = Math.max(scrollTopOf(nv._smartScroller as HTMLElement | Window), 0);
    const last = nv._smartLastY;
    const barH = nv._bar ? nv._bar.offsetHeight : 0;
    if (y <= barH) {
        // At (or above) the bar's resting spot — always visible.
        nv.root.classList.remove("nv-hidden");
    } else if (y > last + 4) {
        nv.root.classList.add("nv-hidden"); // scrolling down
    } else if (y < last - 4) {
        nv.root.classList.remove("nv-hidden"); // scrolling up
    }
    nv._smartLastY = y;
}

export const positionSmart: NavaloneFeature = {
    id: "position-smart",
    label: "Smart auto-hide bar",
    group: "position",
    description: "Hide the bar on scroll-down, reveal it on scroll-up.",
    install() {
        return {
            positions: {
                smart: (nv) => {
                    nv._updateSmart = () => updateSmart(nv);
                    const scroller = findScrollParent(nv.root);
                    nv._smartScroller = scroller;
                    nv._smartLastY = scrollTopOf(scroller);
                    nv._listen(scroller, "scroll", () => {
                        if (nv._smartTicking) {
                            return;
                        }
                        nv._smartTicking = true;
                        window.requestAnimationFrame(() => {
                            nv._smartTicking = false;
                            if (!nv._destroyed) {
                                nv._updateSmart();
                            }
                        });
                    });
                }
            }
        };
    }
};
