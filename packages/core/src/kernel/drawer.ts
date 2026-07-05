/**
 * Off-canvas drawer kernel: the drawer chrome (head, close button, actions
 * footer), the open/close lifecycle, and the panel-host bookkeeping shared by
 * both mobile engines (animated `--mmHeight`, aria/inert hidden state, the
 * no-transition load-animation fix). The actual panel content and navigation
 * come from the registered drawer engine (`drilldown` or `accordion`).
 */
import type { Navalone } from "./navalone";
import { durationMs, uid } from "./dom";
import { buildActions, buildLogo } from "./render";
import { featureError, registry, type DrawerEngine } from "./registry";
import { focusPanel } from "./a11y";

/** The engine for this instance's `mobileMenu` option, or a clear error. */
export function drawerEngine(nv: Navalone): DrawerEngine {
    const mode = nv.options.mobileMenu || "drilldown";
    const engine = registry.drawers[mode];
    if (!engine) {
        throw featureError('mobileMenu "' + mode + '"', "drawer-" + mode);
    }
    return engine;
}

/* ------------------------------- Building -------------------------------- */

export function buildDrawer(nv: Navalone): HTMLElement {
    const drawer = document.createElement("aside");
    drawer.id = uid("nv-drawer");
    drawer.className = "nv-drawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-label", nv.options.drawerLabel || "Menu");
    drawer.tabIndex = -1;

    const head = document.createElement("div");
    head.className = "nv-drawer-head";
    const logo = buildLogo(nv, "nv-logo--drawer");
    if (logo) {
        head.appendChild(logo);
    }
    nv._drawerClose = document.createElement("button");
    nv._drawerClose.type = "button";
    nv._drawerClose.className = "nv-drawer-close";
    nv._drawerClose.setAttribute("aria-label", "Close menu");
    nv._drawerClose.innerHTML = "<span aria-hidden='true'>&times;</span>";
    head.appendChild(nv._drawerClose);
    drawer.appendChild(head);

    // The mobile menu container: the registered engine renders its panels into
    // it — the sliding drill-down levels, or the accordion's single panel.
    const engine = drawerEngine(nv);
    nv._panelHost = document.createElement("div");
    nv._panelHost.className = "nv-panels" + (engine.hostClass ? " " + engine.hostClass : "");
    nv._panelHost.id = uid("nv-panelhost");
    engine.render(nv).forEach((panel) => {
        nv._panelHost.appendChild(panel);
    });
    drawer.appendChild(nv._panelHost);

    const actions = buildActions(nv, "nv-actions nv-actions--drawer");
    if (actions) {
        drawer.appendChild(actions);
    }
    return drawer;
}

export function setupPanels(nv: Navalone): void {
    nv._panels = Array.from(nv._panelHost.querySelectorAll<HTMLElement>(".menu-level"));
    if (!nv._panels.length) {
        throw new Error("Navalone: no .menu-level panels found");
    }
    nv._panels.forEach((panel) => {
        if (!panel.id) {
            panel.id = uid("nv-panel");
        }
        panel.setAttribute("role", "menu");
        if (panel.dataset.title) {
            panel.setAttribute("aria-label", panel.dataset.title);
        }
        panel.querySelectorAll("ul").forEach((ul) => ul.setAttribute("role", "none"));
        panel.querySelectorAll("li").forEach((li) => {
            if (!li.getAttribute("role")) {
                li.setAttribute("role", "none");
            }
        });
    });
    nv._rootPanel = nv._panels[0];
    nv._stack = [nv._rootPanel.id];
}

// Preserve the load-animation behaviour EXACTLY: set the initial height with
// transitions suppressed (so the container does not animate from 0), measured
// after web fonts settle, then re-enable on a double requestAnimationFrame.
export function initHeight(nv: Navalone): void {
    nv._panelHost.classList.add("no-transition");
    nv._rootPanel.classList.add("active-menu");
    nv._panels.forEach((panel) => setHiddenState(panel, panel !== nv._rootPanel));

    const settle = () => {
        updateHeight(nv, nv._rootPanel);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (!nv._destroyed) {
                    nv._panelHost.classList.remove("no-transition");
                }
            });
        });
    };

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(settle);
    } else {
        settle();
    }
}

/* ----------------------------- Open / close ------------------------------ */

export function openDrawer(nv: Navalone): void {
    if (nv._drawerOpen) {
        return;
    }
    resetToRoot(nv);
    nv._drawerOpen = true;
    nv._lastFocus = document.activeElement as HTMLElement | null;
    nv._backdrop.hidden = false;
    nv.root.classList.add("nv-open");
    nv._drawer.setAttribute("aria-modal", "true");
    if (nv._mode === "mobile") {
        document.body.classList.add("nv-scroll-lock");
    }
    if (nv._hamburger) {
        nv._hamburger.setAttribute("aria-expanded", "true");
        nv._hamburger.setAttribute("aria-label", "Close menu");
    }
    updateHeight(nv, activePanel(nv) || nv._rootPanel);
    requestAnimationFrame(() => {
        if (!nv._destroyed && nv._drawerOpen) {
            focusPanel(nv._rootPanel);
        }
    });
    nv._emit("open", {});
}

export function closeDrawer(nv: Navalone): void {
    if (!nv._drawerOpen) {
        return;
    }
    nv._drawerOpen = false;
    nv.root.classList.remove("nv-open");
    document.body.classList.remove("nv-scroll-lock");
    if (nv._hamburger) {
        nv._hamburger.setAttribute("aria-expanded", "false");
        nv._hamburger.setAttribute("aria-label", "Open menu");
    }
    // Hide the backdrop after the slide-out transition completes.
    const dur = durationMs(nv.options.animationDuration);
    const backdrop = nv._backdrop;
    window.setTimeout(() => {
        if (!nv._destroyed && !nv._drawerOpen) {
            backdrop.hidden = true;
        }
    }, dur);
    if (nv._hamburger && nv._mode === "mobile") {
        nv._hamburger.focus();
    } else if (nv._lastFocus && nv._lastFocus.focus) {
        nv._lastFocus.focus();
    }
    nv._emit("close", {});
}

/* ------------------------------- Helpers --------------------------------- */

export function resetToRoot(nv: Navalone): void {
    drawerEngine(nv).reset(nv);
}

export function setActive(nv: Navalone, panel: HTMLElement): void {
    const previous = nv._panelHost.querySelector(".active-menu");
    if (previous) {
        previous.classList.remove("active-menu");
    }
    panel.classList.add("active-menu");
    nv._panels.forEach((p) => setHiddenState(p, p !== panel));
    // The panels slide purely via transform; the host must never carry a
    // horizontal scroll (a stray focus-into-view scroll would push the active
    // panel off-screen and blank the drawer body). A fresh panel also starts at
    // its top.
    nv._panelHost.scrollLeft = 0;
    nv._panelHost.scrollTop = 0;
    requestAnimationFrame(() => updateHeight(nv, panel));
}

export function setHiddenState(panel: HTMLElement, hidden: boolean): void {
    panel.setAttribute("aria-hidden", hidden ? "true" : "false");
    // `inert` keeps off-screen panels out of the tab order and pointer path;
    // harmless where unsupported.
    panel.inert = hidden;
}

export function updateHeight(nv: Navalone, panel: HTMLElement): void {
    // A queued rAF can fire after destroy(); don't re-mutate the DOM.
    if (nv._destroyed) {
        return;
    }
    nv._panelHost.style.setProperty("--mmHeight", panel.scrollHeight + "px");
}

export function remeasure(nv: Navalone): void {
    nv._panelHost.classList.add("no-transition");
    updateHeight(nv, activePanel(nv) || nv._rootPanel);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            if (!nv._destroyed) {
                nv._panelHost.classList.remove("no-transition");
            }
        });
    });
}

export function activePanel(nv: Navalone): HTMLElement | null {
    return nv._panelHost.querySelector<HTMLElement>(".active-menu");
}

export function panelById(nv: Navalone, id: string): HTMLElement | null {
    for (let i = 0; i < nv._panels.length; i++) {
        if (nv._panels[i].id === id) {
            return nv._panels[i];
        }
    }
    return null;
}
